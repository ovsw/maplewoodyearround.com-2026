// A file link ends in the file name, for example `…/<hash>.pdf/Menu.pdf`, so a
// download gets the current name at once: the CDN caches the name it sends
// on the plain link for up to 30 days. GROQ cannot encode a URL, so a name
// with "#", "?" or "%" (or no name) keeps the plain link.
// One constant per path to the file, because typegen reads constant strings.

export const fileUrl = `coalesce(select(
  count(string::split(file.asset->originalFilename, "#")) + count(string::split(file.asset->originalFilename, "?")) + count(string::split(file.asset->originalFilename, "%")) == 3
    => file.asset->url + "/" + file.asset->originalFilename
), file.asset->url)`;

export const urlFileUrl = `coalesce(select(
  count(string::split(url.file.asset->originalFilename, "#")) + count(string::split(url.file.asset->originalFilename, "?")) + count(string::split(url.file.asset->originalFilename, "%")) == 3
    => url.file.asset->url + "/" + url.file.asset->originalFilename
), url.file.asset->url)`;

export const customLinkFileUrl = `coalesce(select(
  count(string::split(customLink.file.asset->originalFilename, "#")) + count(string::split(customLink.file.asset->originalFilename, "?")) + count(string::split(customLink.file.asset->originalFilename, "%")) == 3
    => customLink.file.asset->url + "/" + customLink.file.asset->originalFilename
), customLink.file.asset->url)`;
