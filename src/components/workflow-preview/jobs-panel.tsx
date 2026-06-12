import { useState } from "react";
import {
  CircleHelp,
  Eye,
  Loader2,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiPost } from "@/lib/api-client";

import { Result } from "./result";
import { ReferenceSubtitleField } from "./reference-subtitle-field";
import { StatusPill } from "./status-pill";
import {
  type WorkflowPreviewCopy,
  type WorkflowPreviewDownloadAsset,
  type WorkflowPreviewJob,
} from "./types";

interface PresignedUploadData {
  url: string;
  key: string;
  objectUrl: string;
  method?: string;
  headers?: Record<string, string>;
}

interface WorkflowPreviewStartResponse {
  sourceType: "file" | "url";
  sourceValue: string;
  objectKey?: string;
  objectUrl?: string;
}

const mobileTableCellClasses =
  "flex flex-col gap-1 border-b border-border/40 px-4 py-3 last:border-b-0 md:table-cell md:border-b-0 md:px-4 md:py-4 md:align-top before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.18em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden";

async function uploadWorkflowFile(file: File): Promise<{
  objectKey: string;
  objectUrl: string;
}> {
  const presignedData = await apiPost<PresignedUploadData>(
    "/api/storage/create-r2-presigned-url",
    {
      operation: "put",
      scope: "workflow-preview-temp",
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    },
  );

  const uploadResponse = await fetch(presignedData.url, {
    method: presignedData.method || "PUT",
    headers: presignedData.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  return {
    objectKey: presignedData.key,
    objectUrl: presignedData.objectUrl,
  };
}

async function startWorkflowPreviewJob(
  job: WorkflowPreviewJob,
  uploadResult?: { objectKey: string; objectUrl: string },
): Promise<WorkflowPreviewStartResponse> {
  return apiPost<WorkflowPreviewStartResponse>("/api/workflow-preview/start", {
    sourceType: job.sourceFile ? "file" : "url",
    sourceValue: job.sourceValue,
    objectKey: uploadResult?.objectKey,
    objectUrl: uploadResult?.objectUrl,
  });
}

export function JobsPanel({
  assets,
  copy,
  jobs,
  onDeleteJob,
  onUpdateJob,
}: {
  assets: WorkflowPreviewDownloadAsset[];
  copy: WorkflowPreviewCopy;
  jobs: WorkflowPreviewJob[];
  onDeleteJob: (jobId: string) => void;
  onUpdateJob: (jobId: string, updates: Partial<WorkflowPreviewJob>) => void;
}) {
  return (
    <div className="md:overflow-hidden md:rounded-[1.5rem] md:border md:border-border/70 md:bg-background/80">
      <table className="w-full border-separate border-spacing-y-3 text-left text-sm md:table-fixed md:border-collapse md:border-spacing-y-0">
        <colgroup className="hidden md:table-column-group">
          <col className="w-68" />
          <col className="w-48" />
          <col className="w-44" />
          <col className="w-32" />
          <col />
        </colgroup>
        <thead className="hidden bg-muted/70 text-foreground md:table-header-group">
          <tr>
            <th className="px-4 py-3 font-medium w-68">{copy.jobs}</th>
            <th className="px-4 py-3 font-medium md:w-48">
              <ReferenceSubtitleHeader copy={copy} />
            </th>
            <th className="px-4 py-3 font-medium w-44">{copy.action}</th>
            <th className="px-4 py-3 font-medium w-28">{copy.status}</th>
            <th className="px-4 py-3 font-medium">{copy.result}</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="mb-4 block overflow-hidden rounded-[1.25rem] border border-border/60 bg-card shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-t md:border-border/70 md:bg-transparent md:shadow-none md:first:border-t-0 md:align-top"
            >
              <td data-label={copy.jobs} className={mobileTableCellClasses}>
                <div className="min-w-0">
                  <div className="font-medium">{job.sourceLabel}</div>
                  <div className="mt-0.5 break-words text-xs text-muted-foreground leading-tight">
                    {job.sourceValue}
                  </div>
                </div>
              </td>
              <td
                data-label={copy.referenceSubtitleOptional}
                className={`${mobileTableCellClasses} md:w-48`}
              >
                <ReferenceSubtitleField
                  copy={copy}
                  initialFilename={job.referenceSubtitle}
                />
              </td>
              <td data-label={copy.action} className={mobileTableCellClasses}>
                <JobActions
                  copy={copy}
                  job={job}
                  onDeleteJob={onDeleteJob}
                  onUpdateJob={onUpdateJob}
                />
              </td>
              <td data-label={copy.status} className={mobileTableCellClasses}>
                <StatusPill copy={copy} status={job.status} />
              </td>
              <td data-label={copy.result} className={mobileTableCellClasses}>
                <Result
                  assets={assets}
                  copy={copy}
                  status={job.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferenceSubtitleHeader({ copy }: { copy: WorkflowPreviewCopy }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {copy.referenceSubtitleOptional}
      <Tooltip>
        <TooltipTrigger
          aria-label={copy.referenceSubtitleHelp}
          className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
        >
          <CircleHelp className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm rounded-xl px-4 py-3 text-left">
          <div className="space-y-2">
            <p className="font-medium">{copy.subtitleTooltipTitle}</p>
            <p className="text-background/80">{copy.subtitleTooltipDescription}</p>
            <p className="font-medium">{copy.subtitlePriority}</p>
            <ol className="space-y-1 text-background/80">
              {copy.subtitlePriorities.map((item, index) => (
                <li key={item}>
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </div>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function JobActions({
  copy,
  job,
  onDeleteJob,
  onUpdateJob,
}: {
  copy: WorkflowPreviewCopy;
  job: WorkflowPreviewJob;
  onDeleteJob: (jobId: string) => void;
  onUpdateJob: (jobId: string, updates: Partial<WorkflowPreviewJob>) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const confirmDelete = () => {
    onDeleteJob(job.id);
    setDeleteDialogOpen(false);
  };

  const startProcessing = async () => {
    if (uploading || job.status === "processing") {
      return;
    }

    setUploading(true);
    onUpdateJob(job.id, { status: "processing" });

    try {
      const uploadResult = job.sourceFile
        ? await uploadWorkflowFile(job.sourceFile)
        : undefined;
      const startedJob = await startWorkflowPreviewJob(job, uploadResult);

      onUpdateJob(job.id, {
        status: "complete",
        uploadedObjectKey: startedJob.objectKey,
        uploadedObjectUrl: startedJob.objectUrl,
      });
      toast.success(
        job.sourceFile ? "File uploaded to R2." : "URL sent to server.",
      );
    } catch (error) {
      onUpdateJob(job.id, { status: "failed" });
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <StartProcessingButton
          disabled={uploading || job.status === "processing"}
          label={copy.startProcessing}
          loading={uploading || job.status === "processing"}
          onClick={startProcessing}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={copy.jobActions}
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
            >
              <Trash2 className="size-4" />
              {copy.deleteJob}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="size-4" />
              {copy.viewDetails}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <XCircle className="size-4" />
              {copy.cancelJob}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.deleteJobTitle}</DialogTitle>
            <DialogDescription>{copy.deleteJobDescription}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
            <div className="font-medium">{job.sourceLabel}</div>
            <div className="mt-1 break-all text-muted-foreground">
              {job.sourceValue}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {copy.keepJob}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {copy.confirmDeleteJob}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StartProcessingButton({
  disabled,
  label,
  loading,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
