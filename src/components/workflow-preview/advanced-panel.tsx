import {
  Image,
  Languages,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { type WorkflowPreviewCopy } from "./types";

export function WorkflowPreviewAdvancedPanel({
  advancedOpen,
  copy,
  generateAiNote,
  onAdvancedOpenChange,
  onGenerateAiNoteChange,
  onVisualOutputChange,
  visualOutput,
}: {
  advancedOpen: boolean;
  copy: WorkflowPreviewCopy;
  generateAiNote: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
  onGenerateAiNoteChange: (checked: boolean) => void;
  onVisualOutputChange: (checked: boolean) => void;
  visualOutput: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ToggleButton
          checked={advancedOpen}
          id="advanced-options-toggle"
          onClick={() => onAdvancedOpenChange(!advancedOpen)}
        />
        <Label htmlFor="advanced-options-toggle">{copy.advanced}</Label>
      </div>

      {advancedOpen && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="generate-ai-note">
                <Sparkles className="size-4 text-emerald-700" />
                {copy.generateAiNote}
              </Label>
              <ToggleButton
                checked={generateAiNote}
                id="generate-ai-note"
                onClick={() => onGenerateAiNoteChange(!generateAiNote)}
              />
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="style-prompt">{copy.stylePrompt}</Label>
              <Textarea
                defaultValue={copy.stylePromptPlaceholder}
                id="style-prompt"
                rows={5}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="visual-output">
                <Image className="size-4 text-emerald-700" />
                {copy.visualOutput}
              </Label>
              <ToggleButton
                checked={visualOutput}
                id="visual-output"
                onClick={() => onVisualOutputChange(!visualOutput)}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard label={copy.stepSize} value="6 s" />
              <MetricCard label={copy.screenshotsGrid} value="4 x 4" />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="language-hint">
                <Languages className="size-4 text-emerald-700" />
                {copy.languageHint}
              </Label>
              <Input
                defaultValue="English"
                id="language-hint"
                placeholder={copy.languageHintPlaceholder}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-medium">{value}</p>
    </div>
  );
}

function ToggleButton({
  checked,
  id,
  onClick,
}: {
  checked: boolean;
  id: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      className="inline-flex h-7 w-12 items-center rounded-full border border-border bg-muted px-1 transition-colors"
      id={id}
      onClick={onClick}
      role="switch"
      type="button"
    >
      <span
        className={`block size-5 rounded-full transition-transform ${
          checked ? "translate-x-5 bg-emerald-600" : "translate-x-0 bg-red-500"
        }`}
      />
    </button>
  );
}
