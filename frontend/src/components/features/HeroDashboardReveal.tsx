"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

export function HeroDashboardReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [36, -28]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.98, 1, 0.985]);

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: prefersReduced ? 0 : 28,
        filter: prefersReduced ? "none" : "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div
        style={{
          y: prefersReduced ? 0 : y,
          scale: prefersReduced ? 1 : scale,
        }}
        className="relative"
      >
        <div
          aria-hidden
          className="absolute inset-x-12 -bottom-8 h-24 rounded-full bg-indigo-500/25 blur-3xl"
        />
        <Image
          src="/assets/hero-dashboard.jpg"
          alt="Validus dashboard - routing cost chart and latest PR review"
          width={1672}
          height={941}
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="relative w-full rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/5 [mask-image:linear-gradient(to_bottom,black_55%,rgba(0,0,0,0.4)_85%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,rgba(0,0,0,0.4)_85%,transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-sm [mask-image:linear-gradient(to_top,black_0%,transparent_60%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,transparent_60%)]"
        />
      </motion.div>
    </motion.div>
  );
}
