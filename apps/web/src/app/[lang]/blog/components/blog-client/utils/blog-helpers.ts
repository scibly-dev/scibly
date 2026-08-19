import { type BlogPost } from "@/app/[lang]/blog/components/posts";

export function extractCategories(posts: BlogPost[]): string[] {
  const list = ["all"];
  posts.forEach((post) => {
    if (!list.includes(post.category)) {
      list.push(post.category);
    }
  });
  return list;
}

export function filterPosts(
  posts: BlogPost[],
  searchQuery: string,
  activeCategory: string,
): BlogPost[] {
  const query = searchQuery.toLowerCase().trim();
  return posts.filter((post) => {
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query);
    const matchesCategory =
      activeCategory === "all" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
}

export function getFeaturedPost(
  posts: BlogPost[],
  searchQuery: string,
  activeCategory: string,
): BlogPost | null {
  if (searchQuery || activeCategory !== "all") return null;
  return posts.find((p) => p.featured) || posts[0] || null;
}

export function getRegularPosts(
  filteredPosts: BlogPost[],
  featuredPost: BlogPost | null,
): BlogPost[] {
  if (featuredPost) {
    return filteredPosts.filter((p) => p.slug !== featuredPost.slug);
  }
  return filteredPosts;
}
