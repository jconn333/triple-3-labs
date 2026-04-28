import type { LucideIcon } from "lucide-react";

export interface VerticalHero {
  badge?: string;
  headline: string;
  headlineAccent: string;
  subheading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface VerticalAgent {
  name: string;
  title: string;
  description: string;
  skills: string[];
  tools: string[];
  iconName: string;
  gradient: string;
  accentColor: string;
  status: "available" | "coming-soon";
}

export interface VerticalFeature {
  iconName: string;
  title: string;
  description: string;
  gradient: string;
}

export interface VerticalComparison {
  category: string;
  software: string;
  softwareCost: string;
  aiSolution: string;
  badge: string;
  gradient: string;
}

export interface VerticalProcess {
  number: string;
  iconName: string;
  title: string;
  description: string;
  gradient: string;
}

export interface VerticalConfig {
  slug: string;
  industry: string;
  meta: {
    title: string;
    description: string;
  };
  hero: VerticalHero;
  marqueeItems: string[];
  whyAgents: {
    tagline: string;
    headlineWhite: string;
    headlineAccent: string;
    description: string;
  };
  agents: {
    sectionLabel: string;
    headline: string;
    headlineAccent: string;
    description: string;
    list: VerticalAgent[];
  };
  features: {
    sectionLabel: string;
    headline: string;
    headlineAccent: string;
    description: string;
    list: VerticalFeature[];
  };
  automation: {
    sectionLabel: string;
    headline: string;
    headlineAccent: string;
    description: string;
    stats: { value: string; label: string }[];
    comparisons: VerticalComparison[];
  };
  process: {
    sectionLabel: string;
    headline: string;
    headlineAccent: string;
    description: string;
    steps: VerticalProcess[];
  };
  cta: {
    headline: string;
    headlineAccent: string;
    description: string;
    footnote: string;
  };
}
