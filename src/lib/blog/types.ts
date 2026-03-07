export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  status: BlogPostStatus;
  featured_image_url: string | null;
  author: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: BlogPostStatus;
  author: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
