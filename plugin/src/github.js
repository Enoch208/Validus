/**
 * GitHub PR fetcher — minimal REST client (no octokit dep).
 *
 * Reads:
 *   - PR metadata (title, body, diff stats, head sha)
 *   - Linked issue (parsed from PR body / branch name / issue numbers in title)
 *   - Combined check status for the head SHA — this replaces "run tests in a sandbox"
 *     for the hackathon demo. The contributor's CI ran the tests; we just verify it passed.
 *
 * Auth: optional GITHUB_TOKEN env var. Public repos work without it (lower rate limit).
 */

const API_BASE = "https://api.github.com";

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Validus-Franklin-Plugin",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function gh(pathname) {
  const res = await fetch(`${API_BASE}${pathname}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${pathname} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Parse a GitHub PR URL into { owner, repo, number }.
 * Accepts:
 *   https://github.com/owner/repo/pull/123
 *   github.com/owner/repo/pull/123
 *   owner/repo#123
 */
export function parsePrUrl(input) {
  if (!input) throw new Error("PR URL required");
  const url = String(input).trim();

  // owner/repo#NN shorthand
  const short = url.match(/^([^\/\s]+)\/([^\/\s#]+)#(\d+)$/);
  if (short) return { owner: short[1], repo: short[2], number: Number(short[3]) };

  const m = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (!m) throw new Error(`Not a GitHub PR URL: ${url}`);
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

/**
 * Fetch the PR shape Validus's workflow expects in `config.pr`.
 *
 * @param {string} prUrl  https://github.com/owner/repo/pull/N
 * @param {Object} [opts]
 * @param {(p: string) => Promise<any>} [opts.fetchImpl] Inject for testing
 */
export async function fetchPullRequest(prUrl, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? gh;
  const { owner, repo, number } = parsePrUrl(prUrl);

  const pr = await fetchImpl(`/repos/${owner}/${repo}/pulls/${number}`);

  // Linked issue heuristic: scan body for `closes #N`, `fixes #N`, `resolves #N`
  // and the PR's title. The body is used here ONLY for this scan — it is not
  // propagated into the return value (see note below the return).
  const bodyAndTitle = `${pr.title ?? ""}\n${pr.body ?? ""}`;
  const issueMatch = bodyAndTitle.match(
    /(?:closes|fixes|resolves)\s+#(\d+)/i
  );
  let issue;
  let issueNumber;
  if (issueMatch) {
    issueNumber = Number(issueMatch[1]);
    try {
      const i = await fetchImpl(`/repos/${owner}/${repo}/issues/${issueNumber}`);
      issue = `${i.title} (#${i.number})`;
    } catch {
      issue = `#${issueNumber} (couldn't fetch)`;
    }
  }

  // NOTE: pr.body is intentionally NOT returned. It's used above for the
  // closes/fixes scan, but we don't propagate it into config.pr / the receipt
  // — dependabot release notes etc. routinely add 30+ KB of HTML which bloats
  // every receipt without adding routing-decision value.
  return {
    repo: `${owner}/${repo}`,
    number,
    url: pr.html_url,
    title: pr.title ?? "",
    headSha: pr.head?.sha,
    diffStats: {
      changes: (pr.additions ?? 0) + (pr.deletions ?? 0),
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      filesChanged: pr.changed_files ?? 0,
      summary: `+${pr.additions ?? 0} -${pr.deletions ?? 0}, ${pr.changed_files ?? 0} files`,
    },
    issue,
    issueNumber,    // exposed so fetchBountyAmount doesn't need to re-scan the body
    author: pr.user?.login,
    state: pr.state, // "open" | "closed"
    merged: !!pr.merged,
  };
}

/**
 * Fetch combined check-runs status for a commit SHA.
 * Replaces "run tests in sandbox" — we trust the contributor's CI ran them.
 *
 * Returns:
 *   { passed: boolean, total, succeeded, failed, neutral, summary }
 */
export async function fetchCheckStatus(repo, headSha, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? gh;
  // GitHub returns a paginated list — we only care about the latest run per check
  const result = await fetchImpl(`/repos/${repo}/commits/${headSha}/check-runs?per_page=100`);

  const runs = result.check_runs ?? [];
  const total = runs.length;
  let succeeded = 0;
  let failed = 0;
  let neutral = 0;
  let pending = 0;

  for (const r of runs) {
    if (r.status !== "completed") {
      pending++;
      continue;
    }
    switch (r.conclusion) {
      case "success":  succeeded++; break;
      case "failure":
      case "timed_out":
      case "cancelled":
      case "action_required":
        failed++; break;
      case "neutral":
      case "skipped":
        neutral++; break;
      default:
        neutral++;
    }
  }

  const passed = total > 0 && failed === 0 && pending === 0;
  return {
    passed,
    total,
    succeeded,
    failed,
    neutral,
    pending,
    summary:
      total === 0
        ? "no CI configured"
        : `${succeeded}/${total} passed${failed ? `, ${failed} failed` : ""}${pending ? `, ${pending} pending` : ""}`,
  };
}

/**
 * Look up a contributor's wallet address. For the hackathon, we read it
 * from a comment on the PR matching: `validus-payout: 0x...` (case-insensitive).
 * Production: support a richer schema (e.g. linked GitHub-to-wallet registry).
 */
export async function fetchContributorAddress(repo, prNumber, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? gh;
  const comments = await fetchImpl(
    `/repos/${repo}/issues/${prNumber}/comments?per_page=100`
  );
  for (const c of comments) {
    const m = (c.body ?? "").match(/validus-payout:\s*(0x[a-fA-F0-9]{40})/i);
    if (m) return { address: m[1], source: `comment by ${c.user?.login}` };
  }
  return null;
}

/**
 * Read bountyUsd amount from a `bounties.json` at the repo root on the default branch.
 * Schema: [{ "issue": 142, "amount": 5, "token": "USDC" }, ...]
 *
 * The issue number is supplied directly (already parsed by fetchPullRequest) so
 * we don't need the PR body here.
 */
export async function fetchBountyAmount(repo, issueNumber, opts = {}) {
  if (!issueNumber) return null;
  const fetchImpl = opts.fetchImpl ?? gh;

  try {
    const file = await fetchImpl(`/repos/${repo}/contents/bounties.json`);
    if (!file.content) return null;
    const decoded = Buffer.from(file.content, "base64").toString("utf-8");
    const bounties = JSON.parse(decoded);

    const entry = bounties.find((b) => Number(b.issue) === Number(issueNumber));
    return entry ?? null;
  } catch {
    return null;
  }
}
