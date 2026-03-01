/**
 * Drizzle Kit configuration
 *
 * drizzle-kit is the CLI tool that syncs your Drizzle schema
 * (the TypeScript table definitions in src/db/schema.ts) with
 * your actual database.
 *
 * Key commands:
 *   npx drizzle-kit push   — Push schema changes to the database
 *                             (creates/alters tables to match schema.ts)
 *   npx drizzle-kit studio — Opens a browser-based DB explorer
 *
 * The "turso" dialect tells drizzle-kit to connect via libSQL
 * (Turso's wire protocol) rather than raw SQLite file access.
 *
 * For C# developers: this is similar to running
 *   dotnet ef database update
 * to apply Entity Framework migrations.
 *
 * NOTE: We use dotenv to load .env.local because drizzle-kit runs
 * outside of Next.js (which normally handles env loading for us).
 * This is a dev-only concern — in production (Vercel), env vars
 * are injected by the platform.
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * Load .env.local so drizzle-kit can read TURSO_DATABASE_URL and
 * TURSO_AUTH_TOKEN.  Next.js loads this automatically at dev/build
 * time, but drizzle-kit runs as a standalone CLI outside of Next,
 * so we need to load it ourselves.
 *
 * The { path: ".env.local" } argument tells dotenv to look at that
 * specific file instead of the default ".env".
 */
config({ path: ".env.local" });

export default defineConfig({
  // "turso" dialect = remote libSQL database (Turso cloud)
  dialect: "turso",

  // Path to the file where all our table definitions live
  schema: "./src/db/schema.ts",

  // Folder where drizzle-kit stores migration SQL files (if needed)
  out: "./drizzle",

  // Connection credentials — read from .env.local (local dev)
  // or from Vercel environment variables (production)
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
