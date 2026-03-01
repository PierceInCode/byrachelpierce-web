/**
 * Drizzle + Turso client singleton
 *
 * Creates a single database connection that is reused across all
 * server-side code (API routes, server components, auth callbacks).
 *
 * In development you can point TURSO_DATABASE_URL at a local file
 * (e.g. "file:local.db") and omit the auth token.  In production
 * it connects to your Turso cloud database.
 *
 * Usage in other files:
 *   import { db } from "@/db";
 *   const rows = await db.select().from(users);
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * createClient() opens a persistent HTTP connection to your Turso
 * database.  The URL and token come from environment variables that
 * you set in .env.local (local dev) and in the Vercel dashboard
 * (production).
 *
 * For C# developers: think of this like a SqlConnection string —
 * url is the server address, authToken is the password.
 */
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * `db` is the Drizzle query builder.  It wraps the raw libSQL client
 * and gives us type-safe queries based on our schema definitions.
 *
 * Passing `{ schema }` enables Drizzle's "relational queries" API
 * (e.g. db.query.users.findFirst()), though we mostly use the
 * standard select/insert/update/delete builders.
 *
 * For C# developers: this is similar to a DbContext in Entity Framework.
 */
export const db = drizzle({ client, schema });
