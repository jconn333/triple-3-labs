"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";
import type { BlogPostListItem } from "@/lib/blog/types";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (query) params.set("q", query);

        const res = await fetch(`/api/blog?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  }

  return (
    <div>
      {/* Search + New Post */}
      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500/50"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Search
          </button>
        </form>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/30"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {/* Posts Table */}
      <div className="glass-card overflow-hidden rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-white/30">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="hidden px-6 py-4 md:table-cell">Author</th>
              <th className="hidden px-6 py-4 sm:table-cell">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-6 py-4">
                    <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-white/5" />
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-white/5 ml-auto" />
                  </td>
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-white/30"
                >
                  {query
                    ? "No posts matching your search."
                    : "No blog posts yet. Create your first post!"}
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-sm font-medium text-white hover:text-violet-300 transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-white/30 truncate max-w-xs">
                      {post.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        post.status === "published"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-white/50 md:table-cell">
                    {post.author}
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-white/40 sm:table-cell">
                    {formatDate(post.published_at || post.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="rounded p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
