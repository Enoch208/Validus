"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshIcon } from "hugeicons-react";
import type { ReceiptsResponse, BountyReceipt } from "@/lib/types/receipt";
import { StatCard } from "./StatCard";
import { ReceiptCard } from "./ReceiptCard";

async function fetchReceipts(): Promise<ReceiptsResponse> {
  const res = await fetch("/api/receipts", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch receipts: ${res.status}`);
  return res.json();
}

function aggregateStats(receipts: BountyReceipt[]) {
  const approved = receipts.filter((r) => r.verdict === "approved");
  const totalReviewCost = receipts.reduce((s, r) => s + r.totalCost, 0);
  const totalPaidUsd = approved.reduce(
    (s, r) => s + (r.payout ? Number(r.payout.amount) : 0),
    0
  );
  const avgSavings =
    receipts.length > 0
      ? receipts.reduce((s, r) => s + r.savingsVsOpus, 0) / receipts.length
      : 0;

  return {
    bountiesPaid: approved.length,
    totalReviews: receipts.length,
    totalReviewCost,
    totalPaidUsd,
    avgSavings,
  };
}

export function ReceiptsList() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["receipts"],
    queryFn: fetchReceipts,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });

  if (isLoading) {
    return (
      <div className="mt-12 text-sm text-zinc-500">Loading receipts…</div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 rounded-xl border border-rose-400/20 bg-rose-500/5 p-6 text-sm text-rose-300">
        Could not load receipts. {(error as Error).message}
      </div>
    );
  }

  const receipts = data?.receipts ?? [];
  const stats = aggregateStats(receipts);

  return (
    <>
      {/* Stats row */}
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Bounties paid"
          value={String(stats.bountiesPaid)}
          hint={`${stats.totalReviews} total review${stats.totalReviews === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Total review cost"
          value={`$${stats.totalReviewCost.toFixed(4)}`}
          hint="across all routing tiers"
        />
        <StatCard
          label="Total paid out"
          value={`$${stats.totalPaidUsd.toFixed(2)} USDC`}
          hint={`avg ${Math.round(stats.avgSavings * 100)}% saved vs always-Opus`}
          accent="success"
        />
      </div>

      {/* Receipts list */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-medium tracking-tight text-white">
          Recent reviews
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span
            className={`flex h-1.5 w-1.5 rounded-full ${
              isFetching ? "bg-indigo-400" : "bg-emerald-400"
            }`}
          />
          {data?.source === "mock" ? "Showing mock data" : "Live"}
          <RefreshIcon
            size={12}
            strokeWidth={1.5}
            className={isFetching ? "animate-spin text-indigo-400" : "text-zinc-600"}
          />
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-zinc-950/40 p-12 text-center">
          <p className="text-sm text-zinc-500">
            No receipts yet. The Validus plugin will write here once the first PR
            is reviewed.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {receipts.map((receipt) => (
              <motion.div
                key={receipt.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <ReceiptCard receipt={receipt} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
