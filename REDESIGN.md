# smitmalde.xyz Redesign — Project Tracker & Agent Handoff

> Living document for the portfolio redesign. Written so any agent (or human) can pick up
> the project cold. Keep it updated as decisions land and phases complete.
> Last updated: 2026-08-29.

## Who / what this is

Smit Malde's personal portfolio — https://smitmalde.xyz — static site on **GitHub Pages**
(this repo, branch `main`, custom domain via `CNAME`). Smit is an Electrical Design Engineer
on Tesla's Battery Electronics team (Aug 2025–present; designs/validates BMS boards and
high-voltage controllers, integrates AI into hardware workflows), UC Berkeley EECS '25,
ex-Chief of Formula Electric at Berkeley.

The **live site** (`index.html` + `projects/*.html`) is the old HTML5-UP template with
fully updated content (August 2026: Tesla full-time role, AI-forward framing, experience
ordered by end date, Resume button serving `Smit-Malde-Resume.pdf`). It stays live and
untouched until the redesign ships.

## The decision (final — do not relitigate)

After three rounds of design exploration (12 live animated concept demos), Smit chose:

**"Silk" design language + "Journey" color mode.**

- **Silk** = dark luxe atmosphere: a slow-drifting canvas gradient mesh behind near-black,
  refined light-weight typography, content on faint glass. Sleek, elegant, professional.
- **Journey** = scroll position blends the atmosphere from **Glacier (ice blue)** at the top
  of the page to **Nordlys (aurora green)** at the bottom. The site is a journey through light.

Taste constraints learned the hard way (a full round of 8 EE-themed directions was rejected):
- **No engineering visual metaphors** (no PCB/oscilloscope/terminal/thermal/battery imagery).
  The engineering story lives in the copy only.
- Wow must come from **motion quality, typographic craft, and finish** — award-portfolio
  register, not gimmicks. Restraint is part of the luxury.

## Reference implementation (open this first)

**`design/silk-studio-reference.html`** — complete, self-contained, working implementation
of the Silk design with the Journey mode and all approved treatments. Open it in a browser:
switch palettes bottom-right; the dashed swatch is Journey (scroll to see the blend);
scroll below the case-study card for the image treatment demo. All copy in it is
**placeholder** — the real site uses real content (see Content sources).

Everything the build needs is extractable from that file:

- **Ground:** `#08080d`; ink `#edecf3`; hairlines `rgba(237,236,243,.13)`; canvas base `#07070c`.
- **Fonts (Google):** Hanken Grotesk 200/300/400/500 (everything) + Instrument Serif italic
  (accent word, big index numerals).
- **Atmosphere:** 4 radial-gradient blobs drawn on a low-res canvas (~0.16 scale),
  CSS `blur(64px) saturate(1.12)`, `lighter` compositing, film-grain canvas overlay
  (mix-blend overlay, 0.55) to kill banding, radial dark veil on top.
- **Palettes** (blob RGBs; accent CSS vars `--a1`/`--a2`; shine = 3-stop gradient on the italic word):
  - Glacier: `[36,86,190] [28,140,185] [120,150,190] [52,58,150]` · a1 `120,170,255` · a2 `140,225,255` · shine `#bcd7ff #9fe6ff #eef4ff`
  - Nordlys: `[14,140,104] [18,112,146] [58,76,188] [10,84,66]` · a1 `110,230,180` · a2 `110,170,255` · shine `#a9f0cf #8fd0e4 #cdc6ff`
  - Journey blends the two per scroll fraction with exponential smoothing (`k = 1−exp(−dt·2.6)`).
- **Motion language:** letter-stagger blur-rise name reveal; overflow-mask line reveals;
  hairline rules scaling in; magnetic contact pill; card tilt (≤2.4°) + sheen sweep +
  cursor-following `--a1` glow; scroll-triggered reveals (IntersectionObserver).
  Everything gated behind `prefers-reduced-motion` with a composed static fallback.
- **Image treatment (approved):** photos in glass frames (18px radius, hairline border);
  at rest `saturate(.5) contrast(.97) brightness(.78)` + tint overlay
  (`rgba(var(--a1),.14)` from top + `rgba(5,5,9,.62)` from bottom); on hover, bloom to
  full color + scale 1.055. Keeps photos inside the atmosphere; hover makes them alive.

## Architecture (approved)

- **One-page scrollytelling site.** Scenes: hero → about → experience → projects → contact.
  Journey ties scroll to the color blend across the whole page.
- **Projects open as overlay panels** (shareable URLs via history API), replacing the old
  separate `projects/*.html` pages. Existing project PDFs stay as deep links.
- **Stack: Astro + GSAP (ScrollTrigger) + Lenis** smooth scroll. Static output; deploy to
  this same repo/GitHub Pages via a GitHub Action. Domain and hosting do not change.
- Build on a **branch** (e.g. `redesign`); `main` keeps serving the live site until Smit
  approves the switch.

## Content sources (use real content, not the demo copy)

- Approved site copy: current `index.html` (About narrative, experience entries with dates,
  education, projects). This copy was reviewed and approved by Smit in Aug 2026.
- Resume: `Smit-Malde-Resume.pdf` (repo root) — keep a Resume button/link. When the resume
  updates, sync this copy (canonical source lives in `~/Documents/Smit resume/`).
- Photos: `images/` — `FEB/` (race car), `PVBuck/` (PCB shots), banner/headshots. Resize and
  grade per the image treatment; PCB and car photos look excellent under the cool grade.
- Contact: mailto smit334@berkeley.edu, LinkedIn `smit-malde`, Formspree form
  (`https://formspree.io/f/xgvovnll`) — carry these over.

## Build plan

1. Scaffold Astro project (branch `redesign`), port the atmosphere + Journey engine from the
   reference into a component, set up Lenis + GSAP.
2. Build scenes with real content; project overlays; image pipeline (Astro image optimization,
   treated per spec).
3. Performance + a11y pass: 60fps atmosphere (pause when tab hidden), reduced-motion fallback,
   keyboard/focus states, mobile.
4. Local preview → **Smit approves** → GitHub Action for Astro build → merge/switch Pages
   to the new build → verify live on smitmalde.xyz.

## Working conventions (important)

- **Nothing ships without Smit's explicit approval.** Preview first, always. He gives fast,
  direct feedback — show, don't describe.
- He knows demo copy from real copy; never let placeholder text reach production.
- Commit messages are conventional; do not push to `main` without his go.
- Design exploration artifacts (private to Smit's Claude account):
  concept board `claude.ai/code/artifact/717c7a2d-263e-4ea3-a2f2-c7829e99aedf` ·
  palette studio `claude.ai/code/artifact/8b7ecc31-dfc3-4b8e-a972-a733420ce190`.

## Decision log

| Date (2026) | Decision |
|---|---|
| Aug 25 | Site content updated to Tesla FT role + AI framing; published to smitmalde.xyz |
| Aug 26 | 8 EE-metaphor design directions built, then **rejected** (too theme-heavy) |
| Aug 26 | Elegant series built (Atelier / Silk / Grid & Motion / Noir) → **Silk chosen** |
| Aug 26 | Original Silk colors rejected → cool family explored → **Glacier + Nordlys** liked |
| Aug 26 | **Journey mode chosen** (scroll blends Glacier→Nordlys); image treatment approved |
| Aug 26 | Architecture approved: one-page scrollytelling, overlays, Astro + GSAP + Lenis |
