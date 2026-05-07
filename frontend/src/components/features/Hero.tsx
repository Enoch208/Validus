import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-55 pb-4 text-center">
      <FadeIn delay={0.15} duration={0.6}>
        <h1 className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Review the PR. Pay the contributor.{" "}
          <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic">
            Skip the babysitting.
          </span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.35} duration={0.6}>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          Validus is a Franklin plugin that reviews open-source bounty PRs and
          signs the USDC payout on Base. <span className="text-zinc-200">$0.019 per review.</span>{" "}
          <span className="text-zinc-200">Settled in 2.1 seconds.</span> No human in the loop until it&rsquo;s ambiguous.
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
