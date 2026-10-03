import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const buttonSource = readFileSync(new URL("./button.ts", import.meta.url), "utf8");
const customUrlSource = readFileSync(
  new URL("./custom-url.ts", import.meta.url),
  "utf8",
);

test("shared buttons require visible text", () => {
  assert.match(
    buttonSource,
    /name: "text"[\s\S]*?validation: \(rule\) => rule\.required\(\)/,
  );
});

test("shared internal URLs allow the Blog index singleton", () => {
  assert.match(customUrlSource, /\{ type: "blogIndex" \}/);
});
