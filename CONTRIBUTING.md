# Contributing

Contributions are accepted under the project's MIT licence. Never paste Klipper or Marlin documentation into the repo, and keep test fixtures in your own words.

## Layout

```
grammar/          tree-sitter-klipper: grammar.js, src/scanner.c, src/parser.c (generated, committed), test/corpus
zed/              Zed extension: extension.toml, languages/klipper/*.scm
vscode/           VS Code extension: syntaxes-src/*.mjs -> syntaxes/*.tmLanguage.json (generated, committed)
docs/             highlighting.md: the token-to-color guide for both editors
scripts/          check-zed-pin.sh
```

Node 22+ for all of it.

## Grammar

```sh
cd grammar && npm install
npx tree-sitter generate          # after editing grammar.js; commit the regenerated src/
npx tree-sitter test
npx tree-sitter parse --quiet --stat path/to/*.cfg    # expect 0 errors
```

`klipper-ls` compiles `grammar/src/{parser,scanner}.c` into its binary, so a grammar change is a change to that project too: bump its submodule pin.

How it's parsed (line continuations, the external scanner, why Jinja is in the grammar and not injected) is explained in the header of `grammar/src/scanner.c` and in klipper-ls's CONTRIBUTING.

## Zed

Edit `zed/languages/klipper/*.scm`, then in Zed run **zed: install dev extension** and pick `zed/` (the first time), **zed: rebuild dev extension** after. Zed builds the grammar from `repository`/`rev` in `zed/extension.toml`, so for local iteration point `repository` at `file:///path/to/klipper-syntax` and set `rev` to a local commit; never commit that. For release, push, then set `rev` to the pushed commit and run `scripts/check-zed-pin.sh`.

Colors are theme-dependent: prefer captures most themes define (`attribute`, `keyword`, `function`, `type`, `constant`, `string.special`) and update [docs/highlighting.md](docs/highlighting.md) with every `highlights.scm` change.

## VS Code

Edit `vscode/syntaxes-src/*.mjs` (regexes written with `String.raw`), never the generated JSON.

```sh
cd vscode && npm install
npm test                                  # builds the JSON, runs test/*.test.mjs
node scripts/parity.mjs path/to/*.cfg     # agreement with the tree-sitter queries
SHOW=5 WHERE=number node scripts/parity.mjs path/to/*.cfg   # list each disagreement of one capture
```

`parity.mjs` runs every capture tree-sitter assigns (later pattern wins) and checks the TextMate token at the same position carries a compatible scope. It needs real configs: use your own `printer.cfg` and a few macro packs (Mainsail/Fluidd macros). Expect 98-100% per category; a drop after a change is a regression. A few differences are deliberate and not worth chasing (tree-sitter quirks, such as splitting `104NT-4` into a number and text).

To try the extension: open `vscode/` in VS Code and press F5 (Extension Development Host), or `npm run package` and install the `.vsix`.

## Releasing

Tag `vX.Y.Z`. Bump `version` in `zed/extension.toml` and `vscode/package.json` first; both ship from the same tag and share the grammar.

- **VS Code:** `cd vscode && npm run package`, then `vsce publish` with a Marketplace token for the `digidude` publisher (and `ovsx publish` for Open VSX, which VSCodium and Cursor read).
- **Zed:** PR to [zed-industries/extensions](https://github.com/zed-industries/extensions): add this repo as a submodule under `extensions/klipper` and an entry in `extensions.toml`:

  ```toml
  [klipper]
  submodule = "extensions/klipper"
  path = "zed"
  version = "0.1.0"
  ```
