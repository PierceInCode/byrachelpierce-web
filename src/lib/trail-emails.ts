/**
 * Trail Email Templates — Sends transactional emails for the Mural Selfie Trail
 *
 * This module uses the Resend SDK to send two types of custom emails:
 *   1. REDEMPTION EMAIL — sent to the user when they complete the quest
 *   2. GALLERY NOTIFICATION — sent to the gallery when a user completes
 *
 * NOTE: Magic link emails are handled automatically by Auth.js + Resend provider.
 * This module only handles the trail-specific emails.
 *
 * RESEND FREE TIER LIMITS:
 *   - 100 emails/day, 3,000/month
 *   - Test domain (onboarding@resend.dev) can only deliver to the Resend
 *     account's signup email during development
 *
 * C# ANALOGY:
 *   This is like an IEmailService implementation with SendRedemptionEmail()
 *   and SendGalleryNotification() methods. The Resend SDK is like SendGrid's
 *   .NET SDK — instantiate a client, call send() with the email payload.
 */

import { Resend } from 'resend';
import { MURAL_LOCATIONS } from '@/lib/mural-data';
import type { TrailProgress } from '@/types';

// ── Resend Client ────────────────────────────────────────────────────
// Instantiate once at module level (like a singleton DI registration).
// The API key is read from env — Resend's constructor handles this.

const resend = new Resend(process.env.RESEND_API_KEY);

/** The "from" address for all trail emails */
const FROM_ADDRESS = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/** Gallery notification recipient */
const GALLERY_EMAIL = process.env.GALLERY_EMAIL || 'matthew@pierceincode.com';

// ── Email Senders ────────────────────────────────────────────────────

/**
 * Send the redemption code email to the user who completed the trail.
 *
 * This is the email the user shows to the cashier at the gallery.
 * It includes the code prominently, plus instructions on how to redeem.
 *
 * @param email - The user's email address
 * @param redemptionCode - The generated RP-XXXXXX code
 * @returns The Resend API response (contains the email ID)
 */
export async function sendRedemptionEmail(
  email: string,
  redemptionCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: `Rachel Pierce Art Gallery <${FROM_ADDRESS}>`,
      to: [email],
      subject: '🎉 You completed the Sanibel Mural Trail!',
      html: buildRedemptionEmailHtml(redemptionCode),
    });

    if (error) {
      console.error('[trail-emails] Failed to send redemption email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[trail-emails] Unexpected error sending redemption email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a notification to the gallery that a user completed the trail.
 *
 * This gives the gallery staff a heads-up and includes the code + user info
 * so they can verify when the customer arrives.
 *
 * @param progress - The user's full trail progress (includes email, code, check-ins)
 */
export async function sendGalleryNotification(
  progress: TrailProgress
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: `Mural Trail System <${FROM_ADDRESS}>`,
      to: [GALLERY_EMAIL],
      subject: `Mural Trail completed — ${progress.redemptionCode}`,
      html: buildGalleryNotificationHtml(progress),
    });

    if (error) {
      console.error('[trail-emails] Failed to send gallery notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[trail-emails] Unexpected error sending gallery notification:', err);
    return { success: false, error: 'Failed to send notification' };
  }
}

// ── HTML Template Builders ───────────────────────────────────────────
// These produce simple, inline-styled HTML emails.
// Email clients strip <style> blocks and external CSS, so everything
// must be inline. We keep it simple — no images, no complex layouts.

/**
 * Build the HTML body for the redemption code email.
 *
 * Design goals:
 *   - Code is LARGE and unmissable (the cashier needs to see it)
 *   - Simple, brand-colored layout that works in all email clients
 *   - Clear redemption instructions
 */
function buildRedemptionEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background-color:#fafaf8; font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf8;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#145f70 0%,#36b5cd 100%); padding:32px 40px; text-align:center;">
              <h1 style="margin:0; font-size:24px; font-weight:700; color:#ffffff; font-family:Georgia,serif;">
                🎉 Congratulations!
              </h1>
              <p style="margin:8px 0 0; font-size:15px; color:rgba(255,255,255,0.85);">
                You completed the Sanibel Mural Selfie Trail
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px; font-size:16px; line-height:1.6; color:#577083;">
                You visited 3 of Rachel Pierce's murals across Sanibel Island — nice work!
                Here's your unique redemption code:
              </p>

              <!-- Redemption Code (big and prominent) -->
              <div style="background-color:#e8f7fb; border:2px dashed #36b5cd; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
                <p style="margin:0 0 4px; font-size:12px; color:#577083; text-transform:uppercase; letter-spacing:0.1em;">
                  Your Redemption Code
                </p>
                <p style="margin:0; font-size:36px; font-weight:700; color:#36b5cd; letter-spacing:0.15em; font-family:monospace;">
                  ${code}
                </p>
              </div>

              <!-- Instructions -->
              <h2 style="margin:0 0 12px; font-size:18px; font-weight:700; color:#3d5264; font-family:Georgia,serif;">
                How to Redeem
              </h2>
              <ol style="margin:0 0 24px; padding-left:20px; font-size:15px; line-height:1.8; color:#577083;">
                <li>Visit <strong>Rachel Pierce Art Gallery</strong></li>
                <li>Show this email to the cashier</li>
                <li>Receive your special gift!</li>
              </ol>

              <!-- Gallery info -->
              <div style="background-color:#fafaf8; border-radius:8px; padding:16px 20px; margin:0 0 24px;">
                <p style="margin:0 0 4px; font-size:14px; font-weight:600; color:#3d5264;">
                  📍 Rachel Pierce Art Gallery
                </p>
                <p style="margin:0 0 4px; font-size:14px; color:#577083;">
                  1571 Periwinkle Way, Sanibel, FL 33957
                </p>
                <a href="https://maps.google.com/?q=1571+Periwinkle+Way+Sanibel+FL+33957" style="font-size:13px; color:#fd8473; text-decoration:none;">
                  Get Directions →
                </a>
              </div>

              <!-- Social prompt -->
              <p style="margin:0; font-size:14px; color:#8099aa; text-align:center; line-height:1.6;">
                Loved the trail? Share your selfies and tag
                <strong style="color:#36b5cd;">@byrachelpierce</strong>
                on Instagram or Facebook!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; border-top:1px solid #e8edf0; text-align:center;">
              <p style="margin:0; font-size:12px; color:#8099aa;">
                by Rachel Pierce · Sanibel Island, Florida
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build the HTML body for the gallery notification email.
 *
 * This is an internal email — designed for quick scanning by gallery staff.
 * Includes the user's email, code, and which murals they visited.
 */
function buildGalleryNotificationHtml(progress: TrailProgress): string {
  // Look up the mural names/addresses for the check-in IDs
  const visitedMurals = progress.checkIns
    .map((checkIn) => {
      const mural = MURAL_LOCATIONS.find((m) => m.id === checkIn.muralId);
      if (!mural) return `Mural #${checkIn.muralId} (unknown)`;
      return `${mural.name} — ${mural.address}`;
    })
    .map((text) => `<li style="margin:4px 0; font-size:14px; color:#577083;">${text}</li>`)
    .join('\n');

  const completedDate = progress.completedAt
    ? new Date(progress.completedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/New_York',
      })
    : 'Unknown';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background-color:#fafaf8; font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf8;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#36b5cd; padding:20px 40px;">
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#ffffff; font-family:Helvetica,Arial,sans-serif;">
                🏆 Trail Completed
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0; font-size:13px; color:#8099aa; text-transform:uppercase; letter-spacing:0.08em;">User Email</td>
                  <td style="padding:8px 0; font-size:15px; color:#3d5264; font-weight:600;">${progress.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:13px; color:#8099aa; text-transform:uppercase; letter-spacing:0.08em;">Code</td>
                  <td style="padding:8px 0; font-size:20px; color:#36b5cd; font-weight:700; font-family:monospace; letter-spacing:0.1em;">${progress.redemptionCode}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:13px; color:#8099aa; text-transform:uppercase; letter-spacing:0.08em;">Completed</td>
                  <td style="padding:8px 0; font-size:15px; color:#3d5264;">${completedDate}</td>
                </tr>
              </table>

              <!-- Murals visited -->
              <h3 style="margin:20px 0 8px; font-size:14px; color:#3d5264; text-transform:uppercase; letter-spacing:0.06em;">
                Murals Visited
              </h3>
              <ul style="margin:0; padding-left:18px;">
                ${visitedMurals}
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px; border-top:1px solid #e8edf0;">
              <p style="margin:0; font-size:12px; color:#8099aa;">
                Automated notification from the Mural Selfie Trail system
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
