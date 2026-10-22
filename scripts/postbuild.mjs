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
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const INDEX = join(process.cwd(), 'dist', 'index.html');
const MARKER = '<!-- pwa:injected -->';

const HEAD = `${MARKER}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#050505" />
    <meta name="color-scheme" content="dark" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Shaker" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" href="/favicon.png" type="image/png" />
    <meta name="description" content="Explore cocktail recipes, pick a surprise, or find drinks from your bar. Works offline." />`;

// Strip only our version tag before hashing so rerunning postbuild is stable.
const html = (await readFile(INDEX, 'utf8')).replace(/<meta name="shaker-build" content="[^"]*"\s*\/>/, '');

if (!html.includes('</head>') || !html.includes('</body>')) {
  console.error('postbuild: dist/index.html has no </head> or </body> — Expo template changed?');
  process.exit(1);
}

const out = html.includes(MARKER) ? html : html
  .replace('</head>', `${HEAD}\n  </head>`);

async function exportedFiles(relative) {
  const entries = await readdir(join(process.cwd(), 'dist', relative), { withFileTypes: true });
  const paths = await Promise.all(entries.map((entry) => {
    const name = `${relative}/${entry.name}`;
    return entry.isDirectory() ? exportedFiles(name) : ['/' + name];
  }));
  return paths.flat();
}
const assets = (await Promise.all(['_expo', 'assets'].map(exportedFiles))).flat().sort();
const worker = await readFile(join(process.cwd(), 'public', 'sw.js'), 'utf8');
const manifest = await readFile(join(process.cwd(), 'dist', 'manifest.webmanifest'), 'utf8');
const version = createHash('sha256').update(out).update(JSON.stringify(assets)).update(worker).update(manifest).digest('hex').slice(0, 12);
await writeFile(INDEX, out.replace('</head>', `<meta name="shaker-build" content="shaker-v4-${version}" /></head>`), 'utf8');
if (!worker.includes('/* pwa:precache */ []') || !worker.includes("'shaker-v4-install'")) {
  throw new Error('Service worker build markers are missing.');
}
await writeFile(join(process.cwd(), 'dist', 'sw.js'), worker
  .replace("'shaker-v4-install'", `'shaker-v4-${version}'`)
  .replace('/* pwa:precache */ []', JSON.stringify(assets)), 'utf8');
console.log(`postbuild: install metadata ready; precaching ${assets.length} assets for ${version}`);
