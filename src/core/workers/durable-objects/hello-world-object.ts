import { DurableObject } from 'cloudflare:workers';

const HELLO_WORLD_TEXT = 'hello world';

export class HelloWorldDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(): Promise<Response> {
    console.log('[HelloWorldDurableObject] hello world');
    return new Response(HELLO_WORLD_TEXT, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }
}
