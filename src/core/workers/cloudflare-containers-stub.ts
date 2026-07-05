export class Container {}

export function getRandom(_binding: unknown, _count: number) {
  throw new Error(
    '@cloudflare/containers is a Cloudflare Workers runtime binding. ' +
    'It is not available in local development environments.'
  );
}
