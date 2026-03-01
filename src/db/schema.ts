/**
 * Database Schema — Drizzle ORM + Turso (libSQL / SQLite)
 *
 * This file defines every table in the database using Drizzle's
 * "sqliteTable" helper.  Each column maps to a SQLite type.
 *
 * Tables fall into two groups:
 *   1. Auth.js tables — required by @auth/drizzle-adapter for
 *      magic-link authentication (users, accounts, sessions,
 *      verificationTokens).
 *   2. App tables — our own business data (trailProgress, emailList).
 *
 * IMPORTANT: The Auth.js table shapes MUST match the adapter's expected
 * types exactly. The official reference schema is in the adapter source:
 * https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-drizzle/src/lib/sqlite.ts
 *
 * Key differences from a typical schema:
 *   - sessions: sessionToken is the PRIMARY KEY (no separate id column)
 *   - accounts: composite primary key on (provider, providerAccountId)
 *   - timestamps use { mode: "timestamp_ms" } not "timestamp"
 *
 * After changing this file, run `npx drizzle-kit push` to sync the
 * schema to your Turso database.
 */

import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/*  AUTH.JS TABLES                                                     */
/*  These MUST match the shapes defined in @auth/drizzle-adapter.      */
/*  Changing column names, types, or primary keys will break auth.     */
/* ------------------------------------------------------------------ */

/**
 * users — one row per person who enters an email on the trail page.
 * Auth.js creates this automatically the first time someone signs in.
 */
export const users = sqliteTable("users", {
  /**
   * Primary key — text, auto-generated UUID.
   * The .$defaultFn() tells Drizzle to generate a random UUID when
   * inserting a new row, so the adapter doesn't have to supply one.
   */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  /**
   * timestamp_ms mode stores milliseconds as an integer and converts
   * to/from JS Date objects. The adapter expects this exact mode.
   */
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

/**
 * accounts — links a user to an auth provider (e.g. "resend" email).
 *
 * IMPORTANT: No "id" column. The primary key is a composite of
 * (provider, providerAccountId). This is what the Drizzle adapter
 * expects for SQLite.
 */
export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "email" for magic links
    provider: text("provider").notNull(), // "resend"
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    /**
     * Composite primary key — the adapter identifies accounts by
     * the combination of provider + providerAccountId, not a UUID.
     */
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

/**
 * sessions — server-side session records.
 *
 * IMPORTANT: sessionToken is the PRIMARY KEY here — not a separate
 * "id" column. The Drizzle adapter's TypeScript types enforce this:
 * DefaultSQLiteSessionsTable requires sessionToken.isPrimaryKey = true.
 * Having a separate "id" as PK causes a type error at build time.
 */
export const sessions = sqliteTable("sessions", {
  /**
   * The session token IS the primary key. Auth.js generates this
   * value itself — we don't need a $defaultFn here.
   */
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

/**
 * verificationTokens — short-lived tokens for magic-link emails.
 * Auth.js creates one when a magic link is sent, then deletes it
 * after the link is clicked (or when it expires).
 *
 * Uses a composite primary key on (identifier, token) — no separate
 * id column, matching the adapter's expected shape.
 */
export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [
    primaryKey({ columns: [vt.identifier, vt.token] }),
  ]
);

/* ------------------------------------------------------------------ */
/*  APP TABLES                                                         */
/*  Our own business data, not managed by Auth.js.                     */
/* ------------------------------------------------------------------ */

/**
 * trailProgress — tracks each user's mural selfie trail check-ins.
 *
 * One row per check-in. When a user checks in at a mural, we insert
 * a row with their userId and the muralId (1–14).  To see how many
 * check-ins a user has, we COUNT(*) their rows.
 *
 * The redemptionCode column is only set once — on the row that
 * triggers quest completion (i.e. when they hit the required number
 * of check-ins).  We reuse that code if they complete again later.
 */
export const trailProgress = sqliteTable("trail_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Foreign key to users.id — the person checking in */
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Which mural (1–14) was visited */
  muralId: integer("mural_id").notNull(),
  /** ISO-8601 timestamp of when the check-in happened */
  checkedInAt: text("checked_in_at").notNull(),
  /**
   * Unique redemption code, only populated on the check-in row
   * that completes the quest (e.g. "BRP-A1B2C3").
   * All other rows leave this null.
   */
  redemptionCode: text("redemption_code"),
});

/**
 * emailList — newsletter / mailing list sign-ups.
 * Future feature: collect names + emails from visitors who want
 * updates about new murals, events, etc.
 */
export const emailList = sqliteTable("email_list", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email").notNull().unique(),
  /** ISO-8601 timestamp of when they signed up */
  signedUpAt: text("signed_up_at").notNull(),
});
