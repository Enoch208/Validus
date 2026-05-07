# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains a single workspace at [frontend/](frontend/) — a Next.js 16.2.5 + React 19.2 + Tailwind v4 app using the App Router. There is no backend in this repo (yet).

All commands below must be run from [frontend/](frontend/).

## Commands

- `npm run dev` — start the dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (uses `eslint-config-next` core-web-vitals + typescript presets, configured in [frontend/eslint.config.mjs](frontend/eslint.config.mjs))

There is no test runner configured.

## Critical: Next.js version

Per [frontend/AGENTS.md](frontend/AGENTS.md):

> **This is NOT the Next.js you know.** This version (16.2.5) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

The bundled docs live at [frontend/node_modules/next/dist/docs/](frontend/node_modules/next/dist/docs/) — `01-app/` covers the App Router, `03-architecture/` covers internals. Consult these before assuming an API matches what you remember from older Next.js versions.

## Conventions

- TypeScript with `strict: true`; path alias `@/*` maps to [frontend/](frontend/) root (see [frontend/tsconfig.json](frontend/tsconfig.json)).
- Styling is Tailwind v4 via `@tailwindcss/postcss` (no `tailwind.config.js` — v4 is config-less by default; see [frontend/postcss.config.mjs](frontend/postcss.config.mjs) and [frontend/app/globals.css](frontend/app/globals.css)).
- Fonts are loaded via `next/font/google` in [frontend/app/layout.tsx](frontend/app/layout.tsx) and exposed as CSS variables. The current setup uses Geist; the design system below mandates **Fraunces** (display) + **Satoshi** (body) — replace before building product UI.

---

# Product: Validus

*Verify the work. Route the reasoning. Release the payout.*

A Franklin plugin that turns an open-source bounty board into an autonomous review-and-payout pipeline. Contributor submits a PR → Validus audits across Franklin's routing tiers (free → eco → auto → premium, escalating only on ambiguity) → runs tests in BlockRun sandbox → on approval, signs a USDC.transfer on Base from the maintainer's Franklin wallet to the contributor.

**Full spec, 7-day plan, demo script, and submission deliverables:** [GOAL.md](GOAL.md). Read this before scoping any work — it defines what's in and what's bloat.

Hard constraints to keep in mind on every change:
- **All LLM calls route through the Franklin harness.** Nothing bypasses the smart router — that's the core hackathon claim.
- **Payout = direct USDC.transfer on Base**, not x402. x402 is for the API-tier calls Franklin makes automatically.
- **Three payout modes:** `dry-run`, `testnet` (Base Sepolia), `mainnet` (Base, hard-capped at $5/payout).
- **Hackathon window:** May 6–12, 2026. Today is 2026-05-07 — Day 2.
- **One job:** validate the work, release the funds. The frontend (this repo) is the dashboard side of that — per-PR routing breakdown, total review cost, savings vs always-Opus, payout history with Basescan links. Not a chat UI, not a bounty browser.

The `--scout` Algora flag is the only stretch goal worth touching, and only if Day 6 has slack.

---

# Frontend Architecture & Design System

The full source-of-truth spec lives in [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md). Read it before writing UI. The rules below are non-negotiable summaries — when in doubt, defer to the full doc.

## Stack additions (not yet installed in package.json — install on first need)
- **Base components:** [HeroUI](https://www.heroui.com/) (formerly NextUI) for accessible primitives (Tabs, Modals, Tables). Force transparent / dark — never use their default themes.
- **Icons:** `hugeicons-react` with `strokeWidth={1.5}` always.
- **Animations:** `framer-motion`.
- **Class merging:** `clsx` + `tailwind-merge` exposed as `cn()` from `@/lib/utils`.

## Design tokens (the rules)

### Typography
- **Fraunces** — logo, page headers, massive numbers only. Never below `text-2xl`.
- **Satoshi** — everything else. Never use Satoshi for the logo.

### "Deep Space" palette
- App background: `bg-zinc-950` (or `#0A0A0B`). Never pure `#000`.
- Card background: `bg-zinc-900/40` + `backdrop-blur-xl`.
- Borders carry separation, not background lightness: `border-white/5` resting, `border-white/15` hover.
- Success: `text-emerald-400` (terminal green, not neon).
- Routing-active glow: `shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/50`.
- 90% monochrome grayscale, 10% electric blue/emerald for emphasis. If a screen feels colorful, it's wrong.

### Spacing — 4-point grid
Only multiples of 4 (`gap-4`, `p-8`, `m-12`). `p-3`, `m-5`, `gap-7` are forbidden. Card minimum padding `p-6`; layout containers `p-8`–`p-12`.

### Interactivity
- Every interactive element: `cursor-pointer`. Disabled: `opacity-50 cursor-not-allowed`.
- Card hover lift: `transition-all duration-300 hover:-translate-y-1 hover:border-white/20`.

## Micro-animation standards (non-negotiable)

Full table in [FRONTEND_ARCHITECTURE.md §6](FRONTEND_ARCHITECTURE.md#6-micro-animation-standards). The headline rules:

- **Duration tokens — only these values:** `100ms` (tap), `150ms` (hover), `300ms` (standard), `500ms` (entrance), `800ms+` (narrative). Anything in between is forbidden — magic numbers break perceived consistency.
- **Easing:** default `[0.22, 1, 0.36, 1]` (ease-out-quart) for entrances/exits; `easeOut` for hover/tap; spring `{ stiffness: 400, damping: 30 }` for layout/drag. Linear is banned except for infinite loops (spinners, pulse, shimmer).
- **Animatable properties:** `transform` and `opacity` only. Never animate `width`, `height`, `top/left`, `margin`, `padding`, `box-shadow`, `filter`. Use `scale` or Framer Motion's `layout` prop instead.
- **Stagger:** `0.05s` between list children, capped at 8 items — fade the rest in one go.
- **Buttons:** `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}` at 150ms.
- **Cards:** translate + border shift on hover, never scale.
- **AnimatePresence:** required for any conditional mount (modals, toasts, panels). Always set a `key`.
- **`prefers-reduced-motion`:** non-negotiable. Use `useReducedMotion()` to collapse to opacity-only fades — no transform, no stagger.
- **Performance:** ≤3 simultaneous Framer Motion components animating per page. `backdrop-blur` + animated transform = Safari jank — drop the blur during the motion.
- **Pulse:** `2s` minimum duration, `easeInOut`, infinite. Never faster than 2s — anything quicker reads as "broken" not "alive".
- **The Routing Timeline draw is the money shot.** Vertical line draws downward, lighting nodes as it passes. Use `narrative` duration. Don't ship it instant.

## Component pattern

All UI components use the `cn()` pattern (see [FRONTEND_ARCHITECTURE.md §7](FRONTEND_ARCHITECTURE.md#7-code-structure-the-reusable-component-pattern)). Reference implementation: `GlassCard` with an `interactive` prop. Don't repeat long Tailwind strings inline — extract to a `components/ui/` atom.

## File layout (target structure — current repo doesn't match yet)

```
src/
├── app/         # layout.tsx, page.tsx (the SPA container), globals.css
├── components/
│   ├── ui/        # dumb atoms (GlassCard, Button, Badge)
│   ├── features/  # smart components (TimelineReplay, PayoutReceipt)
│   └── layout/    # Navbar, MainContainer
├── lib/utils.ts  # cn() helper
└── styles/fonts.ts  # Fraunces + Satoshi exports
```

The current repo has files directly under `frontend/app/` with no `src/`. Migrate to the structure above before adding non-trivial UI.
