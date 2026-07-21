import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    image: "/imgs/features/feature-alt-text.svg",
    alt: "AI Image Describer description preview",
  },
  {
    image: "/imgs/features/feature-captions.svg",
    alt: "AI Image Describer caption preview",
  },
  {
    image: "/imgs/features/feature-ocr.svg",
    alt: "AI Image Describer OCR preview",
  },
];

export function FeaturesFlow() {
  return (
    <section id="features" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {m["landing.features_flow.title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground max-w-2xl mx-auto">
            {m["landing.features_flow.description"]()}
          </p>
        </div>
        <div className="space-y-16 sm:space-y-24">
          {ITEMS.map(({ image, alt }, i) => (
            <div
              key={i}
              className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12"
            >
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-border bg-muted",
                  i % 2 === 1 && "sm:order-2"
                )}
              >
                <img
                  src={image}
                  alt={alt}
                  loading="lazy"
                  className="w-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-2xl sm:text-3xl tracking-tight">
                  {tDynamic(`landing.features_flow.items.${i + 1}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tDynamic(`landing.features_flow.items.${i + 1}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
