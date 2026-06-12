import { useState } from "react";
import {
  CircleHelp,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

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

import { Result } from "./result";
import { ReferenceSubtitleField } from "./reference-subtitle-field";
import { StatusPill } from "./status-pill";
import {
  type WorkflowPreviewCopy,
  type WorkflowPreviewDownloadAsset,
  type WorkflowPreviewJob,
} from "./types";

const mobileTableCellClasses =
  "flex flex-col gap-1 border-b border-border/40 px-4 py-3 last:border-b-0 md:table-cell md:border-b-0 md:px-4 md:py-4 md:align-top before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.18em] before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden";

export function JobsPanel({
  assets,
  copy,
  jobs,
  onDeleteJob,
}: {
  assets: WorkflowPreviewDownloadAsset[];
  copy: WorkflowPreviewCopy;
  jobs: WorkflowPreviewJob[];
  onDeleteJob: (jobId: string) => void;
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
                <JobActions copy={copy} job={job} onDeleteJob={onDeleteJob} />
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
}: {
  copy: WorkflowPreviewCopy;
  job: WorkflowPreviewJob;
  onDeleteJob: (jobId: string) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const confirmDelete = () => {
    onDeleteJob(job.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <StartProcessingButton label={copy.startProcessing} />
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

function StartProcessingButton({ label }: { label: string }) {
  return (
    <Button className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
      {label}
    </Button>
  );
}
