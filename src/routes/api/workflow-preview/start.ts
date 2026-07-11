import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getUuid } from '@/lib/hash';
import { respData, respErr } from '@/lib/resp';
import { getCloudflareEnv } from '@/core/workers/env';

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

type WorkflowPreviewStartPayload = z.infer<typeof workflowPreviewStartSchema>;

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

  try {
    const env = getCloudflareEnv<Env & {
      VIDEO2TXT_WORKFLOW?: Workflow<WorkflowPreviewStartPayload>;
    }>();
    const workflowBinding = env.VIDEO2TXT_WORKFLOW;

    if (!workflowBinding) {
      return respErr(
        'Workflow binding "VIDEO2TXT_WORKFLOW" not found. Configure it in wrangler.jsonc.'
      );
    }

    const instance = await workflowBinding.create({
      id: `workflow-preview-${getUuid()}`,
      params: parsed.data,
    });

    return respData({
      ...parsed.data,
      instanceId: instance.id,
    });
  } catch (error) {
    console.error('Failed to start workflow preview:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to start workflow preview workflow';

    return respErr(message);
  }
}

export const Route = createFileRoute('/api/workflow-preview/start')({
  server: {
    handlers: { POST },
  },
});
