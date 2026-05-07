import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia, type AppKitNetwork } from "@reown/appkit/networks";

const rawProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!rawProjectId) {
  throw new Error(
    "NEXT_PUBLIC_REOWN_PROJECT_ID is not defined. Add it to .env.local."
  );
}

export const projectId: string = rawProjectId;

// Base mainnet first so AppKit defaults to it. Sepolia for dev/testnet payouts.
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  base,
  baseSepolia,
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
