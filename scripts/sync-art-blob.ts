/**
 * Sync local public/art/ images to Vercel Blob (Architecture §6, Spec §7).
 *
 * `public/art/` is the operator's local source of truth (192MB web + 14MB
 * thumbs, gitignored, backed up outside the repo). This script uploads it to
 * Blob, preserving the `web/…`/`thumbs/…` pathname structure so DB
 * `web_image_path`/`thumb_path` values stay valid unchanged.
 *
 * --dry-run (default, safe): walks the local folder and prints the upload
 * plan only — no network call, no token required. This is what the R2 gate
 * runs (the agent never holds BLOB_READ_WRITE_TOKEN).
 * --apply (operator-run only, needs BLOB_READ_WRITE_TOKEN): lists existing
 * blob pathnames once, then uploads every local file not already present.
 * Content-hashed filenames make this idempotent by construction — re-running
 * after a partial or repeat upload is always safe.
 *
 * Run: npx tsx scripts/sync-art-blob.ts [--dry-run|--apply]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { list, put } from '@vercel/blob';
import { createReadStream, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';

const ART_DIR = 'public/art';
const SUBDIRS = ['web', 'thumbs'];

interface LocalFile {
  // Matches the DB's web_image_path/thumb_path values exactly, e.g.
  // "web/matthews-turtle-7bb2b9a6.jpg".
  pathname: string;
  absolutePath: string;
  size: number;
}

async function walkArtDir(): Promise<LocalFile[]> {
  const files: LocalFile[] = [];
  for (const subdir of SUBDIRS) {
    const dir = `${ART_DIR}/${subdir}`;
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      // Folder absent (e.g. CI, where public/art/ is gitignored and never present).
      continue;
    }
    for (const name of entries) {
      const absolutePath = `${dir}/${name}`;
      const stat = statSync(absolutePath);
      if (!stat.isFile()) continue;
      files.push({ pathname: `${subdir}/${name}`, absolutePath, size: stat.size });
    }
  }
  return files;
}

async function listExistingPathnames(): Promise<Set<string>> {
  const existing = new Set<string>();
  let cursor: string | undefined;
  do {
    const result = await list({ cursor, limit: 1000 });
    for (const blob of result.blobs) existing.add(blob.pathname);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return existing;
}

function printSummary(
  label: string,
  planned: number,
  skipped: number,
  errors: number,
  totalBytes: number,
) {
  const mb = (totalBytes / (1024 * 1024)).toFixed(1);
  console.log(`--- sync-art-blob (${label}) ---`);
  console.log(`Files found: ${planned + skipped}`);
  console.log(`${label === 'dry-run' ? 'Planned uploads' : 'Uploaded'}: ${planned}`);
  console.log(`Skipped (already present): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total local size: ${mb} MB`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const files = await walkArtDir();
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  if (!apply) {
    printSummary('dry-run', files.length, 0, 0, totalBytes);
    return;
  }

  // @vercel/blob accepts either a static BLOB_READ_WRITE_TOKEN, or the OIDC
  // pair (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) that `vercel env pull` writes
  // for stores connected to a project via OIDC — either is fine here.
  const hasStaticToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasOidcCreds = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  if (!hasStaticToken && !hasOidcCreds) {
    console.error(
      'sync-art-blob --apply requires BLOB_READ_WRITE_TOKEN, or VERCEL_OIDC_TOKEN + ' +
        'BLOB_STORE_ID from `vercel env pull .env.local` (operator-held). Aborting.',
    );
    process.exit(1);
  }

  const existing = await listExistingPathnames();
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    if (existing.has(file.pathname)) {
      skipped += 1;
      continue;
    }
    try {
      await put(file.pathname, createReadStream(file.absolutePath), {
        access: 'public',
        addRandomSuffix: false,
      });
      console.log(`sync_art_blob_uploaded pathname=${file.pathname}`);
      uploaded += 1;
    } catch (err) {
      console.error(
        `sync_art_blob_error pathname=${file.pathname} error=${(err as Error).message}`,
      );
      errors += 1;
    }
  }

  printSummary('apply', uploaded, skipped, errors, totalBytes);
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('sync-art-blob failed:', err);
  process.exit(1);
});
