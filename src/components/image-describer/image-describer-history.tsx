import type { ImageDescriberCopy } from '@/lib/image-describer';

import ImageDescriberHistoryDialog from './image-describer-history-dialog';

interface ImageDescriberHistoryProps {
  copy: ImageDescriberCopy;
}

export default function ImageDescriberHistory({
  copy,
}: ImageDescriberHistoryProps) {
  return (
    <section className="px-4 pt-4">
      <div className="mx-auto flex max-w-5xl justify-center">
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
      </div>
    </section>
  );
}
