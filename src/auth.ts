/**
 * Auth.js v5 configuration — Drizzle + Turso edition
 *
 * This replaces the previous unstorage-based config.  The key change
 * is swapping UnstorageAdapter for DrizzleAdapter, which stores
 * users, sessions, and verification tokens in our Turso database.
 *
 * How Auth.js magic links work (simplified):
 *   1. User enters email → Auth.js calls Resend to send a link
 *   2. Link contains a token stored in the verificationTokens table
 *   3. User clicks link → Auth.js verifies the token, creates/finds
 *      the user in the users table, and starts a session
 *   4. Subsequent requests read the session cookie to identify the user
 *
 * Exports:
 *   - handlers: { GET, POST } route handlers for /api/auth/*
 *   - auth: function to get the current session in server components
 *   - signIn / signOut: server-side sign-in/out helpers
 */

import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * DrizzleAdapter connects Auth.js to our Turso database via Drizzle.
   * We pass explicit table references so Drizzle knows exactly which
   * tables to query — this avoids any naming-convention surprises.
   *
   * For C# developers: this is like telling Identity Framework which
   * DbSet<T> properties to use for users, roles, etc.
   */
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    /**
     * Resend provider sends magic-link emails.
     * - apiKey: your Resend API key (from .env.local)
     * - from: the sender address (must match your Resend domain)
     * - maxAge: how long the magic link stays valid (in seconds)
     *   We set 24 hours so tourists have time to check email.
     */
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    }),
  ],

  /**
   * Use "database" strategy so sessions are stored in the sessions
   * table (via Drizzle).  This is required for email/magic-link
   * providers — JWT-only sessions won't work with email sign-in.
   */
  session: {
    strategy: "database",
  },

  pages: {
    /**
     * After a user clicks "Sign in", redirect them to our custom
     * trail page instead of the default Auth.js sign-in page.
     * The trail page has its own email form (EmailSignInForm).
     */
    signIn: "/murals/trail",
  },
});
