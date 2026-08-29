"use client";

// Dev-only visual harness for the Command Center: renders the real view with
// fixture data (FAKE companies only — mirrors real data shapes, never real client names, to test
// density at scale) so design can be iterated without an admin session.
// Returns 404 outside development.

import { notFound } from "next/navigation";
import CommandView from "@/app/admin/command/view";
import type { CommandResponse } from "@/app/api/command/route";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const FIXTURE: CommandResponse = {
  generatedAt: new Date().toISOString(),
  revenue: {
    lines: [
      { bucket: "locked", name: "Sample Silo Co.", mrrNow: 2498, mrrMature: 2498, setupFee: 0, termMonths: null, stage: "active" },
      { bucket: "locked", name: "Sample Stairworks", mrrNow: 1500, mrrMature: 1500, setupFee: null, termMonths: 6, stage: "active" },
      { bucket: "pending", name: "Sample Exteriors — SEO+GBP+PPC", mrrNow: 1797, mrrMature: 1497, setupFee: 2500, termMonths: null, stage: "Proposal Sent" },
      { bucket: "pending", name: "Sample Car Wash — SEO+GBP", mrrNow: 1298, mrrMature: 998, setupFee: 2000, termMonths: null, stage: "Proposal Sent" },
    ],
    rollup: {
      lockedMrr: 3998,
      pendingMrr: 3095,
      totalPotentialMrr: 7093,
      lockedArr: 47976,
      potentialArr: 85116,
      potentialArrMature: 77916,
      lockedSetup: 0,
      pendingSetup: 4500,
      activeClients: 2,
      openDeals: 2,
    },
  },
  agentsAvailable: true,
  // Static timestamps (not daysAgo()) — sub-second Date.now() drift between
  // the server and client renders shows up in title attrs as hydration noise.
  agents: [
    {
      agentId: "bridge-sample-silo",
      customerId: "sample-silo",
      role: "bridge",
      host: "mac-mini",
      lastHeartbeat: "2026-08-21T12:00:00.000Z",
      ageSeconds: 42,
      staleSeconds: 300,
      stale: false,
      lastTaskName: "pingo-chat",
      lastTaskStatus: "ok",
      lastTaskAt: "2026-08-21T11:58:00.000Z",
    },
    {
      agentId: "worker-sample-silo",
      customerId: "sample-silo",
      role: "worker",
      host: "mac-mini",
      lastHeartbeat: "2026-08-19T12:00:00.000Z",
      ageSeconds: 172_800,
      staleSeconds: 691_200,
      stale: false,
      lastTaskName: "seo-weekly",
      lastTaskStatus: "ok",
      lastTaskAt: "2026-08-19T12:00:00.000Z",
    },
    {
      agentId: "bridge-demo-chiro",
      customerId: "demo-chiro",
      role: "bridge",
      host: "mac-mini",
      lastHeartbeat: "2026-08-21T00:00:00.000Z",
      ageSeconds: 43_200,
      staleSeconds: 300,
      stale: true,
      lastTaskName: "pingo-chat",
      lastTaskStatus: "error",
      lastTaskAt: "2026-08-21T00:00:00.000Z",
    },
  ],
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
      key: "billing:ml",
      severity: "crit",
      action: "Set up Sample Silo Co. billing",
      why: "$2,498/mo agreed, no Stripe customer yet",
      accountId: "ml",
    },
    {
      key: "prospect:demo-chiropractic",
      severity: "crit",
      action: "Follow up Demo Chiropractic",
      why: "2 docs out, 11 views, opened recently — no deal in pipeline",
    },
    {
      key: "kickoff:ml",
      severity: "warn",
      action: "Kick off Sample Silo Co.",
      why: "2 recurring commitments not anchored — onboarding/access pending",
      accountId: "ml",
    },
  ],
  clients: [
    {
      accountId: "ml",
      name: "Sample Silo Co.",
      contactName: "Pat Example",
      contactEmail: "pat@sample-silo.example",
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
      name: "Acme Sealing LLC",
      contactName: "Sam Sample",
      contactEmail: "sam@acme-sealing.example",
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
      name: "Garden Mfg (example)",
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
      name: "Stairworks (example)",
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
    { id: "p1", contactName: "M. Sample", contactEmail: "m@demopharm.example", contactId: "c1", accountId: null, links: [{ id: "dl1", kind: "audit", title: "Search Visibility Audit", url: "#", views: 17, lastViewed: daysAgo(11) }], name: "DemoPharm — Website Rebuild + SEO Agent", company: "DemoPharm", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: null, description: "audit sent · website concept live", views: 17, lastViewed: daysAgo(11), createdAt: daysAgo(15) },
    { id: "p2", contactName: "Casey Demo", contactEmail: null, contactId: "c2", accountId: null, links: [{ id: "dl2", kind: "audit", title: "Local Search Audit", url: "#", views: 6, lastViewed: daysAgo(10) }, { id: "dl3", kind: "website", title: "Website Mockup", url: "#", views: 3, lastViewed: daysAgo(1) }], name: "Demo Glass — Full Stack", company: "Demo Glass, Inc.", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: null, description: "audit + website mockup out · market wide open", views: 9, lastViewed: daysAgo(1), createdAt: daysAgo(24) },
    { id: "p3", contactName: "J. Placeholder", contactEmail: null, contactId: "c3", accountId: null, links: [], name: "Summit Services — SEO Agent", company: "Summit Services", stage: "Prospecting", stageColor: "cyan", stageOrder: 1, isClosed: false, amount: 1500, description: "audit + pitch sent Jul 22 · quiet since", views: 5, lastViewed: daysAgo(28), createdAt: daysAgo(28) },
    { id: "p4", contactName: "Jeff Conn", contactEmail: null, contactId: "c4", accountId: null, links: [], name: "Contact-form test", company: null, stage: "New Lead", stageColor: "violet", stageOrder: 0, isClosed: false, amount: null, description: "Test real estate form", views: null, lastViewed: null, createdAt: daysAgo(113) },
    { id: "p5", contactName: "Pat Example", contactEmail: "pat@sample-silo.example", contactId: "c5", accountId: "ml", links: [{ id: "dl4", kind: "proposal", title: "Local Search Build Proposal", url: "#", views: 6, lastViewed: daysAgo(1) }], name: "Sample Silo — SEO Build + Google Ads", company: "Sample Silo Co.", stage: "Won", stageColor: "emerald", stageOrder: 4, isClosed: true, amount: 2498, description: "closed recently → onboarding above", views: 19, lastViewed: daysAgo(5), createdAt: daysAgo(0) },
  ],
  prospects: [
    { key: "demo-chiro.example", name: "Demo Chiropractic", domain: "demo-chiro.example", docs: 2, views: 11, lastViewed: daysAgo(0), hasDeal: false, viewedLast7d: true, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "demo-glass.example", name: "Demo Glass", domain: "demo-glass.example", docs: 2, views: 9, lastViewed: daysAgo(1), hasDeal: true, viewedLast7d: true, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "sample-silo.example", name: "Sample Silo", domain: "sample-silo.example", docs: 3, views: 28, lastViewed: daysAgo(1), hasDeal: true, viewedLast7d: true, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "example-rehab.example", name: "Example Rehab Clinic", domain: "example-rehab.example", docs: 1, views: 2, lastViewed: daysAgo(2), hasDeal: false, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "sample-inn", name: "The Sample Inn", domain: null, docs: 3, views: 1, lastViewed: daysAgo(2), hasDeal: false, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "demopharm.example", name: "DemoPharm", domain: "demopharm.example", docs: 2, views: 18, lastViewed: daysAgo(11), hasDeal: true, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "demo-roofing.example", name: "Demo Roofing Co", domain: "demo-roofing.example", docs: 1, views: 8, lastViewed: daysAgo(20), hasDeal: false, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "sample-supply.example", name: "Sample Supply Co", domain: "sample-supply.example", docs: 1, views: 4, lastViewed: daysAgo(14), hasDeal: false, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
    { key: "summit-services.example", name: "Summit Services", domain: "summit-services.example", docs: 1, views: 5, lastViewed: daysAgo(28), hasDeal: true, viewedLast7d: false, dealId: null, contactId: null, reports: [{ title: "Local Search Audit", url: "#", views: 4, lastViewed: daysAgo(3) }], },
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
