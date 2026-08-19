import { type Locale } from "@scibly/i18n/constants";
import { routes } from "@scibly/routes";
import { cardClass, cardInteractiveClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import {
  type BlogPost,
  formatReadTime,
} from "@/app/[lang]/blog/components/posts";
import { type BlogPage } from "@/app/[lang]/i18n/blog.types";

import { CategoryBadge } from "./category-badge";

interface FeaturedPostCardProps {
  post: BlogPost;
  t: BlogPage;
  lang: Locale;
}

export function FeaturedPostCard({ post, t, lang }: FeaturedPostCardProps) {
  return (
    <div className="mb-12">
      <Link
        href={routes.web.blog.detail(post.slug)}
        className={cn(
          cardClass,
          cardInteractiveClass,
          "group flex flex-col gap-7 p-5 no-underline lg:flex-row",
        )}
      >
        <div className="border-hairline bg-ground-soft relative h-[240px] w-full overflow-hidden rounded-[14px] border-2 md:h-[340px] lg:w-[60%]">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
            unoptimized
          />
        </div>

        {/* Post info */}
        <div className="flex flex-1 flex-col justify-center py-1">
          <div className="mb-4 flex items-center gap-2.5">
            <CategoryBadge
              category={post.category}
              label={t.categories[post.category] || post.category}
            />
            <span className="text-ink-faint text-[12.5px] font-medium">
              {formatReadTime(post.readTime, lang)}
            </span>
          </div>

          <h2 className="text-ink m-0 text-[clamp(22px,2.4vw,30px)] leading-[1.15] font-medium tracking-[-0.022em] text-balance">
            {post.title}
          </h2>

          <p className="text-ink-soft mt-3.5 mb-6 text-[15px] leading-[1.6] text-pretty">
            {post.description}
          </p>

          <div className="border-ground mt-auto flex items-center gap-3 border-t-2 pt-4">
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
              unoptimized
            />
            <div className="flex flex-col">
              <span className="text-ink text-[13.5px] font-semibold">
                {post.author.name}
              </span>
              <span className="text-ink-faint text-[11.5px]">
                {post.author.role}
              </span>
            </div>
            <div className="text-ink-faint ml-auto text-[12px]">
              {post.date}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
