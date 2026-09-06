"use client";

import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import { PageHeader } from "@/components/admin/PageHeader";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New post" crumb={{ label: "Blog posts", href: "/admin/blog" }} />
      <BlogPostForm />
    </div>
  );
}
