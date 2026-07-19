export interface CaseStudyResult {
  value: string;
  label: string;
}

export interface CaseStudySolution {
  intro: string;
  bullets: string[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industry: string;
  tags: string[];
  /** 1-2 sentence summary shown on cards and in the hero. */
  summary: string;
  /** Paragraphs describing the problem, in order. */
  challenge: string[];
  solution: CaseStudySolution;
  /** Tool / vendor names, shown as chips. */
  stack: string[];
  results: CaseStudyResult[];
  pullQuote?: string;
  /** Slug of the related post at /blog/<blogSlug>, if one exists. */
  blogSlug?: string;
  /** Override link text when blogSlug isn't a build narrative (defaults to "Read the full build story"). */
  blogLinkLabel?: string;
  /** Tailwind gradient stops, e.g. "from-violet to-purple". */
  gradient: string;
  /** Plain color name used for text/border accents, e.g. "violet". */
  accentColor: string;
  /** True for systems still in active development/validation, not yet live in production. */
  inDevelopment?: boolean;
}
