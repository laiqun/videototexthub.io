import { envConfigs } from '@/config';
import { ImageDescriberTool } from '@/blocks/image-describer-tool';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DotPattern } from '@/components/ui/dot-pattern';
import { tDynamic } from '@/core/i18n/dynamic';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';

const HOW_STEP_KEYS = ['upload', 'process', 'export'] as const;

export const BATCH_FAQ_KEYS = [
  'what',
  'limit',
  'export',
  'free',
  'languages',
] as const;

export function BatchHero() {
  return (
    <section className="relative isolate flex flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-12 sm:pt-32 sm:pb-16">
      <DotPattern
        className={cn(
          '[mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]',
          'text-foreground/15'
        )}
      />
      <div className="relative max-w-3xl text-center space-y-8">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
          {envConfigs.app_name}
        </p>
        <h1 className="font-serif font-normal text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground">
          {m['batch.hero.headline']()}
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
          {m['batch.hero.subheadline']()}
        </p>
      </div>
    </section>
  );
}

export function BatchTool() {
  return (
    <ImageDescriberTool
      title={m['batch.tool.title']()}
      description={m['batch.tool.description']()}
      tip={m['batch.tool.tip']()}
      defaultPresetId="describe-detail"
    />
  );
}

export function BatchHowItWorks() {
  return (
    <section className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="font-serif font-medium text-4xl sm:text-5xl tracking-tight">
            {m['batch.how.title']()}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {m['batch.how.description']()}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_STEP_KEYS.map((key, index) => (
            <div key={key} className="rounded-3xl border border-dashed p-8">
              <span className="font-serif text-3xl text-muted-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {tDynamic(`batch.how.steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {tDynamic(`batch.how.steps.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BatchFaq() {
  return (
    <section id="faq" className="px-4 pb-24 sm:pb-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-serif font-medium text-4xl sm:text-5xl tracking-tight">
            {m['batch.faq.title']()}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {m['batch.faq.description']()}
          </p>
        </div>
        <Accordion className="w-full">
          {BATCH_FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="cursor-pointer py-6 text-left text-base font-medium hover:no-underline">
                {tDynamic(`batch.faq.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                {tDynamic(`batch.faq.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
