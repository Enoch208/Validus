"use client";

import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Cancel01Icon,
  LinkSquare02Icon,
} from "hugeicons-react";
import type { BountyReceipt, RoutingTier, Verdict } from "@/lib/types/receipt";
import { cn } from "@/lib/utils";

const VERDICT_META: Record<Verdict, { label: string; tone: string; Icon: typeof CheckmarkCircle02Icon }> = {
  approved: {
    label: "Approved",
    tone: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    Icon: CheckmarkCircle02Icon,
  },
  "needs-human": {
    label: "Needs human",
    tone: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    Icon: AlertCircleIcon,
  },
  rejected: {
    label: "Rejected",
    tone: "bg-rose-400/10 text-rose-300 border-rose-400/20",
    Icon: Cancel01Icon,
  },
};

const TIER_TONE: Record<RoutingTier, string> = {
  free: "bg-zinc-700/40 text-zinc-300 border-zinc-700/60",
  eco: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  sandbox: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  auto: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  premium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

function basescanTxUrl(chain: "base" | "base-sepolia", txHash: string) {
  const base = chain === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
  return `${base}/tx/${txHash}`;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

interface ReceiptCardProps {
  receipt: BountyReceipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const verdict = VERDICT_META[receipt.verdict];
  const VerdictIcon = verdict.Icon;
  const totalDurationMs = receipt.stages.reduce((s, x) => s + x.durationMs, 0);

  return (
    <article className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/60 p-5 backdrop-blur-xl transition-colors duration-200 hover:border-white/[0.10]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_0%,rgba(99,102,241,0.08),transparent_60%)]"
      />

      <div className="relative">
        {/* Header: PR title + verdict */}
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="font-mono">{receipt.pr.repo}</span>
              <span className="text-zinc-700">·</span>
              <span>#{receipt.pr.number}</span>
              <span className="text-zinc-700">·</span>
              <span>{formatRelative(receipt.completedAt)}</span>
            </div>
            <h3 className="mt-1.5 truncate text-sm font-medium text-white sm:text-[15px]">
              {receipt.pr.title}
            </h3>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              verdict.tone
            )}
          >
            <VerdictIcon size={12} strokeWidth={1.5} />
            {verdict.label}
          </span>
        </header>

        {/* Stage tier pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {receipt.stages.map((stage, i) => (
            <span
              key={i}
              title={`${stage.label} — $${stage.cost.toFixed(4)} (${stage.durationMs}ms)`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                TIER_TONE[stage.tier]
              )}
            >
              {stage.tier}
            </span>
          ))}
        </div>

        {/* Reasoning */}
        {receipt.reasoning && (
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">{receipt.reasoning}</p>
        )}

        {/* Footer: cost + payout link */}
        <footer className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/5 pt-3">
          <div className="flex items-baseline gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Review cost
              </div>
              <div className="font-mono text-zinc-300">
                ${receipt.totalCost.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Saved
              </div>
              <div className="font-mono text-emerald-400">
                {Math.round(receipt.savingsVsOpus * 100)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Latency
              </div>
              <div className="font-mono text-zinc-300">
                {(totalDurationMs / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {receipt.payout?.txHash ? (
            <a
              href={basescanTxUrl(receipt.payout.chain, receipt.payout.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono text-indigo-200 transition-colors duration-150 hover:border-indigo-300/50 hover:bg-indigo-500/15 cursor-pointer"
            >
              <span>{receipt.payout.amount} {receipt.payout.token}</span>
              <span className="text-indigo-400/60">·</span>
              <span>{truncateHash(receipt.payout.txHash)}</span>
              <LinkSquare02Icon size={12} strokeWidth={1.5} />
            </a>
          ) : receipt.payout?.mode === "dry-run" ? (
            <span className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-2.5 py-1 text-xs font-mono text-zinc-400">
              dry-run · {receipt.payout.amount} {receipt.payout.token}
            </span>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
