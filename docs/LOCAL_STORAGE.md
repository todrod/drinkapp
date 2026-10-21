# Local bars and backups

Drink Shaker stores personal data on the device. Inventory, custom recipes,
favorites, ratings, preparation history, shopping lists, preferences and party
plans do not require an account or a storage server. Network access still
delivers the web app and opens source links or explicitly shared guest menus.

## Using it

Open **My bar → My local bars · switch · backup & restore**.

- Rename the current bar, or create another empty bar with the recipe library.
- Switch between up to 24 bars. Each has independent personal data. Switching
  also clears transient screen state so a draft or serving session cannot
  continue against the wrong inventory.
- **Export this bar to a backup file** saves a versioned JSON snapshot. On the
  phone app, the initial copy is inside the app; **Save a copy to Files or
  another app** opens the system share sheet so the user can keep it outside
  the app. On web, export starts an ordinary browser download.
- **Import a backup file** uses the device file picker, previews its name and
  counts, and asks the user to restore it. Restore always creates a new bar;
  it never replaces an existing one. Repeated names receive a numbered suffix.

Bars are convenient local setups, not password-protected accounts. Anyone
using the same app/browser profile can switch between them. Separate phones
and browser origins have separate storage and do not automatically sync.

Keep an exported backup outside the app before uninstalling, replacing a
phone, or clearing browser data. Browser persistent storage is requested only
through its explicit button; a browser may decline or not support it. Even a
grant does not prevent the user from clearing site data. Phone OS backups
follow the user's device settings; the app itself does not upload bar data.

## Storage layout and compatibility

- Native keeps the original `shaker.db` and schema v5. New bars use separate
  `shaker-bar-<safe-id>.db` SQLite files in Expo SQLite's default private app
  document location. The original database's `app_state` row
  `local-profiles:v1` stores names and the active bar. No new schema migration
  is required. Native backup copies use `Documents/BarBackups/<safe-id>/`.
- Web keeps existing `shaker:kit`, `shaker:recipes`, `shaker:shopping`,
  `shaker:prefs` and `shaker:party` keys readable as the default **My bar**.
  The index uses `shaker:local-profiles:v1`. Each new bar uses a single
  `shaker:profile:<safe-id>:state` JSON record. A full-save retry can also
  create `shaker:state` for the default bar, taking precedence over old keys.
- Seed recipes merge independently into each bar by ID. Existing recipe
  edits, history and inventory row IDs survive, including several bottles
  that share the same catalog ingredient.
- All provider writes capture a bar ID. A queued callback cannot write into
  whichever bar becomes active later. Import commits its complete new data
  before publishing its index entry: a native transaction or one atomic web
  storage write. Failed imports leave the previous active bar intact.

## Backup validation and recovery

Format is `drink-shaker-local-bar`, version 1, bounded to 4 MiB UTF-8 and
3,000 inventory items, recipes and shopping items each. Validation allowlists
fields and checks IDs, enums, measures, dates, history, source URL protocols,
party counts and duplicates before any import write. Alcohol classification
is recalculated. Name-only recipe drafts remain valid backup data. Age-gate
acceptance is omitted from files and cannot be imported from another device.
Both export and import run the same decoder.

Ordinary save failures leave the in-memory session usable and display a
storage warning with backup and retry actions. Switching bars is blocked until
the warning is resolved, avoiding loss of unsaved edits. A full snapshot retry
is atomic. Startup read failures show a recovery screen, preserve existing
storage, and retry reading rather than overwriting it with an empty bar.

## Verified on 21 October 2026

- `npm run typecheck`; all 46 tests from `npm test`.
- Web export and Android/iOS exports, including the native file APIs.
- Twelve local-storage tests cover legacy web keys, profile isolation,
  captured writes, a 116-item/144-recipe backup with edits/history, strict
  validation, quota failures, atomic retry, safe IDs and UTF-8 bounds. Native
  tests execute the adapter against real in-memory SQLite databases and
  verify failed-import rollback and independent database files.
- Browser flow on a separate local origin: rename, export a real file,
  create an empty bar, add stock, switch without mixing stock, import the
  downloaded file, preview and restore as another bar, reload persistence,
  reject malformed JSON, and show declined persistent-storage messaging.
- At 320 px and 390 px, names wrap or truncate appropriately without
  horizontal page overflow. A 57-character bar name remains usable.
- With the test HTTP server stopped, the cached PWA reopened, switched bars,
  added tonic water and retained it after reload.

Native DocumentPicker, Files/share-sheet destinations, OS backup behavior and
real-device storage-pressure recovery still need physical Android/iPhone
testing. Export success is not a claim that those platform UI flows were run
on this Windows workstation.
