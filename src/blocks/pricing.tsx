"use client";

import { m } from "@/paraglide/messages.js";
import { tDynamic } from "@/core/i18n/dynamic";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import { useSession } from "@/core/auth/client";
import { apiPost } from "@/lib/api-client";
import { usePublicConfig } from "@/hooks/use-public-config";
import {
  PricingTable,
  type PricingGroup,
  type PricingPlan,
} from "@/components/pricing-table";
import {
  PaymentProviderModal,
  type PaymentProvider,
} from "@/components/payment-provider-modal";

const ALL_PROVIDERS: PaymentProvider[] = [
  "stripe",
  "creem",
  "paypal",
  "alipay",
  "wechat",
];

const proFeatureKeys = (planKey: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    tDynamic(`landing.pricing.plan.${planKey}.feature_${i + 1}`)
  );

export function Pricing({ title }: { title?: string } = {}) {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: configsData } = usePublicConfig();
  const configs = configsData ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PricingPlan | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<PaymentProvider | null>(null);

  const enabledProviders = useMemo<PaymentProvider[]>(
    () => ALL_PROVIDERS.filter((p) => configs[`${p}_enabled`] === "true"),
    [configs],
  );

  const proPlanBase = {
    currency: "usd",
    credits: 0,
  };

  const groups: PricingGroup[] = [
    {
      key: "free",
      label: m["landing.pricing.group.free"](),
      plans: [
        {
          id: "free",
          name: m["landing.pricing.plan.free.name"](),
          description: m["landing.pricing.plan.free.description"](),
          price: "$0",
          features: proFeatureKeys("free", 6),
          buttonText: m["landing.pricing.plan.free.button"](),
        },
      ],
    },
    {
      key: "payg",
      label: m["landing.pricing.group.payg"](),
      plans: [
        {
          id: "pro-one-month",
          name: m["landing.pricing.plan.pro_one_month.name"](),
          description: m["landing.pricing.plan.pro_one_month.description"](),
          price: "$4.90",
          features: proFeatureKeys("pro_one_month", 8),
          buttonText: m["landing.pricing.plan.pro_one_month.button"](),
          productId: "pro-one-month",
          priceInCents: 490,
          creditsValidDays: 30,
          ...proPlanBase,
        },
        {
          id: "pro-one-year",
          name: m["landing.pricing.plan.pro_one_year.name"](),
          description: m["landing.pricing.plan.pro_one_year.description"](),
          price: "$29.90",
          originalPrice: "$58.80",
          features: proFeatureKeys("pro_one_year", 8),
          buttonText: m["landing.pricing.plan.pro_one_year.button"](),
          productId: "pro-one-year",
          priceInCents: 2990,
          creditsValidDays: 365,
          ...proPlanBase,
        },
      ],
    },
    {
      key: "monthly",
      label: m["landing.pricing.group.monthly"](),
      plans: [
        {
          id: "pro-monthly",
          name: m["landing.pricing.plan.pro_monthly.name"](),
          description: m["landing.pricing.plan.pro_monthly.description"](),
          price: "$4.90",
          interval: "mo",
          featured: true,
          badge: m["landing.pricing.group.monthly_label"](),
          features: proFeatureKeys("pro_monthly", 8),
          buttonText: m["landing.pricing.plan.pro_monthly.button"](),
          productId: "pro-monthly",
          priceInCents: 490,
          creditsValidDays: 30,
          plan: { name: "Pro", interval: "month", intervalCount: 1 },
          ...proPlanBase,
        },
      ],
    },
    {
      key: "yearly",
      label: m["landing.pricing.group.yearly"](),
      plans: [
        {
          id: "pro-yearly",
          name: m["landing.pricing.plan.pro_yearly.name"](),
          description: m["landing.pricing.plan.pro_yearly.description"](),
          price: "$29.90",
          originalPrice: "$58.80",
          interval: "yr",
          badge: m["landing.pricing.group.yearly_label"](),
          features: proFeatureKeys("pro_yearly", 8),
          buttonText: m["landing.pricing.plan.pro_yearly.button"](),
          productId: "pro-yearly",
          priceInCents: 2990,
          creditsValidDays: 365,
          plan: { name: "Pro", interval: "year", intervalCount: 1 },
          ...proPlanBase,
        },
      ],
    },
  ];

  const checkoutMutation = useMutation({
    mutationFn: ({
      plan,
      provider,
    }: {
      plan: PricingPlan;
      provider: PaymentProvider;
    }) =>
      apiPost<{ checkout_url?: string }>("/api/payment/checkout", {
        product_id: plan.productId,
        product_name: plan.productName || plan.name,
        plan_name: plan.plan?.name || plan.name,
        price: plan.priceInCents,
        currency: plan.currency || "usd",
        type: plan.plan ? "subscription" : "one-time",
        description: plan.name,
        plan: plan.plan,
        credits: plan.credits,
        credits_valid_days: plan.creditsValidDays,
        payment_provider: provider,
      }),
    onSuccess: (data) => {
      if (!data?.checkout_url) {
        toast.error("Checkout failed");
        setLoadingProvider(null);
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Checkout failed");
      setLoadingProvider(null);
    },
  });

  function startCheckout(plan: PricingPlan, provider: PaymentProvider) {
    setLoadingProvider(provider);
    checkoutMutation.mutate({ plan, provider });
  }

  async function handleCheckout(plan: PricingPlan) {
    // The free plan has no checkout — send users to the tool.
    if (!plan.productId) {
      router.push("/#image-describer-tool");
      return;
    }

    if (!session?.user) {
      const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/pricing",
      );
      router.push(`/sign-in?redirect=${redirect}`);
      return;
    }

    const selectEnabled = configs.select_payment_enabled === "true";
    const defaultProvider = (configs.default_payment_provider ||
      enabledProviders[0] ||
      "stripe") as PaymentProvider;

    if (selectEnabled && enabledProviders.length > 1) {
      setPendingPlan(plan);
      setModalOpen(true);
      return;
    }

    await startCheckout(plan, defaultProvider);
  }

  function handleProviderSelect(provider: PaymentProvider) {
    if (!pendingPlan) return;
    startCheckout(pendingPlan, provider);
  }

  return (
    <section id="pricing" className="px-4 py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="font-serif font-normal text-4xl sm:text-5xl tracking-tight">
            {title ?? m["landing.pricing.page_title"]()}
          </h2>
          <p className="mt-5 text-muted-foreground">
            {m["landing.pricing.section_description"]()}
          </p>
        </div>
        <PricingTable groups={groups} onCheckout={handleCheckout} />
      </div>

      <PaymentProviderModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setPendingPlan(null);
            setLoadingProvider(null);
          }
        }}
        providers={enabledProviders.length ? enabledProviders : ["stripe"]}
        loadingProvider={loadingProvider}
        onSelect={handleProviderSelect}
        planName={pendingPlan?.name}
        price={pendingPlan?.price}
      />
    </section>
  );
}
