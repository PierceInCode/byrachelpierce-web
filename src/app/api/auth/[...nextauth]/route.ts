/**
 * Auth.js Dynamic API Route Handler
 *
 * This catch-all route handles all authentication endpoints:
 *   - GET  /api/auth/signin        → sign-in page redirect
 *   - POST /api/auth/signin/resend → initiate magic link email
 *   - GET  /api/auth/callback/resend?token=...&email=... → verify magic link
 *   - GET  /api/auth/session       → get current session
 *   - POST /api/auth/signout       → sign out
 *
 * We just re-export the handlers from our central auth config.
 * Auth.js handles all the routing internally.
 *
 * (C# analogy: this is like mapping auth middleware endpoints
 * via app.MapIdentityApi() — one line wires up all the routes.)
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
