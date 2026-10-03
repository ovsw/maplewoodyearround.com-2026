# Authenticated CMS inventory

Captured 2026-10-03T10:56:23.798Z. Webflow site `673ebf0eedfc15a41bedc0c3` (MDC 3.0). All 27 collection schemas and all 641 staged records were read through the Data API. No source content was changed.

Only schema metadata, aggregate counts and public page-use evidence are retained. Item values, including private names and unpublished content, are not included. [Machine-readable schema evidence](cms-schema-evidence.json) contains field IDs, required flags, validation rules, option IDs and reference targets.

## Counts and state

`Total` counts staged records, including drafts and archived records. `Live` is the separate live endpoint total. `Draft` and `Archived` are independent staged flags and can overlap with previously published content. They are not a partition of the live count. A custom `live` or `published` Switch is an editor field, not Webflow publication state.

Blog Posts has 28 staged records and 7 live records, with 22 staged archived flags and 1 draft flag. Do not compute live membership from staged flags alone. The importer must read both states and preserve them.

| Collection | Total | Live | Draft | Archived |
| --- | ---: | ---: | ---: | ---: |
| SC Facilities | 33 | 33 | 0 | 0 |
| SC Facility Categories | 5 | 5 | 0 | 0 |
| Seasons | 2 | 2 | 0 | 0 |
| SY Activities | 91 | 90 | 1 | 0 |
| SY Programs | 14 | 14 | 0 | 0 |
| Testimonials | 47 | 46 | 1 | 0 |
| Blog Posts | 28 | 7 | 1 | 22 |
| Blog Authors | 4 | 4 | 0 | 0 |
| Blog Categories | 5 | 5 | 0 | 0 |
| SC Activity Categories | 7 | 7 | 0 | 0 |
| SC Activities | 60 | 60 | 0 | 0 |
| SC Staff Members | 29 | 29 | 0 | 0 |
| SY Staff Members | 22 | 22 | 0 | 0 |
| SC Groups | 27 | 27 | 0 | 0 |
| SC Grades | 11 | 11 | 0 | 0 |
| SY Playground Characters | 25 | 25 | 0 | 0 |
| SY Playground Guests | 36 | 36 | 0 | 0 |
| SY Playground Calendars | 26 | 26 | 0 | 0 |
| FAQs | 53 | 53 | 0 | 0 |
| FAQ Categories | 15 | 15 | 0 | 0 |
| Job Opportunities | 10 | 10 | 0 | 0 |
| Parent Dashboard Cards | 24 | 24 | 0 | 0 |
| SY Facility Categories | 5 | 5 | 0 | 0 |
| SY Facilities | 16 | 16 | 0 | 0 |
| SC Sample Schedules | 32 | 32 | 0 | 0 |
| SY Sample Schedules | 12 | 12 | 0 | 0 |
| Playground Calendar PDFs | 2 | 2 | 0 | 0 |

## Page use and field definitions

The page-use register below identifies where each collection's role belongs in the observed site. It combines matching public content, public section roles and schema reference relationships. Reference-only collections feed the listed pages through their parent collection. Being referenced by another collection does not make a collection reference-only: SY Playground Characters and SY Playground Guests also supply the birthday-party page's Character List and Add-ons lists directly, while SY Playground Calendars supplies the play-center calendar. A path ending in `/*` means the six audited post pages listed in the main inventory.

These are migration mappings, not an export of Webflow Designer bindings. The Data API returns content and schemas but not collection-list filters, sort settings or list limits. The main inventory records each rendered list count and section order. Preserve that public result when replacing the lists; verify the relevant reference screenshots. Do not assume that a rendered count is the whole collection or a configured limit.

Public content matching alone is also insufficient: shared navigation names and reused photos can appear on unrelated pages. The JSON retains those matches as evidence, separately from this page-use register.

Each field row gives the API slug, type and required flag. Reference targets and option choices follow the type. The JSON is authoritative for field IDs and full validation details.

### SC Facilities

Collection ID: `67758e2e0ab4f3d12b953dfe`. Collection slug: `summer-camp-facilities`.

Page use: `/summer-camp/facilities`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Description | `description` | PlainText | no |
| Category | `category-multi` | MultiReference → SC Facility Categories | no |
| Main Image | `main-image` | Image | no |
| Live | `published` | Switch | no |
| Indoor/Outdoor | `indoor-outdoor` | Option: Indoor, Outdoor | no |
| Order | `order` | Number | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Facility Categories

Collection ID: `67763bcf5bf181b36576a225`. Collection slug: `summer-camp-facilty-categories`.

Page use: `/summer-camp/facilities`.

Referenced by: SC Facilities.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Seasons

Collection ID: `67764143b1fd5f9d2cf1db79`. Collection slug: `seasons`.

Page use: `/parent-dashboard`.

Referenced by: Parent Dashboard Cards.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Activities

Collection ID: `6778db5d201503e26fdd5043`. Collection slug: `school-year-activities`.

Page use: `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/birthday-parties`, `/school-year/programs/vacation-program`, `/school-year/programs/enrichment-classes/flying-solo`, `/school-year/programs/enrichment-classes/gymnastics-class`, `/school-year/programs/enrichment-classes/sports-enrichment-class`, `/school-year/programs/enrichment-classes/arts-class`.

Referenced by: SY Programs.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Main Image | `main-image` | Image | no |
| Availability | `availability` | Option: Mo-Fri, Mo-Sat, Schedule AM, Schedule PM, School Vacation | no |
| Programs | `programs` | MultiReference → SY Programs | no |
| Description | `description` | PlainText | no |
| Live | `live` | Switch | no |
| Is Playground? | `is-playground-2` | PlainText | no |
| Order | `order` | Number | no |
| Type | `indoor-outdoor-special` | Option: Indoor, Outdoor, Special | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Programs

Collection ID: `6778db8fb567d06d3525c12f`. Collection slug: `programs`.

Page use: `/school-year/programs`, `/school-year/programs/enrichment-classes`, `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/birthday-parties`, `/school-year/programs/vacation-program`.

Referenced by: SY Activities.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Days | `days` | Option: `Tue, Thu`; `Mo, Wed, Fri`; `Mo-Fri`; `Mo-Sat` | no |
| Activities | `activities-2` | MultiReference → SY Activities | no |
| Color | `color` | Color | no |
| Program Page | `program-page` | Link | no |
| Live | `live` | Switch | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Testimonials

Collection ID: `677bf3e50115c12d4461f782`. Collection slug: `summer-camp-testimonials`.

Page use: `/`, `/summer-camp`, `/school-year`, `/school-year/programs/preschool-program`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Author Name | `author-name` | PlainText | no |
| Testimonial Text | `testimonial-text` | PlainText | no |
| Plural (Parents vs. Parent) | `plural-parents-vs-parent` | Switch | no |
| Location | `location` | PlainText | no |
| Season | `season` | Option: Summer Camp, School-Year | no |
| Live | `live` | Switch | no |
| Order | `order` | Number | no |
| ID number | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Blog Posts

Collection ID: `677d49d61db2a021fe854a5a`. Collection slug: `post`.

Page use: `/`, `/news`, `/post/*`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Post Date | `post-date` | DateTime | yes |
| Post Body | `post-body` | RichText | no |
| Post Summary | `post-summary` | PlainText | no |
| Main Image | `main-image` | Image | no |
| Author | `author` | Reference → Blog Authors | yes |
| Category | `category` | Reference → Blog Categories | yes |
| SEO Title | `seo-title` | PlainText | no |
| SEO Description | `seo-description` | PlainText | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Blog Authors

Collection ID: `677d4a43bdd5e435fdb5d075`. Collection slug: `blog-authors`.

Page use: `/post/*`.

Referenced by: Blog Posts.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Role | `role` | PlainText | no |
| Picture | `picture` | Image | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Blog Categories

Collection ID: `677d50e45555320612d9f3b9`. Collection slug: `blog-categories`.

Page use: `/news`, `/post/*`.

Referenced by: Blog Posts.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Color | `color` | Color | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Activity Categories

Collection ID: `677fb8025883d61a620d56db`. Collection slug: `sc-activities-categories`.

Page use: `/summer-camp/activities`.

Referenced by: SC Activities.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Activities | `activities` | MultiReference → SC Activities | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Activities

Collection ID: `677fb80f7129b9488d3d6c63`. Collection slug: `sc-activities`.

Page use: `/summer-camp/activities`, `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit`.

Referenced by: SC Activity Categories, SC Groups.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Category | `category` | Reference → SC Activity Categories | no |
| Description | `description` | PlainText | no |
| Main Image | `main-image` | Image | no |
| Live | `published` | Switch | no |
| SC Groups | `sc-groups-ages` | MultiReference → SC Groups | no |
| Entering Grade (from Group) | `entering-grade-from-group` | PlainText | no |
| Group text | `group-text` | PlainText | no |
| Order | `order-2` | Number | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Staff Members

Collection ID: `67892daa6590c1ccfad847e6`. Collection slug: `summer-camp-staff-members`.

Page use: `/summer-camp/staff-roster`, `/leadership`, `/staff`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Photo | `photo` | Image | no |
| Role/Title/Position | `role-title-position` | PlainText | no |
| Years at Maplewood | `years-at-maplewood` | Number | no |
| Order | `order` | Number | no |
| Live | `live` | Switch | no |
| Year-Round Staff Member | `year-round-staff-member` | Switch | no |
| Former Camper | `former-camper` | Switch | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Staff Members

Collection ID: `67892ea79e316d41bba6d35b`. Collection slug: `school-year-staff-member`.

Page use: `/school-year/staff-roster`, `/school-year/programs/preschool-program`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Photo | `photo` | Image | no |
| Role/Title/Position | `role-title-position` | PlainText | no |
| Degrees/Training | `degrees-training` | PlainText | no |
| Years at Maplewood | `years-at-maplewood` | Number | no |
| Order | `order` | Number | no |
| Live | `live` | Switch | no |
| Does SY Tours | `does-sy-tours` | Switch | no |
| Is Preschool Teacher | `is-preschool-teacher` | Switch | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Groups

Collection ID: `678931a85d758f1afe696917`. Collection slug: `summer-camp-groups`.

Page use: `/summer-camp/activities`, `/summer-camp/summer-group-schedules`, `/summer-camp/summer-camp-welcome-letters`.

Referenced by: SC Activities.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Entering Grade | `entering-grade-2` | MultiReference → SC Grades | no |
| Gender | `gender` | Option: Girls, Boys, Coed | no |
| SC Activities | `activities` | MultiReference → SC Activities | no |
| Live | `live` | Switch | no |
| Group Schedule PDF | `group-schedule-pdf` | File | no |
| Welcome Letter PDF | `welcome-letter-pdf` | File | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Grades

Collection ID: `67893508bab779ee2d89911c`. Collection slug: `summer-camp-grades`.

Page use: `/summer-camp/activities`, `/summer-camp/summer-group-schedules`, `/summer-camp/summer-camp-welcome-letters`.

Referenced by: SC Groups.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Playground Characters

Collection ID: `678a61501fa36e6fded7c3d0`. Collection slug: `school-year-playground-characters`.

Page use: `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/birthday-parties`.

Referenced by: SY Playground Calendars.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Image | `image` | Image | no |
| Live | `live` | Switch | no |
| Order | `order` | Number | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Playground Guests

Collection ID: `678a61b3b5f8f7bbb3cd23db`. Collection slug: `school-year-playground-guests`.

Page use: `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/birthday-parties`.

Referenced by: SY Playground Calendars.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Time | `time` | PlainText | no |
| Subtitle | `subtitle` | PlainText | no |
| Person Name | `person-name` | PlainText | no |
| Company Name | `company-name` | PlainText | no |
| Main Image | `main-image` | Image | no |
| Link | `link` | Link | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Playground Calendars

Collection ID: `678a6231fc57d0461ee736e0`. Collection slug: `school-year-playground-calendar`.

Page use: `/school-year/programs/indoor-outdoor-play-center`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Calendar Date | `calendar-date` | DateTime | no |
| Special Guest | `special-guest` | Reference → SY Playground Guests | no |
| Character | `character` | Reference → SY Playground Characters | no |
| Day | `day-of-the-week` | PlainText | no |
| Agenda | `agenda` | RichText | no |
| Has Guest | `has-guest-2` | Switch | no |
| Custom Day | `custom-day` | Switch | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### FAQs

Collection ID: `6797b70e2d82596b57b3097e`. Collection slug: `faqs`.

Page use: `/summer-camp`, `/summer-camp/dates-and-rates`, `/school-year`, `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/preschool-program`, `/school-year/programs/birthday-parties`, `/school-year/programs/enrichment-classes`, `/school-year/programs/enrichment-classes/gymnastics-class`, `/school-year/programs/enrichment-classes/sports-enrichment-class`, `/school-year/programs/enrichment-classes/arts-class`, `/staff`, `/faqs`, `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Answer | `answer` | RichText | no |
| Category | `category` | MultiReference → FAQ Categories | no |
| Order | `order` | Number | no |
| Grouping | `grouping` | Option: Summer Camp, School Year | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### FAQ Categories

Collection ID: `6797b73cfd315e900db665c5`. Collection slug: `faq-categories`.

Page use: `/summer-camp`, `/summer-camp/dates-and-rates`, `/school-year`, `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/preschool-program`, `/school-year/programs/birthday-parties`, `/school-year/programs/enrichment-classes`, `/school-year/programs/enrichment-classes/gymnastics-class`, `/school-year/programs/enrichment-classes/sports-enrichment-class`, `/school-year/programs/enrichment-classes/arts-class`, `/staff`, `/faqs`, `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit`.

Referenced by: FAQs.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Job Opportunities

Collection ID: `679b4631c1781ce115e9d14d`. Collection slug: `job-opportunities`.

Page use: `/staff-opportunities`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Job Description | `job-description` | RichText | no |
| Summer Camp | `summer-camp` | Switch | no |
| School Year | `school-year` | Switch | no |
| Seasonal | `seasonal` | Switch | no |
| Live | `live` | Switch | no |
| Order | `order` | Number | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Parent Dashboard Cards

Collection ID: `67a6368349388ec216606e98`. Collection slug: `parent-dashboard-cards`.

Page use: `/parent-dashboard`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Color Theme | `color-theme` | PlainText | no |
| Image | `image` | Image | no |
| Show Image | `show-image` | Switch | no |
| Show Icon | `show-icon` | Switch | no |
| Icon Code | `icon-code` | PlainText | no |
| Card Text | `card-text` | PlainText | no |
| Link Text | `link-text` | PlainText | no |
| Link URL | `link-url` | PlainText | no |
| Use Attachment | `use-attachment` | Switch | no |
| Attachment | `attachment` | File | no |
| Season | `season` | MultiReference → Seasons | no |
| Order | `order` | Number | no |
| Live | `live` | Switch | no |
| Use Link | `use-link` | Switch | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Facility Categories

Collection ID: `67aa0f567825d8393f84cbb7`. Collection slug: `sy-facility-categories`.

Page use: `/school-year/facilities`.

Referenced by: SY Facilities.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Facilities

Collection ID: `67aa0f85e561b53b973289d4`. Collection slug: `sy-facilities`.

Page use: `/school-year/facilities`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Description | `description` | PlainText | no |
| Category | `category` | MultiReference → SY Facility Categories | no |
| Main Image | `main-image` | Image | no |
| Live | `published` | Switch | no |
| Indoor/Outdoor | `indoor-outdoor` | Option: Indoor, Outdoor | no |
| Order | `order` | Number | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SC Sample Schedules

Collection ID: `67ac6866f1c45e07ffcb3c01`. Collection slug: `summer-camp-sample-schedules`.

Page use: `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Activity | `activity` | PlainText | no |
| Image | `image` | Image | no |
| Program | `program` | Option: Preschool & Kindergarten, 1st–7th Grade, CIT (8th–9th grade) | no |
| Order | `order` | Number | no |
| Description | `description` | PlainText | no |
| Period | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### SY Sample Schedules

Collection ID: `67ac7f1a971929abccc3a578`. Collection slug: `sy-sample-schedules`.

Page use: `/school-year/programs/preschool-program`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| Activity | `activity` | PlainText | no |
| Image | `image` | Image | no |
| Program | `program` | Option: Preschool | no |
| Order | `order` | Number | no |
| Description | `description` | PlainText | no |
| Period | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |

### Playground Calendar PDFs

Collection ID: `6842a0dcb73b7671f02db266`. Collection slug: `playground-calendar-pdfs`.

Page use: `/school-year/programs/indoor-outdoor-play-center`.

| Field | API slug | Type / choices / target | Required |
| --- | --- | --- | --- |
| PDF | `pdf` | File | yes |
| Start Date | `effective-from` | DateTime | no |
| Name | `name` | PlainText | yes |
| Slug | `slug` | PlainText | yes |
