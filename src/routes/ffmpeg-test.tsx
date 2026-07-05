import { createFileRoute } from '@tanstack/react-router';
import { useForm, type AnyFieldApi } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Download, Loader2, RefreshCcw, Server, TerminalSquare, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiPostForm } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

const DEPLOYED_ENDPOINT = 'https://videototexthub.laiqun007.workers.dev/api/ffmpeg';
const LOCAL_ENDPOINT = '/api/ffmpeg';
const DEFAULT_INPUT_NAME = 'demo.mp4';
const DEFAULT_COMMAND = `-i ${DEFAULT_INPUT_NAME} -c:v libx264 -crf 23 output.mp4`;

const ffmpegTestSchema = z.object({
  endpoint: z.string().min(1),
  command: z.string().min(1),
});

interface FfmpegResult {
  contentType: string;
  downloadUrl: string;
  fileName: string;
  size: number;
}

function fieldError(field: AnyFieldApi) {
  if (!field.state.meta.isTouched) return null;
  const error = field.state.meta.errors?.[0] as unknown;
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function extractDownloadName(contentDisposition: string | null) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || null;
}

function guessOutputFileName(command: string, contentType: string) {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  const lastToken = tokens.at(-1);
  if (lastToken && !lastToken.startsWith('-')) {
    return lastToken.split('/').at(-1) || lastToken;
  }

  if (contentType.includes('mp4')) return 'output.mp4';
  if (contentType.includes('json')) return 'output.json';
  if (contentType.includes('text')) return 'output.txt';
  return 'output.bin';
}

export const Route = createFileRoute('/ffmpeg-test')({
  loader: () => {
    const locale = getLocale();
    return {
      title: m['landing.ffmpeg_test.title']({}, { locale }),
      description: m['landing.ffmpeg_test.description']({}, { locale }),
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: FfmpegTestPage,
});

function FfmpegTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [result, setResult] = useState<FfmpegResult | null>(null);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result?.downloadUrl]);

  const form = useForm({
    defaultValues: {
      endpoint: DEPLOYED_ENDPOINT,
      command: DEFAULT_COMMAND,
    },
    validators: { onSubmit: ffmpegTestSchema },
    onSubmit: async ({ value }) => {
      setSubmitError('');
      setFileError('');

      if (!selectedFile) {
        setFileError(m['landing.ffmpeg_test.file_missing']());
        return;
      }

      await runMutation.mutateAsync(value);
    },
  });

  const runMutation = useMutation({
    mutationFn: async (value: z.infer<typeof ffmpegTestSchema>) => {
      if (!selectedFile) {
        throw new Error(m['landing.ffmpeg_test.file_missing']());
      }

      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);
      formData.append('command', value.command);

      const response = await apiPostForm(value.endpoint, formData);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const blob = await response.blob();
      const fileName =
        extractDownloadName(response.headers.get('content-disposition')) ||
        guessOutputFileName(value.command, contentType);

      return {
        contentType,
        downloadUrl: URL.createObjectURL(blob),
        fileName,
        size: blob.size,
      } satisfies FfmpegResult;
    },
    onMutate: () => {
      setSubmitError('');
      setResult((current) => {
        if (current?.downloadUrl) {
          URL.revokeObjectURL(current.downloadUrl);
        }
        return null;
      });
    },
    onSuccess: (nextResult) => {
      setResult(nextResult);
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  function updateCommandFileName(nextFileName: string) {
    const currentCommand = form.state.values.command;
    const currentFileName = selectedFile?.name;
    const replaceTargets = [currentFileName, DEFAULT_INPUT_NAME].filter(Boolean) as string[];

    let nextCommand = currentCommand;
    for (const target of replaceTargets) {
      if (nextCommand.includes(target)) {
        nextCommand = nextCommand.split(target).join(nextFileName);
      }
    }

    if (nextCommand !== currentCommand) {
      form.setFieldValue('command', nextCommand);
    }
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setFileError('');
    if (file) {
      updateCommandFileName(file.name);
    }
  }

  function handleReset() {
    form.reset();
    setSelectedFile(null);
    setFileError('');
    setSubmitError('');
    setResult((current) => {
      if (current?.downloadUrl) {
        URL.revokeObjectURL(current.downloadUrl);
      }
      return null;
    });
    setFileInputKey((value) => value + 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {m['landing.ffmpeg_test.eyebrow']()}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {m['landing.ffmpeg_test.title']()}
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              {m['landing.ffmpeg_test.description']()}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{m['landing.ffmpeg_test.card_title']()}</CardTitle>
                <CardDescription>{m['landing.ffmpeg_test.card_description']()}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <form.Field name="endpoint">
                      {(field) => {
                        const error = fieldError(field);
                        return (
                          <Field>
                            <FieldLabel htmlFor={field.name}>
                              {m['landing.ffmpeg_test.endpoint_label']()}
                            </FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={error ? true : undefined}
                              disabled={runMutation.isPending}
                            />
                            <FieldDescription>
                              {m['landing.ffmpeg_test.endpoint_help']()}
                            </FieldDescription>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => form.setFieldValue('endpoint', DEPLOYED_ENDPOINT)}
                                disabled={runMutation.isPending}
                              >
                                <Server className="size-4" />
                                {m['landing.ffmpeg_test.use_deployed']()}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => form.setFieldValue('endpoint', LOCAL_ENDPOINT)}
                                disabled={runMutation.isPending}
                              >
                                <Server className="size-4" />
                                {m['landing.ffmpeg_test.use_local']()}
                              </Button>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                          </Field>
                        );
                      }}
                    </form.Field>

                    <Field>
                      <FieldLabel htmlFor="ffmpeg-file">
                        {m['landing.ffmpeg_test.file_label']()}
                      </FieldLabel>
                      <Input
                        key={fileInputKey}
                        id="ffmpeg-file"
                        type="file"
                        onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                        disabled={runMutation.isPending}
                      />
                      <FieldDescription>
                        {m['landing.ffmpeg_test.file_help']()}
                      </FieldDescription>
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          {m['landing.ffmpeg_test.selected_file']()}:
                          {' '}
                          <span className="font-medium text-foreground">{selectedFile.name}</span>
                        </p>
                      )}
                      {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                    </Field>

                    <form.Field name="command">
                      {(field) => {
                        const error = fieldError(field);
                        return (
                          <Field>
                            <FieldLabel htmlFor={field.name}>
                              {m['landing.ffmpeg_test.command_label']()}
                            </FieldLabel>
                            <Textarea
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={error ? true : undefined}
                              disabled={runMutation.isPending}
                              className="min-h-28 font-mono text-sm"
                            />
                            <FieldDescription>
                              {m['landing.ffmpeg_test.command_help']()}
                            </FieldDescription>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </FieldGroup>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={runMutation.isPending}>
                      {runMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {runMutation.isPending
                        ? m['landing.ffmpeg_test.running']()
                        : m['landing.ffmpeg_test.run']()}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={runMutation.isPending}
                    >
                      <RefreshCcw className="size-4" />
                      {m['landing.ffmpeg_test.reset']()}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{m['landing.ffmpeg_test.request_title']()}</CardTitle>
                  <CardDescription>{m['landing.ffmpeg_test.request_description']()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PreviewRow
                    label={m['landing.ffmpeg_test.request_endpoint']()}
                    value={form.state.values.endpoint}
                  />
                  <PreviewRow
                    label={m['landing.ffmpeg_test.request_filename']()}
                    value={selectedFile?.name || DEFAULT_INPUT_NAME}
                  />
                  <PreviewRow
                    label={m['landing.ffmpeg_test.request_command']()}
                    value={form.state.values.command}
                    mono
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{m['landing.ffmpeg_test.result_title']()}</CardTitle>
                  <CardDescription>{m['landing.ffmpeg_test.result_description']()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submitError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      <p className="font-medium">{m['landing.ffmpeg_test.error_title']()}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words">{submitError}</p>
                    </div>
                  ) : null}

                  {result ? (
                    <div className="space-y-4">
                      <PreviewRow
                        label={m['landing.ffmpeg_test.output_name']()}
                        value={result.fileName}
                      />
                      <PreviewRow
                        label={m['landing.ffmpeg_test.content_type']()}
                        value={result.contentType}
                      />
                      <PreviewRow
                        label={m['landing.ffmpeg_test.file_size']()}
                        value={formatBytes(result.size)}
                      />
                      <a
                        href={result.downloadUrl}
                        download={result.fileName}
                        className={cn(
                          'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
                        )}
                      >
                        <Download className="size-4" />
                        {m['landing.ffmpeg_test.download']()}
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                      {m['landing.ffmpeg_test.result_empty']()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function PreviewRow({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
        <div className="flex items-start gap-2">
          <TerminalSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className={cn('break-all', mono && 'font-mono text-xs sm:text-sm')}>{value}</p>
        </div>
      </div>
    </div>
  );
}
