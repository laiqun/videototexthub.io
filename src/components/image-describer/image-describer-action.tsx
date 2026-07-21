import { useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import type { ImageDescriberCopy } from '@/lib/image-describer';

interface ImageDescriberActionProps {
  copy: ImageDescriberCopy;
  disabled?: boolean;
  onDescribe?: () => void;
}

export default function ImageDescriberAction({
  copy,
  disabled,
  onDescribe,
}: ImageDescriberActionProps) {
  const handleDescribe = useCallback(() => {
    if (disabled) {
      return;
    }

    onDescribe?.();
  }, [disabled, onDescribe]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        handleDescribe();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDescribe]);

  return (
    <section className="px-4 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex">
          <Button
            type="button"
            onClick={handleDescribe}
            disabled={disabled}
            className="relative h-11 w-full justify-center"
          >
            <span className="mx-auto">{copy.action.describe}</span>
            <span className="text-primary-foreground/70 absolute right-4 text-xs">
              {copy.action.shortcut}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
