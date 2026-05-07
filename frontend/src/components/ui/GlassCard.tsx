import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-6 overflow-hidden",
        "shadow-2xl shadow-black/40",
        interactive &&
          "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-zinc-800/40 hover:shadow-blue-900/10",
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
