---
name: status
description: Prints a one-screen summary of where everything stands — each system's progress and status, what is blocked, and the questions still waiting on the owner. Use any time someone asks how things are going.
---

Read the whole `tracking\` set and print one screen the owner can scan in thirty seconds.
This is read-only: **do not edit anything.**

## What to read

- `tracking\DASHBOARD.md`
- `tracking\projects\*.md` — all ten: `blc-sms`, `cac-iis`, `mis`, `mart-online-store`,
  `queuing-system`, `sms-blast`, `ppd-directory`, `rms`, `fms`, `cms`
- `tracking\infosec\*.md` — phishing, training, incidents, vulnerability, policies
- `tracking\support-network\*.md` — support and network logs
- `tracking\team\*.md` — meetings and events, structure and staffing
- `tracking\targets\*.md` — the Balanced Scorecard and the 16 deliverables

Use `parseProject()` from `tools\lib\tracking.js` for the project files rather than
re-parsing the Markdown by hand:

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { parseProject } from './tools/lib/tracking.js';
const p = parseProject(readFileSync('tracking/projects/mis.md', 'utf8'));
console.log(p.name, p.status, p.progress, p.blockers, p.log[0]);
"
```

**Never read `private\`.** Nothing from it belongs in a status summary.

## What to print

Keep it to one screen. Plain words, no jargon, no emoji. A dash (—) means nothing has been
recorded yet; print the dash, never a zero, and never a guess.

**1. Systems** — one line each, all ten:

```
BLC School Management System      65%   In Progress   waiting on Accounting for the fee schedule
Membership Information System     —     In Progress
RMS                               —     To be confirmed — nobody has said what this system does
```

Name, how far along, status, and what it is waiting on if anything. Order the ones with
blockers first — those are what the owner needs to see.

**2. Blocked** — everything with an entry under `## Blockers`, with which system it belongs to
and, where the log records it, how long it has been stuck. If nothing is blocked, say so
plainly rather than printing an empty heading.

**3. Annual targets** — the count behind, on track, and ahead, taken from the
"Annual targets at risk" section of `DASHBOARD.md`. Name the behind ones. Do not recompute
`pace()` here; that is `/check-targets`. If the at-risk section is undated or looks stale,
say so and suggest running `/check-targets`.

**4. This month so far** — the newest `## Monthly log` entry across the security, support,
network and team files, so the owner can see what has been recorded since the last report.

**5. Questions waiting on the owner** — reproduce the list from `DASHBOARD.md` verbatim,
numbered. These are the things blocking figures from reaching a report, and they include the
long-standing ones: what RMS, FMS and CMS actually do; whether "phish failure rate" is a
failure rate or a pass rate; the March and May 2026 phishing figures; the unit behind the
"3.69" incident response time; what the "82% rate" beside the vulnerability assessment
counts; and the subjects of the Fligno, SCL Dura and R3Hub meetings.

**6. Last updated** — the date at the top of `DASHBOARD.md`, and a note if it is more than a
month old.

## Finally

End with one sentence of your own on what most needs attention, and nothing more. Do not
propose a plan, do not start work, and do not offer to fix anything unless asked.
