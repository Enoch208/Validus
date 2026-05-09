#!/usr/bin/env node
/**
 * Validus HTTP server — wraps the Franklin plugin so it can be invoked from
 * a deployed Next.js dashboard (or any HTTP client).
 *
 * Routes:
 *   GET  /health    Liveness check
 *   GET  /receipts  Lists all receipts the plugin has written
 *   POST /review    Run a review for { prUrl, mode?, freeOnly?, perPayoutCapUsd? }
 *
 * Deployment:
 *   - Linux VPS with Node 20+
 *   - npm i -g @blockrun/franklin
 *   - Plugin linked into ~/.blockrun/plugins/validus
 *   - Run via systemd (see plugin/server/validus.service)
 *   - Reverse proxy through Caddy/nginx for HTTPS
 *
 * Env vars:
 *   PORT                Listen port (default 4000)
 *   VALIDUS_AUTH_TOKEN  Optional bearer token. If set, requests must include
 *                       `Authorization: Bearer <token>`.
 *   ALLOWED_ORIGIN      CORS Access-Control-Allow-Origin (default *)
 *   GITHUB_TOKEN        Optional — improves rate limits on GitHub API
 *   PAYOUT_PRIVATE_KEY  Required only for mode=testnet|mainnet
 */

import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { runPlugin } from "./run-plugin.mjs";
import { getReceiptsDir } from "../src/receipt.js";
import {
  parsePrUrl,
  fetchPullRequest,
} from "../src/github.js";

const PORT = Number(process.env.PORT ?? 4000);
const AUTH_TOKEN = process.env.VALIDUS_AUTH_TOKEN || null;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// Serialize requests — only one franklin run at a time. Franklin's workflow
// config is a shared file, so concurrent invocations would clobber each other.
let queueTail = Promise.resolve();
function serialize(fn) {
  const next = queueTail.then(fn, fn);
  queueTail = next.catch(() => {});
  return next;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "600");
}

function jsonReply(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req, maxBytes = 16 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(Object.assign(new Error("payload too large"), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("error", reject);
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch {
        reject(Object.assign(new Error("invalid JSON body"), { status: 400 }));
      }
    });
  });
}

function authOk(req) {
  if (!AUTH_TOKEN) return true;
  const got = req.headers["authorization"];
  return got === `Bearer ${AUTH_TOKEN}`;
}

/**
 * Map low-level GitHub fetch errors into friendly user-visible messages.
 */
function mapGitHubError(err, prRef) {
  const message = err.message ?? "";
  if (/\b404\b/.test(message)) {
    return {
      status: 404,
      body: {
        error: "pr_not_found",
        message:
          `Couldn't find ${prRef.owner}/${prRef.repo}#${prRef.number}. ` +
          `Double-check the URL — is the repo public and the PR number right?`,
      },
    };
  }
  if (/\b403\b/.test(message)) {
    return {
      status: 403,
      body: {
        error: "repo_private_or_rate_limited",
        message:
          `${prRef.owner}/${prRef.repo} is private or you've hit the GitHub rate limit. ` +
          `Validus needs read access — set GITHUB_TOKEN on the server, or make the repo public.`,
      },
    };
  }
  if (/\b401\b/.test(message)) {
    return {
      status: 401,
      body: {
        error: "github_auth",
        message:
          "GitHub authentication failed. Check the GITHUB_TOKEN env var on the server.",
      },
    };
  }
  return {
    status: 502,
    body: {
      error: "github_error",
      message: "Couldn't reach GitHub. Try again in a minute.",
      detail: message.slice(0, 200),
    },
  };
}

// ─── Handlers ───────────────────────────────────────────────────────────

async function handleReview(req, res) {
  if (!authOk(req)) return jsonReply(res, 401, { error: "unauthorized" });

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return jsonReply(res, err.status ?? 400, {
      error: "bad_request",
      message: err.message,
    });
  }

  const { prUrl, mode = "dry-run", freeOnly = true, perPayoutCapUsd = 5 } = body;

  if (!prUrl || typeof prUrl !== "string") {
    return jsonReply(res, 400, {
      error: "pr_url_required",
      message: "Please provide a GitHub PR URL.",
    });
  }

  if (!["dry-run", "testnet", "mainnet"].includes(mode)) {
    return jsonReply(res, 400, {
      error: "bad_mode",
      message: "Mode must be one of: dry-run, testnet, mainnet.",
    });
  }

  // Validate URL shape early
  let prRef;
  try {
    prRef = parsePrUrl(prUrl);
  } catch {
    return jsonReply(res, 400, {
      error: "bad_url",
      message:
        "That doesn't look like a GitHub PR URL. " +
        "Try something like https://github.com/owner/repo/pull/42",
    });
  }

  // Pre-flight: confirm the repo + PR are reachable BEFORE spawning Franklin.
  // Lets us return a friendly error immediately instead of after a 20-second run.
  try {
    await fetchPullRequest(prUrl);
  } catch (err) {
    const mapped = mapGitHubError(err, prRef);
    return jsonReply(res, mapped.status, mapped.body);
  }

  // Run the workflow (serialized — see top of file)
  try {
    const { receipt, stdout } = await serialize(() =>
      runPlugin({ prUrl, prRef, mode, freeOnly, perPayoutCapUsd })
    );
    return jsonReply(res, 200, {
      receipt,
      meta: { mode, freeOnly, durationMs: Date.now() - startedAt(req) },
      log: tailLines(stdout, 30),
    });
  } catch (err) {
    if (err.kind === "plugin_failed") {
      return jsonReply(res, 500, {
        error: "plugin_failed",
        message:
          "The review pipeline errored mid-run. Check the server logs for stderr.",
        detail: err.detail,
      });
    }
    if (err.kind === "no_receipt") {
      return jsonReply(res, 500, {
        error: "no_receipt_emitted",
        message:
          "Pipeline completed but didn't emit a receipt. This usually means the workflow aborted before reaching the payout step.",
      });
    }
    return jsonReply(res, 500, {
      error: "internal",
      message: "Unexpected error.",
      detail: err.message,
    });
  }
}

const startTimes = new WeakMap();
function startedAt(req) {
  return startTimes.get(req) ?? Date.now();
}

function tailLines(s, n) {
  return s.split("\n").slice(-n).join("\n");
}

// ─── /receipts handler ─────────────────────────────────────────────────

async function handleReceipts(req, res) {
  if (!authOk(req)) return jsonReply(res, 401, { error: "unauthorized" });

  const dir = getReceiptsDir();
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      return jsonReply(res, 200, { receipts: [], source: "remote-empty" });
    }
    return jsonReply(res, 500, {
      error: "fs_error",
      message: "Couldn't read the receipts directory.",
      detail: err.message,
    });
  }

  const jsonFiles = entries.filter((f) => f.endsWith(".json"));
  const receipts = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), "utf-8");
      return JSON.parse(raw);
    })
  );
  // Newest first
  receipts.sort((a, b) =>
    String(b.completedAt).localeCompare(String(a.completedAt))
  );

  return jsonReply(res, 200, { receipts, source: "remote" });
}

// ─── Server ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  startTimes.set(req, Date.now());
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === "GET" && req.url === "/health") {
    return jsonReply(res, 200, { ok: true, version: "0.1.0" });
  }

  if (req.method === "GET" && req.url === "/receipts") {
    return handleReceipts(req, res);
  }

  if (req.method === "POST" && req.url === "/review") {
    return handleReview(req, res);
  }

  jsonReply(res, 404, { error: "not_found" });
});

server.listen(PORT, () => {
  console.log(`Validus server listening on :${PORT}`);
  console.log(`  Auth:   ${AUTH_TOKEN ? "Bearer token required" : "OPEN — no auth"}`);
  console.log(`  CORS:   ${ALLOWED_ORIGIN}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\n${sig} received — shutting down`);
    server.close(() => process.exit(0));
  });
}
