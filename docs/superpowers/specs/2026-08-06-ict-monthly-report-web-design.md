# ICT Department Monthly Report — Web Presentation System

**Date:** 2026-08-06
**Owner:** Gipre F. Naparan — IT Supervisor, Software Development & Information Security, ICT Department, BUGEMCO
**Status:** Approved design, ready for implementation planning

---

## 1. What this is

Every month the ICT Department presents a report to the Mancom (Management Committee). Today that report is a PowerPoint file. This project replaces it with an **interactive web presentation** that:

- looks and behaves like the existing PowerPoint (same backgrounds, same brand, same section order),
- adds real information — progress bars, charts, status badges, target tracking — instead of flat screenshots,
- is driven live in the meeting like a slide deck,
- is published to GitHub Pages so management can open it later from a link,
- and keeps a permanent, plain-text record of department progress that carries forward month to month.

**Plain-language rule:** every word written for this project — in the report, in the tracking files, and in conversation — uses everyday language. No jargon without explanation. The audience is management, not engineers.

---

## 2. Decisions made

| # | Decision | Choice |
|---|---|---|
| 1 | Content intake | The owner returns each month and describes what happened in conversation, plus drops screenshots into an intake folder. No form to fill in advance. |
| 2 | Presentation behaviour | Full-screen slide deck driven by arrow keys / spacebar / mouse wheel, with website-grade transitions and on-scroll background movement. |
| 3 | Distribution | Published to **GitHub Pages**; audience receives a link. |
| 4 | Access | **Public repository.** Anyone with the link can read it. |
| 5 | Sensitive data | A mandatory redaction gate runs before every publish. Personal performance data is never published. |
| 6 | First build | **July 2026** report. May 2026 is rebuilt first as a design demo. |
| 7 | Slide content | Fully modernised — progress bars, number callouts, status badges, framed click-to-enlarge screenshots. |
| 8 | Tracking scope | Software projects, information security, meetings/events/team, **plus support & network** (added: they are existing report sections), **plus** annual BSC targets and 2026 Deliverables. |
| 9 | Personal PMS data | **Not published.** Kept only in a local `private\` folder that is blocked from upload, purely to make year-end scorecard completion easier. |
| 10 | Effect intensity | **Maximum** — parallax, particles, 3D tilt, glow, count-ups, letter reveals — with a one-key "calm mode" fallback. |
| 11 | Agent team | **12 specialist agents** plus slash-command shortcuts. |
| 12 | Build approach | **Hand-built vanilla HTML/CSS/JS.** No framework, no build step, no Node.js requirement. |

---

## 3. Source material analysed

### 3.1 PowerPoint templates
`ICT Dept Monthly Report - March.pptx` (10 slides, the stated template) and `- May.pptx` (15 slides, most recent) were unpacked and inspected.

**Slide size:** 12192000 × 6858000 EMU = 13.333in × 7.5in = **16:9**.
**Fonts:** theme is Calibri Light / Calibri; actual slide headings use **Aptos Black**.
**Backgrounds** (all 4800×2700 PNG):

| Role | Source | Description |
|---|---|---|
| Title | `media/image2.png` (slide 1) | Faded coop building photo; rounded capsule stripes in green/yellow top-left and along the right edge; COOP + BUGEMCO logo top-right. |
| Content | `media/image1.png` (slide master — every content slide) | Faded building photo; small COOP/BUGEMCO logo top-left; capsule stripes top-right and bottom-left. |
| Closing | `media/image9.png` (last slide) | Full-colour building photo; large COOP/BUGEMCO logo left; "SALAMAT SA GUGMA!" in green with white outline. |

**Established section order (identical in March and May):**
Title → Software Development (one slide per system) → Information Security → Network → Support → Others (Meetings / Events / Training / Org Structure) → Closing.

**Key observation:** slides are almost entirely a heading plus one large screenshot. Very little typed text exists. The web version must therefore *generate* its informational content from the tracking files and the owner's monthly notes — it cannot be extracted from the PPT alone.

### 3.2 Annual targets — the department annual planning workbook, BSC sheet (kept outside this repository)

Balanced Scorecard, four perspectives, with baseline / target / monthly actual columns:

- **OCP (Organizational Capacity):** succession pooling 2; positions filled 100%; retention 100%; trainings & seminars 4; department digital solutions 1; IT positions filled 1; IT/Server office completion 100%; digital storage facility completion 100%.
- **IBP (Internal Business Process):** IT support response ≤ 24 hrs; **policies approved by Mancom 8**; **guidelines approved 5**; **processes improved/automated 4**; digital agreement standardisations 5.
- **FI (Financial):** budget utilisation rate 95%.
- **MS (Member-Stakeholder):** digitalisation utilised 6; info drives 5; structured cabling 2; IT asset housekeeping 100%; digital security breach incidents (target 0); incident response time 3.69; **phish failure rate ≤ 1%**; digitalisation satisfaction 95%.

### 3.3 2026 Deliverables — the 2026 deliverables workbook (kept outside this repository)

14 KPIs across the same four perspectives. Notable:
- Cybersecurity training attended: 1 (achieved — Cybersecurity Awareness)
- Secure SDLC adoption: 100% (achieved — Git/GitHub and auto-ticketing)
- **System enhancements proposed: at least 10 (achieved — BLC-SMS, Queuing System, MIS, SMS Facility, PPD Directory, CAC-IIS, CMS, Mart Online Store, RMS, FMS)**
- System software maintenance completion: 50% so far (BLC-SMS, Queuing, PPD, SMS, MIS)
- Application uptime ≥ 99%; vulnerability assessment 100% (noted 82% rate); major breaches 0; access review 100%; audit findings closed 100%; data privacy compliance 100%; enhancements delivered on time ≥ 90%; internal user satisfaction ≥ 85%.

### 3.4 Personal PMS — kept outside this repository

Structure confirmed: Performance Factor (70%) + Behavioral Competencies (30%), rated against a 4-point scale. The Jan–Jun half is complete; **the July–December half is blank**. The monthly tracking files will accumulate the actuals needed to complete it.

**This file's contents — ratings, attendance figures, and behavioral scores — are classified private and must never appear in any published output, including this specification.** Figures are therefore deliberately omitted here. They live only in `private\pms-tracker.md`.

### 3.5 Data discrepancy noted (for the owner to resolve, not blocking)

The BSC states **"Phish Failure Rate ≤ 1%"** while the PMS records "% of Phish Failure" with a target and an actual that read as a **pass rate**, not a failure rate. The two cannot both be failure rates. The PMS figures are private and are deliberately not written down here, in any form — not as values, not as a range, not in words. The report will state the metric with an explicit definition and unit so the two documents stop contradicting each other. Confirm the intended meaning before the first publish.

---

## 4. Folder structure

```
<project root>\
│
├─ START-HERE.md                  Plain-English guide to the whole folder
├─ index.html                     Front page: one card per month
├─ .gitignore                     Blocks private\ and intake\ from upload
│
├─ reports\
│   └─ YYYY-MM-monthname\
│        ├─ index.html            That month's presentation
│        └─ img\                  Optimised screenshots for that month only
│
├─ assets\
│   ├─ css\report.css             Layout, brand, slide types
│   ├─ css\effects.css            Animations, parallax, glow, tilt
│   ├─ js\engine.js               Slide navigation, keyboard, transitions
│   ├─ js\effects.js              Particles, parallax, count-ups, calm mode
│   ├─ js\charts.js               Donut, line, bar — hand-drawn SVG, no library
│   ├─ img\bg-title.jpg           Extracted from March template
│   ├─ img\bg-content.jpg         Extracted from March template
│   ├─ img\bg-closing.jpg         Extracted from March template
│   ├─ img\capsules-*.svg         Stripes traced off the background, own layer
│   └─ fonts\inter\               Self-hosted Inter (Black + Regular)
│
├─ tracking\
│   ├─ DASHBOARD.md               Everything at a glance
│   ├─ projects\<system>.md       One per system (10 systems)
│   ├─ infosec\phishing-log.md, training-log.md, incidents.md,
│   │           vulnerability.md, policies-guidelines.md
│   ├─ support-network\support-log.md, network-log.md
│   ├─ team\meetings-events.md, org-staffing.md
│   └─ targets\bsc-annual-2026.md, deliverables-2026.md
│
├─ private\                       NEVER UPLOADED
│   ├─ pms-tracker.md             Jul–Dec actuals accumulating
│   └─ raw-screenshots\           Unedited originals
│
├─ intake\YYYY-MM\                Raw monthly screenshot dump, any filenames
│
├─ docs\superpowers\specs\        This document and future specs
│
└─ .claude\
    ├─ agents\                    The 12 specialist agents
    └─ skills\                    Slash-command workflows
```

**Isolation rule:** `assets\` is shared and versioned once; `reports\<month>\` is self-contained and never edited after publish except to fix a defect. Fixing the engine improves every past month at once; fixing a month never touches another month.

---

## 5. Visual design

### 5.1 Brand tokens

| Token | Value | Use |
|---|---|---|
| `--green` | `#0B6E3A` | Dominant — headings, primary bars, section numbers |
| `--green-deep` | `#054F29` | Shadows, dark text on light cards, hover states |
| `--yellow` | `#F5C518` | Sharp accent only — never a large fill |
| `--card` | `rgba(255,255,255,0.82)` + backdrop blur | Frosted content panels |
| `--ink` | `#22282B` | Body text |
| Status | green done · yellow in-progress · orange delayed · grey not-started | Badges and bars |

Exact green and yellow values are sampled from `image1.png` during implementation so they match the printed brand rather than being guessed.

### 5.2 Typography

- **Headings:** Inter Black — closest free web match to Aptos Black. Self-hosted so it works offline and on GitHub Pages with no external request.
- **Body:** Inter Regular / Medium.
- Slide title 44–56px, section header 24–28px, body 16–18px, caption 12–13px, big stat 72–96px.
- Minimum on-screen body size 16px — this is read from the back of a meeting room.

### 5.3 Layer stack (bottom to top)

1. **Photo layer** — the extracted background, translated and scaled slowly; shifts opposite to travel direction on slide change (parallax depth).
2. **Capsule layer** — the green/yellow rounded stripes traced into SVG and lifted onto their own layer, floating at a different rate. The capsule is the project's repeated motif: it is also the shape of progress bars, section dividers, and the transition wipe.
3. **Light + particle layer** — slow-moving radial green/yellow glow plus fine drifting particles. This is the "modern layer on top of the background."
4. **Content layer** — frosted glass cards with 3D tilt toward the pointer, staggered entrance timing.
5. **Chrome layer** — progress dots, slide counter, month badge, control hints.

### 5.4 Slide types

| Type | Contents |
|---|---|
| Title | Month/year count-up, "ICT DEPARTMENT", "Software Development & Information Security", owner name, and a live summary strip generated from the tracking files |
| Section divider | Large section number, name, and preview list of contents |
| Project | System name, status badge, progress bar filling on arrival, completed items, blockers in a red-edged box, framed screenshot with click-to-enlarge |
| Security | Phishing donut, click-rate line chart across all months to date, trainings with attendance |
| Numbers | Large figures counting from zero (ATM cards, support requests, uptime %) |
| Targets | Annual BSC as horizontal bars — "Policies approved — 3 of 8" — colour-coded on-track / behind |
| Closing | Closing background with next month's plan fading in |

### 5.5 Controls

| Key | Action |
|---|---|
| → / Space / wheel down / click | Next |
| ← / wheel up | Previous |
| `F` | Fullscreen |
| `Esc` | Grid overview, click any slide to jump |
| `C` | **Calm mode** — disables particles, tilt, glow, and heavy blur instantly |
| `P` | Presenter notes |
| `Home` / `End` | First / last slide |

Calm mode state persists in `localStorage`. It also engages automatically when the browser reports `prefers-reduced-motion`, or when measured frame rate stays below 30fps for two seconds.

---

## 6. Tracking file format

Plain Markdown, editable in Notepad by a non-programmer. Example:

```markdown
# BLC School Management System
Status: In Progress · Progress: 78% · Target completion: Sept 2026
Linked to: Deliverable #3 (Digital Innovation), BSC "No. of Digitalization Utilized"

## Modules
- [x] Enrollment
- [x] Student Records
- [x] Grading
- [ ] Billing (60%)
- [ ] Report Cards
- [ ] Parent Portal

## Blockers
- Waiting on the finance chart of accounts from Accounting (raised 15 Jul 2026)

## Monthly log
- 2026-07 — Grading module finished and turned over; billing started
- 2026-05 — Student records completed, presented to BLC
```

**Rules:**
- The report reads its figures from these files. A number never appears in a report that is not first in a tracking file. This is what prevents July from contradicting May.
- Every entry in a monthly log is dated with an absolute date, never "last month."
- Targets files carry a running tally against the annual figure, e.g. `Policies approved: 3 / 8`.

---

## 7. The agent team

| # | Agent | Responsibility |
|---|---|---|
| 1 | Report Builder | Assembles the month's slide HTML from tracking files and notes |
| 2 | Visual Designer | Owns `effects.css`, `effects.js`, backgrounds, layout |
| 3 | Data Analyst | Converts narrative into progress percentages, chart data, comparisons |
| 4 | Copy Editor | Enforces plain language and consistent tone across months |
| 5 | Screenshot Optimizer | Crops, compresses, renames, resizes the `intake\` dump |
| 6 | Target Tracker | Updates BSC and Deliverables tallies; flags targets falling behind pace |
| 7 | Meeting Notes Taker | Captures the owner's spoken/typed monthly update into tracking files |
| 8 | Archive Manager | Updates the front page; checks cross-month consistency |
| 9 | **Security Redactor** | **Publish gate.** Scans for passwords, IPs, hostnames, member data, staff names tied to security failures, and private-folder leakage. Publish is blocked on objection. |
| 10 | QA Inspector | Opens the built page in a real browser via Playwright, steps through every slide, screenshots, reports overlap / overflow / broken images |
| 11 | Accessibility Checker | Contrast ratios, minimum text size, readability under projector washout |
| 12 | Git Publisher | Commit, push, confirm GitHub Pages is live, return the link |

**Slash-command shortcuts:** `/new-month`, `/build-report`, `/publish`, `/status`, `/check-targets`.

### 7.1 Publish gate — non-negotiable sequence

```
build → QA Inspector → Accessibility Checker → Security Redactor → owner reviews → owner says "publish" → Git Publisher
```

Nothing reaches GitHub without the owner's explicit instruction on that specific month.

---

## 8. Risks and how they are handled

| Risk | Severity | Handling |
|---|---|---|
| **Screenshots contain member names, account numbers, or amounts.** The Security Redactor reads text but cannot see inside an image. | High | The owner confirms every screenshot before publish. Blurring of sensitive regions available on request. This question is asked every month without exception. |
| Public repository exposes department operations | Medium | Redaction rules exclude passwords, IP addresses, hostnames, internal URLs, member data, and individuals tied to security failures. Only totals and percentages for phishing. |
| Repository grows large over 12 months | Medium | Screenshot Optimizer targets web-scale images (typically 80–90% reduction, no visible loss). Reviewed at 6 months. |
| Maximum effects stutter on old meeting-room hardware | Medium | Calm mode on `C`, automatic engagement below 30fps, and a measured performance test before first use. |
| Thin trend data early on | Low | Expected. Charts comparing months are meaningful from roughly October 2026. Stated on the slide rather than hidden. |
| Owner cannot maintain this alone if unavailable | Low | `START-HERE.md` documents the entire routine in plain language; tracking files are readable text, not a database. |

---

## 9. Build order

1. **Engine and brand** — extract and optimise the three backgrounds, trace capsule SVGs, build `engine.js` / `effects.js` / `charts.js`, self-host Inter.
2. **Tracking files** — seed `targets\` from the BSC and Deliverables spreadsheets; create project, infosec, support-network, and team files with known history from January, March, and May.
3. **Agent team and shortcuts** — install the 12 agents and 5 slash commands.
4. **May 2026 demo** — rebuild May from its existing PowerPoint as a fully working, clickable demo. **Owner reviews and approves the look here.** Nothing published.
5. **July 2026 report** — owner supplies content; full pipeline runs; owner approves; publish.

Steps 1–4 require no further input from the owner. Step 5 requires the July content.

---

## 10. Open item

Confirm the intended meaning of the phishing metric (see §3.5) before the first publish.
