# Network

Work on the coop's internet, cabling, and connections between branches.

| Month | What was done | Downtime | Structured cabling | Notes |
|---|---|---|---|---|
| 2026-03 | Reported to Mancom (screenshot only) | | | Ask the owner for details |
| 2026-05 | Reported to Mancom (screenshot only) | | | Ask the owner for details |
| 2026-07 | Branch preventive maintenance (Q3), OS patching, backups, Starlink monitoring, website work | | | See the July detail below |
| 2026-08 | Q3 preventive maintenance, OS and network patching, security alarm survey, CCTV at head office, BLC and Damulog internet support, M365 licence planning | | Recabling preparations only, at two branches | See the August detail below |

## Who reports this section

This work belongs to the **Network and System Administration** section. Their July 2026
report was supplied by the owner on 6 August 2026 and is recorded below. Source file:
`Network&System-Admin_Report,July 2026.docx` (kept outside this repository).

### August 2026 — supplied 15 September 2026

Source: `Network&System-Admin_Report,August 2026.pdf`, supplied by the owner and kept
outside this repository. The figures below are transcribed from it.

**Read the publishing rules at the foot of this file before any of this goes on the public
site. August adds a third rule — branch security alarms.**

#### The monthly figures

| | July | August |
|---|---|---|
| Operating system patching | 100% at all 7 branches | **100% at all 7 branches** |
| Network patching | 3 up to date, 2 ongoing, 2 pending | **5 up to date, 2 ongoing, none pending** |
| Hardware maintenance | 4 ongoing, 3 pending | **4 ongoing, 3 pending** |
| Printer maintenance | — | **3 up to date, 3 ongoing, 1 pending** |
| Average response time | 3.69 hours | **4 hours**, against a 24-hour target. Lower is better |
| Backups | 21 of 23 working days, 91.30% | **No figure — see below** |
| Server vulnerabilities | None found | **3 assets with open ports, in use and secured** |

**Network patching improved: 5 of 7 branches are up to date against 3 in July, and nothing
is left pending.** That is the clearest piece of progress in the section this month.

#### Backups — no figure for August

**No backup figure was reported for August.** The blank is a real one: not that nobody
counted. July's 21 of 23 must not be carried forward.

> **PUBLISHING RULE — nothing about a backup gap is published.**
> Added 16 September 2026, from the pre-publish scan. The section's own wording, the
> platform involved, the reason, the duration and whether it is resolved are all held in
> `private/`. Published pages show the blank and say the matter is covered in the meeting.
> A rule that explains what it is withholding withholds nothing, so this one does not
> describe the situation it covers.
>
> **Say it in the meeting, record it privately, publish the blank.** Only a position the
> section has confirmed in writing is ever published.

#### Server vulnerabilities

The ransomware protection console reports **3 business assets with open ports** — the
section states the ports are in use and the assets are secured — and against those assets
**zero ransomware threats, zero assets at risk and zero attack events**.

**The four servers are named in the source document. Those names never go on the public
site.** Report the finding as a count of assets, never as a list.

#### Security alarm system — held internally

The section surveyed the alarms and reported its findings. **None of it is written down on
the public side** — not the results, not any count, not a description of what was found.
It is held internally and it goes in the meeting pack.

**Owner's ruling, 16 September 2026.** The rule had been "aggregate counts only". The
security scan argued that even an aggregate says more than it should on a page anyone can
search, and the owner went further than the scan asked: the subject comes off the public
side entirely. The earlier wording is retired — see the publishing rule further down this
file.

**What the August report says:** that a survey was carried out and that follow-up work is
in hand. Nothing further.

#### Internet use by branch (Starlink)

The Jul–Aug period is complete and an Aug–Sept period has begun. The section's explanation
of the uneven readings: **three branches are stable; two spiked because of a line problem
with their main internet provider**, and two more have been contacted about main-line
installation, which the provider has not yet scheduled.

That partly answers July's open question about two branches showing almost no use.
**Still to confirm:** the branches the section's description names as spiking are not the
same ones the readings show as near-zero. Either the description refers to the Aug–Sept
period or two branches are transposed. **Do not publish a branch-level reading of this
until it is settled** — and the branch identities are held in `private/` regardless, so
this can only ever be discussed by letter here.

#### Policy

**Communication, Digital Medium and Email Usage — now queued for its first presentation.**
The August plan recorded a policy presentation to Mancom; the section's report puts this at
"for 1st presentation", so it has not happened yet. **Software Patch Management is not
mentioned in the August report at all.**

#### Other work in August

- **BLC internet service provider** — the August plan had "BLC network, initial
  installation". The report lists the provider rather than the installation. *Still to
  confirm whether the installation itself is done.*
- **Damulog internet service support** — as planned.
- **Head office CCTV installation.**
- **MDP Module 2: Strengthening Co-op Operations** — a training. *This may count towards
  the trainings-attended target. Ask the owner who attended.*
- **Structured recabling at two branches — preparations, with R3Hub.** Preparations, not
  installations. The BSC target counts **installations**, so nothing is claimed against it.
- **Microsoft 365 licence planning** — whether some roles get a lighter productivity app
  with Teams only, plus licences for the allied businesses and for hiring in 2027.

**Not in the August report:** the **ATM machine configuration update with ITC**, which the
August plan listed. Recorded as not reported rather than not done — ask the section.

---

# July 2026 — Network and System Administration

## Internet use by branch (Starlink)

How much internet data each branch used, by billing period. Seven branches are covered.

| Period | Branch A | Branch B | Branch C | Branch D | Branch E | Branch F | Branch G |
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

**But two figures in it are worth a second look.** Within that same part-period, two
branches show almost nothing — single and double-digit gigabytes — against hundreds of
gigabytes in the period before, while every other branch is in its normal range. If the
July portion really is fully counted, those two have almost stopped using the internet,
which would be an operational problem rather than a counting artefact.

**Ask the Network section to confirm which it is** before the figure is used either way.
The section's August report offers an explanation — a line problem with the main provider —
but names different branches from the ones the readings point at. Unresolved.

One transcription note: the source document writes one branch's Jul–Aug figure as
"350 G". It has been read as 350 GB.

> **PUBLISHING RULE — branch identities in this table are replaced by letters.**
> Added 16 September 2026, after the pre-publish scan. This table read alongside the
> patching status narrows "which office is least protected" to a single
> answer, and a branch with no internet may also have no remote monitoring. **The letter
> key is held in `private/` and appears nowhere in this repository.** The August report
> states that branch-level internet figures are held back — that statement has to remain
> true of everything published from this folder, not only of the report page.

## Branch preventive maintenance — Q3

Routine upkeep at each of the seven branches.

**The branch-by-branch table is not in this file.** It names which branches are behind, which
is a map of the least-protected sites, and this file is public. It is kept in
a file in `private/`, which is never uploaded. Bring that file to the meeting.

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

> **PUBLISHING RULE — nothing about branch security alarms goes on the public site.**
> Added 15 September 2026, revised 16 September 2026 on the owner's ruling. The revision
> replaces the earlier "aggregate counts only" wording, which is retired: counts are not
> published either, nor is any description of what was found. The whole subject belongs in
> the meeting and in `private/`, which is never uploaded. The same applies to anything the
> section reports about CCTV.

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
