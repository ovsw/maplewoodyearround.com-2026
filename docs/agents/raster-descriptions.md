# Raster AI descriptions for Sanity pictures

Raster (raster.app) writes an AI description for every image uploaded to it.
Sanity does not. The Studio Media tab search only matches text stored on the
asset, so a picture with no description is hard to find. This workflow copies
the Raster description onto the matching Sanity image asset.

Sanity is the system of record. Raster is only the description source.
Nothing links the two after the sync. The match is by file name.

## One-time setup

`studio/.env.local` needs, next to the Sanity variables:

```
RASTER_API_KEY=<key from raster.app, Settings > API keys>
RASTER_ORG_ID=<the Raster organization ID>
```

Do not use the `SANITY_STUDIO_` prefix for these names. Sanity puts every
variable with that prefix into the public Studio bundle. Keep the values out
of issues, PRs and docs. The key is scoped per Raster library. If the script
reports `API_KEY_NOT_AUTHORIZED_FOR_LIBRARY`, grant the key access to that
library in Raster.

## Adding new pictures

1. Upload the pictures to the Sanity media library as usual, in the Studio
   Media tab or from an image field. Keep the original file names.
2. Upload the same files to the Maplewood Raster library. The sync skips
   pictures that already have a description.
3. Wait until Raster shows a description on each picture. This takes seconds
   to a minute.
4. Dry-run the sync from the repo root:

   ```
   pnpm raster:sync
   ```

   With no `--library`, it uses the library that received the most recent
   upload. Pass `--library <id>` to pick one. The first line names the
   library. It prints what it would patch and what it could not match.
   Nothing is written.

5. Before the first write of the task, make the raw backup that `AGENTS.md`
   asks for. Then apply:

   ```
   pnpm raster:sync --apply
   ```

6. Check in Studio: open the Media tab, search a word from one of the new
   descriptions, and confirm the picture appears.

## How matching works

Raster strips the file extension when a file is uploaded and keeps the rest
of the name, dots included. The script compares the Sanity `originalFilename`
without its extension against the Raster name as it is, case-insensitively.
So `…_2025-01-23-13.16.43.jpeg` in Sanity matches `…_2025-01-23-13.16.43` in
Raster. Two consequences:

- Rename nothing between the two uploads.
- Two files with the same name and different extensions collide. The script
  patches a name only when it is unambiguous on both sides: one Raster
  description and one Sanity asset. It skips and reports the rest, so a
  description never lands on an unrelated picture.

The script only fills empty descriptions. Pass `--overwrite` to replace
existing ones, for example after re-describing a batch in Raster.

## Refusals and safety

- The script refuses every target except the Maplewood project and the
  `production` dataset. See `studio/scripts/assert-mdc-production-target.mjs`.
- It writes one field, `description`, on `sanity.imageAsset` documents. It
  never creates, deletes or re-uploads assets, and never touches tags.
- Patches go in transactions of 50. A failed transaction leaves earlier ones
  applied. A second run is safe: it skips described pictures.

## The 2026-10-09 cleanup (#60)

The Webflow import left about 670 images with many copies of each picture
and no descriptions. The cleanup ran once, in this order:

1. `studio/scripts/add-webflow-library-photos.mjs` added the unused photos
   from the Webflow asset library. It skips logos, icons, favicons, SVGs,
   videos and PDFs, and a photo whose content Sanity already has: Sanity keeps
   one asset per content and renames that asset when the same file is
   uploaded again.
2. The `issue-61-merge-duplicate-pictures` migration merged copies of one
   picture (same name stem and pixel size), keeping the jpeg or png.
3. `studio/scripts/export-pictures.mjs <folder>` downloaded every picture for
   the Raster upload. The Sanity CDN serves pictures re-encoded, avif and webp
   as jpeg or png, so the export names each file with the extension of its
   content. The name without the extension stays the Sanity name.
4. The folder went to one Raster library, and the sync described all 494
   pictures.

The four Webflow video posters (`…-poster-00001.jpg`) are not pictures. The
merge, the export and the Raster upload leave them out, and they have no
description.

## Related

- `studio/scripts/sync-raster-descriptions.mjs` is the sync script.
- Media tags are for hand-made collections. Do not import Raster's AI tags.
- To replace a picture everywhere, use the media plugin's Replace button: tick
  one image card in the Media tab. It re-points all references.
