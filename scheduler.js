#!/usr/bin/env node
/**
 * AI Regulatory Monitor Scheduler
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs the regulatory report on a weekly schedule using node-cron.
 * Default schedule: every Monday at 7:00 AM (configurable via env vars).
 *
 * Usage:
 *   node src/scheduler.js                  # Start with default schedule
 *   CRON_SCHEDULE="0 9 * * MON" node src/scheduler.js  # Custom schedule
 *   node src/scheduler.js --run-now        # Run once immediately, then schedule
 */

import cron from "node-cron";
import { execSync, spawn } from "child_process";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 7 * * 1"; // Monday 7 AM
const LOG_DIR = "./logs";
const LOG_FILE = join(LOG_DIR, "scheduler.log");

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function logEntry(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  appendFileSync(LOG_FILE, line);
}

function runReport() {
  logEntry("Triggering weekly AI regulatory report...");

  const child = spawn("node", ["src/agent.js", "--verbose"], {
    stdio: "pipe",
    shell: false,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (data) => {
    stdout += data.toString();
    process.stdout.write(data);
  });

  child.stderr.on("data", (data) => {
    stderr += data.toString();
    process.stderr.write(data);
  });

  child.on("close", (code) => {
    if (code === 0) {
      logEntry(`Report completed successfully.`);
    } else {
      logEntry(`Report failed with exit code ${code}. stderr: ${stderr.slice(0, 500)}`);
    }
  });
}

// ─── Parse flags ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const runNow = args.includes("--run-now");

// ─── Start Scheduler ─────────────────────────────────────────────────────────

logEntry(`AI Regulatory Monitor Scheduler started.`);
logEntry(`Schedule: "${CRON_SCHEDULE}" (cron expression)`);
logEntry(`Logs: ${LOG_FILE}`);

// Validate the cron expression
if (!cron.validate(CRON_SCHEDULE)) {
  console.error(`Invalid cron expression: "${CRON_SCHEDULE}"`);
  console.error("Example valid expressions:");
  console.error("  '0 7 * * 1'   = Every Monday at 7 AM");
  console.error("  '0 9 * * MON' = Every Monday at 9 AM");
  console.error("  '0 0 * * 0'   = Every Sunday at midnight");
  process.exit(1);
}

if (runNow) {
  logEntry("--run-now flag detected. Running report immediately.");
  runReport();
}

const task = cron.schedule(
  CRON_SCHEDULE,
  () => {
    logEntry("Cron trigger fired.");
    runReport();
  },
  {
    timezone: "America/New_York",
  }
);

logEntry("Scheduler running. Press Ctrl+C to stop.");

process.on("SIGINT", () => {
  logEntry("Scheduler stopped by user.");
  task.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logEntry("Scheduler stopped (SIGTERM).");
  task.stop();
  process.exit(0);
});
