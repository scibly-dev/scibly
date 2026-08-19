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

interface PostCardProps {
  post: BlogPost;
  t: BlogPage;
  lang: Locale;
}

export function PostCard({ post, t, lang }: PostCardProps) {
  return (
    <Link
      href={routes.web.blog.detail(post.slug)}
      className={cn(
        cardClass,
        cardInteractiveClass,
        "group flex flex-col p-4 no-underline",
      )}
    >
      {/* Cover Image */}
      <div className="border-hairline bg-ground-soft relative mb-4 h-[180px] w-full overflow-hidden rounded-[14px] border-2">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
      </div>

      <div className="mb-3 flex items-center gap-2 px-1">
        <CategoryBadge
          category={post.category}
          label={t.categories[post.category] || post.category}
        />
        <span className="text-ink-faint text-[11.5px] font-medium">
          {formatReadTime(post.readTime, lang)}
        </span>
      </div>

      <h3 className="text-ink m-0 px-1 text-[18px] leading-[1.3] font-semibold tracking-[-0.016em]">
        {post.title}
      </h3>

      <p className="text-ink-soft mt-2 mb-5 line-clamp-3 px-1 text-[14px] leading-[1.6] text-pretty">
        {post.description}
      </p>

      <div className="border-ground mx-1 mt-auto flex items-center gap-2.5 border-t-2 pt-4">
        <Image
          src={post.author.avatar}
          alt={post.author.name}
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
          unoptimized
        />
        <span className="text-ink text-[12.5px] font-semibold">
          {post.author.name}
        </span>
        <span className="text-ink-faint ml-auto text-[11.5px]">
          {post.date}
        </span>
      </div>
    </Link>
  );
}
