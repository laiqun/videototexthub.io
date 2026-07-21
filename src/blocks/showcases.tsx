import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";

// Image mapping preserved from the old site (case 1 used case2.png, case 2 used case1.png).
const IMAGES = [
  "/imgs/cases/case2.png",
  "/imgs/cases/case1.png",
  "/imgs/cases/case3.png",
];

export function Showcases() {
  return (
    <section id="showcases" className="px-4 py-24 sm:py-32 bg-muted/40">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {m["landing.showcases.title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground max-w-lg mx-auto">
            {m["landing.showcases.description"]()}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {IMAGES.map((image, i) => (
            <figure
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <img
                src={image}
                alt={tDynamic(`landing.showcases.cases.${i + 1}.title`)}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="font-medium">
                  {tDynamic(`landing.showcases.cases.${i + 1}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {tDynamic(`landing.showcases.cases.${i + 1}.description`)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
