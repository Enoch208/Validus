"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import type { ComponentProps } from "react";

interface ConnectButtonProps {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  /** Override the disconnected label (default: "Connect Wallet") */
  connectLabel?: string;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton({
  variant = "primary",
  size = "md",
  className,
  connectLabel = "Connect Wallet",
}: ConnectButtonProps) {
  const { open } = useAppKit();
  const { isConnected, address } = useAccount();

  const label = isConnected && address ? truncate(address) : connectLabel;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => open({ view: isConnected ? "Account" : "Connect" })}
    >
      {label}
    </Button>
  );
}
