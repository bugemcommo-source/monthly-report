---
name: check-targets
description: Runs pace() over every annual target for the current month and reports in plain words which are ahead, on track, and behind, with the figure needed to catch up. Use when someone asks how the year is going against the scorecard.
---

Score every annual target against the calendar and say plainly where the year stands.

## Steps

1. **Work out the month number.** 1..12, for the month being scored. Default to the current
   calendar month and say so; if the owner is scoring a report month that has already ended,
   use that instead. State which you used.

2. **Read the targets.**
   - `tracking\targets\bsc-annual-2026.md` — the Balanced Scorecard, four sections:
     Organisational Capacity, Internal Business Process, Financial, Members and Stakeholders.
   - `tracking\targets\deliverables-2026.md` — the 16 department deliverables.

   Take the target and the "Actual so far" from the tables. **Never read
   `private\pms-tracker.md`** — that is the owner's personal performance file and nothing from
   it belongs in a departmental answer.

3. **Run `pace()` on every row.** `tools\lib\pace.js` applies a 10% tolerance and handles
   lower-is-better correctly. Do not judge by eye.

   ```bash
   node --input-type=module -e "
   import { pace } from './tools/lib/pace.js';
   const rows = [
     { name: 'Policies approved by Mancom', actual: 3, target: 8 },
     { name: 'Guidelines approved',          actual: 1, target: 5 },
     { name: 'Security breaches',            actual: 0, target: 0, lowerIsBetter: true }
   ];
   const month = 7;
   for (const r of rows) {
     const p = pace({ actual: r.actual, target: r.target, month, lowerIsBetter: !!r.lowerIsBetter });
     console.log(r.name, JSON.stringify(p));
   }
   "
   ```

   - Pass `lowerIsBetter: true` for every measure marked **Lower is better** in the file:
     IT support response time, security breaches, incident response time, phishing failure
     rate. Getting this flag wrong reports a good result as a failure, or the reverse.
   - `pace()` returns `{ state, expected, shortfall, percent }`, with `state` one of `ahead`,
     `on-track`, `behind`.
   - **Where "Actual so far" is a dash (—), do not run `pace()` with a zero.** A dash means
     nothing has been recorded yet. List it under "Not measured yet" and say what would be
     needed to measure it.
   - Skip the two measures that cannot be scored until the owner answers a question, and say
     why: the **incident response time target of 3.69** has no recorded unit, and the
     **phishing failure rate** is recorded two contradictory ways (the scorecard asks for 1%
     or less, a failure rate; the owner's personal file records a target and actual that
     read as a pass rate).

4. **Report in plain words**, grouped, behind first. Every line carries the actual, the target,
   the unit, what the calendar expects by now, and — for anything behind — **the figure needed
   to catch up**:

   > **Behind**
   > - **Policies approved by Mancom: 3 of 8.** By July we'd expect about 5, so this one is
   >   behind — 2 short. Catching up means 5 more approved across the remaining 5 months,
   >   about 1 a month.
   > - **Trainings and seminars attended: 1 of 4.** By July we'd expect about 2. One more
   >   before the year ends keeps it on pace; 3 more hits the target.
   >
   > **On track**
   > - **Structured cabling installations: 1 of 2.** By July we'd expect about 1.
   >
   > **Ahead**
   > - **Security breaches: 0, target 0 or fewer.** Nothing recorded all year.
   >
   > **Not measured yet**
   > - **IT support response time.** Target is 24 hours or less. No figure recorded — we'd
   >   need the longest first-reply time from `support-network\support-log.md`.

   Round "expected" to something a person would say ("about 5"); keep actuals and targets
   exact. Never print a bare percentage — always the counts and the unit.

5. **Read-only.** This command reports; it does not edit. If the tallies look out of date,
   say so and recommend the `target-tracker` agent, which owns the "Actual so far" column and
   the "Annual targets at risk" section of `tracking\DASHBOARD.md`. Do not update them here.

6. **Finish** with one sentence: how many are behind, and which one most needs attention this
   month.
