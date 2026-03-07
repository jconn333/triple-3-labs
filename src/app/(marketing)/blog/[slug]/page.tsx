import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPostBySlug, getAllPostSlugs, formatDate } from "@/lib/blog";
import "../blog-prose.css";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found — Triple 3 Labs" };
  }

  return {
    title: `${post.title} — Triple 3 Labs`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url: `https://triple3labs.io/blog/${post.slug}`,
      ...(post.image && {
        images: [{ url: post.image, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28" />

      <article className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft size={14} />
            Back to Blog
          </Link>

          <header className="mb-12">
            <h1
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(post.date)}
              </span>
              <span>{post.author}</span>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
      <Footer />
    </main>
  );
}
