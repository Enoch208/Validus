import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextResponse } from "next/server";
import type { BountyReceipt, ReceiptsResponse } from "@/lib/types/receipt";

// Receipts can come from one of three places, in priority order:
//   1. The VPS plugin server (production) — reachable via VALIDUS_API_URL
//   2. The local filesystem (dev) — when running the plugin on the same box
//   3. Mock receipts (only if VALIDUS_USE_MOCKS=1 is set, otherwise empty)
//
// Production deployments on Vercel always hit path 1; the local fs is
// ephemeral on serverless functions and would always return empty.

const RECEIPTS_DIR =
  process.env.VALIDUS_RECEIPTS_DIR ??
  path.join(os.homedir(), ".blockrun", "validus", "receipts");

const VPS_URL = process.env.VALIDUS_API_URL?.replace(/\/$/, "");
const VPS_TOKEN = process.env.VALIDUS_API_TOKEN;

export const dynamic = "force-dynamic";

async function readReceiptsFromVps(): Promise<BountyReceipt[] | null> {
  if (!VPS_URL) return null;
  try {
    const res = await fetch(`${VPS_URL}/receipts`, {
      headers: VPS_TOKEN ? { Authorization: `Bearer ${VPS_TOKEN}` } : {},
      // Short timeout — receipts read should be near-instant
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { receipts?: BountyReceipt[] };
    return data.receipts ?? [];
  } catch {
    // Network/timeout — fall through to filesystem fallback
    return null;
  }
}

async function readReceiptsFromDisk(): Promise<BountyReceipt[]> {
  try {
    const entries = await fs.readdir(RECEIPTS_DIR);
    const jsonFiles = entries.filter((f) => f.endsWith(".json"));
    if (jsonFiles.length === 0) return [];

    const receipts = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(RECEIPTS_DIR, file), "utf-8");
        return JSON.parse(raw) as BountyReceipt;
      })
    );
    return receipts.sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt)
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function GET() {
  // Path 1: VPS (production)
  const fromVps = await readReceiptsFromVps();
  if (fromVps !== null) {
    const body: ReceiptsResponse = { receipts: fromVps, source: "remote" };
    return NextResponse.json(body);
  }

  // Path 2: local filesystem (dev with plugin running on same box)
  const fromDisk = await readReceiptsFromDisk();
  if (fromDisk.length > 0) {
    const body: ReceiptsResponse = { receipts: fromDisk, source: "filesystem" };
    return NextResponse.json(body);
  }

  // Path 3: mocks ONLY if explicitly opted in via env. Otherwise empty.
  if (process.env.VALIDUS_USE_MOCKS === "1") {
    const { mockReceipts } = await import("@/lib/mock-receipts");
    const body: ReceiptsResponse = { receipts: mockReceipts, source: "mock" };
    return NextResponse.json(body);
  }

  const body: ReceiptsResponse = { receipts: [], source: "remote-empty" };
  return NextResponse.json(body);
}
