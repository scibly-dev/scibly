import { routes } from "@scibly/routes";
import { NextResponse } from "next/server";

import { BLOG_POSTS } from "@/app/[lang]/blog/components/posts";
import { GLOSSARY_TERMS } from "@/app/[lang]/glossary/components/terms";
import { USE_CASES } from "@/app/[lang]/use-cases/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const getLocalizedUrl = (path: string, locale: string) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${routes.web.base.home}${locale}/${cleanPath}`;
  };

  const formatPostDetails = (posts: typeof BLOG_POSTS.en, locale: string) => {
    return posts
      .map((post) => {
        const url = getLocalizedUrl(`blog/${post.slug}`, locale);
        const keywords = post.keywords.join(", ");
        return `### ${post.title}
- **URL**: ${url}
- **Description**: ${post.description}
- **Date**: ${post.date}
- **Read Time**: ${post.readTime} min
- **Category**: ${post.category}
- **Author**: ${post.author.name} (${post.author.role})
- **Keywords**: ${keywords}`;
      })
      .join("\n\n");
  };

  const formatTermDetails = (
    terms: typeof GLOSSARY_TERMS.en,
    locale: string,
  ) => {
    return terms
      .map((term) => {
        const url = getLocalizedUrl(`glossary/${term.slug}`, locale);
        const keywords = term.keywords.join(", ");
        const related = term.relatedTerms
          ? term.relatedTerms.join(", ")
          : "None";
        return `### ${term.title}
- **URL**: ${url}
- **Definition**: ${term.definition}
- **Keywords**: ${keywords}
- **Related Terms**: ${related}`;
      })
      .join("\n\n");
  };

  const formatUseCaseDetails = (locale: "en" | "de") => {
    return USE_CASES.map((uc) => {
      const content = uc[locale];
      const slug = locale === "de" ? uc.slugDe : uc.slugEn;
      const url = getLocalizedUrl(`use-cases/${slug}`, locale);
      return `### ${content.hero.headline}
- **URL**: ${url}
- **Description**: ${content.meta.description}
- **Keywords**: ${content.meta.keywords.join(", ")}`;
    }).join("\n\n");
  };

  const enBlogDetails = formatPostDetails(BLOG_POSTS.en, "en");
  const deBlogDetails = formatPostDetails(BLOG_POSTS.de, "de");

  const enGlossaryDetails = formatTermDetails(GLOSSARY_TERMS.en, "en");
  const deGlossaryDetails = formatTermDetails(GLOSSARY_TERMS.de, "de");

  const text = `# Scibly — Full Content Index
> The AI-native learning platform for modern corporate learning. Available in English and German.

## About
Scibly enables L&D teams to transform any document into interactive, AI-powered courses in minutes. Key capabilities include: AI-native course authoring, knowledge gap analytics, micro-lessons, learning in the flow of work (Slack, MS Teams integration), and Confluence import.

## Core Pages
- ${routes.web.base.home}: Homepage (Default/English)
- ${getLocalizedUrl("", "de")}: Homepage (German)
- ${getLocalizedUrl("blog", "en")}: Blog Index (English)
- ${getLocalizedUrl("blog", "de")}: Blog Index (German)
- ${getLocalizedUrl("glossary", "en")}: L&D Glossary Index (English)
- ${getLocalizedUrl("glossary", "de")}: L&D Glossary Index (German)

## Optional
- ${getLocalizedUrl("impressum", "en")}: Impressum / Legal Notice (English)
- ${getLocalizedUrl("impressum", "de")}: Impressum / Impressum (German)
- ${getLocalizedUrl("datenschutz", "en")}: Privacy Policy (English)
- ${getLocalizedUrl("datenschutz", "de")}: Datenschutzerklärung (German)

## Use Cases (English)
${formatUseCaseDetails("en")}

## Use Cases (German)
${formatUseCaseDetails("de")}

## Blog Articles Detail (English)
${enBlogDetails}

## Blog Articles Detail (German)
${deBlogDetails}

## L&D Glossary Detail (English)
${enGlossaryDetails}

## L&D Glossary Detail (German)
${deGlossaryDetails}
`;

  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
