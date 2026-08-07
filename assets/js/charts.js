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
  const w = opts.width || 640, h = opts.height || 240, pad = 36;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => ({
    x: pad + i * stepX + (points.length === 1 ? (w - pad * 2) / 2 : 0),
    y: h - pad - ((p.value - min) / range) * (h - pad * 2),
    p
  }));
  const line = xy.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const dots = xy.map((q, i) =>
    `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="5" class="ch-dot" style="--i:${i}">` +
    `<title>${esc(q.p.label)}: ${esc(q.p.value)}</title></circle>`).join('');
  // The value is printed at every point. A shape that only shows a direction
  // makes the reader ask "how much?" and the chart cannot answer.
  const valueLabels = xy.map((q) =>
    `<text x="${q.x.toFixed(1)}" y="${(q.y - 14).toFixed(1)}" class="ch-value" text-anchor="middle">` +
    `${esc(q.p.value.toLocaleString('en-US'))}</text>`).join('');
  const labels = xy.map((q) =>
    `<text x="${q.x.toFixed(1)}" y="${h - 10}" class="ch-xlabel" text-anchor="middle">${esc(q.p.label)}</text>`).join('');
  return `<svg class="ch-line" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.alt || 'Trend over time')}">` +
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
export function targetBar({ label, actual, target, unit = '' }) {
  // Clamped at BOTH ends, not just the top. A negative percentage is invalid
  // CSS, so the browser drops the declaration and the bar falls back to
  // width:auto — which renders as completely FULL. A bar showing the opposite
  // of the truth is worse than one showing nothing, so the floor matters.
  const raw = target > 0 ? Math.round((actual / target) * 100) : (actual > 0 ? 100 : 0);
  const pct = Math.max(0, Math.min(100, raw));
  return `<div class="tbar"><div class="tbar-head">` +
    `<span class="tbar-label">${esc(label)}</span>` +
    `<span class="tbar-value">${esc(actual)}${esc(unit)} of ${esc(target)}${esc(unit)}` +
    `<span class="tbar-pct">${pct}%</span></span></div>` +
    `<div class="tbar-track"><div class="tbar-fill" style="--fill:${pct}%" width="${pct}%"></div></div></div>`;
}
