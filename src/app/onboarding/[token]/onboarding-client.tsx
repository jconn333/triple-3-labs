"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";
import type { AccessGrant, OnboardingField, OnboardingFormSpec } from "@/lib/onboarding/forms";
import { validateResponses } from "@/lib/onboarding/requests";

type OnboardingStatus =
  | "pending"
  | "viewed"
  | "submitted"
  | "expired"
  | "cancelled"
  | "not_found";

interface OnboardingView {
  status: OnboardingStatus;
  account_name?: string;
  recipient_name?: string | null;
  form?: OnboardingFormSpec;
  access_grants?: AccessGrant[] | null;
  expires_at?: string | null;
  responses?: Record<string, string | boolean>;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50";

function AccessGrantsTable({ grants }: { grants: AccessGrant[] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function copyAddress(idx: number, address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1500);
    } catch {
      // Clipboard access can fail (permissions, non-secure context) — fail quietly.
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-4 py-2.5 font-medium">Tool</th>
              <th className="px-4 py-2.5 font-medium">Address to grant</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((grant, idx) => (
              <tr key={`${grant.tool}-${idx}`} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 align-top text-white/80">
                  {grant.url ? (
                    <a
                      href={grant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
                    >
                      {grant.tool}
                    </a>
                  ) : (
                    grant.tool
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <code className="break-all rounded bg-white/5 px-2 py-1 font-mono text-xs text-white/70">
                      {grant.address}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyAddress(idx, grant.address)}
                      className="shrink-0 text-white/40 hover:text-white/70"
                      title="Copy address"
                    >
                      {copiedIdx === idx ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-white/60">{grant.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-white/30">
        The long address ending in <span className="font-mono">.gserviceaccount.com</span> is a
        normal machine address — it&apos;s how your agent authenticates, and its access is
        read-only.
      </p>
    </div>
  );
}

function FieldBlock({
  field,
  responses,
  onChange,
  highlighted,
  registerRef,
}: {
  field: OnboardingField;
  responses: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  highlighted: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const value = responses[field.key];
  const inputId = `field-${field.key}`;

  return (
    <div
      ref={registerRef}
      className={`scroll-mt-24 rounded-lg transition-colors ${
        highlighted ? "ring-2 ring-rose-400/60" : ""
      }`}
    >
      {field.type === "checkbox" ? (
        <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
          <input
            id={inputId}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
          />
          <span className="text-sm text-white/80">
            {field.label} {field.required && <span className="text-rose-400">*</span>}
          </span>
        </label>
      ) : (
        <>
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-white/70">
            {field.label} {field.required && <span className="text-rose-400">*</span>}
          </label>
          {field.help && <p className="mb-1.5 text-xs text-white/40">{field.help}</p>}

          {field.type === "text" && (
            <input
              id={inputId}
              type="text"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}

          {field.type === "textarea" && (
            <textarea
              id={inputId}
              rows={3}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`${inputClass} resize-none`}
            />
          )}

          {field.type === "radio" && field.options && (
            <div className="space-y-2" role="radiogroup" aria-label={field.label}>
              {field.options.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`${inputId}-${opt.value}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.06]"
                >
                  <input
                    id={`${inputId}-${opt.value}`}
                    type="radio"
                    name={field.key}
                    checked={value === opt.value}
                    onChange={() => onChange(field.key, opt.value)}
                    className="h-4 w-4 shrink-0 accent-violet-500"
                  />
                  {opt.label}
                </label>
              ))}
              {field.detailWhen && value === field.detailWhen && (
                <input
                  type="text"
                  value={
                    typeof responses[`${field.key}_detail`] === "string"
                      ? (responses[`${field.key}_detail`] as string)
                      : ""
                  }
                  onChange={(e) => onChange(`${field.key}_detail`, e.target.value)}
                  placeholder={field.detailPlaceholder}
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OnboardingClient({ token }: { token: string }) {
  const [view, setView] = useState<OnboardingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [confirmation, setConfirmation] = useState<string>("");
  const [responses, setResponses] = useState<Record<string, string | boolean>>({});
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetch(`/api/onboarding/${token}`)
      .then(async (res) => {
        const data = await res.json();
        setView(data);
        if (data.responses) setResponses(data.responses);
      })
      .catch(() => setView({ status: "not_found" }))
      .finally(() => setLoading(false));
  }, [token]);

  function scrollToField(key: string) {
    const el = fieldRefs.current.get(key);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function updateResponse(key: string, value: string | boolean) {
    setResponses((prev) => ({ ...prev, [key]: value }));
    if (highlighted.has(key)) {
      setHighlighted((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleSubmit() {
    if (!view?.form) return;
    const validation = validateResponses(view.form, responses);
    if (!validation.ok) {
      setHighlighted(new Set(validation.missing));
      setError("Please fill in the required fields before submitting.");
      scrollToField(validation.missing[0]);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.missing) && data.missing.length > 0) {
          setHighlighted(new Set(data.missing));
          scrollToField(data.missing[0]);
        }
        throw new Error(data.error || "Submission failed");
      }
      setConfirmation(data.confirmation || "");
      setJustSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-[#030014] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            Triple <span className="text-violet-400">3</span> Labs
          </span>
          <span className="text-xs uppercase tracking-widest text-white/30">· onboarding</span>
        </div>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-24 text-white/50">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
      </div>
    );
  }

  if (justSubmitted) {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Thanks — you&apos;re all set</h1>
        <p className="text-white/60">{confirmation}</p>
      </div>
    );
  }

  if (!view || view.status === "not_found") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <XCircle className="mx-auto mb-4 text-rose-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Link not found</h1>
        <p className="text-white/60">
          This onboarding link is invalid. Please contact us for a new link.
        </p>
      </div>
    );
  }

  if (view.status === "submitted") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Already submitted</h1>
        <p className="text-white/60">
          {view.recipient_name ? `Thanks, ${view.recipient_name} — ` : "Thanks — "}
          this onboarding form{view.account_name ? ` for ${view.account_name}` : ""} has already
          been completed. If something changed, contact us and we&apos;ll get you a fresh link.
        </p>
      </div>
    );
  }

  if (view.status === "expired" || view.status === "cancelled") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <XCircle className="mx-auto mb-4 text-amber-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">
          {view.status === "expired" ? "Link expired" : "Request cancelled"}
        </h1>
        <p className="text-white/60">
          This onboarding link is no longer active. Please contact us to request a new one.
        </p>
      </div>
    );
  }

  // Active form view (pending / viewed)
  const form = view.form;
  if (!form) {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <XCircle className="mx-auto mb-4 text-rose-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
        <p className="text-white/60">This onboarding form could not be loaded. Please refresh.</p>
      </div>
    );
  }

  return shell(
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-xl font-semibold">{form.title}</h1>
        <p className="mt-2 text-sm text-white/50">{form.intro}</p>
        {(view.recipient_name || view.account_name || view.expires_at) && (
          <p className="mt-3 text-xs text-white/30">
            {view.recipient_name && `Prepared for ${view.recipient_name}`}
            {view.recipient_name && view.account_name && " · "}
            {view.account_name}
            {view.expires_at &&
              ` · link expires ${new Date(view.expires_at).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {form.sections.map((section, sIdx) => (
        <div key={sIdx} className="glass-card space-y-5 rounded-2xl p-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              {section.title}
            </h2>
            {section.blurb && <p className="mt-1 text-sm text-white/50">{section.blurb}</p>}
          </div>

          {section.showAccessGrants && view.access_grants && view.access_grants.length > 0 && (
            <AccessGrantsTable grants={view.access_grants} />
          )}

          <div className="space-y-5">
            {section.fields.map((field) => (
              <FieldBlock
                key={field.key}
                field={field}
                responses={responses}
                onChange={updateResponse}
                highlighted={
                  highlighted.has(field.key) ||
                  (!!field.detailWhen && highlighted.has(`${field.key}_detail`))
                }
                registerRef={(el) => {
                  const detailKey = field.detailWhen ? `${field.key}_detail` : null;
                  if (el) {
                    fieldRefs.current.set(field.key, el);
                    if (detailKey) fieldRefs.current.set(detailKey, el);
                  } else {
                    fieldRefs.current.delete(field.key);
                    if (detailKey) fieldRefs.current.delete(detailKey);
                  }
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300"
        >
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        aria-busy={submitting}
        className="w-full rounded-lg bg-gradient-to-r from-violet to-purple py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Submitting…
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
