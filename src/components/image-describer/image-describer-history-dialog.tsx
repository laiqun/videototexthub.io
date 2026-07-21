import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Clock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  clearImageDescriberHistory,
  deleteImageDescriberHistoryEntry,
  IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT,
  isImageDescriberHistorySupported,
  loadImageDescriberHistory,
  type ImageDescriberHistoryItem,
} from '@/lib/image-describer-history';
import { getFileKey, type ImageDescriberCopy } from '@/lib/image-describer';

import ImageDescriberResults, {
  type ImageDescriberResultState,
} from './image-describer-results';

interface ImageDescriberHistoryDialogProps {
  copy: ImageDescriberCopy;
  trigger: ReactNode;
}

export default function ImageDescriberHistoryDialog({
  copy,
  trigger,
}: ImageDescriberHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ImageDescriberHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!isImageDescriberHistorySupported()) {
      setIsSupported(false);
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    setIsLoading(true);
    try {
      const nextItems = await loadImageDescriberHistory();
      setItems(nextItems);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadHistory();
  }, [loadHistory, open]);

  useEffect(() => {
    if (!open || !isSupported) {
      return;
    }

    const handleUpdate = () => {
      void loadHistory();
    };

    window.addEventListener(
      IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT,
      handleUpdate
    );
    return () => {
      window.removeEventListener(
        IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT,
        handleUpdate
      );
    };
  }, [isSupported, loadHistory, open]);

  const doneResultTemplate = useMemo<
    Omit<ImageDescriberResultState, 'results'>
  >(
    () => ({
      status: 'done',
      statusLabel: copy.status.done.label,
      statusText: copy.status.done.text,
      errorMessage: '',
    }),
    [copy.status.done.label, copy.status.done.text]
  );

  const { files, resultsByKey } = useMemo(() => {
    const historyFiles: File[] = [];
    const historyResults: Record<string, ImageDescriberResultState> = {};

    for (const item of items) {
      const file = item.file;
      const key = getFileKey(file);

      historyFiles.push(file);
      historyResults[key] = {
        ...doneResultTemplate,
        results: item.results,
      };
    }

    return { files: historyFiles, resultsByKey: historyResults };
  }, [doneResultTemplate, items]);

  const showEmptyState = !isLoading && items.length === 0;
  const scrollAreaClassName = 'mt-6 h-[520px] overflow-y-auto pr-2';

  const handleClearHistory = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    setIsLoading(true);
    try {
      await clearImageDescriberHistory({ silent: true });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const handleRemoveHistoryItem = useCallback(
    async (fileKey: string) => {
      if (!isSupported) {
        return;
      }

      const target = items.find((item) => getFileKey(item.file) === fileKey);
      if (!target) {
        return;
      }

      setItems((prev) =>
        prev.filter((item) => getFileKey(item.file) !== fileKey)
      );

      try {
        await deleteImageDescriberHistoryEntry(target.id, { silent: true });
      } catch {
        void loadHistory();
      }
    },
    [isSupported, items, loadHistory]
  );

  const iconBlock = (
    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-black">
      <Clock className="h-5 w-5" aria-hidden />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as ReactElement} />
      <DialogContent className="max-w-[min(64rem,calc(100%-2rem))] p-0 sm:max-w-[min(64rem,calc(100%-3rem))]">
        <div className="px-6 py-6">
          <DialogHeader className="gap-1 pr-10 text-left">
            <DialogTitle className="text-slate-800 dark:text-white">
              {copy.history.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {copy.history.description}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div
              className={`${scrollAreaClassName} flex items-center justify-center text-sm text-slate-500`}
            >
              {copy.history.loading}
            </div>
          ) : showEmptyState ? (
            <div className={scrollAreaClassName}>
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-10 text-center dark:bg-zinc-900">
                {iconBlock}
                <p className="text-sm font-semibold text-slate-700 dark:text-white">
                  {isSupported
                    ? copy.history.emptyTitle
                    : copy.history.unsupportedTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isSupported
                    ? copy.history.emptyDescription
                    : copy.history.unsupportedDescription}
                </p>
              </div>
            </div>
          ) : (
            <ImageDescriberResults
              copy={copy}
              files={files}
              resultsByKey={resultsByKey}
              showQuickActions={false}
              onClearAll={handleClearHistory}
              onRemoveFile={handleRemoveHistoryItem}
              listScrollable
              listScrollClassName={scrollAreaClassName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
