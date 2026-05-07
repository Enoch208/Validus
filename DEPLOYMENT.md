# Deployment guide

Two pieces deploy separately:

| Piece | Where | Why |
|---|---|---|
| **Frontend** ([frontend/](frontend/)) | Vercel | Static-friendly, edge-cached, free tier covers a hackathon demo |
| **Plugin server** ([plugin/server/](plugin/server/)) | VPS (DigitalOcean / Hetzner / Fly / your box) | Vercel can't run long-lived processes (Franklin spawns + waits for LLM calls) |

The frontend's `/api/review` route proxies to the VPS. Receipts the plugin writes on the VPS are served by `/api/receipts` *on the VPS-side* (in production), or read from a synced directory on Vercel (for dev).

---

## Part 1 — Frontend (Vercel)

```bash
# From repo root
cd frontend

# Optional but useful: install Vercel CLI
npm i -g vercel

# First-time deploy
vercel

# Production deploy
vercel --prod
```

Or use the Vercel UI: connect the GitHub repo, set the **Root Directory** to `frontend/`, deploy.

### Required environment variables

In Vercel project settings → Environment Variables:

| Variable | Value | Where used |
|---|---|---|
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | from [cloud.reown.com](https://cloud.reown.com) | Wallet connect |
| `VALIDUS_API_URL` | `https://validus.yourdomain.com` | `/api/review` proxy target |
| `VALIDUS_API_TOKEN` | shared secret (see Part 2) | `/api/review` Bearer auth |

After deploy, redeploy once after env vars are set, otherwise they don't take effect.

### Vercel tier notes

The `/api/review` route blocks for ~20 seconds while the VPS runs Franklin. Vercel function timeouts:

- Hobby tier: **10 seconds** — too short, will timeout
- Pro tier: **60 seconds** (we cap at 58s in code)

So **deploy on Pro** if you want the live review form to work, or accept the timeout and tell users to use the CLI directly.

---

## Part 2 — VPS (the plugin server)

This guide assumes Ubuntu 22.04+ and `apt`. Adapt as needed.

### Step 1 — Provision

A $5/month box is enough. Recommend Hetzner CX11, DigitalOcean Basic, or Fly.io machine.

### Step 2 — Create a user, install Node + Franklin

```bash
# As root
adduser --disabled-password --gecos "" validus
usermod -aG sudo validus  # optional
su - validus

# Install Node 20+ (using nvm, but apt or fnm works too)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20

# Install Franklin globally — no signup, no API key
npm install -g @blockrun/franklin
franklin --version
```

### Step 3 — Clone Validus and link the plugin

```bash
cd ~
git clone https://github.com/your-org/validus.git Validus
cd Validus/plugin
npm install
ln -sfn "$(pwd)" ~/.blockrun/plugins/validus

# Verify
franklin plugins
# → validus     Reviews open-source bounty PRs across smart-routing tiers...
```

### Step 4 — Pre-warm the workflow config

The server writes this on each request, but seeding it once avoids first-run weirdness:

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
  "freeOnly": true
}
EOF
```

### Step 5 — Generate secrets

```bash
# Shared secret — copy this into BOTH the systemd unit AND Vercel's env
openssl rand -hex 32
```

### Step 6 — Install the systemd unit

```bash
# Edit the unit file with your paths and secret
nano ~/Validus/plugin/server/validus.service

# Update these lines:
#   WorkingDirectory=/home/validus/Validus/plugin
#   Environment=PATH=/home/validus/.nvm/versions/node/v20.18.0/bin:/usr/local/bin:/usr/bin
#   Environment=ALLOWED_ORIGIN=https://your-dashboard.vercel.app
#   Environment=VALIDUS_AUTH_TOKEN=<the secret you generated>
#   ExecStart=/home/validus/.nvm/versions/node/v20.18.0/bin/node /home/validus/Validus/plugin/server/index.mjs

sudo cp ~/Validus/plugin/server/validus.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now validus
sudo systemctl status validus
```

Confirm it's listening:

```bash
curl http://localhost:4000/health
# → {"ok":true,"version":"0.1.0"}
```

### Step 7 — Reverse proxy + HTTPS (Caddy)

Caddy gives you HTTPS with one line. Install:

```bash
sudo apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:

```caddyfile
validus.yourdomain.com {
    reverse_proxy 127.0.0.1:4000
}
```

Reload:

```bash
sudo systemctl reload caddy
```

Caddy automatically requests a Let's Encrypt cert. Verify:

```bash
curl https://validus.yourdomain.com/health
# → {"ok":true,"version":"0.1.0"}
```

### Step 8 — Wire to Vercel

In Vercel → project → Environment Variables:

```
VALIDUS_API_URL    = https://validus.yourdomain.com
VALIDUS_API_TOKEN  = <the secret from Step 5>
```

Redeploy. Open the dashboard, paste a public PR URL, click Review PR. ~20 seconds later the receipt appears.

---

## Hardening checklist (if anyone other than you uses this)

- [ ] **Rate-limit the VPS** — add fail2ban or a Caddy-level rate limit on `/review`
- [ ] **Cap concurrent runs** — already serialized to 1 at a time in the server code
- [ ] **Lock down `/api/review`** to authenticated wallet sessions (currently open to anyone with the public dashboard URL)
- [ ] **Rotate `VALIDUS_AUTH_TOKEN`** if it ever leaks to a public repo
- [ ] **Set `GITHUB_TOKEN`** on the VPS to avoid 60-req/hr rate limits
- [ ] **Monitor `journalctl -u validus`** for plugin failures or auth attempts
- [ ] For real payouts: wire `PAYOUT_PRIVATE_KEY` into the systemd unit and use a **dedicated** payout wallet, separate from your personal one

---

## Troubleshooting

**`502 Bad Gateway` from Caddy**
Server isn't running. `sudo systemctl status validus` and check logs with `journalctl -u validus -n 50`.

**Server starts but `/review` returns "no_receipt_emitted"**
Plugin ran but didn't write a receipt — usually means the workflow aborted early. Check the `log` field in the response for the franklin stdout tail.

**`/review` returns "pr_not_found" for a PR you can see in your browser**
Repo is private, GitHub thinks the PR doesn't exist (typo?), or Validus's outbound IP is rate-limited. Set `GITHUB_TOKEN` on the VPS for higher limits.

**Vercel `/api/review` times out at 58s**
Either the VPS is overloaded (queue depth > 0 — check if another review is in flight) or Franklin stalled mid-call. Check VPS logs.

**`HTTP 400: Unknown model: auto`**
Workflow config has `"models": { "free": "auto" }`. Use Franklin's actual model identifiers — see [plugin/README.md](plugin/README.md#troubleshooting).
