import { type FaqItem } from "./faq-list";

export function FaqJsonLd({ questions }: { questions: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((question) => ({
      "@type": "Question",
      name: question.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: question.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
