// One-time setup: registers the production Stripe webhook endpoint and stores
// the signing secret in .env.local (and prints instructions for Vercel).
// The secret is never printed to the terminal.
//
// Usage:  node --env-file=.env.local scripts/register-stripe-webhook.mjs
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const URL = "https://triple3labs.io/api/stripe/webhook";
const EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
];

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is empty in .env.local — add it first (line 7).");
  process.exit(1);
}
const stripe = new Stripe(key);

// Reuse an existing endpoint if one is already registered for this URL.
const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find(
  (e) => e.url === URL
);
let endpoint, secret;
if (existing) {
  console.log(`Endpoint already registered (${existing.id}).`);
  console.log("Note: Stripe only reveals the secret at creation. If you no longer");
  console.log("have it, delete the endpoint in the dashboard and rerun this script.");
  process.exit(0);
} else {
  endpoint = await stripe.webhookEndpoints.create({
    url: URL,
    enabled_events: EVENTS,
    description: "Triple 3 CRM — implementation fee payments",
  });
  secret = endpoint.secret;
  console.log(`Created webhook endpoint ${endpoint.id} for ${URL}`);
}

// Write the secret into .env.local without echoing it.
const envPath = new globalThis.URL("../.env.local", import.meta.url).pathname;
let env = readFileSync(envPath, "utf8");
if (/^STRIPE_WEBHOOK_SECRET=/m.test(env)) {
  env = env.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${secret}`);
} else {
  env = env.trimEnd() + `\nSTRIPE_WEBHOOK_SECRET=${secret}\n`;
}
writeFileSync(envPath, env);
console.log("STRIPE_WEBHOOK_SECRET written to .env.local (not displayed).");

// Push to Vercel production env without displaying it.
try {
  execSync(`printf %s "$SECRET_VALUE" | npx vercel env add STRIPE_WEBHOOK_SECRET production`, {
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, SECRET_VALUE: secret },
    cwd: new globalThis.URL("..", import.meta.url).pathname,
  });
  console.log("STRIPE_WEBHOOK_SECRET added to Vercel (production).");
} catch {
  console.log("Could not add to Vercel automatically — add STRIPE_WEBHOOK_SECRET in the Vercel dashboard (value is in .env.local).");
}
console.log("\nDone. Remember STRIPE_SECRET_KEY must ALSO be set in Vercel for production.");
