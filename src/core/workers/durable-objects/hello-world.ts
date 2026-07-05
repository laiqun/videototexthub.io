import { getCloudflareEnv } from '@/core/workers/env';
import {DurableObject} from "cloudflare:workers";

const HELLO_WORLD_INSTANCE = 'hello-world';
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

export function getHelloWorldNamespace() {
  const env = getCloudflareEnv<Env>();
  const binding = env.HELLO_WORLD_DO;
  if (!binding) {
    throw new Error(
      'Durable Object binding "HELLO_WORLD_DO" not found. Configure it in wrangler.jsonc.'
    );
  }
  return binding;
}

export async function callHelloWorldDurableObject() {
  const namespace = getHelloWorldNamespace();
  const id = namespace.idFromName(HELLO_WORLD_INSTANCE);
  const stub = namespace.get(id);
  const response = await stub.fetch('https://hello-world-do/');
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `HelloWorldDurableObject request failed with ${response.status}: ${text || response.statusText}`
    );
  }

  return text;
}
