/**
 * Trail Service — Business Logic for the Mural Selfie Trail
 *
 * This module handles all trail-related operations:
 *   - Reading / writing trail progress files (JSON on disk)
 *   - Recording check-ins
 *   - Generating redemption codes
 *
 * It does NOT handle email sending — that's in trail-emails.ts.
 * It does NOT handle authentication — that's checked in the API routes.
 *
 * STORAGE MODEL:
 *   Each user's progress lives in a JSON file at:
 *     data/trail-progress/{hashed-email}.json
 *
 *   We hash the email to create a safe filename (no @, dots, or special chars).
 *   The JSON structure matches the TrailProgress interface in types/index.ts.
 *
 * C# ANALOGY:
 *   Think of this as a "TrailService" class with static methods.
 *   Instead of EF Core + a SQL database, we're reading/writing JSON files.
 *   The crypto.createHash() call is like System.Security.Cryptography.SHA256.
 *   The fs/promises API is like System.IO.File (async versions).
 */

import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { TrailProgress, TrailCheckIn } from '@/types';
import { MURAL_LOCATIONS } from '@/lib/mural-data';

// ── Constants ────────────────────────────────────────────────────────

/** Where trail progress JSON files are stored, relative to the project root */
const TRAIL_DATA_DIR = path.join(process.cwd(), 'data', 'trail-progress');

/** How many check-ins are needed to complete the quest. Read from env or default to 3. */
const REQUIRED_CHECKINS = parseInt(process.env.TRAIL_REQUIRED_CHECKINS || '3', 10);

/**
 * Character set for redemption codes — excludes 0/O/1/I to avoid confusion.
 * 30 characters × 6 positions = 729,000,000 possible codes.
 * At gallery scale, collision risk is effectively zero.
 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Hash an email address to create a filesystem-safe filename.
 * Uses SHA-256, then takes the first 16 hex chars (64 bits of entropy).
 *
 * Why hash instead of using the email directly?
 *   1. Emails can contain characters that break file paths (dots, @, +)
 *   2. Adds a thin layer of privacy — the filename doesn't reveal the email
 *
 * C# analogy: Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(email)))[..16]
 */
function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

/**
 * Build the full filesystem path for a user's trail progress file.
 * e.g., /project-root/data/trail-progress/a1b2c3d4e5f6g7h8.json
 */
function getProgressFilePath(email: string): string {
  return path.join(TRAIL_DATA_DIR, `${hashEmail(email)}.json`);
}

/**
 * Ensure the data/trail-progress/ directory exists.
 * Called before any read/write operation.
 * { recursive: true } means it won't throw if the directory already exists.
 *
 * C# analogy: Directory.CreateDirectory() — also no-ops if already present.
 */
async function ensureDataDir(): Promise<void> {
  if (!existsSync(TRAIL_DATA_DIR)) {
    await mkdir(TRAIL_DATA_DIR, { recursive: true });
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get a user's trail progress. Returns null if they haven't started the trail.
 *
 * C# analogy: like a repository's FindByEmail() returning Task<TrailProgress?>
 */
export async function getTrailProgress(email: string): Promise<TrailProgress | null> {
  await ensureDataDir();
  const filePath = getProgressFilePath(email);

  try {
    const raw = await readFile(filePath, 'utf-8');
    // Parse and return the stored progress object
    return JSON.parse(raw) as TrailProgress;
  } catch {
    // File doesn't exist (ENOENT) or is unreadable — user hasn't started
    return null;
  }
}

/**
 * Record a check-in at a mural location.
 *
 * Returns an object with the updated progress and whether this check-in
 * triggered quest completion (so the caller can send emails).
 *
 * IDEMPOTENCY: If the user has already checked in at this mural,
 * we return success without duplicating the entry.
 *
 * C# analogy: like a service method that does the upsert + domain logic,
 * returning a result DTO rather than throwing exceptions.
 */
export async function recordCheckIn(
  email: string,
  muralId: number
): Promise<{
  progress: TrailProgress;
  justCompleted: boolean; // true if THIS check-in triggered quest completion
}> {
  await ensureDataDir();

  // Validate the muralId is within the known range (1-14)
  const validIds = MURAL_LOCATIONS.map((m) => m.id);
  if (!validIds.includes(muralId)) {
    throw new Error(`Invalid mural ID: ${muralId}. Must be one of: ${validIds.join(', ')}`);
  }

  // Load existing progress or create a fresh record
  let progress = await getTrailProgress(email);
  if (!progress) {
    progress = {
      email: email.toLowerCase().trim(),
      checkIns: [],
      questComplete: false,
      redemptionCode: null,
      completedAt: null,
    };
  }

  // Idempotency check — don't add a duplicate check-in for the same mural
  const alreadyCheckedIn = progress.checkIns.some((c) => c.muralId === muralId);
  if (alreadyCheckedIn) {
    // Return existing state — no changes needed
    return { progress, justCompleted: false };
  }

  // Record the new check-in
  const newCheckIn: TrailCheckIn = {
    muralId,
    timestamp: new Date().toISOString(),
  };
  progress.checkIns.push(newCheckIn);

  // Check if this check-in completes the quest
  let justCompleted = false;
  if (!progress.questComplete && progress.checkIns.length >= REQUIRED_CHECKINS) {
    progress.questComplete = true;
    progress.redemptionCode = generateRedemptionCode();
    progress.completedAt = new Date().toISOString();
    justCompleted = true;
  }

  // Persist the updated progress to disk
  const filePath = getProgressFilePath(email);
  await writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8');

  return { progress, justCompleted };
}

/**
 * Generate a unique redemption code in the format: RP-XXXXXX
 *
 * Uses crypto.getRandomValues() for cryptographically random selection.
 * The "RP" prefix makes it recognizable as a Rachel Pierce code.
 *
 * C# analogy: like using RandomNumberGenerator.Fill() + char mapping.
 *
 * NOTE: We don't check for collisions against existing codes because
 * with 729M possibilities and a tiny user base, the odds are negligible.
 * The spec explicitly says "no DB verification" — the cashier just checks
 * the email on the customer's phone.
 */
export function generateRedemptionCode(): string {
  // crypto.getRandomValues() is available in Node.js globally (globalThis.crypto)
  // since Node 19+. For older Node, we'd need to import from 'crypto'.
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  let code = 'RP-';
  for (let i = 0; i < 6; i++) {
    // Map each random byte to a character in our safe alphabet.
    // Using modulo introduces tiny bias but it's irrelevant for this use case.
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

/**
 * Get the number of required check-ins from config.
 * Exported so the API/UI can reference it without hardcoding "3".
 */
export function getRequiredCheckIns(): number {
  return REQUIRED_CHECKINS;
}
