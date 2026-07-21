/**
 * Onboarding form specs.
 *
 * One spec per product. The public page at /onboarding/[token] renders whatever
 * spec the request row points at (`onboarding_requests.form_key`), so adding a
 * new product's intake is a new entry here — not a new page.
 *
 * Answers are stored as a flat `{ [field.key]: value }` jsonb blob on the
 * request row. Specs are therefore append-only in spirit: renaming a key
 * orphans the answers already collected under the old one.
 */

export type OnboardingFieldType = "text" | "textarea" | "checkbox" | "radio";

export interface OnboardingField {
  key: string;
  label: string;
  type: OnboardingFieldType;
  /** Shown under the label — the "why we're asking" line. */
  help?: string;
  placeholder?: string;
  required?: boolean;
  /** radio only. */
  options?: { value: string; label: string }[];
  /**
   * radio only: when this option is selected, reveal a free-text box.
   * Its answer is stored under `${key}_detail`.
   */
  detailWhen?: string;
  detailPlaceholder?: string;
}

export interface OnboardingSection {
  title: string;
  /** Intro paragraph for the section. */
  blurb?: string;
  /**
   * Renders the access-grant table above the fields, using the addresses on
   * the request row. Only meaningful for sections that ask about access.
   */
  showAccessGrants?: boolean;
  fields: OnboardingField[];
}

export interface OnboardingFormSpec {
  key: string;
  /** Page headline, e.g. "SEO Agent — getting started". */
  title: string;
  intro: string;
  sections: OnboardingSection[];
  /** Shown on the thank-you screen. */
  confirmation: string;
}

/** One row of the "grant access to this address" table. */
export interface AccessGrant {
  tool: string;
  /** The address the client adds. Filled in when the request is created. */
  address: string;
  role: string;
  /** e.g. a deep link to the tool's user-management screen. */
  url?: string;
}

const SEO_AGENT: OnboardingFormSpec = {
  key: "seo_agent",
  title: "SEO Agent — getting started",
  intro:
    "A few things and we can get your agent running. The access below is read-only: your agent analyzes and recommends, it never changes your site, your listing, or your content. Everything it finds comes to you first.",
  sections: [
    {
      title: "Access",
      blurb:
        "Your agent reads from the Google tools you already use. Grant access to the addresses below, then check them off here.",
      showAccessGrants: true,
      fields: [
        {
          key: "access_gsc",
          label: "Google Search Console access granted",
          type: "checkbox",
        },
        {
          key: "access_ga4",
          label: "Google Analytics 4 access granted",
          type: "checkbox",
        },
        {
          key: "access_gbp",
          label: "Google Business Profile access granted",
          type: "checkbox",
        },
        {
          key: "access_notes",
          label: "Any trouble granting access?",
          type: "textarea",
          help: "Optional — tell us what got stuck and we'll walk you through it.",
          placeholder: "e.g. I'm not the owner of the Business Profile listing",
        },
      ],
    },
    {
      title: "What matters to you",
      blurb: "This shapes what your agent focuses on. Rough answers are genuinely fine.",
      fields: [
        {
          key: "success_definition",
          label: "What does a win look like?",
          type: "textarea",
          help: "More calls, more form submissions, ranking for particular terms — what would make this obviously worth it?",
          placeholder: "e.g. more inbound calls for commercial work",
          required: true,
        },
        {
          key: "priority_services",
          label: "Which services do you most want more of?",
          type: "textarea",
          help: "Not necessarily your biggest volume — your most profitable, or the work you'd like more of.",
          required: true,
        },
        {
          key: "service_area",
          label: "How far out do you take work?",
          type: "text",
          help: "Counties, a radius, or the towns you'll drive to.",
          placeholder: "e.g. Holmes County plus 45 minutes",
          required: true,
        },
        {
          key: "competitors",
          label: "Who do you lose bids to?",
          type: "textarea",
          help: "Two or three names is plenty. We'll watch what they rank for.",
        },
        {
          key: "lead_tracking",
          label: "How do people usually reach you?",
          type: "radio",
          help: "Tells us what to measure.",
          options: [
            { value: "phone", label: "Mostly phone calls" },
            { value: "form", label: "Mostly the website form" },
            { value: "both", label: "A mix of both" },
            { value: "unsure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      title: "Reporting",
      fields: [
        {
          key: "report_channel",
          label: "Where should reports go?",
          type: "radio",
          options: [
            { value: "email", label: "Email" },
            { value: "other", label: "Somewhere my team already looks" },
          ],
          detailWhen: "other",
          detailPlaceholder: "e.g. a Teams channel, shared drive, Slack",
          required: true,
        },
        {
          key: "report_recipients",
          label: "Who else should receive them?",
          type: "text",
          help: "Optional — comma-separated email addresses.",
        },
        {
          key: "anything_else",
          label: "Anything else we should know?",
          type: "textarea",
          help: "Optional. Context about the business, past SEO work, things that didn't go well before.",
        },
      ],
    },
  ],
  confirmation:
    "Thanks — that's everything we need. We'll get your agent provisioned and follow up when your first report is ready.",
};

export const ONBOARDING_FORMS: Record<string, OnboardingFormSpec> = {
  [SEO_AGENT.key]: SEO_AGENT,
};

export function getFormSpec(key: string): OnboardingFormSpec | null {
  return ONBOARDING_FORMS[key] ?? null;
}

/** Every field in a spec, flattened — used for validation and for admin display. */
export function allFields(spec: OnboardingFormSpec): OnboardingField[] {
  return spec.sections.flatMap((s) => s.fields);
}
