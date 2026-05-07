"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown01Icon } from "hugeicons-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What is Validus?",
    a: "A Franklin plugin that reviews open-source bounty PRs and pays the contributor in USDC on Base. It classifies the PR, checks scope, runs your test suite in a sandbox, audits the code, and signs the payout — each stage on a different routing tier, so a clean PR costs about $0.019 end-to-end.",
  },
  {
    q: "Does Validus need write access to my repo?",
    a: "Read access is enough for review. Write access is only needed if you want Validus to merge approved PRs automatically — opt-in via a flag. Payouts happen on-chain regardless of merge, so you can keep merging manual.",
  },
  {
    q: "Which chains and tokens does Validus support?",
    a: "USDC on Base mainnet (hard-capped at $5 per payout) and Base Sepolia for testnet. There's also a dry-run mode that logs the transfer payload without broadcasting — handy for debugging your bounties.json before going live.",
  },
  {
    q: "How is the cost per review so low?",
    a: "Most PRs never hit the premium tier. Validus only escalates when the auto tier flags real ambiguity — scope mismatch, security questions, edge cases your tests didn't cover. A clean fix costs about $0.019 to review. The same review on always-Opus runs 50–80× higher.",
  },
  {
    q: "What happens when Validus can't decide?",
    a: "It returns a needs-human verdict, pings you on Slack, and surfaces the specific stage that flagged ambiguity along with the full routing receipt. No payout signs until you confirm. You stay in the loop for the hard cases — Validus handles the long tail.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const prefersReduced = useReducedMotion();

  return (
    <section id="faq" className="relative py-24">
      {/* Ambient backdrop glow centered behind the list area for warmth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_60%,rgba(99,102,241,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-3xl px-6">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-fraunces)] text-center text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            The five questions every maintainer asks before installing.
          </p>
        </FadeIn>

        <div className="mt-12 space-y-3">
            {FAQS.map((item, i) => {
              const isOpen = openIdx === i;
              return (
                <FadeIn key={item.q} delay={Math.min(i * 0.05, 0.2)} y={20}>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-zinc-950/60 backdrop-blur-xl",
                    "transition-colors duration-200",
                    isOpen
                      ? "border-indigo-400/25 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                      : "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  {/* Subtle top-left indigo tint — softer than FeatureCard, just adds warmth */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_0%,rgba(99,102,241,0.08),transparent_60%)]"
                  />
                  {/* Bottom indigo glow ramps up only when open */}
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_115%,rgba(99,102,241,0.18),transparent_60%)] transition-opacity duration-300",
                      isOpen ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {/* Top hairline gloss */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />

                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="relative z-10 flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  >
                    <span className="text-sm font-medium text-white sm:text-[15px]">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isOpen ? "text-indigo-300" : "text-zinc-400"
                      )}
                    >
                      <ArrowDown01Icon size={18} strokeWidth={1.5} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        id={`faq-answer-${i}`}
                        initial={
                          prefersReduced
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        animate={
                          prefersReduced
                            ? { opacity: 1 }
                            : { height: "auto", opacity: 1 }
                        }
                        exit={
                          prefersReduced
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        transition={{
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{ overflow: "hidden" }}
                        className="relative z-10"
                      >
                        <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </FadeIn>
              );
            })}
          </div>
      </div>
    </section>
  );
}
