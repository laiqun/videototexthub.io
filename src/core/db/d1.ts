import { drizzle } from 'drizzle-orm/d1';
type D1SessionConstraint = 'first-primary' | 'first-unconstrained';
type D1SessionBookmark = string;
type D1DatabaseSession = {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any[]>;
  getBookmark(): D1SessionBookmark | null;
};
// Minimal D1Database type to avoid pulling in @cloudflare/workers-types globally
type D1Database = {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any[]>;
  exec(query: string): Promise<any>;
  withSession(
      constraintOrBookmark?: D1SessionBookmark | D1SessionConstraint
  ): D1DatabaseSession;
  dump(): Promise<ArrayBuffer>;
};

// D1 singleton instance
let d1DbInstance: ReturnType<typeof drizzle> | null = null;
//这里的最小类型，是为了不让  @cloudflare/workers-types globally 影响全局
//如果引入了，每次 运行前都要生成一个 cf types；方便本地调试，不需要知道 cloudflare workers 的全部类型
/**
 * Resolve the D1 binding named `DB` (see wrangler.jsonc `d1_databases`).
 *
 * On Cloudflare Workers the binding env is stashed on `globalThis.__CF_ENV__`
 * by the server entry (src/server.ts, via `cloudflare:workers`). Nitro's
 * cloudflare presets also expose it as `globalThis.__env__` — check both.
 */
function getD1Binding(): D1Database {
  const g = globalThis as any;
  const env = g.__CF_ENV__ ?? g.__env__;
  const binding = env?.DB;
  if (!binding) {
    throw new Error(
      'D1 binding "DB" not found. DATABASE_PROVIDER=d1 only works on Cloudflare Workers ' +
        'with a d1_databases binding named "DB" in wrangler.jsonc.'
    );
  }
  return binding as D1Database;
}

export function createD1Db() {
  if (d1DbInstance) return d1DbInstance;

  const binding = getD1Binding();
  d1DbInstance = drizzle(binding);
  return d1DbInstance;
}
