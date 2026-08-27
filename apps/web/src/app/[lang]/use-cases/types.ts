import type { FaqItem } from "@/components/faq/faq-list";

export type UseCaseContent = {
  meta: { title: string; description: string; keywords: string[] };
  hero: {
    headline: string;
    subheadline: string;
    ctaLabel: string;
  };
  pain: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  solution: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  faq: { title: string; questions: FaqItem[] };
};

export type UseCasePage = {
  slugDe: string;
  slugEn: string;
  de: UseCaseContent;
  en: UseCaseContent;
};
