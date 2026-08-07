# ICT Monthly Report Web Presentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, hand-coded web presentation system that turns the BUGEMCO ICT Department's monthly PowerPoint report into an interactive, animated slide deck published to GitHub Pages, backed by plain-text progress tracking tied to the 2026 BSC and Deliverables.

**Architecture:** A shared `assets/` layer (brand tokens, slide engine, effects, charts) is written once and reused by every month. Each month is a self-contained static `reports/YYYY-MM-name/index.html` that loads those shared assets. Numbers shown in a report must first exist in a `tracking/` Markdown file, which is the single source of truth across months. Pure logic (chart geometry, tracking-file parsing, target pacing) lives in ES modules that Node can import directly, so it is unit-tested with the zero-dependency `node --test` runner. The DOM and visual layers are verified in a real browser via Playwright.

**Tech Stack:** Vanilla HTML5, CSS3 (custom properties, `backdrop-filter`, CSS transforms), ES modules. No framework, no bundler, no build step for the deliverable. Node 20 (`node --test`) for development tests only. PowerShell + System.Drawing for image processing. Playwright for browser verification. Git + `gh` CLI for publishing.

**Spec:** `docs/superpowers/specs/2026-08-06-ict-monthly-report-web-design.md`

---

## Ground rules for every task

1. **The deliverable never requires an install.** `reports/*/index.html` must open by double-click, offline, on a machine with nothing but a browser. Node is a development convenience only; nothing in `assets/` may import from `node_modules`.
2. **Plain language.** Every user-facing string, comment in a tracking file, and line of `START-HERE.md` is written for a non-technical manager.
3. **Commit after every task.** Message trailer on every commit:
   `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
4. **Never publish without the gate.** No `git push` in any task except Task 30, and only on the user's explicit word.
5. **Absolute dates only.** Never "last month" — write `2026-07`.

---

## File structure

| Path | Responsibility |
|---|---|
| `assets/css/tokens.css` | Brand colours, type scale, spacing, z-index layers. Nothing else. |
| `assets/css/report.css` | Slide frame, the seven slide types, cards, badges, bars. Layout only. |
| `assets/css/effects.css` | Keyframes, transitions, parallax/tilt/particle styling. Motion only. |
| `assets/js/engine.js` | Slide navigation, keyboard/wheel/click input, overview grid, fullscreen, presenter notes. Owns "which slide is showing". |
| `assets/js/effects.js` | Parallax, particles, 3D tilt, count-ups, calm mode. Owns "how things move". Never changes which slide is showing. |
| `assets/js/charts.js` | Pure functions returning SVG markup strings. No DOM, no globals. Unit-tested. |
| `assets/js/boot.js` | The only script a month page includes. Wires engine + effects + charts together. |
| `tools/lib/tracking.js` | Parses `tracking/*.md` into data. Pure. Unit-tested. |
| `tools/lib/pace.js` | Works out whether an annual target is on track for the month. Pure. Unit-tested. |
| `tools/test/*.test.js` | `node --test` suites. |
| `tools/optimize-screenshots.ps1` | Crops/resizes/compresses `intake/` into a month's `img/`. |
| `templates/month.html` | The skeleton a new month is copied from. |
| `reports/YYYY-MM-name/index.html` | One month. Self-contained markup; no logic. |
| `tracking/**.md` | Source of truth for every number. |
| `private/` | Never uploaded. |

**Boundary rule:** `engine.js` and `effects.js` must not import each other. They communicate only through DOM events (`slide:enter`, `slide:leave`, `calm:change`) dispatched on `document`. This keeps calm mode able to kill all motion without touching navigation.

---

# PHASE 0 — Foundation

### Task 1: Scaffold folders and the plain-English guide

**Files:**
- Create: `START-HERE.md`
- Create: `.gitattributes`
- Create: empty-keeping `.gitkeep` files across the tree

- [ ] **Step 1: Create the folder tree**

```powershell
$root = '<project root>'
$dirs = @(
  'assets\css','assets\js','assets\img','assets\fonts',
  'reports','templates','tools\lib','tools\test',
  'tracking\projects','tracking\infosec','tracking\support-network','tracking\team','tracking\targets',
  'private\raw-screenshots','intake',
  '.claude\agents','.claude\skills'
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $root $d) | Out-Null }
foreach ($d in 'reports','intake','private\raw-screenshots','assets\img','assets\fonts') {
  $k = Join-Path $root "$d\.gitkeep"; if (-not (Test-Path $k)) { New-Item -ItemType File -Path $k | Out-Null }
}
Get-ChildItem $root -Directory -Recurse | Select-Object -ExpandProperty FullName
```

Expected: prints every folder above. `private\` and `intake\` exist on disk but are gitignored.

- [ ] **Step 2: Write `.gitattributes`**

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.webp binary
*.woff2 binary
```

- [ ] **Step 3: Write `START-HERE.md`**

```markdown
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
| `reports\` | The finished report for each month. Double-click any `index.html` to open it. |
| `assets\` | The shared design — backgrounds, fonts, animations. Improving this improves every month at once. |
| `tracking\` | Plain text notes on every system, security activity, and target. This is the department's memory. You can open and edit these in Notepad. |
| `intake\` | Where you drop screenshots. Cleared out after each month is built. |
| `private\` | **Never goes online.** Personal performance notes and original unedited screenshots. |
| `templates\` | The blank starting point a new month is copied from. Don't edit unless changing the design. |

## Presenting

Open the month's `index.html` and press **F** for fullscreen.

| Key | Does |
|---|---|
| Right arrow, Space, mouse wheel down, or click | Next slide |
| Left arrow or wheel up | Previous slide |
| **F** | Fullscreen on/off |
| **Esc** | See all slides at once, click one to jump there |
| **C** | Calm mode — turns off the heavy animation if the projector is struggling |
| **P** | Show your speaker notes |

## The one rule

**A number never appears in a report unless it is first written in a `tracking\` file.**
That is what stops July from contradicting May.

## If something breaks

Open this folder in Claude Code and describe what you see. Nothing here is fragile —
the reports are plain files, and every past month keeps working even if the design changes.
```

- [ ] **Step 4: Verify the ignore rules actually hold**

```powershell
cd '<project root>'
'secret' | Out-File private\leak-test.txt
git status --porcelain --ignored private\ intake\
```

Expected: lines beginning `!!` for `private/` and `intake/` (ignored), and **no** `??` line for `private/leak-test.txt`.

- [ ] **Step 5: Remove the test file and commit**

```powershell
Remove-Item 'private\leak-test.txt'
git add -A
git commit -m "chore: scaffold folder structure and plain-English guide"
```

---

### Task 2: Set up the zero-dependency test runner

**Files:**
- Create: `tools/test/smoke.test.js`
- Create: `package.json`

- [ ] **Step 1: Write the failing test**

`tools/test/smoke.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from '../lib/smoke.js';

test('the test runner works', () => {
  assert.equal(hello(), 'ok');
});
```

- [ ] **Step 2: Create `package.json` so `.js` files are treated as ES modules**

```json
{
  "name": "ict-monthly-report",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tools/test/"
  }
}
```

Note: this file exists purely so Node treats `.js` as modules and to hold the test command. **No dependencies are ever added to it.** The published site does not read it.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module ... tools/lib/smoke.js`

- [ ] **Step 4: Write the minimal implementation**

`tools/lib/smoke.js`:

```javascript
export function hello() {
  return 'ok';
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: `# pass 1`, `# fail 0`

- [ ] **Step 6: Commit**

```powershell
git add package.json tools/
git commit -m "test: add zero-dependency node:test runner"
```

---

# PHASE 1 — Brand assets

### Task 3: Extract and optimise the three backgrounds

**Files:**
- Create: `assets/img/bg-title.jpg`, `assets/img/bg-content.jpg`, `assets/img/bg-closing.jpg`
- Create: `tools/extract-backgrounds.ps1`

Source: `the March monthly report PowerPoint (kept outside this repository)` → `ppt/media/image2.png` (title), `image1.png` (content), `image9.png` (closing). All 4800×2700 PNG.

- [ ] **Step 1: Write `tools/extract-backgrounds.ps1`**

```powershell
# Pulls the three standard backgrounds out of the March template and writes
# web-sized JPEGs into assets\img\. Re-runnable and safe.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root  = Split-Path -Parent $PSScriptRoot
$pptx  = 'the March monthly report PowerPoint (kept outside this repository)'
$work  = Join-Path $env:TEMP 'bugemco-bg'
$outDir = Join-Path $root 'assets\img'

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $work, $outDir | Out-Null
Copy-Item $pptx (Join-Path $work 'src.zip')
Expand-Archive (Join-Path $work 'src.zip') (Join-Path $work 'x')

$map = @{ 'image2.png' = 'bg-title.jpg'; 'image1.png' = 'bg-content.jpg'; 'image9.png' = 'bg-closing.jpg' }
$targetWidth = 2560   # plenty for a 1080p or 1440p projector; ~7x smaller than source

foreach ($k in $map.Keys) {
    $src = Join-Path $work "x\ppt\media\$k"
    if (-not (Test-Path $src)) { throw "Missing $k in template" }
    $img = [System.Drawing.Image]::FromFile($src)
    $w = $targetWidth
    $h = [int][math]::Round($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h)

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 86L)
    $bmp.Save((Join-Path $outDir $map[$k]), $codec, $ep)

    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    $sizeKb = [math]::Round((Get-Item (Join-Path $outDir $map[$k])).Length / 1KB)
    "$($map[$k])  ${w}x${h}  ${sizeKb} KB"
}
Remove-Item $work -Recurse -Force
```

- [ ] **Step 2: Run it**

Run: `powershell -File tools\extract-backgrounds.ps1`
Expected: three lines, each `2560x1440`, each well under 900 KB.

- [ ] **Step 3: Verify visually**

Open each of the three JPEGs and confirm: title has capsules top-left + right edge with logo top-right; content has small logo top-left with capsules top-right + bottom-left; closing is the full-colour building with "SALAMAT SA GUGMA!".

- [ ] **Step 4: Commit**

```powershell
git add tools/extract-backgrounds.ps1 assets/img/
git commit -m "feat: extract the three standard backgrounds from the March template"
```

---

### Task 4: Self-host the Inter font

**Files:**
- Create: `assets/fonts/inter-variable.woff2`, `assets/fonts/OFL.txt`
- Create: `assets/css/fonts.css`

The template uses **Aptos Black**, which is Microsoft-licensed and must not be redistributed in a public repository. **Inter** (SIL Open Font License) is the closest free match and is legal to host.

- [ ] **Step 1: Fetch Inter without adding a dependency**

```powershell
cd $env:TEMP
npm pack @fontsource-variable/inter@5.2.5
tar -xf fontsource-variable-inter-5.2.5.tgz
$dst = '<project root>\assets\fonts'
Copy-Item 'package\files\inter-latin-wght-normal.woff2' "$dst\inter-variable.woff2"
Copy-Item 'package\LICENSE' "$dst\OFL.txt"
Get-Item "$dst\inter-variable.woff2" | Select-Object Name, Length
```

Expected: a `.woff2` roughly 100–350 KB. `npm pack` downloads a tarball without installing anything into the project.

**If this fails (no internet):** skip this task and in Task 5 set
`--font-head: 'Segoe UI Black', 'Arial Black', system-ui, sans-serif;`
The design degrades gracefully; revisit when online.

- [ ] **Step 2: Write `assets/css/fonts.css`**

```css
/* Inter — SIL Open Font License. See assets/fonts/OFL.txt
   Chosen as the closest free web match to Aptos Black used in the
   PowerPoint template. Self-hosted so the report works with no internet. */
@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 3: Verify it loads**

Create a scratch HTML file linking `fonts.css` with `<p style="font-family:Inter;font-weight:900">BUGEMCO</p>`, open it, and confirm the heavy weight renders. Delete the scratch file.

- [ ] **Step 4: Commit**

```powershell
git add assets/fonts/ assets/css/fonts.css
git commit -m "feat: self-host Inter as the licensed stand-in for Aptos Black"
```

---

### Task 5: Brand tokens

**Files:**
- Create: `assets/css/tokens.css`

Values below were sampled pixel-by-pixel from the template backgrounds, not guessed.

- [ ] **Step 1: Write `assets/css/tokens.css`**

```css
/* ─────────────────────────────────────────────────────────────
   BUGEMCO brand tokens.
   Colours sampled directly from the PowerPoint template artwork.
   Change a value here and every month's report updates.
   ───────────────────────────────────────────────────────────── */
:root {
  /* Brand — from the capsule stripes and the SALAMAT SA GUGMA lettering */
  --green:        #006633;
  --green-deep:   #004D26;
  --green-light:  #2E8B57;
  --yellow:       #FAFA00;
  --yellow-warm:  #F5C518;

  /* COOP logo palette — used only for chart series, never for chrome */
  --coop-blue:    #0848A0;
  --coop-orange:  #F06020;
  --coop-red:     #E81838;
  --coop-sky:     #1880C0;

  /* Surfaces */
  --card:         rgba(255, 255, 255, 0.82);
  --card-solid:   #FFFFFF;
  --card-edge:    rgba(0, 102, 51, 0.18);
  --ink:          #22282B;
  --ink-soft:     #5A6468;
  --ink-faint:    #8B9498;

  /* Status */
  --st-done:      #006633;
  --st-progress:  #F5C518;
  --st-delayed:   #E8721A;
  --st-none:      #9AA3A7;
  --st-risk:      #E81838;

  /* Type */
  --font-head: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --fs-title:    clamp(2.2rem, 4.2vw, 3.5rem);
  --fs-section:  clamp(1.3rem, 1.9vw, 1.75rem);
  --fs-body:     clamp(1rem, 1.15vw, 1.15rem);
  --fs-caption:  0.8rem;
  --fs-stat:     clamp(3rem, 6.5vw, 6rem);

  /* Spacing — one scale, used everywhere */
  --sp-1: 0.5rem;  --sp-2: 1rem;   --sp-3: 1.5rem;
  --sp-4: 2rem;    --sp-5: 3rem;   --sp-6: 4rem;
  --radius:      18px;
  --radius-pill: 999px;   /* the capsule motif */

  /* Layers — the stack from the spec */
  --z-photo: 0; --z-capsule: 1; --z-glow: 2; --z-particle: 3;
  --z-content: 10; --z-chrome: 20; --z-lightbox: 30;

  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 220ms; --dur-mid: 480ms; --dur-slow: 900ms;
}

/* Calm mode: one class on <html> flattens all motion. Set by effects.js. */
html.calm {
  --dur-fast: 1ms; --dur-mid: 1ms; --dur-slow: 1ms;
}
```

- [ ] **Step 2: Verify contrast meets the accessibility requirement**

`--ink` `#22282B` on `--card-solid` `#FFFFFF` = 14.8:1. `--card-solid` on `--green` `#006633` = 6.4:1. Both exceed WCAG AA (4.5:1). Confirm with any contrast checker; record the result in the commit message.

- [ ] **Step 3: Commit**

```powershell
git add assets/css/tokens.css
git commit -m "feat: add brand tokens sampled from the template artwork

Contrast verified: ink on white 14.8:1, white on green 6.4:1 (WCAG AA)."
```

---

### Task 6: Capsule motif as SVG

**Files:**
- Create: `assets/img/capsules-title.svg`, `assets/img/capsules-content.svg`

The capsule stripes are the brand's signature shape. Lifting them off the flat photo onto their own SVG layer is what makes the parallax possible.

- [ ] **Step 1: Write `assets/img/capsules-content.svg`**

Matches the content background: cluster top-right, cluster bottom-left. `viewBox` is 1920×1080 so it scales with the slide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g fill="none" stroke-linecap="round">
    <!-- top-right cluster -->
    <g transform="rotate(-38 1620 90)">
      <line x1="1400" y1="40"  x2="1760" y2="40"  stroke="#006633" stroke-width="34"/>
      <line x1="1480" y1="104" x2="1700" y2="104" stroke="#FAFA00" stroke-width="34"/>
      <line x1="1560" y1="168" x2="1880" y2="168" stroke="#006633" stroke-width="18"/>
      <line x1="1660" y1="228" x2="1820" y2="228" stroke="#FAFA00" stroke-width="18"/>
    </g>
    <!-- bottom-left cluster -->
    <g transform="rotate(-38 300 990)">
      <line x1="60"  y1="1040" x2="420" y2="1040" stroke="#006633" stroke-width="34"/>
      <line x1="140" y1="976"  x2="360" y2="976"  stroke="#FAFA00" stroke-width="34"/>
      <line x1="20"  y1="912"  x2="340" y2="912"  stroke="#006633" stroke-width="18"/>
      <line x1="100" y1="852"  x2="260" y2="852"  stroke="#FAFA00" stroke-width="18"/>
    </g>
  </g>
</svg>
```

- [ ] **Step 2: Write `assets/img/capsules-title.svg`**

Matches the title background: cluster top-left, longer sweep down the right edge.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g fill="none" stroke-linecap="round">
    <g transform="rotate(-38 200 100)">
      <line x1="20"  y1="30"  x2="380" y2="30"  stroke="#006633" stroke-width="36"/>
      <line x1="100" y1="96"  x2="320" y2="96"  stroke="#FAFA00" stroke-width="36"/>
      <line x1="-40" y1="162" x2="300" y2="162" stroke="#006633" stroke-width="20"/>
    </g>
    <g transform="rotate(-38 1640 620)">
      <line x1="1420" y1="380" x2="1900" y2="380" stroke="#006633" stroke-width="40"/>
      <line x1="1520" y1="456" x2="1820" y2="456" stroke="#FAFA00" stroke-width="40"/>
      <line x1="1460" y1="532" x2="1960" y2="532" stroke="#006633" stroke-width="22"/>
      <line x1="1600" y1="600" x2="1860" y2="600" stroke="#FAFA00" stroke-width="22"/>
      <line x1="1540" y1="668" x2="1920" y2="668" stroke="#006633" stroke-width="30"/>
    </g>
  </g>
</svg>
```

- [ ] **Step 3: Verify against the source**

Open `assets/img/bg-content.jpg` and `capsules-content.svg` side by side at the same size. The SVG clusters must sit in the same corners at roughly the same angle. Nudge the `rotate()` origin and line coordinates until they do. Exact pixel match is not required — the SVG layer sits slightly offset from the photo on purpose, which is what creates the depth.

- [ ] **Step 4: Commit**

```powershell
git add assets/img/capsules-*.svg
git commit -m "feat: trace the capsule motif into a separate parallax layer"
```

---

# PHASE 2 — Chart engine (pure, test-first)

### Task 7: Donut chart geometry

**Files:**
- Create: `assets/js/charts.js`
- Create: `tools/test/charts.test.js`

- [ ] **Step 1: Write the failing test**

`tools/test/charts.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arcPath, polarToCartesian } from '../../assets/js/charts.js';

test('polarToCartesian puts 0 fraction at 12 o\'clock', () => {
  const p = polarToCartesian(100, 100, 50, 0);
  assert.equal(Math.round(p.x), 100);
  assert.equal(Math.round(p.y), 50);
});

test('polarToCartesian puts 0.25 fraction at 3 o\'clock', () => {
  const p = polarToCartesian(100, 100, 50, 0.25);
  assert.equal(Math.round(p.x), 150);
  assert.equal(Math.round(p.y), 100);
});

test('arcPath uses the small-arc flag below half a turn', () => {
  const d = arcPath(100, 100, 50, 0, 0.25);
  assert.match(d, /A 50 50 0 0 1/);
});

test('arcPath uses the large-arc flag above half a turn', () => {
  const d = arcPath(100, 100, 50, 0, 0.75);
  assert.match(d, /A 50 50 0 1 1/);
});

test('arcPath of a full turn stops just short so the ring closes cleanly', () => {
  const d = arcPath(100, 100, 50, 0, 1);
  assert.ok(!d.includes('NaN'));
  assert.match(d, /^M /);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module ... assets/js/charts.js`

- [ ] **Step 3: Write the minimal implementation**

`assets/js/charts.js`:

```javascript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: `# pass 6`, `# fail 0`

- [ ] **Step 5: Commit**

```powershell
git add assets/js/charts.js tools/test/charts.test.js
git commit -m "feat: add tested donut arc geometry"
```

---

### Task 8: Donut, line, and bar renderers

**Files:**
- Modify: `assets/js/charts.js`
- Modify: `tools/test/charts.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tools/test/charts.test.js`:

```javascript
import { donut, lineChart, targetBar } from '../../assets/js/charts.js';

test('donut renders one arc per slice with the right colours', () => {
  const svg = donut([
    { label: 'Reported', value: 90, color: '#006633' },
    { label: 'Clicked',  value: 10, color: '#E81838' }
  ]);
  assert.equal((svg.match(/<path/g) || []).length, 2);
  assert.ok(svg.includes('#006633'));
  assert.ok(svg.includes('#E81838'));
});

test('donut shows the centre figure', () => {
  const svg = donut([{ label: 'a', value: 1, color: '#000' }], { centre: '4%' });
  assert.ok(svg.includes('4%'));
});

test('donut survives an all-zero dataset instead of dividing by zero', () => {
  const svg = donut([{ label: 'a', value: 0, color: '#000' }]);
  assert.ok(!svg.includes('NaN'));
});

test('lineChart plots one point per value and scales to the highest', () => {
  const svg = lineChart([{ label: 'Jan', value: 10 }, { label: 'Feb', value: 20 }]);
  assert.equal((svg.match(/<circle/g) || []).length, 2);
  assert.ok(!svg.includes('NaN'));
});

test('lineChart with a single month still renders', () => {
  const svg = lineChart([{ label: 'Jul', value: 4 }]);
  assert.ok(!svg.includes('NaN'));
  assert.equal((svg.match(/<circle/g) || []).length, 1);
});

test('lineChart with all-equal values does not divide by a zero range', () => {
  const svg = lineChart([{ label: 'a', value: 5 }, { label: 'b', value: 5 }]);
  assert.ok(!svg.includes('NaN'));
});

test('targetBar caps the fill at 100 percent when the target is beaten', () => {
  const svg = targetBar({ label: 'Policies approved', actual: 12, target: 8 });
  assert.match(svg, /width="100%"/);
  assert.ok(svg.includes('12 of 8'));
});

test('targetBar with a zero target does not divide by zero', () => {
  const svg = targetBar({ label: 'Breaches', actual: 0, target: 0 });
  assert.ok(!svg.includes('NaN'));
});

test('targetBar floors the fill at 0 so a negative never renders as a full bar', () => {
  // A negative percentage is invalid CSS. The browser drops the declaration and
  // falls back to width:auto, which paints a FULL bar — the opposite of the truth.
  const svg = targetBar({ label: 'Budget variance', actual: -4, target: 8 });
  assert.match(svg, /width="0%"/);
  assert.ok(!svg.includes('-50%'));
  assert.ok(svg.includes('-4 of 8'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `donut is not exported` / import error.

- [ ] **Step 3: Implement**

Append to `assets/js/charts.js`:

```javascript
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
  return `<svg class="ch-donut" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(opts.alt || 'Ring chart')}">${paths}${centre}</svg>`;
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
  const labels = xy.map((q) =>
    `<text x="${q.x.toFixed(1)}" y="${h - 10}" class="ch-xlabel" text-anchor="middle">${esc(q.p.label)}</text>`).join('');
  return `<svg class="ch-line" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.alt || 'Trend over time')}">` +
    `<polyline points="${line}" fill="none" class="ch-path"/>${dots}${labels}</svg>`;
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
    `<span class="tbar-value">${esc(actual)}${esc(unit)} of ${esc(target)}${esc(unit)}</span></div>` +
    `<div class="tbar-track"><div class="tbar-fill" style="--fill:${pct}%" width="${pct}%"></div></div></div>`;
}
```

Note: `targetBar` carries the redundant `width="${pct}%"` attribute so the value is assertable in tests without a DOM; CSS drives the visible width from `--fill`.

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: `# pass 14`, `# fail 0`

- [ ] **Step 5: Commit**

```powershell
git add assets/js/charts.js tools/test/charts.test.js
git commit -m "feat: add donut, trend line, and target bar renderers with edge-case tests"
```

---

# PHASE 3 — Tracking-file logic (pure, test-first)

### Task 9: Parse a project tracking file

**Files:**
- Create: `tools/lib/tracking.js`
- Create: `tools/test/tracking.test.js`

- [ ] **Step 1: Write the failing test**

`tools/test/tracking.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProject } from '../lib/tracking.js';

const SAMPLE = `# BLC School Management System
Status: In Progress · Progress: 78% · Target completion: Sept 2026
Linked to: Deliverable #3 (Digital Innovation), BSC "No. of Digitalization Utilized"

## Modules
- [x] Enrollment
- [x] Student Records
- [ ] Billing (60%)
- [ ] Parent Portal

## Blockers
- Waiting on the finance chart of accounts from Accounting (raised 15 Jul 2026)

## Monthly log
- 2026-07 — Grading module finished and turned over; billing started
- 2026-05 — Student records completed, presented to BLC
`;

test('reads the system name from the heading', () => {
  assert.equal(parseProject(SAMPLE).name, 'BLC School Management System');
});

test('reads status and progress from the summary line', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.status, 'In Progress');
  assert.equal(p.progress, 78);
  assert.equal(p.targetCompletion, 'Sept 2026');
});

test('counts finished and unfinished modules', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.modules.length, 4);
  assert.equal(p.modules.filter((m) => m.done).length, 2);
  assert.equal(p.modules[2].name, 'Billing');
  assert.equal(p.modules[2].percent, 60);
});

test('collects blockers', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.blockers.length, 1);
  assert.match(p.blockers[0], /chart of accounts/);
});

test('reads the monthly log newest first', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.log[0].month, '2026-07');
  assert.match(p.log[0].text, /Grading module finished/);
});

test('finds the entry for a specific month', () => {
  const p = parseProject(SAMPLE);
  assert.match(p.entryFor('2026-05'), /Student records completed/);
  assert.equal(p.entryFor('2026-06'), null);
});

test('an empty blockers section yields an empty list, not a crash', () => {
  const p = parseProject('# X\nStatus: Done · Progress: 100%\n\n## Blockers\n\n## Monthly log\n');
  assert.deepEqual(p.blockers, []);
  assert.equal(p.progress, 100);
});

test('a file saved by Notepad with CRLF endings keeps every log entry', () => {
  // The owner edits these in Notepad, which writes \r\n. This used to drop
  // every entry but the oldest, silently losing the current month.
  const p = parseProject(SAMPLE.replace(/\n/g, '\r\n'));
  assert.equal(p.log.length, 2);
  assert.equal(p.log[0].month, '2026-07');
  assert.match(p.entryFor('2026-07'), /Grading module finished/);
  assert.ok(!p.log[0].text.includes('\r'));
  assert.equal(p.modules.length, 4);
  assert.equal(p.blockers.length, 1);
  assert.equal(p.name, 'BLC School Management System');
  assert.equal(p.progress, 78);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot find `tools/lib/tracking.js`

- [ ] **Step 3: Implement**

`tools/lib/tracking.js`:

```javascript
/**
 * Reads the department's plain-text tracking files.
 *
 * These files are written and edited by a non-programmer in Notepad, so the
 * parser is forgiving: missing sections yield empty results rather than errors.
 */

function section(md, heading) {
  // Note: JavaScript has no \Z anchor — `$(?![\s\S])` is the end-of-input
  // equivalent that still works with the `m` flag switched on.
  const re = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))`, 'mi');
  const m = md.match(re);
  return m ? m[1].trim() : '';
}

export function parseProject(md) {
  const name = (md.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const summary = (md.match(/^Status:.*$/m) || [''])[0];

  const status = (summary.match(/Status:\s*([^·|]+)/) || [, ''])[1].trim();
  const progress = Number((summary.match(/Progress:\s*(\d+)\s*%/) || [, 0])[1]);
  const targetCompletion = (summary.match(/Target completion:\s*([^·|]+)/) || [, ''])[1].trim();
  const linkedTo = (md.match(/^Linked to:\s*(.+)$/m) || [, ''])[1].trim();

  const modules = section(md, 'Modules').split('\n')
    .map((l) => l.match(/^-\s*\[( |x|X)\]\s*(.+?)(?:\s*\((\d+)%\))?\s*$/))
    .filter(Boolean)
    .map((m) => ({
      name: m[2].trim(),
      done: m[1].toLowerCase() === 'x',
      percent: m[3] ? Number(m[3]) : (m[1].toLowerCase() === 'x' ? 100 : 0)
    }));

  const blockers = section(md, 'Blockers').split('\n')
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter((l) => l.length > 0);

  // `(.+?)\s*$` not `(.+)$`. The owner edits these files in Notepad, which
  // saves CRLF. After splitting on \n every line keeps a trailing \r, and `.`
  // does not match \r — so `(.+)$` failed on every line except the last one,
  // whose \r had already been removed by the section trim. Because the list
  // sorts newest-first, the single survivor was the OLDEST entry: the current
  // month vanished silently, with no error to notice.
  const log = section(md, 'Monthly log').split('\n')
    .map((l) => l.match(/^-\s*(\d{4}-\d{2})\s*[—–-]\s*(.+?)\s*$/))
    .filter(Boolean)
    .map((m) => ({ month: m[1], text: m[2].trim() }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return {
    name, status, progress, targetCompletion, linkedTo,
    modules, blockers, log,
    entryFor(month) {
      const hit = log.find((e) => e.month === month);
      return hit ? hit.text : null;
    }
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: `# pass 21`, `# fail 0`

- [ ] **Step 5: Commit**

```powershell
git add tools/lib/tracking.js tools/test/tracking.test.js
git commit -m "feat: parse project tracking files, forgiving of hand-editing"
```

---

### Task 10: Target pacing

**Files:**
- Create: `tools/lib/pace.js`
- Create: `tools/test/pace.test.js`

An annual target of 8 policies is not "behind" in February just because only 1 is done. Pacing compares progress against how much of the year has elapsed.

- [ ] **Step 1: Write the failing test**

`tools/test/pace.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pace } from '../lib/pace.js';

test('dead on pace is on-track', () => {
  // July = month 7 of 12. Expected 8 * 7/12 = 4.67. Actual 5.
  assert.equal(pace({ actual: 5, target: 8, month: 7 }).state, 'on-track');
});

test('well behind pace is flagged', () => {
  assert.equal(pace({ actual: 1, target: 8, month: 7 }).state, 'behind');
});

test('beating the target outright is ahead', () => {
  assert.equal(pace({ actual: 9, target: 8, month: 7 }).state, 'ahead');
});

test('a lower-is-better target inverts the comparison', () => {
  // Phish failure rate: target 1%, actual 0.4% is good.
  assert.equal(pace({ actual: 0.4, target: 1, month: 7, lowerIsBetter: true }).state, 'ahead');
  assert.equal(pace({ actual: 3.0, target: 1, month: 7, lowerIsBetter: true }).state, 'behind');
});

test('a zero target that is met stays on-track rather than dividing by zero', () => {
  const r = pace({ actual: 0, target: 0, month: 7, lowerIsBetter: true });
  assert.equal(r.state, 'on-track');
  assert.ok(Number.isFinite(r.expected));
});

test('reports the expected figure so it can be shown to the user', () => {
  assert.equal(Math.round(pace({ actual: 5, target: 8, month: 6 }).expected * 100) / 100, 4);
});

test('month is clamped to the 1-12 range', () => {
  assert.equal(pace({ actual: 8, target: 8, month: 99 }).expected, 8);
  assert.equal(pace({ actual: 0, target: 8, month: 0 }).expected, 8 / 12);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot find `tools/lib/pace.js`

- [ ] **Step 3: Implement**

`tools/lib/pace.js`:

```javascript
/**
 * Works out whether an annual target is keeping up with the calendar.
 *
 * `month` is 1..12. A target of 8 for the year is "on pace" in July if roughly
 * 8 * 7/12 have been achieved. A 10% tolerance stops trivial shortfalls being
 * reported as problems.
 */
const TOLERANCE = 0.10;

export function pace({ actual, target, month, lowerIsBetter = false }) {
  const m = Math.min(12, Math.max(1, Number(month) || 1));
  const expected = lowerIsBetter ? target : (target * m) / 12;

  let state;
  if (lowerIsBetter) {
    if (actual <= target * (1 - TOLERANCE) || (target === 0 && actual < 0)) state = 'ahead';
    else if (actual <= target) state = 'on-track';
    else state = 'behind';
    if (target === 0 && actual === 0) state = 'on-track';
  } else {
    if (actual >= target) state = 'ahead';
    else if (actual >= expected * (1 - TOLERANCE)) state = 'on-track';
    else state = 'behind';
  }

  return {
    state,
    expected,
    shortfall: lowerIsBetter ? Math.max(0, actual - target) : Math.max(0, expected - actual),
    percent: target > 0 ? Math.round((actual / target) * 100) : (actual === 0 ? 100 : 0)
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: `# pass 28`, `# fail 0`

- [ ] **Step 5: Commit**

```powershell
git add tools/lib/pace.js tools/test/pace.test.js
git commit -m "feat: add annual target pacing with a lower-is-better mode"
```

---

# PHASE 4 — Presentation engine

### Task 11: Slide navigation

**Files:**
- Create: `assets/js/engine.js`

`engine.js` owns *which slide is showing* and nothing else. It never touches particles or parallax; it announces changes through DOM events.

- [ ] **Step 1: Write `assets/js/engine.js`**

```javascript
/**
 * Slide engine. Owns which slide is visible.
 *
 * Dispatches on document:
 *   slide:enter  { detail: { index, el, total } }
 *   slide:leave  { detail: { index, el, direction } }
 *   deck:ready   { detail: { total } }
 *
 * Never imports effects.js. Motion is somebody else's job.
 */

const WHEEL_COOLDOWN = 700;   // stops one flick of a trackpad skipping five slides

export class Deck {
  constructor(root) {
    this.root = root;
    this.slides = Array.from(root.querySelectorAll('.slide'));
    this.index = 0;
    this.lastWheel = 0;
    this.overviewOpen = false;
    if (this.slides.length === 0) throw new Error('Deck has no .slide elements');
  }

  start() {
    this.slides.forEach((s, i) => {
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      s.classList.toggle('is-active', i === 0);
    });
    this.buildChrome();
    this.bindInput();
    document.dispatchEvent(new CustomEvent('deck:ready', { detail: { total: this.slides.length } }));
    // applyHash announces the slide itself when the URL points at one.
    // Only announce slide 0 if it didn't, otherwise effects fire twice.
    if (!this.applyHash()) this.announce(0, 1);
  }

  go(next, direction = next > this.index ? 1 : -1) {
    const target = Math.min(this.slides.length - 1, Math.max(0, next));
    if (target === this.index) return;
    const from = this.slides[this.index];

    document.dispatchEvent(new CustomEvent('slide:leave',
      { detail: { index: this.index, el: from, direction } }));

    from.classList.remove('is-active');
    from.setAttribute('aria-hidden', 'true');
    from.classList.add(direction > 0 ? 'is-leaving-fwd' : 'is-leaving-back');
    setTimeout(() => from.classList.remove('is-leaving-fwd', 'is-leaving-back'), 900);

    this.index = target;
    this.applyActive(direction);
    history.replaceState(null, '', `#s${target + 1}`);
  }

  applyActive(direction) {
    const el = this.slides[this.index];
    el.classList.remove('is-leaving-fwd', 'is-leaving-back');
    el.classList.add('is-active');
    el.setAttribute('aria-hidden', 'false');
    el.dataset.direction = direction > 0 ? 'forward' : 'back';
    this.updateChrome();
    this.announce(this.index, direction);
  }

  announce(index, direction) {
    document.dispatchEvent(new CustomEvent('slide:enter', {
      detail: { index, el: this.slides[index], total: this.slides.length, direction }
    }));
  }

  next() { this.go(this.index + 1, 1); }
  prev() { this.go(this.index - 1, -1); }

  buildChrome() {
    const nav = document.createElement('nav');
    nav.className = 'deck-dots';
    nav.setAttribute('aria-label', 'Slide navigation');
    this.slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deck-dot';
      b.title = s.dataset.title || `Slide ${i + 1}`;
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => this.go(i));
      nav.appendChild(b);
    });
    this.root.appendChild(nav);

    const counter = document.createElement('div');
    counter.className = 'deck-counter';
    this.root.appendChild(counter);

    this.dots = Array.from(nav.children);
    this.counter = counter;
    this.updateChrome();
  }

  updateChrome() {
    this.dots.forEach((d, i) => d.classList.toggle('is-current', i === this.index));
    this.counter.textContent = `${this.index + 1} / ${this.slides.length}`;
  }

  bindInput() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); this.next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); this.prev(); }
      else if (k === 'Home') { e.preventDefault(); this.go(0, -1); }
      else if (k === 'End') { e.preventDefault(); this.go(this.slides.length - 1, 1); }
      else if (k === 'f' || k === 'F') { this.toggleFullscreen(); }
      else if (k === 'Escape') { e.preventDefault(); this.toggleOverview(); }
      else if (k === 'p' || k === 'P') { this.root.classList.toggle('show-notes'); }
    });

    this.root.addEventListener('wheel', (e) => {
      if (this.overviewOpen) return;
      const now = Date.now();
      if (now - this.lastWheel < WHEEL_COOLDOWN) return;
      if (Math.abs(e.deltaY) < 12) return;
      this.lastWheel = now;
      e.deltaY > 0 ? this.next() : this.prev();
    }, { passive: true });

    this.root.addEventListener('click', (e) => {
      if (this.overviewOpen) return;
      if (e.target.closest('button, a, .shot, .deck-dots')) return;
      this.next();
    });

    // Touch: horizontal swipe
    let x0 = null;
    this.root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    this.root.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) { dx < 0 ? this.next() : this.prev(); }
      x0 = null;
    }, { passive: true });

    window.addEventListener('hashchange', () => this.applyHash());
  }

  /** Returns true if it moved the deck (and therefore already announced). */
  applyHash() {
    const m = location.hash.match(/^#s(\d+)$/);
    if (!m) return false;
    const target = Number(m[1]) - 1;
    if (target === this.index) return false;
    this.slides[this.index].classList.remove('is-active');
    this.slides[this.index].setAttribute('aria-hidden', 'true');
    this.index = Math.min(this.slides.length - 1, Math.max(0, target));
    this.applyActive(1);
    return true;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  toggleOverview() {
    this.overviewOpen = !this.overviewOpen;
    this.root.classList.toggle('overview', this.overviewOpen);
    if (this.overviewOpen) {
      this.slides.forEach((s, i) => {
        s.classList.add('is-active');
        s.onclick = () => { this.overviewOpen = false; this.root.classList.remove('overview'); this.resetTo(i); };
      });
    } else {
      this.resetTo(this.index);
    }
  }

  resetTo(i) {
    this.slides.forEach((s, j) => {
      s.onclick = null;
      s.classList.toggle('is-active', j === i);
      s.setAttribute('aria-hidden', j === i ? 'false' : 'true');
    });
    this.index = i;
    this.updateChrome();
    this.announce(i, 1);
  }
}
```

- [ ] **Step 2: Verify with a throwaway page**

Create `tmp-engine-test.html` at the repo root:

```html
<link rel="stylesheet" href="assets/css/tokens.css">
<style>.slide{display:none;height:100vh}.slide.is-active{display:grid;place-items:center;font:700 4rem system-ui}</style>
<div class="deck">
  <section class="slide" data-title="One">ONE</section>
  <section class="slide" data-title="Two">TWO</section>
  <section class="slide" data-title="Three">THREE</section>
</div>
<script type="module">
  import { Deck } from './assets/js/engine.js';
  new Deck(document.querySelector('.deck')).start();
</script>
```

Open it with Playwright and confirm: pressing Right shows TWO then THREE; Left goes back; the URL becomes `#s2`; `Esc` shows all three; the counter reads `2 / 3`.

- [ ] **Step 3: Delete the throwaway and commit**

```powershell
Remove-Item tmp-engine-test.html
git add assets/js/engine.js
git commit -m "feat: add slide engine with keyboard, wheel, touch, and overview"
```

---

### Task 12: Slide frame and layer stack CSS

**Files:**
- Create: `assets/css/report.css`

- [ ] **Step 1: Write `assets/css/report.css`**

```css
/* Slide frame, layer stack, and the seven slide types.
   Layout only — all motion lives in effects.css. */

*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }

body {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--ink);
  background: #0d1512;
  overflow: hidden;
}

.deck { position: relative; width: 100vw; height: 100vh; }

/* ── Slide ─────────────────────────────────────────────── */
.slide {
  position: absolute; inset: 0;
  display: none;
  padding: clamp(2rem, 5vh, 4rem) clamp(2.5rem, 6vw, 6rem);
  isolation: isolate;
}
.slide.is-active { display: grid; }

/* ── Background layers ─────────────────────────────────── */
.slide::before {                      /* the photo */
  content: ''; position: absolute; inset: -4%;
  z-index: var(--z-photo);
  background-size: cover; background-position: center;
  will-change: transform;
}
.slide[data-bg="title"]::before   { background-image: url('../img/bg-title.jpg'); }
.slide[data-bg="content"]::before { background-image: url('../img/bg-content.jpg'); }
.slide[data-bg="closing"]::before { background-image: url('../img/bg-closing.jpg'); }

/* Geometry here must match .slide::before EXACTLY — same inset, same
   background-size, same position. The capsules are traced from the photo, so
   any difference makes the traced stripe drift off the printed one and print
   a doubled ghost edge. Measured before this was matched: ~10px off at 16:9,
   55px at 16:10, 112px at 4:3. Both sources are 16:9 (photo 2560x1440, SVG
   viewBox 1920x1080), so `cover` crops them identically at every viewport. */
.layer-capsules {
  position: absolute; inset: -4%;
  z-index: var(--z-capsule);
  background-repeat: no-repeat; background-size: cover; background-position: center;
  opacity: 0.9; pointer-events: none;
  will-change: transform;
}
.slide[data-bg="title"]   .layer-capsules { background-image: url('../img/capsules-title.svg'); }
.slide[data-bg="content"] .layer-capsules { background-image: url('../img/capsules-content.svg'); }
.slide[data-bg="closing"] .layer-capsules { display: none; }

.layer-glow {
  position: absolute; inset: 0; z-index: var(--z-glow);
  pointer-events: none;
  background:
    radial-gradient(38vw 38vw at var(--gx, 25%) var(--gy, 30%), rgba(0,102,51,0.22), transparent 65%),
    radial-gradient(30vw 30vw at var(--gx2, 78%) var(--gy2, 72%), rgba(250,250,0,0.16), transparent 65%);
}

canvas.layer-particles {
  position: absolute; inset: 0; z-index: var(--z-particle);
  pointer-events: none;
}

/* ── Content ───────────────────────────────────────────── */
.slide-body {
  position: relative; z-index: var(--z-content);
  display: grid; gap: var(--sp-3);
  align-content: center; width: 100%; max-width: 1500px; margin-inline: auto;
}

.eyebrow {
  font: 700 var(--fs-caption)/1 var(--font-head);
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--green); display: flex; align-items: center; gap: var(--sp-2);
}
.eyebrow::after {
  content: ''; height: 6px; width: clamp(40px, 8vw, 120px);
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--green), var(--yellow));
}

h1.slide-title { font: 900 var(--fs-title)/1.05 var(--font-head); margin: 0; color: var(--ink); }
h2.slide-sub   { font: 800 var(--fs-section)/1.2 var(--font-head); margin: 0; color: var(--green-deep); }

.card {
  background: var(--card);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
  backdrop-filter: blur(14px) saturate(1.15);
  border: 1px solid var(--card-edge);
  border-radius: var(--radius);
  padding: var(--sp-3);
  box-shadow: 0 18px 46px rgba(0, 40, 20, 0.16);
  transform-style: preserve-3d;
}

.cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); align-items: start; }
.cols--wide-right { grid-template-columns: 0.85fr 1.15fr; }
@media (max-width: 900px) { .cols, .cols--wide-right { grid-template-columns: 1fr; } }

/* ── Status badge ──────────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 0.5em;
  padding: 0.35em 1em; border-radius: var(--radius-pill);
  font: 800 var(--fs-caption)/1 var(--font-head);
  letter-spacing: 0.08em; text-transform: uppercase; color: #fff;
}
.badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
/* Text colour per badge is set by measured contrast, not by taste.
   Badge text is small (0.8rem) so it needs the full 4.5:1, not the 3:1
   large-text allowance. Measured against white and against --ink:
     done     #006633 — white 7.12:1  ✓
     risk     #E81838 — white 4.55:1  ✓
     progress #F5C518 — white 1.63:1  ✗ → ink 9.16:1  ✓
     delayed  #E8721A — white 3.06:1  ✗ → ink 4.87:1  ✓
     none     #9AA3A7 — white 2.57:1  ✗ → ink 5.81:1  ✓
   No brand colour is altered; only the text colour on top of it. */
.badge[data-status="done"]       { background: var(--st-done); color: #fff; }
.badge[data-status="risk"]       { background: var(--st-risk); color: #fff; }
.badge[data-status="progress"]   { background: var(--st-progress); color: var(--ink); }
.badge[data-status="delayed"]    { background: var(--st-delayed); color: var(--ink); }
.badge[data-status="not-started"]{ background: var(--st-none); color: var(--ink); }

/* ── Progress bar (capsule motif) ──────────────────────── */
.pbar { display: grid; gap: 0.4rem; }
.pbar-head { display: flex; justify-content: space-between; font-weight: 700; }
.pbar-track {
  height: 14px; border-radius: var(--radius-pill);
  background: rgba(0, 102, 51, 0.12); overflow: hidden;
}
.pbar-fill {
  height: 100%; width: 0; border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--green), var(--green-light));
}
.pbar-fill[data-tone="yellow"] { background: linear-gradient(90deg, var(--yellow-warm), var(--yellow)); }

/* ── Target bars ───────────────────────────────────────── */
.tbar { display: grid; gap: 0.35rem; margin-bottom: var(--sp-2); }
.tbar-head { display: flex; justify-content: space-between; gap: var(--sp-2); font-size: 0.95rem; }
.tbar-label { font-weight: 700; }
.tbar-value { color: var(--ink-soft); white-space: nowrap; }
.tbar-track { height: 12px; border-radius: var(--radius-pill); background: rgba(0,102,51,0.12); overflow: hidden; }
.tbar-fill  { height: 100%; width: 0; border-radius: var(--radius-pill); background: var(--green); }
.tbar[data-state="behind"] .tbar-fill { background: var(--st-delayed); }
.tbar[data-state="ahead"]  .tbar-fill { background: linear-gradient(90deg, var(--green), var(--yellow)); }

/* ── Checklist ─────────────────────────────────────────── */
.checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
.checks li { display: grid; grid-template-columns: 22px 1fr; gap: 0.6rem; align-items: start; }
.checks li::before {
  content: '✓'; width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center; font-size: 0.72rem; font-weight: 900;
  background: var(--st-done); color: #fff;
}
.checks li[data-done="false"]::before { content: '•'; background: rgba(0,102,51,0.15); color: var(--green); }

/* ── Blockers ──────────────────────────────────────────── */
.blockers {
  border-left: 5px solid var(--st-risk);
  background: rgba(232, 24, 56, 0.06);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: var(--sp-2) var(--sp-3);
}
.blockers h3 { margin: 0 0 0.4rem; font: 800 0.9rem/1 var(--font-head); color: var(--st-risk); text-transform: uppercase; letter-spacing: 0.1em; }

/* ── Screenshot frame ──────────────────────────────────── */
.shot {
  display: block; width: 100%; border: 0; padding: 0; cursor: zoom-in;
  border-radius: var(--radius); overflow: hidden;
  background: var(--card-solid); box-shadow: 0 24px 60px rgba(0,40,20,0.22);
}
.shot img { display: block; width: 100%; height: auto; }
.shot figcaption { padding: 0.6rem var(--sp-2); font-size: var(--fs-caption); color: var(--ink-soft); text-align: left; }

.lightbox {
  position: fixed; inset: 0; z-index: var(--z-lightbox);
  display: none; place-items: center;
  background: rgba(6, 20, 14, 0.92); cursor: zoom-out; padding: 3vh 3vw;
}
.lightbox.is-open { display: grid; }
.lightbox img { max-width: 100%; max-height: 94vh; border-radius: var(--radius); }

/* ── Big stats ─────────────────────────────────────────── */
.stats { display: grid; grid-auto-flow: column; gap: var(--sp-4); justify-content: start; }
@media (max-width: 900px) { .stats { grid-auto-flow: row; } }
.stat-num { font: 900 var(--fs-stat)/0.9 var(--font-head); color: var(--green); font-variant-numeric: tabular-nums; }
.stat-lab { font-size: var(--fs-caption); color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 0.4rem; }

/* ── Charts ────────────────────────────────────────────── */
.ch-donut, .ch-line { width: 100%; height: auto; overflow: visible; }
.ch-centre  { font: 900 2rem var(--font-head); fill: var(--green); }
.ch-path    { stroke: var(--green); stroke-width: 3; stroke-linejoin: round; }
.ch-dot     { fill: var(--card-solid); stroke: var(--green); stroke-width: 3; }
.ch-xlabel  { font-size: 12px; fill: var(--ink-soft); }

/* ── Chrome ────────────────────────────────────────────── */
.deck-dots {
  position: fixed; right: 1.4rem; top: 50%; transform: translateY(-50%);
  z-index: var(--z-chrome); display: grid; gap: 0.55rem;
}
.deck-dot {
  width: 10px; height: 10px; padding: 0; border: 0; cursor: pointer;
  border-radius: var(--radius-pill);
  background: rgba(0, 102, 51, 0.28);
}
.deck-dot.is-current { background: var(--green); height: 26px; }

.deck-counter {
  position: fixed; right: 1.2rem; bottom: 1rem; z-index: var(--z-chrome);
  font: 700 var(--fs-caption) var(--font-head); color: var(--green-deep);
  background: var(--card); padding: 0.3rem 0.7rem; border-radius: var(--radius-pill);
}

.notes { display: none; }
.deck.show-notes .slide.is-active .notes {
  display: block; position: absolute; left: 0; right: 0; bottom: 0;
  z-index: var(--z-chrome); background: rgba(10, 25, 18, 0.94); color: #EAF3EE;
  padding: var(--sp-2) var(--sp-4); font-size: 0.95rem;
}

/* ── Overview grid ─────────────────────────────────────── */
.deck.overview { overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--sp-2); padding: var(--sp-2); background: #0d1512; }
.deck.overview .slide { position: relative; inset: auto; aspect-ratio: 16/9; transform: scale(1); cursor: pointer; border-radius: var(--radius); overflow: hidden; padding: var(--sp-2); }
.deck.overview .slide > * { pointer-events: none; }
.deck.overview .deck-dots, .deck.overview .deck-counter { display: none; }

/* ── Print / PDF ───────────────────────────────────────── */
@media print {
  body { overflow: visible; background: #fff; }
  .slide { display: block !important; position: relative; page-break-after: always; height: 100vh; }
  .deck-dots, .deck-counter, .layer-particles { display: none !important; }
}
```

- [ ] **Step 2: Commit**

```powershell
git add assets/css/report.css
git commit -m "feat: add slide frame, layer stack, and component styles"
```

---

# PHASE 5 — Effects

### Task 13: Motion, parallax, particles, tilt, calm mode

**Files:**
- Create: `assets/css/effects.css`
- Create: `assets/js/effects.js`

- [ ] **Step 1: Write `assets/css/effects.css`**

```css
/* All motion. Removing this file leaves a static but complete report. */

/* ── Entrance ──────────────────────────────────────────── */
.slide.is-active .anim {
  animation: rise var(--dur-mid) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 90ms);
}
/* Animates `translate`, NOT `transform`. A filling animation wins the cascade,
   so `to { transform: none }` permanently pinned transform on every .anim
   element — which silently killed the 3D tilt on every card, since the
   template puts `tilt` and `anim` on the same element. Using the separate
   `translate` property lets the entrance and the tilt coexist. */
@keyframes rise {
  from { opacity: 0; translate: 0 28px; }
  to   { opacity: 1; translate: 0 0; }
}

.slide.is-active[data-direction="back"] .anim { animation-name: rise-back; }
@keyframes rise-back {
  from { opacity: 0; translate: 0 -28px; }
  to   { opacity: 1; translate: 0 0; }
}

/* ── Capsule wipe on entry ─────────────────────────────── */
.slide.is-active::after {
  content: ''; position: absolute; inset: 0; z-index: var(--z-chrome);
  pointer-events: none;
  background: linear-gradient(105deg, transparent 35%, rgba(0,102,51,0.35) 47%, rgba(250,250,0,0.30) 53%, transparent 65%);
  transform: translateX(-120%);
  animation: wipe var(--dur-slow) var(--ease-in-out) both;
}
@keyframes wipe { to { transform: translateX(120%); } }

/* ── Leaving ───────────────────────────────────────────── */
.slide.is-leaving-fwd  { display: grid; animation: leaveFwd  var(--dur-mid) var(--ease-in-out) both; }
.slide.is-leaving-back { display: grid; animation: leaveBack var(--dur-mid) var(--ease-in-out) both; }
@keyframes leaveFwd  { to { opacity: 0; transform: translate3d(-6%, 0, 0) scale(0.97); } }
@keyframes leaveBack { to { opacity: 0; transform: translate3d(6%, 0, 0) scale(0.97); } }

/* ── Background drift ──────────────────────────────────────
   IMPORTANT: drift animates `scale` and `rotate` only, never `transform`.
   The pointer parallax below writes to `translate`. These are separate CSS
   properties, so the slow drift and the pointer parallax compose instead of
   one overwriting the other — which is what happens if both use `transform`. */
.slide.is-active::before { animation: drift 40s var(--ease-in-out) infinite alternate; }
@keyframes drift {
  from { scale: 1.06; }
  to   { scale: 1.12; }
}
.slide.is-active .layer-capsules { animation: capsuleFloat 26s ease-in-out infinite alternate; }
@keyframes capsuleFloat {
  from { scale: 1;      rotate: 0deg; }
  to   { scale: 1.025;  rotate: 0.6deg; }
}
.slide.is-active .layer-glow { animation: glowRoam 22s ease-in-out infinite alternate; }
@keyframes glowRoam {
  from { --gx: 22%; --gy: 28%; --gx2: 76%; --gy2: 70%; opacity: 0.85; }
  to   { --gx: 34%; --gy: 42%; --gx2: 64%; --gy2: 58%; opacity: 1; }
}

/* ── Parallax offsets set by JS ────────────────────────────
   Uses `translate`, not `transform`, so it stacks with the drift above.
   The photo moves against the pointer and the capsules move with it — that
   opposition is what reads as depth. */
.slide::before         { translate: calc(var(--px, 0) * -18px) calc(var(--py, 0) * -12px); transition: translate 300ms var(--ease-out); }
.slide .layer-capsules { translate: calc(var(--px, 0) *  30px) calc(var(--py, 0) *  20px); transition: translate 220ms var(--ease-out); }

/* ── 3D tilt ───────────────────────────────────────────── */
.tilt {
  transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
  transform: perspective(1100px) rotateX(calc(var(--ty, 0) * -4deg)) rotateY(calc(var(--tx, 0) * 5deg)) translateZ(0);
}
.tilt:hover { box-shadow: 0 30px 70px rgba(0, 40, 20, 0.26); }

/* ── Bars fill on arrival ──────────────────────────────── */
.slide.is-active .pbar-fill,
.slide.is-active .tbar-fill {
  width: var(--fill, 0%);
  transition: width 1.1s var(--ease-out) 260ms;
}

/* ── Charts draw themselves ────────────────────────────── */
.slide.is-active .ch-arc {
  stroke-dasharray: 1000; stroke-dashoffset: 1000;
  animation: draw 1.2s var(--ease-out) both;
  animation-delay: calc(320ms + var(--i, 0) * 180ms);
}
.slide.is-active .ch-path {
  stroke-dasharray: 2000; stroke-dashoffset: 2000;
  animation: draw 1.4s var(--ease-out) 300ms both;
}
@keyframes draw { to { stroke-dashoffset: 0; } }
.slide.is-active .ch-dot {
  animation: pop var(--dur-fast) var(--ease-out) both;
  animation-delay: calc(600ms + var(--i, 0) * 110ms);
}
@keyframes pop { from { r: 0; opacity: 0; } to { opacity: 1; } }

/* ── Title letter reveal ───────────────────────────────── */
.slide.is-active .reveal-char {
  display: inline-block;
  animation: charIn 620ms var(--ease-out) both;
  animation-delay: calc(var(--c, 0) * 26ms);
}
@keyframes charIn {
  from { opacity: 0; transform: translate3d(0, 0.5em, 0) rotateX(-70deg); }
  to   { opacity: 1; transform: none; }
}

/* ── Calm mode kills everything ────────────────────────── */
html.calm .slide.is-active::after,
html.calm canvas.layer-particles,
html.calm .layer-glow { display: none !important; }
html.calm *, html.calm *::before, html.calm *::after {
  animation: none !important;
  transition-duration: 1ms !important;
}
html.calm .slide.is-active .pbar-fill,
html.calm .slide.is-active .tbar-fill { width: var(--fill, 0%); }
html.calm .slide.is-active .ch-arc,
html.calm .slide.is-active .ch-path { stroke-dashoffset: 0; }
html.calm .tilt { transform: none; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

- [ ] **Step 2: Write `assets/js/effects.js`**

```javascript
/**
 * Motion layer. Listens to the engine's events; never changes which slide shows.
 *
 * Calm mode (the C key) sets html.calm, which flattens every animation in CSS,
 * stops the particle loop, and is remembered between visits.
 */

const CALM_KEY = 'bugemco-calm';

export function initEffects(root) {
  const state = { calm: localStorage.getItem(CALM_KEY) === '1', particles: null };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) state.calm = true;
  applyCalm(state.calm);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      state.calm = !state.calm;
      localStorage.setItem(CALM_KEY, state.calm ? '1' : '0');
      applyCalm(state.calm);
      toast(state.calm ? 'Calm mode ON — heavy effects off' : 'Calm mode OFF — full effects');
    }
  });

  document.addEventListener('slide:enter', (e) => {
    const el = e.detail.el;
    countUp(el);
    fillBars(el);
    revealTitle(el);
    if (!state.calm) startParticles(el, state);
  });

  document.addEventListener('slide:leave', () => stopParticles(state));

  bindParallax(root, state);
  bindTilt(root, state);
  bindLightbox(root);
  watchFrameRate(state);

  function applyCalm(on) {
    document.documentElement.classList.toggle('calm', on);
    if (on) stopParticles(state);
    else {
      const active = root.querySelector('.slide.is-active');
      if (active) startParticles(active, state);
    }
    document.dispatchEvent(new CustomEvent('calm:change', { detail: { calm: on } }));
  }
}

/* ── Numbers counting up ──────────────────────────────── */
function countUp(scope) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    if (!Number.isFinite(target)) return;
    if (document.documentElement.classList.contains('calm')) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    const dur = 1100, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ── Bars ─────────────────────────────────────────────── */
function fillBars(scope) {
  const bars = Array.from(scope.querySelectorAll('[data-fill]'));
  if (bars.length === 0) return;

  // The slide flips from display:none to grid in the same style change that
  // sets --fill, so the browser has no painted "before" state and generates no
  // transition — the bar jumped straight to its final width. Painting 0% first
  // and deferring the real value by two frames gives the transition something
  // to animate away from. In calm mode the CSS duration is 1ms, so this still
  // lands immediately and the figure stays correct.
  bars.forEach((el) => el.style.setProperty('--fill', '0%'));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bars.forEach((el) => {
      el.style.setProperty('--fill', `${Math.min(100, Math.max(0, Number(el.dataset.fill)))}%`);
    });
  }));
}

/* ── Title letters ────────────────────────────────────── */
function revealTitle(scope) {
  const el = scope.querySelector('[data-reveal]');
  if (!el || el.dataset.revealDone === '1') return;
  el.dataset.revealDone = '1';
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'reveal-char';
    s.style.setProperty('--c', i);
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(s);
  });
}

/* ── Parallax from pointer ────────────────────────────── */
function bindParallax(root, state) {
  let raf = null, px = 0, py = 0;
  root.addEventListener('pointermove', (e) => {
    if (state.calm) return;
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const s = root.querySelector('.slide.is-active');
      if (s) { s.style.setProperty('--px', px.toFixed(3)); s.style.setProperty('--py', py.toFixed(3)); }
      raf = null;
    });
  });
}

/* ── 3D card tilt ─────────────────────────────────────── */
function bindTilt(root, state) {
  root.addEventListener('pointermove', (e) => {
    if (state.calm) return;
    const card = e.target.closest('.tilt');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--tx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    card.style.setProperty('--ty', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  });
  root.addEventListener('pointerleave', () => {
    root.querySelectorAll('.tilt').forEach((c) => {
      c.style.setProperty('--tx', 0); c.style.setProperty('--ty', 0);
    });
  }, true);
}

/* ── Particles ────────────────────────────────────────── */
function startParticles(slide, state) {
  stopParticles(state);
  let canvas = slide.querySelector('canvas.layer-particles');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'layer-particles';
    canvas.setAttribute('aria-hidden', 'true');
    slide.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => {
    canvas.width = slide.clientWidth * dpr;
    canvas.height = slide.clientHeight * dpr;
    canvas.style.width = slide.clientWidth + 'px';
    canvas.style.height = slide.clientHeight + 'px';
  };
  resize();
  const COUNT = Math.round((slide.clientWidth * slide.clientHeight) / 26000);
  const dots = Array.from({ length: COUNT }, (_, i) => ({
    x: ((i * 97) % 100) / 100 * canvas.width,
    y: ((i * 61) % 100) / 100 * canvas.height,
    r: (1 + (i % 3)) * dpr,
    vx: ((i % 5) - 2) * 0.06 * dpr,
    vy: -(0.10 + (i % 4) * 0.05) * dpr,
    a: 0.10 + (i % 6) * 0.035,
    green: i % 3 !== 0
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.y < -10) { d.y = canvas.height + 10; }
      if (d.x < -10) d.x = canvas.width + 10;
      if (d.x > canvas.width + 10) d.x = -10;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.green ? `rgba(0,102,51,${d.a})` : `rgba(250,250,0,${d.a})`;
      ctx.fill();
    }
    state.particles = requestAnimationFrame(draw);
  };
  state.particles = requestAnimationFrame(draw);
  state.resize = resize;
  window.addEventListener('resize', resize);
}

function stopParticles(state) {
  if (state.particles) cancelAnimationFrame(state.particles);
  state.particles = null;
  if (state.resize) window.removeEventListener('resize', state.resize);
  document.querySelectorAll('canvas.layer-particles').forEach((c) => {
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  });
}

/* ── Screenshot lightbox ──────────────────────────────── */
function bindLightbox(root) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = '<img alt="">';
  document.body.appendChild(box);
  const img = box.querySelector('img');
  root.addEventListener('click', (e) => {
    const shot = e.target.closest('.shot');
    if (!shot) return;
    e.stopPropagation();
    const source = shot.querySelector('img');
    img.src = source.src;
    img.alt = source.alt;
    box.classList.add('is-open');
  });
  const close = () => box.classList.remove('is-open');
  box.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) { e.stopImmediatePropagation(); close(); } }, true);
}

/* ── Auto calm on a struggling machine ────────────────── */
function watchFrameRate(state) {
  let frames = 0, t0 = performance.now(), slowSince = null;
  const tick = (now) => {
    frames++;
    if (now - t0 >= 1000) {
      const fps = frames * 1000 / (now - t0);
      frames = 0; t0 = now;
      if (fps < 30 && !state.calm) {
        slowSince = slowSince ?? now;
        if (now - slowSince > 2000) {
          state.calm = true;
          document.documentElement.classList.add('calm');
          stopParticles(state);
          toast('Effects reduced automatically — this computer was struggling. Press C to force them back on.');
          return;
        }
      } else { slowSince = null; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Small on-screen message ──────────────────────────── */
function toast(msg) {
  let el = document.querySelector('.deck-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'deck-toast';
    el.setAttribute('role', 'status');
    Object.assign(el.style, {
      position: 'fixed', left: '50%', bottom: '2rem', transform: 'translateX(-50%)',
      zIndex: 40, background: 'rgba(10,25,18,0.94)', color: '#EAF3EE',
      padding: '0.7rem 1.3rem', borderRadius: '999px', font: '600 0.9rem system-ui',
      maxWidth: '80vw', textAlign: 'center'
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3200);
}
```

- [ ] **Step 3: Write `assets/js/boot.js`**

```javascript
/** The only script a month page loads. Wires the pieces together. */
import { Deck } from './engine.js';
import { initEffects } from './effects.js';

const root = document.querySelector('.deck');
if (root) {
  const deck = new Deck(root);
  initEffects(root);
  deck.start();
  window.deck = deck;   // handy when checking things in the browser console
}
```

- [ ] **Step 4: Commit**

```powershell
git add assets/css/effects.css assets/js/effects.js assets/js/boot.js
git commit -m "feat: add motion layer with parallax, particles, tilt, and calm mode"
```

---

### Task 14: Month template

**Files:**
- Create: `templates/month.html`

- [ ] **Step 1: Write `templates/month.html`**

Every placeholder below is marked `{{...}}` and must be replaced when a month is built. A page still containing `{{` fails QA.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ICT Department Monthly Report — {{MONTH_NAME}} {{YEAR}} | BUGEMCO</title>
<meta name="description" content="ICT Department monthly report for {{MONTH_NAME}} {{YEAR}} — Software Development and Information Security.">
<link rel="stylesheet" href="../../assets/css/fonts.css">
<link rel="stylesheet" href="../../assets/css/tokens.css">
<link rel="stylesheet" href="../../assets/css/report.css">
<link rel="stylesheet" href="../../assets/css/effects.css">
</head>
<body>
<main class="deck">

  <!-- ══ TITLE ══════════════════════════════════════════ -->
  <section class="slide" data-bg="title" data-title="Title">
    <div class="layer-capsules"></div>
    <div class="layer-glow"></div>
    <div class="slide-body">
      <p class="eyebrow anim" style="--i:0">BUGEMCO · Making Lives Better</p>
      <h1 class="slide-title anim" style="--i:1" data-reveal>ICT DEPARTMENT</h1>
      <h2 class="slide-sub anim" style="--i:2">Software Development &amp; Information Security</h2>
      <p class="anim" style="--i:3"><strong>{{MONTH_NAME}} {{YEAR}}</strong> · Gipre F. Naparan, IT Supervisor</p>
      <div class="stats anim" style="--i:4">
        <div><div class="stat-num" data-count="{{HEADLINE_1_VALUE}}">0</div><div class="stat-lab">{{HEADLINE_1_LABEL}}</div></div>
        <div><div class="stat-num" data-count="{{HEADLINE_2_VALUE}}">0</div><div class="stat-lab">{{HEADLINE_2_LABEL}}</div></div>
        <div><div class="stat-num" data-count="{{HEADLINE_3_VALUE}}">0</div><div class="stat-lab">{{HEADLINE_3_LABEL}}</div></div>
      </div>
    </div>
    <aside class="notes">{{TITLE_NOTES}}</aside>
  </section>

  <!-- ══ SECTION DIVIDER (repeat per section) ═══════════ -->
  <section class="slide" data-bg="content" data-title="{{SECTION_NAME}}">
    <div class="layer-capsules"></div><div class="layer-glow"></div>
    <div class="slide-body">
      <div class="stat-num anim" style="--i:0">{{SECTION_NUMBER}}</div>
      <h1 class="slide-title anim" style="--i:1">{{SECTION_NAME}}</h1>
      <ul class="checks anim" style="--i:2">{{SECTION_PREVIEW_ITEMS}}</ul>
    </div>
    <aside class="notes">{{SECTION_NOTES}}</aside>
  </section>

  <!-- ══ PROJECT (repeat per system) ════════════════════ -->
  <section class="slide" data-bg="content" data-title="{{PROJECT_NAME}}">
    <div class="layer-capsules"></div><div class="layer-glow"></div>
    <div class="slide-body">
      <p class="eyebrow anim" style="--i:0">Software Development</p>
      <div class="cols cols--wide-right">
        <div class="card tilt anim" style="--i:1">
          <h1 class="slide-sub">{{PROJECT_NAME}}</h1>
          <p><span class="badge" data-status="{{PROJECT_STATUS_KEY}}">{{PROJECT_STATUS_LABEL}}</span></p>
          <div class="pbar">
            <div class="pbar-head"><span>How far along</span><span><span data-count="{{PROJECT_PERCENT}}">0</span>%</span></div>
            <div class="pbar-track"><div class="pbar-fill" data-fill="{{PROJECT_PERCENT}}"></div></div>
          </div>
          <h3 class="slide-sub" style="margin-top:1.2rem;font-size:1rem">Done this month</h3>
          <ul class="checks">{{PROJECT_DONE_ITEMS}}</ul>
          {{PROJECT_BLOCKERS_BLOCK}}
        </div>
        <figure class="shot anim" style="--i:2">
          <img src="img/{{PROJECT_SHOT}}" alt="{{PROJECT_SHOT_ALT}}" loading="lazy">
          <figcaption>{{PROJECT_SHOT_CAPTION}} · Click to enlarge</figcaption>
        </figure>
      </div>
    </div>
    <aside class="notes">{{PROJECT_NOTES}}</aside>
  </section>

  <!-- ══ SECURITY ═══════════════════════════════════════ -->
  <section class="slide" data-bg="content" data-title="Information Security">
    <div class="layer-capsules"></div><div class="layer-glow"></div>
    <div class="slide-body">
      <p class="eyebrow anim" style="--i:0">Information Security</p>
      <h1 class="slide-title anim" style="--i:1">{{SECURITY_HEADLINE}}</h1>
      <div class="cols">
        <div class="card tilt anim" style="--i:2">
          <h2 class="slide-sub">Phishing simulation</h2>
          <div id="phish-donut"></div>
          <p>{{PHISH_PLAIN_ENGLISH}}</p>
        </div>
        <div class="card tilt anim" style="--i:3">
          <h2 class="slide-sub">How we're trending</h2>
          <div id="phish-trend"></div>
          <p>{{TREND_PLAIN_ENGLISH}}</p>
        </div>
      </div>
    </div>
    <aside class="notes">{{SECURITY_NOTES}}</aside>
  </section>

  <!-- ══ TARGETS ════════════════════════════════════════ -->
  <section class="slide" data-bg="content" data-title="Annual Targets">
    <div class="layer-capsules"></div><div class="layer-glow"></div>
    <div class="slide-body">
      <p class="eyebrow anim" style="--i:0">Where we stand against the year</p>
      <h1 class="slide-title anim" style="--i:1">Annual Targets</h1>
      <div class="card anim" style="--i:2" id="target-bars"></div>
    </div>
    <aside class="notes">{{TARGET_NOTES}}</aside>
  </section>

  <!-- ══ CLOSING ════════════════════════════════════════ -->
  <section class="slide" data-bg="closing" data-title="Thank you">
    <div class="layer-glow"></div>
    <div class="slide-body" style="justify-items:end;text-align:right">
      <h2 class="slide-sub anim" style="--i:0">Next month</h2>
      <ul class="checks anim" style="--i:1">{{NEXT_MONTH_ITEMS}}</ul>
    </div>
    <aside class="notes">{{CLOSING_NOTES}}</aside>
  </section>

</main>

<script type="module" src="../../assets/js/boot.js"></script>
<script type="module">
  import { donut, lineChart, targetBar } from '../../assets/js/charts.js';
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('phish-donut', donut({{PHISH_SLICES}}, { centre: '{{PHISH_CENTRE}}', alt: '{{PHISH_ALT}}' }));
  set('phish-trend', lineChart({{TREND_POINTS}}, { alt: '{{TREND_ALT}}' }));
  set('target-bars', {{TARGET_ROWS}}.map(targetBar).join(''));
  document.querySelectorAll('.tbar-fill').forEach((el) => {
    el.dataset.fill = parseInt(el.getAttribute('width'), 10);
    el.style.setProperty('--fill', el.getAttribute('width'));
  });
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```powershell
git add templates/month.html
git commit -m "feat: add the month page template"
```

---

# PHASE 6 — Tracking files

### Task 15: Seed the annual targets from the spreadsheets

**Files:**
- Create: `tracking/targets/bsc-annual-2026.md`
- Create: `tracking/targets/deliverables-2026.md`

Figures come from `the department annual planning workbook (kept outside this repository)` (sheet BSC) and `the 2026 deliverables workbook (kept outside this repository)`, already extracted in the spec §3.2 and §3.3.

- [ ] **Step 1: Write `tracking/targets/bsc-annual-2026.md`**

```markdown
# ICT Department — Annual Targets 2026 (Balanced Scorecard)

Source: `the department annual planning workbook (kept outside this repository)`, sheet "BSC".
Update the "Actual" column each month. The report reads this file.

## Organisational Capacity

| What we're measuring | Target for the year | Actual so far | Notes |
|---|---|---|---|
| Staff in succession pooling | 2 | 0 | |
| Positions filled against budget | 100% | 0% | |
| Employee retention rate | 100% | 0% | |
| Trainings and seminars attended | 4 | 0 | |
| New department digital solutions adopted | 1 | 0 | |
| IT positions filled | 1 | 0 | |
| IT / Server office completed | 100% | 0% | |
| Digital storage facility completed | 100% | 0% | |

## Internal Business Process

| What we're measuring | Target for the year | Actual so far | Notes |
|---|---|---|---|
| IT support response time | 24 hours or less | — | Lower is better |
| Policies approved by Mancom | 8 | 0 | |
| Guidelines approved | 5 | 0 | |
| Processes improved or automated | 4 | 0 | |
| Digital agreements standardised | 5 | 0 | |

## Financial

| What we're measuring | Target for the year | Actual so far | Notes |
|---|---|---|---|
| Budget utilisation (CapEx and ComEx) | 95% | 0% | |

## Members and Stakeholders

| What we're measuring | Target for the year | Actual so far | Notes |
|---|---|---|---|
| Digitalisation projects in use | 6 | 0 | |
| Information drives held | 5 | 0 | |
| Structured cabling installations | 2 | 0 | |
| IT asset housekeeping | 100% | 0% | |
| Security breaches | 0 | 0 | Lower is better |
| Incident response time | 3.69 | — | Lower is better |
| Phishing failure rate | 1% or less | — | Lower is better. **See the note below.** |
| User satisfaction with digitalisation | 95% | 0% | |

## Note on the phishing figure — needs confirming

The BSC calls for a **failure rate of 1% or less** (how many staff click the fake
email). The personal PMS file records "% of Phish Failure" with a target and an
actual that read as a **pass rate**, not a failure rate. The figures themselves
are private and are deliberately not written down here.

These two cannot both be failure rates. Until the owner confirms which is meant,
this file records **failure rate: lower is better**, and every report states the
unit in plain words — for example "4 of 120 staff clicked the test email (3.3%)".
```

- [ ] **Step 2: Write `tracking/targets/deliverables-2026.md`**

```markdown
# Gipre F. Naparan — 2026 Deliverables (IT Supervisor, SoftDev & InfoSec)

Source: `the 2026 deliverables workbook (kept outside this repository)`.
These are department-level deliverables and are safe to show in the report.
Personal performance ratings are NOT here — they live in `private\pms-tracker.md`.

## Organisational Capacity

| # | What we're measuring | Target | Actual so far | Evidence |
|---|---|---|---|---|
| 1 | Cybersecurity trainings attended | 1 | 1 | Cybersecurity Awareness session |
| 2 | Software development / digitalisation trainings attended | 1 | 0 | |
| 3 | Secure development standards adopted | 100% | 100% | Git and GitHub in use, automatic ticketing |
| 4 | System improvements proposed | at least 10 | 10 | BLC-SMS, Queuing System, MIS, SMS Facility, PPD Directory, CAC-IIS, CMS, Mart Online Store, RMS, FMS |
| 5 | System maintenance completed | 100% | 50% | BLC-SMS, Queuing, PPD, SMS, MIS |

## Internal Business Process

| # | What we're measuring | Target | Actual so far | Evidence |
|---|---|---|---|---|
| 6 | Application uptime | 99% or better | 100% | |
| 7 | Annual vulnerability assessment completed | 100% | 100% | 82% rate recorded |
| 8 | Critical vulnerabilities fixed on time | 100% | 100% | |
| 9 | Major security breaches | 0 | 0 | Lower is better |
| 10 | User access reviews done and written up | 100% | 100% | |
| 11 | Audit findings closed on time | 100% | 100% | |

## Financial

| # | What we're measuring | Target | Actual so far | Evidence |
|---|---|---|---|---|
| 12 | Money lost to a cyber incident | 0 | 0 | Lower is better |
| 13 | Software project cost vs approved budget | within 5% | — | Handled by Finance |

## Members and Stakeholders

| # | What we're measuring | Target | Actual so far | Evidence |
|---|---|---|---|---|
| 14 | Data Privacy Act compliance | 100% | 100% | |
| 15 | Approved improvements delivered on time | 90% or better | 100% | |
| 16 | Satisfaction rating from other departments | 85% or better | — | |
```

- [ ] **Step 3: Verify the files parse and read sensibly**

Open both in Notepad. Confirm no jargon, no personal ratings, and that every "lower is better" row says so.

- [ ] **Step 4: Commit**

```powershell
git add tracking/targets/
git commit -m "docs: seed annual BSC and deliverables tracking from the planning spreadsheets"
```

---

### Task 16: Seed the ten project files

**Files:**
- Create: `tracking/projects/blc-sms.md`, `cac-iis.md`, `mis.md`, `mart-online-store.md`, `queuing-system.md`, `sms-blast.md`, `ppd-directory.md`, `rms.md`, `fms.md`, `cms.md`

History known from the January, March, and May PowerPoints: BLC-SMS and CAC-IIS appear from March; MIS from March; Mart Online Store first appears in May.

- [ ] **Step 1: Write `tracking/projects/blc-sms.md`**

```markdown
# BLC School Management System
Status: In Progress · Progress: 0% · Target completion: TBC with the owner
Linked to: Deliverable #4 (System improvements proposed), BSC "Digitalisation projects in use"

## What this is
The system BUGEMCO Learning Center uses to run the school — enrolling students,
keeping records, grading, and billing.

## Modules
- [ ] Enrollment
- [ ] Student Records
- [ ] Grading
- [ ] Billing
- [ ] Report Cards
- [ ] Parent Portal

## Blockers

## Monthly log
- 2026-05 — Presented to BLC (system presentation meeting)
- 2026-03 — Reported to Mancom
```

**Progress and module ticks are deliberately left at zero.** They are filled in from what the owner reports, never guessed. The first build asks him.

- [ ] **Step 2: Write the other nine using the same shape**

Same headings in the same order. Vary only `# name`, `## What this is`, `## Modules`, and `## Monthly log`:

| File | Name | What this is |
|---|---|---|
| `cac-iis.md` | Coop Assurance Center System | Handles the coop's insurance and assurance records and claims. Log: `2026-05 — System presentation meeting`, `2026-03 — Reported to Mancom` |
| `mis.md` | Membership Information System | Holds member information for the Membership Department. Log: `2026-05 — Reported to Mancom`, `2026-03 — Reported to Mancom` |
| `mart-online-store.md` | BUGEMCO Mart Online Store | Lets members browse and order from BUGEMCO Mart online. Log: `2026-05 — First reported to Mancom` |
| `queuing-system.md` | Queuing System | Manages the queue of members waiting for service at branches. Log: `2026-05 — Covered in the SCL Dura meeting alongside MIS` |
| `sms-blast.md` | SMS Blast Facility | Sends text messages to many members at once. Log: `2026-03 — Reported to Mancom under Automation` |
| `ppd-directory.md` | Policy and Procedure Directory | One place to find every approved policy and procedure. Log: `2026-05 — Listed as a completed deliverable` |
| `rms.md` | RMS | Named in the 2026 deliverables. Purpose to be confirmed with the owner. Log: *(empty)* |
| `fms.md` | FMS | Named in the 2026 deliverables. Purpose to be confirmed with the owner. Log: *(empty)* |
| `cms.md` | CMS | Named in the 2026 deliverables. Purpose to be confirmed with the owner. Log: *(empty)* |

For `rms.md`, `fms.md`, and `cms.md`, put this line under `## What this is`:
`Confirm with the owner what this system does and who uses it before it appears in a report.`

- [ ] **Step 3: Verify the parser reads every file**

```powershell
cd '<project root>'
node -e "import('./tools/lib/tracking.js').then(async m=>{const fs=await import('node:fs');for(const f of fs.readdirSync('tracking/projects')){const p=m.parseProject(fs.readFileSync('tracking/projects/'+f,'utf8'));console.log(f.padEnd(24), p.name.padEnd(36), p.progress+'%', p.modules.length+' modules', p.log.length+' log entries');}})"
```

Expected: ten lines, every `name` non-empty, no crash.

- [ ] **Step 4: Commit**

```powershell
git add tracking/projects/
git commit -m "docs: seed the ten system tracking files with known history"
```

---

### Task 17: Seed the security, support, and team files

**Files:**
- Create: `tracking/infosec/phishing-log.md`, `training-log.md`, `incidents.md`, `vulnerability.md`, `policies-guidelines.md`
- Create: `tracking/support-network/support-log.md`, `network-log.md`
- Create: `tracking/team/meetings-events.md`, `org-staffing.md`

- [ ] **Step 1: Write `tracking/infosec/phishing-log.md`**

```markdown
# Phishing Simulation Results

We send staff a harmless fake phishing email to see who would fall for a real one.

**We record totals only. Never write down the name of anyone who clicked.**

| Month | Emails sent | Opened | Clicked the link | Gave details | Reported it | Click rate |
|---|---|---|---|---|---|---|
| 2026-03 | | | | | | |
| 2026-05 | | | | | | |

## What "click rate" means
Out of everyone who received the test email, the share who clicked the fake link.
Lower is better. The department target is 1% or less.

## Notes
- Figures for March and May are blank because the PowerPoints recorded them as
  screenshots only. Ask the owner to fill these in from the phishing tool.
```

- [ ] **Step 2: Write `tracking/infosec/training-log.md`**

```markdown
# Cybersecurity Training and Awareness

| Date | What it was | Who attended | How many | Notes |
|---|---|---|---|---|
| 2026-01 | Employees Orientation Day 2 — Cybersecurity | New employees | | From `Employees Orientation Day 2 - Cybersecurity.pptx` |
| 2026-03 | Cybersecurity Training | | | Reported to Mancom |
| 2026-05 | Cybersecurity Awareness | | | Counts towards Deliverable #1 |

Counts towards: BSC "Trainings and seminars attended" (target 4) and Deliverable #1.
```

- [ ] **Step 3: Write the remaining seven files**

`tracking/infosec/incidents.md`:
```markdown
# Security Incidents

Target: zero breaches for the year. Lower is better.

| Date | What happened | How serious | What we did | Closed? |
|---|---|---|---|---|
| | *No incidents recorded so far in 2026.* | | | |

**Never record passwords, IP addresses, server names, or member details here.**
Describe what happened in plain words instead.
```

`tracking/infosec/vulnerability.md`:
```markdown
# Vulnerability Assessment

| Round | Date | Coverage | Critical issues found | Fixed on time | Notes |
|---|---|---|---|---|---|
| 2026 annual | | 100% | | | Recorded as an 82% rate in the deliverables sheet — confirm what that refers to |

Counts towards: Deliverables #7 and #8.
```

`tracking/infosec/policies-guidelines.md`:
```markdown
# Policies and Guidelines

Targets for 2026: **8 policies** approved by Mancom, **5 guidelines** approved.

## Policies
| # | Title | Status | Date approved |
|---|---|---|---|
| | | | |

## Guidelines
| # | Title | Status | Date approved |
|---|---|---|---|
| | | | |

Running total: policies 0 of 8 · guidelines 0 of 5.
Weekly Policy Review meetings are logged in `../team/meetings-events.md`.
```

`tracking/support-network/support-log.md`:
```markdown
# Support Provided

| Month | ATM cards issued | ATM machine issues | Branch maintenance visits | Technical requests | Events supported | Average response time |
|---|---|---|---|---|---|---|
| 2026-03 | | | | | Appreciation Party, General Assembly, BLC Events, Information Drive | |
| 2026-05 | | | | | Youth Camp, Information Drive | |

Target response time: 24 hours or less. Lower is better.
```

`tracking/support-network/network-log.md`:
```markdown
# Network

| Month | What was done | Downtime | Structured cabling | Notes |
|---|---|---|---|---|
| 2026-03 | Reported to Mancom (screenshot only) | | | Ask the owner for details |
| 2026-05 | Reported to Mancom (screenshot only) | | | Ask the owner for details |

Target: 2 structured cabling installations for the year; application uptime 99% or better.

**Never record IP addresses, device names, or network diagrams here — this file is published.**
```

`tracking/team/meetings-events.md`:
```markdown
# Meetings, Events, and Training

## Regular meetings
- Weekly Mancom Meeting
- Weekly Policy Review

## 2026 log
| Month | Meetings | Events supported | Training / seminars |
|---|---|---|---|
| 2026-03 | General Assembly Meetings, Fligno, BLC SMS presentation, CAC System presentation, SCL Dura, R3Hub | Appreciation Party, General Assembly, BLC Events | |
| 2026-05 | BLC SMS presentation, SCL Dura (MIS & Queuing System) | Youth Camp | Cybersecurity Awareness, Spiritual Enrichment |
```

`tracking/team/org-staffing.md`:
```markdown
# Department Structure and Staffing

| Item | Target for 2026 | Status |
|---|---|---|
| Enhanced department organisational chart | Complete | Reported complete |
| IT Specialist hired | 1 position | In progress — noted in the May report |
| Staff in succession pooling | 2 | |
| Team members sent to training | All | |

Positions: Supervisor-Programmer (Gipre F. Naparan), reporting to the ICT Manager,
supervising IT Associates.
```

- [ ] **Step 4: Write `tracking/DASHBOARD.md`**

```markdown
# ICT Department — Where Everything Stands

Last updated: *(set when a month is built)*

## Systems

| System | How far along | Status | Waiting on |
|---|---|---|---|
| BLC School Management System | — | In Progress | |
| Coop Assurance Center System | — | In Progress | |
| Membership Information System | — | In Progress | |
| BUGEMCO Mart Online Store | — | In Progress | |
| Queuing System | — | In Progress | |
| SMS Blast Facility | — | | |
| Policy & Procedure Directory | — | | |
| RMS | — | Not started | Purpose to be confirmed |
| FMS | — | Not started | Purpose to be confirmed |
| CMS | — | Not started | Purpose to be confirmed |

## Annual targets at risk
*(filled in each month by the Target Tracker — anything falling behind the calendar)*

## Questions waiting on the owner
- What do RMS, FMS, and CMS actually do?
- Is "phish failure rate" a failure rate or a pass rate? (See `targets/bsc-annual-2026.md`.)
- Phishing figures for March and May.
```

- [ ] **Step 5: Commit**

```powershell
git add tracking/
git commit -m "docs: seed security, support, network, team, and dashboard tracking files"
```

---

# PHASE 7 — Screenshot pipeline

### Task 18: Screenshot optimiser

**Files:**
- Create: `tools/optimize-screenshots.ps1`

- [ ] **Step 1: Write the script**

```powershell
<#
  Takes whatever is in intake\<month>\ and writes web-sized JPEGs into
  reports\<folder>\img\ with tidy names.

  Originals are copied to private\raw-screenshots\<month>\ first, so nothing
  is ever lost and the untouched versions never reach the public repo.

  Usage:
    powershell -File tools\optimize-screenshots.ps1 -Month 2026-07 -ReportFolder 2026-07-july
#>
param(
  [Parameter(Mandatory)][string]$Month,
  [Parameter(Mandatory)][string]$ReportFolder,
  [int]$MaxWidth = 1800,
  [int]$Quality = 82
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$src    = Join-Path $root "intake\$Month"
$dst    = Join-Path $root "reports\$ReportFolder\img"
$keep   = Join-Path $root "private\raw-screenshots\$Month"

if (-not (Test-Path $src)) { throw "No such folder: $src. Put this month's screenshots there first." }
New-Item -ItemType Directory -Force -Path $dst, $keep | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

$i = 0
$report = @()
Get-ChildItem $src -File -Include *.png,*.jpg,*.jpeg,*.bmp -Recurse | Sort-Object Name | ForEach-Object {
    $i++
    Copy-Item $_.FullName (Join-Path $keep $_.Name) -Force

    $img = [System.Drawing.Image]::FromFile($_.FullName)
    $w = [math]::Min($MaxWidth, $img.Width)
    $h = [int][math]::Round($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h)

    $name = 'shot-{0:d2}.jpg' -f $i
    $out = Join-Path $dst $name
    $bmp.Save($out, $codec, $ep)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()

    $before = [math]::Round($_.Length / 1KB)
    $after  = [math]::Round((Get-Item $out).Length / 1KB)
    $report += [pscustomobject]@{ New = $name; Original = $_.Name; Size = "${w}x${h}"; BeforeKB = $before; AfterKB = $after }
}

if ($i -eq 0) { throw "No image files found in $src" }
$report | Format-Table -AutoSize
$totalBefore = ($report | Measure-Object BeforeKB -Sum).Sum
$totalAfter  = ($report | Measure-Object AfterKB  -Sum).Sum
"`n$i screenshots. $totalBefore KB -> $totalAfter KB ($([math]::Round(100 - 100*$totalAfter/$totalBefore))% smaller)."
"Originals kept in: $keep (never uploaded)"
"`nNEXT: look at every file in $dst and confirm none of them show member names, account numbers, or amounts."
```

- [ ] **Step 2: Test with sample images**

```powershell
cd '<project root>'
New-Item -ItemType Directory -Force intake\2026-99 | Out-Null
Copy-Item 'assets\img\bg-content.jpg' 'intake\2026-99\test-a.jpg'
Copy-Item 'assets\img\bg-title.jpg'   'intake\2026-99\test-b.jpg'
powershell -File tools\optimize-screenshots.ps1 -Month 2026-99 -ReportFolder 2026-99-test
```

Expected: a table with `shot-01.jpg` and `shot-02.jpg`, a percentage saved, the originals-kept line, and the reminder to check for member data.

- [ ] **Step 3: Clean up and commit**

```powershell
Remove-Item intake\2026-99, reports\2026-99-test, private\raw-screenshots\2026-99 -Recurse -Force
git add tools/optimize-screenshots.ps1
git commit -m "feat: add screenshot optimiser that preserves originals privately"
```

---

# PHASE 8 — The May demo

### Task 19: Extract May's content

**Files:**
- Create: `private/raw-screenshots/2026-05/` (from the PPTX)
- Create: `reports/2026-05-may/img/`

May's PowerPoint is the richest source available and no new input from the owner is needed to build it.

- [ ] **Step 1: Unpack May's media**

```powershell
$root = '<project root>'
$work = Join-Path $env:TEMP 'may-extract'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Force $work | Out-Null
Copy-Item 'the May monthly report PowerPoint (kept outside this repository)' "$work\src.zip"
Expand-Archive "$work\src.zip" "$work\x"
New-Item -ItemType Directory -Force "$root\intake\2026-05" | Out-Null
# Copy everything over 20 KB; the three template backgrounds are weeded out in Step 2.
Get-ChildItem "$work\x\ppt\media" -File | Where-Object { $_.Length -gt 20KB } | ForEach-Object {
  Copy-Item $_.FullName "$root\intake\2026-05\$($_.Name)"
}
Get-ChildItem "$root\intake\2026-05" | Select-Object Name, Length | Format-Table -AutoSize
```

- [ ] **Step 2: Identify and remove the background images from the intake**

The three template backgrounds are 4800×2700. Delete any file with those exact dimensions — they are already in `assets/img/`.

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem "$root\intake\2026-05" -File | ForEach-Object {
  $i = [System.Drawing.Image]::FromFile($_.FullName)
  $isBg = ($i.Width -eq 4800 -and $i.Height -eq 2700)
  $dims = "$($i.Width)x$($i.Height)"; $i.Dispose()
  if ($isBg) { Remove-Item $_.FullName; "removed background: $($_.Name)" } else { "kept: $($_.Name) $dims" }
}
```

- [ ] **Step 3: Run the optimiser**

```powershell
powershell -File tools\optimize-screenshots.ps1 -Month 2026-05 -ReportFolder 2026-05-may
```

- [ ] **Step 4: Look at every optimised screenshot**

Open each file in `reports\2026-05-may\img\`. Note in a scratch list what each one shows, so the right screenshot goes on the right slide. **Flag any that show member names, account numbers, or amounts** — these must be excluded or blurred before the demo is shown, even though the demo is not published.

- [ ] **Step 5: Commit**

```powershell
git add reports/2026-05-may/img/
git commit -m "chore: extract and optimise May 2026 screenshots for the design demo"
```

---

### Task 20: Build the May demo page

**Files:**
- Create: `reports/2026-05-may/index.html`

May's slide list, from the PowerPoint: Title · SoftDev ×4 (BLC-SMS, CAC, Mart, MIS) · InfoSec ×6 (phishing) · Network · Support · Others · Closing.

- [ ] **Step 1: Copy the template and fill it in**

```powershell
Copy-Item templates\month.html reports\2026-05-may\index.html
```

Then replace every `{{...}}` placeholder. Rules for the demo:

- **Only use figures that exist.** May's PowerPoint carries no numbers, so where a figure is unknown, write the honest thing — `"Reported to Mancom; figures not recorded in the source deck"` — rather than inventing one. Progress bars for systems whose percentage is unknown are **omitted**, not set to a guess.
- Collapse the six identical Information Security slides into **one** security slide plus, if the screenshots differ meaningfully, a second. Six slides saying the same three words is a limitation of PowerPoint, not something to reproduce.
- Add the Annual Targets slide using real figures from `tracking/targets/deliverables-2026.md`.
- Every screenshot gets a real `alt` description of what it shows.
- Add a visible banner on the title slide: **"Design demo — rebuilt from the May 2026 PowerPoint. Not published."**

- [ ] **Step 2: Verify no placeholders survive**

```powershell
Select-String -Path reports\2026-05-may\index.html -Pattern '\{\{'
```

Expected: **no output.** Any match is a failure — fix before continuing.

- [ ] **Step 3: Open it in a browser and click through every slide**

Use Playwright to navigate to `file:///<project root>/reports/2026-05-may/index.html`, screenshot each slide at 1920×1080, and check:
- no text overlaps another element
- nothing is cut off at the edges
- every image loads
- the counter matches the number of slides
- pressing `C` visibly stops the particles

- [ ] **Step 4: Commit**

```powershell
git add reports/2026-05-may/index.html
git commit -m "feat: rebuild the May 2026 report as a design demo"
```

---

### Task 21: Front page

**Files:**
- Create: `index.html`

- [ ] **Step 1: Build the archive page**

A single page listing every month as a card: month name, a one-line summary, the number of slides, and a link. Uses `tokens.css` and `report.css`, but **scrolls normally** — it is not a deck. Same background photo treatment, capsules, and glow, so it feels part of the same thing.

Include at the top: department name, the owner's name and title, and a plain sentence explaining what the site is:
*"Monthly reports from the ICT Department — Software Development and Information Security."*

- [ ] **Step 2: Verify links**

Open `index.html`, click the May card, confirm it opens the deck, and that the browser Back button returns to the front page.

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "feat: add the front page listing every month"
```

---

# PHASE 9 — The agent team

### Task 22: Agent definitions, part 1 — the builders

**Files:**
- Create: `.claude/agents/report-builder.md`, `visual-designer.md`, `data-analyst.md`, `copy-editor.md`, `screenshot-optimizer.md`

Each file uses this frontmatter shape:

```markdown
---
name: report-builder
description: Assembles a month's slide HTML from the tracking files and the owner's notes. Use when building or revising a monthly report page.
tools: Read, Write, Edit, Glob, Grep
---

<the agent's instructions>
```

- [ ] **Step 1: Write `report-builder.md`**

Instructions must state:
- Start from `templates/month.html`. Never write a month page from scratch.
- Every figure must come from a `tracking/` file. If a figure is not there, **stop and ask** — never estimate.
- No `{{` may remain in the output.
- Slide order follows the department standard: Title → Software Development → Information Security → Network → Support → Others → Annual Targets → Closing.
- Screenshots are referenced as `img/shot-NN.jpg` relative to the month folder.
- Every `<img>` needs an `alt` that describes what the screenshot shows.
- Write speaker notes into each `<aside class="notes">`.

- [ ] **Step 2: Write `visual-designer.md`**

- Owns `assets/css/*` and `assets/js/effects.js` only. Must not edit a month's HTML.
- Any change must keep calm mode working: with `html.calm` set, no animation may run.
- Must not add an external dependency, CDN link, or web font request.
- Must keep contrast at WCAG AA or better.

- [ ] **Step 3: Write `data-analyst.md`**

- Converts the owner's words into figures for the tracking files.
- Uses `tools/lib/pace.js` to decide whether a target is on track.
- **Never invents a number.** If the owner said "most of it is done", the analyst asks for a figure rather than writing 80%.
- Produces the `donut`/`lineChart`/`targetBar` argument arrays for the page.

- [ ] **Step 4: Write `copy-editor.md`**

- Rewrites everything into plain language a manager understands.
- Bans unexplained jargon; expands every abbreviation on first use per report.
- Checks the tone matches previous months.
- Flags any sentence that claims something the tracking files do not support.

- [ ] **Step 5: Write `screenshot-optimizer.md`**

- Runs `tools/optimize-screenshots.ps1`.
- Then looks at every optimised image and writes a one-line description of each.
- **Explicitly lists any screenshot showing names, account numbers, amounts, or anything that looks like member data**, and reports these to the owner before the report is assembled.

- [ ] **Step 6: Commit**

```powershell
git add .claude/agents/
git commit -m "feat: add the five builder agents"
```

---

### Task 23: Agent definitions, part 2 — the record keepers

**Files:**
- Create: `.claude/agents/target-tracker.md`, `meeting-notes-taker.md`, `archive-manager.md`

- [ ] **Step 1: Write `target-tracker.md`**

- Reads `tracking/targets/*.md`, updates the "Actual so far" column.
- Runs `pace()` for every target and lists anything `behind` in `tracking/DASHBOARD.md` under "Annual targets at risk".
- Never touches `private/pms-tracker.md` in any output destined for the report.
- Reports in plain words: *"Policies approved: 3 of 8. By July we'd expect about 5, so this one is behind."*

- [ ] **Step 2: Write `meeting-notes-taker.md`**

- Takes the owner's free-form monthly update and files each fact into the right tracking file.
- Adds a dated line to the relevant `## Monthly log`, always in `YYYY-MM` form.
- Produces a list of **the specific questions** the owner still needs to answer, and nothing vaguer than "any updates?".

- [ ] **Step 3: Write `archive-manager.md`**

- Adds the new month's card to `index.html`.
- Compares the new report against the previous month and reports contradictions — for example a system at 78% in July that was 85% in May.
- Confirms every month folder still opens.

- [ ] **Step 4: Commit**

```powershell
git add .claude/agents/
git commit -m "feat: add the three record-keeping agents"
```

---

### Task 24: Agent definitions, part 3 — the checkers

**Files:**
- Create: `.claude/agents/security-redactor.md`, `qa-inspector.md`, `accessibility-checker.md`, `git-publisher.md`

- [ ] **Step 1: Write `security-redactor.md`** — the gate

Instructions must state, verbatim in substance:

- This site is **public**. Assume anything committed is permanently readable by anyone.
- Scan every file staged for commit for: passwords or API keys; IP addresses (`\b\d{1,3}(\.\d{1,3}){3}\b`); internal hostnames and UNC paths; internal URLs; member names, account numbers, or amounts; the name of any individual connected to a security failure; and anything sourced from `private/`.
- Phishing results may appear **only** as totals and percentages.
- Verify `private/` and `intake/` are still ignored by running `git status --porcelain --ignored`.
- **Report a clear PASS or BLOCK.** On BLOCK, name the file, the line, and what was found. Never publish on a BLOCK.
- State plainly in every report: *"I cannot read text inside a screenshot image. The owner must confirm the screenshots are safe."*

- [ ] **Step 2: Write `qa-inspector.md`**

- Open the built page in a real browser with Playwright at 1920×1080.
- Step through every slide with the Right arrow. Screenshot each.
- Assume there are problems and find them: overlapping elements, text cut off at a boundary, images that failed to load, cards nearly touching, uneven gaps, margins under 0.5in equivalent, low-contrast text, leftover `{{` placeholders, a slide counter that disagrees with the number of slides.
- Test `C` (particles stop), `Esc` (overview opens), `F`, `Home`, `End`, and clicking a screenshot (lightbox opens and closes).
- Check the browser console for errors.
- Report **all** issues including minor ones. Finding zero issues on a first pass means looking again.

- [ ] **Step 3: Write `accessibility-checker.md`**

- Measure the contrast of every text-on-background combination; require 4.5:1 or better for body text and 3:1 for large text.
- Confirm the smallest rendered text is at least 16px at 1920 wide.
- Confirm every `<img>` has a meaningful `alt`.
- Confirm the page is usable with `prefers-reduced-motion: reduce` set.
- Confirm every slide is reachable by keyboard alone.

- [ ] **Step 4: Write `git-publisher.md`**

- **Must not run unless the Security Redactor has returned PASS and the owner has said the word "publish" for this specific month.**
- Commit, push, confirm GitHub Pages has built, and return the link.
- Never use `--force`, never skip hooks.

- [ ] **Step 5: Commit**

```powershell
git add .claude/agents/
git commit -m "feat: add the four checking agents including the publish gate"
```

---

### Task 25: Slash commands

**Files:**
- Create: `.claude/skills/new-month/SKILL.md`, `build-report/SKILL.md`, `publish/SKILL.md`, `status/SKILL.md`, `check-targets/SKILL.md`

- [ ] **Step 1: Write `new-month/SKILL.md`**

```markdown
---
name: new-month
description: Start a new month's report. Creates the folders, asks the owner what happened, and files the answers into the tracking files.
---

1. Work out the month from the owner, or default to the one that just ended.
2. Create `intake\YYYY-MM\` and `reports\YYYY-MM-monthname\img\`.
3. Ask the owner to drop screenshots into the intake folder. Wait.
4. Ask for the month's update in their own words.
5. Dispatch **meeting-notes-taker** to file every fact into `tracking\`.
6. Dispatch **data-analyst** to turn words into figures, asking about anything vague.
7. Present the list of remaining questions, one at a time.
8. Stop. Do not build yet — tell the owner to run `/build-report` when ready.
```

- [ ] **Step 2: Write `build-report/SKILL.md`**

```markdown
---
name: build-report
description: Build the month's web report from the tracking files and the optimised screenshots.
---

1. Dispatch **screenshot-optimizer**. Review its list of possibly-sensitive images with the owner before continuing.
2. Dispatch **target-tracker** to bring the annual tallies up to date.
3. Dispatch **report-builder** to assemble the page from `templates\month.html`.
4. Dispatch **copy-editor** over the result.
5. Dispatch **qa-inspector** and **accessibility-checker** in parallel.
6. Fix everything they report. Re-run them. Repeat until a full pass finds nothing new.
7. Dispatch **archive-manager** to update the front page and check against last month.
8. Show the owner the finished report and the QA screenshots. Stop.

Never publish from this command.
```

- [ ] **Step 3: Write `publish/SKILL.md`**

```markdown
---
name: publish
description: Publish a finished month to GitHub Pages. Requires the owner to say the word.
---

1. Confirm which month, out loud, and get a yes.
2. Ask directly: "Have you looked at every screenshot in this report and confirmed
   none of them show member names, account numbers, or amounts?" A yes is required.
   No amount of scanning replaces this — text scanning cannot read inside an image.
3. Dispatch **security-redactor**. If it returns BLOCK, stop and report why.
4. Dispatch **git-publisher**.
5. Return the link and confirm the page opens.
```

- [ ] **Step 4: Write `status/SKILL.md` and `check-targets/SKILL.md`**

`status`: read every `tracking/` file, print a one-screen summary of each system, what's blocked, and the open questions from `DASHBOARD.md`.

`check-targets`: run `pace()` over every annual target for the current month and report — in plain words — which are ahead, on track, and behind, with the figure needed to catch up.

- [ ] **Step 5: Commit**

```powershell
git add .claude/skills/
git commit -m "feat: add the five slash-command workflows"
```

---

# PHASE 10 — Verify and hand over

### Task 26: Full test suite green

- [ ] **Step 1: Run everything**

Run: `npm test`
Expected: `# pass 28`, `# fail 0`. Any failure is fixed before proceeding.

- [ ] **Step 2: Confirm the deliverable has no dependencies**

```powershell
Select-String -Path assets\js\*.js, assets\css\*.css, templates\month.html, reports\*\index.html -Pattern 'node_modules|https?://(?!schemas\.)|cdn\.|unpkg|jsdelivr|googleapis'
```

Expected: **no output.** Any hit means the report would break without internet.

- [ ] **Step 3: Confirm the report opens with no server**

Open `reports\2026-05-may\index.html` by double-clicking it from Explorer. Confirm it renders and navigates. (ES modules over `file://` work in Chrome and Edge; if a browser blocks them, note it in `START-HERE.md` and add a one-line `npx serve` fallback there.)

- [ ] **Step 4: Commit any fixes**

```powershell
git add -A
git commit -m "test: verify the full suite and the no-dependency guarantee"
```

---

### Task 27: Owner review of the May demo

- [ ] **Step 1: Show the owner**

Present: the May demo opened in a browser, the QA screenshots of every slide, and the front page.

- [ ] **Step 2: Ask specifically**

- Do the backgrounds still look like BUGEMCO?
- Are the effects the right amount, or should anything be dialled back?
- Is the wording plain enough for the Mancom?
- Is the slide order right?

- [ ] **Step 3: Apply the feedback and re-run QA**

- [ ] **Step 4: Commit**

```powershell
git commit -am "fix: apply owner feedback from the May design demo"
```

---

### Task 28: Build the July 2026 report

**Blocked until the owner supplies July's content.**

- [ ] **Step 1: Run `/new-month` for 2026-07**
- [ ] **Step 2: Answer the questions it raises, one at a time**
- [ ] **Step 3: Run `/build-report`**
- [ ] **Step 4: Fix everything QA reports; repeat until clean**
- [ ] **Step 5: Show the owner and get approval**
- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: add the July 2026 monthly report"
```

---

### Task 29: Resolve the two open questions

- [ ] **Step 1: Ask the owner whether "phish failure rate" means failures or passes**

Update `tracking/targets/bsc-annual-2026.md` and remove the note once settled.

- [ ] **Step 2: Ask what RMS, FMS, and CMS are**

Fill in `tracking/projects/rms.md`, `fms.md`, `cms.md`. Remove the "confirm with the owner" lines.

- [ ] **Step 3: Commit**

```powershell
git add tracking/
git commit -m "docs: resolve the phishing metric definition and the RMS/FMS/CMS descriptions"
```

---

### Task 30: Publish — owner's word required

**Do not begin this task on your own initiative.**

- [ ] **Step 1: Confirm the owner has reviewed every screenshot**

Ask directly and get an explicit yes.

- [ ] **Step 2: Run the Security Redactor**

Must return PASS. On BLOCK, stop, report, fix, re-run.

- [ ] **Step 3: Create the GitHub repository**

```powershell
gh repo create bugemco-ict-monthly-report --public --source=. --remote=origin --description "ICT Department monthly reports — BUGEMCO"
git push -u origin main
gh api -X POST repos/:owner/bugemco-ict-monthly-report/pages -f "source[branch]=main" -f "source[path]=/"
```

- [ ] **Step 4: Confirm it is live**

```powershell
gh api repos/:owner/bugemco-ict-monthly-report/pages --jq '.status, .html_url'
```

Expected: `built` and a URL. Open the URL, click into a month, confirm images load.

- [ ] **Step 5: Give the owner the link and record it**

Add the URL to `START-HERE.md`.

```powershell
git add START-HERE.md
git commit -m "docs: record the published site address"
git push
```

---

## Self-review against the spec

| Spec section | Covered by |
|---|---|
| §2 decision 1 — conversational intake | Tasks 25 (`/new-month`), 23 (meeting-notes-taker) |
| §2 decision 2 — slide-deck behaviour | Tasks 11, 13 |
| §2 decision 3–4 — public GitHub Pages | Task 30 |
| §2 decision 5 — redaction gate | Tasks 24, 25 (`/publish`) |
| §2 decision 6 — July first, May demo | Tasks 19–21, 28 |
| §2 decision 7 — modernised slides | Tasks 12, 14 |
| §2 decision 8 — tracking scope incl. support & network | Tasks 15–17 |
| §2 decision 9 — no personal PMS data | Task 1 (`.gitignore`), Task 24 |
| §2 decision 10 — maximum effects + calm mode | Task 13 |
| §2 decision 11 — 12 agents + shortcuts | Tasks 22–25 |
| §2 decision 12 — vanilla, no build | Task 26 step 2 |
| §3.1 three backgrounds, 16:9, Aptos Black | Tasks 3, 4, 6 |
| §3.2–3.3 BSC and Deliverables | Task 15 |
| §3.5 phishing metric contradiction | Tasks 15, 29 |
| §4 folder structure | Task 1 |
| §5.1–5.2 tokens and type | Tasks 4, 5 |
| §5.3 layer stack | Tasks 12, 13 |
| §5.4 seven slide types | Task 14 |
| §5.5 controls | Tasks 11, 13 |
| §6 tracking format | Tasks 9, 16 |
| §7 agent team and publish gate | Tasks 22–25 |
| §8 risks | Screenshots: Tasks 18, 22, 25. Repo size: Task 18. Performance: Task 13. Thin history: Task 8 single-point test. Maintenance: Task 1 `START-HERE.md`. |
| §9 build order | Phase order matches |
| §10 open item | Task 29 |

**Not covered by any task, and deliberately so:** PDF export. `report.css` includes a `@media print` block so the browser's own "Print to PDF" produces one slide per page, which is enough. A dedicated exporter is not built unless asked for.
