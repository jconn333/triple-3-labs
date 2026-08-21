import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_SNOOZE_DAYS = 14;

// Dismiss ("snooze") a Command Center "Needs you" item. Snooze-only by design:
// this hides the derived item for a window; it does NOT modify the underlying
// deal or commitment. The item resurfaces once the snooze lapses.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { key?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const key = body.key?.trim();
  if (!key) return NextResponse.json({ error: "Missing queue key" }, { status: 400 });

  const days = Number.isFinite(body.days) && (body.days as number) > 0 ? (body.days as number) : DEFAULT_SNOOZE_DAYS;
  const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("command_snoozes").upsert(
    { queue_key: key, snoozed_until: snoozedUntil, snoozed_at: new Date().toISOString(), snoozed_by: user.id },
    { onConflict: "queue_key" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, key, snoozedUntil });
}
