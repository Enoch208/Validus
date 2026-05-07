"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Wallet02Icon, ArrowLeft02Icon, LogoutSquare01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { FadeIn } from "@/components/ui/FadeIn";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Disconnected() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <FadeIn>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300">
          <Wallet02Icon size={24} strokeWidth={1.5} />
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Connect your Franklin wallet
        </h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          The dashboard shows your routing receipts, payout history, and live
          bounty queue. Connect a Base-compatible wallet to continue.
        </p>
      </FadeIn>
      <FadeIn delay={0.3}>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <ConnectButton size="lg" />
          <Link href="/">
            <Button variant="ghost" size="lg">
              <ArrowLeft02Icon size={16} strokeWidth={1.5} />
              Back to home
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}

function ConnectedDashboard({ address }: { address: string }) {
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  return (
    <div className="relative min-h-screen px-6 pt-32 pb-24">
      {/* Top utility bar */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-6 lg:px-16">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image
            src="/assets/logo.png"
            alt="Validus"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-tight text-white">
            Validus
          </span>
          <span className="ml-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
            Dashboard
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => open({ view: "Account" })}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.07]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">{truncate(address)}</span>
          </button>
          <button
            type="button"
            onClick={() => disconnect()}
            aria-label="Disconnect wallet"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            <LogoutSquare01Icon size={16} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Welcome back.
          </h1>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Live data goes here once the Franklin plugin is shipping receipts.
            For now: this is the connected-wallet skeleton — wallet:{" "}
            <span className="font-mono text-zinc-200">{truncate(address)}</span>
            .
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Bounties this month", value: "0" },
              { label: "Total reviewed cost", value: "$0.000" },
              { label: "Total paid out", value: "$0.00 USDC" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/60 p-6 backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_0%,rgba(99,102,241,0.10),transparent_60%)]" />
                <div className="relative">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </div>
                  <div className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-medium text-white">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-zinc-950/40 p-12 text-center">
            <p className="text-sm text-zinc-500">
              Routing receipts and payout history will stream in here once the
              Franklin plugin is wired up.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, address, isConnecting, isReconnecting } = useAccount();

  // While wagmi is rehydrating from cookies, render nothing rather than flashing
  // the "connect" screen for users who are already connected.
  if (isConnecting || isReconnecting) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-500">Loading wallet…</div>
      </div>
    );
  }

  if (!isConnected || !address) return <Disconnected />;
  return <ConnectedDashboard address={address} />;
}
