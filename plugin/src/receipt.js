/**
 * Receipt writer — emits BountyReceipt JSON to ~/.blockrun/validus/receipts/
 * matching the schema in frontend/src/lib/types/receipt.ts.
 *
 * The frontend's /api/receipts route reads this directory and renders the
 * dashboard. Keep the schema in lockstep — if you change a field here,
 * update the TS type too.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const DEFAULT_RECEIPTS_DIR = path.join(
  os.homedir(),
  ".blockrun",
  "validus",
  "receipts"
);

export function getReceiptsDir() {
  return process.env.VALIDUS_RECEIPTS_DIR ?? DEFAULT_RECEIPTS_DIR;
}

/**
 * Build a receipt filename from a PR id.
 * Slashes and `#` aren't filesystem-friendly; replace with `_`.
 */
function receiptFilename(id) {
  return `${id.replace(/[\/#]/g, "_")}.json`;
}

/**
 * Write a receipt to disk. Creates the directory if it doesn't exist.
 * Returns the absolute file path written.
 */
export async function writeReceipt(receipt) {
  const dir = getReceiptsDir();
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, receiptFilename(receipt.id));
  await fs.writeFile(file, JSON.stringify(receipt, null, 2), "utf-8");
  return file;
}
