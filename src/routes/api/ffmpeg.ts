import { createFileRoute } from '@tanstack/react-router';
import { getCloudflareEnv } from '@/core/workers/env';
import {getRandom} from "@cloudflare/containers";

async function POST({ request }: { request: Request }) {
  try {
    const env = getCloudflareEnv<Env>();
    const container = await getRandom(env.FFMPEG_CONTAINER as any, 3);
    const response = await container.fetch(request);

    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

    return newResponse;
  } catch (error: any) {
    console.error('Container error:', error);
    return new Response(JSON.stringify({
      error: 'Container processing failed',
      details: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const Route = createFileRoute('/api/ffmpeg')({
  server: {
    handlers: { POST, OPTIONS },
  },
});
