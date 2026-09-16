/**
 * Chart geometry. Pure functions only — these return SVG markup strings and
 * touch no DOM, so they can be unit-tested with plain Node.
 *
 * Fractions run 0..1 clockwise from 12 o'clock.
 */

export function polarToCartesian(cx, cy, r, fraction) {
  const angle = (fraction * 360 - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function arcPath(cx, cy, r, startFraction, endFraction) {
  // A full circle can't be drawn as one arc, so stop a hair short.
  const end = endFraction - startFraction >= 1 ? startFraction + 0.9999 : endFraction;
  const s = polarToCartesian(cx, cy, r, startFraction);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = end - startFraction > 0.5 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Ring chart. `slices` = [{label, value, color}].
 * `opts.centre` is the big figure printed in the middle.
 */
export function donut(slices, opts = {}) {
  const size = opts.size || 240;
  const r = size / 2 - 18;
  const c = size / 2;
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  let at = 0;
  const paths = slices.map((s, i) => {
    const frac = total > 0 ? Math.max(0, s.value) / total : 0;
    const d = arcPath(c, c, r, at, at + frac);
    at += frac;
    return `<path d="${d}" fill="none" stroke="${esc(s.color)}" stroke-width="26"` +
           ` stroke-linecap="butt" class="ch-arc" style="--i:${i}"><title>${esc(s.label)}: ${esc(s.value)}</title></path>`;
  }).join('');
  const centre = opts.centre
    ? `<text x="${c}" y="${c}" class="ch-centre" text-anchor="middle" dominant-baseline="central">${esc(opts.centre)}</text>`
    : '';
  const svg = `<svg class="ch-donut" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(opts.alt || 'Ring chart')}">${paths}${centre}</svg>`;

  // A ring of colours nobody can read is decoration. Every slice is listed
  // with its own figure and its share of the whole, so the chart can be read
  // from the back of the room without anyone guessing at the colours.
  const legend = slices.map((s) => {
    const pct = total > 0 ? Math.round((Math.max(0, s.value) / total) * 100) : 0;
    return `<li class="ch-key-row">` +
      `<span class="ch-key-dot" style="background:${esc(s.color)}"></span>` +
      `<span class="ch-key-label">${esc(s.label)}</span>` +
      `<span class="ch-key-val">${esc(s.value)}</span>` +
      `<span class="ch-key-pct">${pct}%</span></li>`;
  }).join('');

  return `<div class="ch-wrap">${svg}<ul class="ch-key">${legend}</ul></div>`;
}

/**
 * Trend line across months. `points` = [{label, value}].
 */
export function lineChart(points, opts = {}) {
  const n = points.length;
  const values = points.map((p) => p.value);

  /* ── PRECISION IS THE CALLER'S TO SET ──────────────────
     `toLocaleString('en-US')` with no options drops a trailing zero, so a
     series measured in tenths of a minute printed
        12.2, 10.2, 11, 13.5, 19.1, 10.9, 5.8, 5, 2.1
     — two of its nine figures silently rounded, on a chart whose entire point
     is the tenths. The series is printed to the most decimal places any of its
     own values carries, so the figures read as one column at a glance rather
     than as nine separate numbers. Integers stay integers; the grouping
     separator is kept, because 5,410 is easier to read across a room. */
  const dp = Math.min(4, values.reduce((most, v) => {
    const s = String(v);
    const dot = s.indexOf('.');
    return Math.max(most, dot === -1 ? 0 : s.length - dot - 1);
  }, 0));
  const fmt = (v) => Number(v).toLocaleString('en-US', {
    minimumFractionDigits: dp, maximumFractionDigits: dp
  });

  /* ── THE BASELINE COMES FROM THE DATA, NOT FROM A HARD ZERO ──
     It was `Math.min(...values, 0)`. A forced zero floor wastes the plot on any
     series that never goes near zero: August's visitors-a-day run 207–382, so
     the line lived in the top 46% of the box with 55% of the card empty white,
     and the shape the chart exists to show was squeezed into half the height it
     was given.

     THE RULE, in three parts, because each part alone is wrong:
       1. The window is the data's own range, plus a tenth of that range of air
          above and below — so the line uses its height and no point is welded
          to an edge.
       2. That window is then widened about the middle of the data until it is
          at least 35% of the largest value. This is the guard against the
          opposite fault: 100, 101, 102 would otherwise be stretched into a
          dramatic zigzag and read as a crisis. At 35% a 2-in-102 wobble
          occupies about a twentieth of the plot and still reads as flat, while
          August's 46% spread fills it properly.
       3. A series of counts is never drawn below zero.
     Because the baseline is no longer zero, the HEIGHT of the line is not the
     SIZE of the number — which is exactly why every point carries its own value
     as printed text. The figures are read; the line carries the shape. */
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const air = (hi - lo) * 0.1;
  let min = lo - air;
  let max = hi + air;
  const flat = Math.abs(hi) * 0.35;
  if (max - min < flat) {
    const mid = (lo + hi) / 2;
    min = mid - flat / 2;
    max = mid + flat / 2;
  }
  if (lo >= 0 && min < 0) min = 0;
  const range = max - min || 1;

  /* ── THE BOX GROWS WITH THE NUMBER OF POINTS ───────────
     A fixed 640-unit viewBox gave ten points 63 units of pitch, and "10 Aug"
     needs about 67 — the last five dates on the visitors chart physically
     overlapped and read as one run of ink: "10 Aug11 Aug12 Aug13 Aug14 Aug".
     76 units per point is the widest six-character date at .ch-xlabel's size
     plus a gap, so the dates cannot collide however many points a month plots.
     640 stays the floor, so a short series keeps the proportions it has always
     had. report.css caps the SCALE rather than the width (see --ch-w), so a
     wider chart is drawn wider and its type stays exactly the same size.

     The vertical padding is a budget, not a margin:
       padTop    46  one value label above the highest point (17 lift + 21 type)
       padBottom 76  one value label BELOW the lowest point, then the date row */
  const padX = 42, padTop = 46, padBottom = 76, pitch = 76;
  const w = opts.width || Math.max(640, padX * 2 + pitch * Math.max(1, n - 1));
  const h = opts.height || 290;
  const plotH = h - padTop - padBottom;
  const stepX = n > 1 ? (w - padX * 2) / (n - 1) : 0;
  const xy = points.map((p, i) => ({
    x: padX + i * stepX + (n === 1 ? (w - padX * 2) / 2 : 0),
    y: h - padBottom - ((p.value - min) / range) * plotH,
    p
  }));
  const line = xy.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const dots = xy.map((q, i) =>
    `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="5" class="ch-dot" style="--i:${i}">` +
    `<title>${esc(q.p.label)}: ${esc(fmt(q.p.value))}</title></circle>`).join('');

  /* ── THE VALUE LABEL GETS OUT OF THE LINE'S WAY ────────
     The value is printed at every point: a shape that only shows a direction
     makes the reader ask "how much?" and the chart cannot answer.

     The lift used to be a flat `q.y - 17`, which put eight of them straight
     through the line — dark green numerals over a dark green stroke, on three
     different charts. A label above a point is only safe while the line is not
     up there, and at a valley it always is.

     So each label asks how far the line climbs, and how far it falls, across
     the label's own width. Above is preferred, because a figure under its point
     reads as belonging to the point below it; below is used when the line is in
     the way above; and when both sides are crossed — a steep straight run — the
     label takes the smaller intrusion and is lifted clear of it. Both ends are
     clamped so a label can never leave the top of the box or drop into the row
     of dates. */
  const CHAR = 11.4;   // one figure's advance at .ch-value's base size
  const LIFT = 17;     // the gap off the dot this label has always had
  const CAP  = 15;     // cap height of the same type
  const CLEAR = 4;     // half the line's 3.5-unit stroke, and a hair over
  const reach = (i, dir) => {
    const q = xy[i];
    const half = (fmt(values[i]).length * CHAR) / 2;
    let worst = 0;
    for (const j of [i - 1, i + 1]) {
      if (j < 0 || j >= n) continue;
      const nb = xy[j];
      const span = Math.abs(nb.x - q.x);
      const t = span > 0 ? Math.min(1, half / span) : 0;
      const yAt = q.y + (nb.y - q.y) * t;
      worst = Math.max(worst, dir < 0 ? q.y - yAt : yAt - q.y);
    }
    return worst;
  };
  const valueLabels = xy.map((q, i) => {
    const up = reach(i, -1), down = reach(i, 1);
    // The stroke has width, so "just touching" is a collision: the line has to
    // stay CLEAR of the label's bottom edge, not merely short of it.
    const above = up + CLEAR <= LIFT || up <= down;
    const gap = Math.max(LIFT, (above ? up : down) + 9);
    const y = Math.min(
      Math.max(above ? q.y - gap : q.y + gap + CAP, 24),
      h - padBottom + 32
    );
    return `<text x="${q.x.toFixed(1)}" y="${y.toFixed(1)}" class="ch-value" text-anchor="middle">` +
      `${esc(fmt(q.p.value))}</text>`;
  }).join('');
  const labels = xy.map((q) =>
    `<text x="${q.x.toFixed(1)}" y="${h - 14}" class="ch-xlabel" text-anchor="middle">${esc(q.p.label)}</text>`).join('');
  // --ch-w hands the chart's natural width to the stylesheet. It is the one
  // thing CSS cannot read off a viewBox, and without it every chart on a page
  // is scaled by a different amount and its type comes out a different size.
  return `<svg class="ch-line" viewBox="0 0 ${w} ${h}" style="--ch-w:${w}"` +
    ` role="img" aria-label="${esc(opts.alt || 'Trend over time')}">` +
    `<polyline points="${line}" fill="none" class="ch-path"/>${dots}${valueLabels}${labels}</svg>`;
}

/**
 * A scale showing where a measured value sits against a limit.
 *
 * For "3.69 hours against a target of 24 hours or less" — a sentence nobody
 * pictures. Drawn, the answer is obvious at a glance: the marker sits near the
 * left-hand end of a bar whose right-hand end is the limit.
 *
 * `good` is 'low' when small numbers are better (response time, click rate).
 */
export function gauge({ value, max, label, unit = '', good = 'low', caption = '' }) {
  const w = 640, h = 96, pad = 24;
  const span = w - pad * 2;
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const x = pad + span * frac;
  const bandEnd = pad + span * (good === 'low' ? frac : 1);
  const pct = Math.round(frac * 100);

  return `<figure class="gauge">
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}: ${esc(value)}${esc(unit)} of a limit of ${esc(max)}${esc(unit)}">
      <rect x="${pad}" y="38" width="${span}" height="16" rx="8" class="gauge-track"/>
      <rect x="${pad}" y="38" width="${(bandEnd - pad).toFixed(1)}" height="16" rx="8" class="gauge-band"/>
      <line x1="${w - pad}" y1="28" x2="${w - pad}" y2="64" class="gauge-limit"/>
      <text x="${w - pad}" y="82" class="gauge-limit-label" text-anchor="end">limit ${esc(max)}${esc(unit)}</text>
      <circle cx="${x.toFixed(1)}" cy="46" r="11" class="gauge-marker"/>
      <text x="${x.toFixed(1)}" y="22" class="gauge-value" text-anchor="middle">${esc(value)}${esc(unit)}</text>
      <text x="${pad}" y="82" class="gauge-limit-label">0</text>
    </svg>
    <figcaption>${esc(caption || label)} — <strong>${pct}%</strong> of the limit.</figcaption>
  </figure>`;
}

/**
 * A ring for "N of M", with the count in the middle.
 *
 * Two slices only. Used where a share of a whole is the whole story and a full
 * legend would be more furniture than fact.
 */
export function progressRing({ value, total, label, size = 190 }) {
  const done = Math.max(0, Math.min(value, total));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = size / 2 - 16;
  const c = size / 2;
  const frac = total > 0 ? done / total : 0;
  const arc = arcPath(c, c, r, 0, frac);
  return `<figure class="pring">
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}: ${done} of ${total}, ${pct} percent">
      <circle cx="${c}" cy="${c}" r="${r}" class="pring-track" fill="none" stroke-width="20"/>
      <path d="${arc}" class="pring-arc ch-arc" fill="none" stroke-width="20" stroke-linecap="round"/>
      <text x="${c}" y="${c - 8}" class="pring-num" text-anchor="middle">${done}<tspan class="pring-of">/${total}</tspan></text>
      <text x="${c}" y="${c + 22}" class="pring-pct" text-anchor="middle">${pct}%</text>
    </svg>
    <figcaption>${esc(label)}</figcaption>
  </figure>`;
}

/**
 * The stages a set of things is spread across, as a row of steps.
 *
 * `stages` = [{label, value, color}], given in order. This is the shape for
 * "ten systems, spread across four stages of work" — a pipeline reads as a
 * journey, which a ring cannot.
 */
export function stageFlow(stages, opts = {}) {
  const total = stages.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const steps = stages.map((s, i) => {
    const pct = total > 0 ? Math.round((Math.max(0, s.value) / total) * 100) : 0;
    return `<li class="stage" style="--i:${i}">
      <span class="stage-bar" style="background:${esc(s.color)}"></span>
      <span class="stage-num">${esc(s.value)}</span>
      <span class="stage-label">${esc(s.label)}</span>
      <span class="stage-pct">${pct}%</span>
    </li>`;
  }).join('');
  return `<ol class="stage-flow" aria-label="${esc(opts.alt || 'Stages')}">${steps}</ol>`;
}

/**
 * Horizontal progress bar against an annual target.
 */
export function targetBar({ label, actual, target, unit = '', alt = '', pace = null }) {
  // Floored at 0, but NOT capped at the top. A negative percentage is invalid
  // CSS, so the browser drops the declaration and the bar falls back to
  // width:auto — which renders as completely FULL. A bar showing the opposite
  // of the truth is worse than one showing nothing, so the floor matters.
  //
  // The FIGURE and the BAR are now two different numbers on purpose. A target
  // beaten 11 times out of 10 used to print "100%" beside the words "11 of 10",
  // so the slide contradicted itself in the space of twenty pixels. The pill now
  // says 110% and only the bar is capped, because a bar cannot be longer than
  // its groove but a number can be larger than its target.
  const raw  = target > 0 ? Math.round((actual / target) * 100) : (actual > 0 ? 100 : 0);
  const pct  = Math.max(0, raw);
  const fill = Math.min(100, pct);
  // `pace` is how much of the year has gone — 67 at the end of August. Without
  // it nothing is called behind, because being short of an annual total in March
  // is not the same as being behind, and guessing which is which is how a report
  // ends up telling Mancom something nobody measured.
  // Four states, not three. A target BEATEN and a target exactly MET were both
  // called 'ahead', so "11 of 10" and "5 of 5" painted identically and the
  // attribute bought nothing on screen.
  const state = pct > 100 ? 'ahead'
              : pct === 100 ? 'met'
              : (pace != null && pct < pace) ? 'behind'
              : 'on-track';
  // Colour is never the only carrier: every bar prints "n of m" and its
  // percentage as text, so the state attribute only adds emphasis.
  // Hand the pace out to CSS as well as using it here. Without it the stylesheet
  // has nothing to position a pace marker against, and the quarter gridlines get
  // mistaken for one — a tick at 75% read as "where we should be" on a page whose
  // real pace was 67%.
  return `<div class="tbar" data-state="${state}"` +
    (pace != null ? ` style="--pace:${Math.max(0, Math.min(100, pace))}%" data-pace="${pace}"` : '') +
    (alt ? ` role="group" aria-label="${esc(alt)}"` : '') + `><div class="tbar-head">` +
    `<span class="tbar-label">${esc(label)}</span>` +
    `<span class="tbar-value">${esc(actual)}${esc(unit)} of ${esc(target)}${esc(unit)}` +
    `<span class="tbar-pct">${pct}%</span></span></div>` +
    `<div class="tbar-track"><div class="tbar-fill" style="--fill:${fill}%" width="${fill}%"></div></div></div>`;
}
