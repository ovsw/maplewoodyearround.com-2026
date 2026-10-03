import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "legacy-donor-prototype/**",
    "out/**",
    "prototype/support.js",
    "build/**",
    "next-env.d.ts",
    "sanity.types.ts",
  ]),
]);
