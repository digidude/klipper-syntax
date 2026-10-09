// Compares the TextMate grammar with the tree-sitter highlight queries on real
// files: for every capture tree-sitter assigns (later pattern wins), does the
// token at the same position carry a compatible TextMate scope?
//
//   node scripts/parity.mjs path/to/*.cfg
//
// Needs the tree-sitter CLI (grammar/node_modules) and Node 22+.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from '../test/tokenize.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const grammarDir = path.resolve(here, '../../grammar');
const queries = path.resolve(here, '../../zed/languages/klipper/highlights.scm');
const ts = path.join(grammarDir, 'node_modules/.bin/tree-sitter');

// capture -> TextMate scope prefixes that count as agreement. Captures not
// listed (variable, punctuation.*) are left to the editor and not compared.
const EXPECT = {
  comment: ['comment.'],
  'comment.doc': ['comment.'],
  type: ['entity.name.type.section'],
  function: ['entity.name.function', 'support.function'],
  'function.builtin': ['support.function.builtin'],
  property: ['support.type.property-name', 'variable.other.property'],
  'variable.special': ['variable.other.property.template', 'variable.language'],
  'variable.parameter': ['variable.parameter'],
  string: ['string.'],
  'string.special': ['string.other.path'],
  constant: ['constant.'],
  number: ['constant.numeric'],
  operator: ['keyword.operator'],
  keyword: ['keyword.'],
  attribute: ['variable.parameter'],
};

const files = process.argv.slice(2);
const miss = new Map(); // capture -> [{file,line,col,text,got}]
const total = new Map();

for (const file of files) {
  let out;
  try {
    out = execFileSync(ts, ['query', queries, file], { cwd: grammarDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
  } catch (e) {
    console.error('tree-sitter failed on', file);
    continue;
  }
  // Later patterns override earlier ones for the same range.
  const final = new Map();
  let pattern = -1;
  for (const line of out.split('\n')) {
    let m = line.match(/^\s+pattern: (\d+)/);
    if (m) { pattern = +m[1]; continue; }
    m = line.match(/capture: \d+ - ([\w.]+), start: \((\d+), (\d+)\), end: \((\d+), (\d+)\), text: `(.*)`/);
    if (!m || m[1].startsWith('_')) continue;
    const key = `${m[2]}:${m[3]}-${m[4]}:${m[5]}`;
    const prev = final.get(key);
    if (!prev || pattern >= prev.pattern) final.set(key, { pattern, cap: m[1], line: +m[2], col: +m[3], text: m[6] });
  }
  const tokens = await tokenize(readFileSync(file, 'utf8'));
  const byLine = new Map();
  for (const t of tokens) (byLine.get(t.line) ?? byLine.set(t.line, []).get(t.line)).push(t);

  for (const c of final.values()) {
    const want = EXPECT[c.cap];
    if (!want) continue;
    const tok = (byLine.get(c.line) ?? []).find((t) => t.start <= c.col && c.col < t.start + t.text.length);
    const scopes = tok ? tok.scopes.slice(1) : [];
    const ok = scopes.some((s) => want.some((w) => s.startsWith(w)));
    total.set(c.cap, (total.get(c.cap) ?? 0) + 1);
    if (!ok) {
      if (!miss.has(c.cap)) miss.set(c.cap, []);
      miss.get(c.cap).push({ file: path.basename(file), line: c.line + 1, col: c.col, text: c.text.slice(0, 40), got: scopes.slice(-2).join(' < ') });
      if (process.env.WHERE === c.cap) console.log(`${file}:${c.line + 1}:${c.col + 1}  ${c.text.slice(0, 50)}`);
    }
  }
}

let bad = 0;
for (const [cap, n] of [...total].sort()) {
  const m = miss.get(cap) ?? [];
  bad += m.length;
  console.log(`${cap.padEnd(20)} ${String(n - m.length).padStart(7)} / ${String(n).padEnd(7)} ${(100 * (n - m.length) / n).toFixed(1)}%`);
}
const show = Number(process.env.SHOW ?? 3);
for (const [cap, m] of miss) {
  console.log(`\n${cap}: ${m.length} differ`);
  const seen = new Map();
  for (const x of m) { const k = x.text + '|' + x.got; seen.set(k, (seen.get(k) ?? 0) + 1); }
  [...seen].sort((a, b) => b[1] - a[1]).slice(0, show * 3).forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}x ${k}`));
}
process.exitCode = 0;
