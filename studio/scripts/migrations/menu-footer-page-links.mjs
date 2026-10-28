// The menu and footer links came over from Webflow as typed paths such as
// "/summer-camp", so Studio cannot tell which page a link opens and the link
// breaks when the page's slug changes. The run points every typed path that
// names a page on this site at that page. Links to other websites, email,
// phone, files and paths that name no page stay as they are. The change goes
// into the drafts of the menu and the footer for Ovi's review; the published
// versions do not change. A draft that already exists is changed in place.

const SYSTEM = ["_rev", "_createdAt", "_updatedAt"];
const RECORDS = ["navigation", "footer"];
const DESTINATION_TYPES = new Set(["navigationDestination", "footerDestination"]);

/** The path a typed destination names, or null when it is not a plain path of this site. */
export function sitePath(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || /[?#\\]/.test(trimmed)) return null;
  const segments = trimmed.split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

/** Every path of a published page, mapped to the page's id. */
export function pageIdsByPath(documents) {
  const ids = new Map();
  for (const document of documents) {
    if (document._id.includes(".")) continue;
    if (document._type === "homePage") ids.set("/", document._id);
    else if (document._type === "blogIndex") ids.set("/news", document._id);
    else if (document._type === "parentDashboard") ids.set("/parent-dashboard", document._id);
    else if (document._type === "page" && document.slug?.current) {
      const path = sitePath(`/${document.slug.current}`);
      if (path) ids.set(path, document._id);
    }
  }
  return ids;
}

/** The value with every typed path of a page replaced by a link to that page. */
export function withPageLinks(value, ids, report = () => {}) {
  if (Array.isArray(value)) return value.map((item) => withPageLinks(item, ids, report));
  if (!value || typeof value !== "object") return value;
  const next = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, withPageLinks(item, ids, report)]),
  );
  if (!DESTINATION_TYPES.has(next._type) || next.kind !== "external") return next;
  const path = sitePath(next.external);
  if (!path) return next;
  const id = ids.get(path);
  report(next.external, id);
  if (!id) return next;
  const { external: _typed, ...rest } = next;
  return { ...rest, kind: "internal", internal: { _type: "reference", _ref: id } };
}

export default {
  description: "Point the menu and footer links that type a path of this site at the page, in drafts.",

  prepare(dataset) {
    const ids = pageIdsByPath(dataset.documents);
    const pending = new Map();
    for (const id of RECORDS) {
      const published = dataset.get(id);
      if (!published) throw new Error(`The published ${id} record is missing`);
      const draft = dataset.get(`drafts.${id}`);
      const source = draft ?? published;
      const left = [];
      let moved = 0;
      const converted = withPageLinks(source, ids, (path, pageId) => (pageId ? moved++ : left.push(path)));
      if (left.length) dataset.note(`Left alone in ${id}: ${left.join(", ")} (no page has this path).`);
      if (!moved) continue;
      dataset.note(`${id}: ${moved} links now point at their page.`);
      if (draft) pending.set(draft._id, converted);
      else {
        const copy = Object.fromEntries(Object.entries(converted).filter(([key]) => !SYSTEM.includes(key)));
        dataset.create({ ...copy, _id: `drafts.${id}` });
      }
    }
    return (document) => pending.get(document._id) ?? document;
  },
};
