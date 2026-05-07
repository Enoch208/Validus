# `@validus/plugin`

The Franklin plugin that does the actual work — review, route, sign payout.

## Install

```bash
# One-time: install Franklin globally (no signup, no API key)
npm install -g @blockrun/franklin

# Link this plugin into Franklin's discovery directory
cd plugin
npm install
ln -sfn "$(pwd)" ~/.blockrun/plugins/validus

# Verify
franklin plugins
# → validus     Reviews open-source bounty PRs across smart-routing tiers...
```

If `franklin plugins` doesn't show Validus, check:
- The symlink: `readlink ~/.blockrun/plugins/validus` should point to your plugin dir
- The manifest: `cat ~/.blockrun/plugins/validus/plugin.json` — Franklin reads `id`, `name`, `entry`, `provides.workflows`
- The entry: `node -e "import('./index.js').then(p => console.log(p.default.manifest))"` should print the manifest

---

## Configure

Two ways:

### (a) Pre-populate the config file (skips interactive onboarding)

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
  "prUrl": "https://github.com/your-org/your-repo/pull/42",
  "freeOnly": true
}
EOF
```

### (b) Run the interactive onboarding

```bash
franklin validus init
```

Asks for payout mode + per-payout cap. Stored at `~/.blockrun/workflows/review-pr.config.json`.

---

## Run

```bash
# Free-tier dry-run (zero spend, no on-chain interaction)
franklin validus run --dry

# Same but force every tier → free (skip x402 cheap/premium calls)
VALIDUS_FREE_ONLY=1 franklin validus run --dry

# Override the PR target without rewriting config
VALIDUS_PR_URL="https://github.com/foo/bar/pull/9" franklin validus run --dry

# Real testnet payout on Base Sepolia (requires PAYOUT_PRIVATE_KEY)
PAYOUT_PRIVATE_KEY=0xab... PAYOUT_MODE=testnet franklin validus run

# Mainnet — hard-capped at $5/payout
PAYOUT_PRIVATE_KEY=0xab... PAYOUT_MODE=mainnet franklin validus run
```

After each run, a JSON receipt lands at:

```
~/.blockrun/validus/receipts/<owner>_<repo>_<pr>.json
```

The Validus dashboard reads this directory and renders the receipts.

---

## Pipeline

| Step | Tier | Cost | What it does |
|---|---|---|---|
| 1. classify | `free` | $0.0001 | Bounty claim, feature, bug, or spam? |
| 2. scope | `cheap` | $0.0012 | Diff matches the linked issue? |
| 3. tests | `none` | $0.0021 | GitHub Actions check status (CI passed?) |
| 4. review | `cheap` | $0.0156 | Code & security audit — CLEAN/AMBIGUOUS/REJECT |
| 5. escalate | `premium` | $0.072 | **Only if step 4 ambiguous** — final call |
| 6. payout | `none` | $0 | USDC.transfer via viem (dry-run/testnet/mainnet) |

Costs are illustrative — actual per-step billing is done by Franklin's smart router via x402.

A clean PR usually skips step 5 → ~$0.019 total. The same review on always-Opus would run ~$1.10. **82–98% savings** depending on escalation behavior.

---

## Test

```bash
npm test
```

Runs 30 assertions covering:
- Plugin manifest + workflow shape
- 3 scenarios (clean approval, spam rejection, ambiguity escalation)
- `freeOnly` mode (every callModel uses `free` tier)
- GitHub fetcher (parser + mock-fetched PR + check status)
- Payout layer (dry-run shape + mainnet hard cap)

The test harness uses stubbed `ctx.callModel` — no Franklin runtime, no real LLMs. Fast, deterministic, runs in <1s.

---

## How the GitHub bits work

### PR fetching

Reads PR data via the public GitHub REST API (`/repos/{owner}/{repo}/pulls/{number}`). Auth is optional — set `GITHUB_TOKEN` for higher rate limits.

### Linked issue detection

Scans PR title + body for `closes #N`, `fixes #N`, `resolves #N`. Used by the scope-match step.

### Test result

Reads the latest **GitHub Actions check-runs** for the PR's head SHA. Replaces "run tests in a sandbox" — the contributor's CI ran them, we just verify it passed. Cleaner than spinning up Modal/Docker for the demo.

### Contributor address

Looked up from a comment on the PR matching:
```
validus-payout: 0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f
```

The contributor posts this comment as proof of ownership of the wallet. Maintainers can swap this for any auth scheme they prefer (linked GitHub-to-wallet registry, signed message, etc.).

### Bounty amount

Read from `bounties.json` at the repo root. Schema:
```json
[
  { "issue": 142, "amount": 5, "token": "USDC" }
]
```

Matched by the issue number referenced in the PR body (`fixes #142`).

---

## Troubleshooting

**`HTTP 400: Unknown model: auto`**
Your config has `"models": { "free": "auto" }`. Franklin doesn't recognize `auto` as a model literal. Use `nvidia/qwen3-coder-480b` for free/cheap and `anthropic/claude-sonnet-4.6` for premium (Franklin's `DEFAULT_MODEL_TIERS`).

**`Validus needs a PR to review — set $VALIDUS_PR_URL`**
Workflow's `beforeRun` couldn't hydrate PR data. Set `prUrl` in the config file or `VALIDUS_PR_URL` env var.

**Receipt is missing the `payout` block**
Workflow rejected or escalated to needs-human. Receipt is still written for the audit trail, but no payout signs unless `verdict === "approved"`.

**`Mainnet payout 10.00 USDC exceeds hard cap of $5`**
Working as intended — the hard cap is enforced in `src/payout.js`. Cannot be bypassed via config; you'd need to edit `MAINNET_HARD_CAP_USD` and rebuild.

---

## License

Apache-2.0
