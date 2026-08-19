import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { constructMetadata } from "@scibly/lib";
import { notFound } from "next/navigation";
import { type ComponentType, createElement } from "react";

import { BLOG_POSTS } from "@/app/[lang]/blog/components/posts";
import { buildLocaleAlternates } from "@/lib/metadata";
import { useMDXComponents } from "@/mdx-components";

export function getBlogPostMetadata(slug: string, lang: Locale): Metadata {
  const post = BLOG_POSTS[lang]?.find((p) => p.slug === slug);
  if (!post) return {};

  const { canonicalUrl, languages } = buildLocaleAlternates(
    `/blog/${slug}`,
    lang,
  );

  return {
    ...constructMetadata({
      fullTitle: `${post.title} | Scibly Blog`,
      description: post.description,
      url: canonicalUrl,
      image: post.thumbnail,
      keywords: post.keywords,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

// datePublished is parsed from the English entry (same convention as sitemap.ts) because the JS Date constructor can't parse the German date format ("14. Juni 2026") but can parse the English one ("June 14, 2026"); both describe the same publish date.
export function getBlogPostJsonLd(slug: string, lang: Locale) {
  const post = BLOG_POSTS[lang]?.find((p) => p.slug === slug);
  const enPost = BLOG_POSTS.en?.find((p) => p.slug === slug);
  if (!post || !enPost) return null;

  const { canonicalUrl } = buildLocaleAlternates(`/blog/${slug}`, lang);
  const parsedDate = new Date(enPost.date);
  const datePublished = Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate.toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.thumbnail,
    ...(datePublished && {
      datePublished,
      dateModified: datePublished,
    }),
    inLanguage: lang,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Scibly",
      logo: {
        "@type": "ImageObject",
        url: "https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-32x32.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.keywords.join(", "),
  };
}

interface RenderBlogPostProps {
  lang: Locale;
  posts: {
    en: ComponentType<any>;
    de: ComponentType<any>;
  };
}

export function RenderBlogPost({ lang, posts }: RenderBlogPostProps) {
  const mdxComponents = useMDXComponents({});

  if (lang === "en") {
    return createElement(posts.en, { components: mdxComponents });
  }
  if (lang === "de") {
    return createElement(posts.de, { components: mdxComponents });
  }

  notFound();
}
