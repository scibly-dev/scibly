"use client";

import { stripLocaleFromPathname } from "@scibly/i18n";
import {
  defaultLocale,
  LanguageOptions,
  type Locale,
  localeCookieName,
  localeCookieOptions,
  locales,
} from "@scibly/i18n/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { setCookie } from "cookies-next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

export default function LanguageSwitcher() {
  const params = useParams();
  const locale =
    locales.find((candidate) => candidate === params.lang) ?? defaultLocale;

  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    setCookie(localeCookieName, newLocale, localeCookieOptions);
    // In-app URLs carry no locale prefix — the cookie does, and the proxy
    // rewrites from it. A full navigation rather than router.push, because a
    // locale switch stales every route the client router has prefetched, and
    // only the current one could be refreshed. Read off the location at click
    // time rather than through useSearchParams: that hook demands a Suspense
    // boundary, and without one it bails every page rendering this switcher
    // to the client entirely.
    window.location.assign(
      `${stripLocaleFromPathname(window.location.pathname)}${window.location.search}`,
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        asChild
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          aria-label={locale === "de" ? "Sprache wechseln" : "Change language"}
          className="flex items-center gap-1 text-[13px] font-medium text-[#1d1d1f] opacity-75 outline-none transition-opacity hover:opacity-100 focus:outline-none"
        >
          <Globe className="h-[15px] w-[15px]" strokeWidth={2.5} />
          <ChevronDown
            className={`h-3 w-3 opacity-50 stroke-[3px] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {LanguageOptions[locale].map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex w-48 cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 ${
              locale === language.code ? "bg-gray-100/80" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 text-xs font-bold uppercase text-gray-400">
                {language.code}
              </span>
              <span
                className={`text-[13px] ${
                  locale === language.code
                    ? "font-medium text-[#111111]"
                    : "text-gray-600"
                }`}
              >
                {language.name}
              </span>
            </div>
            {locale === language.code && (
              <Check className="h-4 w-4 text-gray-400 stroke-[2.5px]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
