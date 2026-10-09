# klipper-syntax

Syntax highlighting for [Klipper](https://www.klipper3d.org/) `printer.cfg`: the config itself, the G-code inside `gcode:` macros, Klipper's single-brace Jinja2 dialect, and (VS Code) sliced `.gcode` files. No language server, no network, nothing to configure.

**Pairs with [Klipper Language Server](https://github.com/digidude/klipper-ls)** (`klipper-ls`): hover docs, go-to-definition and macro awareness, built on this grammar. Each works without the other; the two extensions are named and listed as a pair (*Klipper Syntax*, *Klipper Language Server*).

| | Where | Engine |
|---|---|---|
| [`grammar/`](grammar) | tree-sitter grammar with an external scanner | the source of truth |
| [`zed/`](zed) | Zed extension "Klipper" | the grammar + `highlights.scm` |
| [`vscode/`](vscode) | VS Code extension "Klipper Syntax" | TextMate grammars (`klipper`, `gcode`) |

Why two engines: Zed highlights from a real parse tree. VS Code's built-in highlighting is TextMate, which is regex-per-line; a tree-sitter grammar can't be loaded into it. The TextMate grammar is therefore an approximation, and [`vscode/scripts/parity.mjs`](vscode/scripts/parity.mjs) measures how close it stays to the tree-sitter queries on real configs.

What gets colored, and why: [docs/highlighting.md](docs/highlighting.md).

## What it understands

- **Config:** sections (macro names colored like their call sites), options, numbers, booleans, paths, multi-line values, the `#*#` SAVE_CONFIG block.
- **Pins as one token:** `^!EBBCan:PB6`, `P1.24`, `gpio0_27`, `EXP1_5`, `tmc2209_stepper_x:virtual_endstop`; the `^ ! ~` modifiers are picked out.
- **G-code in macros:** in `gcode:` and every `*_gcode:`, commands, `KEY=value`, `X10` and `S{BED}`.
- **Jinja2, Klipper's dialect:** `{expr}`, `{% … %}`, `{# … #}`; `params`/`rawparams`/`printer`, `action_*()`; known filters and tests are colored and a typo like `|integer` stays plain.

## Install

- **VS Code:** see [vscode/README.md](vscode/README.md).
- **Zed:** see [zed/README.md](zed/README.md).

## Develop

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits and license

MIT. Several ideas (pin structure, the filter list, paths) come from [dannymcgee/vscode-klipper](https://github.com/dannymcgee/vscode-klipper) (MIT), which is also a fine choice for VS Code if you want its snippets and extras. Klipper and its documentation are GPL-3.0 and are not part of this repository.
