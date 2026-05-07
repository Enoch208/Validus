import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextResponse } from "next/server";
import { mockReceipts } from "@/lib/mock-receipts";
import type { BountyReceipt, ReceiptsResponse } from "@/lib/types/receipt";

// The plugin writes one JSON file per PR here. Override with $VALIDUS_RECEIPTS_DIR
// for testing or for hosted deployments that mount a different path.
const RECEIPTS_DIR =
  process.env.VALIDUS_RECEIPTS_DIR ??
  path.join(os.homedir(), ".blockrun", "validus", "receipts");

export const dynamic = "force-dynamic";

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
    // Newest first by completedAt
    return receipts.sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt)
    );
  } catch (err) {
    // ENOENT = directory hasn't been created yet by the plugin. Treat as empty.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function GET() {
  const fromDisk = await readReceiptsFromDisk();

  if (fromDisk.length > 0) {
    const body: ReceiptsResponse = {
      receipts: fromDisk,
      source: "filesystem",
    };
    return NextResponse.json(body);
  }

  // Fallback to mocks while the plugin isn't writing yet — keeps the
  // dashboard alive in dev so we can iterate on the UI without the plugin running.
  const body: ReceiptsResponse = {
    receipts: mockReceipts,
    source: "mock",
  };
  return NextResponse.json(body);
}
