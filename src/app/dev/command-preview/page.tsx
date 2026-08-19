"use client";

// Dev-only visual harness for the Command Center: renders the real view with
// fixture data (mirroring the live book of business plus extra rows to test
// density at scale) so design can be iterated without an admin session.
// Returns 404 outside development.

import { notFound } from "next/navigation";
import CommandView from "@/app/admin/command/view";
import type { CommandResponse } from "@/app/api/command/route";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const FIXTURE: CommandResponse = {
  generatedAt: new Date().toISOString(),
  kpis: {
    mrr: 2997,
    customers: 2,
    customersBilling: 1,
    customersOnboarding: 1,
    openDeals: 4,
    engagingProspects7d: 3,
    needsYou: 3,
  },
  queue: [
    {
      severity: "crit",
      action: "Set up Mast-Lepley Silo, Inc. billing",
      why: "$2,498/mo agreed, no Stripe customer yet",
      accountId: "ml",
    },
    {
      severity: "crit",
      action: "Follow up Ultimate Chiropractic",
      why: "2 docs out, 11 views, opened recently — no deal in pipeline",
    },
    {
      severity: "warn",
      action: "Kick off Mast-Lepley Silo, Inc.",
      why: "2 recurring commitments not anchored — onboarding/access pending",
      accountId: "ml",
    },
  ],
  clients: [
    {
      accountId: "ml",
      name: "Mast-Lepley Silo, Inc.",
      contactName: "Nathan Hudson",
      contactEmail: "nhudson@mastlepley.com",
      status: "onboarding",
      services: ["SEO Build", "Google Ads", "Chief of Staff"],
      mrr: 2498,
      billingSetUp: false,
      setupFeePaidAt: null,
      customerSince: daysAgo(0),
      latest: { text: "Closed Won — account + 7 commitments created", by: "stage_change", at: daysAgo(0) },
      nextDue: null,
      commitments: [
        { id: "1", name: "Local Search Build — 6-month delivery", kind: "recurring", cadence: "monthly", nextDue: null, active: true },
        { id: "2", name: "Monthly reporting (rankings, traffic, AI citations)", kind: "recurring", cadence: "monthly", nextDue: null, active: true },
        { id: "3", name: "Chief of Staff agent — daily brief", kind: "continuous", cadence: null, nextDue: null, active: true },
        { id: "4", name: "Listing monitoring (GBP)", kind: "continuous", cadence: null, nextDue: null, active: true },
      ],
      links: [
        { id: "l1", kind: "audit", title: "Local Search Audit", url: "#", views: 19, lastViewed: daysAgo(5) },
        { id: "l2", kind: "proposal", title: "Local Search Build Proposal", url: "#", views: 6, lastViewed: daysAgo(1) },
        { id: "l3", kind: "ads_plan", title: "Google Ads Plan", url: "#", views: 3, lastViewed: daysAgo(3) },
      ],
    },
    {
      accountId: "es",
      name: "Eco Seal Solutions",
      contactName: "Mike Myers",
      contactEmail: "mike@ecosealsolutions.com",
      status: "active",
      services: ["SEO Agent"],
      mrr: 499,
      billingSetUp: true,
      setupFeePaidAt: daysAgo(23),
      customerSince: daysAgo(35),
      latest: { text: "Subscription payment received: $499.00 (first invoice)", by: "payment_received", at: daysAgo(12) },
      nextDue: daysAhead(17),
      commitments: [
        { id: "5", name: "Monthly in-depth SEO report", kind: "recurring", cadence: "monthly", nextDue: daysAhead(17), active: true },
        { id: "6", name: "Monitoring: rankings + Ahrefs", kind: "continuous", cadence: null, nextDue: null, active: true },
        { id: "7", name: "Monitoring: GSC + GA4", kind: "continuous", cadence: null, nextDue: null, active: true },
        { id: "8", name: "Ongoing recommendations & Q&A", kind: "continuous", cadence: null, nextDue: null, active: true },
      ],
      links: [
        { id: "l4", kind: "report", title: "Kickoff Baseline SEO Report — Aug 2026", url: "#", views: 6, lastViewed: daysAgo(13) },
      ],
    },
    // density test rows
    {
      accountId: "d1",
      name: "Berlin Gardens (example)",
      contactName: "Ops team",
      contactEmail: null,
      status: "active",
      services: ["Order Intake"],
      mrr: 1299,
      billingSetUp: true,
      setupFeePaidAt: daysAgo(60),
      customerSince: daysAgo(90),
      latest: { text: "Parsed 212 dealer POs, 3 flagged for review", by: "agent", at: daysAgo(0) },
      nextDue: daysAhead(12),
      commitments: [],
      links: [],
    },
    {
      accountId: "d2",
      name: "Heartland Stairways (example)",
      contactName: "Front office",
      contactEmail: null,
      status: "at_risk",
      services: ["Speed-to-Lead"],
      mrr: 599,
      billingSetUp: true,
      setupFeePaidAt: daysAgo(120),
      customerSince: daysAgo(150),
      latest: { text: "No delivery logged in 34 days — check in", by: "agent", at: daysAgo(34) },
      nextDue: daysAhead(-4),
      commitments: [
        { id: "9", name: "Monthly lead report", kind: "recurring", cadence: "monthly", nextDue: daysAhead(-4).slice(0, 10), active: true },
      ],
      links: [],
    },
  ],
  stages: [
    { name: "New Lead", color: "violet", order: 0, isClosed: false, count: 1 },
    { name: "Prospecting", color: "cyan", order: 1, isClosed: false, count: 3 },
    { name: "Proposal Sent", color: "purple", order: 2, isClosed: false, count: 0 },
    { name: "Negotiation", color: "pink", order: 3, isClosed: false, count: 0 },
    { name: "Won", color: "emerald", order: 4, isClosed: true, count: 1 },
    { name: "Lost", color: "zinc", order: 5, isClosed: true, count: 0 },
  ],
  deals: [
    { id: "p1", name: "PAXIT — Website Rebuild + SEO Agent", company: "PAXIT", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: null, description: "audit sent in Jeff's own email · Vercel concept live", views: 17, lastViewed: daysAgo(11), createdAt: daysAgo(15) },
    { id: "p2", name: "Atwood Glass — Full Stack", company: "Atwood Glass, Inc.", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: null, description: "audit + website mockup out · market wide open", views: 9, lastViewed: daysAgo(1), createdAt: daysAgo(24) },
    { id: "p3", name: "Alpine Services — SEO Agent", company: "Alpine Services", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: 1500, description: "audit + pitch sent Jul 22 · quiet since", views: 5, lastViewed: daysAgo(28), createdAt: daysAgo(28) },
    { id: "p4", name: "Contact-form test", company: null, stage: "New Lead", stageColor: "violet", stageOrder: 0, isClosed: false, amount: null, description: "Test real estate form", views: null, lastViewed: null, createdAt: daysAgo(113) },
    { id: "p5", name: "Mast-Lepley — SEO Build + Google Ads", company: "Mast-Lepley Silo, Inc.", stage: "Won", stageColor: "emerald", stageOrder: 4, isClosed: true, amount: 2498, description: "closed Aug 19 → onboarding above", views: 19, lastViewed: daysAgo(5), createdAt: daysAgo(0) },
  ],
  prospects: [
    { key: "ultimate-chiropractic.com", name: "Ultimate Chiropractic", domain: "ultimate-chiropractic.com", docs: 2, views: 11, lastViewed: daysAgo(0), hasDeal: false, viewedLast7d: true },
    { key: "atwoodglass.net", name: "Atwood Glass", domain: "atwoodglass.net", docs: 2, views: 9, lastViewed: daysAgo(1), hasDeal: true, viewedLast7d: true },
    { key: "mastlepley.com", name: "Mast-Lepley", domain: "mastlepley.com", docs: 3, views: 28, lastViewed: daysAgo(1), hasDeal: true, viewedLast7d: true },
    { key: "39chiro.com", name: "39 Chiropractic & Rehabilitation", domain: "39chiro.com", docs: 1, views: 2, lastViewed: daysAgo(2), hasDeal: false, viewedLast7d: false },
    { key: "woolmarket", name: "The Woolmarket Inn at Stiglets' Landing", domain: null, docs: 3, views: 1, lastViewed: daysAgo(2), hasDeal: false, viewedLast7d: false },
    { key: "paxit.com", name: "PAXIT", domain: "paxit.com", docs: 2, views: 18, lastViewed: daysAgo(11), hasDeal: true, viewedLast7d: false },
    { key: "dcaroofing.com", name: "DCA Commercial Roofing", domain: "dcaroofing.com", docs: 1, views: 8, lastViewed: daysAgo(20), hasDeal: false, viewedLast7d: false },
    { key: "tuscsupply.com", name: "TUSC Construction Supply", domain: "tuscsupply.com", docs: 1, views: 4, lastViewed: daysAgo(14), hasDeal: false, viewedLast7d: false },
    { key: "alpine-services.com", name: "Alpine Services", domain: "alpine-services.com", docs: 1, views: 5, lastViewed: daysAgo(28), hasDeal: true, viewedLast7d: false },
  ],
};

export default function CommandPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className="min-h-screen bg-background p-8">
      <CommandView data={FIXTURE} />
    </div>
  );
}
