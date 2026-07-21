import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  formatTemplate,
  getFileKey,
  type ImageDescriberCopy,
} from '@/lib/image-describer';

import ImageDescriberResultsHeader from './image-describer-results-header';
import ImageDescriberResultsList, {
  type ImageDescriberFileItem,
} from './image-describer-results-list';

export type ImageDescriberResultStatus =
  | 'waiting'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

export interface ImageDescriberResultState {
  status: ImageDescriberResultStatus;
  statusLabel: string;
  statusText: string;
  results: string[];
  errorMessage?: string;
}

function formatFileSizeMB(sizeInBytes: number) {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`;
}

function formatLastModified(timestamp: number, fallbackLabel: string) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return fallbackLabel;
  }

  return new Date(timestamp).toLocaleString();
}

type ExportRow = Record<string, string>;

interface ImageDescriberResultsProps {
  copy: ImageDescriberCopy;
  files: File[];
  resultsByKey?: Record<string, ImageDescriberResultState>;
  onRemoveFile?: (fileKey: string) => void;
  onDescribe?: () => void;
  showQuickActions?: boolean;
  historyTrigger?: ReactNode;
  onClearAll?: () => void | Promise<void>;
  listScrollable?: boolean;
  listScrollClassName?: string;
  describeDisabled?: boolean;
}

export default function ImageDescriberResults({
  copy,
  files,
  resultsByKey,
  onRemoveFile,
  onDescribe,
  showQuickActions = true,
  historyTrigger,
  onClearAll,
  listScrollable = false,
  listScrollClassName,
  describeDisabled,
}: ImageDescriberResultsProps) {
  const previewUrlMapRef = useRef(new Map<string, string>());
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const defaultResultState = useMemo<ImageDescriberResultState>(
    () => ({
      status: 'waiting',
      statusLabel: copy.status.waiting.label,
      statusText: copy.status.waiting.text,
      results: [],
      errorMessage: '',
    }),
    [copy.status.waiting.label, copy.status.waiting.text]
  );
  const exportColumns = useMemo(
    () => ({
      filename: copy.results.export.columns.filename,
      description: copy.results.export.columns.description,
      size: copy.results.export.columns.size,
      type: copy.results.export.columns.type,
      modified: copy.results.export.columns.modified,
    }),
    [copy.results.export.columns]
  );
  const exportHeaders = useMemo(
    () => [
      exportColumns.filename,
      exportColumns.description,
      exportColumns.size,
      exportColumns.type,
      exportColumns.modified,
    ],
    [exportColumns]
  );

  const fileItems = useMemo(() => {
    return files.map<ImageDescriberFileItem>((file) => {
      const id = getFileKey(file);
      const resultState = resultsByKey?.[id] ?? defaultResultState;

      return {
        id,
        file,
        name: file.name,
        size: formatFileSizeMB(file.size),
        type: file.type || copy.results.unknownType,
        lastModified: formatLastModified(
          file.lastModified,
          copy.results.unknownTime
        ),
        results: resultState.results ?? [],
        errorMessage: resultState.errorMessage ?? '',
        previewUrl: previewUrls[id],
        status: resultState.status,
        statusLabel: resultState.statusLabel,
        statusText: resultState.statusText,
      };
    });
  }, [
    copy.results.unknownTime,
    copy.results.unknownType,
    defaultResultState,
    files,
    previewUrls,
    resultsByKey,
  ]);

  const copyAllText = useMemo(() => {
    return fileItems
      .filter((item) => item.results.length > 0)
      .map((item) => [item.name, ...item.results].join('\n'))
      .join('\n\n');
  }, [fileItems]);

  const hasAnyResults = useMemo(() => {
    return fileItems.some((item) => item.results.length > 0);
  }, [fileItems]);

  const isClipboardSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText);

  useEffect(() => {
    const nextMap = new Map<string, string>();
    const nextUrls: Record<string, string> = {};

    for (const file of files) {
      const id = getFileKey(file);
      const existingUrl = previewUrlMapRef.current.get(id);
      const previewUrl = existingUrl ?? URL.createObjectURL(file);

      nextMap.set(id, previewUrl);
      nextUrls[id] = previewUrl;
    }

    for (const [key, previewUrl] of previewUrlMapRef.current.entries()) {
      if (nextMap.has(key)) {
        continue;
      }

      URL.revokeObjectURL(previewUrl);
    }

    previewUrlMapRef.current = nextMap;
    setPreviewUrls(nextUrls);
  }, [files]);

  useEffect(() => {
    return () => {
      for (const previewUrl of previewUrlMapRef.current.values()) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrlMapRef.current.clear();
    };
  }, []);

  const copyToClipboard = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }

    if (!navigator.clipboard?.writeText) {
      return false;
    }

    await navigator.clipboard.writeText(trimmed);
    return true;
  };

  const buildExportRows = () => {
    return fileItems.map<ExportRow>((item) => ({
      [exportColumns.filename]: item.name,
      [exportColumns.description]: item.results.join('\n'),
      [exportColumns.size]: item.size,
      [exportColumns.type]: item.type,
      [exportColumns.modified]: item.lastModified,
    }));
  };

  const buildExportFilename = (extension: 'csv' | 'json') => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return `${copy.results.export.filenamePrefix}-${timestamp}.${extension}`;
  };

  const downloadTextFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const toCsvCell = (value: string) => {
    const normalized = value.replace(/\r?\n/g, '\n');
    if (/["\n,]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const handleExportCsv = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error(copy.results.export.noResults);
      return;
    }

    const lines = [
      exportHeaders.join(','),
      ...rows.map((row) =>
        exportHeaders.map((header) => toCsvCell(row[header] ?? '')).join(',')
      ),
    ];

    downloadTextFile(
      lines.join('\n'),
      buildExportFilename('csv'),
      'text/csv;charset=utf-8'
    );
    toast.success(
      formatTemplate(copy.results.export.success, { count: rows.length })
    );
  };

  const handleExportJson = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error(copy.results.export.noResults);
      return;
    }

    downloadTextFile(
      JSON.stringify(rows, null, 2),
      buildExportFilename('json'),
      'application/json;charset=utf-8'
    );
    toast.success(
      formatTemplate(copy.results.export.success, { count: rows.length })
    );
  };

  const handleCopyAll = async () => {
    const copied = await copyToClipboard(copyAllText);
    if (!copied) {
      return;
    }

    const imageCount = fileItems.filter(
      (item) => item.results.length > 0
    ).length;
    const totalCount = fileItems.reduce(
      (sum, item) => sum + item.results.length,
      0
    );

    toast.success(copy.results.copyToast.allTitle, {
      description: formatTemplate(copy.results.copyToast.allDescription, {
        imageCount,
        resultCount: totalCount,
      }),
    });
  };

  const handleCopyItem = async (item: ImageDescriberFileItem) => {
    const copied = await copyToClipboard(item.results.join('\n'));
    if (!copied) {
      return;
    }

    toast.success(copy.results.copyToast.itemTitle, {
      description: formatTemplate(copy.results.copyToast.itemDescription, {
        count: item.results.length,
      }),
    });
  };

  const handleClear = () => {
    if (onClearAll) {
      void onClearAll();
      return;
    }

    if (!onRemoveFile) {
      return;
    }

    for (const item of fileItems) {
      onRemoveFile(item.id);
    }
  };

  const canClear =
    fileItems.length > 0 && (Boolean(onRemoveFile) || Boolean(onClearAll));

  return (
    <section>
      <div className="mx-auto max-w-5xl">
        <ImageDescriberResultsHeader
          copy={copy}
          showQuickActions={showQuickActions}
          historyTrigger={historyTrigger}
          onDescribe={onDescribe}
          onCopyAll={() => void handleCopyAll()}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onClear={handleClear}
          hasAnyResults={hasAnyResults}
          isClipboardSupported={isClipboardSupported}
          canClear={canClear}
          describeDisabled={describeDisabled}
        />

        {listScrollable ? (
          <div className={listScrollClassName}>
            <ImageDescriberResultsList
              copy={copy}
              fileItems={fileItems}
              onRemoveFile={onRemoveFile}
              isClipboardSupported={isClipboardSupported}
              onCopyItem={handleCopyItem}
            />
          </div>
        ) : (
          <ImageDescriberResultsList
            copy={copy}
            fileItems={fileItems}
            onRemoveFile={onRemoveFile}
            isClipboardSupported={isClipboardSupported}
            onCopyItem={handleCopyItem}
          />
        )}
      </div>
    </section>
  );
}
