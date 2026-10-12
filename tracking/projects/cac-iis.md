# CAC-IIS — Coop Assurance Center Insurance Information System
Status: Deployed to bugemcocac.com, September 2026 — **not yet in use** (owner confirmed 7 Oct 2026); waiting on the system presentation (2nd presentation, no date yet) before use · Progress: 90% (stage scale, see accomplishment-scale.md) · Target completion: To be confirmed with the owner
Linked to: Deliverable #4 (System improvements proposed), BSC "Digitalisation projects in use"

## What this is
The system for the Coop Assurance Center. It holds the coop's insurance information.
Full name confirmed by the owner in the July 2026 intake: Coop Assurance Center —
Insurance Information System (CAC-IIS).

## Modules

## Coming up

- **API integration with CLIMBS.** The first planning meeting was held in September 2026,
  on API integration for CAC-IIS — confirmed by the owner on 7 October 2026. The aim is for
  this system and CLIMBS' own to exchange data directly rather than by hand. **The next
  meeting is not yet dated.** Raised by the owner on 16 September 2026. Nothing is built
  yet, and what was agreed at the planning meeting is not stated — ask what the
  integration is to cover before it appears in a report as work.

## Blockers
- Waiting on the **system presentation** (the **second** presentation) — not yet held, and
  no date yet. Go-live waits on it. Confirmed by the owner on 7 October 2026.

**Correction, August 2026.** July recorded this as waiting for the *first* presentation.
The first presentation was then held in **August 2026**, so what is outstanding now is the
**second**. Confirmed by the owner in the August intake.

## Monthly log
- 2026-09 — **The CAC-IIS dashboard screenshot may be published** — owner's ruling, 8 October 2026 ("yes"), after being told it is the staff side, signed in as CAC Super Admin, showing only zeros and no client data (`intake/2026-09/cac-iis-dashboard.jpg`, taken 7 October 2026). This ruling covers this empty screen only — any future CAC-IIS screen with real client records needs its own check.
- 2026-09 — **The address bugemcocac.com may be shown in the public report** — owner's ruling, 7 October 2026 ("yes, show the addresses"), made after being told the address leads to the system's sign-in page.
- 2026-09 — **Go-live is waiting on the system presentation** (owner, 7 October 2026: "system presentation") — i.e. the 2nd presentation outstanding since August has not yet been held. No date given.
- 2026-09 — **Not yet in use** — owner confirmed on 7 October 2026: "deployed only but wala pajud sya nagamit" (deployed only, not used yet). The live dashboard on 7 October 2026 shows 0 clients, 0 agents, 0 active policies, ₱0 premium collected and 0 claims filed. Not counted toward "Digitalisation projects in use".
- 2026-09 — **Deployed to bugemcocac.com** (owner's words: "we deploy CAC-IIS bugemcocac.com"). Recorded as deployed to that address in September 2026, **not as in use**: whether CAC staff are now working in it with real records, and whether the 2nd presentation outstanding since August took place, are not confirmed. Not counted toward "Digitalisation projects in use" until the owner says it is in use.
- 2026-09 — **First planning meeting with CLIMBS held in September 2026, on API integration for CAC-IIS** — owner confirmed 7 October 2026 ("api integration para sa CAC-IIS"; "naka meeting mi sa sptember para sa first meeting for the planning"). The aim is for CAC-IIS and CLIMBS' system to exchange data directly. **No date yet for the next meeting** (owner: "wala pay date"). What was agreed at the planning meeting is not stated.
- 2026-08 — **First presentation held**, and a meeting with the **CAC Supervisor**. Both took place this month; confirmed by the owner in the August intake. The presentation **covered the system setup only — most of it, not all of the system** — which is why a second presentation is needed to cover the rest. Now waiting for a date for the **second** presentation.
- 2026-07 — First version of the system is finished and ready to show. Waiting for a date for a presentation. *(Recorded at the time as the first presentation; corrected in August to the second — see Blockers.)*
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

**September 2026 — the deployed system's dashboard.** The screen taken on 7 October 2026
(`intake/2026-09/cac-iis-dashboard.jpg`) shows only zeros and no client data, and the owner
approved publishing it on 8 October 2026. That approval covers this empty screen only: any
future CAC-IIS screen with real client records is **not** covered by it, nor by the 16
September "figures are invented" confirmation, and must be checked for member, account and
branch details before it goes anywhere near a report.

**Read off the screens, not confirmed by the owner** — treat as indicative until checked:

- The system covers clients, member imports and agents; claims, collections, renewals,
  commissions, remittances, portal requests, mandatory insurance, loan monitoring and
  distressed accounts; and a reports section.
