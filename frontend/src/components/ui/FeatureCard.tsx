import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Layout = "text-top" | "image-top";

interface FeatureCardProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  fallbackIcon?: ReactNode;
  layout?: Layout;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  image,
  imageAlt = "",
  fallbackIcon,
  layout = "text-top",
  className,
}: FeatureCardProps) {
  // Consistent fixed-height container so all 4 illustrations display at similar visual size,
  // regardless of their source aspect ratio. object-contain centers within the container.
  const visual = image ? (
    <div className="flex h-44 items-center justify-center sm:h-52">
      <Image
        src={image}
        alt={imageAlt}
        width={1200}
        height={500}
        sizes="(max-width: 768px) 100vw, 800px"
        className="max-h-full w-auto object-contain"
      />
    </div>
  ) : fallbackIcon ? (
    <div className="flex h-44 items-center justify-center text-indigo-300/55 sm:h-52">
      {fallbackIcon}
    </div>
  ) : null;

  const Title = (
    <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-white sm:text-2xl">
      {title}
    </h3>
  );
  const Description = (
    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
  );

  return (
    <div
      className={cn(
        // Base surface
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl",
        // Layered drop shadow (sits + lifts off the page)
        "shadow-[0_2px_6px_rgba(0,0,0,0.4),0_16px_40px_rgba(0,0,0,0.45)]",
        "transition-colors duration-300 hover:border-white/[0.10]",
        "p-8",
        className
      )}
    >
      {/* Top-left indigo glow (corner microdepth) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_0%,rgba(99,102,241,0.18),transparent_60%)]"
      />
      {/* Bottom-right violet glow (corner microdepth) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_100%,rgba(139,92,246,0.10),transparent_60%)]"
      />
      {/* Top hairline gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
      {/* Bottom inset shadow line for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/40 to-transparent"
      />

      <div className="relative z-10">
        {layout === "text-top" && (
          <>
            {Title}
            {Description}
            {visual && <div className="mt-8">{visual}</div>}
          </>
        )}

        {layout === "image-top" && (
          <>
            {visual && <div className="mb-8">{visual}</div>}
            {Title}
            {Description}
          </>
        )}
      </div>
    </div>
  );
}
