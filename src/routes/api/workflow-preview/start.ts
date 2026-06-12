import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { respData, respErr } from '@/lib/resp';

const workflowPreviewStartSchema = z
  .object({
    sourceType: z.enum(['file', 'url']),
    sourceValue: z.string().min(1),
    objectKey: z.string().min(1).optional(),
    objectUrl: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === 'url') {
      const parsedUrl = z.string().url().safeParse(data.sourceValue);
      if (!parsedUrl.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid URL',
          path: ['sourceValue'],
        });
      }
    }
  });

async function POST({ request }: { request: Request }) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return respErr('Invalid JSON body');
  }

  const parsed = workflowPreviewStartSchema.safeParse(payload);
  if (!parsed.success) {
    return respErr(parsed.error.message);
  }

  return respData(parsed.data);
}

export const Route = createFileRoute('/api/workflow-preview/start')({
  server: {
    handlers: { POST },
  },
});
