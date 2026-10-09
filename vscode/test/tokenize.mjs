// Tokenizes text with the shipped grammars, the way VS Code does.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const wasm = readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer;
const onig = oniguruma.loadWASM(wasm).then(() => ({
  createOnigScanner: (p) => new oniguruma.OnigScanner(p),
  createOnigString: (s) => new oniguruma.OnigString(s),
}));

const files = {
  'source.klipper': 'syntaxes/klipper.tmLanguage.json',
  'source.gcode': 'syntaxes/gcode.tmLanguage.json',
};

const registry = new vsctm.Registry({
  onigLib: onig,
  loadGrammar: async (scope) => {
    const f = files[scope];
    if (!f) return null;
    return vsctm.parseRawGrammar(readFileSync(path.join(root, f), 'utf8'), f);
  },
});

/** @returns {Promise<{text:string, scopes:string[], line:number, start:number}[]>} */
export async function tokenize(text, scope = 'source.klipper') {
  const grammar = await registry.loadGrammar(scope);
  const out = [];
  let state = vsctm.INITIAL;
  text.split('\n').forEach((line, i) => {
    const r = grammar.tokenizeLine(line, state);
    for (const t of r.tokens) {
      out.push({
        text: line.slice(t.startIndex, t.endIndex),
        scopes: t.scopes,
        line: i,
        start: t.startIndex,
      });
    }
    state = r.ruleStack;
  });
  return out;
}

/** Scope of the first token whose text is `needle` (innermost scope first). */
export function scopeOf(tokens, needle, nth = 0) {
  const hits = tokens.filter((t) => t.text === needle);
  const t = hits[nth];
  if (!t) throw new Error(`no token ${JSON.stringify(needle)} in: ${tokens.map((x) => x.text).join('|')}`);
  return t.scopes.slice(1).reverse();
}
