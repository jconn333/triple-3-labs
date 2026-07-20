import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Triple 3 Labs",
  description:
    "Answers to common questions about Triple 3 Labs' AI agents — setup, pricing, how the agents work, data security, and what it's like to work together.",
};

/* ── Data ────────────────────────────────────────────────────────── */

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  category: string;
  items: FaqItem[];
};

const faqCategories: FaqCategory[] = [
  {
    category: "Getting Started",
    items: [
      {
        id: "what-do-i-get",
        question: "What exactly do I get?",
        answer:
          "A custom AI agent designed around your business — not an off-the-shelf chatbot. Setup includes a discovery call, agent design, workflow mapping, knowledge-base training, integration setup, and go-live support. Once it's live, we handle ongoing monitoring, tuning, and support so it just keeps working.",
      },
      {
        id: "how-long-to-live",
        question: "How long until my agent is live?",
        answer:
          "Most agents go live within 1–2 weeks of your discovery call. Timeline depends on how much knowledge-base content and integration work is involved, but we move fast — you'll know your go-live date early in the process.",
      },
      {
        id: "need-to-be-technical",
        question: "Do I need to be technical?",
        answer:
          "No. We handle the build, the integrations, and the training. Your job is answering our questions about how your business runs — we translate that into the agent.",
      },
      {
        id: "tools-integrate",
        question: "What tools do you integrate with?",
        answer:
          "We connect to your CRM, calendar, phone system, and the channels your customers already use — chat, email, web, and voice. Professional and Premium plans include CRM integration and calendar booking out of the box; if you use something specific, tell us during discovery and we'll scope it.",
      },
      {
        id: "industry-not-listed",
        question: "What if my industry isn't listed?",
        answer:
          "That's fine — we're not locked into a template library. The founder runs these same agents in his own hotel, cabin rental, and event-venue businesses first, so the process is built and refined on real operations. If we haven't built for your exact industry yet, we'll design around your workflows just the same.",
      },
    ],
  },
  {
    category: "How the Agents Work",
    items: [
      {
        id: "sound-like-robot",
        question: "Will it sound like a robot?",
        answer:
          "No — we design each agent's tone and language around your brand voice, not a generic script. Most customers don't realize they're talking to an AI until we tell them.",
      },
      {
        id: "dont-know-answer",
        question: "What happens when the AI doesn't know an answer?",
        answer:
          "It says so and hands off — it never bluffs or guesses. Depending on your plan and setup, that means escalating to a human teammate or flagging the conversation for follow-up, so nothing slips through with a made-up answer.",
      },
      {
        id: "human-take-over",
        question: "Can a human take over a live conversation?",
        answer:
          "Yes. Professional and Premium plans include live handoff, so your team can jump into an in-progress conversation whenever they want — or whenever the agent flags something that needs a human.",
      },
      {
        id: "nights-weekends",
        question: "Does it work nights and weekends?",
        answer:
          "Yes — 24/7 is the whole point. The agent doesn't take breaks, weekends, or holidays, so you stop losing leads and guests to slow response times outside business hours.",
      },
      {
        id: "knowledge-source",
        question: "Where does its knowledge come from?",
        answer:
          "From your business — your docs, FAQs, policies, and the details you walk us through during setup. We build the knowledge base together during onboarding, and we keep it updated as your business changes.",
      },
    ],
  },
  {
    category: "Accuracy, Data & Security",
    items: [
      {
        id: "data-train-public-models",
        question: "Is my business data used to train public models?",
        answer:
          "No. Your data trains and informs your agent — it isn't used to train public or third-party models.",
      },
      {
        id: "who-sees-logs",
        question: "Who can see conversation logs?",
        answer:
          "You and your team. Every conversation is logged and available to you for review, and we use those logs internally to monitor performance and tune the agent — nobody else has access.",
      },
      {
        id: "catch-mistakes",
        question: "What about mistakes — how do you catch them?",
        answer:
          "We monitor 24/7, run conversations through review queues, and set escalation rules so anything outside the agent's confidence gets kicked to a human. For sensitive actions — refunds, cancellations, anything with real consequences — we can configure human-approval modes so nothing happens without your sign-off.",
      },
      {
        id: "approve-messages",
        question: "Can I approve messages before they go out?",
        answer:
          "Yes — we can set up draft and approval modes where the agent prepares a response or action and a human on your team approves it before it sends. It's a good option early on, or for anything high-stakes.",
      },
    ],
  },
  {
    category: "Pricing & Billing",
    items: [
      {
        id: "api-usage-meaning",
        question: '“+ applicable API usage” — what does that mean in practice?',
        answer:
          "Every plan includes a base retainer plus the underlying API costs (AI model usage, voice minutes beyond your included allotment, etc.) passed through at cost. In practice it's typically a modest amount that scales with how much your agent is used, and we review it with you monthly so there are no surprises.",
      },
      {
        id: "no-lock-in",
        question: "Do I have to sign a long-term contract?",
        answer:
          "No — there's no minimum commitment. We've all worked with agencies that lock you into a year-long contract for something you end up unhappy with three months in. We'd rather earn it every month: the agent has to keep proving its value, or you're free to walk. No hard feelings, no early-termination fee.",
      },
      {
        id: "why-setup-fee",
        question: "Why is there a setup fee?",
        answer:
          "The one-time setup fee covers the actual build: the discovery call, agent design, workflow mapping, knowledge-base training, integration setup, and go-live support. It's a one-time cost rather than baked into your monthly retainer, so your ongoing plan reflects only what it costs to run and manage the agent. Adding a second or third agent later costs less — the discounts are part of the plan details we share on the discovery call.",
      },
      {
        id: "cancel-change-plans",
        question: "What if I want to cancel or change plans?",
        answer:
          "Cancel or change plans anytime — there's no minimum term to wait out. If your needs grow, moving up a tier is straightforward. Reach out and we'll walk through the options together.",
      },
    ],
  },
  {
    category: "Working Together",
    items: [
      {
        id: "who-builds-maintains",
        question: "Who actually builds and maintains the agent?",
        answer:
          "We do — our team designs, builds, and manages every agent, and the founder runs this same playbook on his own hotel, cabin rental, and event-venue businesses. Ongoing management — 24/7 monitoring, knowledge-base updates, tuning, analytics, and support — is included in your monthly plan, not an extra project.",
      },
      {
        id: "what-do-you-need",
        question: "What do you need from me to start?",
        answer:
          "Mainly your time for the discovery call and access to whatever we're integrating — your CRM, calendar, docs, and FAQs. From there we build, test, and bring you into the loop before go-live.",
      },
      {
        id: "measure-success",
        question: "How do we measure whether it's working?",
        answer:
          "Through conversation logs, weekly or monthly reports, and concrete metrics — response times, calls and chats answered, hand-off rates, and more. You'll always be able to see what the agent is doing and how it's performing, not just take our word for it.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqCategories.flatMap((category) =>
    category.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }))
  ),
};

/* ── Page ────────────────────────────────────────────────────────── */

export default function FaqPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />
      <div className="pt-28" />

      {/* Header */}
      <section className="relative px-6 pb-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            FAQ
          </span>
          <h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Questions, <span className="gradient-text">answered.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Everything you need to know about setup, pricing, how the agents
            work, and what it&apos;s like to work with us. Don&apos;t see
            your question — just ask.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="relative px-6 py-12">
        <div className="relative z-10 mx-auto max-w-3xl">
          <FaqAccordion categories={faqCategories} />
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan/10 blur-[128px]" />
        </div>

        <div className="glass-card relative z-10 mx-auto max-w-2xl rounded-2xl p-10 text-center">
          <h2
            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Still have <span className="gradient-text">questions?</span>{" "}
            Let&apos;s talk.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-white/50">
            Tell us about your business and we&apos;ll show you exactly where
            an agent fits — no pressure, no jargon.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/#contact"
              className="rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              Get Your Free AI Assessment
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
