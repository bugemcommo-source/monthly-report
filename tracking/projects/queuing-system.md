# Queuing System
Status: Deployed and running stable. One task left — a marketing video to upload · Progress: — · Target completion: n/a
Supplier: SCL Dura (outside supplier — this system was bought, not built in-house)
Linked to: Deliverable #4 (System improvements proposed), BSC "Digitalisation projects in use"

## What this is
Manages the queue of members waiting to be served. Confirmed in the July 2026 intake as
**deployed and in daily use**. Supplied by SCL Dura, not built in-house.

## Modules

## Blockers

**Cleared, 15 September 2026.** ~~Training for the Administration and Marketing staff,
waiting on a date between BUGEMCO and SCL Dura.~~

**There is nothing outstanding with SCL Dura.** The owner confirmed on 15 September that
the supplier's part is finished and the training is no longer waiting on them.

- [ ] **A marketing video to upload.** The only task left on this system, and it sits with
  Marketing rather than with ICT or the supplier.

## August 2026 — the first figures the system has ever produced

Source: three exports from the Queuing System, supplied by the owner on 16 September 2026
and kept outside this repository — visitors per department, members and visitors per day,
and the transaction trail.

**The month is complete: 19 working days, 3 to 28 August.** The two working days with no
data are **21 August (Ninoy Aquino Day)** and **31 August (National Heroes Day)**, both
national holidays. An earlier export held only the first ten days; this one supersedes it.

### What it measured

| | |
|---|---|
| Tickets issued | **5,041** |
| Transactions completed | **4,939** — 102 tickets, 2.0%, were issued but never completed |
| Working days | **19** |
| Average through the day | **265 tickets** |
| Busiest day | **24 August, 405 tickets** — twice the quietest |
| Quietest day | **19 August, 201** |
| Priority visitors | **542, 10.8%** |

### How long people waited

| | |
|---|---|
| Median wait | **5.6 minutes** |
| Average wait | **12.4 minutes** — pulled up by a long tail |
| Served within 10 minutes | **66%** |
| Served within 30 minutes | **89%** |
| Longest single wait | **198 minutes** |
| Average time at the counter | **7.3 minutes** |

**Use the median, not the average.** Half of everyone waited 5.6 minutes or less. The
average is more than twice that because a small number of very long waits drag it up, and
quoting 12.4 would describe almost nobody's experience.

### Where the queue forms

| Department | Tickets | Share | Median wait | Average wait | Time at counter |
|---|---|---|---|---|---|
| Cash Transaction | 2,060 | 40.9% | 3.5 min | 7.0 min | 5.4 min |
| Credit Transaction | 1,806 | 35.8% | 9.5 min | 16.3 min | 8.9 min |
| Collection Transaction | 502 | 10.0% | 5.4 min | 15.0 min | 6.0 min |
| Member Services | 351 | 7.0% | 2.4 min | 7.6 min | 7.1 min |
| Accounts Services | 306 | 6.1% | **16.4 min** | 29.3 min | 13.9 min |
| Insurance | 16 | 0.3% | 9.8 min | 45.0 min | 0.7 min |

**Cash Transaction takes the most people and moves them fastest.** Accounts Services takes
one visitor in sixteen and keeps them waiting nearly five times longer than Cash does.
Insurance is too small a sample to rank — 16 tickets in 19 days.

### The busiest hour is not the worst hour

| Hour | Tickets | Average wait |
|---|---|---|
| 08:00 | 496 | 12.2 min |
| 09:00 | **837** | 11.1 min |
| 10:00 | 768 | 14.1 min |
| **11:00** | 542 | **18.9 min** |
| 12:00 | 465 | 17.2 min |
| 13:00 | 676 | 10.9 min |
| 14:00 | 626 | 8.5 min |
| 15:00 | 399 | 7.8 min |
| 16:00 | 69 | 6.2 min |

**Late morning is the pinch — 11am, not noon.** Nine o'clock takes the most people, 837,
and moves them in 11.1 minutes. Eleven o'clock takes 542, barely two thirds as many, and
they wait **18.9 minutes** — the worst hour of the day. The queue does not thin before
lunch; the counters do, an hour earlier than anyone would guess.

**This is the single most actionable finding in the data**, and it is a staffing decision
rather than a system one. *(The first ten-day export put the pinch at noon. The full month
moves it to 11am — a reminder not to act on a partial export.)*

### Two data quality findings

1. **All 5,041 are recorded as visitors and none as a member.** The system separates the
   two and the members-per-day export returns zero members for every one of the 19 days.
   Either nobody is tagging members at the kiosk, or the setting is off. Until it is fixed
   the coop cannot say how much of its own queue is its own members.
2. **60 transactions record more than two hours at the counter**, the longest at 8,385
   minutes — five and a half days. These are tickets staff never closed in the system, not
   real service times, and they are excluded from every average above.

**Neither is a fault in the system.** Both are how it is being used, and both are fixable
without spending anything.

### The three totals do not match, and that is correct

Anyone totalling the hourly figures will land 163 short of 5,041. The chain:

| | |
|---|---|
| Tickets issued | **5,041** |
| less those never completed | −102 |
| **Transactions processed** | **4,939** |
| less those never closed, excluded from every timing | −60 |
| **Transactions with a usable time** | **4,879** |
| less one started after 5pm, off the chart | −1 |
| **Total of the hourly figures, 08:00–16:00** | **4,878** |

The department and daily figures count **tickets issued** and sum to 5,041. The hourly
figures count **transactions with a usable time** and sum to 4,878. Both are right; they
count different things. The hourly charts are labelled "transactions" for that reason —
do not relabel them "tickets".

### For charting

- Daily tickets, 3–28 August: 284, 282, 207, 210, 229, 382, 274, 266, 214, 237, 289, 244,
  201, 230, 405, 233, 256, 281, 317
- Hourly tickets, 08:00–16:00: 496, 837, 768, 542, 465, 676, 626, 399, 69
- Hourly average wait, 08:00–16:00: 12.2, 11.1, 14.1, 18.9, 17.2, 10.9, 8.5, 7.8, 6.2

## Monthly log
- 2026-09 — Owner's update, 15 September: **nothing further is outstanding with SCL Dura.**
  The only task left is a marketing video to be uploaded.
- 2026-08 — No change. The owner confirmed in the August intake that there was nothing
  to report. The system is still deployed and running, and the training for Administration
  and Marketing is **still waiting on a date to be agreed between BUGEMCO and SCL Dura**.
- 2026-07 — Deployed and running well. Some problems came up along the way, but the
  system is now stable. Training for Administration and Marketing has still not been
  run — BUGEMCO and SCL Dura have yet to agree a date.
- 2026-05 — Covered in the SCL Dura meeting alongside MIS
- 2026-05 — Covered in the SCL Dura meeting alongside MIS
