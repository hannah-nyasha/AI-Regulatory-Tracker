#!/usr/bin/env node
/**
 * AI Regulatory & Governance Monitor — Audit Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Monitors AI regulatory and governance developments across 7 frameworks:
 * EU AI Act, NIST AI RMF, SEC AI Governance, ISO/IEC 42001,
 * UK AI Governance (DSIT/FCA/ICO), US State AI Laws, OECD/G7.
 *
 * Generates a weekly report written for:
 *   - AI auditors (conformity assessors, algorithmic auditors)
 *   - Internal auditors (in-house audit functions)
 *   - Compliance & risk officers
 *
 * Each development opens with a plain-language article summary, followed by
 * specific audit implications, key questions, and control implications.
 *
 * Usage:
 *   node src/agent.js                  Full report (default)
 *   node src/agent.js --mode=research  Research only, log to console
 *   node src/agent.js --dry-run        Show config, no API calls
 *   node src/agent.js --verbose        Detailed logging
 *   node src/agent.js --source=eu_ai_act  Single source
 */

import { REGULATORY_SOURCES, AUDIT_PERSPECTIVES, REPORT_CONFIG } from "./config.js";
import { researchRegulatorySource, analyzeAuditorImpacts, checkBreakingAlerts } from "./researcher.js";
import { saveReport, generateMarkdownReport } from "./reporter.js";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const mode        = args.find((a) => a.startsWith("--mode="))?.split("=")[1] || "report";
const verbose     = args.includes("--verbose") || args.includes("-v");
const dryRun      = args.includes("--dry-run");
const sourceFilter = args.find((a) => a.startsWith("--source="))?.split("=")[1];

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(msg, level = "info") {
  const icons = { info: "ℹ", success: "✓", warn: "⚠", error: "✗", step: "→" };
  console.log(`${icons[level] || "•"} ${msg}`);
}

function logHeader(title) {
  const line = "─".repeat(60);
  console.log(`\n${line}\n  ${title}\n${line}\n`);
}

// ─── Dry Run ──────────────────────────────────────────────────────────────────

function runDryRun() {
  logHeader("AI Regulatory Monitor (Audit Edition) — Dry Run");

  log("Regulatory & governance sources to be researched:", "info");
  for (const s of REGULATORY_SOURCES) {
    log(`  ${s.name} (${s.searchQueries.length} search queries)`, "step");
  }

  log("\nAudit functions to be analyzed:", "info");
  for (const p of AUDIT_PERSPECTIVES) {
    log(`  ${p.name} — ${p.description}`, "step");
  }

  log("\nReport sections:", "info");
  for (const s of REPORT_CONFIG.sections) log(`  ${s}`, "step");

  log("\nOutput directory: " + REPORT_CONFIG.outputDir, "info");
  log("No API calls made in dry-run mode.", "warn");
}

// ─── Research Mode ────────────────────────────────────────────────────────────

async function runResearchMode() {
  logHeader("AI Regulatory Monitor — Research Mode");

  const sources = sourceFilter
    ? REGULATORY_SOURCES.filter(
        (s) => s.id === sourceFilter || s.shortName.toLowerCase() === sourceFilter.toLowerCase()
      )
    : REGULATORY_SOURCES;

  if (sources.length === 0) {
    log(`No source found matching: ${sourceFilter}`, "error");
    process.exit(1);
  }

  for (const source of sources) {
    log(`\nResearching: ${source.name}`, "step");
    const findings = await researchRegulatorySource(source, { verbose });

    console.log(`\n${"─".repeat(40)}`);
    console.log(`${source.name} — ${findings.developments?.length || 0} developments`);
    console.log(`Trend: ${findings.overallTrend}`);
    console.log(`Top audit risk: ${findings.topAuditRisk}`);

    for (const dev of findings.developments || []) {
      console.log(`\n  [${dev.urgency?.toUpperCase()}] ${dev.title}`);
      console.log(`  ARTICLE SUMMARY: ${dev.articleSummary}`);
      console.log(`  AI auditors: ${dev.aiAuditorRelevance}`);
      console.log(`  Internal auditors: ${dev.internalAuditorRelevance}`);
      if (dev.sourceUrl) console.log(`  Source: ${dev.sourceUrl}`);
    }
  }
}

// ─── Full Report Mode ─────────────────────────────────────────────────────────

async function runReportMode() {
  logHeader("AI Regulatory Monitor (Audit Edition) — Weekly Report");

  const startTime = Date.now();

  // Step 1: Breaking alerts
  log("Step 1/4 — Checking for breaking regulatory alerts...", "step");
  const breakingAlerts = await checkBreakingAlerts({ verbose });
  if ((breakingAlerts.alertCount || breakingAlerts.alerts?.length) > 0) {
    log(`Found ${breakingAlerts.alerts.length} breaking alert(s).`, "warn");
  } else {
    log("No breaking alerts.", "success");
  }

  // Step 2: Research sources
  log("Step 2/4 — Researching regulatory and governance sources...", "step");
  const allFindings = [];

  const sources = sourceFilter
    ? REGULATORY_SOURCES.filter((s) => s.id === sourceFilter)
    : REGULATORY_SOURCES;

  for (const source of sources) {
    log(`  Researching ${source.name}...`, "step");
    const findings = await researchRegulatorySource(source, { verbose });
    allFindings.push(findings);
    log(
      `  ${findings.developments?.length || 0} developments. Trend: ${findings.overallTrend?.slice(0, 75) || "n/a"}...`,
      "success"
    );
  }

  // Step 3: Analyze audit implications
  log("Step 3/4 — Analyzing audit function implications...", "step");
  const auditorImpacts = await analyzeAuditorImpacts(allFindings, { verbose });
  log(`Analyzed ${auditorImpacts.length} audit function perspectives.`, "success");

  // Step 4: Save
  log("Step 4/4 — Generating and saving report...", "step");

  const reportData = {
    allFindings,
    auditorImpacts,
    breakingAlerts,
    generatedAt: new Date().toISOString(),
    metadata: {
      sourcesResearched: sources.map((s) => s.name),
      perspectivesAnalyzed: AUDIT_PERSPECTIVES.map((p) => p.name),
      totalDevelopments: allFindings.reduce((n, f) => n + (f.developments?.length || 0), 0),
      durationMs: Date.now() - startTime,
    },
  };

  const { mdPath, htmlPath } = saveReport(reportData);
  log(`Report saved:\n  Markdown: ${mdPath}\n  HTML: ${htmlPath}`, "success");

  // Summary
  logHeader("Report Summary");

  for (const impact of auditorImpacts) {
    const icon = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" }[impact.overallUrgency] || "🔵";
    log(`${icon} ${impact.name}: ${impact.overallUrgency?.toUpperCase()} — ${impact.urgencyRationale || ""}`, "info");
  }

  log(`Total developments tracked: ${reportData.metadata.totalDevelopments}`, "info");
  log(`Completed in ${Math.round(reportData.metadata.durationMs / 1000)}s`, "info");

  if (verbose) {
    console.log("\nReport preview (first 2000 chars):\n");
    console.log(generateMarkdownReport(reportData).slice(0, 2000) + "\n...[truncated]");
  }

  return reportData;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  if (dryRun) { runDryRun(); return; }

  try {
    if (mode === "research") {
      await runResearchMode();
    } else {
      await runReportMode();
    }
  } catch (err) {
    log(`Fatal error: ${err.message}`, "error");
    if (verbose) console.error(err.stack);
    process.exit(1);
  }
}

main();
