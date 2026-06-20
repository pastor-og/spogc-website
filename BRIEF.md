# SPOGC Website — Claude Code Starter Brief (Week 1)

> Hand this file to Claude Code in your project folder. It contains everything needed to scaffold the St. Paul's Ocean Grove Church website. Save it as `BRIEF.md` in the repo root so Claude Code can reference it anytime.

---

## What we're building

A custom, static website for **St. Paul's Ocean Grove Church (SPOGC)**, a United Methodist congregation in Ocean Grove, NJ. It replaces a Squarespace site (oceangrove.church) and is built around a **Gather → Grow → Invite** strategy. The full strategy lives in the Digital Communication Program document; this brief covers only the Week 1 build.

**Two design mockups already exist** and define the look exactly. They are the source of truth for visual design — recreate them as a production static site:
- `spogc-homepage-mockup.html` — the homepage
- `spogc-interior-pages-mockup.html` — Start Here and Next Steps pages (use the gold switcher bar to view both)

Place those two files in a `/reference` folder in the repo. **Do not ship them as-is** — they're design references. Rebuild them as clean, production static pages with the content separated out (see below).

---

## Tech approach

- **Static site** — plain HTML, CSS, and minimal vanilla JavaScript. No framework, no build step required for v1. Fast, owned, and free to host.
- **Hosting:** Cloudflare Pages, auto-deploying from this GitHub repository on every push to `main`.
- **The content-separation rule (critical):** Everything that changes week to week lives in a single `content.json` file at the repo root. The HTML reads from it. This is what lets a non-developer (Emilie) update the site by editing one file in GitHub's browser — no code. Layout and content must stay separate.

---

## The design system (from the mockups)

**Colors — "Ocean Grove at dawn":**
- Ink navy `#0E2235` — dark sections, nav, footer
- Foam `#F7F4ED` — light section backgrounds
- Sand `#EDE6D8` — card borders, soft tint
- Tide teal `#2E7E78` — links, eyebrows, secondary accents
- Dawn gold `#E0A458` — primary buttons and CTAs **only** (scarcity = emphasis)

**Fonts (Google Fonts):** Fraunces (headlines, medium weight) and Karla (body and buttons).

**Signature elements from the mockups to preserve:** the wave/tide-line SVG dividers between sections, the soft gradient hero, generous whitespace, and rounded cards with subtle hover lift.

**Non-negotiable design rules:**
- **Mobile-first.** 80%+ of visitors are on phones. Every section must look right at ~380px wide before anything else.
- **One clear primary action per screen.** Gold is the action color; don't dilute it.
- **Accessibility:** semantic HTML5, alt text on every image, visible focus states on all interactive elements, color contrast that passes WCAG AA, `prefers-reduced-motion` respected for any animation.
- **Real photos go in `/images`** — the church will supply 8–12 real photographs. Use clearly-labeled placeholders until they arrive.

---

## Week 1 deliverables

### 1. Repository structure
```
/
├── BRIEF.md                  (this file)
├── content.json              (all editable content — the file Emilie owns)
├── index.html                (homepage)
├── start-here.html           (the /im-new page)
├── next-steps.html           (the /next-steps page)
├── /css
│   └── styles.css            (one shared stylesheet)
├── /js
│   └── content.js            (reads content.json, populates the pages)
├── /images                   (real photos + placeholders)
└── /reference                (the two mockup HTML files, for design only)
```

### 2. The three pages
Rebuild from the mockups, pulling all text from `content.json`:
- **`index.html`** — hero, the three "Start Where You Are" pathway cards (Beginning → start-here, Returning → start-here, Deepening → next-steps), the Connect/gather form section, the "This Week" sermon section, and the Invite section.
- **`start-here.html`** — hero, "What to Expect" grid, the honest FAQ, and a "Plan a Visit" form.
- **`next-steps.html`** — hero, then offerings grouped by rhythm (Weekly / Seasonal courses / Milestones), with Alpha as one seasonal-course card among peers (not a top-level category).

### 3. content.json
Design this thoughtfully — it's the heart of the maintainability strategy. Structure it so each editable piece has a clear, human-readable label. Include at minimum:
```json
{
  "service": {
    "time": "Sundays · 9:00 AM",
    "location": "Beach Church at the Boardwalk Pavilion",
    "offSeasonLocation": "80 Embury Avenue, Ocean Grove, NJ"
  },
  "thisWeek": {
    "sermonTitle": "",
    "series": "",
    "youtubeUrl": "",
    "clip1Url": "",
    "clip2Url": ""
  },
  "announcements": [],
  "pathways": { "beginning": {}, "returning": {}, "deepening": {} },
  "contact": {
    "phone": "732-775-1125",
    "address": "80 Embury Avenue, Ocean Grove, NJ 07756"
  },
  "social": { "instagram": "", "facebook": "", "youtube": "" }
}
```
(Expand as needed so that everything a non-developer would want to change lives here, and nothing they'd want to change is hard-coded in the HTML.)

### 4. Embedded forms
The gather forms (homepage Connect section, Start Here "Plan a Visit") will embed **Tithe.ly forms** so submissions land in the Tithe.ly people database. For Week 1, build the form section markup and leave a clearly-commented placeholder `<div>` where the Tithe.ly embed code will be pasted. Do not build a custom form backend.

### 5. The giving link
The nav "Give" button and footer "Give" link point to the church's existing Tithe.ly giving URL (placeholder for now).

---

## How to test (definition of done for Week 1)

- [ ] All three pages render correctly at 380px, 768px, and 1280px widths.
- [ ] Editing a value in `content.json` visibly changes the site (e.g. change the sermon title, reload, confirm).
- [ ] The full **gather loop** works on a phone: land on homepage → tap a pathway → reach a page with a form → form section displays correctly. Target: completable with a thumb in under a minute.
- [ ] Every image has alt text; every link and button has a visible focus state.
- [ ] No console errors. Lighthouse mobile score checked (aim for 90+ on Performance and Accessibility).
- [ ] Pushing to `main` triggers a Cloudflare Pages deploy and the preview URL shows the live site.

---

## Explicitly out of scope for Week 1
- No NocoDB, no n8n, no content pipeline (those are Phases 2–3).
- No custom form backend (Tithe.ly handles forms).
- No domain switch (oceangrove.church stays on Squarespace until Phase 4).
- No blog/sermon archive page yet (Phase 2+).

---

## First commands to get started

```bash
# In your projects directory:
mkdir spogc-website && cd spogc-website
git init
# (create the repo on GitHub, then:)
git remote add origin https://github.com/YOUR-USERNAME/spogc-website.git

# Then start Claude Code in this folder:
claude
```

Then tell Claude Code: *"Read BRIEF.md and the files in /reference, then scaffold the Week 1 deliverables."*

---

*One section, one job, one button. When in doubt, cut. Mobile-first, always.*
