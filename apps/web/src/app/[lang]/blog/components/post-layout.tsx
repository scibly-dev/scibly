import type { Locale } from "@scibly/i18n/constants";

import { routes } from "@scibly/routes";
import Icon from "@scibly/ui/components/icon";
import {
  cardClass,
  cardInteractiveClass,
  eyebrowClass,
  titleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import Image from "next/image";
import Link from "next/link";

import { getFullDictionary } from "@/i18n/dictionaries";

import { MarketingGridField } from "../../components/marketing-grid-field";
import { marketingPageSectionStickyClass } from "../../components/marketing-section-content";
import { MarketingSectionFrame } from "../../components/marketing-section-frame";
import { CategoryBadge } from "./blog-client/components/category-badge";
import { BLOG_POSTS, type BlogPost, formatReadTime } from "./posts";
import { ScrollProgressBar } from "./scroll-progress-bar";
import { ShareButtons } from "./share-buttons";
import { TableOfContents } from "./table-of-contents";

interface PostLayoutProps {
  children: React.ReactNode;
  metadata: {
    title: string;
    description: string;
    date: string;
    readTime: number;
    category: BlogPost["category"];
    author: BlogPost["author"];
    thumbnail?: string;
  };
  lang: Locale;
}

export async function PostLayout({
  children,
  metadata,
  lang,
}: PostLayoutProps) {
  const dict = await getFullDictionary(lang);
  const tBlog = dict.blog;

  const categoryName = tBlog.categories[metadata.category] || metadata.category;

  const posts = BLOG_POSTS[lang] || [];
  const currentPostIndex = posts.findIndex((p) => p.title === metadata.title);
  const currentPost = posts[currentPostIndex] || null;
  const heroThumbnail = metadata.thumbnail || currentPost?.thumbnail;

  const prevPost =
    currentPostIndex !== -1 && currentPostIndex < posts.length - 1
      ? posts[currentPostIndex + 1]
      : null;
  const nextPost =
    currentPostIndex !== -1 && currentPostIndex > 0
      ? posts[currentPostIndex - 1]
      : null;

  return (
    <>
      <ScrollProgressBar />

      <main className={cn(marketingPageSectionStickyClass, "min-h-dvh")}>
        <MarketingGridField />

        <MarketingSectionFrame className="relative z-10 grid grid-cols-1 gap-14 px-5 pt-[clamp(104px,15vh,152px)] pb-[clamp(64px,10vh,130px)] md:px-[clamp(20px,5vw,40px)] lg:grid-cols-[1fr_260px]">
          <article className="min-w-0">
            {/* Back button */}
            <div className="mb-9">
              <Link
                href={routes.web.blog.root}
                className="group text-ink-soft hover:text-ink inline-flex items-center gap-2 text-[14px] font-semibold no-underline transition-colors duration-200"
              >
                <Icon
                  name="ArrowLeft"
                  className="h-4 w-4 transform transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                {tBlog.backToBlog}
              </Link>
            </div>

            {/* Article Header */}
            <header className="mb-9">
              <div className="flex items-center gap-2.5">
                <CategoryBadge
                  category={metadata.category}
                  label={categoryName}
                />
                <span className="text-ink-faint text-[12.5px] font-medium">
                  {formatReadTime(metadata.readTime, lang)}
                </span>
              </div>

              <h1
                className={cn(titleClass, "mt-4 text-[clamp(30px,3.2vw,44px)]")}
              >
                {metadata.title}
              </h1>

              <div className="border-ground mt-7 flex items-center gap-3.5 border-b-2 pb-8">
                <Image
                  src={metadata.author.avatar}
                  alt={metadata.author.name}
                  width={40}
                  height={40}
                  className="border-hairline h-10 w-10 rounded-full border-2 object-cover"
                  unoptimized
                />
                <div className="flex flex-col">
                  <span className="text-ink text-[14px] font-semibold">
                    {metadata.author.name}
                  </span>
                  <span className="text-ink-faint text-[12.5px]">
                    {metadata.author.role}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-ink-faint mb-0.5 block text-[12px] font-medium">
                    {tBlog.publishedOn}
                  </span>
                  <span className="text-ink text-[13px] font-semibold">
                    {metadata.date}
                  </span>
                </div>
              </div>
            </header>

            {/* Article Hero Image */}
            {heroThumbnail && (
              <div className="border-hairline bg-ground-soft relative mb-10 aspect-[2/1] w-full overflow-hidden rounded-[20px] border-2 shadow-[0_4px_0_0_var(--color-lip)]">
                <Image
                  src={heroThumbnail}
                  alt={metadata.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 880px"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Article Content */}
            <section className="font-sans">{children}</section>

            {/* Share Post Widget */}
            <div className="border-ground mt-12 flex flex-col justify-between gap-4 border-t-2 pt-8 font-sans sm:flex-row sm:items-center">
              <span className="text-ink text-[14.5px] font-semibold">
                {tBlog.shareThisPost}
              </span>
              <ShareButtons
                shareText={tBlog.shareThisPost}
                copiedText={tBlog.copied}
              />
            </div>

            {/* Next/Prev Navigation */}
            <div className="mt-8 font-sans">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {prevPost ? (
                  <Link
                    href={routes.web.blog.detail(prevPost.slug)}
                    className={cn(
                      cardClass,
                      cardInteractiveClass,
                      "group flex flex-col gap-1.5 p-5 text-left no-underline",
                    )}
                  >
                    <span
                      className={cn(eyebrowClass, "flex items-center gap-1.5")}
                    >
                      <Icon
                        name="ArrowLeft"
                        className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-0.5"
                      />
                      {tBlog.previousPost}
                    </span>
                    <span className="text-ink line-clamp-1 text-[14.5px] font-semibold">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}
                {nextPost && (
                  <Link
                    href={routes.web.blog.detail(nextPost.slug)}
                    className={cn(
                      cardClass,
                      cardInteractiveClass,
                      "group flex flex-col gap-1.5 p-5 text-right no-underline",
                    )}
                  >
                    <span
                      className={cn(
                        eyebrowClass,
                        "ml-auto flex items-center justify-end gap-1.5",
                      )}
                    >
                      {tBlog.nextPost}
                      <Icon
                        name="ArrowRight"
                        className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span className="text-ink line-clamp-1 text-[14.5px] font-semibold">
                      {nextPost.title}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </article>

          <aside className="hidden lg:block">
            <TableOfContents title={tBlog.onThisPage} />
          </aside>
        </MarketingSectionFrame>
      </main>
    </>
  );
}
