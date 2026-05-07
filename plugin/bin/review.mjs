#!/usr/bin/env node
/**
 * One-line wrapper: review a single PR without writing config files.
 *
 * Usage:
 *   node bin/review.mjs --pr <github-pr-url> [--mode dry-run|testnet|mainnet] [--free-only]
 *
 * Or via npm script:
 *   npm run review -- --pr https://github.com/foo/bar/pull/42
 *
 * What it does:
 *   1. Parses CLI flags
 *   2. Writes/updates ~/.blockrun/workflows/review-pr.config.json
 *   3. Spawns `franklin validus run --dry` (or without --dry for non-dry modes)
 *   4. Streams stdout/stderr through; exits with the same code
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr") flags.pr = argv[++i];
    else if (a === "--mode") flags.mode = argv[++i];
    else if (a === "--free-only") flags.freeOnly = true;
    else if (a === "--cap") flags.cap = Number(argv[++i]);
    else if (a === "--help" || a === "-h") flags.help = true;
  }
  return flags;
}

const flags = parseFlags(args);

if (flags.help || !flags.pr) {
  console.log(`
Validus — review a single PR

Usage:
  npm run review -- --pr <github-pr-url> [options]

Options:
  --pr <url>          GitHub PR URL (required)
  --mode <mode>       dry-run | testnet | mainnet  [default: dry-run]
  --free-only         Force every tier → free (zero x402 spend)
  --cap <usd>         Per-payout cap in USD  [default: 5]

Examples:
  npm run review -- --pr https://github.com/foo/bar/pull/42 --free-only
  npm run review -- --pr https://github.com/foo/bar/pull/42 --mode testnet
`);
  process.exit(flags.help ? 0 : 1);
}

const mode = flags.mode ?? "dry-run";
if (!["dry-run", "testnet", "mainnet"].includes(mode)) {
  console.error(`Invalid --mode: ${mode}. Use dry-run | testnet | mainnet.`);
  process.exit(1);
}

const configPath = path.join(
  os.homedir(),
  ".blockrun",
  "workflows",
  "review-pr.config.json"
);

const config = {
  name: "review-pr",
  models: {
    free: "nvidia/qwen3-coder-480b",
    cheap: "nvidia/qwen3-coder-480b",
    premium: "anthropic/claude-sonnet-4.6",
  },
  payoutMode: mode,
  perPayoutCapUsd: flags.cap ?? 5,
  prUrl: flags.pr,
  freeOnly: !!flags.freeOnly,
};

await fs.mkdir(path.dirname(configPath), { recursive: true });
await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
console.log(`✓ Config written: ${configPath}`);
console.log(`  PR:        ${config.prUrl}`);
console.log(`  Mode:      ${config.payoutMode}${config.freeOnly ? " (free-only)" : ""}`);
console.log(`  Cap:       $${config.perPayoutCapUsd}`);
console.log();

// Find the franklin binary (prefer local install, fall back to PATH)
const localBin = path.resolve("./node_modules/.bin/franklin");
let franklinCmd = "franklin";
try {
  await fs.access(localBin, fs.constants.X_OK);
  franklinCmd = localBin;
} catch {
  // Use global franklin from PATH
}

const franklinArgs = ["validus", "run"];
if (mode === "dry-run") franklinArgs.push("--dry");

const proc = spawn(franklinCmd, franklinArgs, {
  stdio: "inherit",
  env: process.env,
});

proc.on("exit", (code) => process.exit(code ?? 0));
proc.on("error", (err) => {
  console.error("Failed to spawn franklin:", err.message);
  console.error(
    "Make sure Franklin is installed: npm install -g @blockrun/franklin"
  );
  process.exit(1);
});
