# Page content work: Maplewood Year Round facts

The page skills (`/page-plan`, `/page-draft`, `/page-polish`) hold the
process. This file holds this project's facts. Use only these; never copy
ids, names, readers or rules from another project. `/ovs-workflow-setup`
wrote this file on 2026-10-06 and checks it on every run.

## Release scope (spec issue #1 and Ovi, 2026-10-06)

The rebuild of the live site at https://www.maplewoodyearround.com on
Next.js + Sanity. Ready to launch 2026-10-15; the domain moves on
2026-10-16. The release has the 53 pages in `docs/migration/inventory.md`
(one card each). Out of scope: a redesign, new pages and new features.

- There is no content freeze, and the importer does not run again. The
  content in Sanity is the content the client edits and publishes.
- The copy may be improved; it does not have to match the old site.
- A fact that is not confirmed stays as the live site has it and gets the
  confirmation marker. A button whose target page is not on the site is
  hidden (empty link), as the spec requires.

## Stages (Ovi, 2026-10-05)

The 53 existing pages use only Polish, Internal Review and Send to client
review. A new page gets the full flow: Plan, Draft, Polish, Internal Review,
Send to client review.

<!-- ovs-workflow-setup:page-record:start -->
## Page record

The template in `/ovs-workflow-setup` owns this part. A setup run replaces
it with the template's current version; edit the template, not this part.

- **System:** Basecamp project MDC (`49101828`), card table
  "Website Pages Workflow" (`10371085963`):
  https://3.basecamp.com/6230954/buckets/49101828/card_tables/10371085963
  One card per page. The card title is the page path.
- **Columns** (`id`): Backlog (`10371085967`), To Plan (`10371085983`), To
  Build (`10371086019`), Internal Review (`10371085991`), Client Review
  (`10371086027`), Accepted (`10371086012`), Rejected (`10371085974`).
  Move cards by column id; the names on the board may start with an emoji.
- **Logins:** page-card work uses Clark, the agents' Basecamp user (person
  `52809522`): add `--profile claude` to every `basecamp` command for
  this work. Ovi is person `52614802`.
- **The card is the client's.** Clients see the card table. The card holds
  only a short description (what the page is, what to check, the page
  link), subtasks for the facts the client confirms, and the client's
  comments. Plans and agent notes never go on the card.
- **Taking a page:** read the card's assignees. If Clark is assigned,
  another run has the page: stop and tell Ovi. Otherwise assign Clark,
  read the card again, and start only if Clark is now assigned.
- **Assignment shows whose turn it is:** Clark while a run works; at
  handover, remove Clark and assign Ovi; at Client Review, the client's
  reviewer.
- **Statuses** (the card's column):
  - `/page-plan`: the card moves to To Build once its plan document exists.
  - `/page-draft`: the card stays in To Build while the draft is written;
    at handover it moves to Internal Review, assigned to Ovi.
  - `/page-polish`: the card keeps its column; at the end, assign Ovi.
  - Only Ovi starts "send to client review": publish the page and every
    document it references, move the card to Client Review, write the
    card's short description and page link, add the facts to confirm as
    subtasks, and assign the client's reviewer.
  - The client moves an approved card to Accepted. An approval by comment
    or email counts too.
- **Subtasks:** a subtask assigned to Clark is work for a run; a subtask
  assigned to the client is for the client.
- **Comments on a card:** Clark posts only short status notes ("Fixed: …")
  after Ovi asks; never questions or promises to the client.
- **Plan documents:** one Basecamp document per page in the team-only
  folder "Page plans" (`10374705399`), titled with the page path. The
  page facts come first (reader, the page's job, status new / rewrite /
  keep / merge, old pages, launch), then the plan. Find a plan by its
  title; the card never links to it, because clients cannot open it.
- **Handover notes:** comments on the page's plan document, headed "Draft
  notes" (`/page-draft`) or "Polish notes" (`/page-polish`).
- **Page link for clients:** the hosted Studio's Presentation view of the
  published page, never the website directly:
  `https://maplewood.sanity.studio/presentation?preview=<URL-encoded page path>&perspective=published`
  Clients need a Sanity login to open it; Ovi sends the invitations.
<!-- ovs-workflow-setup:page-record:end -->

## Plan

- **Topic map:** `docs/content/topic-map.md` (`/page-plan` writes it
  before the first plan): which page owns each topic, and where each old
  page's content goes. Needed only for new pages.

## Readers and sources

- **Readers:** families of campers and school-year children; there are no
  written reader profiles. Use the page's section in
  `docs/migration/inventory.md` and the terms in `CONTEXT.md`.
- **Marketing plan:** none.
- **Old site content:** the live site (until 2026-10-16), the page's part of
  `docs/migration/inventory.md`, and the captured references in
  `docs/migration/reference/`. Read the current Sanity text with
  `pnpm page:text <path>`.
- **Facts about the client:** `CONTEXT.md` and the live site.

## Message rules

- Never invent a date, price, age range, staff name or policy. Take it from
  Sanity or the live site, or mark it for the client.
- **Confirmation marker:** "(Client to confirm)". The client confirms
  these facts during Client Review.

## Shared wording (Ovi, 2026-10-06)

None yet. Keep each page's button labels and targets unless Ovi asks for a
change.

## Client review

- **Client's reviewer in Basecamp:** Sharon Maynard, Marketing
  Coordinator (person id: not yet; Ovi invites her when the site work is
  done). Until then, "send to client review" stops at the reviewer step.

## Sanity

- Project `193h5qm1`, dataset `production`; commands in
  `docs/agents/sanity-cli.md`.
- Hosted Studio: https://maplewood.sanity.studio. Local Studio for agents:
  the port in `.worktree-ports.json` after `pnpm dev:worktree`.

## Sections (Ovi, 2026-10-06)

Read this part before you choose sections for a page. Where it differs
from the section catalogue in the shared page skills, this part wins. The
site keeps the live site's look.

- **Use freely:** `storyFeature`, `cardSlider`, `faqAccordion`,
  `richTextBlock`, `featureCards`, `statistics`, `quoteWall`,
  `stackedTimeline`, `imageReveal`, `instructionSteps`, `ctaBanner`.
- **Use only for their named job:**
  - `innerHero` → the first section of an inner page;
  - `videoHero`, `scrollPanels`, `latestArticles` → the home page;
    `videoZoomGrid` → home and `/school-year`; `tabbedHero` → `/school-year`;
  - `programCards`, `electiveCards`, `rateTable`, `pricingCards` → program,
    season and dates-and-rates pages;
  - `filterableCards` → `/summer-camp/activities`, `/school-year/facilities`;
  - `teamMembers` → staff rosters and `/leadership`; `directorIntro` →
    `/director-lee`; `historyStory` → `/summer-camp`;
  - `summerDocumentList` → the welcome-letter and group-schedule pages;
  - `jobList` → `/staff-opportunities`; `contactDetailsSection` and
    `busMap` → `/contact` and home;
  - `embedSection` → a Cognito, Airtable or calendar embed.
- **Closing section:** none fixed. Each page keeps the last section the
  live site has.
- **Do not use without Ovi's OK:** a section no published page uses yet
  (for example `benefitCards`, `bigImageList`, `iconCards`, `largeSlides`,
  `stackedFeatureRows`), because the site keeps the live look.
- **Missing photos:** use a photo already in Sanity from the live site.
  Never use stock or generated images; if none fits, say so in the polish
  notes for Ovi.
