import { requireStudioEnvironmentValue } from "./environment";

export const studioSiteName = requireStudioEnvironmentValue(
  "SANITY_STUDIO_TITLE",
  process.env.SANITY_STUDIO_TITLE,
);
