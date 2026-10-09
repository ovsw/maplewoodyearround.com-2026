// The content of the Generated sharing card beyond its title: the first hero
// photo and the first breadcrumb trail on the page. The metadata query and the
// card route both read it, so they sign and render the same card.
export const sharingCardQuery = `
  "sharingPhoto": coalesce(
    blocks[_type in ["innerHero", "homeHero", "hero"] && defined(image.asset)][0].image,
    blocks[_type == "tabbedHero"][0].tabs[defined(image.asset)][0].image
  ){ asset, crop, hotspot },
  "sharingBreadcrumbs": blocks[count(breadcrumbs[defined(label)]) > 0][0]
    .breadcrumbs[defined(label)]{ label, program }
`;

// A post has no hero section; its featured image is its hero photo.
export const postSharingCardQuery = `
  "sharingPhoto": select(defined(image.asset) => image{ asset, crop, hotspot })
`;
