"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { generateSlug } from "@/lib/utils/slug";
import type { BlogPost } from "@/lib/blog/types";

const TipTapEditor = dynamic(() => import("./TipTapEditor"), { ssr: false });

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string().min(1, "Description is required").max(500),
  author: z.string().min(1, "Author is required").max(100),
  tags: z.string(),
  featured_image_url: z.string().optional(),
});

type FormData = z.infer<typeof blogPostSchema>;

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50";
const labelClasses = "mb-1.5 block text-sm font-medium text-white/60";
const errorClasses = "mt-1 text-xs text-red-400";

interface BlogPostFormProps {
  post?: BlogPost;
}

export default function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(post?.content || "");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      description: post?.description || "",
      author: post?.author || "Triple 3 Labs",
      tags: post?.tags?.join(", ") || "",
      featured_image_url: post?.featured_image_url || "",
    },
  });

  // Auto-generate slug from title (only for new posts)
  const title = watch("title");
  useEffect(() => {
    if (!post && title) {
      setValue("slug", generateSlug(title));
    }
  }, [title, post, setValue]);

  async function onSubmit(data: FormData, status: "draft" | "published") {
    setSaving(true);
    try {
      const payload = {
        ...data,
        content,
        status,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        featured_image_url: data.featured_image_url || null,
        published_at: post?.published_at || null,
      };

      const url = post ? `/api/blog/${post.id}` : "/api/blog";
      const method = post ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(
        status === "published" ? "Post published!" : "Draft saved!"
      );
      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        <ArrowLeft size={14} />
        Back to Blog Posts
      </Link>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        {/* Title + Slug row */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClasses}>Title</label>
            <input
              {...register("title")}
              className={inputClasses}
              placeholder="Post title"
            />
            {errors.title && (
              <p className={errorClasses}>{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>Slug</label>
            <input
              {...register("slug")}
              className={inputClasses}
              placeholder="post-url-slug"
            />
            {errors.slug && (
              <p className={errorClasses}>{errors.slug.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClasses}>Description</label>
          <textarea
            {...register("description")}
            rows={2}
            className={inputClasses}
            placeholder="Brief description for SEO and blog listing"
          />
          {errors.description && (
            <p className={errorClasses}>{errors.description.message}</p>
          )}
        </div>

        {/* Author + Tags row */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClasses}>Author</label>
            <input
              {...register("author")}
              className={inputClasses}
              placeholder="Author name"
            />
            {errors.author && (
              <p className={errorClasses}>{errors.author.message}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>Tags</label>
            <input
              {...register("tags")}
              className={inputClasses}
              placeholder="AI Agents, Automation, Voice AI"
            />
          </div>
        </div>

        {/* Featured Image URL */}
        <div>
          <label className={labelClasses}>Featured Image URL (optional)</label>
          <input
            {...register("featured_image_url")}
            className={inputClasses}
            placeholder="https://..."
          />
        </div>

        {/* Content Editor */}
        <div>
          <label className={labelClasses}>Content</label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 border-t border-white/5 pt-6">
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((data) => onSubmit(data, "draft"))}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((data) => onSubmit(data, "published"))}
            className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-5 py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
