import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { media, mediaAssetSource } from "sanity-plugin-media";
import { requireStudioEnvironmentValue } from "./environment";
import { schemaTypes } from "./schema-types";
import { resolve } from "./presentation/resolve";
import { openInPresentationAction } from "./presentation/open-in-presentation";
import { isPresentationDocumentType } from "./presentation/routes";
import { structure } from "./structure";
import {
  singletonDocumentActions,
  singletonDocumentTypes,
} from "./singletons";

// Define the actions that should be available for singleton documents
const nonCreatableTypes = singletonDocumentTypes;

const projectId = requireStudioEnvironmentValue(
  "SANITY_STUDIO_PROJECT_ID",
  process.env.SANITY_STUDIO_PROJECT_ID,
);
const dataset = requireStudioEnvironmentValue(
  "SANITY_STUDIO_DATASET",
  process.env.SANITY_STUDIO_DATASET,
);
const title = requireStudioEnvironmentValue(
  "SANITY_STUDIO_TITLE",
  process.env.SANITY_STUDIO_TITLE,
);
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2026-03-23";

const SANITY_STUDIO_PREVIEW_URL = requireStudioEnvironmentValue(
  "SANITY_STUDIO_PREVIEW_URL",
  process.env.SANITY_STUDIO_PREVIEW_URL,
);

export default defineConfig({
  title,
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schema' folder
  schema: {
    types: schemaTypes,
    // Filter singletons and read-only compatibility types from global creation.
    templates: (templates) =>
      templates.filter(({ schemaType }) => !nonCreatableTypes.has(schemaType)),
  },
  form: {
    // The media library is the only asset source for image fields. This
    // replaces the default "Uploaded images" source, so every image is picked
    // from, or uploaded through, the same tagged library.
    image: {
      assetSources: () => [mediaAssetSource],
    },
  },
  document: {
    // For singleton types, filter out actions that are not explicitly included
    // in the `singletonActions` list defined above
    actions: (input, context) =>
      singletonDocumentTypes.has(context.schemaType)
        ? input.filter(({ action }) =>
            action && singletonDocumentActions.has(action),
          )
        : input,
    unstable_fieldActions: (input, context) =>
      isPresentationDocumentType(context.documentType)
        ? [openInPresentationAction, ...input]
        : input,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        origin: SANITY_STUDIO_PREVIEW_URL,
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
      resolve,
    }),
    // Vision is a tool that lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
    media(),
  ],
});
