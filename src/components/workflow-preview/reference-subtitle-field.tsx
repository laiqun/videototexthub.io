import { type ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { type WorkflowPreviewCopy } from "./types";

export function WorkflowPreviewReferenceSubtitleField({
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

  const hasUploadedSubtitle = filename.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        accept=".srt,.vtt,.txt"
        className="sr-only"
        onChange={handleChange}
        type="file"
      />
      {hasUploadedSubtitle ? (
        <div className="text-sm font-medium">{filename}</div>
      ) : null}
      <div>
        <Button onClick={openPicker} type="button" variant="outline" className="rounded-full">
          {hasUploadedSubtitle ? copy.reuploadSubtitle : copy.uploadSubtitle}
        </Button>
      </div>
    </div>
  );
}
