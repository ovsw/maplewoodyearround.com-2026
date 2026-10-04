# Maplewood shared design

The live [Maplewood website](https://www.maplewoodyearround.com/) is the visual reference. This rebuild keeps its identity and layout. Measurements below were checked at 1440 × 1000 and 390 × 844 on 2026-10-03.

## Color

Use the `--maplewood-*` tokens in `app/globals.css`.

| Token                       | Value                             | Use                      |
| --------------------------- | --------------------------------- | ------------------------ |
| green                       | `#006601`                         | Main actions, navigation |
| green-dark                  | `#004201`                         | Action hover             |
| cream                       | `#fffbf0`                         | Page and menu background |
| ink                         | `#243021`                         | Body text                |
| gold / gold-mid / gold-dark | `#ffd700` / `#ffb000` / `#ff8400` | Summer accents           |
| mint / mint-dark            | `#43af89` / `#00a341`             | School-year accents      |
| purple / purple-dark        | `#d779fc` / `#ae4dd5`             | Play-center accents      |
| blue / blue-dark            | `#87ceeb` / `#2795d5`             | Gift-card accents        |
| focus                       | `#e64420`                         | Focus and red accents    |

The footer uses the source's `oklch(.32 .3 135)` background and `oklch(.85 .1 135)` text. Its headings are white. Light text on dark surfaces must remain readable; accent colors are not substitutes for body text.

## Type

Fonts load through `next/font`: Lato for body text, Poppins for display text, and Halant for the source's serif accents. Body text is 16px with a 1.5 line height. Main page headings scale from 40px to 56px, with a 1.2 line height. Section headings scale from 36px to 48px, with a 1.2 line height. Both use weight 700. Navigation text uses Lato. The large footer wordmark uses Poppins 700.

## Layout

Content is 90% wide, with a 1280px maximum. Responsive changes occur below 992px, 768px, and 480px, matching source breakpoints 991/767/479. The white sticky header is 72px high on desktop and 64px on mobile. It hides while scrolling down and returns while scrolling up. It stays visible for keyboard focus, an open menu, and reduced motion.

The menu is a full-screen cream dialog. Desktop uses featured links on the left and link groups on the right. Mobile places the two main actions first, then featured links, groups, and contact details. Escape closes the menu and restores focus. The footer stacks its contact and navigation columns on mobile.

Use `.8em` corner radii for actions and cards, and `.4em` for small controls. Do not add the starter's overlapping rounded section edges. Keep visible focus rings and enough space for touch controls.

## Source details

The controlled menu follows the legacy navigation's dialog pattern. Its actual layout and icons come from `docs/migration/legacy-mdc/webflow-html/source-nav.html` and the live menu. The current source says “2027 Dates & Rates.” Navigation destinations, actions, contact details, social links, footer links, and newsletter messages are editable in Sanity.

The newsletter is visible because issue #5 requires it; the source currently hides it. Keep its exact source success and failure messages. Analytics load only on production, outside draft mode.

The 404 photo is copied from the public Webflow asset `67a4e0af5d7340bd41e402e3_leprechaun_staff.avif`. Its source copy and home link remain unchanged.
