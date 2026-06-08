type KvGetType = 'text' | 'json' | 'arrayBuffer' | 'stream';

type KvValue = string | ArrayBuffer | ArrayBufferView | ReadableStream;

type KvPutOptions = {
  expiration?: number;
  expirationTtl?: number;
  metadata?: unknown;
};

type KvListOptions = {
  limit?: number;
  prefix?: string;
  cursor?: string;
};

type KvKey<Metadata = unknown> = {
  name: string;
  expiration?: number;
  metadata?: Metadata;
};

type KvListResult<Metadata = unknown> = {
  keys: Array<KvKey<Metadata>>;
  list_complete: boolean;
  cursor?: string;
};

// Minimal KVNamespace type to avoid pulling in @cloudflare/workers-types globally.
type KvBinding = {
  get(key: string): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  put(key: string, value: KvValue, options?: KvPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list<Metadata = unknown>(options?: KvListOptions): Promise<KvListResult<Metadata>>;
};

// KV singleton instance
let kvInstance: KvBinding | null = null;

/**
 * Resolve the KV binding named `KV` (see wrangler.jsonc `kv_namespaces`).
 *
 * On Cloudflare Workers the binding env is stashed on `globalThis.__CF_ENV__`
 * by the server entry (src/server.ts, via `cloudflare:workers`). Nitro's
 * cloudflare presets also expose it as `globalThis.__env__` — check both.
 */
function getKvBinding(): KvBinding {
  const g = globalThis as any;
  const env = g.__CF_ENV__ ?? g.__env__;
  const binding = env?.KV;
  if (!binding) {
    throw new Error(
      'KV binding "KV" not found. Configure `kv_namespaces` in wrangler.jsonc ' +
        'with a binding named "KV".'
    );
  }
  return binding as KvBinding;
}

export function getKv() {
  if (kvInstance) return kvInstance;

  kvInstance = getKvBinding();
  return kvInstance;
}
