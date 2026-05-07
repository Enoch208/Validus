import type { BountyReceipt } from "./types/receipt";

// Used when ~/.blockrun/validus/receipts/ is empty — keeps the dashboard
// alive during dev while the plugin isn't shipping receipts yet.
// Replace with real receipts the moment the plugin starts writing them.
export const mockReceipts: BountyReceipt[] = [
  {
    id: "validus-bounties/csv-export#142",
    pr: {
      repo: "validus-bounties/csv-export",
      number: 142,
      url: "https://github.com/validus-bounties/csv-export/pull/142",
      title: "Add CSV export endpoint to /reports API",
    },
    contributor: {
      address: "0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f",
      githubUser: "jsmith-dev",
    },
    verdict: "approved",
    reasoning:
      "Diff matches issue scope. All tests pass. No security concerns flagged.",
    stages: [
      { tier: "free", label: "Classify PR", cost: 0.0001, durationMs: 312 },
      { tier: "eco", label: "Scope match", cost: 0.0012, durationMs: 821 },
      { tier: "sandbox", label: "Run test suite", cost: 0.0021, durationMs: 14_502 },
      { tier: "auto", label: "Code & security review", cost: 0.0156, durationMs: 4_201 },
    ],
    totalCost: 0.019,
    savingsVsOpus: 0.82,
    payout: {
      mode: "mainnet",
      amount: "5.00",
      token: "USDC",
      chain: "base",
      txHash: "0x9e2ba3f0c8def7b34e0fa19c6b3ca01dd5a401f7e8c2a9bb47c1d5f6e3a8d201",
      settledAt: "2026-05-07T11:42:18Z",
      gasUsedEth: "0.0000041",
    },
    startedAt: "2026-05-07T11:42:01Z",
    completedAt: "2026-05-07T11:42:18Z",
  },
  {
    id: "validus-bounties/csv-export#138",
    pr: {
      repo: "validus-bounties/csv-export",
      number: 138,
      url: "https://github.com/validus-bounties/csv-export/pull/138",
      title: "Refactor reports module — questionable scope",
    },
    contributor: {
      address: "0x4a8C13bE5DfA0987EabC4B2f0098f4e3c2d77a91",
    },
    verdict: "needs-human",
    reasoning:
      "Auto tier flagged scope mismatch — diff touches modules outside the issue. Premium escalation queued.",
    stages: [
      { tier: "free", label: "Classify PR", cost: 0.0001, durationMs: 298 },
      { tier: "eco", label: "Scope match", cost: 0.0011, durationMs: 904 },
      { tier: "sandbox", label: "Run test suite", cost: 0.0019, durationMs: 12_103 },
      { tier: "auto", label: "Code & security review", cost: 0.0143, durationMs: 3_901 },
      { tier: "premium", label: "Escalation review", cost: 0.072, durationMs: 8_421 },
    ],
    totalCost: 0.0894,
    savingsVsOpus: 0.41,
    startedAt: "2026-05-06T23:08:14Z",
    completedAt: "2026-05-06T23:08:39Z",
  },
  {
    id: "validus-bounties/csv-export#129",
    pr: {
      repo: "validus-bounties/csv-export",
      number: 129,
      url: "https://github.com/validus-bounties/csv-export/pull/129",
      title: "Quick typo fix in README",
    },
    contributor: {
      address: "0xD1eBf02A4cE89F3a6B0d8C71fe5a3E2b9c0d4582",
      githubUser: "spam-fix-bot",
    },
    verdict: "rejected",
    reasoning: "Free tier classifier flagged: not a bounty-eligible change (typo only).",
    stages: [
      { tier: "free", label: "Classify PR", cost: 0.0001, durationMs: 287 },
    ],
    totalCost: 0.0001,
    savingsVsOpus: 0.99,
    startedAt: "2026-05-06T18:21:02Z",
    completedAt: "2026-05-06T18:21:03Z",
  },
];
