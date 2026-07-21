import { FileImage } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ImageDescriberCopy } from '@/lib/image-describer';

import type { ImageDescriberResultStatus } from './image-describer-results';

export interface ImageDescriberFileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  lastModified: string;
  results: string[];
  errorMessage: string;
  previewUrl?: string;
  status: ImageDescriberResultStatus;
  statusLabel: string;
  statusText: string;
}

const STATUS_STYLES: Record<string, string> = {
  done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  processing: 'border-amber-200 bg-amber-50 text-amber-700',
  uploading: 'border-blue-200 bg-blue-50 text-blue-700',
  waiting: 'border-slate-200 bg-slate-100 text-slate-600',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
};

interface ImageDescriberResultsListProps {
  copy: ImageDescriberCopy;
  fileItems: ImageDescriberFileItem[];
  onRemoveFile?: (fileKey: string) => void;
  isClipboardSupported: boolean;
  onCopyItem: (item: ImageDescriberFileItem) => void;
}

export default function ImageDescriberResultsList({
  copy,
  fileItems,
  onRemoveFile,
  isClipboardSupported,
  onCopyItem,
}: ImageDescriberResultsListProps) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-zinc-950">
      {fileItems.map((item, index) => {
        const hasResults = item.results.length > 0;
        const hasError = Boolean(item.errorMessage);
        const shouldShowDivider = index < fileItems.length - 1;

        return (
          <div key={item.id} className="px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 ">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FileImage className="h-6 w-6" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {item.size} · {item.type} · {item.lastModified}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {item.statusText}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-2 text-xs"
                  onClick={() => onRemoveFile?.(item.id)}
                  disabled={!onRemoveFile}
                >
                  {copy.results.remove}
                </Button>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                    STATUS_STYLES[item.status] ?? STATUS_STYLES.waiting
                  }`}
                >
                  {item.statusLabel}
                </span>
              </div>
            </div>

            <div
              className="mt-4 pb-4"
              style={
                shouldShowDivider
                  ? { borderBottom: '1px solid rgb(226, 232, 240)' }
                  : undefined
              }
            >
              <div className="px-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-white">
                  {copy.results.descriptionTitle}
                </p>
                <div className="mt-3 space-y-3">
                  {hasError ? (
                    <p className="text-destructive text-sm dark:text-red-400">
                      {item.errorMessage}
                    </p>
                  ) : hasResults ? (
                    item.results.map((paragraph) => (
                      <p
                        key={`${item.id}-${paragraph}`}
                        className="text-sm text-slate-600 dark:text-slate-200"
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white">
                      {copy.results.descriptionEmpty}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={!hasResults || !isClipboardSupported}
                  onClick={() => void onCopyItem(item)}
                >
                  {copy.results.copy}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
