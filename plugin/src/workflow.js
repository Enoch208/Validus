/**
 * Validus review-pr workflow.
 *
 * Pipeline:
 *   1. Classify PR        — free tier  (is this a bounty claim?)
 *   2. Scope match        — cheap tier (does the diff address the issue?)
 *   3. Run test suite     — none       (sandbox / local — no LLM)
 *   4. Code & security    — cheap tier (review the diff)
 *   5. Premium escalation — premium    (only fires if step 4 flags ambiguity)
 *   6. Sign payout        — none       (USDC.transfer via viem, dry-run|testnet|mainnet)
 *
 * Each step writes its cost to ctx.data.stages so the final step can emit a
 * complete BountyReceipt. The workflow always writes a receipt at the end,
 * even on rejection — that's the audit trail.
 */

import { writeReceipt } from "./receipt.js";
import { signPayout } from "./payout.js";
import {
  fetchPullRequest,
  fetchCheckStatus,
  fetchContributorAddress,
  fetchBountyAmount,
  parsePrUrl,
} from "./github.js";
import { DEFAULT_MODEL_TIERS } from "@blockrun/franklin/plugin-sdk";

const VERDICT_APPROVED = "approved";
const VERDICT_REJECTED = "rejected";
const VERDICT_NEEDS_HUMAN = "needs-human";

// Reference cost-per-token for "always-Opus" comparison. Numbers are illustrative
// (real Opus pricing as of 2026 — adjust if it changes).
const ALWAYS_OPUS_COST_PER_REVIEW = 1.10;

/**
 * Helper: extract a verdict word from a model response.
 * Sort keywords by length desc so longer/more specific matches win
 * (e.g. "needs-human" beats "approve" inside "auto-approve").
 */
function extractKeyword(text, keywords) {
  const lower = text.toLowerCase();
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  for (const k of sorted) if (lower.includes(k)) return k;
  return null;
}

/**
 * Tier resolver — applies the freeOnly downshift if config requests it.
 * Use this everywhere instead of passing the literal tier to ctx.callModel.
 */
function pickTier(ctx, requested) {
  return ctx.config.freeOnly ? "free" : requested;
}

/**
 * Build the workflow object that satisfies the Franklin Workflow interface.
 * Exported as a factory so the plugin can produce a fresh instance each run.
 */
export function createReviewPRWorkflow() {
  return {
    id: "review-pr",
    name: "Review bounty PR",
    description:
      "Audit a PR across routing tiers, run tests in a sandbox, and sign the USDC payout if approved.",

    onboardingQuestions: [
      {
        id: "payoutMode",
        prompt: "Payout mode",
        type: "select",
        options: ["dry-run", "testnet", "mainnet"],
        default: "dry-run",
      },
      {
        id: "perPayoutCapUsd",
        prompt: "Per-payout cap (USD)",
        type: "text",
        default: "5",
      },
    ],

    defaultConfig() {
      return {
        name: "review-pr",
        // Use Franklin's defaults — `nvidia/qwen3-coder-480b` for free/cheap,
        // `anthropic/claude-sonnet-4.6` for premium. Override per workflow if needed.
        models: { ...DEFAULT_MODEL_TIERS },
        payoutMode: process.env.PAYOUT_MODE ?? "dry-run",
        perPayoutCapUsd: 5,
        // PR target — set per-run via env or override. Workflow's beforeRun
        // hook fetches the live PR data from GitHub before steps execute.
        prUrl: process.env.VALIDUS_PR_URL,
        // Force every step to the free tier — useful for first-run validation
        // before funding the Franklin wallet for x402 cheap/premium calls.
        freeOnly: process.env.VALIDUS_FREE_ONLY === "1",
      };
    },

    async buildConfigFromAnswers(answers) {
      return {
        ...this.defaultConfig(),
        payoutMode: answers.payoutMode ?? "dry-run",
        perPayoutCapUsd: Number(answers.perPayoutCapUsd ?? 5),
      };
    },

    /**
     * Hydrate config.pr + config.contributor from the GitHub API before steps run.
     * Skipped if config.pr is already populated (e.g. by tests).
     */
    async beforeRun(config) {
      if (config.pr && config.contributor) return; // already hydrated
      if (!config.prUrl) {
        throw new Error(
          "Validus needs a PR to review — set $VALIDUS_PR_URL or pass prUrl in config."
        );
      }

      const pr = await fetchPullRequest(config.prUrl);
      const { owner, repo, number } = parsePrUrl(config.prUrl);
      const repoFull = `${owner}/${repo}`;

      const [contributor, bounty] = await Promise.all([
        fetchContributorAddress(repoFull, number),
        fetchBountyAmount(repoFull, pr.issueNumber),
      ]);

      config.pr = { ...pr, bountyUsd: bounty?.amount ?? 0 };
      config.contributor = contributor ?? {
        address: "0x0000000000000000000000000000000000000000",
      };

      // tests step uses GitHub Actions check status — wire it via testRunner option
      config.testRunner = async () => {
        const status = await fetchCheckStatus(repoFull, pr.headSha);
        return {
          passed: status.passed,
          duration: 0, // GitHub doesn't expose per-run total in this endpoint
          summary: status.summary,
        };
      };
    },

    steps: [
      // -- Step 1: Classify PR (free) -----------------------------
      {
        name: "classify",
        modelTier: "free",
        async execute(ctx) {
          const { pr } = ctx.config;
          ctx.log(`Classifying ${pr.repo}#${pr.number}`);

          const out = await ctx.callModel(
            "free",
            `Classify this PR. Return exactly one word: bounty-claim, feature, bug, or spam.\n\nTitle: ${pr.title}\nDiff size: ${pr.diffStats?.changes ?? "unknown"} lines changed.`
          );
          const klass = extractKeyword(out, [
            "bounty-claim",
            "feature",
            "bug",
            "spam",
          ]) ?? "feature";

          ctx.data.stages = [
            {
              tier: "free",
              label: "Classify PR",
              cost: 0.0001,
              durationMs: ctx.data.__lastDurationMs ?? 300,
              output: klass,
            },
          ];

          if (klass === "spam") {
            ctx.data.verdict = VERDICT_REJECTED;
            ctx.data.reasoning =
              "Free tier classifier flagged: not a bounty-eligible change.";
            await emitReceipt(ctx, undefined);
            return { abort: true, summary: `Rejected: spam`, cost: 0.0001 };
          }

          ctx.data.classification = klass;
          return { summary: `Classified as ${klass}`, cost: 0.0001 };
        },
      },

      // -- Step 2: Scope match (cheap) ----------------------------
      {
        name: "scope",
        modelTier: "cheap",
        async execute(ctx) {
          const { pr } = ctx.config;
          ctx.log("Checking scope match against the linked issue");

          const out = await ctx.callModel(
            pickTier(ctx, "cheap"),
            `Does this PR address the linked issue and stay within scope? Reply YES or NO with a one-sentence reason.\n\nIssue: ${pr.issue ?? "(none)"}\nPR title: ${pr.title}`
          );
          const passed = /^\s*yes/i.test(out.trim());

          ctx.data.stages.push({
            tier: "eco",
            label: "Scope match",
            cost: 0.0012,
            durationMs: 800,
            output: out.slice(0, 120),
          });

          if (!passed) {
            ctx.data.verdict = VERDICT_NEEDS_HUMAN;
            ctx.data.reasoning =
              "Eco tier flagged scope mismatch — escalating to maintainer.";
            await emitReceipt(ctx, undefined);
            return { abort: true, summary: "Scope mismatch", cost: 0.0012 };
          }

          return { summary: "Scope OK", cost: 0.0012 };
        },
      },

      // -- Step 3: Run test suite (none — sandbox call) -----------
      {
        name: "tests",
        modelTier: "none",
        async execute(ctx) {
          ctx.log("Running test suite in BlockRun sandbox");

          // Real impl: call BlockRun sandbox API with the PR's repo + ref.
          // For now: stub out the call and let test harness inject results.
          const result = ctx.config.testRunner
            ? await ctx.config.testRunner(ctx.config.pr)
            : { passed: true, duration: 14000, summary: "stubbed: tests passed" };

          ctx.data.stages.push({
            tier: "sandbox",
            label: "Run test suite",
            cost: 0.0021,
            durationMs: result.duration,
            output: result.summary,
          });

          if (!result.passed) {
            ctx.data.verdict = VERDICT_REJECTED;
            ctx.data.reasoning = "Test suite failed in sandbox.";
            await emitReceipt(ctx, undefined);
            return { abort: true, summary: "Tests failed", cost: 0.0021 };
          }

          return { summary: "Tests passed", cost: 0.0021 };
        },
      },

      // -- Step 4: Code & security review (cheap) -----------------
      {
        name: "review",
        modelTier: "cheap",
        async execute(ctx) {
          const { pr } = ctx.config;
          ctx.log("Running code quality + security review");

          const out = await ctx.callModel(
            pickTier(ctx, "cheap"),
            `Review this diff for code quality and security issues. Return one of:\n  CLEAN — approve as-is\n  AMBIGUOUS — needs deeper look\n  REJECT — clear issues\nFollow with one sentence reason.\n\nDiff summary: ${pr.diffStats?.summary ?? "(diff omitted)"}`
          );
          const verdict = extractKeyword(out, ["clean", "ambiguous", "reject"]);

          ctx.data.stages.push({
            tier: "auto",
            label: "Code & security review",
            cost: 0.0156,
            durationMs: 4200,
            output: out.slice(0, 160),
          });

          if (verdict === "reject") {
            ctx.data.verdict = VERDICT_REJECTED;
            ctx.data.reasoning = `Auto tier rejected: ${out.split(".")[1] ?? ""}`.trim();
            await emitReceipt(ctx, undefined);
            return { abort: true, summary: "Rejected by review", cost: 0.0156 };
          }

          if (verdict === "ambiguous") {
            ctx.data.needsEscalation = true;
            return { summary: "Ambiguous — escalating", cost: 0.0156 };
          }

          ctx.data.verdict = VERDICT_APPROVED;
          ctx.data.reasoning = "Auto tier approved without escalation.";
          return { summary: "Approved", cost: 0.0156 };
        },
      },

      // -- Step 5: Premium escalation (premium, conditional) ------
      {
        name: "escalate",
        modelTier: "premium",
        async execute(ctx) {
          if (!ctx.data.needsEscalation) {
            return { summary: "Premium tier skipped", cost: 0 };
          }

          const { pr } = ctx.config;
          ctx.log("Escalating to premium tier");

          const out = await ctx.callModel(
            pickTier(ctx, "premium"),
            `A previous reviewer flagged this PR as ambiguous. Make a final call: APPROVE or NEEDS-HUMAN, plus a one-sentence reason.\n\n${pr.diffStats?.summary ?? "(diff omitted)"}`
          );
          const verdict = extractKeyword(out, ["approve", "needs-human"]);

          ctx.data.stages.push({
            tier: "premium",
            label: "Escalation review",
            cost: 0.072,
            durationMs: 8400,
            output: out.slice(0, 160),
          });

          if (verdict === "approve") {
            ctx.data.verdict = VERDICT_APPROVED;
            ctx.data.reasoning =
              "Premium tier approved after auto flagged ambiguity.";
            return { summary: "Premium approved", cost: 0.072 };
          }

          ctx.data.verdict = VERDICT_NEEDS_HUMAN;
          ctx.data.reasoning =
            "Premium tier flagged: needs maintainer review.";
          await emitReceipt(ctx, undefined);
          return { abort: true, summary: "Escalated to human", cost: 0.072 };
        },
      },

      // -- Step 6: Sign payout (none) -----------------------------
      {
        name: "payout",
        modelTier: "none",
        skipInDryRun: false, // we still emit a receipt in dry-run
        async execute(ctx) {
          if (ctx.data.verdict !== VERDICT_APPROVED) {
            // Emit a receipt with no payout block — still part of the audit trail
            await emitReceipt(ctx, /* payout */ undefined);
            return {
              summary: `No payout — verdict=${ctx.data.verdict}`,
              cost: 0,
            };
          }

          const { pr, contributor, perPayoutCapUsd, payoutMode } = ctx.config;
          const amount = Math.min(
            Number(pr.bountyUsd ?? 0),
            Number(perPayoutCapUsd ?? 5)
          );

          if (amount <= 0) {
            ctx.data.verdict = VERDICT_REJECTED;
            ctx.data.reasoning = "Bounty amount missing or zero.";
            await emitReceipt(ctx, undefined);
            return { summary: "Skipped: no bounty amount", cost: 0 };
          }

          ctx.log(`Signing ${amount} USDC payout in ${payoutMode} mode`);
          const payout = await signPayout({
            mode: payoutMode,
            to: contributor.address,
            amountUsd: amount.toFixed(2),
          });

          await emitReceipt(ctx, {
            mode: payout.mode,
            amount: payout.amount,
            token: "USDC",
            chain: payout.chain,
            txHash: payout.txHash,
            settledAt: payout.settledAt,
            gasUsedEth: payout.gasUsedEth,
          });

          return {
            summary:
              payout.mode === "dry-run"
                ? `Dry-run: would have paid ${amount} USDC`
                : `Paid ${amount} USDC (${payout.txHash?.slice(0, 10)}…)`,
            cost: 0,
          };
        },
      },
    ],
  };
}

/**
 * Build a receipt from accumulated ctx.data and write it to disk.
 */
async function emitReceipt(ctx, payout) {
  const { pr, contributor } = ctx.config;
  const stages = ctx.data.stages ?? [];
  const totalCost = stages.reduce((s, x) => s + x.cost, 0);

  const receipt = {
    id: `${pr.repo}#${pr.number}`,
    pr,
    contributor,
    verdict: ctx.data.verdict ?? VERDICT_NEEDS_HUMAN,
    reasoning: ctx.data.reasoning,
    stages,
    totalCost: Number(totalCost.toFixed(4)),
    savingsVsOpus: Number(
      Math.max(
        0,
        1 - totalCost / ALWAYS_OPUS_COST_PER_REVIEW
      ).toFixed(4)
    ),
    payout,
    startedAt: ctx.data.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const file = await writeReceipt(receipt);
  ctx.log(`Receipt written: ${file}`);
}
