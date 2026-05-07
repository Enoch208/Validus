"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { motion, useReducedMotion } from "framer-motion";

const titleStart = "Review the PR. Pay the contributor.";
const titleAccent = "Skip the babysitting.";

function AnimatedHeroTitle() {
  const prefersReduced = useReducedMotion();
  const words = [
    ...titleStart.split(" ").map((word) => ({ word, accent: false })),
    ...titleAccent.split(" ").map((word) => ({ word, accent: true })),
  ];

  return (
    <motion.h1
      aria-label={`${titleStart} ${titleAccent}`}
      className="font-[family-name:var(--font-fraunces)] mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: prefersReduced ? 0 : 0.045,
            delayChildren: prefersReduced ? 0 : 0.12,
          },
        },
      }}
    >
      {words.map(({ word, accent }, index) => (
        <motion.span
          aria-hidden="true"
          key={`${word}-${index}`}
          className={
            accent
              ? "mr-[0.22em] inline-block bg-gradient-to-br from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent italic"
              : "mr-[0.22em] inline-block"
          }
          variants={{
            hidden: {
              opacity: 0,
              y: prefersReduced ? 0 : 22,
              filter: prefersReduced ? "none" : "blur(10px)",
            },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.72,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-55 pb-4 text-center">
      <AnimatedHeroTitle />

      <FadeIn delay={0.5} duration={0.7} y={18}>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          Validus is a Franklin plugin that reviews open-source bounty PRs and
          signs the USDC payout on Base. <span className="text-zinc-200">$0.019 per review.</span>{" "}
          <span className="text-zinc-200">Settled in 2.1 seconds.</span> No human in the loop until it&rsquo;s ambiguous.
        </p>
      </FadeIn>

      <FadeIn delay={0.68} duration={0.6} y={14}>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <ConnectButton size="lg" connectLabel="Connect Wallet" />
          <Link href="/dashboard">
            <Button variant="ghost" size="lg">
              Launch App
            </Button>
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
