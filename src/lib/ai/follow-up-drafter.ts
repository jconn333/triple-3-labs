import type { Contact, LeadScore } from "@/lib/crm/types";

const SYSTEM_PROMPT = `You are writing follow-up emails for Triple 3 Labs, an AI agency that builds custom AI agents (voice, chat, automations) for local businesses.

Write a personalized, professional follow-up email that:
- References their specific project or needs mentioned in their message
- Positions Triple 3 Labs as the right partner
- Suggests a concrete next step (discovery call, demo, etc.)
- Keeps it concise (3-4 paragraphs max)
- Tone: confident but friendly, not salesy
- Sign off as "Jeff" from Triple 3 Labs

Return ONLY valid JSON:
{"subject": "<email subject line>", "body": "<email body in plain text>"}`;

export async function draftFollowUpEmail(
  contact: Contact,
  leadScore?: LeadScore | null
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = {
    subject: `Following up — ${contact.company || "your AI project"}`,
    body: `Hi ${contact.first_name},\n\nThanks for reaching out to Triple 3 Labs. I'd love to learn more about your project and see how we can help.\n\nWould you be available for a quick discovery call this week?\n\nBest,\nJeff\nTriple 3 Labs`,
  };

  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Draft a follow-up email:\n\nName: ${contact.first_name} ${contact.last_name}\nCompany: ${contact.company || "N/A"}\nEmail: ${contact.email}\nProject: ${contact.project_type || "N/A"}\nBudget: ${contact.budget_range || "N/A"}\nMessage: ${contact.message || "None"}\n${leadScore ? `Score: ${leadScore.score}/100 (${leadScore.label}) — ${leadScore.reasoning}` : ""}`,
        }],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const result = await response.json();
    return JSON.parse(result.content[0]?.text || "");
  } catch {
    return fallback;
  }
}
