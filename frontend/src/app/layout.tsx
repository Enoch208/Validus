import type { Metadata } from "next";
import { headers } from "next/headers";
import { fraunces, satoshi } from "@/styles/fonts";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Validus — Verify the work. Route the reasoning. Release the payout.",
  description:
    "A Franklin plugin that audits open-source bounty PRs across smart-routing tiers and signs USDC payouts on Base.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the cookie header on the server so wagmi can hydrate the wallet
  // connection state without a flash of disconnected UI.
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#08080d] text-zinc-100 flex flex-col">
        <WalletProvider cookies={cookies}>{children}</WalletProvider>
      </body>
    </html>
  );
}
