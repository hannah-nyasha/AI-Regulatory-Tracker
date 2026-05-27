import Anthropic from "@anthropic-ai/sdk";
import { REGULATORY_SOURCES, AUDIT_PERSPECTIVES } from "./config.js";

const client = new Anthropic();

/**
 * Researches recent developments for a single regulatory/governance source.
 * Each development gets a plain-language article summary FIRST,
 * then separate audit-relevance analysis for AI auditors and internal auditors.
 */
export async function researchRegulatorySource(source, options = {}) {
  const { verbose = false, weeksBack = 2 } = options;

  if (verbose) {
    console.log(`  Researching ${source.name}...`);
  }

  const systemPrompt = `You are a regulatory intelligence analyst specializing in AI governance, audit, and compliance.
Your job is to find real, recent developments and return structured JSON.

CRITICAL INSTRUCTION: For each development found, you MUST include:
1. "articleSummary" — a plain-language 2-3 sentence summary of what the article or document actually says.
   Write this as if explaining to a colleague who hasn't read it. Stick to facts from the source.
2. "aiAuditorRelevance" — specific implications for AI auditors (conformity assessors, algorithmic auditors)
3. "internalAuditorRelevance" — specific implications for internal audit functions

Return ONLY valid JSON, no markdown fencing or preamble.

Schema:
{
  "source": "<source id>",
  "developments": [
    {
      "title": "Concise headline",
      "date": "YYYY-MM-DD or 'recent'",
      "publisher": "Who published this (e.g. European Commission, NIST, SEC)",
      "articleSummary": "Plain-language 2-3 sentence summary of what the article/document says",
      "type": "enforcement | guidance | rulemaking | standard | report | proposal | amendment",
      "urgency": "critical | high | medium | low",
      "aiAuditorRelevance": "Specific implications for AI auditors and conformity assessors",
      "internalAuditorRelevance": "Specific implications for in-house internal audit functions",
      "keyAuditQuestions": [
        "Question auditors should now be asking or testing"
      ],
      "controlImplications": [
        "Specific control, test, or procedure that may need to be added or updated"
      ],
      "affectedAreas": ["list of affected audit or governance areas"],
      "sourceUrl": "URL if found, else null",
      "effectiveDate": "YYYY-MM-DD or null",
      "deadline": "YYYY-MM-DD or description of key deadline, or null"
    }
  ],
  "overallTrend": "One sentence on the directional trend in this area for auditors",
  "topAuditRisk": "The single most urgent audit or compliance risk from this framework right now"
}`;

  const userPrompt = `Search for the latest regulatory and governance developments in ${source.name}.
Description: ${source.description}

Focus on news and publications from the past ${weeksBack} weeks. Search for:
${source.searchQueries.map((q) => `- "${q}"`).join("\n")}

Key audit areas to flag: ${source.auditRelevance.join(", ")}

Look for:
1. New regulations, rules, or standards that have been finalized or proposed
2. Enforcement actions, investigations, or fines
3. Guidance documents, technical specifications, or implementation notes
4. Compliance deadline announcements or changes
5. Court rulings, appeals, or legal interpretations
6. New audit methodologies, certification schemes, or assurance frameworks

For EVERY development found, write a clear plain-language article summary first, then assess audit relevance.
Return structured JSON only.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    const rawText = textBlocks.map((b) => b.text).join("");

    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`  Error researching ${source.name}: ${err.message}`);
    return {
      source: source.id,
      developments: [],
      overallTrend: "Research unavailable due to error.",
      topAuditRisk: "Unable to assess at this time.",
      error: err.message,
    };
  }
}

/**
 * Takes all research findings and produces a consolidated analysis of what
 * they mean for each audit function — AI auditors, internal auditors,
 * and compliance/risk officers.
 */
export async function analyzeAuditorImpacts(allFindings, options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log("  Analyzing audit function implications...");
  }

  const developmentsSummary = allFindings
    .flatMap((f) => f.developments || [])
    .map(
      (d) =>
        `[${d.urgency?.toUpperCase() || "UPDATE"}] ${d.title} (${d.publisher || "unknown"}): ${d.articleSummary}`
    )
    .join("\n");

  if (!developmentsSummary.trim()) {
    return AUDIT_PERSPECTIVES.map((p) => ({
      perspectiveId: p.id,
      name: p.name,
      overallUrgency: "monitoring",
      summary: "No significant developments this period.",
      priorityActions: [],
      auditPlanUpdates: [],
      newRisksToAdd: [],
      methodologyChanges: [],
    }));
  }

  const systemPrompt = `You are a senior AI governance and audit specialist.
Given a set of regulatory developments, produce a consolidated action-oriented brief
for each audit function. Return ONLY valid JSON, no markdown fencing.

Schema:
[
  {
    "perspectiveId": "ai_auditor | internal_auditor | compliance_officer",
    "name": "Display name of this function",
    "overallUrgency": "critical | high | medium | low",
    "urgencyRationale": "1-2 sentences on why this urgency level this week",
    "summary": "2-3 sentence overview of what this week's developments mean for this function",
    "priorityActions": [
      {
        "action": "Specific action to take",
        "regulation": "Which regulation/framework drives this",
        "urgency": "immediate | this-quarter | next-cycle",
        "effort": "low | medium | high"
      }
    ],
    "auditPlanUpdates": [
      "Specific audit universe or plan change to consider"
    ],
    "newRisksToAdd": [
      "New risk that should be added to the AI risk register or audit scope"
    ],
    "methodologyChanges": [
      "Change to audit approach, testing procedure, or evidence requirements"
    ],
    "questionsForManagement": [
      "Question this function should be posing to management or the board"
    ]
  }
]`;

  const perspectivesContext = AUDIT_PERSPECTIVES.map(
    (p) =>
      `${p.id} (${p.name}): ${p.description}. Key workstreams: ${p.workstreams.join(", ")}.`
  ).join("\n");

  const userPrompt = `Analyze what this week's AI regulatory and governance developments mean for each of these audit functions.

AUDIT FUNCTIONS:
${perspectivesContext}

THIS WEEK'S DEVELOPMENTS:
${developmentsSummary}

For each audit function, be specific and action-oriented. Prioritize developments that require a change in behavior, methodology, or scope. 
Return the JSON array for all ${AUDIT_PERSPECTIVES.length} functions.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`  Error analyzing auditor impacts: ${err.message}`);
    return AUDIT_PERSPECTIVES.map((p) => ({
      perspectiveId: p.id,
      name: p.name,
      overallUrgency: "monitoring",
      urgencyRationale: "Analysis unavailable.",
      summary: "Analysis unavailable due to error.",
      priorityActions: [],
      auditPlanUpdates: [],
      newRisksToAdd: [],
      methodologyChanges: [],
      questionsForManagement: [],
    }));
  }
}

/**
 * Checks for breaking AI regulatory news in the past 48 hours
 * that auditors and compliance teams should know about immediately.
 */
export async function checkBreakingAlerts(options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log("  Checking for breaking AI governance alerts...");
  }

  const systemPrompt = `You are a regulatory alert system for AI auditors and compliance professionals.
Return ONLY valid JSON.

Schema:
{
  "alerts": [
    {
      "headline": "Short alert headline",
      "severity": "critical | high",
      "regulation": "Which regulatory body or framework",
      "articleSummary": "What the source article or announcement actually says (2-3 sentences)",
      "auditImplication": "Why auditors and compliance teams need to act on this now",
      "immediateAction": "The single most important thing to do right now",
      "sourceUrl": "URL or null"
    }
  ],
  "alertCount": 0
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Search for any breaking or urgent AI regulatory or governance news in the past 48 hours relevant to AI auditors and internal audit functions. Look for: enforcement actions with AI components, new binding regulations taking effect, court rulings on AI liability, major guidance releases from EU, NIST, SEC, FCA, ICO, or state regulators. Return only developments that are genuinely urgent (severity: critical or high). For each alert, summarize what the article says before assessing audit implications. If nothing urgent, return an empty alerts array.",
        },
      ],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    return { alerts: [], alertCount: 0, error: err.message };
  }
}
