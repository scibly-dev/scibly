import type { Locale } from "@scibly/i18n/constants";

import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

import { getFullDictionary } from "@/i18n/dictionaries";
import { buildLocaleAlternates } from "@/lib/metadata";

import { MarketingSection } from "../components/marketing-section-content";
import { BlogClient } from "./components/blog-client";
import { BLOG_POSTS } from "./components/posts";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const dict = await getFullDictionary(lang);
  const { canonicalUrl, languages } = buildLocaleAlternates("/blog", lang);

  return {
    ...constructMetadata({
      fullTitle: dict.blog.metadata.title,
      description: dict.blog.metadata.description,
      url: canonicalUrl,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

export default async function BlogIndexPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const dict = await getFullDictionary(params.lang);
  const tBlog = dict.blog;
  const posts = BLOG_POSTS[params.lang] || [];

  return (
    <main className="flex flex-grow flex-col bg-white">
      <MarketingSection top="page">
        <BlogClient posts={posts} t={tBlog} lang={params.lang} />
      </MarketingSection>
    </main>
  );
}
