
-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured_image_url TEXT,
  author TEXT NOT NULL DEFAULT 'Triple 3 Labs',
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for public queries: only published posts, sorted by publish date
CREATE INDEX idx_blog_posts_published ON blog_posts (status, published_at DESC)
  WHERE status = 'published';

-- Index for slug lookups
CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read policy for published posts
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can do anything (admin)
CREATE POLICY "Authenticated users have full access"
  ON blog_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
;
