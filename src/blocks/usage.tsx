import { ArrowBigRight } from "lucide-react";
import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";

const STEPS = [1, 2, 3, 4] as const;

export function Usage() {
  return (
    <section id="usage" className="py-16 md:py-24 bg-muted">
      <div className="m-4 rounded-[2rem]">
        <div className="@container relative mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-foreground mt-4 text-4xl font-semibold">
              {m["landing.usage.title"]()}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg text-balance">
              {m["landing.usage.description"]()}
            </p>
          </div>
          <div className="mt-20 grid gap-12 @3xl:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step} className="space-y-6">
                <div className="text-center">
                  <span className="mx-auto flex size-6 items-center justify-center rounded-full bg-zinc-500/15 text-sm font-medium">
                    {step}
                  </span>
                  <div className="relative">
                    <div className="mx-auto my-6 w-fit" />
                    {step < STEPS.length && (
                      <ArrowBigRight
                        aria-hidden="true"
                        className="fill-muted stroke-primary absolute inset-y-0 right-0 my-auto mt-1 hidden translate-x-[150%] drop-shadow @3xl:block"
                      />
                    )}
                  </div>
                  <h3 className="text-foreground mb-4 text-lg font-semibold">
                    {tDynamic(`landing.usage.items.${step}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-balance">
                    {tDynamic(`landing.usage.items.${step}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
