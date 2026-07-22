import {CompilerOptions, paraglideVitePlugin} from '@inlang/paraglide-js';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

import { loadEnvFiles } from './src/lib/env';

// Populate process.env from .env.local / .env.{NODE_ENV} / .env for the
// dev server and build process (Vite only exposes VITE_* via import.meta.env;
// server code reads secrets from process.env). In production, env comes
// from the actual host/container environment.
loadEnvFiles();

// Cloudflare Workers build (pnpm cf:build / cf:deploy): stub out unused DB
// drivers — mysql2 crashes workerd at module evaluation (node:net,
// node:process requires); postgres.js runs fine under nodejs_compat but is
// dead weight when the backend is D1. Which driver the bundle keeps follows
// wrangler.jsonc `vars.DATABASE_PROVIDER` (the runtime truth on workerd) —
// d1 stubs both, postgresql keeps postgres.js for the Hyperdrive binding.
const isCloudflareBuild = (process.env.NITRO_PRESET || '').includes('cloudflare');
const driverStub = new URL('./src/core/db/driver-stub.ts', import.meta.url).pathname;
const cloudflareWorkersShim = new URL(
  './src/core/workers/cloudflare-workers-shim.ts',
  import.meta.url
).pathname;


// Prefer wrangler.jsonc over the build-time env, which can be polluted by
// .env.local (e.g. DATABASE_PROVIDER=sqlite for local dev).
function workersDbProvider(): string {
  try {
    const raw = readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8');
    const m = raw.match(/"DATABASE_PROVIDER"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
  } catch {
    // no wrangler.jsonc yet (fresh clone) — fall through
  }
  return process.env.DATABASE_PROVIDER || 'd1';
}

const workersDb = isCloudflareBuild ? workersDbProvider() : '';
const keepPostgres = workersDb === 'postgresql' || workersDb === 'postgres';

export const paraglideOptions = {
  project: './project.inlang',
  outdir: './src/paraglide',
  outputStructure: 'message-modules',
  cookieName: 'PARAGLIDE_LOCALE',
  strategy: ['url', 'cookie', 'baseLocale'],
  urlPatterns: [
    // API endpoints are never locale-prefixed.
    {
      pattern: '/api/:path(.*)?',
      localized: [
        ['en', '/api/:path(.*)?'],
        ['zh', '/api/:path(.*)?'],
        ['es', '/api/:path(.*)?'],
        ['de', '/api/:path(.*)?'],
        ['fr', '/api/:path(.*)?'],
        ['ja', '/api/:path(.*)?'],
        ['ru', '/api/:path(.*)?'],
        ['pt', '/api/:path(.*)?'],
        ['pl', '/api/:path(.*)?'],
        ['nl', '/api/:path(.*)?'],
        ['it', '/api/:path(.*)?'],
      ],
    },
    // Bare locale homes match without a trailing-slash redirect.
    {
      pattern: '/',
      localized: [
        ['zh', '/zh'],
        ['es', '/es'],
        ['de', '/de'],
        ['fr', '/fr'],
        ['ja', '/ja'],
        ['ru', '/ru'],
        ['pt', '/pt'],
        ['pl', '/pl'],
        ['nl', '/nl'],
        ['it', '/it'],
        ['en', '/'],
      ],
    },
    // "as-needed" prefix: non-base locales under /<locale>, en (default) unprefixed.
    {
      pattern: '/:path(.*)?',
      localized: [
        ['zh', '/zh/:path(.*)?'],
        ['es', '/es/:path(.*)?'],
        ['de', '/de/:path(.*)?'],
        ['fr', '/fr/:path(.*)?'],
        ['ja', '/ja/:path(.*)?'],
        ['ru', '/ru/:path(.*)?'],
        ['pt', '/pt/:path(.*)?'],
        ['pl', '/pl/:path(.*)?'],
        ['nl', '/nl/:path(.*)?'],
        ['it', '/it/:path(.*)?'],
        ['en', '/:path(.*)?'],
      ],
    },
  ],
} as CompilerOptions;

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    rolldownOptions: isCloudflareBuild
      ? {
          external: ['cloudflare:workers'],
        }
      : undefined,
  },
  resolve: {
    tsconfigPaths: true,
    alias: isCloudflareBuild
      ? {
          mysql2: driverStub,
          ...(keepPostgres ? {} : { postgres: driverStub }),
        }
      : {
          'cloudflare:workers': cloudflareWorkersShim,
        },
  },
  plugins: [
    // MDX must run before the react plugin so JSX in compiled MDX gets transformed.
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    tailwindcss(),
    paraglideVitePlugin(paraglideOptions),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro(),
  ],
});
