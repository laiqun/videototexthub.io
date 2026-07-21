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

// --- In-memory fallback for local dev (no Cloudflare binding) ---

type MemoryKvEntry = {
  value: string;
  expiresAt?: number; // epoch ms
};

/**
 * Minimal in-memory KVNamespace-compatible store. Used only when the `KV`
 * binding is absent (local dev without `wrangler dev`). Data is per-process
 * and not shared across isolates — fine for quota testing, not production.
 */
function createMemoryKv(): KvBinding {
  const store = new Map<string, MemoryKvEntry>();

  const read = (key: string): string | null => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  return {
    get: (async (key: string) => read(key)) as KvBinding['get'],
    put: async (key, value, options) => {
      const expiresAt =
        options?.expirationTtl !== undefined
          ? Date.now() + options.expirationTtl * 1000
          : options?.expiration !== undefined
            ? options.expiration * 1000
            : undefined;
      store.set(key, { value: typeof value === 'string' ? value : String(value), expiresAt });
    },
    delete: async (key) => {
      store.delete(key);
    },
    list: async (options) => {
      const keys = [...store.keys()]
        .filter((name) => read(name) !== null)
        .filter((name) => !options?.prefix || name.startsWith(options.prefix))
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

// KV singleton instance
let kvInstance: KvBinding | null = null;
let memoryKvWarningShown = false;

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

  try {
    kvInstance = getKvBinding();
  } catch {
    if (!memoryKvWarningShown) {
      memoryKvWarningShown = true;
      console.warn(
        '[kv] KV binding "KV" not found — using in-memory KV fallback (local dev only; not persistent or shared).'
      );
    }
    kvInstance = createMemoryKv();
  }
  return kvInstance;
}
