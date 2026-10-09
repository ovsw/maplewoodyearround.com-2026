// The photo of the Generated sharing card: the first hero photo on the page.
// The metadata query and the card route both read it, so they sign and render
// the same photo.
export const sharingPhotoQuery = `
  "sharingPhoto": coalesce(
    blocks[_type in ["innerHero", "homeHero", "hero"] && defined(image.asset)][0].image,
    blocks[_type == "tabbedHero"][0].tabs[defined(image.asset)][0].image
  ){ asset, crop, hotspot }
`;

// A post has no hero section; its featured image is its hero photo.
export const postSharingPhotoQuery = `
  "sharingPhoto": select(defined(image.asset) => image{ asset, crop, hotspot })
`;
