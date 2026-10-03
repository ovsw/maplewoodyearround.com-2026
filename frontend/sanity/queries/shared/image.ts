// Alt text is per-usage: it comes from the `alt` field on the image itself, not
// from the asset. The same photo means different things in different places, so
// each usage describes it in its own context. The field is optional; components
// fall back to alt="" so an undescribed image reads as decorative.
export const imageQuery = `
  ...,
  asset->{
    _id,
    url,
    mimeType,
    metadata {
      lqip,
      dimensions {
        width,
        height
      }
    }
  }
`;
