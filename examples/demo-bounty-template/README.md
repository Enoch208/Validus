# Demo Bounty Repo Template

Copy these files into a fresh GitHub repo to make it Validus-ready.

```bash
mkdir my-bounty-repo && cd my-bounty-repo
cp /path/to/validus/examples/demo-bounty-template/* .
git init && git add . && git commit -m "init bounty repo"
gh repo create my-bounty-repo --public --source=. --push
```

Then:

1. **Open issues that match `bounties.json`** — `Issue #1: Add CSV export endpoint…` etc.
2. **Push the repo** so the Validus plugin can read `bounties.json` via the GitHub API.
3. **Wait for a contributor to open a PR** that says `closes #1` (or `fixes #1`).
4. **Have the contributor post a comment on their PR** with their payout wallet:
   ```
   validus-payout: 0x9E2bA3f0c8dEf7b34E0Fa19c6B3cA01dD5a401f
   ```
5. **Run Validus** from the maintainer's machine:
   ```bash
   VALIDUS_PR_URL=https://github.com/yourname/my-bounty-repo/pull/3 \
     franklin validus run --dry
   ```
6. **Check the receipt** at `~/.blockrun/validus/receipts/`, see it on the dashboard.

---

## What goes in `bounties.json`

```json
[
  {
    "issue": 1,
    "amount": 5,
    "token": "USDC",
    "chain": "base",
    "description": "human-readable summary"
  }
]
```

| Field | Required | Notes |
|---|---|---|
| `issue` | ✓ | GitHub issue number this bounty corresponds to |
| `amount` | ✓ | USDC amount (capped at $5 on Base mainnet by Validus) |
| `token` | optional | Default: `USDC`. Other ERC-20s not supported yet |
| `chain` | optional | `base` or `base-sepolia`. Default: `base` |
| `description` | optional | Free text — mostly for human readability |

The plugin matches a PR to a bounty by reading the issue number from the PR body's `closes #N` / `fixes #N` reference.

---

## What contributors need to know

Add a single comment to your PR with your Base address:

```
validus-payout: 0xYOUR_BASE_ADDRESS
```

That's it. When the maintainer's Validus run approves the PR, that wallet receives the USDC payout on Base.

If you don't post the comment, the plugin can't pay you and will return a `needs-human` verdict.
