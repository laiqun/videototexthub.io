import { useMemo, useState, type ChangeEvent } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ImageDescriberCopy } from '@/lib/image-describer';
import { cn } from '@/lib/utils';

interface ImageDescriberPromptProps {
  copy: ImageDescriberCopy;
  value: string;
  onChange: (value: string) => void;
}

export default function ImageDescriberPrompt({
  copy,
  value,
  onChange,
}: ImageDescriberPromptProps) {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);

  const presetMap = useMemo(() => {
    return new Map(
      copy.prompt.presets.map((preset) => [preset.id, preset.prompt])
    );
  }, [copy.prompt.presets]);

  const buildPromptFromIds = (presetIds: string[]) => {
    return presetIds
      .map((presetId) => presetMap.get(presetId))
      .filter((presetPrompt): presetPrompt is string => Boolean(presetPrompt))
      .join('\n');
  };

  const getNextPresetIds = (currentPresetIds: string[], presetId: string) => {
    if (!isMultiSelect) {
      return [presetId];
    }

    if (currentPresetIds.includes(presetId)) {
      return currentPresetIds.filter((id) => id !== presetId);
    }

    return [...currentPresetIds, presetId];
  };

  const handlePresetClick = (presetId: string) => {
    const nextPresetIds = getNextPresetIds(selectedPresetIds, presetId);
    setSelectedPresetIds(nextPresetIds);
    onChange(buildPromptFromIds(nextPresetIds));
  };

  const handleMultiSelectChange = (checked: boolean | 'indeterminate') => {
    const nextIsMultiSelect = checked === true;
    setIsMultiSelect(nextIsMultiSelect);

    if (!nextIsMultiSelect && selectedPresetIds.length > 1) {
      const nextPresetIds = [selectedPresetIds[0]];
      setSelectedPresetIds(nextPresetIds);
      onChange(buildPromptFromIds(nextPresetIds));
    }
  };

  const handleQuestionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedPresetIds.length > 0) {
      setSelectedPresetIds([]);
    }

    onChange(event.target.value);
  };

  return (
    <section className="px-4 pt-6">
      <div className="mx-auto max-w-5xl">
        <h3 className="text-lg font-semibold">{copy.prompt.title}</h3>

        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            id="preset-multi-select"
            checked={isMultiSelect}
            onCheckedChange={handleMultiSelectChange}
          />
          <Label htmlFor="preset-multi-select">{copy.prompt.multiSelect}</Label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {copy.prompt.presets.map((preset) => {
            const isSelected = selectedPresetIds.includes(preset.id);

            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={cn(
                  'rounded-full border border-blue-500 px-3 py-1.5 text-sm transition-colors',
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:bg-zinc-900 dark:text-blue-400'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <Textarea
          value={value}
          onChange={handleQuestionChange}
          placeholder={copy.prompt.placeholder}
          className="mt-3 min-h-28 resize-y border-blue-200/80 bg-white/90 dark:border-blue-300/80"
        />
      </div>
    </section>
  );
}
