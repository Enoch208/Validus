import {
  CpuIcon,
  TestTubeIcon,
  WalletAdd01Icon,
  AnalyticsUpIcon,
} from "hugeicons-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { FeatureCard } from "@/components/ui/FeatureCard";

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-center text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl">
            From PR to USDC. Fully{" "}
            <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic">
              automated.
            </span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Four routing tiers, an isolated test sandbox, and a wallet that
            signs the payout. Every review costs sub-cent. Every cent is
            accounted for.
          </p>
        </FadeIn>

        <FadeIn delay={0.35}>
          {/* Asymmetric 60/40 grid that flips between rows: 7/5, 5/7 */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-12">
            <FeatureCard
              title="Smart Routing Pipeline"
              description="Free classifies the PR. Eco checks scope. Auto reviews code. Premium escalates only when the others can't decide. Average review: $0.019."
              image="/assets/feature-routing.png"
              imageAlt="Four routing tier nodes connected by glowing indigo flow lines"
              fallbackIcon={<CpuIcon size={64} strokeWidth={1.5} />}
              layout="text-top"
              className="md:col-span-7"
            />
            <FeatureCard
              title="Sandboxed Test Runs"
              description="Tests run in BlockRun's isolated sandbox. Never your machine. Never your CI minutes. Approve only what passes."
              image="/assets/feature-sandbox.png"
              imageAlt="Translucent glass cube containing emerald checkmarks for passing tests"
              fallbackIcon={<TestTubeIcon size={64} strokeWidth={1.5} />}
              layout="image-top"
              className="md:col-span-5"
            />
            <FeatureCard
              title="Autonomous USDC Payouts"
              description="On approval, your Franklin wallet signs the USDC transfer. Settled on Base in 2.1 seconds. Hard-capped at $5 per payout on mainnet."
              image="/assets/feature-payout.png"
              imageAlt="USDC coin transferring between two glass wallets with an emerald checkmark"
              fallbackIcon={<WalletAdd01Icon size={64} strokeWidth={1.5} />}
              layout="image-top"
              className="md:col-span-5"
            />
            <FeatureCard
              title="A Receipt for Every Review"
              description="Per-stage cost, total spent, savings vs always-Opus, and the on-chain tx hash — every review ships with a receipt. Account for every cent and every claim."
              image="/assets/feature-receipt.png"
              imageAlt="Glass receipt card showing $0.019 cost, mini bar chart, and abbreviated tx hash"
              fallbackIcon={<AnalyticsUpIcon size={64} strokeWidth={1.5} />}
              layout="text-top"
              className="md:col-span-7"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
