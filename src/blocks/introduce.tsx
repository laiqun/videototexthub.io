import { Captions, Images, ScanText, Wand2, type LucideIcon } from "lucide-react";

import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";

const ITEMS: { icon: LucideIcon; image: string }[] = [
  { icon: ScanText, image: "/imgs/features/1.png" },
  { icon: Captions, image: "/imgs/features/2.png" },
  { icon: Wand2, image: "/imgs/features/3.png" },
  { icon: Images, image: "/imgs/features/4.png" },
];

export function Introduce() {
  return (
    <section id="introduce" className="px-4 py-24 sm:py-32 bg-muted/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
            {m["landing.introduce.label"]()}
          </p>
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {m["landing.introduce.title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground max-w-2xl mx-auto">
            {m["landing.introduce.description"]()}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, image }, i) => (
            <div
              key={i}
              className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={image}
                  alt={tDynamic(`landing.introduce.items.${i + 1}.title`)}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80 transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">
                    {tDynamic(`landing.introduce.items.${i + 1}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tDynamic(`landing.introduce.items.${i + 1}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
