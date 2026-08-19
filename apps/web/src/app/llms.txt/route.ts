import { routes } from "@scibly/routes";
import { NextResponse } from "next/server";

import { BLOG_POSTS } from "@/app/[lang]/blog/components/posts";
import { GLOSSARY_TERMS } from "@/app/[lang]/glossary/components/terms";
import { USE_CASES } from "@/app/[lang]/use-cases/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const enPosts = BLOG_POSTS.en;
  const dePosts = BLOG_POSTS.de;

  const enTerms = GLOSSARY_TERMS.en;
  const deTerms = GLOSSARY_TERMS.de;

  const getLocalizedUrl = (path: string, locale: string) => {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${routes.web.base.home}${locale}/${cleanPath}`;
  };

  const enBlogLinks = enPosts
    .map(
      (post) =>
        `- ${getLocalizedUrl(`blog/${post.slug}`, "en")}: ${post.title} – ${post.description}`,
    )
    .join("\n");

  const deBlogLinks = dePosts
    .map(
      (post) =>
        `- ${getLocalizedUrl(`blog/${post.slug}`, "de")}: ${post.title} – ${post.description}`,
    )
    .join("\n");

  const enGlossaryLinks = enTerms
    .map(
      (term) =>
        `- ${getLocalizedUrl(`glossary/${term.slug}`, "en")}: ${term.title} – ${term.definition}`,
    )
    .join("\n");

  const deGlossaryLinks = deTerms
    .map(
      (term) =>
        `- ${getLocalizedUrl(`glossary/${term.slug}`, "de")}: ${term.title} – ${term.definition}`,
    )
    .join("\n");

  const enUseCaseLinks = USE_CASES.map(
    (uc) =>
      `- ${getLocalizedUrl(`use-cases/${uc.slugEn}`, "en")}: ${uc.en.meta.title}`,
  ).join("\n");

  const deUseCaseLinks = USE_CASES.map(
    (uc) =>
      `- ${getLocalizedUrl(`use-cases/${uc.slugDe}`, "de")}: ${uc.de.meta.title}`,
  ).join("\n");

  const text = `# Scibly
> The AI-native learning platform for modern corporate learning. Turn any document into an interactive course in minutes — not weeks.

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
${enUseCaseLinks}

## Use Cases (German)
${deUseCaseLinks}

## Blog Articles (English)
${enBlogLinks}

## Blog Articles (German)
${deBlogLinks}

## L&D Glossary (English)
${enGlossaryLinks}

## L&D Glossary (German)
${deGlossaryLinks}

## More Information
- [Full Content Index](${routes.web.base.home}llms-full.txt): Comprehensive index of all pages and blog articles with detailed metadata.
`;

  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
