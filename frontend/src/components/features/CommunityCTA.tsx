import { GithubIcon, DiscordIcon } from "hugeicons-react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function CommunityCTA() {
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl p-12 sm:p-20">
            {/* Strong bottom indigo glow — bigger sibling of OnboardingCard's bottom glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_120%,rgba(99,102,241,0.50),transparent_55%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_30%_at_50%_100%,rgba(139,92,246,0.32),transparent_70%)]"
            />
            {/* Top gloss */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />

            <div className="relative z-10 text-center">
              <h2 className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl">
                Open source. Apache-2.0.{" "}
                <span className="bg-gradient-to-br from-blue-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent italic">
                  Reviewed by itself.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-300/90 sm:text-[15px]">
                Star the repo, file an issue, ship a fix — every contribution
                to Validus gets reviewed by Validus. Same routing tiers. Same
                receipt. Same payout.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="primary" size="lg">
                  <GithubIcon size={18} strokeWidth={1.5} />
                  Star on GitHub
                </Button>
                <Button variant="ghost" size="lg">
                  <DiscordIcon size={18} strokeWidth={1.5} />
                  Join Discord
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
