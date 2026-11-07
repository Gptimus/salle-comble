// Builds the static site into dist/: copies the page and its assets,
// stamps the build, and generates robots.txt and sitemap.xml.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SITE = 'https://gptimus.github.io/salle-comble/';
const SRC = 'src';
const OUT = 'dist';

function git(cmd, fallback) {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
}

const sha = process.env.GITHUB_SHA?.slice(0, 7) || git('rev-parse --short HEAD', 'local');
// Last change to the page itself, so the sitemap date only moves when content does.
const lastmod = git(`log -1 --format=%cs -- ${SRC}/index.html`, '') || new Date().toISOString().slice(0, 10);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(SRC, OUT, { recursive: true });

const page = readFileSync(`${SRC}/index.html`, 'utf8');
if (!page.startsWith('<!doctype html>')) throw new Error('src/index.html must start with <!doctype html>');
writeFileSync(`${OUT}/index.html`, page.replace('</head>', `<!-- build ${sha} · ${lastmod} -->\n</head>`));

writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
writeFileSync(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${SITE}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
);

console.log(`Built ${OUT}/ (${sha}, page last changed ${lastmod})`);
