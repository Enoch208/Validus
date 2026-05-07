"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  scale?: number;
}

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  duration = 0.5,
  className,
  once = true,
  amount = 0.28,
  scale,
}: FadeInProps) {
  const prefersReduced = useReducedMotion();
  const shouldMove = !prefersReduced;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: shouldMove ? y : 0,
        scale: shouldMove && scale ? scale : 1,
        filter: shouldMove ? "blur(8px)" : "none",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once, amount, margin: "0px 0px -12% 0px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
