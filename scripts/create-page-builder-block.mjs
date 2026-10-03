#!/usr/bin/env node

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const paths = {
  blockTypes: resolve(repoRoot, "studio/schemas/blocks/page-builder.ts"),
  schemaTypes: resolve(repoRoot, "studio/schema-types.ts"),
  queries: resolve(repoRoot, "frontend/sanity/queries/page-builder.ts"),
  components: resolve(repoRoot, "frontend/components/blocks/index.tsx"),
};

const scopeMarkers = {
  content: "  // page-builder-generator:content-types",
  general: "  // page-builder-generator:general-types",
  home: "  // page-builder-generator:home-types",
};

function usage() {
  return `Create and register a Page Builder block.

Usage:
  pnpm page-builder:new <name> [options]

Options:
  --title <title>       Studio title. Derived from the name by default.
  --scope <scope>       content, general, or home. Default: content.
  --preview <jpg>       Copy and register a Studio grid preview image.
  --dry-run             Print the planned files without writing them.
  --help                Show this help.

Examples:
  pnpm page-builder:new campHighlights
  pnpm page-builder:new camp-highlights --title "Camp Highlights"
  pnpm page-builder:new homeStats --scope home --preview ./home-stats.jpg`;
}

function parseArgs(argv) {
  const options = { dryRun: false, preview: undefined, scope: "content", title: undefined };
  let name;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { help: true };
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument.startsWith("--")) {
      const [flag, inlineValue] = argument.split("=", 2);
      const value = inlineValue ?? argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
      if (inlineValue === undefined) index += 1;
      if (flag === "--title") options.title = value;
      else if (flag === "--scope") options.scope = value;
      else if (flag === "--preview") options.preview = resolve(process.cwd(), value);
      else throw new Error(`Unknown option: ${flag}`);
      continue;
    }
    if (name) throw new Error(`Unexpected argument: ${argument}`);
    name = argument;
  }

  if (!name) throw new Error("Provide a block name");
  if (!Object.hasOwn(scopeMarkers, options.scope)) {
    throw new Error("--scope must be content, general, or home");
  }
  return { help: false, name, ...options };
}

function getNames(input, explicitTitle) {
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  if (!words.length || !/^[a-z]/.test(words[0])) {
    throw new Error("Block names must start with a letter");
  }

  const pascal = words.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  return {
    camel: pascal[0].toLowerCase() + pascal.slice(1),
    kebab: words.join("-"),
    pascal,
    title: explicitTitle ?? words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
  };
}

function insertAtMarker(source, marker, line, file) {
  const occurrences = source.split(marker).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${file} must contain exactly one ${marker} marker`);
  }
  return source.replace(marker, `${line}\n${marker}`);
}

function schemaTemplate({ camel, title }) {
  return `import { defineField, defineType } from "sanity";

export default defineType({
  name: "${camel}",
  title: ${JSON.stringify(title)},
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title: previewTitle }) => ({
      title: previewTitle || ${JSON.stringify(`Untitled ${title}`)},
      subtitle: ${JSON.stringify(title)},
    }),
  },
});
`;
}

function queryTemplate({ camel }) {
  return `import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const ${camel}Query = groq\`
  _type == "${camel}" => {
    title,
    description
  }
\`;
`;
}

function componentTemplate({ camel, kebab, pascal }) {
  return `import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ${pascal}Props = Extract<PageBlock, { _type: "${camel}" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function ${pascal}({
  _key,
  dataAttribute,
  description,
  title,
}: ${pascal}Props) {
  if (!title) return null;

  const headingId = \`${kebab}-\${stegaClean(_key)}-title\`;

  return (
    <section
      aria-labelledby={headingId}
      className="section-pad"
      id={\`${kebab}-\${stegaClean(_key)}\`}
    >
      <div className="container-content">
        <h2
          className="typo-section-heading"
          data-sanity={dataAttribute?.("title")}
          id={headingId}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="mt-5 typo-body-editorial"
            data-sanity={dataAttribute?.("description")}
          >
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
`;
}

async function buildPlan(options) {
  const names = getNames(options.name, options.title);
  const targets = {
    schema: resolve(repoRoot, `studio/schemas/blocks/${names.kebab}.ts`),
    query: resolve(repoRoot, `frontend/sanity/queries/${names.kebab}.ts`),
    component: resolve(repoRoot, `frontend/components/blocks/${names.kebab}.tsx`),
    preview: resolve(repoRoot, `studio/static/images/preview/${names.camel}.jpg`),
  };

  for (const file of [targets.schema, targets.query, targets.component, targets.preview]) {
    if (existsSync(file)) throw new Error(`Refusing to overwrite existing file: ${file}`);
  }
  if (options.preview) {
    if (!existsSync(options.preview)) throw new Error(`Preview not found: ${options.preview}`);
    if (![".jpg", ".jpeg"].includes(extname(options.preview).toLowerCase())) {
      throw new Error("--preview must point to a JPG image");
    }
  }

  const originals = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, file]) => [key, await readFile(file, "utf8")]),
    ),
  );

  let blockTypes = insertAtMarker(
    originals.blockTypes,
    scopeMarkers[options.scope],
    `  "${names.camel}",`,
    paths.blockTypes,
  );
  if (options.preview) {
    blockTypes = insertAtMarker(
      blockTypes,
      "  // page-builder-generator:preview-types",
      `  "${names.camel}",`,
      paths.blockTypes,
    );
  }

  const schemaTypes = insertAtMarker(
    insertAtMarker(
      originals.schemaTypes,
      "// page-builder-generator:block-imports",
      `import ${names.camel} from "./schemas/blocks/${names.kebab}";`,
      paths.schemaTypes,
    ),
    "  // page-builder-generator:block-types",
    `  ${names.camel},`,
    paths.schemaTypes,
  );

  const queries = insertAtMarker(
    insertAtMarker(
      originals.queries,
      "// page-builder-generator:query-imports",
      `import { ${names.camel}Query } from "./${names.kebab}";`,
      paths.queries,
    ),
    '    ${"" /* page-builder-generator:query-spreads */}',
    `    \${${names.camel}Query},`,
    paths.queries,
  );

  const components = insertAtMarker(
    insertAtMarker(
      insertAtMarker(
        originals.components,
        "// page-builder-generator:component-imports",
        `import ${names.pascal} from "@/components/blocks/${names.kebab}";`,
        paths.components,
      ),
      "  // page-builder-generator:editing-types",
      `  "${names.camel}",`,
      paths.components,
    ),
    "  // page-builder-generator:component-map",
    `  ${names.camel}: ${names.pascal},`,
    paths.components,
  );

  return {
    names,
    originals,
    registrations: { blockTypes, schemaTypes, queries, components },
    targets,
    templates: {
      schema: schemaTemplate(names),
      query: queryTemplate(names),
      component: componentTemplate(names),
    },
  };
}

async function applyPlan(plan, options) {
  const created = [];
  try {
    for (const key of ["schema", "query", "component"]) {
      await mkdir(dirname(plan.targets[key]), { recursive: true });
      await writeFile(plan.targets[key], plan.templates[key], { encoding: "utf8", flag: "wx" });
      created.push(plan.targets[key]);
    }
    if (options.preview) {
      await mkdir(dirname(plan.targets.preview), { recursive: true });
      await copyFile(options.preview, plan.targets.preview);
      created.push(plan.targets.preview);
    }
    for (const key of Object.keys(paths)) {
      await writeFile(paths[key], plan.registrations[key], "utf8");
    }
  } catch (error) {
    await Promise.all(
      Object.entries(paths).map(([key, file]) => writeFile(file, plan.originals[key], "utf8")),
    );
    await Promise.all(created.map((file) => rm(file, { force: true })));
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const plan = await buildPlan(options);
  const files = [plan.targets.schema, plan.targets.query, plan.targets.component];
  if (options.preview) files.push(plan.targets.preview);

  if (options.dryRun) {
    console.log(`Would create and register ${plan.names.camel}:`);
    for (const file of files) console.log(`- ${file}`);
    return;
  }

  await applyPlan(plan, options);
  console.log(`Created and registered ${plan.names.camel}.`);
  for (const file of files) console.log(`- ${file}`);
  console.log("Next: shape the schema, query, and renderer together, then run pnpm typegen once.");
  if (!options.preview) console.log("Studio grid preview omitted. Add a JPG when the design is ready.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
