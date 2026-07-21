import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Plus, UploadIcon } from 'lucide-react';

import {
  formatTemplate,
  getFileKey,
  type ImageDescriberCopy,
} from '@/lib/image-describer';
import { cn } from '@/lib/utils';

import ImageDescriberHistoryDialog from './image-describer-history-dialog';
import ImageDescriberResults, {
  type ImageDescriberResultState,
} from './image-describer-results';

const PANEL_MIN_HEIGHT_CLASS = 'min-h-[216px]';

function dedupeFiles(files: File[]) {
  const unique = new Map<string, File>();

  for (const file of files) {
    unique.set(getFileKey(file), file);
  }

  return Array.from(unique.values());
}

interface UploadState {
  files: File[];
  errorMessage: string;
}

interface ImageUploadDropzoneProps {
  copy: ImageDescriberCopy;
  maxFiles: number;
  maxFileSizeMB: number;
  acceptedTypes: string[];
  onFilesChange?: (files: File[]) => void;
  onDescribe?: () => void;
  resultsByKey?: Record<string, ImageDescriberResultState>;
  describeDisabled?: boolean;
}

export default function ImageUploadDropzone({
  copy,
  maxFiles,
  maxFileSizeMB,
  acceptedTypes,
  onFilesChange,
  onDescribe,
  resultsByKey,
  describeDisabled,
}: ImageUploadDropzoneProps) {
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    files: [],
    errorMessage: '',
  });

  useEffect(() => {
    onFilesChange?.(uploadState.files);
  }, [onFilesChange, uploadState.files]);

  const handleFiles = useCallback(
    (incomingFiles: FileList | File[]) => {
      const files = Array.from(incomingFiles);

      if (files.length === 0) {
        return;
      }

      setUploadState((prev) => {
        const validFiles: File[] = [];
        let hasTypeError = false;
        let hasSizeError = false;

        for (const file of files) {
          if (!acceptedTypes.includes(file.type)) {
            hasTypeError = true;
            continue;
          }

          if (file.size > maxFileSizeBytes) {
            hasSizeError = true;
            continue;
          }

          validFiles.push(file);
        }

        const mergedFiles = dedupeFiles([...prev.files, ...validFiles]);
        const limitedFiles = mergedFiles.slice(0, maxFiles);
        const hasLimitError = mergedFiles.length > maxFiles;

        let errorMessage = '';

        if (hasTypeError) {
          errorMessage = copy.dropzone.errors.type;
        } else if (hasSizeError) {
          errorMessage = formatTemplate(copy.dropzone.errors.size, {
            maxSize: maxFileSizeMB,
          });
        } else if (hasLimitError) {
          errorMessage = formatTemplate(copy.dropzone.errors.limit, {
            maxFiles,
          });
        }

        return {
          files: limitedFiles,
          errorMessage,
        };
      });
    },
    [
      acceptedTypes,
      copy.dropzone.errors.limit,
      copy.dropzone.errors.size,
      copy.dropzone.errors.type,
      maxFileSizeBytes,
      maxFileSizeMB,
      maxFiles,
    ]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback((targetKey: string) => {
    setUploadState((prev) => {
      return {
        ...prev,
        files: prev.files.filter((file) => getFileKey(file) !== targetKey),
      };
    });
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }

      handleFiles(event.target.files);
      event.target.value = '';
    },
    [handleFiles]
  );

  const handleDragEnter = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.relatedTarget &&
      event.currentTarget.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (event.dataTransfer.files.length === 0) {
        return;
      }

      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <section className="px-4">
      <div className="mx-auto max-w-5xl pt-3">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        {uploadState.files.length === 0 ? (
          <>
            <h3 className="pb-1 text-lg font-semibold">
              {copy.dropzone.title}
            </h3>
            <button
              type="button"
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-blue-300 bg-blue-50/20 px-4 text-left transition-colors duration-150 outline-none',
                PANEL_MIN_HEIGHT_CLASS,
                'hover:border-blue-400 hover:bg-blue-50/30',
                'focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 dark:bg-zinc-900',
                isDragging && 'bg-blue-50/40 ring-2 ring-blue-400/50'
              )}
            >
              <div className="relative z-10 flex w-full flex-col items-center">
                <div className="flex w-full items-center justify-center gap-2">
                  <span className="text-blue-500">
                    <UploadIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </span>
                  <p className="text-base leading-6 font-medium text-blue-700 sm:text-lg dark:text-blue-400">
                    {copy.dropzone.cta}
                  </p>
                </div>
                <p className="w-full pt-2 text-center text-sm leading-5 text-slate-600 sm:text-base dark:text-slate-300">
                  {formatTemplate(copy.dropzone.hint, {
                    maxFiles,
                    maxSize: maxFileSizeMB,
                  })}
                </p>
              </div>

              <div
                className={cn(
                  'pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-blue-100/80 px-4 text-center text-sm font-medium text-blue-700 backdrop-blur-sm transition-opacity duration-150',
                  isDragging ? 'opacity-100' : 'opacity-0'
                )}
              >
                {copy.dropzone.dragHint}
              </div>
            </button>
          </>
        ) : null}

        {uploadState.files.length > 0 ? (
          <>
            <div className="pt-2 pb-2">
              <button
                type="button"
                onClick={openFileDialog}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-dashed border-blue-300 bg-blue-50/20 px-4 py-4 text-left transition-colors duration-150 outline-none',
                  'hover:border-blue-400 hover:bg-blue-50/30',
                  'focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 dark:bg-zinc-900',
                  isDragging && 'bg-blue-50/40 ring-2 ring-blue-400/50'
                )}
              >
                <div className="relative z-10 flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-neutral-700">
                    <Plus className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {copy.dropzone.addMore}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 ">
                      {copy.dropzone.addMoreHint}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-blue-100/80 px-4 text-center text-xs font-medium text-blue-700 backdrop-blur-sm transition-opacity duration-150',
                    isDragging ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {copy.dropzone.dropToAdd}
                </div>
              </button>
            </div>
            <ImageDescriberResults
              copy={copy}
              files={uploadState.files}
              resultsByKey={resultsByKey}
              onRemoveFile={handleRemoveFile}
              onDescribe={onDescribe}
              describeDisabled={describeDisabled}
              historyTrigger={
                <ImageDescriberHistoryDialog
                  copy={copy}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      {copy.history.view}
                    </button>
                  }
                />
              }
            />
          </>
        ) : null}

        {uploadState.errorMessage ? (
          <p className="text-destructive mt-3 text-center text-sm">
            {uploadState.errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
