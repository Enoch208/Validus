import type { Metadata } from "next";
import { fraunces, satoshi } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Validus — Verify the work. Route the reasoning. Release the payout.",
  description:
    "A Franklin plugin that audits open-source bounty PRs across smart-routing tiers and signs USDC payouts on Base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#08080d] text-zinc-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
