# Launch checklist

This list is for the domain switch: `www.maplewoodyearround.com` moves from
Webflow to the Vercel project. Ovi does the switch. The checks that came before
it are in "Launch checks" at the end.

DNS is in Cloudflare, in Ovi's account. All records are "DNS only" (grey
cloud). Keep them that way: Vercel issues the certificate itself and must see
the visitors directly. The registrar does not change, so no registrar login is
needed.

## 1. Before the switch

- [ ] The latest `main` commit has a green `Release gate`, and the latest
      Production deployment in Vercel is "Ready".
- [ ] https://maplewoodyearround-com-2026.vercel.app shows the current
      content.
- [ ] Formspark: the newsletter form notifications are on.
- [ ] Cloudflare: the `www` and the bare-domain records have TTL "Auto"
      (5 minutes), so a rollback also takes effect within minutes.

Already done, no action needed:

- Sanity CORS allows `https://www.maplewoodyearround.com`
  (`pnpm --dir studio exec sanity cors list`).
- The website Google Maps key allows `https://www.maplewoodyearround.com/*`
  and `https://maplewoodyearround.com/*`.
- In Production, `NEXT_PUBLIC_SITE_URL` is already
  `https://www.maplewoodyearround.com`, so canonicals, the sitemap and
  structured data already name `www`.

## 2. Vercel domain set-up

In Vercel, team `studio-rovst`, project `maplewoodyearround-com-2026`,
Settings → Domains:

1. Add `www.maplewoodyearround.com`. Connect it to Production (branch `main`).
   No redirect.
2. Add `maplewoodyearround.com`. Choose "Redirect to
   `www.maplewoodyearround.com`", status 308 (permanent).
3. Write down the DNS values that Vercel shows for each domain. Use these
   values in step 3. Vercel can show a project-specific CNAME target (for
   example `<id>.vercel-dns-017.com`) and a new A address; the older values
   `cname.vercel-dns.com` and `76.76.21.21` also work.

You can do steps 1 and 2 before the DNS change. The live site does not change
until the DNS records change.

CLI option for step 1 (the redirect in step 2 is set in the dashboard):

```bash
vercel domains add www.maplewoodyearround.com maplewoodyearround-com-2026 --scope studio-rovst
vercel domains add maplewoodyearround.com maplewoodyearround-com-2026 --scope studio-rovst
```

## 3. DNS records to change

In Cloudflare, zone `maplewoodyearround.com`, change only these two records:

| Name | Type | Now (Webflow) | New (Vercel) | Proxy |
| --- | --- | --- | --- | --- |
| `www` | CNAME | `cdn.webflow.com` | the CNAME value from Vercel | DNS only |
| `@` (bare domain) | A | `198.202.211.1` | the A value from Vercel | DNS only |

Do not change any other record. Email and the other services use them:

- MX (Microsoft 365);
- TXT: SPF, the Microsoft and Apple verification records;
- the DKIM records (Aluvii, Constant Contact) and `_dmarc`.

The SPF record contains `a`, so it allows mail from the bare domain's A
address. After the change that is the Vercel address instead of the Webflow
address. Neither sends mail, so email is not affected.

## 4. Right after the switch

1. In Vercel → Domains, wait until both domains show "Valid Configuration"
   and the certificate is issued (usually a few minutes).
2. Check the website:

   ```bash
   curl -sI https://www.maplewoodyearround.com/ | grep -i -E '^HTTP|x-robots|server'
   curl -sI https://maplewoodyearround.com/ | grep -i -E '^HTTP|location'
   curl -sI https://www.maplewoodyearround.com/post/halloween | grep -i '^HTTP'
   curl -s https://www.maplewoodyearround.com/robots.txt
   ```

   Expected: `www` gives HTTP 200, `server: Vercel` and no `x-robots-tag`
   line. The bare domain gives 308 to `https://www.maplewoodyearround.com/`.
   The post gives 200. `robots.txt` allows indexing and names the sitemap.
   Every other host, also the `vercel.app` URL, keeps `noindex`.
3. Point "content goes live on publish" at the new domain (see "Content goes
   live on publish" in [deployment](../deployment.md)). Without this step,
   publishes stop reaching the live site:

   ```bash
   pnpm --dir studio exec sanity functions env add invalidate-tags REVALIDATE_TAGS_URL https://www.maplewoodyearround.com/api/revalidate-tags
   ```

   Then publish a small test change in Studio, open the page on
   `www`, and check the change is there. Check the log:

   ```bash
   pnpm --dir studio exec sanity functions logs invalidate-tags
   ```

   The log must show that the Website expired the sync tags and that
   `done()` returned HTTP 2xx. Undo the test change and publish again.
   Then change the `REVALIDATE_TAGS_URL` value in
   [deployment](../deployment.md) to the new domain.
4. Open the home page and check that Google Analytics Realtime shows the
   visit.
5. Send one test sign-up through the newsletter form in the footer and
   check that the notification arrives.

## 5. Rollback

Use this if the new site fails and the fault cannot be fixed fast.

1. In Cloudflare, set the two records back (both "DNS only"):
   - `www` CNAME `cdn.webflow.com`;
   - `@` A `198.202.211.1`.
2. Set the function variable back to the Vercel URL:

   ```bash
   pnpm --dir studio exec sanity functions env add invalidate-tags REVALIDATE_TAGS_URL https://maplewoodyearround-com-2026.vercel.app/api/revalidate-tags
   ```

3. Wait 5 minutes and check that `curl -sI https://www.maplewoodyearround.com/`
   no longer shows `server: Vercel`.

A rollback works only while the Webflow site stays published and its plan
is active. Cancel Webflow only when no rollback is needed any more. Edits that
editors made in Studio after the switch are not on the Webflow site.

## Launch checks

Run on 2026-10-14 against https://maplewoodyearround-com-2026.vercel.app
(published content, `main` at `dc20ab9`), for issue #19.

### Final import: not run

Spec decision 10 (Ovi, 2026-10-06): the importer does not run again. The
content in Sanity is the content the editors change and publish.

### Search parity: pass

`node scripts/seo-parity.mjs`: 53 pages, 6 differences. All 6 are the
accepted difference in [deployment](../deployment.md): the live site titles
each news post "MDC 3.0".

### Reference comparison: 52 of 53 pages, with exceptions

`pnpm ref:compare` on every page in the reference manifest, at 1440 px and
390 px.

Fixed in the PR for #19:

- `/school-year` and `/school-year/programs` showed the page title a second
  time, as plain text above the header.
- On phones, pages with a card slider and the cookie and privacy policies
  were wider than the screen, so the page moved sideways. The slider dots now
  wrap (phones show only the arrows, as live), and long web addresses wrap.

Waiting for a publish in Studio (the fixed drafts exist; the public pages
still show the imported text):

- `/school-year/facilities`: the hero text starts with
  "HomeSeasonsSchool YearFacilities", and on phones the old filter text shows
  above the search. The draft has the breadcrumbs, the clean text and the
  search-only list.
- `/news`: the intro starts with "BlogHomeMaplewood Blog" and ends with the
  old category names. The draft of the News page has the clean intro.

Accepted:

- `/post/early-bird-enrollment` is not compared. The post was removed from
  the live site (HTTP 404 there too) and unpublished in Sanity on
  2026-10-12.
- `/school-year/facilities` has search only, no "By Category" and "By Age"
  filters (Ovi, 2026-10-10, PR #79).
- The footer has the newsletter form (Formspark), as the spec asks.
- Content changed in Sanity since the capture on 2026-10-03: copy, dates,
  prices, FAQ lists, images and pricing cards.

Small differences seen in the side-by-side review and not fixed:

- accent colours of some highlighted words and prices (home hero and
  "Testimonials", Arts class and CIT prices, "Before & After Care" heading);
- the "Summer Camp" label above "Free Bus Transportation" on the home page is
  plain text, not a pill;
- `/summer-camp/staff-roster` has a white background, live is cream;
- the pricing heading on `/school-year/programs/birthday-parties` is centred;
- the Play Center hero shows its photo faintly behind the green.

### Accessibility (axe): pass

axe (WCAG 2.1 A and AA, best practices) on all 53 pages at 1440 px and
390 px: no serious or critical issues. 20 program pages have one moderate
"heading-order" note.

### Lighthouse (mobile): below the target

Median of 3 runs. The target in the spec is 85.

| Page | New site | Live Webflow site |
| --- | --- | --- |
| Home `/` | 62 | 56 |
| Inner page `/summer-camp` | 71 | 56 |
| Post `/post/halloween` | 77 | 59 |

The new site is faster than the live site on each page but does not reach 85.
The largest cost is the hero photo or video (Largest Contentful Paint 5 to
10 seconds on a slow phone connection) and about 420 KiB of JavaScript that
the page does not use. Accessibility and best practices score 100. The SEO
score is low only because the Vercel URL sends `noindex`; `www` does not.
