# Legacy MDC work (reference only)

Ovi's earlier conversion of Maplewood sections from Webflow to Next.js + Sanity (SanityPress starter, Feb–Mar 2026). The old repo is discarded, but this work is kept so it is not redone.

**Port these instead of rebuilding from scratch.** They are not compiled or imported from here; copy and adapt them into `frontend/` and `studio/` to fit this repo's page-builder pattern.

- `sections/hero.video.tsx` + `schemas/hero.video.ts`: home page video hero (heading, description, CTAs).
- `sections/hero.video-zoom-grid.tsx` + `.module.css` + `schemas/hero.video-zoom-grid.ts`: home page scroll-driven video zoom grid with images and CTAs. This is one of the home page sections that needs its scroll animation.
- `nav/new-nav.jsx`: the Webflow header menu converted to JSX. `webflow-html/source-nav.html` is its Webflow source.
- `webflow-html/hero-33.html`: Webflow HTML of the home hero.
- `app.css`: global styles from the old attempt, including experimental native carousel controls (commented out for Turbopack).

Their Sanity content shape may differ from the content model in this repo; the content model wins.
