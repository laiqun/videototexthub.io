import { createFileRoute } from '@tanstack/react-router';

import { Header } from '@/blocks/header';
import { Footer } from '@/blocks/footer';
import {
  EXTRACT_TEXT_FAQ_KEYS,
  ExtractTextFaq,
  ExtractTextHero,
  ExtractTextHowItWorks,
  ExtractTextTool,
} from '@/blocks/extract-text';
import { envConfigs } from '@/config';
import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

type FaqEntry = { question: string; answer: string };

function getBaseUrl() {
  return envConfigs.app_url.endsWith('/')
    ? envConfigs.app_url.slice(0, -1)
    : envConfigs.app_url;
}

function buildJsonLd(locale: string, faqItems: FaqEntry[]) {
  const pageUrl = `${getBaseUrl()}/extract-text-from-picture`;

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: 'Extract Text from Picture',
      description: envConfigs.app_description,
      inLanguage: locale,
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

function ExtractTextPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main>
        <ExtractTextHero />
        <ExtractTextTool />
        <ExtractTextHowItWorks />
        <ExtractTextFaq />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute('/extract-text-from-picture')({
  loader: () => {
    const locale = getLocale();
    // tDynamic resolves in the active locale (server-side via paraglideMiddleware).
    const faqItems = EXTRACT_TEXT_FAQ_KEYS.map((key) => ({
      question: tDynamic(`extractText.faq.${key}.question`),
      answer: tDynamic(`extractText.faq.${key}.answer`),
    }));
    return { locale, faqItems };
  },
  head: ({ loaderData }) => {
    const locale = (loaderData?.locale ?? 'en') as 'en' | 'zh';
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/extract-text-from-picture`, {
        locale: loc as any,
      }).href;
    const jsonLd = loaderData
      ? JSON.stringify(buildJsonLd(locale, loaderData.faqItems)).replace(
          /</g,
          '\\u003c'
        )
      : undefined;
    return {
      meta: [
        { title: m['extractText.meta.title']({}, { locale }) },
        {
          name: 'description',
          content: m['extractText.meta.description']({}, { locale }),
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
  component: ExtractTextPage,
});
