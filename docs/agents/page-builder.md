# Page Builder sections

Read this before adding or changing a page section. Issue #6 defines the
Maplewood model. Reuse generic machinery without the source project's look.

## Registration

A section's `_type` connects its schema, insert menu, GROQ projection,
generated types and renderer. Keep it identical across all steps.

Start with `pnpm page-builder:new <name> --title "Studio title"`.
Use the generator's help and nearby sections for current options.

1. Define fields in `studio/schemas/blocks/` and register the types.
2. Add the section to the page's permitted sections and insert menu.
3. Select renderer fields in `frontend/sanity/queries/`.
4. Register the renderer in `frontend/components/blocks/`.
5. Update section traits if the wrapper requires them.
6. Run TypeGen after the schema and query settle.

Nested objects need schema registration and a parent projection.
Only types editors can insert directly belong in the top-level menu.

## Content and behavior

Sanity owns editable content, links, media and embed URLs.
Code owns layout, validation and safe rendering.
Hide buttons with empty or `#` links. Preserve live paths.

Port the preserved Maplewood hero, zoom grid and header when required.
Required scroll effects need a static reduced-motion version.
Drop decorative fades. Use captured Maplewood references for visual checks.

For a stored shape change, inspect all affected documents and migrate them
with a verified backup. Preserve draft and published state.
Required content entry belongs to the task.

## Completion

- Registrations and query fields match the final schema.
- Generated schema and types are current.
- Required dataset content exists in the expected shape.
- Presentation displays the content with click-to-edit.
- Screenshots, links, embeds and accessibility meet the issue criteria.
- The PR reports proof and remaining limits.
