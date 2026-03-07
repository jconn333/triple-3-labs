"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import type { BlogPost } from "@/lib/blog/types";

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-12 animate-pulse rounded-lg bg-white/5" />
          <div className="h-12 animate-pulse rounded-lg bg-white/5" />
        </div>
        <div className="h-24 animate-pulse rounded-lg bg-white/5" />
        <div className="h-96 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="glass-card rounded-xl p-8 text-center text-white/50">
        Post not found.
      </div>
    );
  }

  return <BlogPostForm post={post} />;
}
