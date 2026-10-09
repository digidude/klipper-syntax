x# Highlighting: token-to-color guide

What each piece of a Klipper config gets colored, and why. Colors come from your theme, not from these extensions: they only tag each token and the theme picks the color. In **Zed** the tag is a tree-sitter **capture name** (`@keyword`, `@string`, …); in **VS Code** it is a TextMate **scope** (see the table at the end). The "One Dark" column is the typical result in Zed's default theme; other themes differ.

## The idea

The palette follows the same conventions as Zed's Rust, Python and TOML support, so Klipper files look familiar next to your other code:

- **Strong color goes to a few categories:** keywords, functions/macros, types (section headers), strings and constants.
- **Structure stays quiet:** plain variables, `=` / `:` and punctuation sit near the foreground color.
- **Config lines read like TOML/INI; macro bodies read like Python.** `[section]`, `key:` and the value come first. G-code and Jinja get more color only inside `gcode:` blocks.
- **One idea, one color.** A pin like `^!EBBCan:PB6` is a single constant, not three colors.

## Config sections and options

| Token | Example | Capture | One Dark (approx.) | Like… |
|---|---|---|---|---|
| Comment | `# 400 for 0.9° motors` | `@comment` | gray | `# …` in Python |
| SAVE_CONFIG block | `#*# [bed_mesh default]` | `@comment.doc` → falls back to `@comment` | gray | `///` doc comments in Rust |
| Section type | `[stepper_x]`, `[tmc2209 …]`, `[include …]` | `@type` | teal | `[table]` in TOML, a struct name in Rust |
| Section name | `[tmc2209 stepper_x]` | *(none)* | foreground | |
| Macro name | `[gcode_macro PRINT_START]` | `@function` | blue | `def print_start` in Python |
| Brackets | `[` `]` | `@punctuation.bracket` | foreground | |
| Option key | `rotation_distance:` | `@property` | red/pink | a TOML key, a Rust struct field |
| Macro variable | `variable_z_hot_offset:` | `@variable.special` | orange | `self` in Python: special to templates |
| `:` / `=` after a key | `step_pin: PF13` | `@punctuation.delimiter` | foreground | `=` in TOML |
| Text value | `description: Heat, level…` | `@string` | green | a string literal |
| Number | `40`, `0.04`, `-2` | `@number` | orange | |
| Boolean / None | `true`, `False`, `None` | `@constant` | yellow/orange | `True` / `None` in Python |
| Pin | `PF13`, `EBBCan:PB6`, `probe:z_virtual_endstop` | `@constant` | yellow/orange | an enum variant or ALL_CAPS constant |
| Pin modifier | the `^` `!` `~` in `^!PF14` | `@operator` | teal | `!` / `&` in Rust |
| File path | `serial: /dev/serial/by-id/…` | `@string.special` | orange/green | |
| `rename_existing:` value | `rename_existing: G28` | `@function` | blue | it names a command |

## G-code (inside `gcode:` and `*_gcode:`)

| Token | Example | Capture | One Dark (approx.) | Like… |
|---|---|---|---|---|
| Standard code | `G28`, `M104`, `T0` | `@keyword` | purple | built-in statements like `return` |
| Macro / extended command | `PRINT_START`, `SET_GCODE_VARIABLE` | `@function` | blue | a function call |
| Parameter name | `TARGET` in `TARGET=100`; the `X` in `X10` and the `S` in `S{BED}` | `@attribute` | blue/teal | a keyword argument |
| `=` in a parameter | `TARGET=100` | `@punctuation.delimiter` | foreground | |
| Parameter value | `100`, `"text"` | `@number` / `@string` | orange / green | |

## Jinja2 templates (`{ … }`, `{% … %}`, `{# … #}`)

| Token | Example | Capture | One Dark (approx.) | Like… |
|---|---|---|---|---|
| Delimiters | `{` `}` `{%` `%}` | `@punctuation.special` | red/orange | `{}` in a Python f-string |
| Statement keyword | `set`, `if`, `for`, `in`, `and`, `not` | `@keyword` | purple | Python keywords |
| Variable | `BED`, `has_chamber` | `@variable` | foreground | a Python local |
| Template context | `params`, `rawparams`, `printer` | `@variable.special` | orange | `self` in Python |
| Attribute / key | `params.BED`, `.toolhead` | `@property` | red/pink | a field access |
| Function call | `range(3)`, `macro()` | `@function` | blue | |
| Klipper/Jinja built-in | `action_respond_info()`, `range()` | `@function.builtin` → usually `@function` | blue | `print()` in Python |
| Known filter or test | `\|int`, `\|default(0)`, `is defined` | `@function` | blue | |
| Unknown filter or test | `\|integer` (a typo) | `@variable` | foreground | stays plain so mistakes stand out |
| Keyword argument | `round(precision=2)` | `@variable.parameter` | foreground or orange | `f(x=1)` in Python |
| Math / comparison | `+ - * / == < ~` and `\|` | `@operator` | teal | |
| `=` in `set` / kwargs | `{% set X = 1 %}` | `@punctuation.delimiter` | foreground | |
| Template comment | `{# … #}` | `@comment` | gray | |

## Theme notes

- Captures with a dot fall back to their parent when a theme doesn't define them: `@comment.doc` → `@comment`, `@function.builtin` → `@function`, `@variable.special` → `@variable`.
- Many themes (e.g. JetBrains Dark) leave `@variable.parameter` and `@function.builtin` undefined, so those render plain or in the parent color. The queries rely on them only where that fallback is acceptable.
- To retune a color yourself, override the capture in Zed's `settings.json`:

  ```json
  "experimental.theme_overrides": {
    "syntax": {
      "constant": { "color": "#d19a66" },
      "attribute": { "color": "#61afef" }
    }
  }
  ```

## VS Code scopes

The VS Code extension has no parse tree, so the TextMate grammar approximates it with regular expressions. `vscode/scripts/parity.mjs` measures the agreement against the tree-sitter queries on real configs (98-100% per category on 42 real configs; see CONTRIBUTING). Scopes are standard names, so any theme colors them.

| Token | Scope |
|---|---|
| Comment / SAVE_CONFIG block | `comment.line.number-sign` / `comment.line.number-sign.save-config` |
| Section type / name | `entity.name.type.section` / `entity.name.section` |
| Macro name in a header, `rename_existing` value | `entity.name.function.macro` / `entity.name.function.gcode` |
| Option key / `variable_*` key | `support.type.property-name` / `variable.other.property.template` |
| Text value / path / number | `string.unquoted` / `string.other.path` / `constant.numeric` |
| Boolean / None | `constant.language.boolean` / `constant.language.none` |
| Pin / modifier | `constant.other.pin` / `keyword.operator.pin-modifier` |
| Standard G-code / macro command | `keyword.control.gcode` / `entity.name.function.gcode` |
| Parameter name (`TARGET`, `X`) | `variable.parameter.gcode` |
| Jinja delimiters | `punctuation.definition.tag` / `punctuation.definition.expression` |
| Jinja keyword / `and or not in is` | `keyword.control.jinja` / `keyword.operator.word.jinja` |
| `params`, `rawparams`, `printer` | `variable.language` |
| Known filter / test | `support.function.filter.jinja` / `support.function.test.jinja` |
| Unknown filter (typo) | `meta.filter.unknown.jinja` (no color on purpose) |
| Built-in function | `support.function.builtin.jinja` |

For standalone `.gcode`: `keyword.control.gcode` (G/M/T codes), `entity.name.function.gcode` (Klipper commands), `variable.parameter.gcode` (parameters), `constant.numeric.gcode`, `comment.line.semicolon.gcode`.

Captures are defined in [`zed/languages/klipper/highlights.scm`](../zed/languages/klipper/highlights.scm), scopes in [`vscode/syntaxes-src/`](../vscode/syntaxes-src). When either changes, update this document in the same commit.
