/**
 * Auth.js v5 Configuration
 *
 * This is the central authentication config for the site.
 * Currently it only enables magic-link (email) sign-in via Resend.
 *
 * HOW IT WORKS (for C# developers):
 * - Auth.js is analogous to ASP.NET Identity — it handles sessions,
 *   token generation, and provider abstraction.
 * - The Resend "provider" is like configuring an IEmailSender implementation.
 * - The Unstorage "adapter" is like a repository for auth data (users,
 *   tokens). We use the filesystem driver so there's no external DB.
 * - We export `auth`, `signIn`, `signOut`, and `handlers` which are used
 *   throughout the app — similar to injecting IAuthService in .NET DI.
 *
 * ENV VARS REQUIRED:
 *   AUTH_RESEND_KEY  — Resend API key (auto-detected by Auth.js)
 *   AUTH_SECRET      — Encryption secret for session tokens
 *   EMAIL_FROM       — Sender address for magic link emails
 */

import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';

// Unstorage provides a key-value abstraction over many backends.
// We use the filesystem driver for local dev (writes JSON files to disk).
// For production on Vercel, switch to vercelKV or similar.
import { createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import { UnstorageAdapter } from '@auth/unstorage-adapter';

// ── Storage Setup ────────────────────────────────────────────────────
// Creates a filesystem-backed key-value store in the project's data/ dir.
// Auth.js stores users, sessions, and verification tokens here.
// (C# analogy: like configuring a file-based DbContext — good for dev,
// swap for a real DB in production via an env-based factory.)

const storage = createStorage({
  driver: fsLiteDriver({
    base: './data/auth', // Relative to project root
  }),
});

// ── Auth.js Config ───────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Connect Auth.js to our filesystem storage for user + token persistence.
  // The email provider REQUIRES a database adapter — magic link tokens
  // must be stored server-side so they can be verified when clicked.
  adapter: UnstorageAdapter(storage),

  providers: [
    Resend({
      // AUTH_RESEND_KEY is auto-detected from env vars by the Resend provider.
      // We only need to set the "from" address here.
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    }),
  ],

  // Use JWT sessions instead of database sessions.
  // This means the session data lives in a signed cookie — no need
  // to look up sessions from storage on every request.
  // (C# analogy: like using JWT bearer tokens instead of session cookies
  // backed by a distributed cache.)
  session: {
    strategy: 'jwt',
  },

  pages: {
    // We don't use Auth.js's built-in sign-in page — the trail page
    // has its own inline email form. But if someone hits the auth
    // endpoints directly, redirect them to the trail page.
    signIn: '/murals/trail',
    // After clicking the magic link, redirect to the trail page.
    // Auth.js appends a `callbackUrl` param; this is the fallback.
    verifyRequest: '/murals/trail?check-email=true',
  },

  callbacks: {
    // Include the user's email in the JWT token so we can read it
    // in server-side code without an additional DB lookup.
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    // Expose the email on the session object so client components
    // can display it (e.g., "Signed in as visitor@example.com").
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
