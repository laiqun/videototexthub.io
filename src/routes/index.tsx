import { createFileRoute } from '@tanstack/react-router';
import { Header } from "@/blocks/header";
import { Hero } from "@/blocks/hero";
import { ImageDescriberTool } from "@/blocks/image-describer-tool";
import { Introduce } from "@/blocks/introduce";
import { Benefits } from "@/blocks/benefits";
import { Usage } from "@/blocks/usage";
import { FeaturesFlow } from "@/blocks/features-flow";
import { Showcases } from "@/blocks/showcases";
import { FAQ } from "@/blocks/faq";
import { CTA } from "@/blocks/cta";
import { Footer } from "@/blocks/footer";
import { envConfigs } from "@/config";
import { tDynamic } from "@/core/i18n/dynamic";
import { m } from "@/paraglide/messages.js";
import { getLocale, locales, localizeUrl } from "@/paraglide/runtime.js";

const FAQ_KEYS = [
  'what',
  'free',
  'use_cases',
  'privacy',
  'ai_prompts',
  'commercial',
  'formats',
  'languages',
  'accuracy',
  'feedback',
] as const;

type FaqEntry = { question: string; answer: string };

function getBaseUrl() {
  return envConfigs.app_url.endsWith('/')
    ? envConfigs.app_url.slice(0, -1)
    : envConfigs.app_url;
}

function buildHomeJsonLd(locale: string, faqItems: FaqEntry[]) {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/`;
  const appName = envConfigs.app_name;
  const appDescription = envConfigs.app_description;
  const withBase = (path: string) =>
    path.startsWith('http') ? path : `${baseUrl}${path}`;
  const logoUrl = withBase(envConfigs.app_logo || '/logo.png');
  const previewImage = withBase('/preview.png');

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'WebSite',
      '@id': `${pageUrl}#website`,
      url: pageUrl,
      name: appName,
      description: appDescription,
      inLanguage: locale,
    },
    {
      '@type': 'Organization',
      '@id': `${pageUrl}#organization`,
      name: appName,
      url: pageUrl,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
      image: previewImage,
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: appName,
      description: appDescription,
      inLanguage: locale,
      isPartOf: {
        '@id': `${pageUrl}#website`,
      },
      about: {
        '@id': `${pageUrl}#webapp`,
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${pageUrl}#webapp`,
      name: appName,
      url: pageUrl,
      description: appDescription,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      inLanguage: locale,
      isAccessibleForFree: true,
      image: previewImage,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: {
        '@id': `${pageUrl}#organization`,
      },
    },
  ];

  const mainEntity = faqItems
    .filter((item) => item.question && item.answer)
    .map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }));

  if (mainEntity.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ImageDescriberTool />
        <Introduce />
        <Benefits />
        <Usage />
        <FeaturesFlow />
        <Showcases />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute('/')({
  loader: () => {
    const locale = getLocale();
    // tDynamic resolves in the active locale (server-side via paraglideMiddleware).
    const faqItems = FAQ_KEYS.map((key) => ({
      question: tDynamic(`landing.faq.${key}.question`),
      answer: tDynamic(`landing.faq.${key}.answer`),
    }));
    return { locale, faqItems };
  },
  head: ({ loaderData }) => {
    const locale = (loaderData?.locale ?? 'en') as 'en' | 'zh';
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/`, { locale: loc as any }).href;
    const jsonLd = loaderData
      ? JSON.stringify(buildHomeJsonLd(locale, loaderData.faqItems)).replace(
          /</g,
          '\\u003c'
        )
      : undefined;
    return {
      meta: [
        {
          name: 'title',
          content: m['landing.title']({}, { locale }),
        },
        {
          name: 'description',
          content: m['landing.description']({}, { locale }),
        },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
      scripts: jsonLd
        ? [{ type: 'application/ld+json', children: jsonLd }]
        : [],
    };
  },
  component: HomePage,
});
