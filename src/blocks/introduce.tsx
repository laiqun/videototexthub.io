import { Captions, Images, ScanSearch, ScanText, type LucideIcon } from "lucide-react";

import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";

const ITEMS: LucideIcon[] = [ScanSearch, Captions, ScanText, Images];

export function Introduce() {
  return (
    <section id="introduce" className="overflow-x-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-5xl overflow-x-hidden px-4">
        <div className="flex flex-wrap items-center gap-8 pb-12 md:gap-24">
          <div className="mx-auto w-full max-w-[500px] flex-shrink-0 md:mx-0">
            <img
              src="/preview.png"
              alt="introduce"
              loading="lazy"
              className="h-auto w-full rounded-lg object-cover"
            />
          </div>
          <div className="w-full min-w-0 flex-1">
            <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight text-balance break-words">
              {m["landing.introduce.title"]()}
            </h2>
            <p className="text-md text-muted-foreground my-6 text-balance break-words">
              {m["landing.introduce.description"]()}
            </p>
          </div>
        </div>
        <div className="relative grid min-w-0 grid-cols-1 gap-x-3 gap-y-6 border-t pt-12 break-words sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {ITEMS.map((Icon, i) => (
            <div key={i} className="min-w-0 space-y-3 break-words">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0" />
                <h3 className="min-w-0 text-sm font-medium break-words">
                  {tDynamic(`landing.introduce.items.${i + 1}.title`)}
                </h3>
              </div>
              <p className="text-muted-foreground min-w-0 text-sm break-words">
                {tDynamic(`landing.introduce.items.${i + 1}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
