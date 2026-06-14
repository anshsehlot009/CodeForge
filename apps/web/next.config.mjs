import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to the monorepo (avoids mis-detection from stray lockfiles).
  outputFileTracingRoot: repoRoot,
  // Workspace packages ship as TypeScript source; let Next transpile them.
  transpilePackages: ["@code-forge/core", "@code-forge/db"],
  // We lint the whole repo with `pnpm lint` (flat ESLint); skip Next's build-time lint.
  eslint: { ignoreDuringBuilds: true },
  // The workspace packages use NodeNext-style ".js" import specifiers; let webpack resolve
  // those to the real ".ts" sources.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
