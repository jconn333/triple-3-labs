import type { OnboardingFormSpec } from "@/lib/onboarding/forms";
import { allFields } from "@/lib/onboarding/forms";

export const DEFAULT_EXPIRY_DAYS = 30;

/** Computes an ISO expires_at timestamp `days` from now (defaults to DEFAULT_EXPIRY_DAYS). */
export function computeExpiresAt(days: number = DEFAULT_EXPIRY_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export type ValidateResponsesResult = { ok: true } | { ok: false; missing: string[] };

/**
 * Required fields must be present and non-empty (for checkbox, `required` means
 * must be `true`). A radio field with `detailWhen` also requires
 * `${key}_detail` to be non-empty when that option is selected, regardless of
 * whether the field itself is required.
 */
export function validateResponses(
  spec: OnboardingFormSpec,
  responses: Record<string, string | boolean>
): ValidateResponsesResult {
  const missing: string[] = [];

  for (const field of allFields(spec)) {
    const value = responses[field.key];

    if (field.required) {
      if (field.type === "checkbox") {
        if (value !== true) missing.push(field.key);
      } else {
        if (typeof value !== "string" || value.trim() === "") missing.push(field.key);
      }
    }

    if (field.type === "radio" && field.detailWhen && value === field.detailWhen) {
      const detailKey = `${field.key}_detail`;
      const detailValue = responses[detailKey];
      if (typeof detailValue !== "string" || detailValue.trim() === "") {
        missing.push(detailKey);
      }
    }
  }

  return missing.length > 0 ? { ok: false, missing } : { ok: true };
}
