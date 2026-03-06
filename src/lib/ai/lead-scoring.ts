import type { ContactFormData, LeadScore } from "@/lib/crm/types";

const SYSTEM_PROMPT = `You are a lead scoring AI for Triple 3 Labs, an AI agency that designs, builds, and deploys custom AI agents (voice, chat, automations) for local businesses.

Score this lead from 1-100 based on:
- Budget fit (we target $5k-$50k+ projects, higher budget = higher score)
- Project specificity (vague "I want AI" scores low, specific use cases like "I need a voice agent for my hotel front desk" score high)
- Business email vs personal email (business domain = higher)
- Urgency signals in the message (deadlines, growth pain, competitive pressure)
- Company/industry fit (hospitality, healthcare, real estate, professional services are ideal)
- Message quality (detailed, thoughtful messages indicate serious buyers)

Return ONLY valid JSON with this exact structure:
{"score": <number 1-100>, "label": "<hot|warm|cold>", "reasoning": "<2-3 sentence explanation>"}

Score thresholds: hot = 70+, warm = 40-69, cold = below 40`;

export async function scoreLeadWithAI(data: ContactFormData): Promise<LeadScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackScoring(data);

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
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Score this lead:\n\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || "Not provided"}\nProject Type: ${data.projectType}\nBudget: ${data.budget || "Not specified"}\nMessage: ${data.message}`,
        }],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!response.ok) return fallbackScoring(data);

    const result = await response.json();
    const parsed = JSON.parse(result.content[0]?.text || "");
    return {
      score: Math.min(100, Math.max(1, parsed.score)),
      label: parsed.label,
      reasoning: parsed.reasoning,
    };
  } catch {
    return fallbackScoring(data);
  }
}

function fallbackScoring(data: ContactFormData): LeadScore {
  let score = 30;
  if (data.budget === "50k-plus") score += 30;
  else if (data.budget === "15k-50k") score += 25;
  else if (data.budget === "5k-15k") score += 15;
  else if (data.budget === "under-5k") score += 5;

  const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  const emailDomain = data.email.split("@")[1]?.toLowerCase();
  if (emailDomain && !personalDomains.includes(emailDomain)) score += 10;
  if (data.projectType === "ai-agent") score += 10;
  else if (data.projectType === "automation") score += 8;
  if (data.message.length > 200) score += 10;
  else if (data.message.length > 100) score += 5;
  if (data.company) score += 5;

  score = Math.min(100, score);
  const label = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  return { score, label, reasoning: `Fallback scoring: Budget=${data.budget || "unspecified"}, ProjectType=${data.projectType}. AI scoring unavailable.` };
}
