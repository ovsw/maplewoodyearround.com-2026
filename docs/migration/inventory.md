# Live-site migration inventory

Captured on 2026-10-03 UTC. Scope: all 50 sitemap URLs and the three policy pages, for 53 distinct routes. Every public page returned HTTP 200.

## Status and evidence

This is the public HTML fallback audit allowed by issue #4. It is ready for page planning and visual matching. The authenticated CMS audit is incomplete because `WEBFLOW_API_TOKEN` from issue #2 is unavailable. The spec states that there are 27 collections. Public HTML does not prove their names, fields, types, full counts or bindings. Do not use rendered card counts as collection totals.

- [Public source evidence](public-source-evidence.json) contains each response date, original HTML hash, metadata, ordered sections, rendered collection wrappers, forms, scripts, embeds and links.
- [Public animation evidence](public-animation-evidence.json) contains only scroll events that match elements on the audited pages, their action values and source hashes.
- [Reference capture notes](reference/README.md), [baseline manifest](reference/manifest.json) and [scroll-state manifest](reference/states/manifest.json) describe the visual reference.
- Baseline viewports are 1440 × 1000 and 390 × 844. There are 106 baseline images, one per route and width. Supplemental images show scroll states.
- Full-page images are not complete motion references. Sticky content can be hidden at the initial scroll position. Use the supplemental states with the animation requirements below.
- Original public source URLs and service IDs remain in the evidence. Auth and API key values are redacted. No forms were submitted. Private project records are not included.

### Required authenticated follow-up

When issue #2 supplies the token, export all 27 actual collection IDs and names. For each, record field names, field IDs, types, required flags, options, reference targets and asset fields. Page through all items and count published, draft and archived records separately. Record page bindings, filters, sort order and limits. Include records that do not appear in public HTML. Until that audit is complete, the collection requirement in issue #4 remains open.

## Shared page behavior

All 53 pages include the shared navigation, footer and newsletter form. The source newsletter form has name and ID `email-form`, method GET and no explicit action. Its required email input is named `email-2`. Webflow handles runtime submission; delivery and success/error states were not tested. Preserve an accessible success/error flow when replacing it.

The shared header hides while scrolling down and returns while scrolling up. The source uses GSAP ScrollTrigger on `body`, from `top top` to `bottom bottom`, and changes `.nav_component.is-nav-hidden` when direction changes. Keep navigation accessible by keyboard. The final rebuild can keep the header visible under reduced motion.

Shared scripts include WebFont, Google analytics, Hotjar, Flowbase tooltips, FluidSEO schema, jQuery 3.5.1, Webflow, GSAP 3.12.7 and ScrollTrigger, the Slater loader, scroll-to-top behavior and inline mobile-video setup. These describe the source, not dependencies that must be copied. The per-page entries list additions to this shared set. Exact URLs and inline-script hashes are in the source evidence.

Slater loads the header behavior, Swiper sliders and the current footer year. Sliders use automatic slide widths, 500 ms speed, keyboard input in the viewport, click-to-slide, touch dragging, no loop, clickable bullet buttons and previous/next buttons. Preserve those controls with accessible labels. FAQ expansion, menu/dropdown controls, tabs and filter controls are functional click behavior, not decorative animation.

### Forms and embeds

| Pages | Provider or behavior | Evidence and migration need |
| --- | --- | --- |
| All 53 | Newsletter | Required email input; destination and delivery need confirmation. |
| `/school-year/facilities`, `/summer-camp/activities` | Finsweet CMS filter | Local filter forms, not contact forms. Preserve filtering and empty states. |
| `/summer-camp/schedule-a-tour`, `/school-year/schedule-a-tour` | Cognito Forms | `seamless.js`; prefill `SentFrom` with Summer Camp or School Year respectively. |
| `/summer-camp/changes-notification-form` | Airtable | Preserve the existing embedded form URL. |
| `/maplewood-main-calendar` | Events Calendar | Source uses `https://dist.eventscalendar.co/embed.js`. |
| `/`, `/contact`, `/summer-camp/bus-transportation` | Snazzy Maps | Existing public embed is `https://snazzymaps.com/embed/661063`. |

## Design tokens

These values come from the Webflow shared CSS. The source URL and SHA-256 are in the JSON evidence.

| Role | Value |
| --- | --- |
| Primary / primary dark | `#006601` / `#004201` |
| Light background / dark text | `#fffbf0` / `#243021` |
| Secondary / middle / dark | `gold` (`#ffd700`) / `#ffb000` / `#ff8400` |
| Tertiary / dark | `#43af89` / `#00a341` |
| Quaternary / dark | `#d779fc` / `#ae4dd5` |
| Accent / dark | `skyblue` (`#87ceeb`) / `#2795d5` |
| Focus | `#e64420` |
| Neutral scale | `#eee`, `#ccc`, `#aaa`, `#666`, `#444`, `#222`, `#111` |
| Standard / small corner radius | `0.8em` / `0.4em` |
| Pill / circle | `999rem` / `50%` |
| Side padding / large container | `5%` / maximum `80rem` |

Body text uses Lato at 1rem with line-height 1.5. Heading tokens use Poppins. WebFont loads Lato weights 100, 300, 400, 700 and 900 with italics; Halant 300 through 700; and Poppins 300 through 700. Halant is loaded, but no active body or heading role was found. Do not assign it a new role.

Desktop H1 through H6 sizes are 3.5, 3, 2.5, 2, 1.5 and 1.25rem. All use weight 700. Their line-heights are 1.2, 1.2, 1.2, 1.3, 1.4 and 1.4. Responsive rules reduce the H1/H2/H3 sizes through 3.25/2.75/2.25rem to 2.5/2.25/2rem. H4 reduces through 1.75rem to 1.5rem, with line-height 1.4. Smaller headings use 1.25rem and 1.125rem. The exact selectors must follow the reference when ported.

Source breakpoints are maximum 991px, 767px and 479px. Webflow interaction ranges are main at 992px and above, medium at 768–991px, small at 480–767px and tiny at 479px and below. Standard section padding reduces across smaller widths: large 7/6/4rem, medium 5/4/3rem and small 3/2rem. The spacing utility scale contains 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5 and 10rem.

## Required scroll behavior

Only retain motion needed for the section to show its content correctly. Under reduced motion, show all content in a readable static layout.

| Page and section | What moves | Trigger | End state and reason |
| --- | --- | --- | --- |
| `/` and `/school-year`, `.section_header83` | `.header83_images-layout` scales from 3.2 to 1; below 480px it starts at 3.4. Text and overlay fade. | `.header83_ix-trigger`, SCROLLING_IN_VIEW, smoothing 50, entering through the section, no extra offsets. | Scale 1 at progress 60; content opacity 0 at 24; overlay opacity 0 at 50. The surrounding activity grid becomes visible. Reduced motion shows the full grid. |
| `/`, `.section_layout515` | The four matching `.layout515_item.item-1` through `.item-4` text panels change opacity. | Each `.layout515_image-wrapper` enters or exits at a 50% viewport offset, at widths 768px and above. | Matching text shows at opacity 1 on entry, then 0 on exit. Without this behavior the overlapping sticky text stays hidden or overlaps. Mobile and reduced motion show the four panels in sequence. |
| `/`, `.section_layout412` | `.layout412_image-wrapper` width changes from 200% to 100%. | Section enters view at a 50% viewport offset, at widths 768px and above. | Settled image at 100% with the year-round content visible. Preserve the reveal only while retaining the clipped source composition; reduced motion uses the settled layout. |
| `/summer-camp/my-hot-lunchbox`, `.section_layout486` | The four-step number strip `.layout486_number-wrapper` moves vertically. | `.layout486_component`, SCROLLING_IN_VIEW, smoothing 50, at widths 768px and above. | Y is 0% at progress 30, -25% at 40/50, -50% at 60/70 and -75% at 80. This selects the number for each instruction in the stacked layout. Static and reduced-motion layouts show all four numbered instructions. |

The home text panels cover swimming, experiences, safety and family. The Hot Lunchbox steps are sign up, browse menus, order by noon the previous day, and optional repeated meals. This is a numbered sequence, not a numerical count-up. A rebuild that shows all four instructions and their numbers needs no moving number strip.

### Decorative effects to drop

- Timeline circle changes from green to amber around progress 45–50 on `/summer-camp`, `/school-year/programs/birthday-parties` and `/history`. No content depends on this.
- Hot Lunchbox progress-bar width changes from 0 to 100% as `.layout486_content` enters at 50%, then resets on exit. The instruction text already gives the meaning.
- Numerical count-up, general fade-in, hover motion and other decorative movement are not requirements. Keep their final text and state.
- Webflow contains unused action templates, including Header141 and Layout518. They have no matched elements in these 53 pages and are excluded from the requirements.

Keep the preserved hero, video zoom grid and header references in `legacy-mdc/` unchanged for later porting.

## Observed CMS use and missing schema audit

The section tables below list every observed `w-dyn-list` wrapper and its direct rendered-item count. There are 80 wrapper instances across the 53 pages. A wrapper is evidence of a published Webflow list. Its CSS class is not a collection name. A list may use filters, limits, nesting or the same collection as another list.

Observed content roles include news cards, testimonials, program cards, activities/facilities, staff, pricing, FAQs, jobs and documents. Those are descriptive roles only. Exact collection identity, field types and total counts remain unknown until the authenticated audit. The page and section rows provide the current page-use evidence without inventing a 27-collection schema.

## Live-site defects and checks still needed

- Dead `#` links exist on many pages, including news cards. The JSON lists every empty/hash link by page and text. A `#` used for a tab, filter or menu control is not automatically a dead CTA. Replace controls with buttons; hide a destination CTA until the editor supplies its URL.
- The featured Halloween article on `/news` shows 11 Oct 2024. The home copy shows October 1, 2026. Both contain the same Halloween-week title and link to `#`. Confirm the real publication date and destination. Do not substitute the separate Early Bird Enrollment article.
- All six `/post/*` pages use document title `MDC 3.0` and lack SEO description and OG image. The calendar and three policy pages also lack OG images.
- The Teen Leadership CIT page contains the invalid URL `https://Seasons` on its Seasons link.
- The spec flags an Aluvii category mismatch. This capture shows play-center links with `categoryId=1` and Gift Card links with `categoryId=2`. Both parent-dashboard category-2 cards are titled Gift Card, so those are not proof of a mismatch. The contact membership link uses `offSet=300`; other play-center links use `offSet=240`. Confirm destination/category behavior before changing IDs. The full variants are in the register below.
- Some program and rate headings show different years, including 2025, 2026 and 2027. Preserve source facts for comparison; confirm current dates and prices before launch.
- At 390px, the source overflows horizontally on summer group schedules (412px document width), privacy policy (483px) and cookie policy (530px). Fix overflow in the rebuild.
- The screenshot audit observed a Flowbase tooltip script integrity mismatch. Do not copy that failure.
- The bus map works. Its endpoint returns 200 and title Maplewood Pickup Locations; the standalone map and the home iframe render markers. A blank offscreen map in a baseline capture is a capture-state limit, not a missing map. Use the supplemental bus-map images.
- Source pages `/school-year/programs`, `/maplewood-seasons`, `/parent-dashboard`, `/summer-camp/programs` and `/maplewood-main-calendar` have no H1 in the public HTML. The home page has two. Set a clear page heading in the rebuild.

## External link register

The following 94 distinct public anchor URLs cover all observed external links. Labels and page use come from the HTML. Whether a field is editor-managed cannot be proved without the CMS audit. The register includes service links, social links, documents and non-www same-site links so no candidate is lost. Embeds and script-only providers are listed separately above.

| Destination | Source labels | Pages |
| --- | --- | --- |
| https://maplewoodyearround.aluvii.com/store/shop/categoryproducts?id=1&offSet=240&categoryId=2 | Gift Card; Buy Gift Card; Buy Online; GIFT CARDS | All 53 |
| https://maplewood.campintouch.com/v2/login/login.aspx? | Parent Login; Staff Login; Returning Camper Login; Returning Camper Registration Form; Visit Page | All 53 |
| https://www.facebook.com/MaplewoodKids/ | [icon without text]; Facebook | All 53 |
| https://www.instagram.com/maplewoodcountrydaycamp/ | [icon without text]; Instagram | All 53 |
| https://www.youtube.com/user/MaplewoodKids | [icon without text]; Youtube | All 53 |
| https://twitter.com/maplewoodkids | [icon without text] | All 53 |
| https://www.pinterest.com/maplewoodday/pins/ | [icon without text]; Pinterest | All 53 |
| https://www.linkedin.com/company/maplewood-country-day-camp | [icon without text] | All 53 |
| https://snazzymaps.com/embed/661063 | Open Map in New Tab | `/`, `/contact` |
| https://x.com/maplewoodkids | X | All 53 |
| https://maplewood.campintouch.com/ui/forms/application/camper/App | New Camper form; New Camper Registration Form | `/summer-camp/dates-and-rates`, `/contact`, `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit` |
| https://maplewoodyearround.aluvii.com/employee/Waiver/SignWaiver2?waiverId=1 | waiver; waiver link; Fill Out Yearly Waiver; Complete required yearly waiver before coming to play; Maplewood Play Center Waiver; standard Maplewood Indoor/Outdoor Play Center Waiver; Playground Waiver (required one-time step); Visit Page | `/school-year`, `/school-year/programs/indoor-outdoor-play-center`, `/school-year/programs/birthday-parties`, `/contact`, `/faqs`, `/parent-dashboard` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6abff42382768c45225d6cdf_Calendars-Oct-Nov-(1).pdf | October-November 2026 | `/school-year/programs/indoor-outdoor-play-center` |
| https://maplewoodyearround.aluvii.com/store/shop/categoryproducts?id=1&offSet=240&categoryId=1 | Buy Online; Book Play Center; ‍; Play Center Reservation | `/school-year/programs/indoor-outdoor-play-center`, `/contact` |
| https://airtable.com/appDr8kxFOUo2V7kD/pagZPqEgG9LH5u6xr/form | Register Online | `/school-year/programs/preschool-program` |
| https://campscui.active.com/orgs/MaplewoodCountryDayCamp?orglink=camps-registration | Register Online | `/school-year/programs/enrichment-classes/flying-solo`, `/school-year/programs/enrichment-classes/gymnastics-class`, `/school-year/programs/enrichment-classes/sports-enrichment-class`, `/school-year/programs/enrichment-classes/arts-class` |
| https://maplewoodyearround.aluvii.com/event | Online Reservation; online reservation form; Birthday Party Reservation | `/school-year/programs/birthday-parties`, `/contact` |
| https://airtable.com/apptz7ALF6YDdQFMc/pagp5QzUjzcZSCJDD/form | contact you before booking | `/school-year/programs/birthday-parties` |
| https://campscui.active.com/orgs/MaplewoodCountryDayCamp?e4q=2c75ca1c-6635-44b2-9af6-7d24f223b3ab&e4p=e4198279-9994-49ea-99ed-0d9ed9950a9c&e4ts=1726245191&e4c=active&e4e=snlvcmpscui00001load&e4rt=Safetynet&e4h=0be56601da9356632cab654432b83fd4#/selectSessions/3547443 | Get started; February 2027 Vacation Registration; April 2027 Vacation Registration | `/school-year/programs/vacation-program`, `/contact` |
| https://ordernow.myhotlunchbox.com/sign-up | https://ordernow.myhotlunchbox.com/sign-up | `/summer-camp/my-hot-lunchbox` |
| https://www.youtube.com/@myhotlunchbox | My Hot Lunchbox YouTube Channel | `/summer-camp/my-hot-lunchbox` |
| https://apps.apple.com/us/app/myhotlunchbox/id1629321590 | Official My Hot Lunchbox App on the Apple App Store | `/summer-camp/my-hot-lunchbox` |
| https://play.google.com/store/apps/details?id=com.mhl.myhotlunchbox&hl=en | Official My Hot Lunchbox App on the Google Play Store | `/summer-camp/my-hot-lunchbox` |
| https://maps.app.goo.gl/TrSDWWW6cHWabfYG8 | 150 Foundry Street,South Easton, MA, 02375 | `/contact` |
| https://maplewoodyearround.aluvii.com/store/shop/categoryproducts?id=1&offSet=300&categoryId=1 | Play Center Membership; Join today | `/contact`, `/post/new-monthly-memberships` |
| https://schools.mybrightwheel.com/sign-in?redirect_path=/admissions/packet/3a043f30-4e8f-4bf1-9eb8-62a4d5f798f7/fill?school_id=fc5eaace-9ecd-40fa-af18-0b97b68853dc | Preschool 2026-2027 Application | `/contact` |
| https://auth.campminder.com/u/login/identifier?state=hKFo2SBsaFRma2psbXRaZ3BlWTJ oMXp2RC0tMjZrMUVkZXk4NaFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIEJTNDY2S3NXX0c4TX VhdldvMVFzamtCVFlkSjFDY1BEo2NpZNkgM1QxM250MUJpZmNnd25kTU5CRnN1bHNpc0l Rd2RzTHA | our Campminder Portal | `/staff`, `/faqs` |
| https://maplewood.campintouch.com/ui/forms/application/staff/App | Apply Now | `/staff-opportunities` |
| https://maplewoodyearround.com/summer-camp/swim-instruction | Maplewood Swimming Instruction | `/faqs`, `/summer-camp/programs/preschool-and-kindergarten`, `/summer-camp/programs/1st-7th-grade`, `/summer-camp/programs/teen-leadership-cit` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/67aa0d94691ea522306a9040_Preschool-packet-25-26.pdf | Visit Page | `/parent-dashboard` |
| https://maplewood-merchandise.myshopify.com/ | Visit Page | `/parent-dashboard` |
| https://airtable.com/appcP8D6WjdoAKvZB/shrau9wIwHNK8kfsS | Visit Page | `/parent-dashboard` |
| https://airtable.com/appcP8D6WjdoAKvZB/shrUYrs000JH5EvDB | Visit Page | `/parent-dashboard` |
| https://photos.app.goo.gl/S8dZXntkFRZLrjt39 | Visit Page | `/parent-dashboard` |
| https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/6a6592d2bf33efae2ed2a232_packing-list-summer-camp-maplewood.pdf | Download PDF | `/parent-dashboard` |
| https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/6a6592cefdb885cdd37cfa25_SummerCamp-Dates-to-remember-2026-maplewood.pdf | Download PDF | `/parent-dashboard` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2ac2aa12d117598572f0dc_Chipmunks-2026.pdf | Chipmunks | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa6fe387fe17aa6df0fd8_Muppets-2026.pdf | Muppets | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa775115093c0a3af1436_Peanut-Rascal-2026.pdf | Peanut-Rascal 5 Day | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa70f6429b985153c7d30_Munchkins-2026.pdf | Munchkins | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa778d02d127fcc24a622_Poodles-2026.pdf | Poodles | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa557342d5fca6b67b4f5_Aquanauts-2026.pdf | Aquanauts | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa57d911d618c643439c2_Bunnies-2026.pdf | Bunnies | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa611bcf94a8da496dfa6_Jolly-Rogers-2026.pdf | Jolly Rogers | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa63474c74a873998b912_Ladybugs-2026.pdf | Ladybugs | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa640912b13cf408b0f49_Leprechauns-2026.pdf | Leprechauns | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa78e32b70b9b64f9dfef_Roadunners-2026.pdf | Roadrunners | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a4552bc3527027b9509bff8_Sharks-2026.pdf | Sharks | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa86b7892dac7ea439f65_Witches-2026.pdf | Witches | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa6e474c73f935a28a0f6_Mermaids-2026.pdf | Mermaids | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa727be46d92b79d19ed9_Musketeers-2026.pdf | Musketeers | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa85d912b13cf408bec8d_Unicorns-2026.pdf | Unicorns | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa85d912b13cf408bec90_Vikings-2026.pdf | Vikings | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa56acdf3c6ee7e19d9ee_Be-Boppers-2026.pdf | BeBopppers | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a3c46b877ac116fc855d779_Knights.pdf | Knights | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa7a1d02d127fcc24c99f_Rockettes-2026.pdf | Rockettes | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa775115093c0a3af143c_Pinkies-2026.pdf | Pinkies | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a3c4690c8e484b8b720a220_Wild-Ones.pdf | Wild Ones | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa549c1a95b0212e96706_Angels-2026.pdf | Angels | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa8576bb4ed1369fee6f6_Stinkers-2026.pdf | Stinkers | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa8576bb4ed1369fee6f2_Tailblazers-2026.pdf | Trailblazers | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa7409028c7b9bffb21ca_Navigators-2026.pdf | Navigators | `/summer-camp/summer-group-schedules` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a2aa598a7de90a6a6757663_CIT-2026.pdf | CIT | `/summer-camp/summer-group-schedules` |
| https://Seasons | Seasons | `/summer-camp/programs/teen-leadership-cit` |
| https://apps.apple.com/us/app/campanion/id1457911692?ign-mpt=uo%3D4 | Download iPhone App; iPhone | `/summer-camp/camper-daily-photos` |
| https://play.google.com/store/apps/details?id=com.campanionapp | Android app | `/summer-camp/camper-daily-photos` |
| https://campanionapp.com/support/help/ | FAQs and customer support | `/summer-camp/camper-daily-photos` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fac37e825d638f0a949a_Chipmunks-Welcome-2026.pdf | Chipmunks | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb111d9bae5dfcdd8394_Muppets-Welcome-2026.pdf | Muppets | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb2d28f6080cce5c451c_Peanut-Rascals-Welcome-2026.pdf | Peanut-Rascal 5 Day | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb111d9bae5dfcdd8384_Munchkins-Welcome-2026.pdf | Munchkins | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a455346f747f1bbc9811b56_Poodles-Welcome-2026.pdf | Poodles | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fa8ccb493606d3062c03_Aquanauts-Welcome-2026.pdf | Aquanauts | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43faa1e93808f7c04f074b_Bunnies-Welcome-2026.pdf | Bunnies | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a5655c0eb1fd3da7071166e_Jolly-Rogers---Welcome-Letters---2026-(1).pdf | Jolly Rogers | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43faac157110d10bd17b4a_LadyBugs-Welcome-2026.pdf | Ladybugs | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb0db88f9ca2599ce15c_Leprechauns-Welcome-2026.pdf | Leprechauns | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fba11aae0b6d2545c8f5_Roadrunner-Welcome-2026.pdf | Roadrunners | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a4552cbb94ce4b4e10b0322_Sharks-Welcome-2026.pdf | Sharks | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fbb709b9dbb3da8c1f30_Witches-Welcome-Letter-26.pdf | Witches | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb111d9bae5dfcdd838f_Mermaids--Welcome-2026.pdf | Mermaids | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a455346f747f1bbc9811b5c_Musketeers-Welcome-2026.pdf | Musketeers | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fba6cdd562beca8c5111_unicorns-Welcome-2026.pdf | Unicorns | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a45528ff747f1bbc980df37_Vikings-Welcome-2026.pdf | Vikings | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fa993475b7ffe1d65ca0_BeBoppers-Welcome-2026.pdf | BeBopppers | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a70f2402335d02dd1e07bdc_Knights-Welcome-Letter-26.pdf | Knights | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fba11aae0b6d2545c8f8_Rockettes-Welcome-2026.pdf | Rockettes | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fba11aae0b6d2545c8fb_Pinkies-Welcome-2026.pdf | Pinkies | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fbb709b9dbb3da8c1f2c_Wild-ones-Welcome-2026.pdf | Wild Ones | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fa7fdce14fe07a060d18_Angels-Welcome-2026.pdf | Angels | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fba21aae0b6d2545c904_Stinkers-Welcome-2026.pdf | Stinkers | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a70f84190d69ea720399ba6_Trailblazers-Welcome-Letter-26.pdf | Trailblazers | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a43fb2632d2033a996cbd6b_Navigators-Welcome-2026.pdf | Navigators | `/summer-camp/summer-camp-welcome-letters` |
| https://cdn.prod.website-files.com/67758e2e906cb8afffdc8b75/6a45566af747f1bbc982b34f_CIts-Welcome-2026.pdf | CIT | `/summer-camp/summer-camp-welcome-letters` |

## Page inventory

Section order follows the main public DOM. Shared header and footer apply to every page. Pattern names describe the rendered structure; they are not proposed schema names. An empty source section on dates-and-rates has no content and is omitted from its ordered list. H1 and SEO values below are source values, including source errors. OG image entries show the exact URL or its absence.

### /

- Public page: [/](https://www.maplewoodyearround.com/)
- H1: Unleash Your Child's Summer Camp Adventure Today! / Latest Maplewood News
- SEO title: Children's Summer Camp in South Easton, MA \| Maplewood
- SEO description: Join our children's summer camp in South Easton, MA, where kids create unforgettable memories through fun activities and personalized attention.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7ff63736a0023fe8f4bb_sc-home.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | video hero; `section_header33 u-theme-dark` | Unleash Your Child's Summer Camp Adventure Today! | No list wrapper observed |
| 2 | scroll zoom grid; `section_header83 text-color-alternate`; #activities | 50+ activitiesto choose from | No list wrapper observed |
| 3 | scroll image and text panels; `section_layout515` | Over 30,000 children have learned to swim at Maplewood, since 1965 / Unforgettable Experiences for children of all ages / Your Child's Safety is Our Top Priority / You Are Family | No list wrapper observed |
| 4 | testimonial list; `section_testimonials_testimonial11 u-theme-dark`; #testimonials | Parent Testimonials: | `wall-of-love_wrap w-dyn-list`: 17 rendered items; collection unknown |
| 5 | bus map and benefits; `section_transportation_contact14` | Free Bus Transportation / Free bus service / Qualified Staff / Peace of mind | No list wrapper observed |
| 6 | image width reveal; `section_layout412 u-theme-dark` | We're open year-round! | No list wrapper observed |
| 7 | featured news and card grid; `section_blog7`; #blog-header-7 | Latest Maplewood News / Costumes, Treats & Play: Halloween Week at Maplewood / Birthday Parties / Indoor/Outdoor Play Center / Enrichment Classes | `blog7_featured-list-wrapper w-dyn-list`: 1 rendered items; collection unknown<br>`blog7_list-wrapper w-dyn-list`: 3 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: https://snazzymaps.com/embed/661063

Scripts beyond the shared set: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js; inline SHA-256 4c47c8a2131a3a7aa8ea2c7c2ec08bc243a868ec8bcf342da980fd71ff4801b5.

Empty/hash links: 9. See this page's evidence record for the exact labels and sections.

### /director-lee

- Public page: [/director-lee](https://www.maplewoodyearround.com/director-lee)
- H1: Lee's Story
- SEO title: Lee Pinstein: Camp Director at Maplewood in Easton, MA
- SEO description: Join Lee Pinstein, the dedicated camp director at Maplewood in Easton, MA, as he creates a nurturing environment for children to learn and grow.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc65cd527351ff90abb_director.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | director introduction; `section_layout355 text-color-alternate` | Lee's Story / I Love Coming to Work! / Camp Director | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /summer-camp

- Public page: [/summer-camp](https://www.maplewoodyearround.com/summer-camp)
- H1: Maplewood Summer Camp
- SEO title: Summer Camp at Maplewood: Adventure Awaits \| Day Camp in Easton, MA
- SEO description: Join Maplewood's Summer Day Camp for an unforgettable experience filled with fun activities and the best swimming program in the area for children aged 3-14.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fca5382531656f9e6b2_summer-camp.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Maplewood Summer Camp | No list wrapper observed |
| 2 | program card grid; `section_summer-camp_programs`; #programs | Summer Camp Programs / Preschool & Kindergarten / K-7th Grade Program / Teen Leadership (C.I.T.) | No list wrapper observed |
| 3 | program card grid; `section_summer-camp_additional-programs`; #additional-programs | Additional Programs / Academic Program / The 9th Week / Social Emotional Support Program | No list wrapper observed |
| 4 | elective cards; `section_summer-camp_club-day-electives u-theme-dark`; #electives | Club Day Electives / Huge Selection / Specialize or explore | No list wrapper observed |
| 5 | split image and text; `section_layout302`; #session-dates | Flexible Session Lengths | No list wrapper observed |
| 6 | split image and text; `section_layout30`; #staff | Superior Staffing / Individual Attention / Veteran Staff / 3:1 Ratio / Daily Photos | No list wrapper observed |
| 7 | history story; `section_summer-camp_history` | Over 60 Years of Summer Camp Excellence / Our Heritage / Enduring Impact | No list wrapper observed |
| 8 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |
| 9 | testimonial list; `section_testimonials_testimonial11 u-theme-dark is-summer-camp`; #testimonials | Summer CampParent Testimonials | `wall-of-love_wrap w-dyn-list`: 17 rendered items; collection unknown |
| 10 | timeline; `section_summer-camp_enrollment-process-timeline`; #how-it-works | Discover Our Day Camp Enrollment Process / Step 1 / Create an account or log into existing one / Step 2 / Complete Camper Application Form / Step 3 / Application Review & Approval / Step 4 / Prepare for Camp Season! | No list wrapper observed |
| 11 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 19 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://code.jquery.com/jquery-3.6.0.min.js; inline SHA-256 6760eda1a64d4fdf622986f66b1bee6397a2d252eb0b705b1adc30b9e9717e53.

Empty/hash links: 0.

### /summer-camp/dates-and-rates

- Public page: [/summer-camp/dates-and-rates](https://www.maplewoodyearround.com/summer-camp/dates-and-rates)
- H1: Dates & Rates
- SEO title: Dates & Rates Summer Day Camp in Easton, MA \| Maplewood
- SEO description: Discover Maplewood Summer Camp's enrollment policies and pricing in Easton, MA. Contact us for more details about our summer camp programs.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc9e61a43717a2e051a_sc-dates-and-rates.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Dates & Rates | No list wrapper observed |
| 2 | rate or session table; `section_comparison8 background-color-white`; #preschoolers-sessions | 2027 Available Dates | No list wrapper observed |
| 3 | rate or session table; `section_comparison8 background-color-white`; #week-9 | Week 9 – Summer's Last Splash | No list wrapper observed |
| 4 | rate or session table; `section_k-9-sessions-table_comparison6`; #k-9th-sessions | Grades K-7 & CIT | No list wrapper observed |
| 5 | rate or session table; `section_comparison8 background-color-white`; #preschoolers-sessions | Preschool & Kindergarten | No list wrapper observed |
| 6 | pricing cards; `section_pricing19`; #pricing | Before & After Care | No list wrapper observed |
| 7 | FAQ accordion; `section_faq3 alt background-color-white`; #faq | Enrollment Policies & Payment Information | `w-dyn-list`: 6 rendered items; collection unknown |
| 8 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /school-year

- Public page: [/school-year](https://www.maplewoodyearround.com/school-year)
- H1: Indoor / Outdoor Play Center / Enrichment Classes / Vacation Programs
- SEO title: Transformative Summer Camp Experiences for Kids \| Maplewood Day Camp
- SEO description: Discover how our summer camp fosters growth, confidence, and lifelong friendships. Read happy parent testimonials about their children's joyful experiences!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fcb8c9af8fa7eb5516e_sy-home.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `section_header103 text-color-alternate`; #programs | Indoor / Outdoor Play Center / Preschool Program / Enrichment Classes / Vacation Programs | No list wrapper observed |
| 2 | split image and text; `section_layout30 background-blue` | We host amazing ‍Birthday Parties at the Play Center! | No list wrapper observed |
| 3 | scroll zoom grid; `section_header83 text-color-alternate`; #activities | 50+ activitiesto choose from | No list wrapper observed |
| 4 | split image and text; `section_layout30`; #staffing | Superior Staffing / Individual Attention / Veteran Staff / 7:1 Ratio / Stay Connected | No list wrapper observed |
| 5 | testimonial list; `section_testimonials_testimonial11 u-theme-dark is-school-year`; #testimonials | School YearParent Testimonials | `wall-of-love_wrap w-dyn-list`: 15 rendered items; collection unknown |
| 6 | FAQ accordion; `section_faq3`; #faq | FAQs | `w-dyn-list`: 22 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: inline SHA-256 ef63b0108a5f0d305de4284917f88c673c052ae659fbb05e7fc459ed80c6bd86.

Empty/hash links: 5. See this page's evidence record for the exact labels and sections.

### /school-year/programs/indoor-outdoor-play-center

- Public page: [/school-year/programs/indoor-outdoor-play-center](https://www.maplewoodyearround.com/school-year/programs/indoor-outdoor-play-center)
- H1: Indoor / Outdoor Play Center
- SEO title: Explore Maplewood Indoor/Outdoor Playground in South Easton, MA
- SEO description: Join us at Maplewood for exciting indoor and outdoor playground sessions, arts & crafts classes, and rock climbing fun for kids this February!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc4803ddb2cd9a3592e_indoor-outdoor-playground.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header11o_wrap` | Indoor / Outdoor Play Center | No list wrapper observed |
| 2 | card slider; `section_blog66 background-color-white`; #event-calendar | Event Calendar | `w-dyn-list`: 1 rendered items; collection unknown<br>`swiper is-blog66-slider w-dyn-list`: 15 rendered items; collection unknown |
| 3 | card slider; `section_blog66 background-color-white`; #indoor-activities | 25+ Indoor Activities / Construction Crane / Air Rockets / Playhouses / Sand box / Swings / Pedal Karts / Bikes / Scooters / Ultimate Ball Launcher / Soar and Catch Scarf Launcher / Playsets / Infant Area / Bounce House Castle | `swiper is-blog66-slider w-dyn-list`: 21 rendered items; collection unknown |
| 4 | card slider; `section_blog66 background-color-white`; #outdoor-activities | Outdoor Activities / Bubble-House / Pedal Karts - Outdoors / Playhouses (village) / Playground / Sand Play / Sports | `swiper is-blog66-slider w-dyn-list`: 6 rendered items; collection unknown |
| 5 | card slider; `section_blog66 background-color-white`; #characters | Character List / Blue Heeler / Red Heeler / Fire Dog / Air Rescue Pup / Police Dog / Red Muppet / Silly Dog / Video Game Man / Astronaut Toy / Mr. Mouse / Silly Bob | `swiper is-blog66-slider w-dyn-list`: 21 rendered items; collection unknown |
| 6 | card slider; `section_blog66 background-color-white`; #special-activities | Special Activities / Pony Rides / Pontoon Boat / Xen's Critters / Bubble Master / Foam Daddy / Train Rides / Ice cream cart / Animals with Matt / Face Painting / Small Singers and Shakers / Balloon Creations | `swiper is-blog66-slider w-dyn-list`: 30 rendered items; collection unknown |
| 7 | pricing cards; `section_pricing19`; #pricing | Pricing | No list wrapper observed |
| 8 | pricing cards; `section_pricing19 background-color-alternative`; #monthly-memberships | New! Monthly Memberships | No list wrapper observed |
| 9 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 4 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /school-year/programs/preschool-program

- Public page: [/school-year/programs/preschool-program](https://www.maplewoodyearround.com/school-year/programs/preschool-program)
- H1: Preschool Program
- SEO title: Maplewood Preschool: Nurturing Young Minds
- SEO description: Join our unique preschool program where experienced teachers foster curiosity and confidence in a safe, spacious environment. Enroll today!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc889cac0609a5c2185_preschool-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Preschool Program | No list wrapper observed |
| 2 | feature grid; `section_layout248` | A Unique Preschool Experience! / Amazing Staff / Excellent Facilities / Raving Testimonials | No list wrapper observed |
| 3 | split image and text; `section_layout30`; #overview | 2 & 3 day options / Our Goal / Convenient schedule / Add-ons | No list wrapper observed |
| 4 | statistics; `section_stats14`; #staff | Outstanding Staff / years of experience / teacher / Staff-to-chid ratio | `team4_list-wrapper w-dyn-list`: 9 rendered items; collection unknown |
| 5 | feature grid; `section_layout59`; #facilities | Outstanding Facilities / Indoor / Outdoor Playground / Everything children need to learn and play | No list wrapper observed |
| 6 | card slider; `section_blog66 background-color-white`; #sample-schedule | Sample Daily Schedule / Arrival/Open Discovery Time / Clean-up / Story Time / Bathroom/Wash hands / Snack Time / Morning meeting / Small Group Time / Outdoors/Indoor Play Center / Lunch / Good bye song/dismissal / Preschool bridge program | `swiper is-blog66-slider w-dyn-list`: 12 rendered items; collection unknown |
| 7 | program card grid; `section_layout311`; #classes-list | 2025 Enrichment Classes / Flying Solo / Gymnastics Class / Arts Class / Sports Class | No list wrapper observed |
| 8 | testimonial list; `section_testimonials_testimonial11 is-school-year-bg u-theme-dark`; #testimonials | School Year Parent Testimonials | `wall-of-love_wrap w-dyn-list`: 15 rendered items; collection unknown |
| 9 | pricing cards; `section_pricing19`; #sessions-and-pricing | 2026-2027 Preschool Pricing | No list wrapper observed |
| 10 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 4 rendered items; collection unknown |
| 11 | split image and text; `section_layout30 background-color-white` | Tour with a Teacher | `w-dyn-list`: 4 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: inline SHA-256 59722bef434cb7e4dab9e0e08cac5efb4629023051bfc4ba6955197d48419450.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /school-year/programs

- Public page: [/school-year/programs](https://www.maplewoodyearround.com/school-year/programs)
- H1: Absent
- SEO title: Explore 2025 School Year Programs for Kids \| Maplewood Day Camp
- SEO description: Join our 2025 School Year Programs at Maplewood! Engage in fun learning activities, enjoy our playground, and celebrate birthdays with special characters.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc4e61a43717a2e0025_school-year-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | program card grid; `section_layout311` | 2025 School Year Programs / Preschool Program / Indoor/Outdoor Playground / Birthday Parties / Vacation Program | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /school-year/programs/enrichment-classes/flying-solo

- Public page: [/school-year/programs/enrichment-classes/flying-solo](https://www.maplewoodyearround.com/school-year/programs/enrichment-classes/flying-solo)
- H1: Flying Solo
- SEO title: Independent Play Program for Kids in South Easton, MA
- SEO description: Enroll your kids in our Flying Solo Program in South Easton, MA. Help them become independent while enjoying fun activities with peers.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc6a2094c32c79712a8_flying-solo.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Flying Solo | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | Reduce anxiety / Our Mission / Fun Schedule / Gateway to Preschool | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white` | Class Activities / Arts & Crafts / Toy Room / Story Time / Train Table | `swiper is-blog66-slider w-dyn-list`: 4 rendered items; collection unknown |
| 4 | pricing cards; `section_pricing19 background-color-white`; #sessions-and-pricing-2025-2026 | 2026-2027 Flying Solo Program Sessions & Pricing | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 2. See this page's evidence record for the exact labels and sections.

### /school-year/staff-roster

- Public page: [/school-year/staff-roster](https://www.maplewoodyearround.com/school-year/staff-roster)
- H1: Staff Roster
- SEO title: Meet Our School Year Team \| Maplewood Day Camp, MA
- SEO description: Discover the dedicated individuals behind Maplewood's School Year Programs. Join us as we create unforgettable summer experiences!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc9d5ff0c5662055406_sy-roster.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Staff Roster | No list wrapper observed |
| 2 | staff grid; `section_team4` | We're hiring! | `team4_list-wrapper w-dyn-list`: 22 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /maplewood-seasons

- Public page: [/maplewood-seasons](https://www.maplewoodyearround.com/maplewood-seasons)
- H1: Absent
- SEO title: Explore Our Camp Seasons at Maplewood Day Camp
- SEO description: Discover the diverse camp seasons at Maplewood Day Camp, including Summer Day Camp and School Year Day Camp with over 50 activities for children aged 3-14.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc804d109fbc37e98bae0f_seasons.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | program card grid; `section_summer-camp_programs background-color-alternative` | We're open Year-Round! / Summer Camp / School Year | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /school-year/programs/birthday-parties

- Public page: [/school-year/programs/birthday-parties](https://www.maplewoodyearround.com/school-year/programs/birthday-parties)
- H1: Birthday Parties
- SEO title: Exciting Kids Birthday Party Venue in Easton, MA
- SEO description: Celebrate your child's birthday at our South Easton venue with exciting activities, character visits, and dedicated staff for a memorable party!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc9faddb7f24dc44e9c_birthday-parties.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Birthday Parties | No list wrapper observed |
| 2 | split image and text; `section_layout30` | Character Visit / Dedicated Staff / Setup/cleanup / Customization | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #indoor-activities | 25+ Indoor Activities / Construction Crane / Air Rockets / Playhouses / Sand box / Swings / Pedal Karts / Bikes / Scooters / Ultimate Ball Launcher / Soar and Catch Scarf Launcher / Playsets / Infant Area / Bounce House Castle | `swiper is-blog66-slider w-dyn-list`: 21 rendered items; collection unknown |
| 4 | card slider; `section_blog66 background-color-white`; #outdoor-activities | Outdoor Activities / Bubble-House / Pedal Karts - Outdoors / Playhouses (village) / Playground / Sand Play / Sports | `swiper is-blog66-slider w-dyn-list`: 6 rendered items; collection unknown |
| 5 | card slider; `section_blog66 background-color-white`; #character-list | Character List / Blue Heeler / Red Heeler / Fire Dog / Air Rescue Pup / Police Dog / Red Muppet / Silly Dog / Video Game Man / Astronaut Toy / Mr. Mouse / Silly Bob | `swiper is-blog66-slider w-dyn-list`: 21 rendered items; collection unknown |
| 6 | card slider; `section_blog66 background-color-white`; #add-ons | Add-ons / Pontoon Boat / Bubble Master / Foam Daddy / Train Rides / Animals with Matt / Face Painting / Balloon Creations / Boating / Elsa & Anna / Rock Climbing Wall / Princess Elsa | `swiper is-blog66-slider w-dyn-list`: 22 rendered items; collection unknown |
| 7 | pricing cards; `section_pricing19 z-index-2`; #pricing | Birthday Parties & Events Pricing | No list wrapper observed |
| 8 | timeline; `section_summer-camp_enrollment-process-timeline`; #how-it-works | Online Reservation Steps / Step 1 / Choose a package / Step 2 / Click "Online Reservation" / Step 3 / Payment / Step 4 / Waiver + Options | No list wrapper observed |
| 9 | call to action; `section_cta13 u-theme-dark` | Important Reminders | No list wrapper observed |
| 10 | FAQ accordion; `section_faq3`; #faq | FAQs | `w-dyn-list`: 8 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js.

Empty/hash links: 0.

### /school-year/programs/vacation-program

- Public page: [/school-year/programs/vacation-program](https://www.maplewoodyearround.com/school-year/programs/vacation-program)
- H1: School-Age Vacation Program
- SEO title: Engaging Vacation Program for Kids \| Maplewood Day Camp in Easton, MA
- SEO description: Keep your children active and engaged during school breaks with our enriching vacation program. Discover a variety of activities designed for ages 2-4!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc6f6e758afcd6596d0_vacation-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | School-Age Vacation Program | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | For parents and kids / Our Goal / Variety of Activities / Appropriate Clothing | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #activities | Program Activities / Pontoon Boat / Playsets / Playhouses (village) / Sand box / Sports / Rock Climbing Wall / Toy Room / Giant Lite Brite / Superspace Magnetic Tiles / Playhouses / Ultimate Ball Launcher | `swiper is-blog66-slider w-dyn-list`: 22 rendered items; collection unknown |
| 4 | pricing cards; `section_pricing19`; #sessions-and-pricing | 2027 Sessions & Pricing | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 3. See this page's evidence record for the exact labels and sections.

### /summer-camp/staff-roster

- Public page: [/summer-camp/staff-roster](https://www.maplewoodyearround.com/summer-camp/staff-roster)
- H1: Staff Roster
- SEO title: Meet Our Summer Camp Team at Maplewood Day Camp, MA
- SEO description: Discover the dedicated individuals behind Maplewood's Summer Camp. Join us as we create unforgettable summer experiences!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc8e8ddb43681ac3fb5_sc-roster.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Staff Roster | No list wrapper observed |
| 2 | staff grid; `section_team4` | We're hiring! | `team4_list-wrapper w-dyn-list`: 29 rendered items; collection unknown |
| 3 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /school-year/facilities

- Public page: [/school-year/facilities](https://www.maplewoodyearround.com/school-year/facilities)
- H1: Facilities
- SEO title: School Year Facilities \| Maplewood
- SEO description: Our facilities are designed with safety and engagement in mind, providing a nurturing environment for children to thrive.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc668fff3927366ce9f_sy-facilities.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Facilities | No list wrapper observed |
| 2 | filterable card grid; `section_filters5`; #top | FiltersUse the filter options below to find the relevant activities for your child based on age, bunk or activity type.Sort by Most PopularMost RecentName: A to ZName: Z to APrice: | `product1_list-wrapper w-dyn-list`: 15 rendered items; collection unknown |

Forms: shared newsletter; `wf-form-Filter-5` (text, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox).

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js.

Empty/hash links: 11. See this page's evidence record for the exact labels and sections.

### /summer-camp/my-hot-lunchbox

- Public page: [/summer-camp/my-hot-lunchbox](https://www.maplewoodyearround.com/summer-camp/my-hot-lunchbox)
- H1: My Hot Lunchbox
- SEO title: Order Delicious Lunches Easily with My Hot Lunchbox \| Maplewood
- SEO description: Sign up for My Hot Lunchbox to access daily menus, place orders, and manage meal plans effortlessly. Enjoy convenient lunch delivery for your campers!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc5d5c5d8c15e38f1bb_sc-mhb.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | My Hot Lunchbox | No list wrapper observed |
| 2 | numbered instruction steps; `section_layout486`; #how-it-works | Sign up / Browse the menus / Place your order by 12 pm (noon) the previous day / (Optional) Schedule Repeated Meals | No list wrapper observed |
| 3 | call to action; `section_cta39`; #video-tutorials | Detailed Video Tutorials | No list wrapper observed |
| 4 | split image and text; `section_layout10`; #download-apps | Download Apps / iPhone App / Android App | No list wrapper observed |
| 5 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 2. See this page's evidence record for the exact labels and sections.

### /summer-camp/bus-transportation

- Public page: [/summer-camp/bus-transportation](https://www.maplewoodyearround.com/summer-camp/bus-transportation)
- H1: Free Bus Transportation
- SEO title: Safe and Independent Transportation for Kids at Maplewood
- SEO description: Discover how Maplewood's trained bus staff ensures a secure and enjoyable ride for your child, fostering independence and comfort from the start.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc70141315a66adbcb1_sc-bus.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Free Bus Transportation | No list wrapper observed |
| 2 | split image and text; `section_layout10`; #safety | Safety / Safety First / Personal Approach | No list wrapper observed |
| 3 | split image and text; `section_layout203`; #how-it-works | How it works / Teaching children to be safe / Staff know the children | No list wrapper observed |
| 4 | gallery or embedded content; `section_gallery1`; #bus-map | Bus Stop Map | No list wrapper observed |
| 5 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: https://snazzymaps.com/embed/661063

Scripts beyond the shared set: inline SHA-256 36250552e600c8b1c4bd2a5239a0e4ea97c568dfb95bb439288a1c8ac103dd5e.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /our-values

- Public page: [/our-values](https://www.maplewoodyearround.com/our-values)
- H1: Our Values
- SEO title: Maplewood Day Camp: Fun, Friendship, and Growth \| South Easton, MA
- SEO description: Discover Maplewood Camp, where children thrive in a nurturing environment filled with fun, teamwork, and cherished traditions. Join us for lifelong memories!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc98f570e3e9865a74c_values.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Our Values | No list wrapper observed |
| 2 | split image and text; `section_layout10` | Community / Family Spirit / Shared Joy | No list wrapper observed |
| 3 | split image and text; `section_layout203` | Fun & Discovery / Fun is important / Nurture exploration | No list wrapper observed |
| 4 | split image and text; `section_layout10` | Teamwork / Skills for cooperation / Work together | No list wrapper observed |
| 5 | split image and text; `section_layout203` | Honoring Tradition through Innovation / Cherished Traditions / New Opportunities | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /leadership

- Public page: [/leadership](https://www.maplewoodyearround.com/leadership)
- H1: Leadership
- SEO title: Meet the Leadership Team at Maplewood Day Camp
- SEO description: Get to know the dedicated leadership team behind Maplewood Day Camp, ensuring a fun, safe, and enriching experience for all campers.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc7b392f6f770f2b793_leadership.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Leadership | No list wrapper observed |
| 2 | staff grid; `section_team14` | Lee PinsteenOwner/Directorleepinstein@maplewoodyearround.comLee grew up at Maplewood, starting as a camper in the Poodles group, and eventually taking on various roles such as Head | No list wrapper observed |
| 3 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /school-year/programs/enrichment-classes

- Public page: [/school-year/programs/enrichment-classes](https://www.maplewoodyearround.com/school-year/programs/enrichment-classes)
- H1: Enrichment Classes
- SEO title: Children's Enrichment Classes in South Easton, MA
- SEO description: Enroll your child in fun enrichment classes in South Easton, MA. Explore gymnastics, arts, and sports tailored for ages 2-5.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc83e2febfd7af257f6_enrichment-classes.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Enrichment Classes | No list wrapper observed |
| 2 | program card grid; `section_layout311`; #classes-list | 2026-2027 Enrichment Classes / Flying Solo / Gymnastics Class / Arts Class / Sports Class | No list wrapper observed |
| 3 | FAQ accordion; `section_faq3`; #faq | Enrollment Policies & Payment Information | `w-dyn-list`: 6 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /school-year/programs/enrichment-classes/gymnastics-class

- Public page: [/school-year/programs/enrichment-classes/gymnastics-class](https://www.maplewoodyearround.com/school-year/programs/enrichment-classes/gymnastics-class)
- H1: Gymnastics Enrichment Program
- SEO title: Fun Gymnastics Classes for Kids in South Easton, MA
- SEO description: Enroll your kids in fun gymnastics classes in South Easton, MA. They will master essential skills while building confidence and teamwork!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc53f5b5db10eaca071_270743651a286557638018d4c0eb1c17_gymnastics-class.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Gymnastics Enrichment Program | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | Master the Basics / Stay Engaged / Enhance Core Skills / Enhance Core Skills | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #activities | Class Activities / Rings / Bars / Balance Beams / Tumbling | `swiper is-blog66-slider w-dyn-list`: 4 rendered items; collection unknown |
| 4 | pricing cards; `section_pricing19`; #sessions-and-pricing | 2026-2027 Gymnastics Classes Sessions & Pricing | No list wrapper observed |
| 5 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 6 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /school-year/programs/enrichment-classes/sports-enrichment-class

- Public page: [/school-year/programs/enrichment-classes/sports-enrichment-class](https://www.maplewoodyearround.com/school-year/programs/enrichment-classes/sports-enrichment-class)
- H1: Sports Enrichment Class
- SEO title: Engaging Sports Program for Kids \| Maplewood Day Camp in Easton MA
- SEO description: Encourage your child to explore sports like basketball and soccer while building teamwork, confidence, and fitness in a fun environment.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc761ae6160025416a9_25be904534d270e72fcadefdc7364e6d_sports-class.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Sports Enrichment Class | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | Try It All / Stay Active / Build Teamwork / Boost Confidence | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #activities | Class Activities / Basketball / Soccer / T-Ball / Hockey | `swiper is-blog66-slider w-dyn-list`: 4 rendered items; collection unknown |
| 4 | pricing cards; `section_pricing19`; #sessions-and-pricing | 2026-2027 Sports Classes Sessions & Pricing | No list wrapper observed |
| 5 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 5 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 3. See this page's evidence record for the exact labels and sections.

### /school-year/programs/enrichment-classes/arts-class

- Public page: [/school-year/programs/enrichment-classes/arts-class](https://www.maplewoodyearround.com/school-year/programs/enrichment-classes/arts-class)
- H1: Art Enrichment Class
- SEO title: Ignite Creativity with Maplewood Art Classes for kids South Easton MA
- SEO description: Spark creativity with Maplewood’s arts & crafts classes! Fun, hands-on activities for kids in South Easton, MA.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc8f6e758afcd659e5d_0617f569ce43a409ead0e470f2bad46f_art-class.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Art Enrichment Class | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | Ignite Creativity / Explore New Materials / Build Life Skills / Celebrate Fun | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #activities | Sample Daily Schedule / Arts & Crafts / Painting / Drawing / Making Collages / Working with clay / Ceramics | `swiper is-blog66-slider w-dyn-list`: 6 rendered items; collection unknown |
| 4 | pricing cards; `section_pricing19`; #sessions-and-pricing | 2026-2027 Art Classes Sessions & Pricing | No list wrapper observed |
| 5 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 5 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js.

Empty/hash links: 0.

### /summer-camp/activities

- Public page: [/summer-camp/activities](https://www.maplewoodyearround.com/summer-camp/activities)
- H1: Exciting Activities
- SEO title: Over 50 Activities \| Maplewood Summer Camp in South Easton, MA
- SEO description: Easily filter and discover engaging activities for your child based on age, bunk, or type. Start exploring fun options today!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fcb677a9b653e58c432_summer-camp-activities.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Exciting Activities | No list wrapper observed |
| 2 | filterable card grid; `section_filters5`; #top | FiltersUse the filter options below to find the relevant activities for your child based on age, bunk or activity type.View allCategory oneCategory twoCategory threeCategory fourSo | `product1_list-wrapper w-dyn-list`: 47 rendered items; collection unknown |
| 3 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter; `wf-form-Filter-5` (checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, checkbox, text, text).

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js; https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js.

Empty/hash links: 16. See this page's evidence record for the exact labels and sections.

### /contact

- Public page: [/contact](https://www.maplewoodyearround.com/contact)
- H1: Contact & Enrollment
- SEO title: Contact Maplewood Day Camp and Enrichment Center in South Easton, MA
- SEO description: Reach out to Maplewood Day Camp in South Easton, MA for inquiries. Email us at info@maplewoodcamp.com or call (508) 238-2387.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc51649bba38c335b3a_contact.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Contact & Enrollment | No list wrapper observed |
| 2 | contact details; `section_contact21`; #contact-info | Email us / Call / Fax Front Desk / Drop by | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #summer-camp-registration | Summer 2027 Registration / New Campers / Returning Campers | No list wrapper observed |
| 4 | card slider; `section_blog66 background-color-white`; #school-year-registration | School Year Registration / Indoor / Outdoor Play Center / Birthday Parties / Preschool Program / Vacation Program | No list wrapper observed |
| 5 | bus map and benefits; `section_transportation_contact14` | Free Bus Transportation / Free bus service / Qualified Staff / Peace of mind | No list wrapper observed |

Forms: shared newsletter only.

Embeds: https://snazzymaps.com/embed/661063

Scripts beyond the shared set: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3%2F64afbe17c265cba5e4bf2e76%2F67b1e26dc354cbec326cd1af%2Ffluidseo_schema-0.0.2.js.

Empty/hash links: 0.

### /staff

- Public page: [/staff](https://www.maplewoodyearround.com/staff)
- H1: Maplewood Staff
- SEO title: Join the Maplewood Day Camp Family in 2025
- SEO description: Experience an unforgettable summer at Maplewood Day Camp, where friendship, fun, and personal growth come together in a family-focused environment.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc76ff59171009f0570_maplewood-staff.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Maplewood Staff | No list wrapper observed |
| 2 | split image and text; `section_layout30` | Who says Campers have all the fun? | No list wrapper observed |
| 3 | FAQ accordion; `section_faq3 background-color-white`; #faq | Staff FAQs | `w-dyn-list`: 5 rendered items; collection unknown |
| 4 | split image and text; `section_layout30 background-blue` | Friendship / Family Environment / Friends for life | No list wrapper observed |
| 5 | split image and text; `section_layout30` | Passion / Family Environment / Friends for life | No list wrapper observed |
| 6 | split image and text; `section_layout30` | Fun / Fun for all Ages / Unforgettable | No list wrapper observed |
| 7 | split image and text; `section_layout30` | Career & Leadership Development / If you're a teacher / If you're a student | No list wrapper observed |
| 8 | staff grid; `section_team14` | Lee PinsteenOwner/Directorleepinstein@maplewoodyearround.comLee grew up at Maplewood, starting as a camper in the Poodles group, and eventually taking on various roles such as Head | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: inline SHA-256 1e8b34fd218a0c7d633baee0903b79d9a0eeff0a90aefb1738dad212c8db321b.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /staff-opportunities

- Public page: [/staff-opportunities](https://www.maplewoodyearround.com/staff-opportunities)
- H1: Staff Opportunities
- SEO title: Join Maplewood: Summer Camp Job Opportunities
- SEO description: Become part of the Maplewood family this summer! Join us in making a difference in children's lives while gaining valuable experience.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc541231a0ccdb4dcc4_staff-opportunities.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Staff Opportunities | No list wrapper observed |
| 2 | job list; `section_career12` | Current Openings | `career12_list-wrapper w-dyn-list`: 10 rendered items; collection unknown |
| 3 | split image and text; `section_layout30 background-blue` | Leadership | No list wrapper observed |
| 4 | split image and text; `section_layout30 background-blue` | Staff Roster | No list wrapper observed |
| 5 | split image and text; `section_layout30` | Who says Campers have all the fun? | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: inline SHA-256 1e8b34fd218a0c7d633baee0903b79d9a0eeff0a90aefb1738dad212c8db321b.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /faqs

- Public page: [/faqs](https://www.maplewoodyearround.com/faqs)
- H1: FAQs
- SEO title: Frequent questions answered \| Maplewood Day Camp in South Easton, MA
- SEO description: Explore our FAQs to find answers about Maplewood Day Camp in South Easton, MA. Contact us for more information!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc66962a6620a8bb956_faqs.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | FAQs | No list wrapper observed |
| 2 | FAQ accordion; `section_faq3`; #summer-camp | Summer Camp FAQS | `w-dyn-list`: 31 rendered items; collection unknown |
| 3 | FAQ accordion; `section_faq3`; #school-year | School Year FAQs | `w-dyn-list`: 22 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /parent-dashboard

- Public page: [/parent-dashboard](https://www.maplewoodyearround.com/parent-dashboard)
- H1: Absent
- SEO title: Parent Dashboard \| Maplewood
- SEO description: Access essential resources for Maplewood campers, including important dates, forms, and lunch orders. Stay informed and organized for a great camp experience!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc343b221bbef36078c_parent-dashboard.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | dashboard tabs and cards; `section_layout398` | Parent Dashboard / Play Center Waiver / Enroll for Enrichment Classes / Preschool forms / Vacation Camp Packing List & Forms / Play Center Registration / Gift Card / Maplewood Gear / Play Center Schedule / Play Center Schedule by Guest / Play Center Schedule by Character / LOST and FOUND | `wall-of-love_wrap w-dyn-list`: 10 rendered items; collection unknown<br>`wall-of-love_wrap w-dyn-list`: 13 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: inline SHA-256 562fba661c15ca7969c0a560f277d8be193d5d70e8ccb94f7dbef96cb07fe844.

Empty/hash links: 3. See this page's evidence record for the exact labels and sections.

### /history

- Public page: [/history](https://www.maplewoodyearround.com/history)
- H1: Maplewood History
- SEO title: The Maplewood Story: A Legacy of Summer Camp Joy
- SEO description: Discover the inspiring journey of Hal and Sandy, who created Maplewood Country Day Camp over 60 years ago, fostering joy, community, and lifelong friendships.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fca8e7ff1e5c4de0b98_history.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Maplewood History | No list wrapper observed |
| 2 | timeline; `section_timeline11`; #founding | A Legacy of Joy / 1956 / Hal met Sandy / 1958 / Marriage & New Horizons / 1961 / Sandy discovers Maplewood Shores / 1965 / First Maplewood Summer Camp Session | No list wrapper observed |
| 3 | split image and text; `section_layout10`; #today | Maplewood Country Day Camp & Enrichment Center / Our Vision / Founding Values | No list wrapper observed |
| 4 | statistics; `section_stats14`; #future | learned to swim at Maplewood / of camping history / Hal's dream lives on | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /summer-camp/programs

- Public page: [/summer-camp/programs](https://www.maplewoodyearround.com/summer-camp/programs)
- H1: Absent
- SEO title: Summer Camp Programs \| Maplewood Day Camp
- SEO description: At Maplewood Country Day Camp parents will find programs for all ages. Whether you have a 3-year-old or a 14-year-old, you'll feel that everyone is included and supported.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fca6637f8acb46462a5_sc-programs.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | program card grid; `section_summer-camp_programs`; #programs | Summer Camp Programs / Preschool & Kindergarten / K-7th Grade Program / Teen Leadership (C.I.T.) | No list wrapper observed |
| 2 | program card grid; `section_summer-camp_additional-programs`; #additional-programs | Additional Programs / Academic Program / The 9th Week / Social Emotional Support Program | No list wrapper observed |
| 3 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://code.jquery.com/jquery-3.6.0.min.js; inline SHA-256 6760eda1a64d4fdf622986f66b1bee6397a2d252eb0b705b1adc30b9e9717e53.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /news

- Public page: [/news](https://www.maplewoodyearround.com/news)
- H1: Maplewood Blog
- SEO title: Latest news from Maplewood Day Camp and Enrichment Center
- SEO description: Read up on the latest news and announcements from Maplewood Day Camp and Enrichment Center.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc5bcf2f2cff9d3ffc9_news.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | featured news and card grid; `section_blog7`; #blog-header-7 | Maplewood Blog / Costumes, Treats & Play: Halloween Week at Maplewood / Birthday Parties / Indoor/Outdoor Play Center / Enrichment Classes / Monthly Memberships / Great Gift Ideas | `blog7_featured-list-wrapper w-dyn-list`: 1 rendered items; collection unknown<br>`blog7_list-wrapper w-dyn-list`: 5 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 6. See this page's evidence record for the exact labels and sections.

### /summer-camp/summer-group-schedules

- Public page: [/summer-camp/summer-group-schedules](https://www.maplewoodyearround.com/summer-camp/summer-group-schedules)
- H1: Summer Camp Group Schedules
- SEO title: Summer Group Schedules \| Maplewood
- SEO description: Download PDF with the full activity schedule for your camper's group.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc92e0540a23c4134d23ba_sc-schedules.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50c_wrap text-color-alternate` | Summer Camp Group Schedules | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | This is a list of schedules for every Summer Camp Group:Preschool:•Chipmunks•Muppets•Peanut-Rascal 5 DayKindergarten:•Chipmunks•Munchkins•Muppets•Poodles1st Grade:•Aquanauts•Bunnie | `w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 2 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 1 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /maplewood-main-calendar

- Public page: [/maplewood-main-calendar](https://www.maplewoodyearround.com/maplewood-main-calendar)
- H1: Absent
- SEO title: Maplewood Main Calendar
- SEO description: Access essential resources for Maplewood campers, including important dates, forms, and lunch orders. Stay informed and organized for a great camp experience!
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | gallery or embedded content; `section_gallery1`; #bus-map | Maplewood Full Calendar | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://dist.eventscalendar.co/embed.js; inline SHA-256 562fba661c15ca7969c0a560f277d8be193d5d70e8ccb94f7dbef96cb07fe844.

Empty/hash links: 0.

### /summer-camp/facilities

- Public page: [/summer-camp/facilities](https://www.maplewoodyearround.com/summer-camp/facilities)
- H1: Our Camp Facilities
- SEO title: Summer Camp Facilities \| Maplewood Summer Day Camp in Easton, MA
- SEO description: Our facilities are designed with safety and engagement in mind, providing a nurturing environment for children to thrive.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc8766dab20bf56e97b_sc-facilities.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Our Camp Facilities | No list wrapper observed |
| 2 | card slider; `section_blog66 background-color-white`; #sample-schedule | Lake & Swimming Pools / Boating Dock / Bumper Boat Dock / Fishing Area / Junior Pool / Lake / Senior Pool / Splash Slide | `swiper is-blog66-slider w-dyn-list`: 7 rendered items; collection unknown |
| 3 | card slider; `section_blog66 background-color-white`; #sample-schedule | Sports & Athletic Facilities / Archery Range / Athletic Fields / Basketball Court / Beach Volleyball Courts / Capture the Flag Field / Disc Golf Course / Ga-Ga Ball Court / Gymnastics Studio / Pillo Polo Court / Soccer Field / Street Hockey Court | `swiper is-blog66-slider w-dyn-list`: 11 rendered items; collection unknown |
| 4 | card slider; `section_blog66 background-color-white`; #sample-schedule | Arts & Crafts Facilities / Art Studios / Dance Studio / Drama Studio / Music Studio | `swiper is-blog66-slider w-dyn-list`: 4 rendered items; collection unknown |
| 5 | card slider; `section_blog66 background-color-white`; #sample-schedule | Fun & Adventure Facilities / Barnyard / Indoor Climbing Wall & Rope Course / Laser Tag / Maplewood Play Village / Mini Golf Course / Pedal Kart Track / Playgrounds | `swiper is-blog66-slider w-dyn-list`: 7 rendered items; collection unknown |
| 6 | card slider; `section_blog66 background-color-white`; #sample-schedule | Safety & Amenities / AC Shack / Nurse's Office / Shaded Lunch Pavilion | `swiper is-blog66-slider w-dyn-list`: 3 rendered items; collection unknown |
| 7 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 6. See this page's evidence record for the exact labels and sections.

### /summer-camp/programs/preschool-and-kindergarten

- Public page: [/summer-camp/programs/preschool-and-kindergarten](https://www.maplewoodyearround.com/summer-camp/programs/preschool-and-kindergarten)
- H1: Preschool & Kindergarten
- SEO title: Preschool & Kindergarten Program \| Maplewood Summer Camp
- SEO description: Discover a summer camp with a low camper-to-counselor ratio, varied activities, and top-notch facilities to ensure your child's fun and safety.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc9638f7a4e785f92d5_sc-preschool-kindergarten-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Preschool & Kindergarten | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | 4:1 Ratio / Varied Schedule / Stay Connected / Top Facilities | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #sample-schedule | Sample Daily Schedule / Roundup / Soccer / Snack Time / Basketball / Barnyard / Lunch / Boating / Gymnastics / Swimming Lessons (daily) / Free Swim / Change | `swiper is-blog66-slider w-dyn-list`: 12 rendered items; collection unknown |
| 4 | card slider; `section_blog66 background-color-white` | Special Events / Train Rides / Carnival / Tie-Dye Day / Scavenger Hunt / Gold Rush / Penny Dive | `swiper is-blog66-slider w-dyn-list`: 6 rendered items; collection unknown |
| 5 | rate or session table; `section_comparison8 background-color-white`; #preschoolers-sessions | 2026 Summer Camp Dates & Rates | No list wrapper observed |
| 6 | pricing cards; `section_pricing19`; #pricing | Extended Hours | No list wrapper observed |
| 7 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 5 rendered items; collection unknown |
| 8 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /summer-camp/programs/1st-7th-grade

- Public page: [/summer-camp/programs/1st-7th-grade](https://www.maplewoodyearround.com/summer-camp/programs/1st-7th-grade)
- H1: 1st-7th Grade
- SEO title: 1st-7th Grade Program \| Maplewood Summer Camp
- SEO description: Discover a summer camp with a low camper-to-counselor ratio, custom schedules, and top-notch facilities. Your child will thrive in a supportive environment!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc77aef6deb9535d8e3_sc-1-7-grades-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | 1st-7th Grade | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | 3:1 Ratio / Custom Schedule / Stay Connected / Top Facilities | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #sample-schedule | Sample Daily Schedule / Roundup / GaGa Ball / Swimming Lessons (daily) / Change / Drama / Martial Arts / Lunch / Boating / Rock'N'Ropes - Climb Adventure / Club Day / Free Swim | `swiper is-blog66-slider w-dyn-list`: 12 rendered items; collection unknown |
| 4 | elective cards; `section_summer-camp_club-day-electives u-theme-dark`; #club-day-electives | Club Day - Electives | No list wrapper observed |
| 5 | card slider; `section_blog66 background-color-white` | Special Events / Carnival / Tie-Dye Day / Scavenger Hunt / Gold Rush / Penny Dive | `swiper is-blog66-slider w-dyn-list`: 5 rendered items; collection unknown |
| 6 | rate or session table; `section_k-9-sessions-table_comparison6`; #k-9th-sessions | 2025 Summer Camp Dates & Rates | No list wrapper observed |
| 7 | pricing cards; `section_pricing19`; #pricing | Extended Hours | No list wrapper observed |
| 8 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 3 rendered items; collection unknown |
| 9 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 1. See this page's evidence record for the exact labels and sections.

### /summer-camp/programs/teen-leadership-cit

- Public page: [/summer-camp/programs/teen-leadership-cit](https://www.maplewoodyearround.com/summer-camp/programs/teen-leadership-cit)
- H1: 8th & 9th Grades - C.I.T.
- SEO title: Teen Leadership (C.I.T.) Program \| Maplewood Summer Camp
- SEO description: Discover a summer camp that fosters learning, adventure, and friendships. Our caring staff and flexible Club Day schedule ensure a personalized experience.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fcc5bfb88cd7e91242e_sc-cit-program.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | 8th & 9th Grades - C.I.T. | No list wrapper observed |
| 2 | split image and text; `section_layout30`; #overview | Caring Staff / Custom Schedule / Stay Connected / Adventure Programs | No list wrapper observed |
| 3 | card slider; `section_blog66 background-color-white`; #sample-schedule | Sample Daily Schedule / Roundup / Counselor in Training with Camp Groups / Lunch / Archery / Swimming Lessons (daily) / Club Day / Rock'N'Ropes - Climb Adventure / Ice Cream Dismissal | `swiper is-blog66-slider w-dyn-list`: 8 rendered items; collection unknown |
| 4 | elective cards; `section_summer-camp_club-day-electives u-theme-dark`; #club-day-electives | Club Day - Electives | No list wrapper observed |
| 5 | card slider; `section_blog66 background-color-white` | Special Events / Carnival / Tie-Dye Day / Scavenger Hunt / Gold Rush / Penny Dive | `swiper is-blog66-slider w-dyn-list`: 5 rendered items; collection unknown |
| 6 | rate or session table; `section_k-9-sessions-table_comparison6`; #k-9th-sessions | 2025 Summer Camp Dates & Rates | No list wrapper observed |
| 7 | pricing cards; `section_pricing19`; #pricing | Extended Hours | No list wrapper observed |
| 8 | FAQ accordion; `section_faq3 background-color-white`; #faq | FAQs | `w-dyn-list`: 2 rendered items; collection unknown |
| 9 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 2. See this page's evidence record for the exact labels and sections.

### /summer-camp/swim-instruction

- Public page: [/summer-camp/swim-instruction](https://www.maplewoodyearround.com/summer-camp/swim-instruction)
- H1: Learn to Swim
- SEO title: Swim Instruction \| Maplewood Summer Camp
- SEO description: Discover Maplewood Camp, where children thrive in a nurturing environment filled with fun, teamwork, and cherished traditions. Join us for lifelong memories!
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc65eb00f95cf19743f_sc-learn-to-swim.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Learn to Swim | No list wrapper observed |
| 2 | split image and text; `section_layout10` | 60+ years / 30,000+ happy swimmers / A family tradition | No list wrapper observed |
| 3 | split image and text; `section_layout203` | Top Staff / Beyond Experienced / Certified Staff | No list wrapper observed |
| 4 | split image and text; `section_layout10` | Daily Swim Lessons / Beginner Friendly / Advanced Instruction | No list wrapper observed |
| 5 | split image and text; `section_layout203` | Olympic, Heated Pools / Shallow & Deep Areas / Diving & Sliding | No list wrapper observed |
| 6 | split image and text; `section_layout30 background-blue` | Drop by and see all that we have to offer | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /summer-camp/schedule-a-tour

- Public page: [/summer-camp/schedule-a-tour](https://www.maplewoodyearround.com/summer-camp/schedule-a-tour)
- H1: Camp Tours
- SEO title: Schedule a Summer Camp Tour \| Maplewood
- SEO description: Jus let us know you'd like a tour and we'll take care of the rest. During Summer Camp tours are given Monday-Friday, between 10 am and 2 pm and last approximately 45 minutes to 1 hour.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc729dcb5bd5d16ca45_sc-tours.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Camp Tours | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | During Summer Camp tours are given Monday-Friday, between 10 am and 2 pm. September through June, tours are given between the hours of 10:00 am and 5:00 pm. Tours normally last app | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://www.cognitoforms.com/f/seamless.js; inline SHA-256 677a65adee84d1731330d058ebea987d7302b2d3b456da7ede78fe499a571522.

Empty/hash links: 0.

### /school-year/schedule-a-tour

- Public page: [/school-year/schedule-a-tour](https://www.maplewoodyearround.com/school-year/schedule-a-tour)
- H1: Facility Tours
- SEO title: Schedule a School Year Tour \| Maplewood
- SEO description: Jus let us know you'd like a tour and we'll take care of the rest.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc679fc83d888877e91_sy-tour.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Facility Tours | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | School Year tours are given before (7:30-8:30am) or after the school day (after 1:30pm), Monday-Friday. Tours normally last approximately 30 to 45 minutes. Tours will be conducted | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: https://www.cognitoforms.com/f/seamless.js; inline SHA-256 1be61fb949b91ed1d18468756b80c6c28fff146566efe166846f14adf568f9e5.

Empty/hash links: 0.

### /summer-camp/changes-notification-form

- Public page: [/summer-camp/changes-notification-form](https://www.maplewoodyearround.com/summer-camp/changes-notification-form)
- H1: Changes & Notifications Form
- SEO title: Changes / Notification Form
- SEO description: Reach out to Maplewood Day Camp in South Easton, MA for inquiries. Email us at info@maplewoodcamp.com or call (508) 238-2387.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/67bc7fc51649bba38c335b3a_contact.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Changes & Notifications Form | No list wrapper observed |
| 2 | external form embed; `w-embed w-iframe`; #form | No heading | No list wrapper observed |

Forms: shared newsletter only.

Embeds: https://airtable.com/embed/appcP8D6WjdoAKvZB/pag9EHWDr5fxlRoLX/form

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /summer-camp/camper-daily-photos

- Public page: [/summer-camp/camper-daily-photos](https://www.maplewoodyearround.com/summer-camp/camper-daily-photos)
- H1: Camper Daily Photos
- SEO title: Camper Daily Photos
- SEO description: "A picture is worth a thousand words."Using our online services provider, CampMinder, we upload hundreds of pictures each night.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/6842e0138c56400ef3d63029_www.maplewoodyearround.com_summer-camp_camper-daily-photos.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50_wrap text-color-alternate` | Camper Daily Photos | No list wrapper observed |
| 2 | split image and text; `section_layout10` | Campanion - Camper Photo App / Automated & Secure / Face Finder Tech | No list wrapper observed |
| 3 | split image and text; `section_layout203` | Face Finder Technology / Enroll from the app! / Personalized Stream | No list wrapper observed |
| 4 | split image and text; `section_layout10` | Parent Participation / Returning Camp Families | No list wrapper observed |
| 5 | split image and text; `section_layout203` | Get Started Now! | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 2. See this page's evidence record for the exact labels and sections.

### /summer-camp/summer-camp-welcome-letters

- Public page: [/summer-camp/summer-camp-welcome-letters](https://www.maplewoodyearround.com/summer-camp/summer-camp-welcome-letters)
- H1: Summer Camp Welcome Letters
- SEO title: Summer Camp Welcome Letters
- SEO description: Download PDF with the Parent Welcome Letter for your camper's group.
- OG image: https://cdn.prod.website-files.com/673ebf0eedfc15a41bedc0c3/685b57094d6cc91426753dfd_summer-camp-welcome-letters.webp

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50c_wrap text-color-alternate` | Summer Camp Welcome Letters | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | These are the respective Parent Welcome Letters for every Summer Camp Group:Preschool:•Chipmunks•Muppets•Peanut-Rascal 5 DayKindergarten:•Chipmunks•Munchkins•Muppets•Poodles1st Gra | `w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 4 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 2 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 3 rendered items; collection unknown<br>`w-dyn-list`: 1 rendered items; collection unknown |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/early-bird-enrollment

- Public page: [/post/early-bird-enrollment](https://www.maplewoodyearround.com/post/early-bird-enrollment)
- H1: Early Bird Enrollment
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Early Bird Enrollment | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | Excited to kick off Summer 2027 with our Early Bird EnrollmentSharon MaynardMarketing Coordinator, Maplewood | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/enrichment-classes

- Public page: [/post/enrichment-classes](https://www.maplewoodyearround.com/post/enrichment-classes)
- H1: Enrichment Classes
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Enrichment Classes | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | Enroll Now in Our Exciting Enrichment Classes!​Don't miss out on our specialized programs, ranging from gymnastics to preschool readiness, provide young children with opportunities | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/great-gift-ideas

- Public page: [/post/great-gift-ideas](https://www.maplewoodyearround.com/post/great-gift-ideas)
- H1: Great Gift Ideas
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Great Gift Ideas | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | This year give the gift of giggles to that special child in your life. At Maplewood, we have unique and thoughtful gift ideas to delight your little ones and support their growth a | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/meet-you-at-the-playground-copy

- Public page: [/post/meet-you-at-the-playground-copy](https://www.maplewoodyearround.com/post/meet-you-at-the-playground-copy)
- H1: Indoor/Outdoor Play Center
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Indoor/Outdoor Play Center | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | Where Big Outdoor Adventures Meet Indoor Imagination.Closed for the summer season — reopening September 8th with fresh energy and new adventuresSharon MaynardMarketing Coordinator, | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/new-monthly-memberships

- Public page: [/post/new-monthly-memberships](https://www.maplewoodyearround.com/post/new-monthly-memberships)
- H1: Monthly Memberships
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Monthly Memberships | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | Become a member — Join today!1 child $1102 children $1903 children $250Sharon MaynardMarketing Coordinator, Maplewood | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /post/we-know-how-to-throw-a-party

- Public page: [/post/we-know-how-to-throw-a-party](https://www.maplewoodyearround.com/post/we-know-how-to-throw-a-party)
- H1: Birthday Parties
- SEO title: MDC 3.0
- SEO description: Absent
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | article title and metadata; `section_blog-post-header3` | Birthday Parties | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content29` | We know how to throw a Party!Sharon MaynardMarketing Coordinator, Maplewood | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /privacy-policy

- Public page: [/privacy-policy](https://www.maplewoodyearround.com/privacy-policy)
- H1: Privacy Policy
- SEO title: Maplewood Year Round Privacy Policy
- SEO description: Understand how MaplewoodYearRound.com collects and uses your personal information. Read our comprehensive privacy policy for your data protection.
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50c_wrap text-color-alternate` | Privacy Policy | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | Definitions and key terms / What Information Do We Collect? / When does MaplewoodYearRound.com use end user information from third parties? / When does MaplewoodYearRound.com use customer information from third parties? / Do we share the information we collect with third parties? / Where and when is information collected from customers and end users? / How Do We Use The Information We Collect? / How Do We Use Your Email Address? / How Long Do We Keep Your Information? / How Do We Protect Your Information? / Could my information be transferred to other countries? / Is the information collected through the MaplewoodYearRound.com Service secure? | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /terms-and-conditions

- Public page: [/terms-and-conditions](https://www.maplewoodyearround.com/terms-and-conditions)
- H1: Terms & Conditions / General Terms
- SEO title: Maplewood Year Round Terms & Conditions
- SEO description: Review the comprehensive Terms & Conditions for MaplewoodYearRound.com. Understand your rights and responsibilities while using our services.
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50c_wrap text-color-alternate` | Terms & Conditions | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | General Terms / License / Definitions and key terms / Restrictions / Payment / Return and Refund Policy / Your Suggestions / Your Consent / Links to Other Websites / Cookies / Changes To Our Terms & Conditions / Modifications to Our website | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.

### /cookie-policy

- Public page: [/cookie-policy](https://www.maplewoodyearround.com/cookie-policy)
- H1: Cookies Policy
- SEO title: Maplewood Year Round Cookie Policy Overview
- SEO description: Discover how MaplewoodYearRound.com uses cookies to enhance your experience, improve functionality, and personalize marketing. Learn about your options.
- OG image: Absent

| Order | Pattern and source selector | Heading or content | Published CMS list evidence |
| --- | --- | --- | --- |
| 1 | image hero; `header50c_wrap text-color-alternate` | Cookies Policy | No list wrapper observed |
| 2 | rich text, embed or document list; `section_content30` | Definitions and key terms / Introduction / What is a cookie? / Why do we use cookies? / What type of cookies does MaplewoodYearRound.com use? / Essential Cookies / Performance and Functionality Cookies / Marketing Cookies / Analytics and Customization Cookies / Advertising Cookies / Social Media Cookies / Third Party Cookies | No list wrapper observed |

Forms: shared newsletter only.

Embeds: No iframe in source HTML. Script embeds, where present, are listed below.

Scripts beyond the shared set: None.

Empty/hash links: 0.
