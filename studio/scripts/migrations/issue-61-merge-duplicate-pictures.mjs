// Issue #61: one copy of each picture. Pictures with the same name stem and
// the same pixel size are copies of one picture. Every reference moves to the
// kept copy, then the other copies are deleted. Same name in different sizes
// is listed and left alone.

import { moveReferences, recordId, referencedIds } from "../lib/migration.mjs";
import { isPicture, pictureStem } from "../lib/pictures.mjs";

/** Original formats win over the avif and webp copies Webflow made. */
const ORIGINAL_FORMATS = new Set(["jpg", "png"]);

const size = (asset) => `${asset.metadata?.dimensions?.width}x${asset.metadata?.dimensions?.height}`;

function groupBy(list, key) {
  const groups = new Map();
  for (const item of list) {
    const value = key(item);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  return groups;
}

export default {
  description:
    "Issue #61: one copy of each picture; references move to the kept copy and the other copies are deleted.",

  prepare({ documents, note }) {
    const pictures = documents.filter(isPicture);
    for (const picture of pictures)
      if (!picture.originalFilename || !picture.metadata?.dimensions)
        throw new Error(`${picture._id} has no file name or no pixel size`);

    const references = new Map();
    for (const document of documents)
      for (const id of new Set([...referencedIds(document)].map(recordId)))
        references.set(id, (references.get(id) ?? 0) + 1);
    const count = (asset) => references.get(asset._id) ?? 0;
    const preference = (a, b) =>
      ORIGINAL_FORMATS.has(b.extension) - ORIGINAL_FORMATS.has(a.extension) ||
      count(b) - count(a) ||
      a._createdAt.localeCompare(b._createdAt) ||
      a._id.localeCompare(b._id);
    const describe = (asset) => `${asset.originalFilename} (${asset._id}, ${count(asset)} references)`;

    const keptCopy = new Map();
    let merged = 0;
    let reported = 0;
    for (const [stem, named] of groupBy(pictures, (picture) => pictureStem(picture.originalFilename))) {
      if (named.length < 2) continue;
      const sizes = groupBy(named, size);
      if (sizes.size > 1) {
        reported++;
        note(
          `Not merged, "${stem}" in different sizes: ${[...sizes]
            .map(([pixels, copies]) => `${pixels} ${copies.map((copy) => copy.originalFilename).join(", ")}`)
            .join("; ")}`,
        );
      }
      for (const copies of sizes.values()) {
        if (copies.length < 2) continue;
        const [kept, ...others] = copies.sort(preference);
        merged++;
        note(`Keep ${describe(kept)}`);
        for (const other of others) {
          note(`  delete ${describe(other)}`);
          keptCopy.set(other._id, kept._id);
        }
      }
    }
    note(
      `${pictures.length} pictures: ${merged} groups merged, ${keptCopy.size} copies deleted, ` +
        `${reported} names in different sizes left alone, ${pictures.length - keptCopy.size} pictures kept.`,
    );

    return (document) => {
      if (keptCopy.has(document._id)) return null;
      let moved = document;
      for (const id of referencedIds(document))
        if (keptCopy.has(id)) moved = moveReferences(moved, id, keptCopy.get(id));
      return moved;
    };
  },
};
