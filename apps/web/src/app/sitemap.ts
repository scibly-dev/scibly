import type { MetadataRoute } from "next";

import { appendLocalePrefix, stripLocaleFromPathname } from "@scibly/i18n";
import { type Locale, locales } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";

import { BLOG_POSTS } from "@/app/[lang]/blog/components/posts";
import { GLOSSARY_TERMS } from "@/app/[lang]/glossary/components/terms";
import { USE_CASES } from "@/app/[lang]/use-cases/data";

const withLocale = (url: string, locale: Locale) => {
  const parsedUrl = new URL(url);
  const cleanPath = stripLocaleFromPathname(parsedUrl.pathname);
  const localizedPath =
    cleanPath === "/" ? `/${locale}` : appendLocalePrefix(locale, cleanPath);

  parsedUrl.pathname = localizedPath;
  return parsedUrl.toString();
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  sitemapEntries.push({
    url: routes.web.base.home,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [
          locale,
          withLocale(routes.web.base.home, locale),
        ]),
      ),
    },
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.base.home, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, withLocale(routes.web.base.home, l)]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    });
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.blog.root, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, withLocale(routes.web.blog.root, l)]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  const posts = BLOG_POSTS.en;
  posts.forEach((post) => {
    locales.forEach((locale) => {
      let lastMod = new Date();
      try {
        const enPost = BLOG_POSTS.en.find((p) => p.slug === post.slug);
        if (enPost) {
          lastMod = new Date(enPost.date);
        }
      } catch {}

      sitemapEntries.push({
        url: withLocale(routes.web.blog.detail(post.slug), locale),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              withLocale(routes.web.blog.detail(post.slug), l),
            ]),
          ),
        },
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.glossary.root, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, withLocale(routes.web.glossary.root, l)]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  const terms = GLOSSARY_TERMS.en;
  terms.forEach((term) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: withLocale(routes.web.glossary.detail(term.slug), locale),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              withLocale(routes.web.glossary.detail(term.slug), l),
            ]),
          ),
        },
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.base.home + "use-cases", locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [
            l,
            withLocale(routes.web.base.home + "use-cases", l),
          ]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    });
  });

  USE_CASES.forEach((useCase) => {
    const slugByLocale = {
      de: useCase.slugDe,
      en: useCase.slugEn,
    } satisfies Record<Locale, string>;
    locales.forEach((locale) => {
      const slug = slugByLocale[locale];
      sitemapEntries.push({
        url: withLocale(routes.web.base.home + `use-cases/${slug}`, locale),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              withLocale(
                routes.web.base.home + `use-cases/${slugByLocale[l]}`,
                l,
              ),
            ]),
          ),
        },
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    });
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.base.home + "ai-skills", locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [
            l,
            withLocale(routes.web.base.home + "ai-skills", l),
          ]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    });
  });

  locales.forEach((locale) => {
    sitemapEntries.push({
      url: withLocale(routes.web.legal.impressum, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, withLocale(routes.web.legal.impressum, l)]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    });

    sitemapEntries.push({
      url: withLocale(routes.web.legal.datenschutz, locale),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, withLocale(routes.web.legal.datenschutz, l)]),
        ),
      },
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    });
  });

  return sitemapEntries;
}
