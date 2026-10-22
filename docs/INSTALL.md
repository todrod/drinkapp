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
the separate local inventory store. Native imports use a no-op install hook.

## Verification

All 65 tests, typecheck and web/Android/iOS exports pass. Eight install/PWA tests
cover early event capture, synchronous activation, single-use events, concurrent
taps, accepted/dismissed/error outcomes, old `userChoice` promises, cooldowns,
Apple device detection, installed states, unavailable storage and build cache
generation/failure behavior. Browser checks at 320/390 px cover the visible
button, selectable device instructions and backup shortcut. A first-visit cache
reloaded and selected a recipe after stopping that origin's server. Browser
install confirmations use mocked events in tests; physical-device installation
remains a phone check.
