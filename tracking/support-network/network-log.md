# Network

Work on the coop's internet, cabling, and connections between branches.

| Month | What was done | Downtime | Structured cabling | Notes |
|---|---|---|---|---|
| 2026-03 | Reported to Mancom (screenshot only) | | | Ask the owner for details |
| 2026-05 | Reported to Mancom (screenshot only) | | | Ask the owner for details |
| 2026-07 | Branch preventive maintenance (Q3), OS patching, backups, Starlink monitoring, website work | | | See the July detail below |

## Who reports this section

This work belongs to the **Network and System Administration** section. Their July 2026
report was supplied by the owner on 6 August 2026 and is recorded below. Source file:
`Network&System-Admin_Report,July 2026.docx` (kept outside this repository).

---

# July 2026 — Network and System Administration

## Internet use by branch (Starlink)

How much internet data each branch used, by billing period. Seven branches are covered.

| Period | MCBO | MBO | VBO | MFBO | KBO | ABO | KsBO |
|---|---|---|---|---|---|---|---|
| Jan–Feb | 1.17 TB | 1.09 TB | 45 GB | 506 GB | 1 TB | 0.1 GB | 80 GB |
| Feb–Mar | 1.89 TB | 1.23 TB | 215 GB | 356 GB | 1.16 TB | 0 GB | 559 GB |
| Mar–Apr | 1.35 TB | 1.37 TB | 383 GB | 501 GB | 1.04 TB | 0.1 GB | 579 GB |
| Apr–May | 1.17 TB | 1 TB | 429 GB | 0 GB | 928 GB | 252 GB | 352 GB |
| May–Jun | 1.12 TB | 1 TB | 1.11 TB | 403 GB | 1.11 TB | 473 GB | 301 GB |
| Jun–Jul | 1.08 TB | 345 GB | 967 GB | 502 GB | 1.15 TB | 1.17 TB | 102 GB |
| Jul–Aug | 1.15 TB | 1 GB | 10 GB | 510 GB | 1.23 TB | 350 GB | 365 GB |

**TB** means terabyte, **GB** means gigabyte. One terabyte is about a thousand gigabytes.

**The Jul–Aug row is July's use.** Confirmed by the owner in the July 2026 intake: it
shows what has been used in July, with nothing from August counted yet. Because it holds
July and only July, it is reported as July's figure — it is the branch chart in the July
report and the last point on the trend chart, both labelled "July".

**But two figures in it are worth a second look.** Within that same part-period, MBO shows
1 GB and VBO shows 10 GB, against 345 GB and 967 GB in the period before. Every other
branch is in its normal range. If the July portion really is fully counted, those two
branches have almost stopped using the internet, which would be an operational problem
rather than a counting artefact.

**Ask the Network section to confirm which it is** before the figure is used either way.

One transcription note: the source document writes ABO's Jul–Aug figure as "350 G". It
has been read as 350 GB.

## Branch preventive maintenance — Q3

Routine upkeep at each of the seven branches.

**The branch-by-branch table is not in this file.** It names which branches are behind, which
is a map of the least-protected sites, and this file is public. It is kept in
`private/branch-patching-q3-2026.md`, which is never uploaded. Bring that file to the meeting.

Totals, which is how this should be reported and all that belongs here:

- **OS patching: 100% at all 7 branches.** Every branch is fully up to date. This is the
  strongest single security figure in the whole July report.
- **Network patching:** 3 branches up to date, 2 ongoing, 2 pending.
- **Hardware:** 4 branches ongoing, 3 pending.
- **Printer maintenance:** 4 branches ongoing, 3 pending.

**Patching** means installing the fixes software makers release to close weaknesses.
Keeping it up to date is one of the most effective things any organisation can do to stay
safe.

> **PUBLISHING RULE — branch-level patching must never go on the public site.**
> Naming which branches are behind on patching is a map telling anyone which branches are
> the least protected and easiest to attack. Only the totals go on the public page. The
> branch-by-branch detail stays in `private/`, which is never uploaded.

## Backups

**21 of 23 backups succeeded in July 2026 — 91.30%.**

A backup is a spare copy of the coop's data, taken so it can be restored if something is
lost or damaged.

**The 23 counts working days.** Confirmed by the owner in the July 2026 intake: the backup
runs each day during working hours. July 2026 had exactly 23 working days, which matches.

So the figure means **21 of July's 23 working days ended with a good backup, and 2 days
did not.**

*Still to ask the Network section: what happened on those two days, and was the backup
re-run afterwards?* If the failures were spotted and repeated, this is a good-news item
about a process that works. If they were not, there is a day's work somewhere with no
spare copy.

## Average response time

**3.69 hours**, against a target of **24 hours or less. Lower is better.**

This closes a long-standing open question: the "3.69" recorded against the response time
target is measured in **hours**. The department answers a request in well under four
hours on average, against a target of a full day. That is comfortably inside target and
deserves to be shown as a win.

## Server vulnerabilities

**None were found in July 2026.** Confirmed by the owner in the July intake.

The source report carries the heading with four server names and nothing written
underneath, which reads as an omission. It is not — the check was done and came back
clean. **Say so plainly.** A blank heading tells the Mancom nothing; "no weaknesses were
found on the coop's main servers" is a real result and a good one.

Worth noting for future months: an empty heading and a clean result look identical on
paper. Writing "none found" each month removes the doubt.

> **PUBLISHING RULE — the four server names must never appear anywhere public.**
> Naming the coop's servers alongside the word "vulnerabilities" hands an attacker a
> starting point. The names are deliberately not written into this file. Refer to them
> as "the coop's main servers" in any published text.

## Website — BUGEMCO.com

Work done on the coop's public website during July:

- Coaching and mentoring with the Membership Department
- Fixing online transactions
- Updating news
- Creating pages
- Handling members' concerns
- Updating branch information and contact details

## Policy work in the Network and System Administration section

- **Communication, Digital Medium and Email Usage** — draft in progress, references being
  gathered.
- **Software Patch Management** — draft still pending.

Neither is approved yet, so neither counts towards the 8-policy target. See
`../infosec/policies-guidelines.md`.


Targets for 2026: **2 structured cabling installations** for the year; application
uptime **99% or better**.

Counts towards: BSC "Structured cabling installations" (target 2) and Deliverable #6
(Application uptime, 99% or better).

## What the terms mean

- **Structured cabling** — putting in proper network wiring for an office or branch
  so connections are reliable and tidy.
- **Downtime** — how long a system or connection was unavailable.
- **Uptime** — the opposite: how much of the time everything was working.

## Notes

- March and May were presented as screenshots only. Nothing was written down about
  what was actually done, so the details are genuinely unknown. The owner must supply
  them before anything appears in a report.

**Never record IP addresses, device names, server names, network passwords, or
network diagrams here — this file is published on a public website.** Describe the
work in plain words instead, for example "new cabling installed at a branch office".
