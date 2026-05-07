# Validus

*Verify the work. Route the reasoning. Release the payout.*

A Franklin plugin that turns any open-source bounty board into an autonomous review-and-payout pipeline. A contributor submits a PR claiming a bounty. Validus audits it across Franklin's smart-routing tiers, runs the test suite, decides approve / reject, and — on approval — signs a USDC transfer from the maintainer's Franklin wallet to the contributor's address.

Built for the BlockRunAI Franklin Hackathon (May 6–12, 2026).

---

## The problem

Open-source maintainers want to pay bounties but can't justify the review overhead on small ones. A $20 bounty isn't worth 30 minutes of senior-dev time to verify, and most maintainers won't trust an unaudited junior to release the funds. So small bounties don't get posted, contributors don't get paid, and the long tail of OSS work stays unfunded.

Validus closes that loop. The plugin reviews PRs the way a senior maintainer would — checks scope, runs tests, audits diffs for quality and security — and only escalates to a human when it actually finds ambiguity. Below a threshold, it autonomously signs the payout. The maintainer wakes up to merged PRs and an on-chain receipt.

---

## What Validus actually does

When a contributor opens a PR claiming a bounty, the plugin runs a five-stage pipeline. Each stage uses a different Franklin routing tier, escalating only when needed.

```
PR submitted (with bounty claim)
        ↓
[Free tier]      Classify PR · validate bounty reference
        ↓
[Eco tier]       Scope match: does the diff address the issue?
        ↓
[Tool-only]      Clone repo · run test suite in sandbox
        ↓
[Auto tier]      Code quality · security · edge cases
        ↓
[Premium tier]   Escalate ONLY if auto flags ambiguity
        ↓
Verdict: approve / reject / needs-human
        ↓
If approve → USDC.transfer (Franklin wallet → contributor)
        ↓
Receipt: routing breakdown, costs, savings vs Opus-only, tx hash
```

The whole point: a typical clean PR never touches the premium tier. Total review cost is sub-cent. The same review on always-Opus would cost 50–80x more. That's the smart-routing showcase.

---

## Technical notes

**All LLM calls route through the Franklin harness.** Franklin's smart router picks the model per stage; nothing bypasses it. This is the core hackathon constraint and the core efficiency claim.

**The payout is a direct USDC.transfer on Base, not an x402 flow.** x402 is HTTP-native payment for agents calling paid APIs (which Franklin's review tiers use automatically). A peer-to-peer bounty payout is a vanilla ERC-20 transfer signed by Franklin's wallet — different protocol, same wallet.

**Three execution modes** for the payout layer:
- `dry-run`: logs the payload, no transaction
- `testnet`: signs and broadcasts on Base Sepolia
- `mainnet`: signs and broadcasts on Base, hard-capped at $5 per payout

**Sandbox compute** for test execution comes from BlockRun's runtime, isolating the contributor's code from the host machine.

---

## 7-day build plan

**Day 1 (May 6).** Read Franklin Plugin SDK. Scaffold `validus` plugin. Stub the review pipeline with mocked stages. Set up a demo repo with one open bounty defined in `bounties.json`.

**Day 2.** Wire the four review stages. Mocked verdict, real Franklin model calls. End-to-end happy path on a fake PR.

**Day 3.** Real test execution in BlockRun sandbox compute. Real verdicts from the auto/premium tiers. Generate the routing receipt JSON with tier breakdown and cost per stage.

**Day 4.** USDC payout layer. All three modes (dry-run, testnet, mainnet). Test each one. Hard wallet cap enforced.

**Day 5.** Dashboard in Next.js, deployed to Vercel. Shows per-PR routing breakdown, total review cost, savings vs always-Opus, payout history with Basescan links.

**Day 6.** Live test on Base mainnet. Post a real $5 bounty on a throwaway repo. Submit a PR from a second wallet. Run Validus end-to-end. Save the tx hash. If mainnet breaks for any reason, testnet is the demo fallback — no project-killing failure mode.

**Day 7.** Record 90-second demo video. Write README. Submit via Google Form. Post on X tagging @BlockRunAI, @FranklinRun_, @Cheetah_x0.

---

## The 90-second demo

1. **Maintainer dashboard.** One open bounty: *"Add CSV export — $5 USDC."*
2. **Terminal.** Contributor pushes PR claiming the bounty.
3. **Validus pipeline runs live.** Stream the routing decisions: free tier classifies, eco tier matches scope, tool runs tests, auto tier reviews. Premium tier doesn't trigger — clean PR.
4. **Verdict card:** ✓ APPROVED.
5. **Wallet signs USDC.transfer.** Tx broadcasts on Base mainnet.
6. **Cut to Basescan.** Tx confirmed in ~2 seconds.
7. **Final card.** Total review cost: $0.019. Savings vs always-Opus: 82%. Bounty paid: $5 USDC. Receipt: [tx hash].

---

## Submission deliverables

- **GitHub repo** — Apache-2.0 licensed plugin, README with install + usage, screenshots
- **Live dashboard** — Vercel URL showing real review history
- **Demo video** — 90 seconds, unedited terminal + Basescan
- **Tx hash** — at least one real Base mainnet payout, linked in the README
- **Google Form submission** — per hackathon rules
- **X post** — tagging the three accounts, with Basescan link inline

---

## Judging criteria coverage

| Criterion | How Validus scores |
|-----------|-------------------|
| Technical execution | Plugin architecture, not wrapper. Five-stage pipeline. Real sandbox compute. Real on-chain payout. |
| Innovation | First Franklin plugin that closes the loop on autonomous OSS funding. Solves a real maintainer problem. |
| Usability | One-command install. Plain `bounties.json` config. Public dashboard. Honest dry-run / testnet / mainnet modes. |
| Smart-routing efficiency | Four routing tiers used in one workflow. Receipt shows per-stage cost. Savings vs always-Opus quantified per review. |

---

## Stretch goals (only if Day 6 has time)

- `--scout` flag that scans Algora's public API and recommends bounties to the maintainer that match their repo's tech stack. Read-only, no auto-attempts. This is the only feature worth adding if everything else ships clean.

Anything beyond that is bloat. Don't ship two products.

---

## X post draft

> Built **Validus** for the @BlockRunAI Franklin Hackathon.
>
> Maintainer connects their bounty board → contributor submits a PR → Franklin audits across 4 routing tiers → on approval, the wallet signs a USDC payout autonomously.
>
> Reviewed a $5 bounty for $0.019. 82% savings vs always-Opus.
>
> On-chain proof: [Basescan link]
> Plugin: [GitHub link]
>
> @FranklinRun_ @Cheetah_x0

---

## Tech stack

- **Runtime:** Franklin (TypeScript, Apache-2.0)
- **Plugin layer:** Franklin Plugin SDK
- **Models:** routed automatically via Franklin smart router (free → eco → auto → premium)
- **Payments (API tier):** x402 via BlockRun gateway, automatic
- **Payments (bounty payout):** direct USDC.transfer on Base mainnet
- **Sandbox:** BlockRun isolated compute
- **Dashboard:** Next.js + Vercel
- **Storage:** local `~/.blockrun/` session data

---

## What Validus is not

Not a bounty hunter. Not a code generator. Not a Devin clone. Not a chat wrapper around Franklin. Not two products glued together.

One job, done well: validate the work and release the funds.
