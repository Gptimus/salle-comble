// Static checks on the built page, run before the browser tests.
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('dist/index.html', 'utf8');
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

// 2. Every external script is pinned to an exact version and has SRI.
for (const [tag] of html.matchAll(/<script src="[^"]+"[^>]*>/g)) {
  const src = tag.match(/src="([^"]+)"/)[1];
  if (!/@\d+\.\d+\.\d+\//.test(src)) fail(`unpinned script: ${src}`);
  if (!/integrity="sha(256|384|512)-/.test(tag)) fail(`missing integrity: ${src}`);
  if (!/crossorigin="anonymous"/.test(tag)) fail(`missing crossorigin: ${src}`);
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
for (const f of ['dist/og.png', 'dist/robots.txt', 'dist/sitemap.xml']) if (!existsSync(f)) fail(`missing ${f}`);

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`✓ checks passed: ${n} steps, ${inline.length} inline script(s), ${ids.size} ids`);
