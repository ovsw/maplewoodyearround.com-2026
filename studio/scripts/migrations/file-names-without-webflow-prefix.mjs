// Files (PDFs and videos) lose the Webflow ID prefixes in their file names,
// so "6a43fb2632d2033a996cbd6b_Navigators-Welcome-2026.pdf" becomes
// "Navigators-Welcome-2026.pdf". Sanity sends this name with every download.
// Images keep their names: the Raster descriptions match them by name.

/** The file name without leading Webflow site folders, IDs and upload hashes. */
export const withoutWebflowPrefix = (filename) =>
  filename.replace(/^(?:[0-9a-f]{24}\/|[0-9a-f]{24}_|[0-9a-f]{32}_)+/i, "");

export default {
  description: "Files lose the Webflow ID prefixes in their file names.",

  prepare({ documents, note }) {
    const files = documents.filter((document) => document._type === "sanity.fileAsset" && document.originalFilename);
    const owners = new Map();
    for (const file of files) {
      const name = withoutWebflowPrefix(file.originalFilename);
      if (!name || name.startsWith(".")) throw new Error(`${file.originalFilename} has no name after its prefix`);
      const key = name.toLowerCase();
      if (owners.has(key))
        throw new Error(`${owners.get(key).originalFilename} and ${file.originalFilename} would both be named "${name}"`);
      owners.set(key, file);
    }
    const renamed = files.filter((file) => withoutWebflowPrefix(file.originalFilename) !== file.originalFilename);
    note(`${files.length} files, ${renamed.length} renamed.`);

    return (document) =>
      document._type === "sanity.fileAsset" && document.originalFilename
        ? { ...document, originalFilename: withoutWebflowPrefix(document.originalFilename) }
        : document;
  },
};
