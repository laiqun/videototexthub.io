import { Sparkles } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

interface QuotaExceededDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
}

export default function QuotaExceededDialog({
  open,
  onOpenChange,
  title,
  description,
  ctaLabel,
  ctaHref,
  dismissLabel,
}: QuotaExceededDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1 text-left">
          <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-full">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dismissLabel}
          </Button>
          <Link
            href={ctaHref}
            className={cn(buttonVariants())}
            onClick={() => onOpenChange(false)}
          >
            {ctaLabel}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
