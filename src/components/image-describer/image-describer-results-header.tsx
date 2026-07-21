import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { ImageDescriberCopy } from '@/lib/image-describer';

interface ImageDescriberResultsHeaderProps {
  copy: ImageDescriberCopy;
  showQuickActions: boolean;
  historyTrigger?: ReactNode;
  onDescribe?: () => void;
  onCopyAll: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onClear: () => void;
  hasAnyResults: boolean;
  isClipboardSupported: boolean;
  canClear: boolean;
  describeDisabled?: boolean;
}

export default function ImageDescriberResultsHeader({
  copy,
  showQuickActions,
  historyTrigger,
  onDescribe,
  onCopyAll,
  onExportCsv,
  onExportJson,
  onClear,
  hasAnyResults,
  isClipboardSupported,
  canClear,
  describeDisabled,
}: ImageDescriberResultsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {showQuickActions ? (
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            <Button
              type="button"
              onClick={onDescribe}
              disabled={describeDisabled}
            >
              {copy.action.describe}
            </Button>
            {historyTrigger ?? null}
          </div>
        ) : null}
        <span className="hidden text-sm font-semibold text-slate-600 sm:inline-flex dark:text-slate-300">
          {copy.results.listLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopyAll}
          disabled={!hasAnyResults || !isClipboardSupported}
        >
          {copy.results.copyAll}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onExportCsv}>
          {copy.results.exportCsv}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportJson}
        >
          {copy.results.exportJson}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={!canClear}
        >
          {copy.results.clear}
        </Button>
      </div>
    </div>
  );
}
