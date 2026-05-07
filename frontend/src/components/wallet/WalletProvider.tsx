"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import { wagmiAdapter, projectId, networks, wagmiConfig } from "@/lib/wagmi";

// AppKit's modal initializes once at module load. Doing it here (client-only)
// keeps the global registration tidy and avoids re-initializing per render.
const metadata = {
  name: "Validus",
  description: "Review the PR. Pay the contributor. Skip the babysitting.",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://validus.dev",
  icons: ["/icon.png"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: base,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
    swaps: false,
    onramp: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#6366f1",
    "--w3m-color-mix": "#6366f1",
    "--w3m-color-mix-strength": 12,
    "--w3m-border-radius-master": "8px",
    "--w3m-font-family":
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
});

interface WalletProviderProps {
  children: ReactNode;
  cookies?: string | null;
}

export function WalletProvider({ children, cookies }: WalletProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookies
    ? cookieToInitialState(wagmiConfig, cookies)
    : undefined;

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
