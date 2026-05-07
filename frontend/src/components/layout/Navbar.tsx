import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/wallet/ConnectButton";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#routing", label: "Routing" },
  { href: "#payouts", label: "Payouts" },
  { href: "#docs", label: "Docs" },
];

export function Navbar() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 py-5 sm:px-8 sm:py-6 lg:px-16">
      <Link href="/" className="flex min-w-0 items-center gap-2 cursor-pointer">
        <Image
          src="/assets/logo.png"
          alt="Validus"
          width={32}
          height={32}
          className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
          priority
        />
        <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Validus
        </span>
      </Link>

      <ul className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-white/85 transition-colors duration-150 hover:text-white cursor-pointer"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="hidden sm:block">
          <Button variant="ghost" size="sm" className="sm:px-5 sm:py-2.5">
            Launch App
          </Button>
        </Link>
        <ConnectButton
          size="sm"
          connectLabel="Connect"
          className="px-3 py-2 text-xs sm:hidden"
        />
        <div className="hidden sm:block">
          <ConnectButton size="sm" connectLabel="Connect Wallet" />
        </div>
      </div>
    </nav>
  );
}
