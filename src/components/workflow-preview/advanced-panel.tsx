import {
  Image,
  Languages,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { type WorkflowPreviewCopy } from "./types";

const STEP_SIZE_MIN = 200;
const STEP_SIZE_DEFAULT = 6000;

export function AdvancedPanel({
  advancedOpen,
  copy,
  generateAiNote,
  gridCols,
  gridRows,
  onAdvancedOpenChange,
  onGenerateAiNoteChange,
  onGridColsChange,
  onGridRowsChange,
  onStepSizeChange,
  onVisualOutputChange,
  stepSize,
  visualOutput,
}: {
  advancedOpen: boolean;
  copy: WorkflowPreviewCopy;
  generateAiNote: boolean;
  gridCols: number;
  gridRows: number;
  onAdvancedOpenChange: (open: boolean) => void;
  onGenerateAiNoteChange: (checked: boolean) => void;
  onGridColsChange: (cols: number) => void;
  onGridRowsChange: (rows: number) => void;
  onStepSizeChange: (ms: number) => void;
  onVisualOutputChange: (checked: boolean) => void;
  stepSize: number;
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
              <div className="space-y-2">
                <Label htmlFor="step-size">{copy.stepSize} (ms)</Label>
                <Input
                  id="step-size"
                  max={60000}
                  min={STEP_SIZE_MIN}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= STEP_SIZE_MIN) {
                      onStepSizeChange(v);
                    }
                  }}
                  type="number"
                  value={stepSize}
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.screenshotsGrid}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground" htmlFor="grid-rows">{copy.gridRows}</Label>
                    <Input
                      id="grid-rows"
                      min={1}
                      max={10}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1) onGridRowsChange(v);
                      }}
                      type="number"
                      value={gridRows}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground" htmlFor="grid-cols">{copy.gridColumns}</Label>
                    <Input
                      id="grid-cols"
                      min={1}
                      max={10}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1) onGridColsChange(v);
                      }}
                      type="number"
                      value={gridCols}
                    />
                  </div>
                </div>
              </div>
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
