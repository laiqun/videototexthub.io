import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getDbConfigs } from '@/modules/config/service';

async function handle(request: Request) {
  try {
    const configs = await getDbConfigs();
    const auth = getAuth(configs);
    return auth.handler(request);
  } catch (error: any) {
    console.error('[auth] handler error:', error?.message || error);
    if (error?.stack) console.error('[auth] stack:', error.stack);
    return new Response(
      JSON.stringify({
        code: -1,
        message: error?.message || 'Internal server error',
      }),
      {
        status: error?.status || error?.statusCode || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
