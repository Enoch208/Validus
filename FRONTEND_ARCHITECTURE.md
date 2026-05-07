# BountyRoute: Frontend Architecture & Design System

## 1. Tech Stack & Sourcing
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS v4
* **Base Components:** [HeroUI](https://www.heroui.com/) (formerly NextUI). Use this for complex accessible elements (Tabs, Modals, Tables) to save time, but override their default themes with our strict dark mode rules.
* **Icons:** Hugeicons React (`hugeicons-react`). Stroke width strictly set to `1.5` for a thin, technical feel.
* **Animations:** Framer Motion (`framer-motion`).
* **Utility:** `clsx` and `tailwind-merge` (standard `cn()` utility function for merging classes).

---

## 2. File Structure (The DRY Principle)
Do not dump everything into `page.tsx`. Keep the app modular so you can swap states instantly.

```text
src/
├── app/
│   ├── layout.tsx         # Global fonts and providers (HeroUIProvider)
│   ├── page.tsx           # The SPA container (manages the 3 states)
│   └── globals.css        # Tailwind config and CSS variables
├── components/
│   ├── ui/                # Dumb, reusable atoms (Buttons, Cards, Badges)
│   ├── features/          # Smart components (TimelineReplay, PayoutReceipt)
│   └── layout/            # Wrappers (Navbar, MainContainer)
├── lib/
│   └── utils.ts           # Contains the cn() tailwind-merge function
└── styles/
    └── fonts.ts           # Next/font exports for Fraunces and Satoshi
```

---

## 3. Design System & Tokens

### Typography
* **Display / Brand:** `Fraunces` (Used ONLY for the Logo, Main Page Headers, and massive numbers).
* **Body / Data / Logs:** `Satoshi` (Used for everything else. Very crisp at small sizes).
* **Rule:** Never use Fraunces below `text-2xl`. Never use Satoshi for the main app logo.

### The "Deep Space" Web3 Color Palette
Do not use Tailwind's default `#000000`. It is too harsh.
* **Background (App):** `bg-zinc-950` or a custom `#0A0A0B`.
* **Background (Cards):** `bg-zinc-900/50` with a backdrop blur (`backdrop-blur-md`).
* **Borders:** Subtle separation is key. Use `border border-white/5` or `border-zinc-800`.
* **Gradients (Background):** Done strictly via CSS, not images.
    * *Example CSS:* `bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950`
* **Success / Payout:** Terminal Green (`text-emerald-400`). Not neon.

### Shadows & Depth (The Premium Feel)
Web3 dashboards feel premium because of *inner depth* and *glows*, not drop shadows.
* **Elevated Cards:** `shadow-2xl shadow-black/50`
* **Active States (The Routing Glow):** When a routing node is active, give it a colored glow: `shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/50`.

---

## 4. Layout, Spacing & Padding Rules

* **The 4-Point Grid:** Always use multiples of 4 for spacing (`gap-4`, `p-8`, `m-12`). Never use odd numbers like `p-3` or `m-5`.
* **Internal Padding (Cards):** Give data room to breathe. Minimum card padding is `p-6`. For important layout containers, use `p-8` or `p-12`.
* **Negative Space:** The "Connect Wallet" screen should be 80% empty space. Do not clutter the center.
* **Borders over Backgrounds:** Instead of making a card background drastically lighter to stand out, keep the background dark (`zinc-900/40`) and use a crisp `border-white/10` to define its edge.

---

## 5. Interaction & UX Rules

### Cursors & Clicking
* **Strict Pointers:** Any interactive element (cards, rows, buttons) MUST have `cursor-pointer`.
* **Disabled States:** If a PR is already paid, the button must be `opacity-50 cursor-not-allowed`.
* **Hover Lifts:** Interactive cards should have a microscopic lift: `transition-all duration-300 hover:-translate-y-1 hover:border-white/20`.

### Premium Animations (Framer Motion)
Never animate *everything*. Animate the entrance, and animate the data changes.

1.  **Page Load / Scroll Reveal:** Build a reusable `<FadeIn>` wrapper so you don't repeat motion code.
2.  **Staggered Lists:** When the "Pending PRs" load, they should cascade in (Row 1, then Row 2, then Row 3) using Framer Motion's `staggerChildren`.
3.  **The Routing Timeline:** This MUST NOT appear instantly. Use a timeline animation where the connecting vertical line "draws" downwards, lighting up the nodes as it goes.

---

## 6. Micro-Animation Standards

These are the rules every motion choice must obey. If a value isn't on this list, you're probably reaching for it because it "looks fine" — pick from the list instead.

### Duration tokens (use these exact values)
| Token       | Duration | Use for                                                  |
|-------------|----------|----------------------------------------------------------|
| `instant`   | 100ms    | Tap/active feedback (button press, row select)           |
| `micro`     | 150ms    | Hover state changes (border, background, color shift)    |
| `standard`  | 300ms    | Card lifts, opacity fades, secondary transitions         |
| `entrance`  | 500ms    | Element enters viewport (FadeIn, scroll reveal)          |
| `narrative` | 800ms+   | The Routing Timeline draw, payout receipt reveal         |

Anything between these values is forbidden — consistency is what makes it feel designed.

### Easing
* **Default (entrances, exits):** `[0.22, 1, 0.36, 1]` — "ease-out-quart". Confident in, soft landing.
* **UI feedback (hover, tap):** `easeOut` (built-in) at `micro` duration.
* **Spring (drag, layout shifts):** `{ type: "spring", stiffness: 400, damping: 30 }`. Never use the Framer Motion default spring — it overshoots too much.
* **Linear is banned** except for infinite loops (spinners, shimmer, pulse).

### What you may animate
Only `transform` (translate, scale, rotate) and `opacity`. These are GPU-composited and stay 60fps.

**Banned in animations:** `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`. If you need to animate size, use `scale` or Framer Motion's `layout` prop (which does the FLIP for you).

### Hover & tap micro-interactions
* **Buttons:** `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}` with `transition={{ duration: 0.15 }}`.
* **Cards (interactive):** translate + border shift, never scale. See `GlassCard` interactive variant.
* **Icons inside buttons:** `whileHover` translate-x by 2px for "go forward" affordance (arrow buttons, links).
* **Focus rings:** Always visible, never animated away. Use `focus-visible:ring-2 focus-visible:ring-blue-500/50`.

### Stagger
* **List item delay:** `0.05s` between children. Faster feels nervous, slower feels sluggish.
* **Cap stagger at 8 items.** Beyond that, the last items appear too late — switch to a single fade for the rest of the list, or virtualize.

### Data & state changes
* **Number counters:** Use Framer Motion's `animate()` with `useMotionValue` — never `setInterval`. Duration `standard` (300ms).
* **Optimistic UI:** Apply the new state instantly with opacity 0.6 → 1 over `micro`. Don't make the user wait for the network to see their click.
* **AnimatePresence:** Required for any element that mounts/unmounts conditionally (modals, toasts, route panels). Always set a `key`.
* **Layout shifts:** Use Framer Motion `layout` prop on the parent, not manual height animations.

### Live / status indicators
* **Pulse (active node, "live" pill):** `animate={{ opacity: [0.4, 1, 0.4] }}` with `duration: 2s, repeat: Infinity, ease: "easeInOut"`. Never faster.
* **Shimmer (skeleton loading):** Linear gradient sliding left-to-right over `1.5s`, `repeat: Infinity`.
* **The Routing Glow:** When a node activates, glow ramps in over `300ms` then settles — do not pulse the glow itself, the pulse is on the inner dot only.

### Page-level
* **Route transitions:** `<FadeIn>` wraps the page root. `opacity 0 → 1` over `entrance` (500ms), no translate. Translate on full-page transitions causes layout jitter on slow devices.
* **First paint:** Hero/headline animates in on mount. Below-fold content uses scroll-triggered `useInView` with `once: true`.

### Accessibility (non-negotiable)
* Wrap every motion component to respect `prefers-reduced-motion: reduce`. Use Framer Motion's `useReducedMotion()` hook and collapse to opacity-only fades (no transform, no stagger).
* Never put critical information *only* in animation (e.g., "the glowing node is the active one" — also set `aria-current="step"`).

### Performance budget
* No more than **3 simultaneous Framer Motion components animating** at once on a page. Stagger guarantees this for lists; for everything else, audit by hand.
* Use `will-change: transform` only on elements actively animating, never as a default.
* Heavy `backdrop-blur` + animated transform = jank on Safari. If a glass card is moving (drag, layout), drop the blur during the animation and restore on settle.

---

## 6.5. Handling AI-Generated Illustrations (Mandatory)

AI image models (Flux, Imagen, Midjourney transparent mode, etc.) commonly produce two failure modes that wreck card layouts. Both must be fixed at asset-prep time, not in CSS.

### A. Fake transparency
Models often paint a checker pattern as **literal pixels** instead of producing a real alpha channel. Verify before trusting:

```bash
magick identify -format "Channels:%[channels] | Alpha:%A\n" image.png
# Want: srgba 4.0 | Alpha: Blend
# If: srgb 3.0 | Alpha: Undefined → no alpha, run flood-fill to remove bg
```

If alpha is missing, flood-fill from the corner with the bg color:

```bash
magick image.png -alpha set -bordercolor 'srgb(R,G,B)' -border 1 \
  -fuzz 8% -fill none -floodfill +0+0 'srgb(R,G,B)' \
  -shave 1x1 -trim +repage out.png
```

This only removes pixels *connected* to the corner — white highlights *inside* the illustration are safe.

### B. Phantom edge content (the canvas-padding trap)
Even with real alpha, models often render barely-visible stardust/wisps/glow particles across the entire canvas. These have non-zero alpha (~1-15%) so `magick -trim` won't remove them — and the card displays a tiny illustration centered in a huge canvas of "empty" space. Symptom: one card's illustration looks tiny while another fills the card.

Always alpha-threshold *before* trimming:

```bash
magick image.png \
  -channel A -level 20%,100% +channel \
  -trim +repage \
  -strip out.png
# Then compress with pngquant for final size
pngquant --quality=80-95 --speed=1 --strip --force --output out.png out.png
```

`-channel A -level 20%,100%` zeroes out alpha < 20% (the invisible particles) while preserving soft edges (the actual glow halos around the illustration). Then `-trim` finds the true content bbox.

Verify the bbox tightened:

```bash
magick identify -format "%@" image.png
# Should match the canvas size (Wx H+0+0). If smaller, your trim is incomplete.
```

### C. Display sizing rule
Source images for illustrations come at wildly different aspect ratios (a wide flow diagram vs. a square cube). **Always render them inside a fixed-height container** with `object-contain`, not at natural aspect. This guarantees consistent visual weight across a grid:

```tsx
<div className="flex h-44 items-center justify-center sm:h-52">
  <Image src={...} className="max-h-full w-auto object-contain" />
</div>
```

Never use `w-full h-auto` on a grid of illustrations — it lets each card scale to its source aspect, producing a chaotic visual rhythm.

---

## 7. Code Structure: The Reusable Component Pattern

To avoid repeating long Tailwind strings, use this exact pattern for all UI components. Create a `lib/utils.ts` file with this function:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Example of a perfectly structured, reusable Web3 Card component:**

```tsx
// src/components/ui/GlassCard.tsx
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean; // If true, adds hover effects
}

export function GlassCard({ children, className, interactive = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-6 overflow-hidden",
        "shadow-2xl shadow-black/40",
        interactive && "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-zinc-800/40 hover:shadow-blue-900/10",
        className
      )}
      {...props}
    >
      {/* Optional: Subtle top-edge glare effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
```

### How to use HeroUI properly:
If you need a Table from HeroUI, import it, but wrap it in your dark mode rules. Do not use their default light/blue themes. Force it to be transparent so your `GlassCard` wrapper does the visual heavy lifting.

---

## Final Hackathon Checklist for Frontend:
- [ ] Are all font weights intentional? (Fraunces = Medium/SemiBold, Satoshi = Regular/Medium).
- [ ] Is there too much color? (Dial it back. 90% monochrome grayscale, 10% electric blue/green for emphasis).
- [ ] Does every button feel "clickable"? (Check padding, hover states, and cursors).
- [ ] Is the timeline animation smooth? (This is the money shot).
- [ ] Do all motions use a duration token from §6? (No magic numbers.)
- [ ] Does `prefers-reduced-motion` collapse animations to opacity-only?
