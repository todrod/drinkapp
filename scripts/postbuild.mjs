/**
 * Post-export step: make dist/index.html installable.
 *
 * Expo generates index.html itself and the bundle filename is content-hashed,
 * so overriding the template via public/index.html would mean hard-coding a
 * name that changes every build. Injecting into the generated file instead
 * keeps Expo in charge of the script tag.
 *
 * Idempotent — running it twice does not duplicate the tags.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const INDEX = join(process.cwd(), 'dist', 'index.html');
const MARKER = '<!-- pwa:injected -->';

const HEAD = `${MARKER}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0B0C12" />
    <meta name="color-scheme" content="dark" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Shaker" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" href="/favicon.png" type="image/png" />
    <meta name="description" content="Your bar inventory, a generator that only pours what you own, and a drink book that works offline." />`;

const BODY = `    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>`;

const html = await readFile(INDEX, 'utf8');

if (html.includes(MARKER)) {
  console.log('postbuild: already injected, nothing to do');
  process.exit(0);
}

if (!html.includes('</head>') || !html.includes('</body>')) {
  console.error('postbuild: dist/index.html has no </head> or </body> — Expo template changed?');
  process.exit(1);
}

const out = html
  .replace('</head>', `${HEAD}\n  </head>`)
  .replace('</body>', `${BODY}\n  </body>`);

await writeFile(INDEX, out, 'utf8');
console.log('postbuild: injected manifest, iOS meta tags and service worker registration');
