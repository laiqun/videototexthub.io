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

const PROMPT_PRESET_IDS = [
  'general-image-prompt',
  'midjourney-prompt',
  'stable-diffusion-prompt',
  'flux-prompt',
] as const;

const HOW_STEP_KEYS = ['upload', 'generate', 'copy'] as const;

export const IMAGE_TO_PROMPT_FAQ_KEYS = [
  'what',
  'free',
  'formats',
  'languages',
  'batch',
] as const;

export function ImageToPromptHero() {
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
          {m['imageToPrompt.hero.headline']()}
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
          {m['imageToPrompt.hero.subheadline']()}
        </p>
      </div>
    </section>
  );
}

export function ImageToPromptTool() {
  return (
    <ImageDescriberTool
      title={m['imageToPrompt.tool.title']()}
      description={m['imageToPrompt.tool.description']()}
      tip={m['imageToPrompt.tool.tip']()}
      presetIds={PROMPT_PRESET_IDS}
      defaultPresetId="general-image-prompt"
    />
  );
}

export function ImageToPromptHowItWorks() {
  return (
    <section className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="font-serif font-medium text-4xl sm:text-5xl tracking-tight">
            {m['imageToPrompt.how.title']()}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {m['imageToPrompt.how.description']()}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_STEP_KEYS.map((key, index) => (
            <div key={key} className="rounded-3xl border border-dashed p-8">
              <span className="font-serif text-3xl text-muted-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {tDynamic(`imageToPrompt.how.steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {tDynamic(`imageToPrompt.how.steps.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ImageToPromptFaq() {
  return (
    <section id="faq" className="px-4 pb-24 sm:pb-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-serif font-medium text-4xl sm:text-5xl tracking-tight">
            {m['imageToPrompt.faq.title']()}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {m['imageToPrompt.faq.description']()}
          </p>
        </div>
        <Accordion className="w-full">
          {IMAGE_TO_PROMPT_FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="cursor-pointer py-6 text-left text-base font-medium hover:no-underline">
                {tDynamic(`imageToPrompt.faq.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                {tDynamic(`imageToPrompt.faq.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
