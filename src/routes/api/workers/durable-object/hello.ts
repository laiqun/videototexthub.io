import { createFileRoute } from '@tanstack/react-router';

import { callHelloWorldDurableObject } from '@/core/workers/durable-objects/hello-world';
import { respData, respErr } from '@/lib/resp';

async function GET() {
  try {
    const message = await callHelloWorldDurableObject();
    return respData({ message });
  } catch (error: any) {
    return respErr(error?.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/workers/durable-object/hello')({
  server: {
    handlers: { GET },
  },
});
