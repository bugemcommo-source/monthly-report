# Queuing System
Status: Deployed and running stable. One task left — a marketing video to upload · Progress: 100% (stage scale, see accomplishment-scale.md) · Target completion: n/a
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

## September 2026 — the second full month

**Wording standard, owner's choice of 8 October 2026: "called within" (not "served within") and "tickets a day" (not "visitors a day").** The wait figures measure time until a ticket is called to the counter, and the daily counts are tickets issued. August's published page used "served" and "visitors"; it is left as published. The August table below is relabelled to match, with no figure changed.

Source: three exports from the Queuing System, supplied by the owner on 8 October 2026
and kept outside the repository's tracked files, in the gitignored intake — visitors per
department, members and visitors per day, and the transaction trail. Computed by the data
analyst with **the same definitions as August**; the arithmetic is the reconciliation chain
below. The exports hold transaction numbers and times only — no names or member numbers.

**The month is complete: 21 working days, 2 to 30 September.** September has 22 weekdays.
The one weekday with no data in any of the three exports is **Tuesday 1 September**. It was
**Araw ng Bukidnon**, the province's foundation anniversary — a special non-working holiday
in Bukidnon every 1 September under Republic Act No. 12039 — and **the office was closed**
(owner confirmed 8 October 2026). No Saturday or Sunday has data. There was no national
holiday in September.

### What it measured

| | |
|---|---|
| Tickets issued | **5,956** — 915 more than August's 5,041 (+18%) |
| Transactions completed | **5,803** — 153 tickets, 2.6%, were issued but never completed (August: 102, 2.0%) |
| Working days | **21** — two more than August's 19 |
| Average through the day | **284 tickets** — 265 in August (+7%) |
| Busiest day | **2 September, 426 tickets** — twice the quietest, and the first day open after 1 September |
| Quietest day | **23 September, 210** |
| Priority visitors | **677, 11.4%** — 542, 10.8% in August |
| Tagged as members at the kiosk | **2 of 5,956** — both at Cash Transaction. August: 0 |

**Members served cannot be counted yet.** The kiosk recorded 2 members and 5,954 visitors.
That says the member button is still almost never pressed, not that the coop's own members
stayed away. What the system can say is how everyone fared: **5,803 tickets were
served to the end; half of everyone waited 6.6 minutes or less, and 59% were called within
10 minutes** — against 5.6 minutes and 66% in August. (A ticket is one visit to one
department, not one person.)

### How long people waited

| | |
|---|---|
| Median wait | **6.6 minutes** — 5.6 in August, one minute longer |
| Average wait | **16.6 minutes** — 12.4 in August; pulled up by a long tail |
| Called within 10 minutes | **59%** — 3,357 of 5,734 (August 66%) |
| Called within 30 minutes | **83%** — 4,739 of 5,734 (August 89%) |
| Longest single wait | **458 minutes**, 7.6 hours (August 198) |
| Average time at the counter | **5.9 minutes** — 7.3 in August |

**Use the median, not the average.** Half of everyone waited 6.6 minutes or less. The
average is two and a half times that because a small number of very long waits drag it up.
**More people came and they waited a little longer:** 7% more tickets a day, one minute
more on the median, and 7 points fewer called within 10 minutes. Time at the counter fell
1.4 minutes, so the extra wait is in the queue, not at the counter.

### Where the queue forms

| Department | Tickets | Share | Median wait | Average wait | Time at counter |
|---|---|---|---|---|---|
| Cash Transaction | 2,469 | 41.5% | 3.5 min | 9.6 min | 4.5 min |
| Credit Transaction | 2,134 | 35.8% | **15.6 min** | 21.4 min | 7.1 min |
| Collection Transaction | 542 | 9.1% | 3.6 min | 15.7 min | 4.8 min |
| Accounts Services | 412 | 6.9% | **19.2 min** | 37.1 min | 11.2 min |
| Member Services | 354 | 5.9% | 2.7 min | 14.2 min | 5.0 min |
| Insurance | 45 | 0.8% | 14.1 min | 41.9 min | 1.5 min |

| Median wait, August → September | August | September |
|---|---|---|
| Cash Transaction | 3.5 min | 3.5 min |
| Credit Transaction | 9.5 min | **15.6 min** |
| Collection Transaction | 5.4 min | 3.6 min |
| Accounts Services | 16.4 min | **19.2 min** |
| Member Services | 2.4 min | 2.7 min |
| Insurance | 9.8 min | 14.1 min |

**Credit Transaction is where September got worse.** It takes a third of everyone, and its
median wait went from 9.5 to 15.6 minutes. Cash still moves the most people fastest, at
the same 3.5 minutes. Accounts Services remains the longest wait. Insurance is still too
small to rank — 45 tickets, and only 21 of them with a usable time.

### The busiest hour is still not the worst hour

| Hour | Transactions | Average wait |
|---|---|---|
| 08:00 | 621 | 15.6 min |
| 09:00 | **959** | 18.4 min |
| 10:00 | 952 | 17.8 min |
| **11:00** | 648 | **21.6 min** |
| 12:00 | 533 | 20.3 min |
| 13:00 | 743 | 14.2 min |
| 14:00 | 813 | 12.8 min |
| 15:00 | 373 | 11.6 min |
| 16:00 | 92 | 6.4 min |

**Late morning is the pinch again — 11am, as in August.** Nine o'clock takes the most
people, 959, and they wait 18.4 minutes. Eleven o'clock takes 648 and they wait **21.6
minutes**, the worst hour of the day (August: 18.9). Two months running, the same hour.

### Data quality findings

1. **Members are still not being tagged.** 2 of 5,956 tickets, both at Cash Transaction on
   14 and 18 September. August had none. Until the kiosk is used as designed, the coop
   cannot say how much of its queue is its own members.
2. **69 transactions record more than two hours at the counter**, the longest at 5,430
   minutes — 3.8 days; 15 run past a full day. Tickets staff never closed, not real service
   times, and excluded from every timing above (August: 60).
3. **153 tickets were never completed** — 136 never called and 17 called but never
   finished. They cluster late in the day (129 of them issued from 1pm on) and in two
   departments: **Collection Transaction, 75 of its 542 tickets (14%)**, and **Insurance,
   23 of its 45**. The September trail lists these as rows with no call or end time.
4. **44 waits are longer than two hours**, 23 of them at Accounts Services; the longest is
   458 minutes. Under August's rule only counter time is screened, so these stay in (August
   kept its 198-minute wait the same way). Leaving them out would move the median from 6.6
   to 6.5 minutes and the 10-minute share not at all; only the average falls, to 15.0.
5. **605 of the 5,734 transactions with a usable time (11%) spent under 15 seconds at the counter** — likely tickets called
   and closed with nobody served. Not confirmed, and kept in, as August's figures were not
   screened for this either.
6. **Five waits of −0.02 minutes** (called one second before the ticket was printed, all
   at Cash Transaction on 28 September) — a clock quirk. Kept; no effect at one decimal.

### The three totals do not match, and that is correct

| | |
|---|---|
| Tickets issued | **5,956** |
| less those never completed | −153 |
| **Transactions processed** | **5,803** |
| less those never closed, excluded from every timing | −69 |
| **Transactions with a usable time** | **5,734** |
| less any started outside 08:00–16:59 | −0 |
| **Total of the hourly figures, 08:00–16:00** | **5,734** |

The department and daily figures count **tickets issued** and sum to 5,956. The hourly
figures count **transactions with a usable time** and sum to 5,734. As in August, the hourly
charts are labelled "transactions" — do not relabel them "tickets".

### For charting

- Daily tickets, 2–30 September: 426, 259, 310, 371, 235, 285, 251, 327, 340, 255, 241,
  231, 294, 294, 253, 210, 254, 282, 327, 262, 249
- Hourly transactions, 08:00–16:00: 621, 959, 952, 648, 533, 743, 813, 373, 92
- Hourly average wait, 08:00–16:00: 15.6, 18.4, 17.8, 21.6, 20.3, 14.2, 12.8, 11.6, 6.4

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
| Called within 10 minutes | **66%** |
| Called within 30 minutes | **89%** |
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
- 2026-09 — **September figures in** (three exports supplied 8 October 2026): 5,956 tickets over 21 working days, 284 a day (August 265); 5,803 served; median wait 6.6 minutes (August 5.6); 59% called within 10 minutes (August 66%); worst hour still 11am. Members tagged at the kiosk: 2 of 5,956, so members served still cannot be counted. 153 tickets never completed and 69 never closed, the 69 excluded from timings. 1 September has no data — office closed for Araw ng Bukidnon (owner confirmed 8 October 2026).
- 2026-09 — **September exports pending.** Owner agreed on 7 October 2026 to supply the same three exports as August (visitors per department, members and visitors per day, transaction trail) into `intake/2026-09/`. Until they arrive, no September queuing figure exists — do not carry August's forward.
- 2026-09 — Owner's update, 15 September: **nothing further is outstanding with SCL Dura.** The only task left is a marketing video to be uploaded.
- 2026-08 — No change. The owner confirmed in the August intake that there was nothing to report. The system is still deployed and running, and the training for Administration and Marketing is **still waiting on a date to be agreed between BUGEMCO and SCL Dura**.
- 2026-07 — Deployed and running well. Some problems came up along the way, but the system is now stable. Training for Administration and Marketing has still not been run — BUGEMCO and SCL Dura have yet to agree a date.
- 2026-05 — Covered in the SCL Dura meeting alongside MIS
- 2026-05 — Covered in the SCL Dura meeting alongside MIS
