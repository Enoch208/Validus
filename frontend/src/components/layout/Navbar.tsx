import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#routing", label: "Routing" },
  { href: "#payouts", label: "Payouts" },
  { href: "#docs", label: "Docs" },
];

export function Navbar() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-6 lg:px-16">
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <Image
          src="/assets/logo.png"
          alt="Validus"
          width={32}
          height={32}
          className="h-8 w-8"
          priority
        />
        <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight text-white">
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

      <div className="flex items-center gap-3">
        <Button variant="ghost">View Demo</Button>
        <Button variant="primary">Connect Wallet</Button>
      </div>
    </nav>
  );
}
