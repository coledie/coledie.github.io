# Hough → Radon · Notebook Style & Framework

A reference for keeping this notebook coherent as it grows. Two pieces: the **visual system** (what every figure inherits) and the **pedagogical framework** (how every section is built).

---

## 1 · Visual system

### Aesthetic

> Academic research notebook. Warm off-white paper, deep ink serif typography, generous margin notes, two semantic colours throughout. Every figure should feel like a plate in a printed monograph — not a web component.

The piece is deliberately **un-web-like**: no rounded cards, no soft shadows, no gradients, no emoji, no decorative iconography. Hairline rules and pale tints carry the structure.

### Typography

| Use | Family | Weight / style |
|---|---|---|
| Display, body prose, captions | **Source Serif 4** | 400, 500; italic for emphasis & figure captions |
| Math, code, labels, metadata, controls | **JetBrains Mono** | 400, 500, 600 |

Rules:
- Body text **18 px** on **1.55** leading. Lede text **21 px** on **1.45**.
- Section heads **38 px**, masthead H1 **56 px**, both at tight tracking (`-0.015 / -0.02 em`).
- Mono metadata at **11 px**, **0.16 em** letter-spacing, uppercase. This is the “printed reference card” voice.
- Paragraphs after the first in a `.prose` block get **1.4 em text-indent** (manuscript style). The lede does not.
- `text-wrap: pretty` on every paragraph.

### Colour — two-semantic system

The entire notebook is read through one duality:

| Token | Value | Meaning |
|---|---|---|
| `--image` | `oklch(0.42 0.12 250)` (deep blue) | **Image space** — the original data domain |
| `--param` | `oklch(0.55 0.16 32)` (vermillion) | **Parameter / dual space** — where Hough/Radon live |
| `--accent` | `oklch(0.50 0.10 145)` (sage) | The *answer* — recovered model, fit line, true value |

Paper / ink ramp:

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f6f2e8` | page background |
| `--paper-elev` | `#fbf8f0` | figure surface |
| `--paper-deep` | `#ece6d4` | controls strip, math blocks |
| `--ink` | `#1b1814` | primary text |
| `--ink-2/3/4` | progressively lighter | secondary, tertiary, hairline |
| `--rule / --rule-soft` | `#cfc7b1 / #e3dcc8` | borders, grids |

Inline term coloring: `<span class="tk-image">` and `<span class="tk-param">`. Use these to land the duality in prose, sparingly. Never colour entire paragraphs.

### Layout grid

Every section is **a 140 px sidenote rail + main column**, maxed at 1180 px. This produces three reading zones:

```
┌─────────────┬──────────────────────────────────────────┐
│ § 04        │  Section title — italic emphasis allowed │
├─────────────┼──────────────────────────────────────────┤
│ SIDENOTE    │  Body prose (max 720 px line)             │
│ mono‧small  │                                          │
│ ≤ ~80 words │  ┌────────────────────────────────────┐  │
│             │  │  FIGURE                            │  │
│             │  └────────────────────────────────────┘  │
└─────────────┴──────────────────────────────────────────┘
```

The masthead and TOC reuse the same grid so the spine is unbroken from top to bottom.

### Figures

Every figure is a single `<div class="fig">` with four parts in this order:

1. **`.fig-head`** — `Fig N.M` number + short title (left), state / metadata (right). Mono, 11 px, uppercase.
2. **`.fig-body`** — the diagram. Two-panel figures use `.panels` (image left, parameter right) so the duality is visible at a glance. Three-panel figures use `.panels-3`.
3. **`.controls`** — actions and live readouts. Mono. Lives at the bottom of the body, separated by a hairline. Buttons use `.btn` / `.btn.primary` / `.btn.active`.
4. **`.fig-caption`** — italic prose summary. Tells the reader *what to see*. Always present, never optional.

Panels carry a coloured `.panel-label` (image blue, param vermillion) and a quiet `.dim` shape descriptor on the right.

### SVG conventions

All inline-SVG diagrams live in `.diagram-svg`:

| Class | Purpose |
|---|---|
| `.axis`, `.axis-tick`, `.grid` | coordinate frame |
| `.label`, `.label-axis` | axis labels |
| `.pt-image` / `.ln-image` | image-space points / lines (blue) |
| `.pt-param` / `.ln-param` | parameter-space points / lines (vermillion) |
| `.ln-truth` | recovered / fitted answer (sage, dashed) |

Use `makeView(...)` and `<Axes>` from `js/shared.jsx` — never hand-roll a coordinate system.

### Canvas conventions

For accumulators / sinograms: cream (`#fbf8f0`) → vermillion (`oklch(0.55 0.16 32)`) heat map, log-scaled when values span orders of magnitude. Frame with `#cfc7b1`.

For point clouds / 3D: solid `#1b1814` ink for primary structure, blue / vermillion for class differentiation, `#9d9479` for noise. Always sort back-to-front before drawing.

---

## 2 · Pedagogical framework

### The arc

Each section is one **conceptual move** along a single throughline:

```
01  Reframe — “move the problem to where the answer is local”
02  Concrete duality — (m, b) point↔line, draggable
03  Failure mode — Cartesian breaks at vertical
04  Refined duality — polar (θ, ρ), point↔sinusoid
05  Discretise — vote into an accumulator (rectangle → 4 peaks)
06  Lift one parameter — circle (a, b, r)
07  Lift more — planes, then the cylinder pivot to RANSAC
08  Continuous limit — Radon, sinogram, CT inversion
09  Zoom out — Hough as one corner of the duality family
10  For the reader — decision table for their own work
```

Every section answers one question, in this exact shape:

1. **What new thing are we trying to see?** (sec head + lede)
2. **What’s the smallest change to last section that gets us there?** (one paragraph)
3. **Show it, interactively.** (figure)
4. **What did we just learn? Where does it generalise / break?** (post-figure paragraph + optional `.callout`)

Resist adding more. A section that doesn’t fit this shape probably wants splitting.

### Sidenote voice

Sidenotes are **not** body text broken out for whitespace. They are one of:

- **Premise** — the conceptual setup in one sentence
- **Read it twice** — guidance for parsing the upcoming figure
- **Algorithm** — numbered pseudocode, ≤ 4 steps
- **Failure mode** — what to look out for
- **Scaling** — what changes at higher k / N
- **Decision flow** — when to use this vs the alternative

Keep them to ~ 50 words. They should be readable in isolation; if the body paragraph also has to read them, one of them is redundant.

### Math blocks

Use `.math` only for the **canonical equation** of the section. One per section, maximum two. Each carries an italic `.annot` line explaining the symbols. Math that the prose can paraphrase doesn’t need its own block.

### Callouts

`.callout` is the *one* place per section where you can break voice — for an aside, a warning, or “where this generalises.” The vermillion label tells the reader to slow down.

---

## 3 · Codebase shape

```
Hough to Radon.html       ← shell: fonts, React 18 + Babel, script loads
styles.css                ← every visual token + every component class
js/
├── shared.jsx            ← makeView, Axes, clip helpers, hooks. Load first.
├── duet-mb.jsx           ← §2  (m, b) duality
├── vertical-fail.jsx     ← §3  slope explosion
├── duet-polar.jsx        ← §4  polar sinusoid duality
├── voting.jsx            ← §5  rectangle → 4 peaks accumulator
├── circle.jsx            ← §6  circle Hough (a, b, r) slice
├── plane3d.jsx           ← §7a 3D point cloud + parameter table
├── ransac.jsx            ← §7b RANSAC line-fitting animation
├── sinogram.jsx          ← §8  Radon forward + filtered backprojection
├── duality.jsx           ← §9  the dual-representation map
└── app.jsx               ← the long-form prose + section composition
```

Every figure file exposes exactly one React component on `window.<Name>` so `app.jsx` can compose them. Components never reach into each other.

### Extending

To add a new figure:

1. Drop a new `js/<name>.jsx`, expose one component on `window`.
2. Add a `<script type="text/babel" src="...">` line to `Hough to Radon.html` **before** `js/app.jsx`.
3. Drop the component into the prose in `app.jsx` between two `<p>` blocks.
4. Give it `Fig N.M`, `.fig-head`, `.fig-body`, `.controls`, `.fig-caption` — never invent new figure chrome.

To swap a phantom / dataset / point cloud:

- All synthetic data is built inside the figure component via `useMemo`. Replace the array; nothing else changes.
- Resolution constants (`NUM_THETA`, `NUM_RHO`, `IMG_W`, `N` in §8) are local to each file — bump them for research-grade detail.

To re-skin:

- All colours are CSS custom properties on `:root` in `styles.css`. Swap `--paper` / `--ink` for a dark theme; swap `--image` / `--param` to retune the duality colour story.
- Type is two Google Font families. Replace both in the `<link>` and the corresponding `--serif` / `--mono` tokens.

---

## 4 · Non-negotiables

- **No web tropes.** No card glow, no rounded button radius > 2 px, no emoji, no inline SVG icons standing in for words.
- **Two colours carry meaning.** Don’t introduce a third semantic colour. Tints of the same hues are fine.
- **Every figure has a caption.** No exceptions.
- **One canonical equation per section, maximum.**
- **Sidenote ≤ 50 words.**
- **Prose paragraphs ≤ 4 sentences each.** If it’s longer it should be split or moved into the caption.

Drift on any of these and the piece stops looking like a notebook and starts looking like a tutorial blog post.
