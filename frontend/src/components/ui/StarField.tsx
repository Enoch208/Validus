"use client";

import { useMemo } from "react";

interface Star {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
  duration: number;
}

interface StarFieldProps {
  count?: number;
  className?: string;
  seed?: number;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function StarField({ count = 90, className, seed = 7 }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      cx: rand() * 100,
      cy: rand() * 100,
      r: rand() * 0.9 + 0.2,
      opacity: rand() * 0.5 + 0.2,
      delay: rand() * 4,
      duration: rand() * 3 + 2,
    }));
  }, [count, seed]);

  return (
    <svg
      aria-hidden
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          style={{
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--o, 0.4); }
          50% { opacity: 0.05; }
        }
        @media (prefers-reduced-motion: reduce) {
          circle { animation: none !important; }
        }
      `}</style>
    </svg>
  );
}
