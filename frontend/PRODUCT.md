# Product

<!-- impeccable:product-schema 1 -->

Maplewood Day Camp and Enrichment Center is a family-owned children's center in South Easton, Massachusetts. It opened in 1965. It runs two businesses in one place: **Summer Camp** from June to August and **School Year** programs from September to June. This file records who the website is for and what it must do. `DESIGN.md` records how it looks. `CONTEXT.md` at the repository root defines the terms.

Facts come from the live site (checked 2026-10-09) and from Ovi (2026-10-09). Open questions are on the client to-dos in the MDC Basecamp project. Update this file when the client answers.

## Platform

web

## Users

Maplewood has two sides with different customers. Often they are the same family at different ages.

**School Year** (September to June) serves mostly babies, toddlers and preschoolers, and their parents:

- **Parents and caregivers who stay and play** with children aged 6 and younger at the Indoor/Outdoor Play Center. They visit often, decide week by week, and choose a day by its character or special guest.
- **Parents of toddlers (2–4)** in Flying Solo. The parent stays in the building while the child practices being away from them before preschool.
- **Parents who choose a preschool** for ages 3–5 (2- or 3-day program), often with enrichment classes (Gymnastics, Arts, Sports) for ages 2–5.
- **Working parents of children in Kindergarten to 8th grade** during the February and April school vacation weeks. This is the only School Year drop-off program for school-age children.
- **Parents who host a birthday party** at the Play Center, and their guests.
- **Relatives who buy gifts**: gift cards for the Play Center and classes.

**Summer Camp** (June to August) serves children from Preschool to 9th grade:

- **Parents who choose a summer camp.** They decide once a year, and the choice depends on trust: safety, staff, swimming and transport.
- **Enrolled families** who need dates, forms, group schedules, welcome letters, the bus map and daily photos.

**Both sides:**

- **Job applicants**: teens, students and educators, mostly for summer jobs.
- **Editors**: the camp's office staff, who edit the site in Sanity Studio. They are not web specialists.

Open: the real age range of School Year as a whole and of the Vacation Program (the live site says 1–12, 2–4 and K–8th in different places). The question is on a client to-do.

## Product Purpose

The website must:

1. **Win new families** on both sides: a tour booking or a first registration.
2. **Serve current families**: the Parent Dashboard, forms, waivers, schedules, documents and the Play Center calendar, without a phone call.
3. **Sell online**: Play Center tickets, passes and memberships, gift cards and party bookings. The sale itself happens in the external systems the site links to.
4. **Hire staff**: job openings and the staff application.
5. **Let Maplewood edit its own site**: editors change text, photos, links, dates and PDFs in Studio without a developer.

Success: families find the next step for their side, and the office gets fewer calls and emails for facts the site can show.

Open: which side brings more of the business, and which action counts most. These are on the client goal-questions to-do.

## Positioning

Maplewood is **one place with two equal sides**. The site presents a year-round center where a child can start at the Play Center as a toddler, move to preschool, and grow up through Summer Camp to the CIT program and a staff job. Neither side is secondary (Ovi, 2026-10-09).

Facts a nearby camp or preschool cannot truthfully copy:

- Open since 1965 and family-owned. The owner is on site.
- The swim program: over 30,000 children learned to swim at Maplewood, in two heated pools.
- One campus for the whole year: Play Center, preschool, classes, parties, vacation weeks and Summer Camp.
- The promise: "the moment you drive through our gates and roll down the hill, you become family."

## Operating Context

- **Seasons overlap in sales.** At any time of year, both sides sell. In October, for example, the site sells Play Center visits and Halloween Week, takes preschool enrollments and opens Summer 2027 registration.
- **The Play Center runs on a calendar.** Each open day has a character, a special guest and an outdoor activity. Families read the calendar and a printable monthly PDF. The Play Center closes in summer.
- **Registration and sales happen outside the site**: CampInTouch, Brightwheel, Aluvii and Active.com. Tours use Cognito Forms. Some forms and shared views stay in Airtable. A yearly waiver is required before a Play Center visit.
- **Documents change every year**: about 60 summer group schedules and welcome letters, packing lists, important dates, and dates and rates.
- **Editors** work in Sanity Studio with Presentation mode.

## Capabilities and Constraints

- **The look stays.** The rebuild keeps the live site's layout, fonts, colors and images. After launch, the existing design is polished and improved. It is not replaced (Ovi, 2026-10-09). The copy may be improved.
- **URLs stay the same**, including `/post/<slug>`. `www` is the canonical host.
- **No broken promises on the page.** A button with an empty or `#` link stays hidden until an editor adds a link.
- **Media live in Sanity** so editors can replace images, PDFs and the background videos.
- **Functional motion stays** (header hide-on-scroll, sliders, tabs, filters, and scroll animations that a section needs). Each has a static version for reduced motion. Decorative fade-ins are dropped.
- **Public repository.** No private personal data in code. Only contact details already on the public site.
- Terms such as Side, Season, Grade, Program, Camp group and Play Center day are defined in `CONTEXT.md`.

## Brand Commitments

- **Name:** "Maplewood Day Camp and Enrichment Center" is the official public name. "Maplewood" is the short form (Ovi, 2026-10-09).
- **Voice:** warm, happy and reassuring, as a camp director talks to a parent at the gate. Short sentences and plain words. Speak to the parent as "you" and about the child by age or grade. Show joy with real parent quotes and photos of real children. No pressure tactics. Safety facts are calm and specific, never fearful. The same voice on both sides (Ovi, 2026-10-09).
- **Public words:** say "Summer Camp" and "School Year", never "SC" or "SY". Say "Play Center", not "playground". Say "News post", not "blog post".

## Evidence on Hand

- Parent testimonials for each side, in Sanity.
- Public facts: since 1965; over 30,000 children taught to swim; two heated pools; 7:1 child-to-teacher ratio in School Year programs; 4:1 camper-to-counselor ratio in the summer Preschool & Kindergarten program; 50+ activities; free bus from 50+ stops.
- Staff rosters for each side, leadership pages, sample schedules, facilities and activities, in Sanity.

Not on hand; do not invent: the business split between the sides, competitor names, analytics goals, enrollment numbers and any claim the live site does not make.

## Product Principles

1. **One place, two equal sides.** Every page belongs to Summer Camp, to School Year or to the whole center. The visitor always knows which side they are on and can reach the other side.
2. **One clear next step on each page**: book a tour, register, buy, or open the Parent Dashboard.
3. **Current information or none.** Old dates and dead links damage trust. Hide what has no link or date.
4. **Proof next to each promise**: a testimonial, a staff photo or a fact.
5. **Editors own the content.** Every page must keep working when an editor changes its text, photos, links or PDFs.

## Accessibility & Inclusion

- axe shows no serious or critical issues on each page type.
- Lighthouse mobile performance is 85 or more on the home page, an inner page and a news post.
- Readable text, visible focus and full keyboard use. Every animation has a static version for reduced motion.
