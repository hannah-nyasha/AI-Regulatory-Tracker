# AI-Regulatory-Tracker
What It Does
Every week (or on-demand), the agent:
Scans regulatory developments using Claude with live web search:
Generates a structured report with:Executive summary and risk snapshot, Breaking alerts (urgent developments in past 48 hours) Per-regulation development log
Company impact matrix (risk by regulation)
Compliance calendar
Reports are saved as both Markdown and HTML to `./reports/`.
---
Setup
Prerequisites
Node.js 18+
An Anthropic API key
Install
```bash
cd ai-reg-monitor
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```
Run a report now
```bash
npm start
# or
node src/agent.js
```
Run in research-only mode (console output, no file saved)
```bash
npm run research
# Research a single source:
node src/agent.js --mode=research --source=eu_ai_act
```
Preview what would run (no API calls)
```bash
node src/agent.js --dry-run
```
Verbose output
```bash
node src/agent.js --verbose
```
---
Scheduling (Weekly Reports)
Start the scheduler (runs every Monday at 7 AM ET by default):
```bash
npm run schedule
# or
node src/scheduler.js
```
Run immediately AND start the weekly schedule:
```bash
node src/scheduler.js --run-now
```
Custom schedule via environment variable:
```bash
CRON_SCHEDULE="0 9 * * MON" node src/scheduler.js
```
Cron expression reference:
```
┌───────── minute (0-59)
│ ┌───────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌───────── day of week (0-6, Sun=0)
│ │ │ │ │
0 7 * * 1   = Every Monday at 7:00 AM
0 9 * * 5   = Every Friday at 9:00 AM
0 8 1 * *   = First of every month at 8:00 AM
```
---
Configuration
All configuration lives in `src/config.js`:
Add a new regulatory source
```js
// In REGULATORY_SOURCES array
{
  id: "uk_ai_act",
  name: "UK AI Regulation",
  shortName: "UK AI",
  description: "UK AI regulatory framework post-Brexit",
  searchQueries: [
    "UK AI regulation 2025",
    "UK DSIT AI safety update",
  ],
  urls: ["https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach"],
  riskAreas: ["AI safety", "sector-specific rules", "voluntary commitments"],
}
```
```
---
Output Files
```
reports/
├── ai-reg-report-2025-01-27T07-00-00.md    # Timestamped Markdown
├── ai-reg-report-2025-01-27T07-00-00.html  # Timestamped HTML
├── latest.md                                # Latest report (overwritten weekly)
└── latest.html                              # Latest report (overwritten weekly)

logs/
└── scheduler.log                            # Scheduler run history
```
---
Architecture
```
src/
├── agent.js       CLI entry point and orchestration
├── config.js      Regulatory sources, report settings
├── researcher.js  Claude API calls with web_search for live research
├── reporter.js    Markdown and HTML report generation
└── scheduler.js   node-cron weekly scheduler
```
How the AI pipeline works
```
agent.js
   │
   ├── checkBreakingAlerts()
   │     └── Claude + web_search → JSON { alerts[] }
   │
   ├── researchRegulatorySource() [×4 sources]
   │     └── Claude + web_search → JSON { developments[], trend, topRisk }
   │
   │
   └── saveReport()
         └── generateMarkdownReport() + generateHtmlReport() → ./reports/
```
All Claude calls use `claude-sonnet-4-20250514` with structured JSON output and the `web_search_20250305` tool where live data is needed.
---
Claude Code Integration
This project is designed to run directly from Claude Code:
```bash
# In Claude Code, you can run:
> node src/agent.js --verbose
> node src/agent.js --dry-run
> node src/agent.js --mode=research --source=sec_ai_guidance
```
You can also ask Claude Code to modify `src/config.js` to add companies or sources, then re-run.
---
Disclaimer
Reports are generated automatically for informational purposes only and do not constitute legal or financial advice. Regulatory developments should be verified with qualified legal counsel before taking compliance action.
