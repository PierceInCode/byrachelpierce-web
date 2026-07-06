# Content Intake — how Rachel's real content enters the site

This folder is the **only** pipeline by which real content enters the system
(Architecture §7). The operator and Rachel fill the two CSVs below; the R4
ingest script (`scripts/ingest-content.ts`) reads them, shows a dry-run change
plan, and — on an explicit `--apply` run from the operator's machine, after a
backup — writes the changes.

You can start filling these **now**. The code that consumes them is built in
parallel; nothing here depends on the code being finished first.

---

## 1. `murals.csv` — the 14 Sanibel murals

One row per mural. Columns, **exactly** (do not add, remove, or reorder):

| Column | Meaning |
|---|---|
| `id` | 1–14, already filled in — matches the mural in `src/lib/mural-data.ts`. **Do not change.** |
| `real_name` | The mural's real name/title in Rachel's words. |
| `description` | 1–2 sentences in Rachel's voice. |
| `year_painted` | 4-digit year, or leave blank if unknown. |
| `photo_filename` | Optional. Filename of a photo dropped into `docs/intake/mural-photos/`. |

Until Rachel supplies a real `real_name`/`description`/`year_painted`, the public
site shows only the **location business name** (already real) and hides the rest —
it never displays an invented title or year (Iron Invariant 3). Filling a cell
un-hides that field automatically.

**Which mural is which `id`** (location shown for reference only — it is *not* a
CSV column):

| id | Location |
|---|---|
| 1 | Lighthouse Cafe |
| 2 | Tortuga Beach Club |
| 3 | Loggerhead Cay |
| 4 | Sundial Beach Resort |
| 5 | Anchor Inn |
| 6 | Sanibel Holiday |
| 7 | Rachel Pierce Art Gallery |
| 8 | Sanibel Café |
| 9 | Sanibel Sprout |
| 10 | CVS Pharmacy |
| 11 | Shalimar Beach Resort |
| 12 | The SeaShells of Sanibel |
| 13 | SanCap Medical Center |
| 14 | Sanibel Fire Dept Station #172 |

---

## 2. `paintings.csv` — the 528 paintings

**Do not create this file by hand.** Run

```
npx tsx scripts/export-catalog-csv.ts
```

and it writes `docs/intake/paintings.csv` pre-filled with every current slug and
its current values, so you edit rather than retype. Columns, exactly:

| Column | Meaning |
|---|---|
| `slug` | Identifies the painting. **Do not change.** |
| `physical_size` | Free text, inches, width first — e.g. `24 x 36`, `24" x 36"`, `24in x 36in`. |
| `availability` | `Available`, `Sold`, or free text. Leave blank if unknown (renders as nothing). |
| `location` | Where it is / who has it. |
| `series` | Series name. |
| `notes` | Anything else. |

### The one rule that matters: **a blank cell means "no change."**

The ingest script never overwrites a value with blank. To *clear* a field, that
is a deliberate operation — ask; don't rely on emptying the cell.

`physical_size` is parsed into numeric `width_in` / `height_in` columns. Accepted
forms: `24x36`, `24 x 36`, `24" x 36"`, `24in x 36in`. Anything it can't parse is
**listed in the ingest report and left untouched — never guessed.** Fix the cell
and re-run.

### Quoting

If any value itself contains a comma, quote the whole cell: `"a, b"`. A literal
double-quote inside a quoted cell is doubled: `"she said ""hi"""`. Standard CSV —
Excel / Google Sheets do this for you on export.

---

## 3. Ritual (operator)

1. Fill the CSVs (this can happen while the code is still being built).
2. Dry run: `npx tsx scripts/ingest-content.ts --dry-run` → read the change plan.
3. Back up production, then `--apply` from your machine (OPERATOR-GUIDE R4).
4. Every run writes `docs/intake/ingest-report-<date>.md` — commit it.
5. Redeploy / merge → that deploy is the "publish" button (Architecture §7.4).
