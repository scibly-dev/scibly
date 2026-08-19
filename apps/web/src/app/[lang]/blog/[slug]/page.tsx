import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { locales } from "@scibly/i18n/constants";
import { notFound } from "next/navigation";

import { BLOG_POSTS } from "../components/posts";
import {
  getBlogPostJsonLd,
  getBlogPostMetadata,
  RenderBlogPost,
} from "../utils/mdx-page-helper";

export async function generateStaticParams() {
  const params: { lang: Locale; slug: string }[] = [];

  for (const lang of locales) {
    const posts = BLOG_POSTS[lang] || [];
    for (const post of posts) {
      params.push({ lang, slug: post.slug });
    }
  }

  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await props.params;
  return getBlogPostMetadata(slug, lang);
}

export default async function Page(props: {
  params: Promise<{ lang: Locale; slug: string }>;
}) {
  const { lang, slug } = await props.params;

  const postExists = BLOG_POSTS[lang]?.some((p) => p.slug === slug);
  if (!postExists) {
    notFound();
  }

  let dePost;
  let enPost;

  try {
    dePost = (await import(`../${slug}/de.mdx`)).default;
    enPost = (await import(`../${slug}/en.mdx`)).default;
  } catch (error) {
    console.error(`Failed to load MDX for slug: ${slug}`, error);
    notFound();
  }

  const jsonLd = getBlogPostJsonLd(slug, lang);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RenderBlogPost
        lang={lang}
        posts={{
          en: enPost,
          de: dePost,
        }}
      />
    </>
  );
}
