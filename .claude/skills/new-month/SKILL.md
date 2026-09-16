---
name: new-month
description: Starts a new month's report — creates the folders, collects the owner's update, files every fact into tracking, and returns the outstanding questions. Stops before building. Use at the start of each monthly reporting cycle.
---

Start a new month for the BUGEMCO ICT Department report. This command gathers and records;
it does **not** build anything.

## A note before step 2

`intake\` and `private\` are listed in `.gitignore`, so they contain nothing tracked and
**are absent entirely from a fresh clone**. The same is true of any month folder inside them.
Do not assume these folders exist — step 2 creates them. Creating a folder that already
exists is harmless; assuming one that does not is how the screenshot optimiser fails with a
confusing error.

## Steps

1. **Work out the month.** Ask the owner which month this report covers. If he does not say,
   default to the month that just ended — not the current one — and state your assumption out
   loud so he can correct it. Establish two strings and use them consistently from here on:
   - `YYYY-MM` — for example `2026-07`
   - `YYYY-MM-monthname`, lowercase — for example `2026-07-july`

2. **Create the folders.**
   ```powershell
   New-Item -ItemType Directory -Force -Path "intake\2026-07"
   New-Item -ItemType Directory -Force -Path "reports\2026-07-july\img"
   ```
   `-Force` on a directory creates parents and is safe on one that already exists. Confirm
   both paths afterwards and tell the owner they are ready.

3. **Ask for the screenshots, and wait.** Tell the owner:
   > Drop this month's screenshots into `intake\2026-07\`. Any file names, any order — they
   > get renamed and sorted automatically. Tell me when they're in.

   **Stop here and wait for his reply.** Do not proceed on a guess. When he says they are in,
   list the folder and tell him how many files you found, so he can spot a missed one.

4. **Ask for the month's update in his own words.** Do not hand him a form. Say:
   > Now tell me what happened this month, in your own words — what you worked on, what
   > finished, what got stuck, anything on security, support, or the network, and any meetings
   > or events. Don't worry about numbers or order; I'll ask about anything I need.

   Let him write as much or as little as he likes. Read it carefully before responding.

5. **Dispatch the `meeting-notes-taker` agent** with the owner's update verbatim and the
   `YYYY-MM` string. It files every fact into the right file under `tracking\` — one dated
   line per fact in the relevant `## Monthly log`, newest first, in the form
   `- YYYY-MM — text` — and returns the questions it still needs answered.

6. **Dispatch the `data-analyst` agent** with the same update and the notes-taker's output.
   It turns the words into figures, records them in `tracking\`, runs `pace()` over the annual
   targets, and asks about anything vague. It will not convert "mostly done" into a
   percentage — that comes back as a question, which is correct.

7. **Present the remaining questions, one at a time.** Merge the two agents' lists, drop
   duplicates, and ask them **one per message**, waiting for each answer. A wall of fifteen
   questions gets one answer; one question gets one answer, fifteen times.
   - Ask the most blocking ones first — anything a slide cannot be built without.
   - After each answer, have it filed into `tracking\` before asking the next.
   - If the owner does not know a figure, record a dash (—), never a zero, and keep the
     question on the list for next month.
   - Do not accept a vague answer as an answer. "Around 80%" is not 80%; ask for the number
     he would defend if Mancom asked.
   - Carry forward the long-standing open questions in `tracking\DASHBOARD.md` — what RMS, FMS
     and CMS actually do; whether "phish failure rate" is a failure rate or a pass rate; the
     March and May 2026 phishing figures; the unit behind the "3.69" incident response time;
     what the "82% rate" beside the vulnerability assessment counts; and the subjects of the
     Fligno, SCL Dura and R3Hub meetings.

8. **Stop. Do not build.** Summarise for the owner:
   - which folders were created,
   - how many screenshots are waiting in `intake\`,
   - which tracking files were updated and with what,
   - which questions are still open.

   Then tell him plainly:
   > That's everything recorded. Run `/build-report` when you're ready to build the slides.

   Do not run `/build-report` yourself, and do not start assembling anything.
