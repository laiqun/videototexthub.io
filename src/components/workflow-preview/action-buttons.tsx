import { Download, ExternalLink, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  type WorkflowPreviewCopy,
  type WorkflowPreviewDownloadAsset,
  type WorkflowPreviewStatus,
} from "./types";

export function WorkflowPreviewActionButtons({
  assets,
  copy,
  status,
}: {
  assets: WorkflowPreviewDownloadAsset[];
  copy: WorkflowPreviewCopy;
  status: WorkflowPreviewStatus;
}) {
  if (status === "failed") {
    return (
      <Button variant="outline" className="rounded-full">
        <RefreshCw className="size-4" />
        {copy.retry}
      </Button>
    );
  }

  if (status === "queued") {
    return (
      <Button disabled variant="outline" className="rounded-full">
        {copy.processing}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="rounded-full">
        <ExternalLink className="size-4" />
        {copy.openNote}
      </Button>
      <Dialog>
        <DialogTrigger
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
        >
          <Download className="size-4" />
          {copy.download}
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{copy.downloadsTitle}</DialogTitle>
            <DialogDescription>{copy.downloadsDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {assets.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
                type="button"
              >
                <span className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-background ring-1 ring-border">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
