import { type ChangeEvent, type KeyboardEvent, useRef } from "react";
import { Link2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type WorkflowPreviewCopy } from "./types";

export function InputPanel({
  copy,
}: {
  copy: WorkflowPreviewCopy;
}) {
  const panelCardClassName =
    "flex h-[24rem] w-full items-center justify-center rounded-[1.45rem] bg-background/86 px-6 pb-10 pt-24 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)] sm:h-[25rem] sm:px-8 sm:pt-24 md:px-10 lg:px-12";

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const openUploadPicker = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUploadPicker();
    }
  };

  const handleUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    // Reset the control so selecting the same file again still fires change.
    event.target.value = "";
  };

  return (
    <Tabs defaultValue="upload" className="w-full">
      <div className="relative w-full">
        <div className="pointer-events-none absolute left-5 top-5 z-10 sm:left-6 sm:top-6">
          <TabsList
            variant="default"
            className="pointer-events-auto h-auto rounded-2xl border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur"
          >
            <TabsTrigger
              className="h-9 rounded-xl px-3 text-xs font-medium sm:px-4"
              value="upload"
            >
              <Upload className="size-4" />
              {copy.uploadTab}
            </TabsTrigger>
            <TabsTrigger
              className="h-9 rounded-xl px-3 text-xs font-medium sm:px-4"
              value="paste"
            >
              <Link2 className="size-4" />
              {copy.pasteTab}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="mt-0 w-full" value="upload">
          <input
            ref={uploadInputRef}
            accept=".mp4,.mov,.mp3,.wav,.m4a,video/*,audio/*"
            className="sr-only"
            multiple
            onChange={handleUploadInputChange}
            type="file"
          />
          <div
            aria-label={copy.dropzoneTitle}
            className={`${panelCardClassName} cursor-pointer border border-dashed border-foreground/15 outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-emerald-600/40`}
            onClick={openUploadPicker}
            onKeyDown={handleUploadCardKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
              <div className="inline-flex size-14 items-center justify-center rounded-[1.1rem] bg-foreground text-background shadow-sm">
                <Upload className="size-5" />
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-medium sm:text-2xl">
                  {copy.dropzoneTitle}
                </h3>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Badge
                  variant="outline"
                  className="h-auto rounded-full px-3 py-1"
                >
                  {copy.supportedMedia}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent className="mt-0 w-full" value="paste">
          <div className={`${panelCardClassName} border border-border/70`}>
            <div className="flex w-full max-w-4xl flex-col items-center text-center">
              <div className="inline-flex size-14 items-center justify-center rounded-[1.1rem] bg-foreground text-background shadow-sm">
                <Link2 className="size-5" />
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-medium sm:text-2xl">
                  {copy.pasteTab}
                </h3>
              </div>
              <div className="mt-7 w-full rounded-[1.35rem] border border-border/70 bg-muted/45 p-3 sm:p-4">
                <Input
                  aria-label={copy.pasteTab}
                  className="h-12 rounded-xl border-0 bg-background text-center shadow-none"
                  defaultValue="https://youtube.com/watch?v=workflow-preview"
                  placeholder={copy.pastePlaceholder}
                />
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" className="rounded-full px-5">
                  {copy.addQueue}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
