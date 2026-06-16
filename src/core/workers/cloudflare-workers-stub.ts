/**
 * Local Node/Vite builds do not provide the Cloudflare runtime module
 * `cloudflare:workers`. Alias that specifier to this stub outside real
 * Cloudflare builds so Worker-only classes can still be parsed.
 */
export class DurableObject<TEnv = unknown> {
  readonly ctx: DurableObjectState;
  readonly env: TEnv;

  constructor(ctx: DurableObjectState, env: TEnv) {
    this.ctx = ctx;
    this.env = env;
  }
}
