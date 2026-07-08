# Aspect Web Studios

A minimal, single-page marketing site for Aspect Web Studios — a studio that builds websites for businesses.

## Running it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's inside

- **`index.html`** — all page content and sections
- **`style.css`** — design system, animations, and the demo-site styling
- **`script.js`** — scroll reveals, background tone shifting, counters, and demo interactions

## Features

- **Shifting backgrounds** — the page background fades between monotone greys with faint color hints as you scroll (each `<section>` has a `data-bg` attribute; tones are defined as CSS variables at the top of `style.css`).
- **Apple-style motion** — hero words rise in, gradient text shimmers, ambient blurred blobs drift, elements reveal on scroll, stat counters animate. Respects `prefers-reduced-motion`.
- **Interactive bits** — clickable stat cards, a services marquee, hover-lift cards, a process section, a one-at-a-time FAQ accordion, an editable "experiment area" in About (click it), and a demo contact form.
- **Embedded demo website** — a framed browser mockup at `#demo` containing a working mini-site for a pencil shop ("Graphite & Co.") with its own navigation, shop with badges and ratings, animated cart, click-to-sharpen pencils, a story timeline, and a newsletter signup. Swap its content later by editing the `.demo-panel` blocks in `index.html`.

## Editing placeholder areas

Sections tagged **experiment area** (About, Contact) are placeholders meant to be replaced with real content.
