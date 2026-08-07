# How numbers are shown in this report

One shape per kind of fact, used in every section of every month.

The point is that the Mancom can scan it. If a figure looks a certain way,
they already know what kind of thing it is without reading the label. It also
means two months can be put side by side and compared honestly.

This is a rule, not a suggestion. Every agent that builds or edits a report
follows it.

---

## 1. Every section opens with a summary strip

The first thing in every section is a row of three or four headline numbers —
the facts that matter most in that section. The detail comes underneath.

Someone in a hurry reads only the strips and still has the whole month.
Someone who wants depth scrolls on.

```html
<div class="summary-strip">
  <div class="metric metric--good">
    <p class="metric-num"><span data-count="5">0</span></p>
    <p class="metric-label">Staff who clicked</p>
    <p class="metric-note">
      <span class="tag tag--lower">Lower is better</span>
      5 of 120 staff clicked the test email (4.2%).
    </p>
  </div>
  ...
</div>
```

The coloured edge says how it is going, at a glance:

| Class | Edge | Use when |
|---|---|---|
| `metric--good` | green | at or better than target |
| `metric--watch` | yellow | moving, nothing wrong |
| `metric--behind` | orange | behind where it should be |
| `metric--risk` | red | needs a decision from management |
| `metric--unknown` | grey | not measured |

---

## 2. One shape per kind of fact

| The fact is… | Show it as | Class |
|---|---|---|
| A single headline number | Metric tile, counting up | `.metric` |
| A share of a whole | Donut, figure in the centre | `donut()` |
| How far a system has got | Progress bar with modules done vs total | `.pbar` |
| Progress against an annual target | Target bar, colour-coded by pace | `.tbar` |
| A change across months | Line chart | `lineChart()` |
| Where something stands | Status badge, five states only | `.badge` |
| A list of things done | Ticked list | `.checks` |
| Something not measured | "Not recorded" panel | `.not-recorded` |

Do not invent a new shape. If a fact does not fit one of these, that is worth
a conversation about the standard, not a one-off design.

---

## 3. Four rules that apply to every figure, with no exceptions

### Always state the unit in words

Never a bare percentage.

- **Yes:** "5 of 120 staff clicked the test email (4.2%)"
- **No:** "4.2%"

This is not fussiness. The department already holds two documents that record
the phishing result in opposite directions — one as a failure rate, one as a
pass rate — and nobody can now tell which is which. Writing the sentence out
makes that impossible.

### Always name the period when it is not simply the report month

Use `<span class="tag tag--period">…</span>`.

The May 2026 security figures actually covered campaigns running to 17 June.
Presented as "May" they would have been wrong. Presented with the period shown,
they are useful.

### Always mark lower-is-better figures

Use `<span class="tag tag--lower">Lower is better</span>`.

Without it, "0 security breaches" and "0 policies approved" look like the same
result. One is the best possible outcome and the other is a problem.

### Never show a number that is not in a tracking file

If it is not written down in `tracking/`, it does not appear on the page. If
the owner said "most of it is done", ask for a figure — do not write 80%.

---

## 4. If there is no data, leave it out

**Owner's instruction, August 2026:** *"do not include if no data, and do not let the
reader wonder what you are talking about — just mention the list or item if needed."*

This overrides the older habit of putting a "Not recorded" panel everywhere a figure was
missing. Those panels multiplied until the page was explaining its own gaps more often
than it was reporting work. The report is for a management committee, not a record of
what the department failed to write down.

So:

- **Default: say nothing.** A system with no progress figure simply shows what it did.
- **Prefer a plain list over a paragraph.** Items, not commentary about the items.
- **Only name a gap when the gap is itself the finding** — for example, phishing testing
  being switched off, which is a real state of the world the Mancom must act on.

Missing data still never becomes a zero. It just stops being announced.

## 4b. When absence really is the story

A blank cell invites the reader to treat it as zero. Say it plainly instead,
and say what would have to happen for a figure to appear next month.

```html
<div class="not-recorded">
  <h3>Not recorded</h3>
  <p>The May deck reported this to Mancom as a screenshot only, with no
     figures. Recording the ticket counts each month would let this section
     show real numbers from next month on.</p>
</div>
```

This is the honest option and it is always available. It is never acceptable
to fill a gap with a plausible-looking number.

---

## 5. Motion: every reveal replays

**Owner's instruction, August 2026:** the animation must run again each time a section
comes back on screen — the same way it runs when the report is first opened — and it must
be smooth. This is the standard for every month.

How it works, so nobody undoes it by accident:

- `site.js` never unobserves a revealed element. Coming into view adds `is-revealed` and
  fires the `reveal` event; going out of view removes the class and calls `rearm()`.
- `rearm()` clears the done-flags the motion layer stamps on counters and bars, and puts
  them back to their opening state. Without it, a section returned to would fade in with
  its numbers already landed, which looks broken rather than finished.
- Reveals animate `translate` and `opacity` as **separate properties**, never `transform`.
  A filling animation on `transform` pins it and kills the 3D tilt on cards.
- Calm mode (press **C**) still flattens everything while preserving every value.

## 6. Charts must show their numbers

Every chart carries its own figures. A shape that shows only a direction makes the reader
ask "how much?" and cannot answer.

- **Ring charts** carry a key listing each slice with its value and its percentage.
- **Line charts** print the value at every point, not just the month on the axis.
- **Target bars** show "actual of target" *and* the percentage achieved.

## 7. Where a figure came from

If a number was read off a screenshot rather than taken from a tracking file,
say so with `<span class="tag tag--source">…</span>`. A reader should never
have to wonder whether a figure is measured or inferred.

## 8. Screenshots of a system

**Owner's instruction, August 2026:** screenshots of the in-house systems go into the
section of the system they belong to, and they have to look like part of the report
rather than a picture pasted into it.

The standard, so this is the same in every month:

- **Every screenshot is mounted in a window frame** — a title bar naming the screen,
  then the image, then a caption in the report's own voice. Without a boundary the
  reader cannot tell where the report stops and the pictured system starts.
- **The frame is a real `<button>`** (`.shot-frame`), so the full image is one click
  or one Enter away. Shrunk into a card, no dashboard is legible on a projector.
- **A system with screens gets a full-width row** (`.sys`): the written account on the
  left, the screens on the right. Two screenshots stacked in a half-width card come out
  around 280px wide projected, which is a picture of a dashboard, not a dashboard.
- **The caption says whether the figures are real.** Most of these systems are shown
  with test data. A reader who assumes a demo figure is the coop's actual position has
  been misled by the report, not by the system.
- **Alt text describes the screen, not the file.** "The CAC-IIS dashboard: a ring
  showing 98 per cent collected…", never "screenshot 1".

### The crop is a redaction, and it is checked every time

`tools/prepare-system-shots.ps1` crops before it resizes, and the crop is the point.
Two of July's captures could not be published as taken:

- The Mart admin console ends in a **Watchlist** table listing real members by name,
  with their account number and how much they owe. Cropped off entirely.
- The CAC-IIS dashboard breaks collections down **branch by branch**. Only the top row
  is kept.

Originals go to `private/raw-screenshots/<month>/`, which is gitignored, so nothing is
lost and the untouched versions never reach the public repository.

Nothing is ever painted over or altered — every crop removes a whole region from the
edge of the frame. Doctoring the inside of a screenshot of a real system is falsifying
a record, however small the change.

`tools/check-shots.mjs` re-checks it in a browser on every run: it fails if a screenshot
does not load, renders under 380px wide, has thin alt text or no caption, cannot be
opened from the keyboard, or if the word "Watchlist" or an email address reaches the
page text. Run it before any month is published.

Months built before this standard (May 2026, and `templates/month.html`) put the image
and caption straight inside a clickable `<figure class="shot">`. That pattern still works
and is still styled — `effects.js` binds both, and a published month whose screenshots
quietly stopped enlarging would be a regression nobody was watching for. New months use
the frame.
