import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  type WorkflowPreviewCopy,
  type WorkflowPreviewStatus,
} from "./types";

export function StatusPill({
  copy,
  status,
}: {
  copy: WorkflowPreviewCopy;
  status: WorkflowPreviewStatus;
}) {
  const map: Record<
    WorkflowPreviewStatus,
    { icon: LucideIcon; label: string; className: string }
  > = {
    complete: {
      icon: CheckCircle2,
      label: copy.complete,
      className:
        "border-emerald-700/15 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    },
    failed: {
      icon: AlertCircle,
      label: copy.failed,
      className:
        "border-amber-700/15 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    },
    queued: {
      icon: CircleHelp,
      label: copy.queued,
      className:
        "border-sky-700/15 bg-sky-500/10 text-sky-900 dark:text-sky-100",
    },
  };

  const { icon: Icon, label, className } = map[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        className
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
