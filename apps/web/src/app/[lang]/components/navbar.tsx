"use client";

import { useLocale } from "@scibly/i18n/react";
import { routes } from "@scibly/routes";
import Icon from "@scibly/ui/components/icon";
import LanguageSwitcher from "@scibly/ui/components/language-switcher";
import { actionClass, primaryActionClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { type HomePage } from "../i18n/home.types";

interface NavbarProps {
  t: HomePage["navbar"];
}

type NavItem = {
  href: string;
  label: string;

  path: string;
  children?: HomePage["navbar"]["useCases"];
};

const pillItemClass = (isActive: boolean) =>
  cn(
    "rounded-[10px] px-[13px] py-[9px] text-[14.5px] no-underline transition-colors",
    isActive
      ? "bg-[#b9d7ff] font-semibold text-[#0b4fb0] shadow-[inset_0_-1.5px_0_rgba(23,83,156,0.16)] hover:text-[#0b4fb0]"
      : "font-medium text-ink-muted hover:bg-ink/5 hover:text-ink",
  );

const mobileItemClass = (isActive: boolean) =>
  cn(
    "rounded-xl px-3.5 py-3 text-[16px] no-underline transition-colors hover:bg-[#f2f4fb]",
    isActive
      ? "font-semibold text-[#0b4fb0]"
      : "font-medium text-[#3b4574] hover:text-ink",
  );

// Radius and border-width stay constant across states so the corners can't snap while the fill is still fading in/out.
const capsuleGeometryClass =
  "rounded-2xl border border-transparent transition-[background-color,border-color,box-shadow,padding] duration-200 ease-out";

const capsuleFillClass =
  "border-ink/[0.06] shadow-[0_2px_0_0_rgba(19,28,70,0.045),0_10px_26px_-12px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.85)]";

export function Navbar({ t }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();

  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const isCurrent = (path: string) =>
    path === "/"
      ? pathWithoutLocale === "/"
      : pathWithoutLocale.startsWith(path);

  const navItems: NavItem[] = [
    { href: `/${locale}`, label: t.home, path: "/" },
    {
      href: `/${locale}/use-cases`,
      label: t.solutions,
      path: "/use-cases",
      children: t.useCases,
    },
    { href: `/${locale}/ai-skills`, label: t.aiSkills, path: "/ai-skills" },
    { href: `/${locale}/blog`, label: t.blog, path: "/blog" },
  ];

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsSolutionsOpen(false);
  }

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setIsScrolled((scrolled) =>
        scrolled ? window.scrollY > 8 : window.scrollY > 24,
      );
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <nav className="font-display fixed top-0 right-0 left-0 z-40">
      {/* Softens the page edge behind the bare wordmark while it still floats. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-white/85 via-white/45 to-transparent transition-opacity duration-200 ease-out",
          isScrolled && "opacity-0",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative mx-auto w-[min(1240px,100%)] px-5 transition-[padding-top] duration-200 ease-out md:px-[clamp(24px,3vw,40px)]",
          isScrolled ? "pt-2.5 md:pt-3" : "pt-4 md:pt-[26px]",
        )}
      >
        <div
          className={cn(
            capsuleGeometryClass,
            "flex items-center justify-between gap-3 md:gap-[clamp(12px,2vw,28px)]",
            isScrolled &&
              cn(
                capsuleFillClass,
                "bg-white px-3 py-2 md:py-1.5 md:pr-2 md:pl-4",
              ),
          )}
        >
          <div className="flex min-w-0 items-center md:flex-1">
            <Link
              href={`/${locale}`}
              className="text-ink text-[clamp(20px,5vw,23px)] font-medium tracking-[-0.02em] no-underline"
            >
              scibly
            </Link>
          </div>

          {/* backdrop-filter on a fixed element re-samples the page every frame, so it's dropped once the bar goes opaque instead of shimmering while scrolling. */}
          <div
            className={cn(
              capsuleGeometryClass,
              "hidden shrink-0 items-center gap-1.5 md:flex",
              !isScrolled &&
                cn(
                  capsuleFillClass,
                  "bg-white/[0.86] py-1.5 pr-1.5 pl-2",
                  "[backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]",
                ),
            )}
          >
            <div className="mr-2.5 flex items-center gap-1">
              {navItems.map((item) =>
                item.children ? (
                  <div
                    key={item.path}
                    className="relative"
                    onMouseEnter={() => setIsSolutionsOpen(true)}
                    onMouseLeave={() => setIsSolutionsOpen(false)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsSolutionsOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        pillItemClass(isCurrent(item.path)),
                        "flex items-center gap-1",
                      )}
                      aria-expanded={isSolutionsOpen}
                      aria-haspopup="menu"
                      aria-controls="navbar-solutions-menu"
                      onClick={() => setIsSolutionsOpen((open) => !open)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setIsSolutionsOpen(false);
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-150 ${isSolutionsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      id="navbar-solutions-menu"
                      role="menu"
                      aria-hidden={!isSolutionsOpen}
                      className={cn(
                        "absolute top-full left-1/2 z-50 w-[232px] -translate-x-1/2 pt-3 transition-[opacity,transform] duration-150 ease-out",
                        isSolutionsOpen
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1 opacity-0",
                      )}
                    >
                      <div className="border-ink/[0.09] overflow-hidden rounded-[14px] border bg-white p-1 shadow-[0_20px_44px_-20px_rgba(19,28,70,0.35)]">
                        <Link
                          href={item.href}
                          tabIndex={isSolutionsOpen ? 0 : -1}
                          className="flex items-center justify-between rounded-[10px] px-3 py-2 text-[13.5px] font-semibold text-[#0b4fb0] no-underline transition-colors hover:bg-[#eef5ff]"
                        >
                          {t.allUseCases}
                          <span className="text-[10px]" aria-hidden>
                            →
                          </span>
                        </Link>
                        <div className="mx-3 my-1 h-px bg-[#e6eaf5]" />
                        {item.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`${item.href}/${child.slug}`}
                            tabIndex={isSolutionsOpen ? 0 : -1}
                            aria-current={
                              isCurrent(`${item.path}/${child.slug}`)
                                ? "page"
                                : undefined
                            }
                            className={cn(
                              "block rounded-[10px] px-3 py-2 text-[13.5px] font-medium no-underline transition-colors",
                              isCurrent(`${item.path}/${child.slug}`)
                                ? "bg-[#eef5ff] text-[#0b4fb0]"
                                : "text-ink-muted hover:text-ink hover:bg-[#f2f4fb]",
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    href={item.href}
                    aria-current={isCurrent(item.path) ? "page" : undefined}
                    className={pillItemClass(isCurrent(item.path))}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>

            <a href={routes.app.auth.signIn} className={pillItemClass(false)}>
              {t.signIn}
            </a>

            <a
              href={routes.app.auth.signUp}
              className={cn(actionClass, primaryActionClass)}
            >
              {t.createAccount}
            </a>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-end md:flex">
            <div className="hover:bg-ink/5 rounded-[10px] px-2.5 py-[9px] transition-colors">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile: sign in + primary action + menu toggle */}
          <div className="flex items-center gap-2.5 md:hidden">
            <a
              href={routes.app.auth.signIn}
              className="text-ink-muted hover:text-ink px-1 text-[14.5px] font-medium whitespace-nowrap no-underline transition-colors"
            >
              {t.signIn}
            </a>
            <a
              href={routes.app.auth.signUp}
              className={cn(
                actionClass,
                primaryActionClass,
                "whitespace-nowrap",
              )}
            >
              {t.createAccount}
            </a>
            <button
              type="button"
              className="border-ink/[0.08] text-ink ease-press flex size-11 shrink-0 items-center justify-center rounded-[11px] border bg-white shadow-[0_3px_0_0_rgba(19,28,70,0.07),0_5px_12px_-6px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[translate,box-shadow] duration-100 active:translate-y-[3px] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="navbar-mobile-menu"
            >
              <Icon
                name={isMobileMenuOpen ? "X" : "Menu"}
                className="h-[22px] w-[22px]"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          id="navbar-mobile-menu"
          className="animate-in slide-in-from-top-2 fade-in border-ink/[0.09] relative z-10 mx-5 mt-3 flex max-h-[calc(100dvh-120px)] flex-col overflow-y-auto rounded-[14px] border bg-white p-2.5 shadow-[0_20px_44px_-20px_rgba(19,28,70,0.35)] duration-200 md:hidden"
        >
          {navItems.map((item) => (
            <Fragment key={item.path}>
              <Link
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isCurrent(item.path) ? "page" : undefined}
                className={mobileItemClass(isCurrent(item.path))}
              >
                {item.label}
              </Link>
              {item.children ? (
                <div className="flex flex-col pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.slug}
                      href={`${item.href}/${child.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={
                        isCurrent(`${item.path}/${child.slug}`)
                          ? "page"
                          : undefined
                      }
                      className={cn(
                        mobileItemClass(
                          isCurrent(`${item.path}/${child.slug}`),
                        ),
                        "py-2.5 text-[15px]",
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </Fragment>
          ))}
          <div className="mx-3.5 my-2 h-px bg-[#e6eaf5]" />
          <div className="px-3.5 py-2">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
