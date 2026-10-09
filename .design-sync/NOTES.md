# Design sync notes

Repo-specific facts for the next Claude Design sync of Maplewood.

- The site is a Next.js app, not a packaged library. `.design-sync/entry.ts`
  is a hand-written barrel of the shadcn primitives that render without
  Next.js or Sanity. Header, footer, `Breadcrumbs`, `Pagination`,
  `MissingSanityPage` and every page block import `next/link`,
  `next/image` or Sanity and are left out. Adding them needs an import alias
  the converter does not offer.
- Type contracts: `buildCmd` runs `tsc` with `.design-sync/tsconfig.types.json`
  to emit declarations into `ds-types/` (gitignored). `ds-types/node_modules`
  is a symlink to `frontend/node_modules` so React types resolve. The
  converter still prints `[DTS_REACT]` because it looks for `@types/react`
  in the repo root; ignore it, Badge and Toaster prove resolution works.
  The extractor cannot flatten `React.ComponentProps<"x"> & VariantProps<...>`
  intersections, so `dtsPropsFor` hand-writes 13 contracts. Update them when
  a component's props change.
- Styles: `.design-sync/styles.src.css` imports `frontend/app/globals.css`
  (Tailwind v4) and compiles with `@tailwindcss/cli` pinned to the frontend's
  tailwindcss version. Only classes used in `frontend/` and
  `.design-sync/previews/` exist in the output. Fonts: the app loads
  Poppins, Lato and Halant through `next/font`, so no font files live in the
  repo. The sync ships the latin woff2 files in `.design-sync/fonts/`
  (downloaded from Google Fonts, SIL OFL, Ovi approved on 2026-10-09) via
  `extraFonts`, and `styles.src.css` defines `--font-poppins`, `--font-lato`,
  `--font-halant` to those family names.
- `.design-sync/extras.ts` adds `useForm` and `toast` to the bundle for the
  Form and Toaster previews and for the design agent.
- Groups: every component lands in `general` because the source dir name
  `ui` counts as generic. Regrouping needs per-component doc stubs, which
  would replace the synthesized prompt files; not done.
- Converter deps live in `.ds-sync/` (gitignored): esbuild, ts-morph,
  @types/react, playwright 1.62.1 (matches the cached chromium-1234) and
  @tailwindcss/cli.

## Known render warns

- `[FONT_MISSING] "Cascadia Mono"`: the system mono fallback stack in
  globals.css; nothing to ship.

## Re-sync risks

- `dtsPropsFor` bodies go stale silently when `frontend/components/ui/*`
  props change. Diff the ui files against the config after upstream changes.
- The Toaster preview fires a toast in an effect; sonner draws it in its own
  system font, same as on the live site.
- The Playwright pin must match `~/.cache/ms-playwright/chromium-<build>`.
