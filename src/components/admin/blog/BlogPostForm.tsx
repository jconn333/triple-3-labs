"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { generateSlug } from "@/lib/utils/slug";
import type { BlogPost } from "@/lib/blog/types";
import { Button, Field, Input, Textarea } from "@/components/ui";

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
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Title + Slug row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title" error={errors.title?.message}>
          <Input {...register("title")} placeholder="Post title" />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="post-url-slug" />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description" error={errors.description?.message}>
        <Textarea {...register("description")} rows={2} placeholder="Brief description for SEO and blog listing" />
      </Field>

      {/* Author + Tags row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Author" error={errors.author?.message}>
          <Input {...register("author")} placeholder="Author name" />
        </Field>
        <Field label="Tags">
          <Input {...register("tags")} placeholder="AI Agents, Automation, Voice AI" />
        </Field>
      </div>

      {/* Featured Image URL */}
      <Field label="Featured image URL (optional)">
        <Input {...register("featured_image_url")} placeholder="https://..." />
      </Field>

      {/* Content Editor */}
      <Field label="Content">
        <TipTapEditor content={content} onChange={setContent} />
      </Field>

      {/* Action buttons */}
      <div className="flex items-center gap-3 border-t border-line pt-6">
        <Button
          type="button"
          variant="secondary"
          disabled={saving}
          loading={saving}
          onClick={handleSubmit((data) => onSubmit(data, "draft"))}
        >
          {!saving && <Save size={14} />}
          Save draft
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={saving}
          loading={saving}
          onClick={handleSubmit((data) => onSubmit(data, "published"))}
        >
          {!saving && <Send size={14} />}
          Publish
        </Button>
      </div>
    </form>
  );
}
