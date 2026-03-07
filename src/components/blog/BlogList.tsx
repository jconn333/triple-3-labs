"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
  tags?: string[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function BlogList({ posts }: { posts: BlogPostMeta[] }) {
  return (
    <section className="px-6 pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto grid max-w-4xl gap-6"
      >
        {posts.map((post) => (
          <motion.div key={post.slug} variants={cardVariants}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <article className="glass-card rounded-2xl p-8">
                <div className="mb-4 flex items-center gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {formatDate(post.date)}
                  </span>
                </div>
                <h2
                  className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-violet-300"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {post.title}
                </h2>
                <p className="mb-4 leading-relaxed text-white/50">
                  {post.description}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
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
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition-all group-hover:gap-2.5">
                  Read more
                  <ArrowRight size={14} />
                </span>
              </article>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
