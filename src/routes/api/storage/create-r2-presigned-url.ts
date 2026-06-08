import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';
import { getStorage } from '@/modules/storage/service';
import {MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS} from "@/core/storage";

const PRESIGNED_URL_SCOPE_PREFIXES = {
    'image-describer-temp': 'image-describer-temp',
} as const;

const createR2PresignedUrlSchema = z.object({
    operation: z.enum(['get', 'put', 'head', 'delete']).optional(),
    scope: z.enum(['image-describer-temp']).optional(),
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
        return Response.json(
            { success: false, error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const parsed = createR2PresignedUrlSchema.safeParse(payload);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: parsed.error.message },
            { status: 400 }
        );
    }

    try {
        const storageService = await getStorage();
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

        return Response.json({
            success: true,
            data: presignedUrl,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create presigned URL',
            },
            { status: 500 }
        );
    }
}

export const Route = createFileRoute('/api/storage/create-r2-presigned-url')({
    server: {
        handlers: { POST },
    },
});