import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogList from "@/components/blog/BlogList";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Triple 3 Labs",
  description:
    "Insights on AI agents, automation, and building intelligent business systems.",
  openGraph: {
    title: "Blog — Triple 3 Labs",
    description:
      "Insights on AI agents, automation, and building intelligent business systems.",
    url: "https://triple3labs.io/blog",
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28" />

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            Blog
          </span>
          <h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Insights & <span className="gradient-text">Ideas</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Thoughts on AI agents, automation, and building intelligent systems
            for modern businesses.
          </p>
        </div>
      </section>

      <BlogList posts={posts} />
      <Footer />
    </main>
  );
}
