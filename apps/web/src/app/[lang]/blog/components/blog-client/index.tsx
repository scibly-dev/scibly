"use client";

import { type Locale } from "@scibly/i18n/constants";
import React, { useMemo, useState } from "react";

import { type BlogPost } from "@/app/[lang]/blog/components/posts";
import { type BlogPage } from "@/app/[lang]/i18n/blog.types";

import { BlogHeader } from "./components/blog-header";
import { FeaturedPostCard } from "./components/featured-post-card";
import { FilterToolbar } from "./components/filter-toolbar";
import { PostCard } from "./components/post-card";
import {
  extractCategories,
  filterPosts,
  getFeaturedPost,
  getRegularPosts,
} from "./utils/blog-helpers";

interface BlogClientProps {
  posts: BlogPost[];
  t: BlogPage;
  lang: Locale;
}

export function BlogClient({ posts, t, lang }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => {
    return extractCategories(posts);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return filterPosts(posts, searchQuery, activeCategory);
  }, [posts, searchQuery, activeCategory]);

  const featuredPost = useMemo(() => {
    return getFeaturedPost(posts, searchQuery, activeCategory);
  }, [posts, searchQuery, activeCategory]);

  const regularPosts = useMemo(() => {
    return getRegularPosts(filteredPosts, featuredPost);
  }, [filteredPosts, featuredPost]);

  return (
    <div>
      <BlogHeader title={t.title} subtitle={t.subtitle} />

      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        t={t}
      />

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-ink-faint text-[17px]">{t.noPostsFound}</p>
        </div>
      )}

      {/* Featured Post Card */}
      {featuredPost && (
        <FeaturedPostCard post={featuredPost} t={t} lang={lang} />
      )}

      {/* Regular Posts Grid */}
      {regularPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {regularPosts.map((post) => (
            <PostCard key={post.slug} post={post} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
