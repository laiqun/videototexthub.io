import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";

const IMAGES = [
  "/imgs/features/5.png",
  "/imgs/features/6.png",
  "/imgs/features/7.png",
  "/imgs/features/8.png",
];

export function Usage() {
  return (
    <section id="usage" className="px-4 py-24 sm:py-32 bg-muted/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {m["landing.usage.title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground max-w-lg mx-auto">
            {m["landing.usage.description"]()}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {IMAGES.map((image, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <span className="font-serif text-4xl text-muted-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-2">
                <h3 className="font-medium">
                  {tDynamic(`landing.usage.items.${i + 1}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tDynamic(`landing.usage.items.${i + 1}.description`)}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={image}
                  alt={tDynamic(`landing.usage.items.${i + 1}.title`)}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
