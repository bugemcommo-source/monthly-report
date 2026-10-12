---
name: build-report
description: Builds a month's report page from the tracking files and the optimised screenshots, then edits, checks, and archives it. Stops before publishing. Use after /new-month has recorded the month's facts.
---

Build the month's report page. Everything here assumes `/new-month` has already run and the
month's facts are recorded in `tracking\`.

**Never publish from this command.** Publishing is `/publish`, and it has its own gate.

Establish the two strings first — `YYYY-MM` (e.g. `2026-07`) and `YYYY-MM-monthname`
lowercase (e.g. `2026-07-july`) — and pass both to every agent.

## Steps

1. **Dispatch the `screenshot-optimizer` agent** with the month and the report folder. It runs
   `tools\optimize-screenshots.ps1`, then looks at every optimised image and returns a one-line
   description of each plus a list of anything that may show member data.

   **Review its flagged list with the owner before continuing.** Show him the flagged
   filenames and what the agent saw, and ask for each one:
   > Is this one safe to publish, or should it be cropped or dropped?

   Nothing flagged goes into the page until he has cleared that specific image. If he wants
   one cropped, get the cropped version into `intake\` and re-run the optimiser rather than
   editing the output by hand.

2. **Dispatch the `target-tracker` agent.** It brings the "Actual so far" column in
   `tracking\targets\bsc-annual-2026.md` and `deliverables-2026.md` up to date, runs `pace()`
   over every target, and writes anything behind into the "Annual targets at risk" section of
   `tracking\DASHBOARD.md`. Read its plain-words summary before moving on — if a target is
   behind, that belongs on the Annual Targets slide.

3. **Dispatch the `report-builder` agent.** It copies `templates\month.html` and fills it from
   `tracking\`, using the screenshot descriptions from step 1 for the `alt` text and captions.
   It will stop and ask if a figure is missing — answer the question, get the figure recorded
   in `tracking\` first, then let it continue. Confirm its handoff states a `{{` count of zero.

4. **Dispatch the `copy-editor` agent** over the result. It rewrites into plain language,
   expands every abbreviation on first use, checks the tone against previous months, and flags
   any sentence the tracking files do not support. **Read its flagged list.** Each flagged
   claim is either rewritten to stay inside the evidence, or backed by a new entry in
   `tracking\` — never left standing on the slide.

5. **Dispatch `qa-inspector` and `accessibility-checker` in parallel**, in a single message, so
   they run at once. Both open the built page in a real browser; the QA Inspector walks every
   slide at 1920×1080, 1920×1200 and 1440×1080 and tests every control, and the Accessibility
   Checker measures contrast, text size, alt text, reduced motion and keyboard reachability.

6. **Fix everything they report, then re-run them. Repeat until a full pass finds nothing new.**
   - Route each fix to the right owner: shared styling and motion go to `visual-designer`;
     content, wording, figures and `alt` text go to `report-builder` or `copy-editor`; a
     missing or wrong figure goes back to `data-analyst` and into `tracking\` first.
   - Fix the minor ones too. A 3px misalignment is on a projector at three metres wide.
   - Re-running means running **both** checkers again over the whole page, not just re-checking
     the one slide you touched — a fix in shared CSS can break a slide you never opened.
   - One clean pass is not enough on its own if the previous pass found several issues; keep
     going until a full run genuinely turns up nothing new.
   - If a report cannot be fixed — a figure nobody has, an image that must be dropped — record
     the decision and say so to the owner rather than quietly leaving it.

7. **Dispatch the `archive-manager` agent.** It adds the month's card to the front page
   `index.html`, compares this month against the previous one and reports contradictions
   (a system at 78% in July that was 85% in May), and confirms every past month folder still
   opens. **Any contradiction goes to the owner as a question** — never resolve it by editing
   one of the two months to agree with the other.

8. **Show the owner the finished report and stop.** Give him:
   - the path to open: `reports\YYYY-MM-monthname\index.html` (double-click, then press **F**),
   - the QA screenshots, so he can see it as the projector will,
   - the slide count and section order,
   - every figure used and the tracking file it came from,
   - anything still unresolved, including any contradiction against last month,
   - the list of screenshots included, by filename.

   Then say:
   > That's the report built and checked. Nothing has been published. Look it over, and run
   > `/publish` when you're happy — I'll ask you to confirm the screenshots before anything
   > goes online.

   **Stop here.** Do not commit, do not push, do not run `/publish`, and do not dispatch
   `git-publisher` or `security-redactor`. This command never publishes.
