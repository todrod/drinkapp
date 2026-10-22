# Installing Drink Shaker

The website installs as a web app with a home-screen/app-list icon, a standalone
window and cached recipes. No app-store account, APK download or storage server
is required. **Install app** is always available on Discover when the site is
not running as an installed app.

## Visitor flow

- Chromium browsers: when the browser supplies `beforeinstallprompt`, the install
  sheet offers **Install on this device**. The tap directly opens the browser's
  confirmation dialog. Dismissals and errors keep manual steps available.
- iPhone/iPad: the sheet explains Safari's Share → Add to Home Screen flow,
  including the optional Open as Web App setting. Device instructions can also
  be selected manually for Android or computer browsers.
- An eligible visitor sees a non-blocking suggestion after ten seconds on
  Discover, after the age gate. It is hidden behind other overlays and on guest
  menus. **Not now**, opening install help, or starting a native browser prompt
  snoozes the suggestion for seven days in this browser. The install button stays.
- Standalone display mode, iOS `navigator.standalone` and `appinstalled` suppress
  suggestions. An accepted browser prompt is not treated as a confirmed install.

The browser decides whether a native install dialog is available. Embedded
browsers may require opening the site in Safari, Chrome or Edge. Instructions
follow [MDN's install-prompt lifecycle](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
and [Apple's Home Screen guidance](https://support.apple.com/en-my/guide/iphone/iph42ab2f3a7/ios).

## Existing inventory

An installed app can have separate storage, especially on Apple devices. The
install sheet's **Back up my bar** action opens existing local backup tools.
Export before installing and restore the file if the installed app opens empty.
Inventory, recipes and party data are not uploaded or migrated automatically.
Install-suggestion preferences are browser-level, separate from bar backups.

## Offline delivery

`npm run build:web` runs `postbuild.mjs`, which injects install metadata and
generates a worker asset list from exported code, fonts and graphics. Its cache
name incorporates the current HTML and asset paths. All release assets and app
icons must cache successfully before the new worker activates. A failed install
keeps the previous worker; activation removes old asset caches without touching
the separate local inventory store. Cleanup is limited to Shaker cache names.
Native imports use no-op install/update hooks.

## Updating without closing the app

- Visible, online windows check every minute, and check again when focused,
  foregrounded or reconnected. `/sw.js` bypasses HTTP caching. Download and
  precaching happen in the background; a failed download never offers a ready
  update or displaces the previous worker.
- On Discover, **Update available** offers **Update now** and **Later**. Other
  screens, guest menus, overlays, the age gate and storage errors suppress it.
  Later leaves a compact **Update available · Update now** action for this
  session. A different release gets a new invitation. Install suggestions wait
  while an update is available.
- Update now activates the waiting worker, then refreshes this window once.
  Your saved local bar, recipes, preferences and party plans remain. Unsaved
  search/filter/selection state can reset. Activation failures show a retry.
  Already-downloaded updates can apply offline using their cached HTML/assets.
- Another window's activation never forces this window to reload. It offers
  its own manual update. HTML and workers exchange build identifiers so a fresh
  page already on the latest release never shows a redundant update prompt.
- Existing windows from before this feature need one refresh to receive it.
  Future releases use the in-app prompt. Phone operating systems can suspend
  background apps; checks resume when the app becomes active.

Worker messages follow the browser's [skipWaiting lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)
and explicit [registration update checks](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update).
The offline index belongs to its worker's precached release; network navigation
does not overwrite it with HTML from an incompletely downloaded future release.

## Verification

All 75 tests, typecheck and web/Android/iOS exports pass. Eighteen install/PWA/update tests
cover early event capture, synchronous activation, single-use events, concurrent
taps, accepted/dismissed/error outcomes, old `userChoice` promises, cooldowns,
Apple device detection, installed states, unavailable storage and build cache
generation/failure behavior, explicit activation, first installs, fresh pages,
multi-window activation, deferral, retry, deduplicated checks and cleanup.
Browser checks at 320/390 px cover the visible
button, selectable device instructions and backup shortcut. A first-visit cache
reloaded and selected a recipe after stopping that origin's server. Browser
install confirmations use mocked events in tests. Two local release transitions
verified update detection without refreshing, Later, overlay suppression,
no forced reload in another window and no prompt on an already-current page.
After stopping the origin server, the update button loaded the new cached
release with all eight test ingredients and the named Daiquiri party menu
intact. Random selection still worked. Physical-device installation and
installed iOS/Android foreground/update behavior remain phone checks.
