import { Fraunces, Inter } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Inter is a temporary stand-in for Satoshi (Satoshi isn't on Google Fonts).
// Swap by dropping Satoshi-Variable.woff2 into public/fonts and switching to next/font/local.
export const satoshi = Inter({
  subsets: ["latin"],
  variable: "--font-satoshi",
  display: "swap",
});
