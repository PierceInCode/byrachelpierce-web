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
 * After changing this file, run `npx drizzle-kit push` to sync the
 * schema to your Turso database.
 *
 * References:
 *   - Auth.js Drizzle adapter: https://authjs.dev/getting-started/adapters/drizzle
 *   - Drizzle SQLite columns:  https://orm.drizzle.team/docs/column-types/sqlite
 */

import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/*  AUTH.JS TABLES                                                     */
/*  These table/column names are dictated by the Drizzle adapter.      */
/*  Renaming columns will break authentication.                        */
/* ------------------------------------------------------------------ */

/**
 * users — one row per person who enters an email on the trail page.
 * Auth.js creates this automatically the first time someone signs in.
 */
export const users = sqliteTable("users", {
  /**
   * Primary key — Auth.js expects a text ID, not an auto-increment int.
   * The .$defaultFn() tells Drizzle to generate a random UUID when
   * inserting a new row, so Auth.js doesn't have to supply one.
   *
   * FIX: Without this default, Auth.js inserts id=null which violates
   * the NOT NULL constraint on a primary key.
   */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  // For email-only auth this is set when the magic link is clicked
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

/**
 * accounts — links a user to an auth provider (e.g. "resend" email).
 * For our magic-link flow, one account row is created per user.
 */
export const accounts = sqliteTable("accounts", {
  /**
   * Same fix as users.id — needs a UUID default so Auth.js can insert
   * without explicitly providing an ID value.
   */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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
});

/**
 * sessions — server-side session records.
 * Auth.js stores session data here when using a database strategy.
 */
export const sessions = sqliteTable("sessions", {
  /**
   * Same fix — UUID default for the session ID.
   * This was the column that caused the original SQLITE_CONSTRAINT
   * error: Auth.js tried to insert a session with id=null.
   */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

/**
 * verificationTokens — short-lived tokens for magic-link emails.
 * Auth.js creates one when a magic link is sent, then deletes it
 * after the link is clicked (or when it expires).
 *
 * NOTE: This table has no single-column primary key. Instead it uses
 * a composite unique index on (identifier, token), which is what
 * Auth.js expects for SQLite adapters.
 */
export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    // Auth.js looks up tokens by (identifier + token) together
    uniqueIndex("verification_token_idx").on(table.identifier, table.token),
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
