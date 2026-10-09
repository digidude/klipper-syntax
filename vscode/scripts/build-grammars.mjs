// Writes syntaxes/*.tmLanguage.json from syntaxes-src/*.mjs.
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'syntaxes-src');

for (const file of readdirSync(src).filter((f) => f.endsWith('.mjs'))) {
  const { default: grammar } = await import(pathToFileURL(path.join(src, file)));
  const out = path.join(root, 'syntaxes', file.replace(/\.mjs$/, '.tmLanguage.json'));
  writeFileSync(out, JSON.stringify(grammar, null, 2) + '\n');
  console.log('wrote', path.relative(root, out));
}
