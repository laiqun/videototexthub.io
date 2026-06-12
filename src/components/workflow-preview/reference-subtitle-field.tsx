import { type ChangeEvent, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { type WorkflowPreviewCopy } from "./types";

export function ReferenceSubtitleField({
  copy,
  initialFilename,
}: {
  copy: WorkflowPreviewCopy;
  initialFilename?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState(initialFilename ?? "");

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    setFilename(nextFile.name);
    event.target.value = "";
  };

  const deleteReferenceSubtitle = () => {
    setFilename("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const hasUploadedSubtitle = filename.length > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        ref={inputRef}
        accept=".srt,.vtt,.txt"
        className="sr-only"
        onChange={handleChange}
        type="file"
      />
      {hasUploadedSubtitle ? (
        <div className="flex w-full items-center gap-1">
          <div className="min-w-0 flex-1 truncate text-sm font-medium" title={filename}>
            {filename}
          </div>
          <Button
            onClick={deleteReferenceSubtitle}
            type="button"
            variant="destructive"
            size="icon"
            className="size-8 shrink-0 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {hasUploadedSubtitle ? null : (
          <Button
            onClick={openPicker}
            type="button"
            variant="outline"
            className="rounded-full"
          >
            {copy.uploadSubtitle}
          </Button>
        )}
      </div>
    </div>
  );
}
