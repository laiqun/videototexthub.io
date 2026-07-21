import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const IMAGES = [
  "/imgs/features/why1.png",
  "/imgs/features/why2.png",
  "/imgs/features/why3.png",
];

export function Benefits() {
  return (
    <section id="benefits" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
            {m["landing.benefits.label"]()}
          </p>
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {m["landing.benefits.title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground max-w-lg mx-auto">
            {m["landing.benefits.description"]()}
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion className="w-full" defaultValue={["item-1"]}>
            {IMAGES.map((image, i) => (
              <AccordionItem key={i} value={`item-${i + 1}`}>
                <AccordionTrigger className="cursor-pointer py-6 text-left text-base font-medium hover:no-underline">
                  {tDynamic(`landing.benefits.items.${i + 1}.title`)}
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {tDynamic(`landing.benefits.items.${i + 1}.description`)}
                  </p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={image}
                      alt={tDynamic(`landing.benefits.items.${i + 1}.title`)}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
