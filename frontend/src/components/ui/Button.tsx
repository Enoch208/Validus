"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
};

const variants: Record<Variant, string> = {
  primary: [
    "text-white border border-indigo-400/60",
    "bg-gradient-to-b from-indigo-400 via-indigo-500 to-indigo-600",
    // Top gloss + bottom shadow + close drop shadow + soft outer glow
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4),0_8px_24px_rgba(99,102,241,0.35)]",
    "hover:from-indigo-300 hover:via-indigo-400 hover:to-indigo-500",
  ].join(" "),
  ghost: [
    "text-white border border-indigo-400/45",
    "bg-gradient-to-b from-white/[0.06] to-white/[0.01]",
    // Subtle top highlight + soft drop shadow for lift
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_6px_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.25)]",
    "hover:border-indigo-300/65 hover:from-white/[0.10] hover:to-white/[0.03]",
  ].join(" "),
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.button
      whileHover={prefersReduced ? undefined : { scale: 1.02 }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
