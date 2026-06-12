import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';
import { getStorage } from '@/modules/storage/service';
import {MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS} from "@/core/storage";
import { respData, respErr } from '@/lib/resp';

const PRESIGNED_URL_SCOPE_PREFIXES = {
    'image-describer-temp': 'image-describer-temp',
    'workflow-preview-temp': 'workflow-preview-temp',
} as const;

const createR2PresignedUrlSchema = z.object({
    operation: z.enum(['get', 'put', 'head', 'delete']).optional(),
    scope: z.enum(['image-describer-temp', 'workflow-preview-temp']).optional(),
    key: z.string().min(1).optional(),
    filename: z.string().min(1).optional(),
    contentType: z.string().min(1).optional(),
    expiresIn: z
        .number()
        .int()
        .min(1)
        .max(MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS)
        .optional(),
});

async function POST({ request }: { request: Request }) {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return respErr('Invalid JSON body');
    }

    const parsed = createR2PresignedUrlSchema.safeParse(payload);
    if (!parsed.success) {
        return respErr(parsed.error.message);
    }

    try {
        const storageService = await getStorage();
        if (!storageService) {
            return respErr('R2 storage is not configured');
        }

        const operation = parsed.data.operation || 'put';
        const prefix =
            operation === 'put' && parsed.data.scope
                ? PRESIGNED_URL_SCOPE_PREFIXES[parsed.data.scope]
                : undefined;
        const presignedUrl = await storageService?.createPresignedUrl({
            operation: parsed.data.operation,
            key: parsed.data.key,
            prefix,
            filename: parsed.data.filename,
            contentType: parsed.data.contentType,
            expiresIn: parsed.data.expiresIn,
        });

        return respData(presignedUrl);
    } catch (error) {
        return respErr(
            error instanceof Error
                ? error.message
                : 'Failed to create presigned URL',
        );
    }
}

export const Route = createFileRoute('/api/storage/create-r2-presigned-url')({
    server: {
        handlers: { POST },
    },
});
