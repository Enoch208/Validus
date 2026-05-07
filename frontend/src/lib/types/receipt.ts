// Schema written by the Validus Franklin plugin's `signPayout` capability.
// One JSON file per PR review at ~/.blockrun/validus/receipts/<pr-id>.json.
// Keep this in sync with the plugin — the dashboard reads it as-is.

export type RoutingTier = "free" | "eco" | "sandbox" | "auto" | "premium";
export type Verdict = "approved" | "rejected" | "needs-human";
export type PayoutMode = "dry-run" | "testnet" | "mainnet";
export type PayoutChain = "base" | "base-sepolia";

export interface PRRef {
  repo: string;        // "owner/name"
  number: number;
  url: string;
  title: string;
}

export interface ContributorRef {
  address: string;     // 0x... Base address that received the payout
  githubUser?: string;
}

export interface RoutingStage {
  tier: RoutingTier;
  label: string;       // "Classify PR", "Run test suite", "Code & security review"
  cost: number;        // USD
  durationMs: number;
  output?: string;     // truncated stage output (optional, may include verdict snippet)
}

export interface PayoutDetails {
  mode: PayoutMode;
  amount: string;      // "5.00" — string to preserve precision
  token: "USDC";
  chain: PayoutChain;
  txHash?: string;     // omitted in dry-run mode
  settledAt?: string;  // ISO 8601
  gasUsedEth?: string; // optional, gas paid in ETH
}

export interface BountyReceipt {
  id: string;          // e.g. "validus/repo#142"
  pr: PRRef;
  contributor: ContributorRef;

  verdict: Verdict;
  reasoning?: string;  // brief why-it-was-approved/rejected/escalated

  stages: RoutingStage[];
  totalCost: number;   // sum of stage costs (USD)
  savingsVsOpus: number; // ratio in [0, 1] — what fraction of always-Opus cost was saved

  payout?: PayoutDetails; // only present if verdict === "approved"

  startedAt: string;   // ISO 8601
  completedAt: string; // ISO 8601
}

// Aggregated stats the dashboard renders at the top
export interface ReceiptsResponse {
  receipts: BountyReceipt[];
  source: "filesystem" | "mock";
}
