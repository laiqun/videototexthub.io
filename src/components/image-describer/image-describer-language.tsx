import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ImageDescriberCopy,
  ImageDescriberLanguageOption,
} from '@/lib/image-describer';

interface ImageDescriberLanguageProps {
  copy: ImageDescriberCopy;
  options: ImageDescriberLanguageOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function ImageDescriberLanguage({
  copy,
  options,
  value,
  onChange,
}: ImageDescriberLanguageProps) {
  return (
    <section className="px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mt-3 flex flex-col gap-2">
          <Label htmlFor="output-language">{copy.language.label}</Label>
          <Select
            value={value}
            onValueChange={(nextValue) => {
              if (nextValue) {
                onChange(nextValue);
              }
            }}
          >
            <SelectTrigger id="output-language" className="w-full max-w-xs">
              <SelectValue placeholder={copy.language.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
