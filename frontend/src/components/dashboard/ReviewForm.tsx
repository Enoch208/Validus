"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequestIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "hugeicons-react";
import { Button } from "@/components/ui/Button";
import { ReceiptCard } from "./ReceiptCard";
import { cn } from "@/lib/utils";
import type { BountyReceipt } from "@/lib/types/receipt";

type SubmitState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; receipt: BountyReceipt }
  | { phase: "error"; code: string; message: string };

const PR_URL_PATTERN = /^https?:\/\/github\.com\/[^\s\/]+\/[^\s\/]+\/pull\/\d+/;

export function ReviewForm() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<SubmitState>({ phase: "idle" });
  const queryClient = useQueryClient();

  function clientSideValidation(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return "Paste a GitHub PR URL.";
    if (!PR_URL_PATTERN.test(trimmed)) {
      return "URL doesn't look right. Try https://github.com/owner/repo/pull/42";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = clientSideValidation(url);
    if (validationError) {
      setState({ phase: "error", code: "bad_url", message: validationError });
      return;
    }

    setState({ phase: "loading" });

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setState({
          phase: "error",
          code: data.error ?? `http_${res.status}`,
          message:
            data.message ??
            "Something went wrong. Please try again in a moment.",
        });
        return;
      }

      // Refresh the receipts list so this new one appears in the recent reviews
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setState({ phase: "success", receipt: data.receipt });
    } catch {
      setState({
        phase: "error",
        code: "network",
        message:
          "Couldn't reach the Validus server. Check your connection and try again.",
      });
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-medium tracking-tight text-white">
          Review a PR
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/60 p-5 backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_0%_0%,rgba(99,102,241,0.10),transparent_60%)]"
        />

        <div className="relative">
          <label htmlFor="pr-url" className="text-xs font-medium text-zinc-400">
            GitHub PR URL
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <GitPullRequestIcon
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                id="pr-url"
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/42"
                disabled={state.phase === "loading"}
                className={cn(
                  "w-full rounded-lg border bg-zinc-900/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600",
                  "transition-colors duration-150 focus:outline-none focus-visible:ring-2",
                  state.phase === "error"
                    ? "border-rose-400/40 focus-visible:ring-rose-400/40"
                    : "border-white/10 focus-visible:border-indigo-400/40 focus-visible:ring-indigo-500/30",
                  state.phase === "loading" && "cursor-not-allowed opacity-60"
                )}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={state.phase === "loading"}
              className="shrink-0"
            >
              {state.phase === "loading" ? (
                <>
                  <Loading03Icon
                    size={14}
                    strokeWidth={1.5}
                    className="animate-spin"
                  />
                  Reviewing…
                </>
              ) : (
                "Review PR"
              )}
            </Button>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Live testnet payout on Base Sepolia. Public repos only. Takes ~20 seconds.
          </p>
        </div>

        <AnimatePresence>
          {state.phase === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative mt-4 flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3"
              role="alert"
            >
              <AlertCircleIcon
                size={16}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-rose-300"
              />
              <div className="text-xs leading-relaxed text-rose-200">
                {state.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {state.phase === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 px-2 text-xs text-zinc-500"
          >
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            Routing through smart-router tiers…
          </motion.div>
        )}

        {state.phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 space-y-3"
          >
            <div className="flex items-center gap-2 px-2 text-xs text-emerald-400">
              <CheckmarkCircle02Icon size={14} strokeWidth={1.5} />
              Review complete — receipt below
            </div>
            <ReceiptCard receipt={state.receipt} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
