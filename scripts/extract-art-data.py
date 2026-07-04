"""Extract art data from the local SQLite database to JSON for migration."""
import sqlite3
import json
import re

db = sqlite3.connect("D:/ByRachelPierce_Backup/ArtDatabase/art_collection.db")
db.row_factory = sqlite3.Row
cur = db.cursor()

# --- Paintings (skip 3 without web images) ---
rows = cur.execute("""
    SELECT id, title, medium, format_type, location, physical_size,
           availability, series, notes, width_px, height_px, orientation,
           web_image_path, thumb_path, created_at, updated_at
    FROM paintings
    WHERE web_image_path IS NOT NULL AND web_image_path != ''
    ORDER BY id
""").fetchall()

def make_slug(title, web_image_path):
    """Generate slug from web_image_path by stripping hash suffix and extension."""
    # web_image_path looks like "web/some-title-here-a1b2c3d4.jpg"
    filename = web_image_path.split("/")[-1]  # "some-title-here-a1b2c3d4.jpg"
    name = filename.rsplit(".", 1)[0]          # "some-title-here-a1b2c3d4"
    # Strip the 8-char hash suffix
    slug = re.sub(r"-[a-f0-9]{8}$", "", name)
    return slug

# Build slugs, handling collisions
slug_counts = {}
paintings = []
for r in rows:
    base_slug = make_slug(r["title"], r["web_image_path"])
    if base_slug in slug_counts:
        slug_counts[base_slug] += 1
        slug = f"{base_slug}-{slug_counts[base_slug]}"
    else:
        slug_counts[base_slug] = 1
        slug = base_slug

    paintings.append({
        "sourceId": r["id"],
        "title": r["title"],
        "slug": slug,
        "medium": r["medium"] or None,
        "formatType": r["format_type"] or None,
        "location": r["location"] or None,
        "physicalSize": r["physical_size"] or None,
        "availability": r["availability"] or None,
        "series": r["series"] or None,
        "notes": r["notes"] or None,
        "widthPx": r["width_px"],
        "heightPx": r["height_px"],
        "orientation": r["orientation"] or None,
        "webImagePath": r["web_image_path"],
        "thumbPath": r["thumb_path"],
        "createdAt": r["created_at"],
        "updatedAt": r["updated_at"],
    })

# Check for duplicate slugs after collision handling
final_slugs = [p["slug"] for p in paintings]
assert len(final_slugs) == len(set(final_slugs)), "Duplicate slugs found!"

# --- Tag categories ---
tag_categories = [
    dict(r) for r in cur.execute("SELECT id, name, sort_order FROM tag_categories ORDER BY sort_order").fetchall()
]

# --- Tags ---
tags = [
    dict(r) for r in cur.execute("SELECT id, category_id, name, sort_order FROM tags ORDER BY id").fetchall()
]

# --- Painting tags (only for paintings with web images) ---
valid_painting_ids = {p["sourceId"] for p in paintings}
all_pt = cur.execute("SELECT painting_id, tag_id, source, confidence FROM painting_tags").fetchall()
painting_tags = [
    {"paintingId": r["painting_id"], "tagId": r["tag_id"], "source": r["source"], "confidence": r["confidence"]}
    for r in all_pt if r["painting_id"] in valid_painting_ids
]

output = {
    "paintings": paintings,
    "tagCategories": tag_categories,
    "tags": tags,
    "paintingTags": painting_tags,
}

print(json.dumps(output))
