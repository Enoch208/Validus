import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function OnboardingCard({
  icon,
  title,
  description,
  className,
}: OnboardingCardProps) {
  return (
    <div
      className={cn(
        // Surface
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl",
        // Layered drop shadow
        "shadow-[0_2px_6px_rgba(0,0,0,0.4),0_16px_40px_rgba(0,0,0,0.45)]",
        "transition-colors duration-300 hover:border-white/[0.12]",
        "p-8 sm:p-10",
        className
      )}
    >
      {/* THE signature visual: two stacked radials anchored at bottom-center for the indigo glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_115%,rgba(99,102,241,0.38),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_28%_at_50%_100%,rgba(139,92,246,0.22),transparent_70%)]"
      />
      {/* Top hairline gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
      {/* Bottom inset for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/40 to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Icon chip */}
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-indigo-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {icon}
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
