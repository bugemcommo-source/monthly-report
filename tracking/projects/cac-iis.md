# CAC-IIS — Coop Assurance Center Insurance Information System
Status: 1st presentation held (system setup) — waiting for 2nd presentation · Progress: — · Target completion: To be confirmed with the owner
Linked to: Deliverable #4 (System improvements proposed), BSC "Digitalisation projects in use"

## What this is
The system for the Coop Assurance Center. It holds the coop's insurance information.
Full name confirmed by the owner in the July 2026 intake: Coop Assurance Center —
Insurance Information System (CAC-IIS).

## Modules

## Coming up

- **API integration with CLIMBS.** A meeting is scheduled for September 2026 to work on
  connecting this system to CLIMBS' own, so the two exchange data directly rather than by
  hand. Raised by the owner on 16 September 2026. Nothing is built yet and no scope has been
  recorded — ask what the integration is to cover before it appears in a report as work.

## Blockers
- Waiting for a date for the **second** presentation.

**Correction, August 2026.** July recorded this as waiting for the *first* presentation.
The first presentation was then held in **August 2026**, so what is outstanding now is the
**second**. Confirmed by the owner in the August intake.

## Monthly log
- 2026-08 — **First presentation held**, and a meeting with the **CAC Supervisor**.
  Both took place this month; confirmed by the owner in the August intake. The
  presentation **covered the system setup only — most of it, not all of the system** —
  which is why a second presentation is needed to cover the rest. Now waiting for a date
  for the **second** presentation.
- 2026-07 — First version of the system is finished and ready to show. Waiting for a
  date for a presentation. *(Recorded at the time as the first presentation; corrected
  in August to the second — see Blockers.)*
- 2026-05 — Reported to Mancom under Software Development
- 2026-03 — Reported to Mancom, and a system presentation meeting was held

## Screens on record

Two screenshots are in the July report: the **sign-in screen** and the **top half of the
dashboard**.

**The dashboard question is settled.** The owner confirmed on 16 September 2026, in his own
words, that the CAC-IIS figures are invented — the same confirmation he gave for the Credit
Management System on the same day. The dashboard is restored.

**It is published cropped, and the crop is not cosmetic.** The lower half of that screen
carries a "Collections by branch" chart naming **all seven branches** with a collection
figure against each, ranked. Branch identities are never published on this site — the
network figures are lettered and the key is held in `private/` precisely so branches cannot
be identified. Restoring the screen whole would have handed over the full branch roster.

The owner was shown this and chose the crop on 16 September 2026. The crop is set in
`tools/prepare-system-shots.ps1` as a height limit, so re-running the tool cannot restore
the branch panel by accident.

**What is published:** a collection rate dial and a premium-collections-over-time chart.
No member, no account, no branch.

**The Mart admin console is a different matter and stays withdrawn.** It was inspected on
16 September 2026 and shows a named member with their member number, branch and outstanding
balance, alongside real receivable totals. No confirmation reaches that one.

**Read off the screens, not confirmed by the owner** — treat as indicative until checked:

- The system covers clients, member imports and agents; claims, collections, renewals,
  commissions, remittances, portal requests, mandatory insurance, loan monitoring and
  distressed accounts; and a reports section.
