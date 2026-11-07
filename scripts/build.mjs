// Builds the site from src/ into the repository root, which GitHub Pages publishes
// from main. Commit the generated files with the source change.
import { writeFileSync } from 'node:fs';
import { render } from './site.mjs';

const files = render();
for (const [path, contents] of Object.entries(files)) writeFileSync(path, contents);
console.log(`Built ${Object.keys(files).join(', ')} (${files['index.html'].match(/<!-- build (.+) -->/)[1]})`);
