export type BlogPage = {
  metadata: {
    title: string;
    description: string;
  };
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allCategories: string;
  backToBlog: string;
  publishedOn: string;
  noPostsFound: string;
  onThisPage: string;
  shareThisPost: string;
  previousPost: string;
  nextPost: string;
  copied: string;
  categories: {
    education: string;
    product: string;
    engineering: string;
    design: string;
    company: string;
  };
};
