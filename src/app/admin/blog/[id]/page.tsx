"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import type { BlogPost } from "@/lib/blog/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState, PanelSkeleton } from "@/components/ui";

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPost(data);
      } catch {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={post?.title || "Edit post"} crumb={{ label: "Blog posts", href: "/admin/blog" }} />
      {loading ? (
        <PanelSkeleton rows={6} />
      ) : !post ? (
        <EmptyState title="Post not found" />
      ) : (
        <BlogPostForm post={post} />
      )}
    </div>
  );
}
