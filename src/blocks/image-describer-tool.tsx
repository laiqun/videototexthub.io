import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import ImageDescriberAction from '@/components/image-describer/image-describer-action';
import ImageDescriberHistory from '@/components/image-describer/image-describer-history';
import ImageDescriberLanguage from '@/components/image-describer/image-describer-language';
import ImageDescriberPrompt from '@/components/image-describer/image-describer-prompt';
import type {
  ImageDescriberResultState,
  ImageDescriberResultStatus,
} from '@/components/image-describer/image-describer-results';
import ImageUploadDropzone from '@/components/image-describer/image-upload-dropzone';
import {
  DEFAULT_LANGUAGE_OPTIONS,
  getFileKey,
  splitDescription,
  type ImageDescriberCopy,
  type UploadedImageAsset,
} from '@/lib/image-describer';
import { saveImageDescriberHistoryEntries } from '@/lib/image-describer-history';
import { cn } from '@/lib/utils';
import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';

interface UploadEntry {
  file: File;
  key: string;
}

interface UploadSuccess {
  entry: UploadEntry;
  asset: UploadedImageAsset;
}

type StreamEvent =
  | { type: 'start'; objectUrl: string }
  | { type: 'chunk'; objectUrl: string; text: string }
  | { type: 'done'; objectUrl: string; text: string }
  | { type: 'error'; objectUrl: string; error: string }
  | { type: 'complete' };

const API_ERROR_CODE_TO_COPY_KEY = {
  GUEST_FREE_QUOTA_EXCEEDED: 'guestFreeQuotaExceeded',
  SIGNED_IN_FREE_QUOTA_EXCEEDED: 'signedInFreeQuotaExceeded',
} as const;

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 9;
const MAX_FILE_SIZE_MB = 20;
const DESCRIBER_MODEL = 'gemini-2.5-flash-lite';

const buildHistoryId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

interface UploadedImageResult {
  url?: string;
  key?: string;
  filename?: string;
}

/**
 * Uploads files to POST /api/storage/upload-image (multipart, `files` fields).
 * Response follows the respData/respErr envelope: `{ code, message, data }`
 * with `data.results: [{ url, key, filename }]` (or `data.urls: string[]`).
 */
const uploadImageFiles = async (files: File[]) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file, file.name);
  }

  const response = await fetch('/api/storage/upload-image', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as {
    code?: number;
    message?: string;
    success?: boolean;
    error?: string;
    data?: {
      url?: string;
      urls?: string[];
      results?: UploadedImageResult[];
    };
  };

  const failed =
    !response.ok ||
    (typeof payload.code === 'number' && payload.code !== 0) ||
    payload.success === false;

  if (failed || !payload.data) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Failed to upload image (${response.status})`
    );
  }

  const results: UploadedImageResult[] =
    payload.data.results ??
    payload.data.urls?.map((url) => ({ url })) ??
    (payload.data.url ? [{ url: payload.data.url }] : []);

  return files.map((file, index): UploadedImageAsset => {
    const result = results[index];
    if (!result?.url) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    return { objectUrl: result.url, objectKey: result.key };
  });
};

const PRESET_IDS = [
  'describe-detail',
  'describe-briefly',
  'describe-person',
  'recognize-objects',
  'extract-text',
  'fashion-outfit',
  'caption-title',
  'marketing-copy',
  'describe-story',
  'analyze-art-style',
  'general-image-prompt',
  'midjourney-prompt',
  'stable-diffusion-prompt',
  'flux-prompt',
] as const;

function buildCopy(): ImageDescriberCopy {
  return {
    action: {
      describe: m['landing.tool.action.describe'](),
      shortcut: m['landing.tool.action.shortcut'](),
    },
    history: {
      view: m['landing.tool.history.view'](),
      title: m['landing.tool.history.title'](),
      description: m['landing.tool.history.description'](),
      loading: m['landing.tool.history.loading'](),
      emptyTitle: m['landing.tool.history.empty_title'](),
      emptyDescription: m['landing.tool.history.empty_description'](),
      unsupportedTitle: m['landing.tool.history.unsupported_title'](),
      unsupportedDescription: m['landing.tool.history.unsupported_description'](),
    },
    prompt: {
      title: m['landing.tool.prompt.title'](),
      multiSelect: m['landing.tool.prompt.multi_select'](),
      placeholder: m['landing.tool.prompt.placeholder'](),
      presets: PRESET_IDS.map((id) => ({
        id,
        label: tDynamic(`landing.tool.presets.${id}.label`),
        prompt: tDynamic(`landing.tool.presets.${id}.prompt`),
      })),
    },
    language: {
      label: m['landing.tool.language.label'](),
      placeholder: m['landing.tool.language.placeholder'](),
    },
    results: {
      listLabel: m['landing.tool.results.list_label'](),
      unknownTime: m['landing.tool.results.unknown_time'](),
      unknownType: m['landing.tool.results.unknown_type'](),
      descriptionTitle: m['landing.tool.results.description_title'](),
      descriptionEmpty: m['landing.tool.results.description_empty'](),
      copy: m['landing.tool.results.copy'](),
      remove: m['landing.tool.results.remove'](),
      copyAll: m['landing.tool.results.copy_all'](),
      exportCsv: m['landing.tool.results.export_csv'](),
      exportJson: m['landing.tool.results.export_json'](),
      clear: m['landing.tool.results.clear'](),
      export: {
        noResults: m['landing.tool.results.export.no_results'](),
        // Placeholders are resolved later by formatTemplate in the components;
        // pass them through so paraglide params stay intact.
        success: m['landing.tool.results.export.success']({ count: '{count}' }),
        filenamePrefix: m['landing.tool.results.export.filename_prefix'](),
        columns: {
          filename: m['landing.tool.results.export.columns.filename'](),
          description: m['landing.tool.results.export.columns.description'](),
          size: m['landing.tool.results.export.columns.size'](),
          type: m['landing.tool.results.export.columns.type'](),
          modified: m['landing.tool.results.export.columns.modified'](),
        },
      },
      copyToast: {
        allTitle: m['landing.tool.results.copy_toast.all_title'](),
        allDescription: m['landing.tool.results.copy_toast.all_description']({
          imageCount: '{imageCount}',
          resultCount: '{resultCount}',
        }),
        itemTitle: m['landing.tool.results.copy_toast.item_title'](),
        itemDescription: m['landing.tool.results.copy_toast.item_description']({
          count: '{count}',
        }),
      },
    },
    status: {
      waiting: {
        label: m['landing.tool.status.waiting.label'](),
        text: m['landing.tool.status.waiting.text'](),
      },
      uploading: {
        label: m['landing.tool.status.uploading.label'](),
        text: m['landing.tool.status.uploading.text'](),
      },
      processing: {
        label: m['landing.tool.status.processing.label'](),
        text: m['landing.tool.status.processing.text'](),
      },
      done: {
        label: m['landing.tool.status.done.label'](),
        text: m['landing.tool.status.done.text'](),
      },
      error: {
        label: m['landing.tool.status.error.label'](),
        text: m['landing.tool.status.error.text'](),
      },
    },
    errors: {
      uploadFailed: m['landing.tool.errors.upload_failed'](),
      generationFailed: m['landing.tool.errors.generation_failed'](),
      streamUnavailable: m['landing.tool.errors.stream_unavailable'](),
      guestFreeQuotaExceeded:
        m['landing.tool.errors.guest_free_quota_exceeded'](),
      signedInFreeQuotaExceeded:
        m['landing.tool.errors.signed_in_free_quota_exceeded'](),
    },
    dropzone: {
      title: m['landing.tool.dropzone.title'](),
      cta: m['landing.tool.dropzone.cta'](),
      hint: m['landing.tool.dropzone.hint']({
        maxFiles: '{maxFiles}',
        maxSize: '{maxSize}',
      }),
      dragHint: m['landing.tool.dropzone.drag_hint'](),
      addMore: m['landing.tool.dropzone.add_more'](),
      addMoreHint: m['landing.tool.dropzone.add_more_hint'](),
      dropToAdd: m['landing.tool.dropzone.drop_to_add'](),
      errors: {
        type: m['landing.tool.dropzone.errors.type'](),
        size: m['landing.tool.dropzone.errors.size']({ maxSize: '{maxSize}' }),
        limit: m['landing.tool.dropzone.errors.limit']({
          maxFiles: '{maxFiles}',
        }),
      },
    },
  };
}

export interface ImageDescriberToolProps {
  /** Section heading overrides — defaults to the landing tool copy. */
  title?: string;
  description?: string;
  tip?: string;
  /** Restrict which preset chips are shown (defaults to all presets). */
  presetIds?: readonly string[];
  /** Pre-fill the prompt textarea with this preset's prompt. */
  defaultPresetId?: string;
}

export function ImageDescriberTool({
  title,
  description,
  tip,
  presetIds,
  defaultPresetId,
}: ImageDescriberToolProps = {}) {
  const copy = useMemo<ImageDescriberCopy>(() => {
    const base = buildCopy();
    if (!presetIds) {
      return base;
    }
    const allowed = new Set(presetIds);
    return {
      ...base,
      prompt: {
        ...base.prompt,
        presets: base.prompt.presets.filter((preset) =>
          allowed.has(preset.id)
        ),
      },
    };
  }, [presetIds]);
  const languageOptions = DEFAULT_LANGUAGE_OPTIONS;
  const maxFiles = MAX_FILES;
  const maxFileSizeMB = MAX_FILE_SIZE_MB;
  const acceptedTypes = DEFAULT_ACCEPTED_TYPES;

  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState(() => {
    if (!defaultPresetId) {
      return '';
    }
    return (
      copy.prompt.presets.find((preset) => preset.id === defaultPresetId)
        ?.prompt ?? ''
    );
  });
  const [language, setLanguage] = useState(
    languageOptions[0]?.value ?? 'English'
  );
  const [resultMap, setResultMap] = useState<
    Record<string, ImageDescriberResultState>
  >({});
  const [isDescribing, setIsDescribing] = useState(false);

  const resultCopy = useMemo<
    Record<
      ImageDescriberResultStatus,
      Omit<ImageDescriberResultState, 'results' | 'errorMessage'>
    >
  >(
    () => ({
      waiting: {
        status: 'waiting',
        statusLabel: copy.status.waiting.label,
        statusText: copy.status.waiting.text,
      },
      uploading: {
        status: 'uploading',
        statusLabel: copy.status.uploading.label,
        statusText: copy.status.uploading.text,
      },
      processing: {
        status: 'processing',
        statusLabel: copy.status.processing.label,
        statusText: copy.status.processing.text,
      },
      done: {
        status: 'done',
        statusLabel: copy.status.done.label,
        statusText: copy.status.done.text,
      },
      error: {
        status: 'error',
        statusLabel: copy.status.error.label,
        statusText: copy.status.error.text,
      },
    }),
    [copy.status]
  );

  const buildResultState = useCallback(
    (
      status: ImageDescriberResultStatus,
      overrides: Partial<ImageDescriberResultState> = {}
    ): ImageDescriberResultState => ({
      ...resultCopy[status],
      results: [],
      errorMessage: '',
      ...overrides,
    }),
    [resultCopy]
  );

  useEffect(() => {
    setResultMap((prev) => {
      const next: Record<string, ImageDescriberResultState> = {};

      for (const file of files) {
        const key = getFileKey(file);
        next[key] = prev[key] ?? buildResultState('waiting');
      }

      return next;
    });
  }, [buildResultState, files]);

  const handleDescribe = useCallback(async () => {
    if (files.length === 0 || isDescribing) {
      return;
    }

    setIsDescribing(true);

    try {
      const entries = files.map((file) => ({
        file,
        key: getFileKey(file),
      }));

      setResultMap((prev) => {
        const next = { ...prev };

        for (const entry of entries) {
          next[entry.key] = buildResultState('uploading');
        }

        return next;
      });

      let assets: UploadedImageAsset[];
      try {
        assets = await uploadImageFiles(entries.map((entry) => entry.file));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : copy.errors.uploadFailed;

        setResultMap((prev) => {
          const next = { ...prev };

          for (const entry of entries) {
            next[entry.key] = buildResultState('error', {
              statusText: copy.errors.uploadFailed,
              errorMessage,
            });
          }

          return next;
        });
        return;
      }

      const successfulUploads: UploadSuccess[] = entries.map((entry, index) => ({
        entry,
        asset: assets[index],
      }));

      if (successfulUploads.length === 0) {
        return;
      }

      setResultMap((prev) => {
        const next = { ...prev };

        for (const success of successfulUploads) {
          next[success.entry.key] = buildResultState('processing');
        }

        return next;
      });

      const response = await fetch('/api/describe-image', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          images: successfulUploads.map(({ entry, asset }) => ({
            objectKey: asset.objectKey,
            objectUrl: asset.objectUrl,
            filename: entry.file.name,
          })),
          prompt: question.trim() ? question.trim() : undefined,
          language: language.trim() ? language.trim() : undefined,
          secondsUntilMidnight: (() => {
            const now = new Date();
            const nextMidnight = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
              0,
              0,
              0,
              0
            );
            return Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);
          })(),
          model: DESCRIBER_MODEL,
        }),
      });

      if (!response.ok) {
        let errorMessage = copy.errors.generationFailed;
        try {
          const errorPayload = (await response.json()) as {
            message?: string;
            error?: string;
            errorCode?: keyof typeof API_ERROR_CODE_TO_COPY_KEY;
          };
          const mappedKey = errorPayload?.errorCode
            ? API_ERROR_CODE_TO_COPY_KEY[errorPayload.errorCode]
            : undefined;

          if (mappedKey) {
            errorMessage = copy.errors[mappedKey];
          } else if (errorPayload?.error || errorPayload?.message) {
            errorMessage = (errorPayload.error || errorPayload.message) as string;
          }
        } catch {
          // ignore
        }

        setResultMap((prev) => {
          const next = { ...prev };

          for (const success of successfulUploads) {
            next[success.entry.key] = buildResultState('error', {
              statusText: copy.errors.generationFailed,
              errorMessage,
            });
          }

          return next;
        });
        return;
      }

      if (!response.body) {
        setResultMap((prev) => {
          const next = { ...prev };

          for (const success of successfulUploads) {
            next[success.entry.key] = buildResultState('error', {
              statusText: copy.errors.generationFailed,
              errorMessage: copy.errors.streamUnavailable,
            });
          }

          return next;
        });
        return;
      }

      const keyByObjectUrl = new Map(
        successfulUploads.map((success) => [
          success.asset.objectUrl,
          success.entry.key,
        ])
      );
      const descriptionByUrl = new Map<string, string>();
      const completedUrls = new Set<string>();

      const applyResultUpdate = (
        objectUrl: string,
        nextState: ImageDescriberResultState
      ) => {
        const key = keyByObjectUrl.get(objectUrl);
        if (!key) {
          return;
        }

        setResultMap((prev) => ({
          ...prev,
          [key]: nextState,
        }));
      };

      const handleEvent = (event: StreamEvent) => {
        if (event.type === 'complete') {
          return;
        }

        if (event.type === 'start') {
          applyResultUpdate(event.objectUrl, buildResultState('processing'));
          return;
        }

        if (event.type === 'chunk') {
          const current = descriptionByUrl.get(event.objectUrl) ?? '';
          const nextText = `${current}${event.text}`;
          descriptionByUrl.set(event.objectUrl, nextText);
          applyResultUpdate(
            event.objectUrl,
            buildResultState('processing', {
              results: splitDescription(nextText),
            })
          );
          return;
        }

        if (event.type === 'done') {
          const finalText = event.text.trim();
          descriptionByUrl.set(event.objectUrl, finalText);
          completedUrls.add(event.objectUrl);
          applyResultUpdate(
            event.objectUrl,
            buildResultState('done', {
              results: splitDescription(finalText),
            })
          );
          return;
        }

        if (event.type === 'error') {
          applyResultUpdate(
            event.objectUrl,
            buildResultState('error', {
              statusText: copy.errors.generationFailed,
              errorMessage: event.error,
            })
          );
        }
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let dataLines: string[] = [];

      const flushEvent = () => {
        if (dataLines.length === 0) {
          return;
        }

        const payload = dataLines.join('\n').trim();
        dataLines = [];

        if (!payload) {
          return;
        }

        try {
          const event = JSON.parse(payload) as StreamEvent;
          handleEvent(event);
        } catch {
          // ignore parse errors
        }
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

      try {
        const baseTimestamp = Date.now();
        const historyEntries = successfulUploads.flatMap((success, index) => {
          if (!completedUrls.has(success.asset.objectUrl)) {
            return [];
          }

          const finalText = descriptionByUrl.get(success.asset.objectUrl);
          if (!finalText) {
            return [];
          }

          const results = splitDescription(finalText);
          if (results.length === 0) {
            return [];
          }

          return [
            {
              id: buildHistoryId(),
              createdAt: baseTimestamp + index,
              file: success.entry.file,
              fileName: success.entry.file.name,
              fileType: success.entry.file.type,
              fileLastModified: success.entry.file.lastModified,
              results,
              prompt: question.trim() ? question.trim() : undefined,
              language: language.trim() ? language.trim() : undefined,
            },
          ];
        });

        await saveImageDescriberHistoryEntries(historyEntries);
      } catch {
        // ignore history persistence errors
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : copy.errors.generationFailed;

      toast.error(errorMessage);
      setResultMap((prev) => {
        const next = { ...prev };

        for (const file of files) {
          const key = getFileKey(file);
          next[key] = buildResultState('error', {
            statusText: copy.errors.generationFailed,
            errorMessage,
          });
        }

        return next;
      });
    } finally {
      setIsDescribing(false);
    }
  }, [
    buildResultState,
    copy.errors.generationFailed,
    copy.errors.streamUnavailable,
    copy.errors.uploadFailed,
    files,
    isDescribing,
    language,
    question,
  ]);

  const tipText = tip ?? m['landing.tool.tip']();
  const sectionTitle = title ?? m['landing.tool.title']();
  const sectionDescription = description ?? m['landing.tool.description']();

  return (
    <section id="image-describer-tool" className={cn('py-0 md:py-0')}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            {sectionTitle}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-3xl">
            {sectionDescription}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-[2rem] border border-slate-200 bg-white/85 px-4 py-6 shadow-sm backdrop-blur md:px-8 md:py-8 dark:border-slate-800 dark:bg-zinc-950/85">
          <ImageUploadDropzone
            copy={copy}
            maxFiles={maxFiles}
            maxFileSizeMB={maxFileSizeMB}
            acceptedTypes={acceptedTypes}
            onFilesChange={setFiles}
            onDescribe={handleDescribe}
            resultsByKey={resultMap}
            describeDisabled={isDescribing || files.length === 0}
          />
          <ImageDescriberPrompt
            copy={copy}
            value={question}
            onChange={setQuestion}
          />
          <ImageDescriberLanguage
            copy={copy}
            options={languageOptions}
            value={language}
            onChange={setLanguage}
          />
          <div className="hidden sm:block">
            <ImageDescriberAction
              copy={copy}
              onDescribe={handleDescribe}
              disabled={isDescribing || files.length === 0}
            />
          </div>
          <div className="hidden sm:block">
            <ImageDescriberHistory copy={copy} />
          </div>
        </div>

        {tipText ? (
          <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-center text-sm">
            {tipText}
          </p>
        ) : null}
      </div>
    </section>
  );
}
