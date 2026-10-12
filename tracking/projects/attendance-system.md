# Attendance System — Ownership Meeting
Status: **Ready** for the Ownership Meeting (owner confirmed 7 Oct 2026) — scope widened in September to attendance, claims and raffle draw (owner now calls it an "Event System") · Progress: 100% (owner's ruling 9 Oct 2026 — first use at the Ownership Meeting on 10 Oct 2026; see accomplishment-scale.md) · Target completion: Ready for the Ownership Meeting, October 2026
Linked to: Deliverable #4 (System improvements proposed)

## What this is
An attendance system for the **Ownership Meeting**, the coop event. It is an
**enhancement of last year's system**, not a new build from nothing — the work is on the
**system structure**.

New to the tracking files in August 2026. Raised by the owner in the August intake.

**The Ownership Meeting is in October 2026**, confirmed by the owner in the August
intake. That is this system's deadline: it has to be working on the day.

Still to confirm: how attendance is actually taken on the day (scanning, list, ID), and
roughly how many attendees it has to handle. (What the old system could not do was answered
on 7 October 2026 — see the Monthly log.)

**September 2026 — scope widened.** The owner described it as "an Event System for
Ownership Meeting for attendance, claims, and raffle draw". It is filed here as the same
system as August's Attendance System, now covering three jobs rather than one. **Not yet
confirmed by the owner** that it is the same system, nor whether the file should be renamed
"Event System".

**Ready for the Ownership Meeting** — confirmed by the owner on 7 October 2026.

**"Claims", as the test screens show it**, means releasing cash claims to attending members:
the test Claims screen records "cash released" against each ticket and keeps a "claims
table". The owner has not defined "claims" in words, so describe it as what the screens
show, not as his definition.

## Modules

## Blockers

## Monthly log
- 2026-10 — **Ownership Meeting is on 10 October 2026; the Event System is used there** — owner, 9 October 2026: "100% na kay gamiton na ugma sa Ownership Meeting" (100% now, because it will be used tomorrow at the Ownership Meeting). Progress set at 100% by the owner on the stage scale.
- 2026-09 — **Last year's OM had problems this system is meant to fix** (owner, 7 October 2026: "yes, naay mga discrepancy gamay and naay mga system error like dili ma search ang uban members"): (1) **small cash discrepancies** when the money was counted — amount and count not given; (2) **system errors in the old system, e.g. some members could not be found by search**. These are the "before" for the October OM. The amount of the discrepancy is an open question; until given it is described in words ("small"), never as a figure.
- 2026-09 — **Process-flow changes are in ticket assigning, cash distribution and cash returned** (owner, 7 October 2026: "the ticket assigning and cash distribution and returned, this is more on auditing,tracing and monitoring"). The purpose is **auditing, tracing and monitoring**: each ticket, each cash release and each return is now recorded in the system. The test screens show what this looks like — every claim records who released it, at which station and when, and each claims drawer has a "should hold" amount to count against. No figure yet for the effect (e.g. cash discrepancies last year vs this year).
- 2026-09 — **What is new against last year's system** (owner, 7 October 2026: "there is a system before we just improve lang ang karun pero walay raffle ang sauna, so mao siguro ang pinaka significant additional features, and naay mga nag bag oh sa process flow for more improvement"): an earlier system existed and this one improves it. The **raffle draw is entirely new** — last year's system had none — and the owner rates it the most significant addition. Some **process-flow changes** were also made; which steps changed is not yet stated. No before/after time figure was given.
- 2026-09 — **Ready for the Ownership Meeting** — owner confirmed 7 October 2026 ("yes ready na"). The OM is in October 2026; exact dates not given (the 8 October date in the test setup is test data, not the schedule). Its impact figures — attendees registered, claims released, raffle draws — will be October's, after the OM.
- 2026-09 — **Screenshots taken 7 October 2026** from the local build (localhost:8080, titled "BUGEMCO Attendance & Claims", set up for the 16th Ownership Meeting 2026): Overview, Attendance, Claims, Raffle draw, and the raffle wheel of names on the hall screen. **All names, member numbers and amounts on these screens are test data** — owner confirmed 7 October 2026 ("only test data"). The figures on them (2 present, ₱850.00 released) are test figures and must never be reported as results.
- 2026-09 — **Scope widened to an Event System for the Ownership Meeting covering attendance, claims and raffle draw** (owner's words: "Develop an Event System for Ownership Meeting for attendance,claims,and raffle draw"). Taken to be August's Attendance System, expanded — not yet confirmed. Whether it is finished and ready for the OM is not stated; screenshots are being taken. (superseded — see the lines above)
- 2026-08 — Development started. The work is an enhancement of last year's system, restructuring how the system is built. Just started — no modules finished yet.
