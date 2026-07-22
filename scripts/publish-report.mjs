#!/usr/bin/env node
// Publish (or update) a prospect SEO report at triple3labs.io/r/<slug>.
//
// Usage:
//   node scripts/publish-report.mjs --file <report.html> --name "Alpine Services" [--domain alpine-services.com] [--title "..."] [--slug <existing-slug>]
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Prints the public URL on success. Passing --slug updates that report in place.

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  if (!argv[i].startsWith("--") || argv[i + 1] === undefined) {
    console.error(`Bad argument: ${argv[i]}`);
    process.exit(1);
  }
  args[argv[i].slice(2)] = argv[i + 1];
}

if (!args.file || !args.name) {
  console.error(
    'Usage: publish-report.mjs --file <report.html> --name "Prospect Name" [--domain d] [--title t] [--slug s]'
  );
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const html = readFileSync(resolve(args.file), "utf8");
const slug = args.slug ?? randomBytes(12).toString("base64url");

const row = {
  slug,
  prospect_name: args.name,
  prospect_domain: args.domain ?? null,
  title: args.title ?? html.match(/<title>([^<]+)<\/title>/)?.[1] ?? null,
  html,
  updated_at: new Date().toISOString(),
};

const { error } = await supabase
  .from("prospect_reports")
  .upsert(row, { onConflict: "slug" });

if (error) {
  console.error("Publish failed:", error.message);
  process.exit(1);
}
console.log(`https://triple3labs.io/r/${slug}`);
