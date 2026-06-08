type AiInputs = Record<string, unknown>;

type AiResult = Record<string, unknown> | unknown[] | string;

// Minimal Ai binding type to avoid pulling in @cloudflare/workers-types globally.
type AiBinding = {
  run(model: string, inputs: AiInputs): Promise<AiResult>;
};

// Workers AI singleton instance
let aiInstance: AiBinding | null = null;

/**
 * Resolve the Workers AI binding named `AI` (see wrangler.jsonc `ai`).
 *
 * On Cloudflare Workers the binding env is stashed on `globalThis.__CF_ENV__`
 * by the server entry (src/server.ts, via `cloudflare:workers`). Nitro's
 * cloudflare presets also expose it as `globalThis.__env__` — check both.
 */
function getAiBinding(): AiBinding {
  const g = globalThis as any;
  const env = g.__CF_ENV__ ?? g.__env__;
  const binding = env?.AI;
  if (!binding) {
    throw new Error(
      'Workers AI binding "AI" not found. Configure `ai` in wrangler.jsonc ' +
        'with a binding named "AI".'
    );
  }
  return binding as AiBinding;
}

/**
 * Connect to Cloudflare Workers AI
 * https://developers.cloudflare.com/workers-ai/
 */
export function getAi() {
  if (aiInstance) return aiInstance;

  aiInstance = getAiBinding();
  return aiInstance;
}
