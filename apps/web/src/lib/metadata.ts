import { appendLocalePrefix } from "@scibly/i18n";
import { type Locale, locales } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";

export function buildLocaleAlternates(path: string, currentLocale: Locale) {
  const base = new URL(routes.web.base.home);

  const canonicalUrl = new URL(base);
  canonicalUrl.pathname = appendLocalePrefix(currentLocale, path);

  const languages = Object.fromEntries(
    locales.map((locale) => {
      const url = new URL(base);
      url.pathname = appendLocalePrefix(locale, path);
      return [locale, url.toString()];
    }),
  );

  return {
    canonicalUrl: canonicalUrl.toString(),
    languages,
  };
}
