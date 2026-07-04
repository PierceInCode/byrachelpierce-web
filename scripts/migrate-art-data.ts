/**
 * Art data migration script
 *
 * Reads JSON extracted by extract-art-data.py and inserts into Turso.
 * Run: npm run db:migrate-art
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface ExtractedData {
  paintings: {
    sourceId: number;
    title: string;
    slug: string;
    medium: string | null;
    formatType: string | null;
    location: string | null;
    physicalSize: string | null;
    availability: string | null;
    series: string | null;
    notes: string | null;
    widthPx: number | null;
    heightPx: number | null;
    orientation: string | null;
    webImagePath: string;
    thumbPath: string;
    createdAt: string | null;
    updatedAt: string | null;
  }[];
  tagCategories: { id: number; name: string; sort_order: number }[];
  tags: { id: number; category_id: number; name: string; sort_order: number }[];
  paintingTags: {
    paintingId: number;
    tagId: number;
    source: string | null;
    confidence: number | null;
  }[];
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: tsx scripts/migrate-art-data.ts <path-to-json>");
    process.exit(1);
  }

  const data: ExtractedData = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Paintings: ${data.paintings.length}`);
  console.log(`Tag categories: ${data.tagCategories.length}`);
  console.log(`Tags: ${data.tags.length}`);
  console.log(`Painting tags: ${data.paintingTags.length}`);

  // --- Tag categories ---
  console.log("\nInserting tag categories...");
  for (const tc of data.tagCategories) {
    await client.execute({
      sql: "INSERT OR REPLACE INTO tag_categories (id, name, sort_order) VALUES (?, ?, ?)",
      args: [tc.id, tc.name, tc.sort_order],
    });
  }

  // --- Tags ---
  console.log("Inserting tags...");
  for (const t of data.tags) {
    await client.execute({
      sql: "INSERT OR REPLACE INTO tags (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)",
      args: [t.id, t.category_id, t.name, t.sort_order],
    });
  }

  // --- Paintings ---
  // We need to map source IDs to new IDs for painting_tags
  console.log("Inserting paintings...");
  const sourceIdToNewId = new Map<number, number>();

  for (const p of data.paintings) {
    const result = await client.execute({
      sql: `INSERT INTO paintings (title, slug, medium, format_type, location, physical_size,
            availability, series, notes, width_px, height_px, orientation,
            web_image_path, thumb_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.title, p.slug, p.medium, p.formatType, p.location, p.physicalSize,
        p.availability, p.series, p.notes, p.widthPx, p.heightPx, p.orientation,
        p.webImagePath, p.thumbPath, p.createdAt, p.updatedAt,
      ],
    });
    sourceIdToNewId.set(p.sourceId, Number(result.lastInsertRowid));
  }

  // --- Painting tags ---
  console.log("Inserting painting tags...");
  let skipped = 0;
  for (const pt of data.paintingTags) {
    const newPaintingId = sourceIdToNewId.get(pt.paintingId);
    if (!newPaintingId) {
      skipped++;
      continue;
    }
    await client.execute({
      sql: "INSERT OR IGNORE INTO painting_tags (painting_id, tag_id, source, confidence) VALUES (?, ?, ?, ?)",
      args: [newPaintingId, pt.tagId, pt.source, pt.confidence],
    });
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} painting_tags (no matching painting)`);
  }

  // --- Verify ---
  const counts = await Promise.all([
    client.execute("SELECT COUNT(*) as c FROM paintings"),
    client.execute("SELECT COUNT(*) as c FROM tag_categories"),
    client.execute("SELECT COUNT(*) as c FROM tags"),
    client.execute("SELECT COUNT(*) as c FROM painting_tags"),
  ]);

  console.log("\n--- Verification ---");
  console.log(`Paintings: ${counts[0].rows[0].c}`);
  console.log(`Tag categories: ${counts[1].rows[0].c}`);
  console.log(`Tags: ${counts[2].rows[0].c}`);
  console.log(`Painting tags: ${counts[3].rows[0].c}`);
  console.log("\nMigration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
