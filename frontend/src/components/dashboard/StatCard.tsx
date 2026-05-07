import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "success";
  className?: string;
}

export function StatCard({ label, value, hint, accent = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/60 p-6 backdrop-blur-xl",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_0%,rgba(99,102,241,0.10),transparent_60%)]"
      />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
        <div
          className={cn(
            "mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-medium",
            accent === "success" ? "text-emerald-400" : "text-white"
          )}
        >
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-zinc-500">{hint}</div>
        )}
      </div>
    </div>
  );
}
