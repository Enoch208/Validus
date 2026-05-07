import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-55 pb-4 text-center">
      <FadeIn delay={0.15} duration={0.6}>
        <h1 className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Verify. Route. Release. — All in One{" "}
          <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic">
            Bounty Engine.
          </span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.35} duration={0.6}>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          Validus audits open-source bounty PRs across Franklin&rsquo;s smart-routing
          tiers, runs the test suite in a sandbox, and signs the USDC payout
          on Base — sub-cent reviews, end-to-end.
        </p>
      </FadeIn>

      <FadeIn delay={0.55} duration={0.5}>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button variant="primary" size="lg">
            Launch App
          </Button>
          <Button variant="ghost" size="lg">
            Watch Demo
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}
