# Deployment

Website and Studio are separate applications.
Project setup is authorized by the spec. The domain switch belongs to Ovi.

## Website

Use Vercel team `studio-rovst`, project `maplewoodyearround-com-2026`,
root directory `frontend`, and production branch `main`.
Connect GitHub repository `ovsw/maplewoodyearround.com-2026`.
The production preview is https://maplewoodyearround-com-2026.vercel.app.

Set variables from the root and workspace env examples.
Use `NEXT_PUBLIC_SITE_ENV=production` only in production.
Local and preview deployments must send `noindex`.
Keep secrets in Vercel and ignored local files.

`NEXT_PUBLIC_SITE_URL` is the canonical host. In Production it is
`https://www.maplewoodyearround.com`, also before the domain switch, so
canonicals, the sitemap and structured data already name `www`. Preview and
Development use the Vercel URL. Every other host, including the Vercel URLs
of the production deployment, sends `X-Robots-Tag: noindex`.

## Newsletter

The footer form sends each signup to `/api/newsletter`. The route sends it on
to Formspark only after Cloudflare Turnstile confirms that a person, not a
bot, filled in the form. Most visitors see no check; a visitor whom
Cloudflare finds suspicious gets a checkbox to click.

- `FORMSPARK_FORM_ID`: the form in Maplewood's Formspark account.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (sensitive):
  the Turnstile widget `maplewoodyearround.com` in Ovi's Cloudflare account,
  mode Managed, for the host `maplewoodyearround.com`. Production only.
- Preview and Development use Cloudflare's test keys, which always pass:
  site key `1x00000000000000000000AA`, secret key
  `1x0000000000000000000000000000000AA`. A preview signup still reaches
  Formspark and sends the staff notification.

Without these variables the form answers "Something went wrong" and sends
nothing.

## Search parity

`node scripts/seo-parity.mjs [origin]` compares the live Webflow site with the
new site: every live sitemap URL plus the 3 policy pages (status, title,
description, canonical, Open Graph and Twitter tags, structured data), and
robots.txt, the sitemap, the old-path redirects and the `noindex` header. It
exits with 1 when it finds a difference. The origin defaults to the Vercel
production URL. Old Webflow paths are Redirect records in Studio; add each
new one to `knownRedirects` in the script.

Accepted difference: the live site titles every news post "MDC 3.0", a
Webflow bug. The new site uses each post's SEO title.

Require the GitHub `Release gate` on `main`.
Merge only after it succeeds on the current PR head.
Do not use an administrator bypass.

## Content goes live on publish

The Website keeps the Sanity content of each page in its cache, and each
cached read carries Sanity's sync tags: labels for the content it used.
`<SanityLive />` expires them only while a visitor has a page open, so the
Sanity Function `invalidate-tags` (`studio/functions/invalidate-tags`) does it
on every publish, with no visitor needed. This is next-sanity's "guaranteed
live content updates" setup:

1. After a publish, Sanity calls the function with the sync tags of the
   changed content.
2. The function sends them to `/api/revalidate-tags`, which expires each one.
   Every page that shows the change is fresh on its next visit, and no other
   page is.
3. The function calls `done()`, also when the Website did not answer. Only
   then does Sanity tell open pages about the change
   (`<SanityLive waitFor="function" />` in production), so they never reload
   the old version. Preview deployments and local development keep the
   default behavior.

Settings:

- Blueprint: `studio/sanity.blueprint.ts`, stack `production` in project
  `193h5qm1`.
- Function: `invalidate-tags`, for dataset `193h5qm1.production`.
- Function variable `REVALIDATE_TAGS_URL`:
  `https://www.maplewoodyearround.com/api/revalidate-tags` (since the launch,
  2026-10-20).
- Function variable `SANITY_REVALIDATE_SECRET`: the same value as the
  Website's.
- Website variable `SANITY_REVALIDATE_SECRET`: in Vercel, Production,
  sensitive, and in the ignored `frontend/.env.local`.

The route refuses a call without the secret. Set a function variable with
`pnpm --dir studio exec sanity functions env add invalidate-tags <KEY> <VALUE>`.

Deploy a changed function from the repository root, then check its log after a
publish. The log must show that the Website expired the sync tags and that
`done()` returned HTTP 2xx.

```bash
pnpm --dir studio exec sanity blueprints plan
pnpm --dir studio exec sanity blueprints deploy
pnpm --dir studio exec sanity functions test invalidate-tags --data '{"syncTags":["test"]}' --timeout 20
pnpm --dir studio exec sanity functions logs invalidate-tags
```

A new checkout links to the stack with
`pnpm --dir studio exec sanity blueprints config --edit --project-id 193h5qm1 --stack production`
(the link is in the ignored `studio/.sanity/`). Each publish uses one function
run from the Sanity plan's included usage.

## Studio

The hostname is `maplewood.sanity.studio`.
Use Sanity project `193h5qm1`, dataset `production`, and Studio app ID
`eweifpwe25l4mo1ia1cqub9o`.
Its preview must point to the deployed Maplewood Website.
Use `studio/.env.local` for authentication and local preview settings.
The deploy guard uses production settings for the deployed preview and app ID.
It uses the dedicated `SANITY_DEPLOY_TOKEN`; content operations use
`SANITY_AUTH_TOKEN`. Keep both values private.

The Bus stop and Camp location input uses the Studio Google Maps key
`SANITY_STUDIO_GOOGLE_MAPS_API_KEY` and Map ID
`SANITY_STUDIO_GOOGLE_MAPS_MAP_ID`. They live only in the ignored
`studio/.env.local`, because the deploy builds the Studio from it. The key
allows both `localhost:3333` and `maplewood.sanity.studio`, so the local value
is the deployed value. The deploy guard stops without the key. This key is
separate from the map-only website key.

Run from the repository root:

```bash
pnpm setup:sanity-cors
pnpm deploy:studio
```

The guard must reject a local or non-HTTPS production preview.
Do not bypass it with a direct Studio deploy command.
CORS must include approved local, preview and production origins.

## Release checks

- `pnpm verify` passes.
- The current PR head has a green Release gate.
- The production URL serves the expected site.
- Studio loads and Presentation opens the correct Website.
- Env values and the dataset belong to Maplewood.
- Public output contains no private credentials or personal details.

Issue #19 controls launch readiness.
Ovi owns DNS, client invitations, client messages and cancellation of old services.
