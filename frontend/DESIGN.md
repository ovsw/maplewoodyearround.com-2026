---
name: Maplewood Day Camp and Enrichment Center
description: A year-round children's center with two equal sides, Summer Camp and School Year, on one bright, warm campus.
colors:
  green: "#006601"
  green-dark: "#004201"
  cream: "#fffbf0"
  ink: "#243021"
  white: "#ffffff"
  gold: "#ffd700"
  gold-mid: "#ffb000"
  gold-dark: "#ff8400"
  mint: "#43af89"
  mint-dark: "#00a341"
  purple: "#d779fc"
  purple-dark: "#ae4dd5"
  blue: "#87ceeb"
  blue-dark: "#2795d5"
  focus: "#e64420"
  footer-forest: "oklch(0.32 0.3 135)"
  footer-moss: "oklch(0.85 0.1 135)"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(2.25rem, 3.34vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title-sm:
    fontFamily: "Poppins, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Lato, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: "Lato, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lato, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
  accent:
    fontFamily: "Halant, serif"
rounded:
  sm: "0.4em"
  md: "0.8em"
  full: "9999px"
spacing:
  gutter: "5vw"
  section: "112px"
  section-tablet: "96px"
  section-mobile: "64px"
  container: "1280px"
  header: "72px"
  header-mobile: "64px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.gold-mid}"
    textColor: "{colors.ink}"
  button-on-green:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-text:
    textColor: "{colors.green}"
    padding: "4px 0"
  notice-card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "32px"
  text-field:
    rounded: "{rounded.sm}"
    padding: "10px 13px"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "8px 0"
---

# Design System: Maplewood Day Camp and Enrichment Center

## Overview

**Creative North Star: "The Camp Bulletin Board"**

The site is the notice board at the camp entrance. Cream paper is the background. Each card is a notice pinned to it, with a solid shadow in one bright color, offset to the lower right. Deep green carries the headings and the main actions. Gold, mint, purple, blue and red mark the notices, so a page reads as many small, cheerful announcements on one calm board.

The look is sunny and playful, bold and graphic, warm and homey, and calm and trustworthy at the same time. Color and hard shadows give the energy. Cream, green, generous space and a clear structure give the calm, so that safety facts and dates read clearly. Real photos of children, staff and the campus carry the warmth; the graphic layer stays flat and simple around them.

The live Webflow site is the visual reference. The rebuild keeps its layout, fonts, colors and images. Later work polishes this look; it does not replace it.

**Key Characteristics:**

- Cream board, deep green ink, one bright accent per notice.
- Hard offset shadows (no blur) as the only depth.
- Poppins bold headings in green; Lato for reading text.
- Small, friendly corners (0.8em) on cards and buttons.
- Summer Camp and School Year share one look. Navigation marks each side with its own color.

## Colors

A deep camp green and warm cream hold the page; five bright notice colors give each card its own voice.

### Primary

- **Camp Green** (green): headings on light backgrounds, primary buttons, links, and the Green section background.
- **Deep Pine** (green-dark): the darkest green, for panels on a Green section and for pressed or current states.

### Secondary

- **Sunshine Gold** (gold), **Marigold** (gold-mid) and **Tangerine** (gold-dark): the warm family. Marigold is the hover color of primary buttons. Gold is the link and emphasis color on green.

### Tertiary

- **Lake Mint** (mint) and **Meadow Green** (mint-dark): notices and School Year marks.
- **Party Lilac** (purple) and **Deep Violet** (purple-dark): notices and Play Center marks.
- **Sky Blue** (blue) and **Lake Blue** (blue-dark): notices and gift-card marks.
- **Signal Red** (focus): the focus ring, "Join our Team" marks and red notices.

### Neutral

- **Camp Cream** (cream): the page background, the full-screen menu and the notice cards. Text color on Green.
- **Pine Ink** (ink): body text on light backgrounds.
- **Paper White** (white): the header bar, white sections and form fields.
- **Footer Forest** (footer-forest) and **Footer Moss** (footer-moss): the footer background and its text. Footer headings are white.

### Named Rules

**The One Notice, One Color Rule.** A card has exactly one accent color, used for its offset shadow, icon or top mark. Sibling cards in a row rotate through gold, mint, blue and purple (and red), so no two neighbors match.

**The Side Color Rule.** In navigation, each destination has a fixed color: Summer Camp gold, School Year mint, Play Center purple, Gift Card blue, Join our Team red. Do not give a side's color to the other side.

**The Readable Accent Rule.** Accent colors are for shapes, shadows, icons and large display words. Body text is Pine Ink on light backgrounds and Camp Cream on Green; an accent never replaces body text.

## Typography

**Display Font:** Poppins (with sans-serif)
**Body Font:** Lato (with sans-serif)
**Accent Font:** Halant (with serif)

**Character:** Poppins bold is round, confident and friendly, like a hand-painted camp sign. Lato is quiet and easy to read for dates, rates and policies. Halant gives a single emphasized word in a heading a softer, storybook voice.

### Hierarchy

- **Display** (700, 40px to 56px, 1.2): the main page heading (H1) and hero titles.
- **Headline** (700, 36px to 48px, 1.2): section headings (H2).
- **Title** (700, 40px, 1.2) and **Title small** (700, 32px, 1.3): H3 and H4 on desktop; card and sub-section headings.
- **Body** (400, 16px, 1.5): all reading text. **Body large** (400, 18px) for introductions.
- **Label** (700, 18px, 1): menu links and short action labels, in Lato.
- **Accent** (Halant, upright): one or two emphasized words inside a heading, in the emphasis color.

### Named Rules

**The Green Heading Rule.** Headings are Camp Green on light backgrounds and Camp Cream or white on Green. Body text stays Pine Ink.

**The One Accent Word Rule.** Use Halant for at most one short phrase per heading. Never set a full heading or body text in Halant.

## Layout

Content is 90% wide (5vw gutters) with a 1280px maximum. Sections stack in full-width bands: Cream, White and Green. Section padding is 112px on desktop, 96px below 992px and 64px below 768px. Responsive changes occur below 992px, 768px and 480px, matching the source breakpoints 991, 767 and 479.

The white header is 72px high on desktop and 64px on mobile. It hides while the visitor scrolls down and returns on scroll up. It stays visible for keyboard focus, an open menu and reduced motion.

The menu is a full-screen cream dialog. On desktop, featured links are on the left and link groups on the right. On mobile, the two main actions come first, then featured links, groups and contact details. Escape closes the menu and returns focus. The footer stacks its contact and link columns on mobile and ends with a large Poppins wordmark.

Cards sit in rows of two to four with clear gaps, so each notice has room for its shadow.

## Elevation & Depth

The board is flat. Depth comes from one device only: a solid, unblurred shadow offset down and to the right, in the card's accent color. There are no soft drop shadows in the Maplewood look.

### Shadow Vocabulary

- **Pinned notice** (`box-shadow: 6px 6px 0 0 <accent>`): every card and featured image frame. On Green, the shadow is cream or white.
- **Small pin** (`box-shadow: 4px 4px 0 0 <accent>`): small cards, badges and compact tiles.
- **Halo ring** (`box-shadow: 0 0 0 8px <background>`): a ring in the section's background color that separates round photos or icons from what they overlap.

### Named Rules

**The No Blur Rule.** Shadows have zero blur. The starter's soft shadows (lift, media, globe, stamp, hero call-to-action) are leftovers and do not belong to this system.

## Shapes

Corners are small and friendly. Cards, buttons and image frames use 0.8em. Text fields, tags and small controls use 0.4em. Avatars, icon badges and dots are full circles. Lines are thin and solid; there are no dashed or decorative borders. Sections meet on straight edges.

**The Straight Seam Rule.** Sections never overlap with rounded tops; the starter's overlapping section edges stay off.

## Components

### Buttons

Solid, confident and easy to tap.

- **Shape:** gently rounded (0.8em), with a 2px border in the button's own color.
- **Primary:** Camp Green fill, Camp Cream label, Lato bold, 12px by 24px padding.
- **Hover:** the fill and border turn Marigold and the label turns Pine Ink. Focus shows a 2px Signal Red outline, 3px from the edge.
- **On Green:** Camp Cream fill with a Pine Ink label.
- **Text button:** Camp Green, underlined, no fill.
- **Small:** 8px by 20px padding.
- **Empty link:** a button with no link stays hidden until an editor adds one.

### Cards / Containers

- **Corner Style:** 0.8em.
- **Background:** Camp Cream on white sections, white on cream sections, Deep Pine on Green.
- **Shadow Strategy:** Pinned notice, in the card's one accent color (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 32px.

### Inputs / Fields

- **Style:** 1px solid border in the current text color, 0.4em corners, 10px by 13px padding, transparent or white fill.
- **Focus:** Signal Red outline, 2px, offset 3px.
- **Messages:** the newsletter keeps the exact success and failure messages of the source.

### Navigation

- **Header:** white bar with the logo, the two main actions and a menu button.
- **Menu links:** Lato bold 18px, Pine Ink; hover turns Camp Green and underlines.
- **Side marks:** each featured link carries its side color (see The Side Color Rule).
- **Mobile:** the same cream dialog, one column.

### Tags

Small labels for grades, categories and dates: 0.4em corners, a light neutral fill and a thin grey border.

## Do's and Don'ts

### Do:

- **Do** match the live site at 1440px and 390px before you add anything new.
- **Do** give every card one accent color and a 6px hard offset shadow in it.
- **Do** rotate accent colors across sibling cards.
- **Do** set headings in Poppins 700, Camp Green on light backgrounds.
- **Do** use 0.8em corners for cards and buttons and 0.4em for fields and tags.
- **Do** keep a visible Signal Red focus ring and touch targets of at least 44px.
- **Do** give every scroll animation a static version for reduced motion.

### Don't:

- **Don't** use blurred drop shadows or the starter's shadow and animation tokens.
- **Don't** use pill-shaped buttons. The live buttons have 0.8em corners.
- **Don't** darken a primary button to green on hover. The live hover is Marigold with Pine Ink text.
- **Don't** put body text in an accent color.
- **Don't** give Summer Camp and School Year different layouts or fonts. One look serves both sides.
- **Don't** add the starter's overlapping rounded section edges, grain textures or glow bands.
- **Don't** type color values into section styles. Use the shared color tokens.
