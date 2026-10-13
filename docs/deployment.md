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

Require the GitHub `Release gate` on `main`.
Merge only after it succeeds on the current PR head.
Do not use an administrator bypass.

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
