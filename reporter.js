import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { REPORT_CONFIG, REGULATORY_SOURCES } from "./config.js";

function getWeekLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `Week ${weekNum}, ${year}`;
}

function urgencyBadge(level) {
  const map = {
    critical: "🔴 CRITICAL",
    high:     "🟠 HIGH",
    medium:   "🟡 MEDIUM",
    low:      "🟢 LOW",
  };
  return map[level] || "⚪ UNKNOWN";
}

function urgencyIcon(level) {
  return { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[level] || "⚪";
}

function effortBadge(level) {
  return { low: "⬜ Low effort", medium: "🟧 Medium effort", high: "🟥 High effort" }[level] || "";
}

function horizonBadge(h) {
  return {
    "immediate":    "⚡ Immediate",
    "this-quarter": "📅 This quarter",
    "next-cycle":   "📆 Next cycle",
  }[h] || h || "TBD";
}

// ─── Markdown Report ──────────────────────────────────────────────────────────

export function generateMarkdownReport(data) {
  const { allFindings, auditorImpacts, breakingAlerts, generatedAt } = data;
  const dateStr = new Date(generatedAt).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const lines = [];

  // Header
  lines.push(`# ${REPORT_CONFIG.title}`);
  lines.push(`_${REPORT_CONFIG.subtitle}_`);
  lines.push("");
  lines.push(`**${getWeekLabel()} | Generated ${dateStr}**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Breaking Alerts
  const alerts = breakingAlerts?.alerts || [];
  if (alerts.length > 0) {
    lines.push("## ⚠️ Breaking Alerts");
    lines.push("");
    for (const alert of alerts) {
      const icon = alert.severity === "critical" ? "🔴" : "🟠";
      lines.push(`### ${icon} ${alert.headline}`);
      lines.push(`**Framework:** ${alert.regulation}`);
      lines.push("");
      lines.push(`**What it says:** ${alert.articleSummary}`);
      lines.push("");
      lines.push(`**Why auditors need to act:** ${alert.auditImplication}`);
      lines.push("");
      lines.push(`**Immediate action:** ${alert.immediateAction}`);
      if (alert.sourceUrl) lines.push(`**Source:** [Read article](${alert.sourceUrl})`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");

  const totalDevs = allFindings.reduce((n, f) => n + (f.developments?.length || 0), 0);
  const criticalCount = (auditorImpacts || []).filter((a) => a.overallUrgency === "critical").length;
  const highCount     = (auditorImpacts || []).filter((a) => a.overallUrgency === "high").length;

  lines.push(
    `This report covers **${totalDevs} regulatory and governance developments** across ${allFindings.length} monitored frameworks, analyzed through the lens of AI audit, internal audit, and compliance functions.`
  );
  lines.push("");

  const topUrgent = (auditorImpacts || [])
    .filter((a) => ["critical", "high"].includes(a.overallUrgency));
  if (topUrgent.length > 0) {
    lines.push("**Urgency by audit function this week:**");
    for (const a of auditorImpacts || []) {
      lines.push(`- ${urgencyBadge(a.overallUrgency)} **${a.name}:** ${a.urgencyRationale || a.summary}`);
    }
    lines.push("");
  }

  lines.push("**Directional trends this week:**");
  lines.push("");
  for (const finding of allFindings) {
    if (finding.overallTrend && !finding.error) {
      const src = REGULATORY_SOURCES.find((s) => s.id === finding.source);
      lines.push(`- **${src?.shortName || finding.source}:** ${finding.overallTrend}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Regulatory Developments (with article summaries first)
  lines.push("## Regulatory & Governance Developments");
  lines.push("");
  lines.push(
    "_Each item below opens with a plain-language summary of what the source article or document says, followed by specific audit implications._"
  );
  lines.push("");

  for (const finding of allFindings) {
    const src = REGULATORY_SOURCES.find((s) => s.id === finding.source);
    if (!src) continue;

    lines.push(`### ${src.name}`);
    lines.push("");

    if (finding.error) {
      lines.push(`_Research error: ${finding.error}_`);
      lines.push("");
      continue;
    }

    if (finding.topAuditRisk) {
      lines.push(`> **Top audit risk this week:** ${finding.topAuditRisk}`);
      lines.push("");
    }

    const devs = finding.developments || [];
    if (devs.length === 0) {
      lines.push("_No significant developments identified this period._");
      lines.push("");
      continue;
    }

    for (const dev of devs) {
      // Development header
      lines.push(`#### ${urgencyIcon(dev.urgency)} ${dev.title}`);
      lines.push(
        `**Type:** ${dev.type || "update"} | **Publisher:** ${dev.publisher || src.name} | **Date:** ${dev.date || "Recent"}${dev.deadline ? ` | **Deadline:** ${dev.deadline}` : ""}${dev.effectiveDate ? ` | **Effective:** ${dev.effectiveDate}` : ""}`
      );
      lines.push("");

      // Article summary — always comes first
      lines.push(`**What this says:** ${dev.articleSummary || "_Summary unavailable._"}`);
      lines.push("");

      // Audit relevance
      if (dev.aiAuditorRelevance) {
        lines.push(`**For AI auditors:** ${dev.aiAuditorRelevance}`);
        lines.push("");
      }
      if (dev.internalAuditorRelevance) {
        lines.push(`**For internal auditors:** ${dev.internalAuditorRelevance}`);
        lines.push("");
      }

      // Key audit questions
      if (dev.keyAuditQuestions?.length) {
        lines.push("**Key audit questions this raises:**");
        for (const q of dev.keyAuditQuestions) lines.push(`- ${q}`);
        lines.push("");
      }

      // Control implications
      if (dev.controlImplications?.length) {
        lines.push("**Control and procedure implications:**");
        for (const c of dev.controlImplications) lines.push(`- ${c}`);
        lines.push("");
      }

      if (dev.affectedAreas?.length) {
        lines.push(`**Affected audit areas:** ${dev.affectedAreas.join(", ")}`);
      }
      if (dev.sourceUrl) lines.push(`**Source:** [Read article](${dev.sourceUrl})`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");

  // Audit Function Implications
  lines.push("## Audit Function Implications");
  lines.push("");
  lines.push(
    "_Consolidated action briefs for each function based on this week's developments._"
  );
  lines.push("");

  const sortOrder = ["critical", "high", "medium", "low", "monitoring"];
  const sortedImpacts = [...(auditorImpacts || [])].sort(
    (a, b) => sortOrder.indexOf(a.overallUrgency) - sortOrder.indexOf(b.overallUrgency)
  );

  for (const impact of sortedImpacts) {
    lines.push(`### ${urgencyBadge(impact.overallUrgency)} ${impact.name}`);
    lines.push("");
    lines.push(impact.summary || "");
    lines.push("");

    // Priority actions table-style
    if (impact.priorityActions?.length) {
      lines.push("**Priority actions:**");
      lines.push("");
      for (const action of impact.priorityActions) {
        lines.push(
          `- ${horizonBadge(action.urgency)} ${effortBadge(action.effort)} — **${action.action}** _(${action.regulation})_`
        );
      }
      lines.push("");
    }

    if (impact.auditPlanUpdates?.length) {
      lines.push("**Audit plan / universe updates to consider:**");
      for (const u of impact.auditPlanUpdates) lines.push(`- ${u}`);
      lines.push("");
    }

    if (impact.newRisksToAdd?.length) {
      lines.push("**New risks to add to the AI risk register:**");
      for (const r of impact.newRisksToAdd) lines.push(`- ${r}`);
      lines.push("");
    }

    if (impact.methodologyChanges?.length) {
      lines.push("**Methodology and evidence changes:**");
      for (const m of impact.methodologyChanges) lines.push(`- ${m}`);
      lines.push("");
    }

    if (impact.questionsForManagement?.length) {
      lines.push("**Questions to raise with management / board:**");
      for (const q of impact.questionsForManagement) lines.push(`- ${q}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");

  // Compliance Calendar — extract all deadlines
  const allDeadlines = allFindings
    .flatMap((f) => f.developments || [])
    .filter((d) => d.deadline || d.effectiveDate)
    .sort((a, b) => {
      const da = a.deadline || a.effectiveDate || "9999";
      const db = b.deadline || b.effectiveDate || "9999";
      return da.localeCompare(db);
    });

  if (allDeadlines.length > 0) {
    lines.push("## Compliance Calendar");
    lines.push("");
    lines.push("| Date | Framework | Development | Type |");
    lines.push("|------|-----------|-------------|------|");
    for (const d of allDeadlines) {
      const src = REGULATORY_SOURCES.find((s) => s.id === d._sourceId);
      const dateVal = d.deadline || d.effectiveDate || "TBD";
      lines.push(`| ${dateVal} | — | ${d.title} | ${d.type || "—"} |`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Footer
  lines.push("## Disclaimer");
  lines.push("");
  lines.push(
    "_This report is generated automatically using AI-powered regulatory intelligence and is intended for informational purposes only. It does not constitute legal, compliance, or professional audit advice. Regulatory developments should be verified against primary sources and reviewed with qualified legal and compliance counsel before acting. Data is sourced from publicly available regulatory publications, official body websites, and news sources._"
  );
  lines.push("");
  lines.push(`_${REPORT_CONFIG.title} | ${new Date(generatedAt).toISOString()}_`);

  return lines.join("\n");
}

// ─── HTML Report ──────────────────────────────────────────────────────────────

export function generateHtmlReport(markdownContent, data) {
  const { generatedAt } = data;
  const dateStr = new Date(generatedAt).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const processed = markdownContent
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .split("\n")
    .map((line) => {
      if (
        line.startsWith("<h") || line.startsWith("<li") ||
        line.startsWith("<hr") || line.startsWith("<block") || line === ""
      ) return line;
      return `<p>${line}</p>`;
    })
    .join("\n")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${REPORT_CONFIG.title} — ${dateStr}</title>
  <style>
    :root {
      --bg:           #0b0f14;
      --surface:      #141a22;
      --surface2:     #1c2530;
      --border:       #263040;
      --text:         #dce7f0;
      --text-muted:   #7a8fa3;
      --accent:       #4fa8e8;
      --accent-dim:   #2a5a80;
      --critical:     #e85555;
      --high:         #e8933a;
      --medium:       #d4ad2c;
      --low:          #3db870;
      --article-bg:   #111820;
      --article-border: #2a4060;
      --font: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 15px;
      line-height: 1.75;
      padding: 2.5rem 2rem;
      max-width: 1060px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.4px;
      color: var(--accent);
      margin-bottom: 0.1rem;
    }
    h1 + em { color: var(--text-muted); font-size: 0.95rem; font-style: normal; display: block; margin-bottom: 0.4rem; }
    h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
      margin: 2.4rem 0 1rem;
    }
    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 1.8rem 0 0.5rem;
      color: #c5d8ea;
    }
    h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 1.4rem 0 0.3rem;
      color: #a0bcd4;
    }
    p { margin: 0.45rem 0; color: var(--text-muted); }
    strong { color: var(--text); font-weight: 600; }
    em { color: var(--text-muted); font-style: italic; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Article summary callout box */
    p:has(> strong:first-child) {
      background: var(--article-bg);
      border-left: 3px solid var(--article-border);
      padding: 0.6rem 0.9rem;
      border-radius: 0 6px 6px 0;
      margin: 0.6rem 0;
      color: var(--text);
    }
    blockquote {
      border-left: 3px solid var(--accent-dim);
      padding: 0.5rem 1rem;
      background: var(--surface);
      border-radius: 0 6px 6px 0;
      margin: 1rem 0;
      color: var(--text);
      font-size: 0.95rem;
    }
    ul { padding-left: 1.4rem; margin: 0.4rem 0; }
    li { margin: 0.3rem 0; color: var(--text-muted); }
    li strong { color: var(--text); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.875rem;
      background: var(--surface);
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: var(--surface2);
      padding: 0.6rem 0.9rem;
      text-align: left;
      font-weight: 600;
      color: var(--text);
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.55rem 0.9rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    .meta { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }

    /* Dev card wrapper */
    h4 + p { margin-top: 0.3rem; font-size: 0.82rem; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="meta">${REPORT_CONFIG.title} | ${getWeekLabel()}</div>
  ${processed}
  <script>
    document.querySelectorAll('p').forEach(p => {
      if (p.textContent.trim().startsWith('|')) p.style.display = 'none';
    });
  </script>
</body>
</html>`;
}

// ─── Save Report ──────────────────────────────────────────────────────────────

export function saveReport(data) {
  const { generatedAt } = data;
  const outputDir = REPORT_CONFIG.outputDir;

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date(generatedAt).toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const mdContent   = generateMarkdownReport(data);
  const mdPath      = join(outputDir, `ai-audit-report-${timestamp}.md`);
  writeFileSync(mdPath, mdContent, "utf8");

  const htmlContent = generateHtmlReport(mdContent, data);
  const htmlPath    = join(outputDir, `ai-audit-report-${timestamp}.html`);
  writeFileSync(htmlPath, htmlContent, "utf8");

  writeFileSync(join(outputDir, "latest.md"),   mdContent,   "utf8");
  writeFileSync(join(outputDir, "latest.html"), htmlContent, "utf8");

  return { mdPath, htmlPath };
}
