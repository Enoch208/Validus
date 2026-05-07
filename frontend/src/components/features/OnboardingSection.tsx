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
            Three steps. Then{" "}
            <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic">
              walk away.
            </span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Install the plugin, point it at your wallet, set your spending caps.
            Validus runs the rest in the background — you stay focused on
            shipping the project.
          </p>
        </FadeIn>

        {/* 1 big left + 2 stacked right */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2">
          <FadeIn
            delay={0.04}
            y={28}
            scale={0.985}
            className="h-full md:row-span-2"
          >
            <OnboardingCard
              icon={<CodeSquareIcon size={20} strokeWidth={1.5} />}
              title="Install in one command"
              description="franklin plugin add validus. That's it — the plugin self-registers as a webhook in your Franklin runtime, watches your repo for bounty PRs, and reads bounty amounts from a single bounties.json. No CI changes. No hosted dashboard. No new account."
              className="h-full"
            />
          </FadeIn>
          <FadeIn delay={0.12} y={28} scale={0.985} className="h-full">
            <OnboardingCard
              icon={<Wallet02Icon size={20} strokeWidth={1.5} />}
              title="Set your spending caps"
              description="Point Validus at your Franklin wallet. Choose per-payout cap, daily ceiling, and the tier you'll allow review to escalate to. Mainnet payouts are hard-capped at $5."
              className="h-full"
            />
          </FadeIn>
          <FadeIn delay={0.18} y={28} scale={0.985} className="h-full">
            <OnboardingCard
              icon={<Coffee02Icon size={20} strokeWidth={1.5} />}
              title="Wake up to merged PRs"
              description="Validus runs the review pipeline 24/7. You wake up to merged PRs, signed payout receipts, and contributors who got paid while you slept. Ambiguous reviews ping you on Slack — that's the only interruption."
              className="h-full"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
