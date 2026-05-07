"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CheckmarkCircle02Icon,
  CpuIcon,
  WalletAdd01Icon,
  GitPullRequestIcon,
  TestTubeIcon,
} from "hugeicons-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    tier: "Free",
    label: "Classify PR",
    cost: "$0.0001",
    icon: GitPullRequestIcon,
    accent: "text-zinc-300",
  },
  {
    tier: "Eco",
    label: "Scope match",
    cost: "$0.0012",
    icon: CpuIcon,
    accent: "text-zinc-300",
  },
  {
    tier: "Sandbox",
    label: "Run test suite",
    cost: "$0.0021",
    icon: TestTubeIcon,
    accent: "text-zinc-300",
  },
  {
    tier: "Auto",
    label: "Code & security review",
    cost: "$0.0156",
    icon: CheckmarkCircle02Icon,
    accent: "text-emerald-400",
  },
];

export function DashboardMock() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-5xl px-6"
    >
      <GlassCard className="p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-xs text-zinc-500">
              validus / pr #142 — Add CSV export
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <CheckmarkCircle02Icon size={12} strokeWidth={1.5} />
            Approved
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-[1.4fr_1fr]">
          {/* Pipeline column */}
          <div className="bg-zinc-950/40 p-6">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="font-[family-name:var(--font-fraunces)] text-lg text-white">
                Routing pipeline
              </h3>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                Premium tier — skipped
              </span>
            </div>

            <ol className="relative space-y-4 pl-6">
              <span
                aria-hidden
                className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/60 via-blue-500/30 to-transparent"
              />
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                return (
                  <motion.li
                    key={stage.tier}
                    initial={{ opacity: 0, x: prefersReduced ? 0 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.2 + i * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative"
                  >
                    <span className="absolute -left-6 top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                      <span className="absolute h-3.5 w-3.5 rounded-full bg-blue-500/20" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-blue-400" />
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          size={14}
                          strokeWidth={1.5}
                          className={cn("text-zinc-400", stage.accent)}
                        />
                        <span className="text-sm text-zinc-200">
                          {stage.label}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                          {stage.tier}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-zinc-500">
                        {stage.cost}
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {/* Receipt column */}
          <div className="bg-zinc-950/60 p-6">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="font-[family-name:var(--font-fraunces)] text-lg text-white">
                Payout receipt
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <WalletAdd01Icon size={12} strokeWidth={1.5} />
                Settled
              </span>
            </div>

            <div className="space-y-4">
              <Row label="Bounty paid" value="5.00 USDC" emphasis />
              <Row label="Total review cost" value="$0.0190" />
              <Row label="vs always-Opus" value="−82%" accent="text-emerald-400" />
              <div className="border-t border-white/5 pt-4">
                <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">
                  Tx hash
                </div>
                <div className="truncate font-mono text-xs text-zinc-300">
                  0x9e2b…a401f
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface RowProps {
  label: string;
  value: string;
  accent?: string;
  emphasis?: boolean;
}

function Row({ label, value, accent, emphasis }: RowProps) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span
        className={cn(
          "font-mono text-sm",
          accent ?? (emphasis ? "text-white" : "text-zinc-300"),
          emphasis &&
            "font-[family-name:var(--font-fraunces)] text-2xl font-medium"
        )}
      >
        {value}
      </span>
    </div>
  );
}
