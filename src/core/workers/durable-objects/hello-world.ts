import { getCloudflareEnv } from '@/core/workers/env';

const HELLO_WORLD_INSTANCE = 'hello-world';

type HelloWorldDurableObjectStub = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type HelloWorldDurableObjectNamespace = {
  idFromName(name: string): unknown;
  get(id: unknown): HelloWorldDurableObjectStub;
};

export function getHelloWorldNamespace() {
  const env = getCloudflareEnv<Env>();
  const binding = env.HELLO_WORLD_DO as HelloWorldDurableObjectNamespace | undefined;
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
