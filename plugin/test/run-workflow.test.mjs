/**
 * Standalone test harness — runs the Validus workflow against a stubbed
 * WorkflowStepContext. Verifies:
 *   1. Plugin manifest loads
 *   2. Workflow instantiates with all expected steps
 *   3. Steps execute in order, accumulating costs and stage data
 *   4. The receipt JSON written to disk matches the BountyReceipt schema
 *   5. Three scenarios: clean approval (dry-run), spam rejection, ambiguity escalation
 *
 * Doesn't depend on Franklin being installed — it directly imports the
 * workflow factory and feeds it a hand-rolled context. This is the cheapest
 * way to validate the plugin contract before connecting to the real runtime.
 */

import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import plugin from "../index.js";
import { getReceiptsDir } from "../src/receipt.js";

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

let passed = 0;
let failed = 0;

function ok(msg) {
  passed++;
  console.log(`  ${COLORS.green}✓${COLORS.reset} ${msg}`);
}
function fail(msg, err) {
  failed++;
  console.log(`  ${COLORS.red}✗${COLORS.reset} ${msg}`);
  if (err) console.log(`    ${COLORS.dim}${err.stack || err}${COLORS.reset}`);
}

/**
 * Build a fake WorkflowStepContext.
 * @param {Object} options
 * @param {Object} options.config       merged with workflow.defaultConfig()
 * @param {Object} options.modelResponses map of tier → string returned by callModel
 */
function makeContext({ config, modelResponses = {} }) {
  const calls = [];
  return {
    data: { startedAt: new Date().toISOString() },
    config,
    dryRun: config.payoutMode === "dry-run",
    callModel: async (tier, prompt, system) => {
      calls.push({ tier, prompt: prompt.slice(0, 60) });
      const fixture = modelResponses[tier];
      if (fixture === undefined) {
        throw new Error(`No model fixture for tier '${tier}'`);
      }
      return typeof fixture === "function" ? fixture(prompt) : fixture;
    },
    search: async () => [],
    log: () => {}, // silence
    track: async () => {},
    isDuplicate: async () => false,
    _calls: calls, // expose for assertions
  };
}

/**
 * Drive the workflow's steps through ctx like Franklin's runner would.
 * Returns the steps array and final ctx.data.
 */
async function drive(workflow, ctx) {
  const stepResults = [];
  for (const step of workflow.steps) {
    const result = await step.execute(ctx);
    stepResults.push({ name: step.name, ...result });
    if (result.abort) break;
  }
  return { stepResults, ctx };
}

async function loadReceipt(prId) {
  const dir = getReceiptsDir();
  const filename = `${prId.replace(/[\/#]/g, "_")}.json`;
  const file = path.join(dir, filename);
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

// -------- Setup -------------------------------------------------

const TMP_RECEIPTS = path.join(os.tmpdir(), "validus-test-receipts-" + Date.now());
process.env.VALIDUS_RECEIPTS_DIR = TMP_RECEIPTS;

console.log(`\nValidus plugin tests`);
console.log(`Receipts → ${TMP_RECEIPTS}\n`);

// -------- Test 1: manifest + plugin shape ---------------------

console.log("Plugin contract");
try {
  assert.equal(plugin.manifest.id, "validus");
  ok("manifest.id === 'validus'");
  assert.equal(plugin.manifest.entry, "index.js");
  ok("manifest.entry points to index.js");
  assert.deepEqual(plugin.manifest.provides.workflows, ["review-pr"]);
  ok("manifest declares review-pr workflow");
  assert.equal(typeof plugin.workflows["review-pr"], "function");
  ok("workflows['review-pr'] is a factory function");
} catch (e) { fail("manifest assertions", e); }

// -------- Test 2: workflow instantiation ----------------------

console.log("\nWorkflow shape");
try {
  const wf = plugin.workflows["review-pr"]();
  assert.equal(wf.id, "review-pr");
  ok("workflow.id === 'review-pr'");
  assert.equal(wf.steps.length, 6);
  ok(`workflow has ${wf.steps.length} steps`);
  const expected = ["classify", "scope", "tests", "review", "escalate", "payout"];
  assert.deepEqual(wf.steps.map((s) => s.name), expected);
  ok("step order: " + expected.join(" → "));
  const tiers = wf.steps.map((s) => s.modelTier);
  for (const t of tiers) {
    assert.ok(["free", "cheap", "premium", "none"].includes(t), `bad tier ${t}`);
  }
  ok("every step uses a valid Franklin tier");
} catch (e) { fail("workflow shape", e); }

// -------- Test 3: clean approval, dry-run ---------------------

console.log("\nScenario A — clean PR, dry-run payout");
try {
  const wf = plugin.workflows["review-pr"]();
  const config = {
    ...wf.defaultConfig(),
    payoutMode: "dry-run",
    pr: {
      repo: "validus-test/repo",
      number: 42,
      url: "https://github.com/validus-test/repo/pull/42",
      title: "Add CSV export endpoint",
      bountyUsd: 5,
      diffStats: { changes: 87, summary: "+87 -3, scoped to /reports route" },
      issue: "feat: support CSV export of /reports",
    },
    contributor: {
      address: "0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f",
      githubUser: "alice-dev",
    },
  };
  const ctx = makeContext({
    config,
    modelResponses: {
      free: "bounty-claim",
      cheap: (p) => (p.includes("scope") ? "YES — diff matches issue" : "CLEAN — looks good"),
    },
  });
  const { stepResults } = await drive(wf, ctx);
  assert.equal(ctx.data.verdict, "approved", "expected approved verdict");
  ok("verdict = approved");
  assert.equal(stepResults.length, 6, "all 6 steps ran");
  ok("all 6 steps ran (escalate skipped, payout dry-run)");

  const receipt = await loadReceipt("validus-test/repo#42");
  assert.equal(receipt.verdict, "approved");
  assert.equal(receipt.payout.mode, "dry-run");
  assert.equal(receipt.payout.amount, "5.00");
  assert.equal(receipt.payout.token, "USDC");
  assert.ok(!receipt.payout.txHash, "dry-run should have no txHash");
  ok("receipt written, payout.mode = dry-run, no txHash");
  assert.ok(receipt.totalCost > 0 && receipt.totalCost < 1, "totalCost in expected range");
  ok(`totalCost = $${receipt.totalCost.toFixed(4)}`);
  assert.ok(receipt.savingsVsOpus > 0.95, "savingsVsOpus should be > 95% for cheap reviews");
  ok(`savingsVsOpus = ${(receipt.savingsVsOpus * 100).toFixed(1)}%`);
} catch (e) { fail("clean PR scenario", e); }

// -------- Test 4: spam rejection (free tier short-circuits) ----

console.log("\nScenario B — spam PR rejected at free tier");
try {
  const wf = plugin.workflows["review-pr"]();
  const config = {
    ...wf.defaultConfig(),
    pr: {
      repo: "validus-test/repo",
      number: 99,
      url: "https://github.com/validus-test/repo/pull/99",
      title: "spammy typo fix",
      bountyUsd: 5,
    },
    contributor: { address: "0xdead0000000000000000000000000000beef" },
  };
  const ctx = makeContext({ config, modelResponses: { free: "spam" } });
  const { stepResults } = await drive(wf, ctx);
  assert.equal(ctx.data.verdict, "rejected");
  ok("verdict = rejected after step 1");
  assert.equal(stepResults.length, 1, "only step 1 ran");
  ok("workflow short-circuited after classify");

  const receipt = await loadReceipt("validus-test/repo#99");
  assert.equal(receipt.verdict, "rejected");
  assert.equal(receipt.stages.length, 1);
  ok("receipt has 1 stage and no payout");
  assert.ok(!receipt.payout, "no payout block on rejection");
} catch (e) { fail("spam scenario", e); }

// -------- Test 5: ambiguity → premium escalation ----------------

console.log("\nScenario C — auto flags ambiguity, premium approves");
try {
  const wf = plugin.workflows["review-pr"]();
  const config = {
    ...wf.defaultConfig(),
    pr: {
      repo: "validus-test/repo",
      number: 138,
      url: "https://github.com/validus-test/repo/pull/138",
      title: "Refactor reports module",
      bountyUsd: 5,
      diffStats: { changes: 312, summary: "+312 -180, touches 8 files" },
    },
    contributor: { address: "0x4a8C13bE5DfA0987EabC4B2f0098f4e3c2d77a91" },
  };
  const ctx = makeContext({
    config,
    modelResponses: {
      free: "feature",
      cheap: (p) => (p.includes("scope") ? "YES" : "AMBIGUOUS — large diff"),
      premium: "APPROVE — refactor is clean",
    },
  });
  const { stepResults } = await drive(wf, ctx);
  assert.equal(ctx.data.verdict, "approved");
  ok("verdict = approved (after escalation)");
  const escalateStep = stepResults.find((s) => s.name === "escalate");
  assert.ok(escalateStep && escalateStep.cost > 0, "escalate step ran with cost");
  ok(`escalate step cost = $${escalateStep.cost}`);
  const receipt = await loadReceipt("validus-test/repo#138");
  assert.equal(receipt.stages.length, 5, "5 stages including premium");
  ok("receipt records all 5 stages including premium");
  assert.ok(receipt.totalCost > 0.05, "totalCost reflects premium cost");
  ok(`totalCost = $${receipt.totalCost.toFixed(4)} (includes premium)`);
} catch (e) { fail("escalation scenario", e); }

// -------- Test 6: GitHub fetcher (parser + fetcher with mock fetch) ----

console.log("\nGitHub fetcher");
try {
  const { parsePrUrl, fetchPullRequest, fetchCheckStatus } = await import(
    "../src/github.js"
  );

  // parsePrUrl
  const a = parsePrUrl("https://github.com/owner/repo/pull/142");
  assert.deepEqual(a, { owner: "owner", repo: "repo", number: 142 });
  ok("parsePrUrl handles full GitHub URLs");

  const b = parsePrUrl("owner/repo#142");
  assert.deepEqual(b, { owner: "owner", repo: "repo", number: 142 });
  ok("parsePrUrl handles owner/repo#N shorthand");

  assert.throws(() => parsePrUrl("not-a-url"), /Not a GitHub PR URL/);
  ok("parsePrUrl throws on bad input");

  // fetchPullRequest with mock fetcher
  const mockFetch = async (path) => {
    if (path.endsWith("/pulls/142")) {
      return {
        title: "Add CSV export",
        body: "fixes #99",
        html_url: "https://github.com/o/r/pull/142",
        head: { sha: "deadbeef" },
        additions: 87,
        deletions: 3,
        changed_files: 4,
        user: { login: "alice-dev" },
        state: "open",
        merged: false,
      };
    }
    if (path.endsWith("/issues/99")) {
      return { title: "feat: CSV export", number: 99 };
    }
    throw new Error("unexpected path: " + path);
  };
  const pr = await fetchPullRequest(
    "https://github.com/o/r/pull/142",
    { fetchImpl: mockFetch }
  );
  assert.equal(pr.repo, "o/r");
  assert.equal(pr.number, 142);
  assert.equal(pr.diffStats.changes, 90);
  assert.equal(pr.headSha, "deadbeef");
  assert.ok(pr.issue?.includes("feat: CSV export"));
  ok("fetchPullRequest returns the workflow's expected pr shape");

  // fetchCheckStatus with mock
  const mockChecks = async () => ({
    check_runs: [
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
    ],
  });
  const status = await fetchCheckStatus("o/r", "deadbeef", { fetchImpl: mockChecks });
  assert.equal(status.passed, true);
  assert.equal(status.succeeded, 3);
  assert.equal(status.failed, 0);
  ok("fetchCheckStatus reports passed when all check-runs succeed");

  const mockFailed = async () => ({
    check_runs: [
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "failure" },
    ],
  });
  const failed = await fetchCheckStatus("o/r", "x", { fetchImpl: mockFailed });
  assert.equal(failed.passed, false);
  assert.equal(failed.failed, 1);
  ok("fetchCheckStatus reports passed=false on any failure");
} catch (e) { fail("github fetcher", e); }

// -------- Test 7: payout layer — dry-run shape ------------------

console.log("\nPayout layer (dry-run only — no chain interaction)");
try {
  const { signPayout } = await import("../src/payout.js");
  const result = await signPayout({
    mode: "dry-run",
    to: "0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f",
    amountUsd: "5.00",
  });
  assert.equal(result.mode, "dry-run");
  assert.equal(result.amount, "5.00");
  assert.ok(!result.txHash, "dry-run returns no txHash");
  ok("signPayout dry-run returns correct shape");

  // Mainnet hard cap
  await assert.rejects(
    () =>
      signPayout({
        mode: "mainnet",
        to: "0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f",
        amountUsd: "10.00",
        privateKey: "0x" + "00".repeat(32),
      }),
    /exceeds hard cap/
  );
  ok("mainnet hard cap rejects amounts over $5");
} catch (e) { fail("payout layer", e); }

// -------- Cleanup -----------------------------------------------

console.log("");
if (failed === 0) {
  console.log(`${COLORS.green}All ${passed} assertions passed.${COLORS.reset}`);
  console.log(
    `\n${COLORS.dim}Receipts written to ${TMP_RECEIPTS} — inspect with:` +
      `\n  ls ${TMP_RECEIPTS}\n  jq . ${TMP_RECEIPTS}/*.json${COLORS.reset}\n`
  );
  process.exit(0);
} else {
  console.log(
    `${COLORS.red}${failed} failed${COLORS.reset}, ${COLORS.green}${passed} passed${COLORS.reset}`
  );
  process.exit(1);
}
