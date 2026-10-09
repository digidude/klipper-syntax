# Klipper for Zed

Syntax highlighting for [Klipper](https://www.klipper3d.org/) `printer.cfg` and its includes, from a real parse tree: sections, options, pins, and the G-code and Jinja2 inside `[gcode_macro]` blocks. No language server, no settings. Also gives you the outline panel, bracket matching, `#` comments, auto-indent after `gcode:` and `{% if %}`, and Vim text objects.

> **Pairs with [Klipper Language Server](https://github.com/digidude/klipper-ls):** this extension is how Klipper files *look*; the language server adds hover docs, go-to-definition and macro awareness. Zed can't declare a dependency between extensions, so install both from the extension list. Each works without the other.

## What's colored

Config sections (macro names colored like their call sites), keys, numbers, booleans, paths, multi-line values and the `#*#` SAVE_CONFIG block. Pins are one token (`^!EBBCan:PB6`). In `gcode:` and every `*_gcode:`: commands, `KEY=value`, `X10`, `S{BED}`. Jinja2 in Klipper's dialect: `{expr}`, `{% … %}`, `{# … #}`; `params` and `printer` stand out, known filters are colored, and a typo like `|integer` stays plain. The full token-to-capture table is in [docs/highlighting.md](../docs/highlighting.md).

The outline lists one entry per section, with `variable_*` options nested under each macro.

## Install

Install **Klipper** from Zed's extension list (`zed: extensions`).

`*.cfg` files open as Klipper. Zed's INI extension also claims `.cfg`, and when two extensions claim a suffix Zed can pick either. If your `.cfg` files open as INI, say which you want in `settings.json`:

```jsonc
"file_types": { "Klipper": ["cfg"] }
```

KlipperScreen and Moonraker `.conf` files use the same format but aren't claimed; add them the same way (`"Klipper": ["cfg", "conf"]` if you want).

## Sliced `.gcode` files

Not handled here, on purpose: slicer output runs to millions of lines, and the G-code extensions already cover it. Install **G-code** from Zed's extension list. (The Klipper grammar parses G-code only inside macros.)

## Colors

Colors come from your Zed theme. Some themes don't define every capture; [docs/highlighting.md](../docs/highlighting.md) explains the fallbacks and how to override a color in `settings.json`.

## Reporting problems

A file that highlights wrongly is the most useful bug report: [open an issue](https://github.com/digidude/klipper-syntax/issues) with the smallest snippet that shows it. Remove secrets (serials, tokens, API keys) first.

## License

MIT. Several ideas (pin structure, filter list, paths) come from [dannymcgee/vscode-klipper](https://github.com/dannymcgee/vscode-klipper) (MIT).
