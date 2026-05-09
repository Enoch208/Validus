import { NextResponse } from "next/server";

// Proxy route: forwards the dashboard's review request to the Validus VPS server.
// We don't run franklin from Vercel (no long-running process support); the actual
// pipeline runs on the VPS and writes receipts there.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — Vercel Pro tier max

interface ReviewRequest {
  prUrl?: string;
  mode?: "dry-run" | "testnet" | "mainnet";
  freeOnly?: boolean;
  perPayoutCapUsd?: number;
}

export async function POST(req: Request) {
  const apiUrl = process.env.VALIDUS_API_URL;
  const apiToken = process.env.VALIDUS_API_TOKEN;

  if (!apiUrl) {
    return NextResponse.json(
      {
        error: "configuration",
        message:
          "VALIDUS_API_URL is not set on this deployment. Add the VPS URL to your environment.",
      },
      { status: 503 }
    );
  }

  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body.prUrl) {
    return NextResponse.json(
      {
        error: "pr_url_required",
        message: "Please provide a GitHub PR URL.",
      },
      { status: 400 }
    );
  }

  // Forward the request to the VPS. We default to mode=testnet so the
  // dashboard demo signs real Sepolia payouts (with real txHashes for the
  // video). Mainnet is still gated — accepted only if the request explicitly
  // asks for it AND the VPS will enforce its $5 hard cap regardless.
  //
  // For production: re-add stricter coercion (e.g. force testnet) once the
  // dashboard is gated by wallet auth or rate-limiting middleware. Right now
  // the form is open to anyone with the URL.
  const safeBody: ReviewRequest = {
    prUrl: body.prUrl,
    mode: body.mode ?? "testnet",
    freeOnly: body.freeOnly ?? false,
    perPayoutCapUsd: body.perPayoutCapUsd ?? 5,
  };

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      body: JSON.stringify(safeBody),
      // Vercel functions support up to 60s on Pro; the VPS run is ~20s typical
      signal: AbortSignal.timeout(58_000),
    });

    const data = await res.json().catch(() => null);
    if (!data) {
      return NextResponse.json(
        {
          error: "upstream_invalid",
          message: "Server returned an unparseable response.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "The review took too long to complete. The plugin may have stalled — try again."
        : "Couldn't reach the Validus server. It might be offline.";
    return NextResponse.json({ error: "network", message }, { status: 503 });
  }
}
