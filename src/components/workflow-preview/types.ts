import { type LucideIcon } from "lucide-react";

export type WorkflowPreviewStatus =
  | "complete"
  | "failed"
  | "processing"
  | "queued";

export interface WorkflowPreviewJob {
  id: string;
  sourceLabel: string;
  sourceValue: string;
  referenceSubtitle?: string;
  sourceFile?: File;
  status: WorkflowPreviewStatus;
  uploadedObjectKey?: string;
  uploadedObjectUrl?: string;
}

export interface WorkflowPreviewDownloadAsset {
  key: string;
  icon: LucideIcon;
  label: string;
}

export interface WorkflowPreviewCopy {
  title: string;
  description: string;
  uploadTab: string;
  pasteTab: string;
  dropzoneTitle: string;
  supportedMedia: string;
  pastePlaceholder: string;
  addQueue: string;
  subtitleTooltipTitle: string;
  subtitleTooltipDescription: string;
  subtitlePriority: string;
  subtitlePriorities: string[];
  jobs: string;
  referenceSubtitleOptional: string;
  referenceSubtitleHelp: string;
  uploadSubtitle: string;
  reuploadSubtitle: string;
  status: string;
  action: string;
  result: string;
  advanced: string;
  generateAiNote: string;
  stylePrompt: string;
  stylePromptPlaceholder: string;
  visualOutput: string;
  yes: string;
  no: string;
  stepSize: string;
  screenshotsGrid: string;
  gridRows: string;
  gridColumns: string;
  languageHint: string;
  languageHintPlaceholder: string;
  startProcessing: string;
  jobActions: string;
  deleteJob: string;
  deleteJobTitle: string;
  deleteJobDescription: string;
  confirmDeleteJob: string;
  keepJob: string;
  viewDetails: string;
  cancelJob: string;
  retryJob: string;
  openNote: string;
  download: string;
  retry: string;
  processing: string;
  complete: string;
  failed: string;
  queued: string;
  downloadsTitle: string;
  downloadsDescription: string;
}
