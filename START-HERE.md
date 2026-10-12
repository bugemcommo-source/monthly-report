# ICT Monthly Report — How This Folder Works

This folder builds the ICT Department's monthly report as a website instead of a
PowerPoint. You present it from a browser, and afterwards management can open it
from a link.

## Doing this month's report — 5 steps

1. **Drop your screenshots** into `intake\`. Any file names, any order. Don't sort them.
2. **Open this folder in Claude Code** and say what happened this month, in your own words.
   Example: "BLC grading module is finished, billing is about 60% done and stuck waiting
   on Accounting. Phishing test went to 120 staff, 4 clicked. Ran a cybersecurity
   awareness session for 35 people."
3. **Answer the follow-up questions.** You'll only be asked about genuine gaps.
4. **Review what gets built.** You'll be shown the finished report before anyone else sees it.
5. **Say "publish"** when you're happy. Only then does it go online.

## What's in here

| Folder | What it holds |
|---|---|
| `reports\` | The finished report for each month. Open these from the web link, not by double-clicking — see **Presenting** below. |
| `assets\` | The shared design — backgrounds, fonts, animations. Improving this improves every month at once. |
| `tracking\` | Plain text notes on every system, security activity, and target. This is the department's memory. You can open and edit these in Notepad. |
| `intake\` | Where you drop screenshots. Cleared out after each month is built. |
| `private\` | **Never goes online.** Personal performance notes and original unedited screenshots. |
| `templates\` | The blank starting point a new month is copied from. Don't edit unless changing the design. |

## Presenting

**Open the report from its web link, not by double-clicking the file.**

This matters and it is not optional. Web browsers deliberately block
presentations like this one from running when you open the file straight out of
a folder — you would get a blank screen. Opened from the published link
(the address starting with `https://`) everything works normally.

If you do double-click it by accident, you will see a short message explaining
this rather than an empty screen. Nothing is broken.

Presenting somewhere with no internet? Tell ICT the day before and the report
can be set up to run from the laptop itself.

Once it is open, press **F** for fullscreen.

The report is one long page, split into sections. The mouse wheel, the
scrollbar, the Up and Down arrows, Home and End all scroll it freely, as on any
web page. A presentation clicker works too: its buttons send the "next" and
"back" keys below.

| Key | Does |
|---|---|
| Right arrow, PageDown, or Space | Next — to the next **part** of the report (see below). A part taller than the screen is read a screen at a time first, so nothing is skipped |
| Left arrow, PageUp, or Shift+Space | Back — up to the start of this part, then to the start of the one before |
| **Esc** | List of every section. Click one, or use Tab and Enter, to jump there. Esc again closes the list. (If an enlarged picture or a panel is open, Esc closes that first.) |
| **F** | Fullscreen on/off |
| **P** | Opens the **presenter window**: the speaker notes for exactly what is on screen now, "Section 7 of 13 · Part 2 of 5", the name of the next part, the time, and Back / Next buttons. Drag it onto the laptop's own screen; the projector only shows the report. If the browser blocks it, allow pop-ups for the page and press P again. |
| **Shift+P** | Shows the speaker notes **on the report page itself** — for presenting from one screen only. A projector showing the same picture will show the notes too. |
| **C** | Calm mode — turns off the heavy animation if the projector is struggling |

**Parts and notes.** Each section starts with its heading, and a long section is
split into parts (a card, a chart, a row of figures). Every press of Next goes
to the next part, and the presenter window switches to the notes written for
that part — so the notes always match what the room is looking at, one press at
a time. The window also follows you if you scroll with the mouse wheel, use the
section rail or press End. A section that is not split into parts is one part,
with all its notes together, as before.

Every one of these is also in the presenter controls: the small keyboard button
in the bottom-right corner. **F**, **P**, **Shift+P** and **C** can be switched off
there ("Single-key shortcuts") if they get in the way; the arrow keys, PageUp,
PageDown and Esc always work.

## The one rule

**A number never appears in a report unless it is first written in a `tracking\` file.**
That is what stops July from contradicting May.

## If something breaks

Open this folder in Claude Code and describe what you see. Nothing here is fragile —
the reports are plain files, and every past month keeps working even if the design changes.
