"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";
import type { BlogPostListItem } from "@/lib/blog/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, Button, ButtonLink, DataTable, MutedCell, NameCell, SearchInput, type Column } from "@/components/ui";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filters as you type — debounce 200ms before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

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

  const columns: Column<BlogPostListItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (post) => <NameCell name={post.title} sub={post.description} />,
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      render: (post) => (
        <Badge tone={post.status === "published" ? "good" : "neutral"}>
          {post.status === "published" ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "author",
      header: "Author",
      width: "160px",
      hideBelow: "md",
      render: (post) => <MutedCell>{post.author}</MutedCell>,
    },
    {
      key: "date",
      header: "Date",
      width: "120px",
      hideBelow: "sm",
      render: (post) => <MutedCell>{formatDate(post.published_at || post.created_at)}</MutedCell>,
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      align: "right",
      render: (post) => (
        <div className="flex items-center justify-end gap-1">
          <ButtonLink href={`/admin/blog/${post.id}`} variant="ghost" size="icon-sm" title="Edit">
            <Pencil size={14} />
          </ButtonLink>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Delete"
            className="hover:text-bad"
            onClick={() => handleDelete(post.id, post.title)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blog posts"
        actions={
          <ButtonLink href="/admin/blog/new" variant="primary">
            New post
          </ButtonLink>
        }
      />

      <SearchInput
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search posts…"
        width="280px"
      />

      <DataTable
        columns={columns}
        rows={posts}
        rowKey={(post) => post.id}
        rowHref={(post) => `/admin/blog/${post.id}`}
        loading={loading}
        emptyTitle={query ? "No posts matching your search." : "No blog posts yet"}
        emptyBody={query ? undefined : "Create your first post to get started."}
      />
    </div>
  );
}
