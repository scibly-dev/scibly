"use client";

import { useLocale } from "@scibly/i18n/react";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { Github, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

import { type HomePage } from "../i18n/home.types";

interface FooterProps {
  t: HomePage["footer"];
}

const LINK_CLASS =
  "text-[13px] text-[#64748b] no-underline transition-colors hover:text-[#0f172a]";

const SOCIAL_CLASS =
  "rounded-full p-1.5 text-[#64748b] transition-colors hover:bg-[#0f172a]/5 hover:text-[#0f172a]";

export function Footer({ t }: FooterProps) {
  const locale = useLocale();

  return (
    <footer className="relative z-10 border-t border-[#e2e8f0]/80 px-8 py-12">
      <div className="mx-auto max-w-[960px]">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
            {t.brand}
          </span>

          <nav
            aria-label={t.brand}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            <Link href={`/${locale}/glossary`} className={LINK_CLASS}>
              {t.glossary}
            </Link>
            <Link href={`/${locale}/impressum`} className={LINK_CLASS}>
              {t.impressum}
            </Link>
            <Link href={`/${locale}/datenschutz`} className={LINK_CLASS}>
              {t.privacy}
            </Link>
            <a href="/llms.txt" className={LINK_CLASS}>
              llms.txt
            </a>
            <a href="/llms-full.txt" className={LINK_CLASS}>
              llms-full.txt
            </a>
          </nav>

          <div className="-mr-1.5 flex items-center gap-1">
            <a
              href="https://www.youtube.com/@scibly"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className={SOCIAL_CLASS}
              {...autocaptureAttributes({ social: "youtube" })}
            >
              <Youtube size={17} />
            </a>
            <a
              href="https://linkedin.com/company/scibly/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className={SOCIAL_CLASS}
              {...autocaptureAttributes({ social: "linkedin" })}
            >
              <Linkedin size={17} />
            </a>
            <a
              href="https://github.com/scibly-dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className={SOCIAL_CLASS}
              {...autocaptureAttributes({ social: "github" })}
            >
              <Github size={17} />
            </a>
          </div>
        </div>

        <p className="mt-8 mb-0 text-center text-[12px] text-[#64748b] md:text-left">
          {t.copyright}
        </p>
      </div>
    </footer>
  );
}
