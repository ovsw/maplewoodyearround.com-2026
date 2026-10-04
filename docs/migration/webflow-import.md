# Webflow import

The importer reads Maplewood Webflow site `673ebf0eedfc15a41bedc0c3` and writes
only Sanity project `193h5qm1`, dataset `production`. It never writes to Webflow
or Airtable. Keep `WEBFLOW_API_TOKEN` in the local secrets file and
`SANITY_AUTH_TOKEN` in `studio/.env.local`; neither belongs in Git.

From the repository root:

```sh
node studio/scripts/import-webflow.mjs --dry-run
node studio/scripts/import-webflow.mjs --capture /private/path/source.json
node studio/scripts/import-webflow.mjs --dry-run --snapshot /private/path/source.json
node studio/scripts/import-webflow.mjs --apply --snapshot /private/path/source.json
```

The default is a dry run. It prints aggregate counts and writes no files or
content. Capture reads a complete API and HTML snapshot into a private file
outside the repository. Apply checks the target, takes an asset-inclusive
timestamped dataset backup, and runs `gzip -t` before uploading any asset.

The source contains independent live and staged CMS records. Live versions
become published documents. Staged-only, archived or changed versions become
drafts. A staged archive flag never removes a version that is still live.
Static public pages retain their source section patterns and exact copy.
Unpublished template and system pages are preserved as drafts with editable
text and media; their layouts are not reconstructed or published. Deleted
template-library images that the Webflow API no longer supplies are reported.
The 2026-10-04 capture has four such template image IDs. The importer preserves
their available alternative text. Their original IDs remain in the private
source snapshot; it does not create broken image references or invent images.

The shared settings, navigation and footer are read from public HTML. Existing
editor-owned drafts remain intact. The importer stops on an unexpected target
document rather than replacing it. It changes or removes only IDs recorded in
its private ownership manifest, and checks revisions before changing content.
A complete snapshot is required before a removal or unpublication.

Assets are deduplicated by source URL and known source aliases. Sanity also
deduplicates identical uploaded bytes. The importer reuses existing Webflow
source metadata, including the three shell assets seeded in issue #5.
The unplaced fourth background video is retained as an asset without an
invented page placement.

Private source snapshots, results and the ownership manifest are under
`~/backups/mdc/webflow-import/`. Keep the manifest for the final prelaunch run.
Do not remove an import lock until the process that owns it has stopped. If a
transaction finished but manifest persistence was interrupted, reconcile the
verified transaction with the manifest before retrying; do not claim ownership
of arbitrary existing documents.

After apply, the importer compares every stored document with the plan,
compares live/draft/unique counts per collection, and checks every imported CDN
file with an HTTP request. Run the same snapshot a second time and require
zero created, changed and removed documents and zero newly uploaded assets.
Each apply takes its own verified backup.

Page appearance and interactive behavior are verified by the later page
issues. Source text coverage and schema validation do not establish visual
parity. Keep the known source 404 news route unpublished.
