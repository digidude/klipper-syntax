# Klipper Syntax

> **Pairs with [Klipper Language Server](https://github.com/digidude/klipper-ls):** this extension is how Klipper files *look*; the language server adds hover docs, go-to-definition and macro awareness. Each works without the other.

Syntax highlighting for [Klipper](https://www.klipper3d.org/) `printer.cfg` and its includes, the G-code and Jinja2 inside `[gcode_macro]` blocks, and sliced `.gcode` files. It is a declarative extension: no code runs, nothing to configure, and it works in VS Code for the Web and in VSCodium/Cursor.

## What's colored

- **Config:** sections (macro names colored like their call sites), keys, numbers, booleans, paths, multi-line values, inline comments, and the `#*#` SAVE_CONFIG block.
- **Pins as one token:** `^!EBBCan:PB6`, `P1.24`, `gpio0_27`, `EXP1_5`, `tmc2209_stepper_x:virtual_endstop`, with the `^ ! ~` modifiers picked out.
- **G-code in macros:** inside `gcode:` and every `*_gcode:` option, commands (standard `G`/`M`/`T` codes and macros are different colors), `KEY=value` and `X10` / `S{BED}` parameters.
- **Jinja2, Klipper's dialect:** `{expr}` (single braces), `{% … %}` and `{# … #}`, including multi-line statements. `params`, `rawparams` and `printer` stand out, `action_*()` and `range()` are built-ins, known filters and tests are colored, and a typo like `|integer` is deliberately left plain.
- **Sliced `.gcode` (`.gcode`, `.gco`):** commands, parameters, numbers, `;` and `( )` comments, line numbers and checksums, line by line, so large slicer files stay cheap.

Colors come from your theme: these are standard scopes. [Token-to-scope table](https://github.com/digidude/klipper-syntax/blob/main/docs/highlighting.md#vs-code-scopes).

## Limits

This is a TextMate grammar: regular expressions, one line at a time, with no parse tree. It matches what Klipper does on real configs about 99% of the time but can't match everything (for example, a `{% raw %}` block isn't special-cased). In Zed the same project highlights from a real parser.

## Other extensions

- **`.cfg` files:** other extensions may claim `.cfg` too. If the wrong one wins, use *Change Language Mode* (the status bar) → *Klipper*, or set `"files.associations": { "*.cfg": "klipper" }`. Files named `printer.cfg`, `mainsail.cfg`, `fluidd.cfg` or under `printer_data/config/` are claimed by filename, which wins over the extension.
- **[dannymcgee.klipper](https://marketplace.visualstudio.com/items?itemName=dannymcgee.klipper)** also highlights Klipper and adds snippets; you can install either or both.
- **Hover docs and go-to-definition:** [Klipper Language Server](https://github.com/digidude/klipper-ls), designed to sit on top of this extension.

## Reporting problems

A file that highlights wrongly is the most useful bug report: [open an issue](https://github.com/digidude/klipper-syntax/issues) with the smallest snippet that shows it. Remove secrets first.

## License

MIT.
