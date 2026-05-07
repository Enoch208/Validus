import {
  CodeSquareIcon,
  Wallet02Icon,
  Coffee02Icon,
} from "hugeicons-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { OnboardingCard } from "@/components/ui/OnboardingCard";

export function OnboardingSection() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-center text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl">
            Run Your Bounty Board With{" "}
            <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic">
              Zero Overhead.
            </span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Validus handles the review and payout pipeline so you stay focused
            on shipping the project — install once, set thresholds, walk away.
          </p>
        </FadeIn>

        <FadeIn delay={0.35}>
          {/* 1 big left + 2 stacked right */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2">
            <OnboardingCard
              icon={<CodeSquareIcon size={20} strokeWidth={1.5} />}
              title="Install in One Command"
              description="Run franklin plugin add validus once. The plugin self-registers as a webhook listener inside your Franklin runtime, picks up bounty references from bounties.json, and stays out of your way."
              className="md:row-span-2"
            />
            <OnboardingCard
              icon={<Wallet02Icon size={20} strokeWidth={1.5} />}
              title="Connect Your Wallet"
              description="Point Validus at your Franklin wallet. Set per-payout caps, escalation thresholds, and the routing tier ceiling. Hard-capped at $5/payout on Base mainnet."
            />
            <OnboardingCard
              icon={<Coffee02Icon size={20} strokeWidth={1.5} />}
              title="Approve. Pay. Sleep."
              description="Validus audits PRs across smart-routing tiers, runs your test suite in BlockRun's sandbox, and signs USDC payouts on Base. You wake up to merged PRs and on-chain receipts."
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
