# Validus

> *Verify the work. Route the reasoning. Release the payout.*

A [Franklin](https://franklin.run) plugin that audits open-source bounty PRs across smart-routing tiers and signs USDC payouts on Base. Built for the **BlockRunAI Franklin Hackathon (May 6–12, 2026)**.

**What it does:** Maintainer connects their bounty board → contributor submits a PR → Validus reviews it across smart-routing tiers (free → cheap → premium) → on approval, signs a USDC.transfer to the contributor on Base in ~2 seconds. Typical clean PR: **$0.019 in review cost** (vs. ~$1.10 on always-Opus = **82–98% savings**).

---

## What's in this repo

| Path | What |
|---|---|
| [frontend/](frontend/) | Next.js 16 marketing site + dashboard. Reown wallet connect, dashboard polls `/api/receipts` for live data |
| [plugin/](plugin/) | The Franklin plugin — workflow, GitHub fetcher, payout layer, tests |
| [examples/demo-bounty-template/](examples/demo-bounty-template/) | Drop-in template for setting up a demo bounty repo |
| [GOAL.md](GOAL.md) | Full hackathon spec, 7-day plan, demo script |
| [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) | Design system + frontend rules |

---

## Architecture

```
                                 ┌──────────────────────────┐
                                 │  GitHub PR opened        │
                                 │  with bounties.json      │
                                 └────────────┬─────────────┘
                                              │
                                              ▼
       ┌─────────────────── PLUGIN (~/.blockrun/plugins/validus) ───────────────────┐
       │                                                                            │
       │   1. classify    [free]    is this a bounty claim? spam?                   │
       │   2. scope       [cheap]   does the diff address the linked issue?         │
       │   3. tests       [none]    did the contributor's CI pass?                  │
       │   4. review      [cheap]   code quality / security audit                   │
       │   5. escalate    [premium] only if step 4 flagged ambiguity                │
       │   6. payout      [none]    USDC.transfer via viem (dry-run|testnet|main)   │
       │                                                                            │
       │   tier calls route through Franklin's smart router — x402 paid per action  │
       └──────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                          writes BountyReceipt JSON to
                          ~/.blockrun/validus/receipts/<id>.json
                                          │
                                          ▼
       ┌─────────────────── FRONTEND (Next.js, this repo) ──────────────────────────┐
       │                                                                            │
       │   /             Marketing landing page                                     │
       │   /dashboard    Wallet-gated dashboard (Reown), polls /api/receipts        │
       │   /api/receipts Reads ~/.blockrun/validus/receipts/, returns JSON          │
       └────────────────────────────────────────────────────────────────────────────┘
```

**Two separate codebases**, sharing the receipt JSON directory as the data bus. The frontend is read-only against receipts; the plugin is the single writer.

---

## Quick start

### 1. Install Franklin (one command, no signup, no API key)

```bash
npm install -g @blockrun/franklin
```

Franklin ships with **NVIDIA Nemotron + Qwen3 Coder out of the box**. Free tier works without any account.

### 2. Link the Validus plugin

```bash
git clone https://github.com/your-org/validus.git
cd validus/plugin
npm install
ln -sfn "$(pwd)" ~/.blockrun/plugins/validus

# Verify it loaded
franklin plugins
# → validus     Reviews open-source bounty PRs across smart-routing tiers...
```

### 3. Run a review (free tier, dry-run, no funds needed)

```bash
mkdir -p ~/.blockrun/workflows
cat > ~/.blockrun/workflows/review-pr.config.json <<'EOF'
{
  "name": "review-pr",
  "models": {
    "free": "nvidia/qwen3-coder-480b",
    "cheap": "nvidia/qwen3-coder-480b",
    "premium": "anthropic/claude-sonnet-4.6"
  },
  "payoutMode": "dry-run",
  "perPayoutCapUsd": 5,
  "prUrl": "https://github.com/facebook/react/pull/27000",
  "freeOnly": true
}
EOF

franklin validus run --dry
```

You should see:
```
[validus] Validus 0.1.0 loaded.
[review-pr] → classify... ($0.0001)
[review-pr] → scope...    ($0.0012)
...
[review-pr] Receipt written: ~/.blockrun/validus/receipts/facebook_react_27000.json
```

### 4. Run the dashboard

```bash
cd ../frontend
cp .env.example .env.local        # then fill in NEXT_PUBLIC_REOWN_PROJECT_ID
npm install
npm run dev
```

Open http://localhost:3000/dashboard, connect a wallet → you'll see the receipt the plugin just wrote.

---

## Three execution modes for the payout layer

| Mode | What it does | Wallet | Funds needed |
|---|---|---|---|
| `dry-run` | Logs the transfer payload, no chain interaction | None | $0 |
| `testnet` | Signs + broadcasts on Base Sepolia | `PAYOUT_PRIVATE_KEY` | Free Sepolia faucets |
| `mainnet` | Signs + broadcasts on Base, **hard-capped at $5/payout** | `PAYOUT_PRIVATE_KEY` | Real USDC + tiny ETH for gas |

The mainnet hard cap is enforced in code at [plugin/src/payout.js](plugin/src/payout.js#L20) — `MAINNET_HARD_CAP_USD`. Cannot be bypassed via config.

---

## Free-tier-only mode

For first-run validation without funding the Franklin wallet for x402 cheap/premium calls:

```bash
VALIDUS_FREE_ONLY=1 franklin validus run --dry
```

Or set `freeOnly: true` in the workflow config. Every step that would hit `cheap` or `premium` falls back to `free`. Tested on `facebook/react#27000` — full pipeline runs at zero spend.

---

## Hackathon deliverables (May 12, 2026)

- [x] Plugin scaffold (Apache-2.0)
- [x] Plugin contract verified against real Franklin runtime
- [x] End-to-end live test against `facebook/react#27000` — receipt written, dashboard rendered
- [x] Test harness: 30 assertions covering workflow, GitHub fetcher, payout layer, freeOnly mode
- [x] Marketing site + dashboard
- [x] Wallet connect via Reown AppKit (Base + Base Sepolia)
- [ ] Live deployment on Vercel
- [ ] Live $5 USDC payout on Base mainnet (Day 6)
- [ ] 90-second demo video (Day 7)
- [ ] Submission via Google Form + X post tagging @BlockRunAI

---

## What Validus is *not*

Not a bounty hunter. Not a code generator. Not a Devin clone. Not a chat wrapper around Franklin. Not two products glued together.

**One job, done well: validate the work and release the funds.**

---

## License

Apache-2.0. See [LICENSE](LICENSE).
