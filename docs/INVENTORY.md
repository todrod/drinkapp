# Importing and editing inventory

In **My bar**, use **Import list** to choose a file or paste a list. Importing
adds to the current local bar after a preview. Files are read on the device;
there is no upload server or AI service. Existing bar backups still work.

## List formats

- TXT: one name per line; bullets and numbered lists are accepted. A simple
  comma-separated list also works.
- CSV/TSV: use a **Name** column. Optional columns are **Category**, **Level**,
  **Brand** and **Catalog** (a catalog ID or exact catalog type name). Reordered
  headers, quoted commas, escaped quotes, embedded line breaks, UTF-8 BOM and
  semicolon-separated CSV exports work. Export Excel/Numbers sheets as CSV.
- JSON: an array of strings or objects with `name`, optional `category`, `level`,
  `brand`, `catalogItemId`; `{ "inventory": [...] }`, `{ "kit": [...] }` and a
  Shaker backup's `data.kit` are also accepted. This flow imports inventory only;
  use local-bar backup tools to restore recipes, history and party plans too.
- Images, PDFs and Excel workbooks are not parsed. Maximum: 1 MB and 500 rows
  per import, with up to 1,000 inventory rows per local bar in bulk operations.

Example CSV:

```csv
Name,Category,Level,Brand
Tanqueray Gin,beverage,low,Tanqueray
Lime juice,mixer,full,
My citrus syrup,sweet,half,House
```

Levels are `full`, `half`, `low`, `out`. Categories are `beverage`, `mixer`,
`garnish`, `flavor`, `ice`, `glass`, `sweet`, `tool`, `vibe`. The preview flags
invalid rows, unknown categories/types and unknown stock levels. Invalid item
names are skipped; unknown stock levels default to Full with a warning.

Exact normalized catalog names and known bottle names from the bundled bar link
to recipe types. No fuzzy guess maps an unfamiliar or alcohol-free bottle to an
alcoholic spirit. Unknown names remain custom. Use **Edit** in the preview to
choose a recipe type, category, stock level or brand before adding. A linked
type supplies its category, icon and staple flag; incoming IDs, timestamps and
staple flags are ignored. Newly imported rows get their own local IDs.

Repeated names in a list and names already in the current bar are skipped,
including case/accent/punctuation variants. Existing stock levels and brands
are not overwritten. Distinct named bottles can share a catalog type. Uncheck
rows to omit them; previewing, editing the preview or cancelling never changes
inventory. The final add action validates all selected rows again.

## Edit, remove and clear

**Edit inventory** opens a searchable manager. Select individual rows or all
matching rows to remove a group. Each row also has Edit and Remove. Bottle
cards have **Edit item** for direct access. The editor changes name, brand,
remaining stock, category and recipe type while retaining its row ID and
creation time. Duplicate names are rejected. Out-of-stock rows immediately
stop satisfying inventory-based recipes.

**Clear all inventory** asks for confirmation and names the current bar and
item count. It affects only that bar's inventory. Recipes, preferences,
shopping lists, party menus and other local bars stay saved. The last removal
or clear can be undone from the manager or the My bar toast. Undo lasts while
the My bar screen remains mounted; switching tabs/bars, reloading or closing
the app ends it. Export a local-bar backup for longer-term recovery.

## Persistence and checks

Bulk import, edit, remove, clear and undo use `replaceKit`. Web writes the kit
in one localStorage operation, retaining legacy default-bar keys. SQLite uses
a transaction limited to the inventory table. A failed write leaves the saved
inventory intact and reports an error before updating the UI. The profile-bound
adapter retains the originating bar ID. No schema or dependency change.

All 97 tests, typecheck and web/Android/iOS exports pass. Thirteen inventory
tests cover parsers, validation, deterministic catalog matching, duplicate
names, Unicode identity, edits, limits, removal/undo and recipe eligibility.
Persistence tests verify atomic failure, named/legacy bar isolation, real SQLite
rollback and preservation of menus, recipes and shopping. Browser checks at
320/390 px cover a real CSV upload, preview edits/type selection, pasted lists,
omitted rows, duplicates, cancellation, manual edits, filtered bulk selection,
single/bulk removal, clear confirmation/cancellation, undo and refresh survival.
Native file-picker interaction remains a physical-device check.
