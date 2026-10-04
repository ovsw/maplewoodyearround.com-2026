# Maplewood content model

## Home page composition (issue #8)

The home page uses the seven imported section types in source order. The
preserved video hero and zoom-grid geometry are ported to their existing
renderers. GSAP drives the zoom, four image/text panels and year-round image
reveal. Reduced motion shows static content and paused background videos.
Visitors can also pause each video.

The hero and zoom grid add an editable highlighted phrase. Scroll cards
retain separate labels, paragraph bodies, buttons and desktop/mobile photos.
The bus map adds its source label; the year-round section adds its source
label and rich text, including its inline links.

The testimonial wall's optional ordered references preserve the 17 displayed
source records without copying their content. Without a selection, its existing
program filter still applies. News has an optional ordered post selection and
a featured-first layout. The home import selects the featured record and three
cards from the live source, rather than letting staged-only posts enter the
home preview. Post links use each selected record's existing canonical slug.

All these source slots are mapped in the importer, restricted to the home
path. A full plan comparison confirms that no other imported document changes.
SEO retains the inventory title, description and Sanity copy of the OG image.

This is the field and section contract for [issue #6](https://github.com/ovsw/maplewoodyearround.com-2026/issues/6). Source definitions come from [the authenticated CMS inventory](cms-inventory.md) and [its schema evidence](cms-schema-evidence.json). Page order and display behavior come from [the public inventory](inventory.md), its source evidence and reference images. This document contains schema metadata and public behavior only, not private item values.

## Import rules

- Import each of the 27 source collections. Merging two collection schemas does not merge their records by name: preserve each source collection/item identity. References resolve through the same identity map. Slugs are content, not migration IDs.
- `program` uses `summerCamp` or `schoolYear`. Derive it from the source collection for SC/SY pairs. An SC and SY record with the same name can remain two records in the same document type.
- Webflow `name` maps as shown below; `slug` becomes the Sanity slug object's `current` value. Retain existing public page paths. A slug on a list item does not create a new public route.
- Copy plain text without treating it as HTML. Convert RichText to Portable Text, retaining headings, lists, marks, links and media. Convert plain-text testimonial bodies and post summaries to text blocks without inventing formatting.
- Import Image fields into Sanity image assets, retaining available alt text. Import File fields into Sanity file assets; retain a file's display name and source identity in the import record. Reuse the same asset when a PDF appears in several grade groups. Background videos also become Sanity file assets.
- Resolve Option IDs through the source field's recorded option list. Store the option labels shown in the field tables unless an explicit program conversion is stated. Do not infer an option from its ID or reword an age group.
- Preserve independent references in both directions. For example, an activity's category and a category's activity list are separate source fields. Report a mismatch; do not silently replace one list with the inverse of another.

### Publication and visibility are separate

Webflow staged records, its live endpoint, `isDraft`, `isArchived`, and custom `live`/`published` switches describe different states. The audit found 641 staged records, including 28 staged Blog Posts but only seven live posts. Staged flags cannot reconstruct the live set.

The importer must read both live and staged representations. Only a live-endpoint record may supply a published Sanity version. Staged-only content stays unpublished; when staged content differs from live content, preserve it as a Sanity draft without replacing the live version. Retain draft/archive flags and source timestamps in the private importer manifest so the final import can reproduce and audit each state. Do not publish an archived or draft-only source record merely because it has a past publication timestamp. If an archived staged record still has a live version, retain the actual live version and record the staged archive state separately.

Custom `live` and `published` Switch fields map to `visible`. They control lists independently of publication. Preserve false and missing values distinctly during import; schema initial values for new editor-created records are not import defaults. Sources with no custom visibility switch use their actual live membership and the page's observed list behavior.

### Order, filters and links

Preserve explicit source order numbers. If a source has no order field, retain the public order from its page evidence; the Data API response order is not proof of the displayed order. Keep missing order values separate from zero. Collection sections select by document type, program, category, grade or other declared filters. They must not copy CMS records into hard-coded card arrays. Authored cards remain ordered page content.

The Data API does not expose Designer list filters, limits or sort configuration. Check each rendered list against the inventory and reference capture. A rendered list count is not a collection total or a proved list limit.

`contentDestination` carries an internal document, an external URL or a Sanity file. Convert same-site URLs to references only when they resolve to an imported page. Retain external paths, query strings and fragments. Empty and `#` CTA destinations produce no link and the CTA/card stays hidden. A `#` used as a tab or filter control becomes a button. Unsafe or invalid destinations must be reported, not published as working URLs.

## Collection fields

Each subsection names its source collection exactly. A target path is relative to the stated Sanity document unless another document is named.

### SC Facilities → `facility` (`program = summerCamp`)

| Webflow field    | Sanity field   | Meaning                                               |
| ---------------- | -------------- | ----------------------------------------------------- |
| `name`           | `title`        | Facility name.                                        |
| `slug`           | `slug.current` | Source URL name.                                      |
| `description`    | `description`  | Plain-text description.                               |
| `category-multi` | `categories[]` | References to imported SC `facilityCategory` records. |
| `main-image`     | `image`        | Sanity image asset.                                   |
| `published`      | `visible`      | Custom Live switch, not publication state.            |
| `indoor-outdoor` | `location`     | `Indoor` or `Outdoor`.                                |
| `order`          | `order`        | Source list order.                                    |

### SC Facility Categories → `facilityCategory` (`program = summerCamp`)

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |

### Seasons → `season`

| Webflow field | Sanity field   | Meaning                                    |
| ------------- | -------------- | ------------------------------------------ |
| `name`        | `title`        | Preserve the source label.                 |
| `slug`        | `slug.current` | Preserve identity used by dashboard cards. |

Set `season.program` from the audited Summer Camp / School Year meaning of the source season. Do not interpret this collection as a calendar year: the annual summer PDF label is separate.

### SY Activities → `activity` (`program = schoolYear`)

| Webflow field            | Sanity field      | Meaning                                                                 |
| ------------------------ | ----------------- | ----------------------------------------------------------------------- |
| `name`                   | `title`           | Activity name.                                                          |
| `slug`                   | `slug.current`    | Source URL name.                                                        |
| `main-image`             | `image`           | Sanity image asset.                                                     |
| `availability`           | `availability`    | `Mo-Fri`, `Mo-Sat`, `Schedule AM`, `Schedule PM`, or `School Vacation`. |
| `programs`               | `programs[]`      | References to imported `programOffering` records.                       |
| `description`            | `description`     | Plain-text description.                                                 |
| `live`                   | `visible`         | Custom list visibility.                                                 |
| `is-playground-2`        | `playgroundLabel` | Plain text, despite the source field's boolean-like name.               |
| `order`                  | `order`           | Source list order.                                                      |
| `indoor-outdoor-special` | `location`        | `Indoor`, `Outdoor`, or `Special`.                                      |

### SY Programs → `programOffering` (`program = schoolYear`)

| Webflow field  | Sanity field   | Meaning                                            |
| -------------- | -------------- | -------------------------------------------------- |
| `name`         | `title`        | Program name.                                      |
| `slug`         | `slug.current` | Source URL name.                                   |
| `days`         | `days`         | `Tue, Thu`, `Mo, Wed, Fri`, `Mo-Fri`, or `Mo-Sat`. |
| `activities-2` | `activities[]` | References to imported SY `activity` records.      |
| `color`        | `color`        | Source CSS label color.                            |
| `program-page` | `destination`  | Internal page or external URL.                     |
| `live`         | `visible`      | Custom list visibility.                            |

### Testimonials → `testimonial`

| Webflow field              | Sanity field                                                           |
| -------------------------- | ---------------------------------------------------------------------- |
| `name`                     | `internalTitle`                                                        |
| `slug`                     | `slug.current`                                                         |
| `author-name`              | `name`                                                                 |
| `testimonial-text`         | `body`, plain text converted to Portable Text.                         |
| `plural-parents-vs-parent` | `pluralParents`                                                        |
| `location`                 | `origin`                                                               |
| `season`                   | `program`: `Summer Camp` → `summerCamp`; `School-Year` → `schoolYear`. |
| `live`                     | `visible`                                                              |
| `order`                    | `order`                                                                |

The source CMS name and displayed author name are distinct. The plural-parent switch controls the attribution wording and remains editable. Do not assign a rating during import: this source collection has no rating field.

### Blog Posts → `post`

| Webflow field     | Sanity field       | Meaning                                 |
| ----------------- | ------------------ | --------------------------------------- |
| `name`            | `title`            | Article title.                          |
| `slug`            | `slug.current`     | Preserve `/post/<slug>`.                |
| `post-date`       | `publishedAt`      | Article date, not API import time.      |
| `post-body`       | `body`             | RichText converted to Portable Text.    |
| `post-summary`    | `excerpt`          | Plain text converted to summary blocks. |
| `main-image`      | `image`            | Sanity image asset.                     |
| `author`          | `author`           | Reference to imported `author`.         |
| `category`        | `category`         | Reference to imported `category`.       |
| `seo-title`       | `meta.title`       | Source SEO title.                       |
| `seo-description` | `meta.description` | Source SEO description.                 |

The featured-news title, date and link must come from one selected post. The known public date mismatch needs source confirmation; do not invent a date or substitute another article.

### Blog Authors → `author`

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `name`         |
| `slug`        | `slug.current` |
| `picture`     | `image`        |
| `role`        | `role`         |

### Blog Categories → `category`

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |
| `color`       | `color`        |

### SC Activity Categories → `activityCategory`

| Webflow field | Sanity field                                                  |
| ------------- | ------------------------------------------------------------- |
| `name`        | `title`                                                       |
| `slug`        | `slug.current`                                                |
| `activities`  | `activities[]`, references to imported SC `activity` records. |

### SC Activities → `activity` (`program = summerCamp`)

| Webflow field               | Sanity field   | Meaning                                                         |
| --------------------------- | -------------- | --------------------------------------------------------------- |
| `name`                      | `title`        | Activity name.                                                  |
| `slug`                      | `slug.current` | Source URL name.                                                |
| `category`                  | `category`     | Reference to `activityCategory`.                                |
| `description`               | `description`  | Plain-text description.                                         |
| `main-image`                | `image`        | Sanity image asset.                                             |
| `published`                 | `visible`      | Custom Live switch.                                             |
| `sc-groups-ages`            | `groups[]`     | References to `campGroup`; grades resolve through those groups. |
| `entering-grade-from-group` | `gradeLabel`   | Preserve source grade text separately from references.          |
| `group-text`                | `groupText`    | Preserve descriptive group text.                                |
| `order-2`                   | `order`        | Source list order.                                              |

### SC Staff Members → `staffMember` (`program = summerCamp`)

| Webflow field             | Sanity field       |
| ------------------------- | ------------------ |
| `name`                    | `name`             |
| `slug`                    | `slug.current`     |
| `photo`                   | `image`            |
| `role-title-position`     | `role`             |
| `years-at-maplewood`      | `yearsAtMaplewood` |
| `order`                   | `order`            |
| `live`                    | `visible`          |
| `year-round-staff-member` | `yearRound`        |
| `former-camper`           | `formerCamper`     |

### SY Staff Members → `staffMember` (`program = schoolYear`)

| Webflow field          | Sanity field       |
| ---------------------- | ------------------ |
| `name`                 | `name`             |
| `slug`                 | `slug.current`     |
| `photo`                | `image`            |
| `role-title-position`  | `role`             |
| `degrees-training`     | `training`         |
| `years-at-maplewood`   | `yearsAtMaplewood` |
| `order`                | `order`            |
| `live`                 | `visible`          |
| `does-sy-tours`        | `givesTours`       |
| `is-preschool-teacher` | `preschoolTeacher` |

### SC Groups → `campGroup` plus `summerDocuments` entries

| Webflow field        | Sanity field                                   | Meaning                                                   |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `name`               | `campGroup.title`                              | Group name; also informs each PDF entry's title.          |
| `slug`               | `campGroup.slug.current`                       | Group identity.                                           |
| `entering-grade-2`   | `campGroup.grades[]`                           | References to imported `grade` records.                   |
| `gender`             | `campGroup.gender`                             | `Girls`, `Boys`, or `Coed`.                               |
| `activities`         | `campGroup.activities[]`                       | References to SC `activity` records.                      |
| `live`               | `campGroup.visible`                            | Source group visibility; applies to its document entries. |
| `group-schedule-pdf` | `summerDocuments.gradeGroups[].entries[].file` | `kind = schedule`, `group` references this `campGroup`.   |
| `welcome-letter-pdf` | `summerDocuments.gradeGroups[].entries[].file` | `kind = welcomeLetter`, same group reference.             |

Create one `summerDocuments` document per evidenced summer label, with grade references in `gradeGroups[].grade`. A group with several entering grades contributes entries under each of those grades; entries reuse the same file asset. Preserve public grade/group order. Omit an entry when no source PDF exists. The annual label is not a field on SC Groups: obtain it from the source page/PDF evidence or report the missing label. Do not substitute the import year.

The group-schedules and welcome-letters pages select the same document and filter entries by `kind`. Both pages therefore use the same grade structure and file replacements. Current group visibility must be respected when lists are rendered.

### SC Grades → `grade`

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |

### SY Playground Characters → `playgroundCharacter`

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |
| `image`       | `image`        |
| `live`        | `visible`      |
| `order`       | `order`        |

Characters supply the birthday-party Character List directly as well as calendar references.

### SY Playground Guests → `playgroundGuest`

| Webflow field  | Sanity field   |
| -------------- | -------------- |
| `name`         | `title`        |
| `slug`         | `slug.current` |
| `time`         | `time`         |
| `subtitle`     | `subtitle`     |
| `person-name`  | `personName`   |
| `company-name` | `companyName`  |
| `main-image`   | `image`        |
| `link`         | `destination`  |

Guests also supply birthday-party Add-ons directly. Do not make them available only through calendar days.

### SY Playground Calendars → `playgroundEvent`

| Webflow field     | Sanity field                                     |
| ----------------- | ------------------------------------------------ |
| `name`            | `title`                                          |
| `slug`            | `slug.current`                                   |
| `calendar-date`   | `date`                                           |
| `special-guest`   | `guest`, reference to `playgroundGuest`.         |
| `character`       | `character`, reference to `playgroundCharacter`. |
| `day-of-the-week` | `dayLabel`                                       |
| `agenda`          | `agenda`, RichText converted to Portable Text.   |
| `has-guest-2`     | `hasGuest`                                       |
| `custom-day`      | `customDay`                                      |

Retain explicit day labels and guest/custom-day switches; deriving them from the presence of a reference changes the source meaning.

### FAQs → `faq`

| Webflow field | Sanity field                                                           |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | `title`, the question.                                                 |
| `slug`        | `slug.current`                                                         |
| `answer`      | `body`, RichText converted to Portable Text.                           |
| `category`    | `categories[]`, references to `faqCategory`.                           |
| `order`       | `order`                                                                |
| `grouping`    | `program`: `Summer Camp` → `summerCamp`; `School Year` → `schoolYear`. |

A question can belong to several categories; do not reduce this to one reference.

### FAQ Categories → `faqCategory`

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |

There is no CMS category-order field. Any new `order` value must reflect public category order rather than the API enumeration.

### Job Opportunities → `jobOpportunity`

| Webflow field     | Sanity field                                        |
| ----------------- | --------------------------------------------------- |
| `name`            | `title`                                             |
| `slug`            | `slug.current`                                      |
| `job-description` | `description`, RichText converted to Portable Text. |
| `summer-camp`     | Include `summerCamp` in `programs[]` when true.     |
| `school-year`     | Include `schoolYear` in `programs[]` when true.     |
| `seasonal`        | `seasonal`                                          |
| `live`            | `visible`                                           |
| `order`           | `order`                                             |

The application destination is public page content, not a source CMS field. Import it separately into `applyLink` from the observed application link.

### Parent Dashboard Cards → `dashboardCard`

| Webflow field    | Sanity field                                                | Meaning                                                                                                          |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `name`           | `title`                                                     | Card heading.                                                                                                    |
| `slug`           | `slug.current`                                              | Source identity.                                                                                                 |
| `color-theme`    | `colorTheme`                                                | Source theme label.                                                                                              |
| `image`          | `image`                                                     | Sanity image asset.                                                                                              |
| `show-image`     | `showImage`                                                 | Explicit image visibility.                                                                                       |
| `show-icon`      | `showIcon`                                                  | Explicit icon visibility.                                                                                        |
| `icon-code`      | `iconCode`                                                  | Preserve inert source text. Map recognized artwork to `iconName` for rendering; never execute the source markup. |
| `card-text`      | `text`                                                      | Card explanation.                                                                                                |
| `link-text`      | `linkText`                                                  | Link label.                                                                                                      |
| `link-url`       | `destination.external` or `destination.internal`            | URL candidate for an internal/external destination.                                                              |
| `use-attachment` | Select `destination.kind = file` when active.               | Source destination mode.                                                                                         |
| `attachment`     | `destination.file`                                          | Upload attachment to Sanity.                                                                                     |
| `season`         | `seasons[]`                                                 | References to `season`; their program values select dashboard tabs.                                              |
| `order`          | `order`                                                     | Source list order within each tab.                                                                               |
| `live`           | `visible`                                                   | Custom list visibility.                                                                                          |
| `use-link`       | Select `destination` internal/external variant when active. | Source destination mode.                                                                                         |

Import the destination mode from source switches and the rendered link, not just the presence of an attachment. If both modes are active and the public result does not settle which link is used, report the conflict. If neither has a usable destination, leave the destination absent and hide the card. Unknown icon markup requires a visible match from the reference; do not silently select a different icon.

### SY Facility Categories → `facilityCategory` (`program = schoolYear`)

| Webflow field | Sanity field   |
| ------------- | -------------- |
| `name`        | `title`        |
| `slug`        | `slug.current` |

### SY Facilities → `facility` (`program = schoolYear`)

| Webflow field    | Sanity field                                                 |
| ---------------- | ------------------------------------------------------------ |
| `name`           | `title`                                                      |
| `slug`           | `slug.current`                                               |
| `description`    | `description`                                                |
| `category`       | `categories[]`, references to SY `facilityCategory` records. |
| `main-image`     | `image`                                                      |
| `published`      | `visible`                                                    |
| `indoor-outdoor` | `location`, `Indoor` or `Outdoor`.                           |
| `order`          | `order`                                                      |

### SC Sample Schedules → `sampleSchedule` (`program = summerCamp`)

| Webflow field | Sanity field                                                                       |
| ------------- | ---------------------------------------------------------------------------------- |
| `name`        | `title`                                                                            |
| `slug`        | `slug.current`                                                                     |
| `activity`    | `activity`                                                                         |
| `image`       | `image`                                                                            |
| `program`     | `audience`: `Preschool & Kindergarten`, `1st–7th Grade`, or `CIT (8th–9th grade)`. |
| `order`       | `order`                                                                            |
| `description` | `description`                                                                      |

### SY Sample Schedules → `sampleSchedule` (`program = schoolYear`)

| Webflow field | Sanity field             |
| ------------- | ------------------------ |
| `name`        | `title`                  |
| `slug`        | `slug.current`           |
| `activity`    | `activity`               |
| `image`       | `image`                  |
| `program`     | `audience`: `Preschool`. |
| `order`       | `order`                  |
| `description` | `description`            |

### Playground Calendar PDFs → `playgroundCalendar`

| Webflow field    | Sanity field              |
| ---------------- | ------------------------- |
| `name`           | `title`                   |
| `slug`           | `slug.current`            |
| `pdf`            | `file`, Sanity PDF asset. |
| `effective-from` | `effectiveFrom`           |

## Section patterns

Reuse one section contract for the same content structure on different pages. Collection sections carry filters, not copied source-item arrays. A shared Webflow class is not proof of the same content source: the registration cards on `/contact` are authored content, while most `section_blog66` instances use CMS records.

These are stored content contracts. The later page issues supply the source-matched layout, interactions, reduced-motion states and click-to-edit behavior. A schema or basic renderer is not proof that the public page matches its reference.

| Source selector pattern                                  | Sanity section or route                                  | Content contract                                                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `section_header33`                                       | `videoHero`                                              | Home heading, copy, actions, video files and still poster. Port the preserved hero in #8.                                      |
| `section_header83`                                       | `videoZoomGrid`                                          | Source image grid, video, poster and copy. Port the preserved zoom grid, with full static grid under reduced motion.           |
| `section_layout515`                                      | `scrollPanels`                                           | Ordered image/text/action panels. Keep all panels readable without scroll animation.                                           |
| `section_testimonials_testimonial11`                     | `quoteWall`                                              | Visible testimonial records selected by program, in source order.                                                              |
| `section_transportation_contact14`                       | `busMap`                                                 | Editable map URL, bus benefits and actions.                                                                                    |
| `section_layout412`                                      | `imageReveal`                                            | Year-round image, heading, text and actions; static complete image when motion is reduced.                                     |
| `section_blog7`                                          | `latestArticles`                                         | A selected featured post plus published news cards. All featured metadata comes from that post.                                |
| `section_layout355`                                      | `directorIntro`                                          | Public director story, portrait/video and contact actions.                                                                     |
| `header50_wrap text-color-alternate`                     | `innerHero`                                              | Repeated image-hero heading, copy and image content.                                                                           |
| `section_summer-camp_programs`                           | `programCards`                                           | Summer Camp offerings selected by `program` and `listingGroup = main`.                                                         |
| `section_summer-camp_additional-programs`                | `programCards`                                           | Summer Camp offerings selected by `listingGroup = additional`.                                                                 |
| `section_summer-camp_club-day-electives`                 | `electiveCards`                                          | Ordered editorial elective cards; no corresponding CMS collection.                                                             |
| `section_layout302`                                      | `storyFeature`                                           | Flexible-session explanation and editable action; preserve source wording.                                                     |
| `section_layout30`                                       | `storyFeature`                                           | Split text/image feature, such as the staffing explanation.                                                                    |
| `section_summer-camp_history`                            | `historyStory`                                           | Historical story and supporting images/cards.                                                                                  |
| `section_summer-camp_enrollment-process-timeline`        | `stackedTimeline`                                        | Ordered enrollment steps.                                                                                                      |
| `section_faq3`                                           | `faqAccordion`                                           | FAQs selected by program/category references.                                                                                  |
| `section_comparison8`                                    | `rateTable`                                              | Editable date/session columns and rows.                                                                                        |
| `section_k-9-sessions-table_comparison6`                 | `rateTable`                                              | Editable grade/session/price comparison; preserve text and headings.                                                           |
| `section_pricing19`                                      | `pricingCards`                                           | Ordered plans, price wording, details and action destinations.                                                                 |
| Empty class on `/summer-camp/dates-and-rates`, section 9 | No section                                               | Empty structural wrapper: no text, image, video, embed or collection. It has no content to migrate.                            |
| `section_header103`                                      | `tabbedHero`                                             | Authored School Year program tabs with image, heading, text and action per tab; not a collection carousel.                     |
| `header11o_wrap`                                         | `innerHero`                                              | Image hero for the Play Center page.                                                                                           |
| `section_blog66`                                         | `cardSlider`; authored-card exception below              | Repeated collection-card pattern with type, program, location, audience and category filters.                                  |
| `section_layout248`                                      | `featureCards`                                           | Authored feature grid, such as preschool benefits.                                                                             |
| `section_stats14`                                        | `statistics`                                             | Editable value/label pairs. Decorative count-up is not required.                                                               |
| `section_layout59`                                       | `storyFeature`                                           | Image and facility explanation with supporting copy/actions.                                                                   |
| `section_layout311`                                      | `programCards`                                           | School Year program/enrichment cards with program and listing-group filters.                                                   |
| `section_team4`                                          | `teamMembers`                                            | Staff selected by program and optional preschool/tour filters.                                                                 |
| `section_cta13`                                          | `ctaBanner`                                              | Birthday reminder copy and action.                                                                                             |
| `section_filters5`                                       | `filterableCards`                                        | Activities/facilities with category, grade, program and search data. #13 supplies native filter behavior.                      |
| `section_layout486`                                      | `instructionSteps`                                       | Four ordered Hot Lunchbox instructions. Keep numbers and text; no count-up animation.                                          |
| `section_cta39`                                          | `ctaBanner`                                              | Tutorial/support heading, text and editable links.                                                                             |
| `section_layout10`                                       | `storyFeature`                                           | App-download explanation, image and editable store links.                                                                      |
| `section_layout203`                                      | `storyFeature`                                           | Bus-process explanation and image.                                                                                             |
| `section_gallery1`                                       | `embedSection`                                           | Map destination, heading, accessible description and optional actions.                                                         |
| `section_team14`                                         | `teamMembers` with `profileGroup = leadership`           | Public leadership profiles with biographies and contact links; separate from full SC/SY profiles with `profileGroup = roster`. |
| `section_contact21`                                      | `contactDetailsSection`                                  | Public contact details from settings, with editable email, telephone and directions destinations.                              |
| `section_career12`                                       | `jobList`                                                | Visible jobs selected by program, with editable application links.                                                             |
| `section_layout398`                                      | `parentDashboardSection`                                 | Singleton heading/tab labels plus visible dashboard cards selected through season program. Hide cards without destinations.    |
| `section_timeline11`                                     | `stackedTimeline`                                        | Ordered history dates and story entries.                                                                                       |
| `header50c_wrap text-color-alternate`                    | `innerHero`                                              | Document-page title and introduction.                                                                                          |
| `section_content30`                                      | `summerDocumentList`, `embedSection`, or `richTextBlock` | Download pages read the selected summer document; tour pages use provider embeds; policy pages use rich text.                  |
| `w-embed w-iframe`                                       | `embedSection`                                           | Airtable change-notification form URL and accessible frame title.                                                              |
| `section_blog-post-header3`                              | `post` route                                             | Title, date, author, category and image belong to the article document.                                                        |
| `section_content29`                                      | `post.body` and author reference                         | Article body and author footer; not a duplicate insertable section.                                                            |

`section_blog66` uses these sources: Play Center calendar days/PDFs; activities by program/location and `activityCategory`; playground characters; birthday-party `playgroundGuest` records; facilities by `facilityCategory`; and sample schedules by program/audience. The two `/contact` registration-card lists are authored cards with editable actions and use `electiveCards`/`featureCards` according to their content structure. Do not create fictional CMS source records to explain a source wrapper.

Summer program cards without a Webflow collection become `programOffering` documents from their public page content. Keep their source/page identity and `listingGroup` explicit. This permits the same filter-based pattern as SY Programs without duplicating a program's text into each page.

The header and footer sit outside the Page Builder section sequence. Their content belongs to the navigation/footer/settings singletons; #8 ports the preserved header's behavior. Preserve each page's section order and anchored IDs from the public evidence.

### School Year facility filter data gap

Use `filterableCards.source = facility` and `program = schoolYear` for `/school-year/facilities`, as the authenticated inventory's page-use register specifies. Its category memberships come from SY Facilities `category` references. Do not change the source to SY Activities merely because the source page calls its search field “activity.”

A read-only check of the live page on 2026-10-03 found grade labels in the filter controls, but card fields marked `age`, `category` and `bunk` contain the literal placeholder “This is some text inside of a div block.” SY Facilities has no grade field. Thus these public controls do not establish a facility-to-grade relation. Keep editable `facility.grades[]` references for confirmed assignments and leave them unset during source import. The grade-filter requirement remains in scope for #13; missing assignments are a data blocker, not permission to remove the filter. Repair category behavior from real CMS references; obtain confirmed grade applicability before promising a functional grade filter for facilities. Do not assign every grade, copy placeholder labels, or infer ages from a facility name. Summer activity grades do have a source: SC Activities → SC Groups → SC Grades.

## Editable external destinations

The [external link register](inventory.md#external-link-register) is the URL-by-URL source checklist. Map every entry; also check the form/embed register and rich-text links. Each occurrence goes in the content that displays it, using `contentDestination.external`, a shared button URL, a rich-text link annotation, or the declared embed field. There are no provider destination constants in application code.

| Source destination or service                                   | Editable owner                                                                                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CampInTouch login and camper registration                       | Navigation/footer destinations, registration actions, dashboard-card destinations and relevant program-page actions. Preserve distinct login/application URLs.                     |
| Aluvii reservations, waivers and gift cards                     | Relevant navigation, program cards, page actions and dashboard-card destinations. Preserve each query string; do not substitute one category for another.                          |
| Brightwheel                                                     | Preschool registration/dashboard destinations.                                                                                                                                     |
| Active.com                                                      | Enrichment program registration actions. Preserve each observed registration URL.                                                                                                  |
| Airtable form links and shared views                            | Action destinations for links; `embedSection.embedUrl` for embedded forms/views.                                                                                                   |
| Cognito tour forms                                              | `embedSection.embedUrl`, public `accountId`/`providerId` where required, and `sentFrom` preserving Summer Camp or School Year. A loader-script URL alone is not a form identifier. |
| Events Calendar                                                 | `embedSection.embedUrl` and public `providerId` identify the selected calendar. The provider loader can be fixed code; the selected calendar cannot.                               |
| Shopify merchandise                                             | Dashboard and page action destinations.                                                                                                                                            |
| Google Photos                                                   | Daily-photo page/dashboard destinations.                                                                                                                                           |
| My Hot Lunchbox ordering, tutorials and support                 | Instruction, story and CTA actions; support email/telephone remain editable content.                                                                                               |
| Apple App Store, Google Play and Campanion                      | App-download actions. Preserve which application each URL opens.                                                                                                                   |
| Snazzy Maps and Google Maps directions                          | `busMap.embedUrl`, `embedSection.embedUrl`, related map actions and public contact details.                                                                                        |
| Facebook, Instagram, YouTube, X/Twitter, Pinterest and LinkedIn | Settings social links and any contextual action destination.                                                                                                                       |
| Webflow-hosted PDFs and other downloads                         | Uploaded Sanity file assets in `contentDestination.file`, summer-document entries or calendar PDFs. Replace the asset address, not the document's meaning.                         |
| Non-www same-site URLs                                          | Internal references to the matched page; canonical public routes retain `www`.                                                                                                     |
| Invalid `https://Seasons` destination                           | Leave the action unavailable until the intended source destination is established. Do not carry a false working link forward.                                                      |

`embedSection.provider` selects a controlled provider integration; `frameTitle` describes it for assistive technology. Public form/account/calendar identifiers are content, not API keys. Keep secrets in the hosting environment. The renderer owns provider scripts and must not execute pasted script markup.

The required singletons are `settings`, `navigation`, `footer`, `parentDashboard` and `homePage`, with the existing news index/settings. Settings owns public contact details, social links, logos, the GA measurement ID and Hotjar site ID. The footer owns newsletter text; Formspark credentials remain in hosting environment variables. The newsletter uses Formspark with a honeypot. Cognito/Airtable and other retained forms continue to use their existing services.

## Studio, routes and completion

Studio groups content under Summer Camp, School Year, Parents, About, News and Site settings. Page-bearing records use Presentation with `/`, the preserved page slug, `/news`, or `/post/<slug>` as appropriate. Do not invent standalone routes for collection items that only appear in lists. Where a collection placement is known, an editor can reach its host page.

Issue #6 establishes and deploys the schema contract; #7 imports source content with the required verified backup. The later page issues build and verify the source-matched appearance and interactions. Content remains frozen in Studio until launch. No source Webflow or Airtable content is changed by this mapping.

Before the model PR merges, extract the schema, regenerate types, verify all collection fields and section contracts, and pass the Release gate. An empty-dataset model check does not prove that imported records pass validation or that the pages match their references. The importer must report unknown option IDs, unresolved references, invalid links, conflicting dashboard modes, missing summer labels and unsupported icon markup instead of silently changing their meaning.
