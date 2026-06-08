export function getCloudflareEnv<T extends object = Record<string, unknown>>() {
  const g = globalThis as any;
  const env = g.__CF_ENV__ ?? g.__env__;
  if (!env) {
    throw new Error(
      'Cloudflare Worker bindings not found. This code only works inside a Cloudflare Worker runtime.'
    );
  }

  return env as T;
}
