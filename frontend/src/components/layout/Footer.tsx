import Image from "next/image";
import Link from "next/link";
import {
  GithubIcon,
  DiscordIcon,
  NewTwitterIcon,
  TelegramIcon,
} from "hugeicons-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Routing", href: "#routing" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "Plugin SDK", href: "#sdk" },
      { label: "FAQ", href: "#faq" },
      { label: "Changelog", href: "#changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Apache-2.0 License", href: "#license" },
      { label: "Terms of Use", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Risk Disclosure", href: "#risk" },
    ],
  },
];

const SOCIALS = [
  { Icon: NewTwitterIcon, href: "https://x.com", label: "X" },
  { Icon: GithubIcon, href: "https://github.com", label: "GitHub" },
  { Icon: DiscordIcon, href: "https://discord.com", label: "Discord" },
  { Icon: TelegramIcon, href: "https://telegram.org", label: "Telegram" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 cursor-pointer">
              <Image
                src="/assets/logo.png"
                alt="Validus"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight text-white">
                Validus
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              A Franklin plugin that audits open-source bounty PRs across
              smart-routing tiers and signs USDC payouts on Base.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-300 transition-colors duration-150 hover:text-white cursor-pointer"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright + socials */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © 2026 Validus. Apache-2.0 licensed.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors duration-150 hover:bg-white/5 hover:text-white cursor-pointer"
              >
                <Icon size={16} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Massive wordmark watermark — gradient-faded so it acts as a brand stamp */}
      <div
        aria-hidden
        className="relative mt-12 select-none overflow-hidden"
      >
        <div
          className="font-[family-name:var(--font-fraunces)] text-center font-semibold leading-[0.85] tracking-tight"
          style={{
            fontSize: "clamp(6rem, 24vw, 22rem)",
            background:
              "linear-gradient(to bottom, rgba(99,102,241,0.32) 0%, rgba(99,102,241,0.18) 35%, rgba(99,102,241,0.04) 70%, transparent 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            paddingBottom: "0.04em", // tiny padding so descenders aren't clipped by the bg-clip
          }}
        >
          Validus
        </div>
      </div>
    </footer>
  );
}
