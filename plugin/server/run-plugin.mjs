/**
 * Spawns `franklin validus run` and returns the resulting receipt JSON.
 *
 * Strategy:
 *   1. Write the workflow config to ~/.blockrun/workflows/review-pr.config.json
 *      (Franklin reads it on each run, so per-request config is fine).
 *   2. Spawn `franklin validus run [--dry]`.
 *   3. On success, read the receipt file from ~/.blockrun/validus/receipts/.
 *
 * Concurrency note: Franklin's workflow config file is shared across runs, so
 * concurrent reviews would clobber each other. The server serializes requests
 * via a simple in-memory queue (see ../server/index.mjs).
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();
const CONFIG_PATH = path.join(HOME, ".blockrun", "workflows", "review-pr.config.json");
const RECEIPTS_DIR = path.join(HOME, ".blockrun", "validus", "receipts");

const DEFAULT_MODELS = {
  free: "nvidia/qwen3-coder-480b",
  cheap: "nvidia/qwen3-coder-480b",
  premium: "anthropic/claude-sonnet-4.6",
};

function receiptPathFor(prRef) {
  // Same scheme as plugin/src/receipt.js
  const id = `${prRef.owner}/${prRef.repo}#${prRef.number}`;
  const filename = `${id.replace(/[\/#]/g, "_")}.json`;
  return path.join(RECEIPTS_DIR, filename);
}

/**
 * @param {Object} args
 * @param {string} args.prUrl
 * @param {{ owner: string, repo: string, number: number }} args.prRef
 * @param {'dry-run'|'testnet'|'mainnet'} [args.mode]
 * @param {boolean} [args.freeOnly]
 * @param {number} [args.perPayoutCapUsd]
 * @param {string} [args.franklinBin]  Override the franklin binary path
 * @returns {Promise<{ receipt: object, stdout: string, stderr: string }>}
 */
export async function runPlugin({
  prUrl,
  prRef,
  mode = "dry-run",
  freeOnly = true,
  perPayoutCapUsd = 5,
  franklinBin = "franklin",
}) {
  const config = {
    name: "review-pr",
    models: DEFAULT_MODELS,
    payoutMode: mode,
    perPayoutCapUsd,
    prUrl,
    freeOnly,
  };

  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

  const args = ["validus", "run"];
  if (mode === "dry-run") args.push("--dry");

  const stdoutChunks = [];
  const stderrChunks = [];

  const exitCode = await new Promise((resolve, reject) => {
    const proc = spawn(franklinBin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });
    proc.stdout.on("data", (d) => stdoutChunks.push(d));
    proc.stderr.on("data", (d) => stderrChunks.push(d));
    proc.on("error", reject);
    proc.on("exit", resolve);
  });

  const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
  const stderr = Buffer.concat(stderrChunks).toString("utf-8");

  if (exitCode !== 0) {
    const tail = (stderr || stdout).split("\n").slice(-10).join("\n");
    throw Object.assign(new Error(`franklin exited with code ${exitCode}`), {
      kind: "plugin_failed",
      detail: tail,
      stdout,
      stderr,
    });
  }

  // Read the receipt file the workflow wrote
  const receiptPath = receiptPathFor(prRef);
  let receipt;
  try {
    receipt = JSON.parse(await fs.readFile(receiptPath, "utf-8"));
  } catch (err) {
    throw Object.assign(new Error("Receipt file not found after run"), {
      kind: "no_receipt",
      receiptPath,
      cause: err,
      stdout,
      stderr,
    });
  }

  return { receipt, stdout, stderr };
}
