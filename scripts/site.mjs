// What the published site is made of. GitHub Pages serves the repository root of main
// ("Deploy from a branch"), so the built files live at the root, next to src/.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export const SITE = 'https://gptimus.github.io/salle-comble/';

// Short hash of the page source: the build stamp, and how check.mjs spots a stale root.
export const sourceHash = (page) => createHash('sha256').update(page).digest('hex').slice(0, 7);

// Keep the sitemap date while the page is unchanged, so it only moves when content does.
export function lastmodFor(hash) {
  if (existsSync('index.html') && existsSync('sitemap.xml')) {
    const live = readFileSync('index.html', 'utf8').match(/<!-- build (\w+) · ([\d-]+) -->/);
    if (live && live[1] === hash) return live[2];
  }
  return new Date().toISOString().slice(0, 10);
}

// Root files generated from src/, as { path: contents }.
export function render(lastmod = lastmodFor(sourceHash(readFileSync('src/index.html')))) {
  const page = readFileSync('src/index.html', 'utf8');
  if (!page.startsWith('<!doctype html>')) throw new Error('src/index.html must start with <!doctype html>');
  const hash = sourceHash(page);
  return {
    'index.html': page.replace('</head>', `<!-- build ${hash} · ${lastmod} -->\n</head>`),
    'og.png': readFileSync('src/og.png'),
    '.nojekyll': '',
    'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`,
    'sitemap.xml':
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${SITE}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
  };
}
