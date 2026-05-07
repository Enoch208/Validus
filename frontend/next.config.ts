import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // wagmi's tempo connector has dynamic `import('accounts')` calls inside
    // try/catch — the runtime fallback works, but Turbopack tries to statically
    // resolve the module and fails. Aliasing to a local stub keeps the build
    // green; the runtime catch-handler still fires as expected.
    resolveAlias: {
      accounts: "./src/stubs/empty-module.ts",
    },
  },
};

export default nextConfig;
