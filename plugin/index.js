/**
 * Validus Franklin plugin entry point.
 *
 * Franklin loads `plugin.json` first (manifest), then this file. Default export
 * is the Plugin object containing workflow factories, channels, and commands.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createReviewPRWorkflow } from "./src/workflow.js";

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "plugin.json"), "utf-8")
);

const plugin = {
  manifest,

  workflows: {
    "review-pr": createReviewPRWorkflow,
  },

  commands: [
    {
      name: "validus",
      description:
        "Run a Validus review on a single PR (use --help for options).",
      options: [
        { flag: "--pr <url>", description: "GitHub PR URL to review" },
        { flag: "--dry-run", description: "Don't broadcast the payout" },
      ],
      async handler({ flags, ctx }) {
        ctx.log(
          "Validus CLI — pass a PR URL via --pr or run via the workflow runner."
        );
        ctx.log(`Flags: ${JSON.stringify(flags)}`);
      },
    },
  ],

  async onLoad(ctx) {
    ctx.log(
      `Validus ${manifest.version} loaded. Receipts → ${process.env.VALIDUS_RECEIPTS_DIR ?? "~/.blockrun/validus/receipts/"}`
    );
  },
};

export default plugin;
