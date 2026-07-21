import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { envConfigs } from '@/config';
import { getAuth } from '@/core/auth';
import { getKv } from '@/core/kv/kv';
import { getCookieFromHeader } from '@/lib/cookie';
import { getAllConfigs } from '@/modules/config/service';
import { hasValidOneTimeProOrderAccess } from '@/modules/payment/service';
import { hasValidSubscriptionAccess } from '@/modules/subscriptions/service';

// Ported from the original aiimagedescriber.io Next.js route
// (src/app/api/describe-image/route.ts). Streams Gemini SSE events back to the
// client and enforces a KV-tracked daily quota for guests and signed-in
// non-Pro users.

const VISITOR_COOKIE_NAME = 'image_describer_uuid';
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

const imageSourceSchema = z
  .object({
    objectUrl: z.string().url().optional(),
    objectKey: z.string().min(1).optional(),
    filename: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.objectUrl || value.objectKey), {
    message: 'objectUrl or objectKey is required',
  });

const describeImageSchema = z.object({
  images: z.array(imageSourceSchema).min(1),
  prompt: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
  secondsUntilMidnight: z.number().int().optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  useDirectUrl: z.boolean().optional(),
});

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type StreamEvent =
  | { type: 'start'; objectUrl: string }
  | { type: 'chunk'; objectUrl: string; text: string }
  | { type: 'done'; objectUrl: string; text: string }
  | { type: 'error'; objectUrl: string; error: string }
  | { type: 'complete' };

const DEFAULT_FALLBACK_PROMPT = 'Please describe this image.';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const ERROR_CODES = {
  guestFreeQuotaExceeded: 'GUEST_FREE_QUOTA_EXCEEDED',
  signedInFreeQuotaExceeded: 'SIGNED_IN_FREE_QUOTA_EXCEEDED',
} as const;

const buildLanguageInstruction = (language: string) => {
  const normalized = language.trim();
  const instructionMap: Record<string, string> = {
    English: 'Respond in English.',
    中文: '请用中文回答。',
    Deutsch: 'Bitte antworte auf Deutsch.',
    Español: 'Por favor responde en español.',
    Français: 'Veuillez répondre en français.',
    日本語: '日本語で回答してください。',
    한국어: '한국어로 답변해주세요.',
    Nederlands: 'Antwoord alstublieft in het Nederlands.',
    Português: 'Por favor responda em português.',
    Русский: 'Пожалуйста, ответь по-русски.',
    Türkçe: 'Lütfen Türkçe yanıt verin.',
    Suomi: 'Vastaa suomeksi, kiitos.',
    Italiano: 'Per favore rispondi in italiano.',
    Indonesia: 'Mohon jawab dalam bahasa Indonesia.',
  };

  return instructionMap[normalized] || `Please respond in ${normalized}.`;
};

const buildPrompt = (prompt?: string, language?: string) => {
  const trimmedPrompt = prompt?.trim();
  const trimmedLanguage = language?.trim();

  if (trimmedPrompt) {
    return trimmedLanguage
      ? `${trimmedPrompt}\n\n${buildLanguageInstruction(trimmedLanguage)}`
      : trimmedPrompt;
  }

  if (trimmedLanguage) {
    return `Please describe this image.\n\n${buildLanguageInstruction(
      trimmedLanguage
    )}`;
  }

  return DEFAULT_FALLBACK_PROMPT;
};

const sanitizePathSegment = (value?: string) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (trimmed.includes('..')) {
    throw new Error('Invalid object path');
  }

  return trimmed;
};

const normalizeUploadPath = (value?: string) => {
  const trimmed = sanitizePathSegment(value || 'uploads');
  return trimmed || 'uploads';
};

const getR2Endpoint = (configs: Record<string, string>) => {
  if (configs.r2_endpoint) {
    return configs.r2_endpoint.replace(/\/$/, '');
  }

  if (configs.r2_account_id) {
    return `https://${configs.r2_account_id}.r2.cloudflarestorage.com`;
  }

  throw new Error('R2 endpoint or account ID is not configured');
};

const buildObjectUrl = ({
  endpoint,
  bucketName,
  uploadPath,
  key,
  publicDomain,
}: {
  endpoint: string;
  bucketName: string;
  uploadPath: string;
  key: string;
  publicDomain?: string;
}) => {
  const normalizedKey = sanitizePathSegment(key);

  if (publicDomain) {
    return `${publicDomain.replace(/\/$/, '')}/${uploadPath}/${normalizedKey}`;
  }

  return `${endpoint}/${bucketName}/${uploadPath}/${normalizedKey}`;
};

const resolveObjectUrl = ({
  objectUrl,
  objectKey,
  configs,
}: {
  objectUrl?: string;
  objectKey?: string;
  configs: Record<string, string>;
}) => {
  if (objectUrl) {
    return objectUrl;
  }

  if (!objectKey) {
    throw new Error('Image source is missing');
  }

  const bucketName = configs.r2_bucket_name || '';
  if (!bucketName) {
    throw new Error('R2 bucket name is not configured');
  }

  return buildObjectUrl({
    endpoint: getR2Endpoint(configs),
    bucketName,
    uploadPath: normalizeUploadPath(configs.r2_upload_path),
    key: objectKey,
    publicDomain: configs.r2_domain || '',
  });
};

const normalizeSecondsUntilMidnight = (value?: number) => {
  if (!Number.isFinite(value)) {
    return 24 * 60 * 60;
  }

  return Math.max(60, Math.min(24 * 60 * 60, Math.floor(value as number)));
};

const createSseWriter = (controller: ReadableStreamDefaultController) => {
  const encoder = new TextEncoder();

  return (event: StreamEvent) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };
};

const streamGeminiDescription = async ({
  objectUrl,
  prompt,
  model,
  temperature,
  apiKey,
  onChunk,
}: {
  objectUrl: string;
  prompt: string;
  model: string;
  temperature: number | undefined;
  apiKey: string;
  onChunk: (text: string) => void;
}) => {
  const imageResponse = await fetch(objectUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to fetch image from storage (${imageResponse.status})`
    );
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: contentType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    ...(temperature !== undefined ? { generationConfig: { temperature } } : {}),
  };

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    throw new Error(
      `Gemini request failed (${geminiResponse.status}): ${errorText || 'Unknown error'}`
    );
  }

  if (!geminiResponse.body) {
    throw new Error('Gemini response stream is missing');
  }

  const reader = geminiResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let description = '';
  let dataLines: string[] = [];

  const flushEvent = () => {
    if (dataLines.length === 0) {
      return;
    }

    const data = dataLines.join('\n').trim();
    dataLines = [];

    if (!data || data === '[DONE]') {
      return;
    }

    let payload: GeminiGenerateContentResponse | null = null;
    try {
      payload = JSON.parse(data) as GeminiGenerateContentResponse;
    } catch {
      return;
    }

    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join('') ?? '';

    if (!text) {
      return;
    }

    description += text;
    onChunk(text);
  };

  const consumeLines = (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (line === '') {
        flushEvent();
        continue;
      }

      if (line.startsWith('data:')) {
        dataLines.push(line.replace(/^data:\s?/, ''));
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    consumeLines(decoder.decode(value, { stream: true }));
  }

  consumeLines(decoder.decode());
  if (buffer.trim()) {
    const line = buffer.replace(/\r$/, '');
    if (line.startsWith('data:')) {
      dataLines.push(line.replace(/^data:\s?/, ''));
    }
  }

  flushEvent();

  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error('Empty response from model');
  }

  return trimmed;
};

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

  const parsed = describeImageSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const configs = await getAllConfigs();
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const visitorCookie =
    getCookieFromHeader(request.headers.get('cookie'), VISITOR_COOKIE_NAME) ??
    null;
  let visitorId = visitorCookie;
  let shouldSetVisitorCookie = false;
  const apiKey =
    configs.gemini_api_key || configs.google_generative_ai_api_key || '';

  if (!apiKey) {
    return Response.json(
      { success: false, error: 'Gemini API key is not configured' },
      { status: 500 }
    );
  }

  const prompt = buildPrompt(input.prompt, input.language);
  const model = input.model || DEFAULT_GEMINI_MODEL;
  const temperature = input.temperature ?? 1;
  const userId = session?.user?.id;

  if (!userId) {
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      shouldSetVisitorCookie = true;
    }

    const dailyQuotaRaw = envConfigs.daily_free_quota ?? '50';
    const dailyQuota = Number.parseInt(dailyQuotaRaw, 10);
    const normalizedQuota = Number.isFinite(dailyQuota) ? dailyQuota : 0;

    if (normalizedQuota > 0 && visitorId) {
      const kv = getKv();
      const stored = await kv.get(visitorId);
      const remaining = Number.parseInt(stored ?? `${normalizedQuota}`, 10);
      const effectiveRemaining = Number.isFinite(remaining)
        ? remaining
        : normalizedQuota;

      if (effectiveRemaining <= 0) {
        return Response.json(
          {
            success: false,
            error: 'Free quota exceeded for guest users.',
            errorCode: ERROR_CODES.guestFreeQuotaExceeded,
          },
          { status: 429 }
        );
      }

      await kv.put(visitorId, String(effectiveRemaining - 1), {
        expirationTtl: normalizeSecondsUntilMidnight(
          input.secondsUntilMidnight
        ),
      });
    }
  } else {
    const [hasSubscriptionAccess, hasOneTimeOrderAccess] = await Promise.all([
      hasValidSubscriptionAccess(userId),
      hasValidOneTimeProOrderAccess(userId),
    ]);
    const isPremium = hasSubscriptionAccess || hasOneTimeOrderAccess;

    if (!isPremium) {
      const dailyQuotaRaw = envConfigs.daily_free_quota_logged_in ?? '100';
      const dailyQuota = Number.parseInt(dailyQuotaRaw, 10);
      const normalizedQuota = Number.isFinite(dailyQuota) ? dailyQuota : 0;

      if (normalizedQuota > 0) {
        const kv = getKv();
        const quotaKey = `user:${userId}`;
        const stored = await kv.get(quotaKey);
        const remaining = Number.parseInt(stored ?? `${normalizedQuota}`, 10);
        const effectiveRemaining = Number.isFinite(remaining)
          ? remaining
          : normalizedQuota;

        if (effectiveRemaining <= 0) {
          return Response.json(
            {
              success: false,
              error: 'Free quota exceeded for signed-in users.',
              errorCode: ERROR_CODES.signedInFreeQuotaExceeded,
            },
            { status: 429 }
          );
        }

        await kv.put(quotaKey, String(effectiveRemaining - 1), {
          expirationTtl: normalizeSecondsUntilMidnight(
            input.secondsUntilMidnight
          ),
        });
      }
    }
  }

  if (!model.startsWith('gemini-')) {
    return Response.json(
      {
        success: false,
        error: 'Streaming endpoint only supports Gemini models.',
      },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = createSseWriter(controller);

      for (const image of input.images) {
        let objectUrl = '';

        try {
          objectUrl = resolveObjectUrl({
            objectUrl: image.objectUrl,
            objectKey: image.objectKey,
            configs,
          });
        } catch (error) {
          send({
            type: 'error',
            objectUrl: image.objectUrl || '',
            error:
              error instanceof Error
                ? error.message
                : 'Image source is missing',
          });
          continue;
        }

        send({ type: 'start', objectUrl });

        try {
          const description = await streamGeminiDescription({
            objectUrl,
            prompt,
            model,
            temperature,
            apiKey,
            onChunk: (text) => {
              send({
                type: 'chunk',
                objectUrl,
                text,
              });
            },
          });

          send({
            type: 'done',
            objectUrl,
            text: description,
          });
        } catch (error) {
          send({
            type: 'error',
            objectUrl,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to describe image',
          });
        }
      }

      send({ type: 'complete' });
      controller.close();
    },
  });

  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (!userId && shouldSetVisitorCookie && visitorId) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    responseHeaders.append(
      'Set-Cookie',
      `${VISITOR_COOKIE_NAME}=${visitorId}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`
    );
  }

  return new Response(stream, { headers: responseHeaders });
}

export const Route = createFileRoute('/api/describe-image')({
  server: {
    handlers: { POST },
  },
});
