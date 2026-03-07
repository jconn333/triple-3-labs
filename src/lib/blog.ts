import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
  tags?: string[];
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []).map((row) => row.slug);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;

  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.published_at || data.created_at,
    author: data.author,
    image: data.featured_image_url ?? undefined,
    tags: data.tags ?? [],
    content: data.content,
  };
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, description, author, tags, featured_image_url, published_at, created_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []).map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.published_at || row.created_at,
    author: row.author,
    image: row.featured_image_url ?? undefined,
    tags: row.tags ?? [],
  }));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
