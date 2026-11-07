// Static checks on the built page, run before the browser tests.
import { existsSync, readFileSync } from 'node:fs';
import { render } from './site.mjs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const html = readFileSync('index.html', 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Inline script compiles.
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!inline.length) fail('no inline <script> found');
inline.forEach((code, i) => {
  try {
    new vm.Script(code, { filename: `inline-${i}.js` });
  } catch (e) {
    fail(`inline script ${i}: ${e.message}`);
  }
});

// 2. Every external script is pinned to an exact version, listed below with its trusted
//    SRI digest, and the page carries that exact digest. In CI (or with --online) each
//    file is also downloaded and hashed, so a wrong pinned digest fails here, not in the browser.
const TRUSTED_SRI = {
  'https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js':
    'sha384-vV17nr/rMaJqmeZkFUzXLpHdQ+ME5QHKdydaqqN+3Ga39RJlNrTatJxHwGV4ml2C',
  'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js':
    'sha384-I0DMsfimAPIqWT8lF+oA997gRgdUi3jhidoTq3fN0zmn35smXZukD01FLnsPRU9i',
};
const online = !!process.env.CI || process.argv.includes('--online');
for (const [tag] of html.matchAll(/<script src="[^"]+"[^>]*>/g)) {
  const src = tag.match(/src="([^"]+)"/)[1];
  if (!/@\d+\.\d+\.\d+\//.test(src)) fail(`unpinned script: ${src}`);
  if (!/crossorigin="anonymous"/.test(tag)) fail(`missing crossorigin: ${src}`);
  const integrity = tag.match(/integrity="([^"]+)"/)?.[1];
  const trusted = TRUSTED_SRI[src];
  if (!integrity) fail(`missing integrity: ${src}`);
  else if (!trusted) fail(`no trusted digest listed in check.mjs for ${src}`);
  else if (integrity !== trusted) fail(`integrity mismatch for ${src}: page has ${integrity}, expected ${trusted}`);
  if (online && trusted) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const [algo] = trusted.split('-');
      const actual = `${algo}-` + createHash(algo).update(Buffer.from(await res.arrayBuffer())).digest('base64');
      if (actual !== trusted) fail(`served file does not match trusted digest: ${src} is ${actual}`);
    } catch (e) {
      fail(`could not verify ${src}: ${e.message}`);
    }
  }
}

// 3. Steps are consistent: one section per step, numbered 1..N, each with its capacity readout.
const sections = [...html.matchAll(/<section class="step" id="etape-(\d+)" data-step="(\d+)">/g)];
const n = sections.length;
if (n < 1) fail('no step sections found');
sections.forEach(([, id, idx], i) => {
  if (+id !== i + 1 || +idx !== i) fail(`step ${i + 1}: id etape-${id}, data-step ${idx}`);
  if (!html.includes(`data-cap="${i}"`)) fail(`step ${i + 1}: missing data-cap="${i}"`);
});
const stepsInJs = (html.match(/\{ short: '/g) || []).length;
if (stepsInJs !== n) fail(`STEPS has ${stepsInJs} entries, page has ${n} sections`);
if (!html.includes(`repeat(${n}, minmax(0, 1fr))`)) fail(`stepnav grid is not repeat(${n})`);
if (!html.includes(`INFRA-${n}`)) fail(`cover code is not INFRA-${n}`);
if (!new RegExp(`<title>[^<]*${n} étapes`).test(html)) fail(`<title> does not say ${n} étapes`);

// 4. Internal links point at existing anchors, data-go matches the anchor.
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!target.includes('${') && !ids.has(target)) fail(`broken anchor #${target}`);
}
for (const [, target, go] of html.matchAll(/href="#etape-(\d+)" data-go="(\d+)"/g)) {
  if (+target !== +go + 1) fail(`#etape-${target} has data-go="${go}"`);
}

// 5. Every element id referenced by $('#…') exists.
for (const [, id] of html.matchAll(/\$\('#([\w-]+)'\)/g)) {
  if (!ids.has(id)) fail(`script uses #${id}, not in the page`);
}

// 6. SEO basics and generated files.
for (const needle of ['<link rel="canonical"', 'property="og:image"', 'application/ld+json', 'name="description"']) {
  if (!html.includes(needle)) fail(`missing ${needle}`);
}
for (const f of ['og.png', 'robots.txt', 'sitemap.xml', '.nojekyll']) if (!existsSync(f)) fail(`missing ${f}`);

// 7. The published root matches src/: GitHub Pages serves these files as committed.
const stamp = html.match(/<!-- build \w+ · ([\d-]+) -->/);
if (!stamp) fail('index.html has no build stamp: run npm run build');
else {
  for (const [path, want] of Object.entries(render(stamp[1]))) {
    if (!existsSync(path) || !readFileSync(path).equals(Buffer.from(want))) {
      fail(`${path} is out of date with src/: run npm run build and commit the result`);
    }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`✓ checks passed: ${n} steps, SRI ${online ? 'verified online' : 'matched pinned digests'}, ${inline.length} inline script(s), ${ids.size} ids`);
