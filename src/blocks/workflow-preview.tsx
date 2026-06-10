import { useState } from "react";
import {
  AudioLines,
  Captions,
  FileJson,
  FileText,
  NotebookPen,
} from "lucide-react";

import { WorkflowPreviewAdvancedPanel } from "@/components/workflow-preview/advanced-panel";
import { WorkflowPreviewInputPanel } from "@/components/workflow-preview/input-panel";
import { WorkflowPreviewJobsPanel } from "@/components/workflow-preview/jobs-panel";
import {
  type WorkflowPreviewCopy,
  type WorkflowPreviewDownloadAsset,
  type WorkflowPreviewJob,
} from "@/components/workflow-preview/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { m } from "@/paraglide/messages.js";

export function WorkflowPreview() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [generateAiNote, setGenerateAiNote] = useState(true);
  const [visualOutput, setVisualOutput] = useState(true);

  const copy: WorkflowPreviewCopy = {
    eyebrow: m["landing.demo.eyebrow"](),
    title: m["landing.demo.title"](),
    description: m["landing.demo.description"](),
    uploadTab: m["landing.demo.upload_tab"](),
    pasteTab: m["landing.demo.paste_tab"](),
    dropzoneTitle: m["landing.demo.dropzone_title"](),
    supportedMedia: m["landing.demo.supported_media"](),
    pastePlaceholder: m["landing.demo.paste_placeholder"](),
    addQueue: m["landing.demo.add_queue"](),
    subtitleTooltipTitle: m["landing.demo.subtitle_tooltip_title"](),
    subtitleTooltipDescription: m["landing.demo.subtitle_tooltip_description"](),
    subtitlePriority: m["landing.demo.subtitle_priority"](),
    subtitlePriorities: [
      m["landing.demo.priority_manual"](),
      m["landing.demo.priority_embedded"](),
      m["landing.demo.priority_auto"](),
    ],
    jobs: m["landing.demo.jobs"](),
    referenceSubtitle: m["landing.demo.reference_subtitle"](),
    referenceSubtitleHelp: m["landing.demo.reference_subtitle_help"](),
    uploadSubtitle: m["landing.demo.upload_subtitle"](),
    reuploadSubtitle: m["landing.demo.reupload_subtitle"](),
    status: m["landing.demo.status"](),
    action: m["landing.demo.action"](),
    result: m["landing.demo.result"](),
    advanced: m["landing.demo.advanced"](),
    generateAiNote: m["landing.demo.generate_ai_note"](),
    stylePrompt: m["landing.demo.style_prompt"](),
    stylePromptPlaceholder: m["landing.demo.style_prompt_placeholder"](),
    visualOutput: m["landing.demo.visual_output"](),
    yes: m["landing.demo.yes"](),
    no: m["landing.demo.no"](),
    stepSize: m["landing.demo.step_size"](),
    screenshotsGrid: m["landing.demo.screenshots_grid"](),
    languageHint: m["landing.demo.language_hint"](),
    languageHintPlaceholder: m["landing.demo.language_hint_placeholder"](),
    startProcessing: m["landing.demo.start_processing"](),
    openNote: m["landing.demo.open_note"](),
    download: m["landing.demo.download"](),
    retry: m["landing.demo.retry"](),
    processing: m["landing.demo.processing"](),
    complete: m["landing.demo.complete"](),
    failed: m["landing.demo.failed"](),
    queued: m["landing.demo.queued"](),
    downloadsTitle: m["landing.demo.downloads.title"](),
    downloadsDescription: m["landing.demo.downloads.description"](),
  };

  const jobs: WorkflowPreviewJob[] = [
    {
      id: "youtube-note",
      sourceLabel: m["landing.demo.source.youtube"](),
      sourceValue: "youtube.com/watch?v=note-01",
      referenceSubtitle: "lesson-outline.vtt",
      status: "complete",
    },
    {
      id: "uploaded-media",
      sourceLabel: m["landing.demo.source.uploaded"](),
      sourceValue: "launch-cut.mp4",
      status: "failed",
    },
    {
      id: "podcast",
      sourceLabel: m["landing.demo.source.uploaded"](),
      sourceValue: "podcast-intro.wav",
      referenceSubtitle: "podcast.srt",
      status: "complete",
    },
    {
      id: "course",
      sourceLabel: m["landing.demo.source.youtube"](),
      sourceValue: "youtube.com/watch?v=course-02",
      referenceSubtitle: "course-reference.vtt",
      status: "queued",
    },
    {
      id: "founder",
      sourceLabel: m["landing.demo.source.uploaded"](),
      sourceValue: "founder-interview.mov",
      status: "failed",
    },
  ];

  const downloadAssets: WorkflowPreviewDownloadAsset[] = [
    {
      key: "final",
      icon: NotebookPen,
      label: m["landing.demo.downloads.final_note"](),
    },
    {
      key: "cleaned",
      icon: FileText,
      label: m["landing.demo.downloads.cleaned_subtitle"](),
    },
    {
      key: "segments",
      icon: FileJson,
      label: m["landing.demo.downloads.segments_json"](),
    },
    {
      key: "raw",
      icon: Captions,
      label: m["landing.demo.downloads.raw_subtitle"](),
    },
    {
      key: "audio",
      icon: AudioLines,
      label: m["landing.demo.downloads.original_audio"](),
    },
  ];

  return (
    <TooltipProvider delay={120}>
      <section className="px-4 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_32px_100px_-56px_rgba(15,23,42,0.4)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_45%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_35%)]" />

            <div className="relative border-b border-border/70 px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {copy.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {copy.description}
              </p>
            </div>

            <div className="relative space-y-6 px-6 py-6 sm:px-10 sm:py-8">
              <WorkflowPreviewInputPanel copy={copy} />
              <WorkflowPreviewAdvancedPanel
                advancedOpen={advancedOpen}
                copy={copy}
                generateAiNote={generateAiNote}
                onAdvancedOpenChange={setAdvancedOpen}
                onGenerateAiNoteChange={setGenerateAiNote}
                onVisualOutputChange={setVisualOutput}
                visualOutput={visualOutput}
              />
              <WorkflowPreviewJobsPanel
                assets={downloadAssets}
                copy={copy}
                jobs={jobs}
              />
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
