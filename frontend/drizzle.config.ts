import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations from the schema. It never connects to
// a database; migrations are applied by `hq:db:migrate` (Neon) or on start
// (the local database).
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/hq/db/schema.ts",
  out: "./lib/hq/db/migrations",
});
