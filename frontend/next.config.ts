import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server build (.next/standalone/server.js) — no nginx needed.
  output: 'standalone',
  // Pin the file-tracing root to this project (the repo has multiple lockfiles).
  outputFileTracingRoot: path.resolve(),
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
