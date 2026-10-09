// Source for syntaxes/klipper.tmLanguage.json (run `npm run build`).
// Authored as JS so the regexes stay readable (String.raw) and shared pieces
// are named. Scope choices mirror zed/docs/highlighting.md.

const r = String.raw;

const IDENT = r`[A-Za-z_][A-Za-z0-9_]*`;

// Jinja 2.11, as shipped with Klipper: Klipper adds no filters or tests of its own.
const FILTERS =
  'abs|attr|batch|capitalize|center|count|d|default|dictsort|e|escape|filesizeformat|first|float|forceescape|format|groupby|indent|int|join|last|length|list|lower|map|max|min|pprint|random|reject|rejectattr|replace|reverse|round|safe|select|selectattr|slice|sort|string|striptags|sum|title|tojson|trim|truncate|unique|upper|urlencode|urlize|wordcount|wordwrap|xmlattr';
const TESTS =
  'boolean|callable|defined|divisibleby|eq|equalto|escaped|even|false|float|ge|greaterthan|gt|in|integer|iterable|le|lessthan|lower|lt|mapping|ne|none|number|odd|sameas|sequence|string|true|undefined|upper';
const BUILTIN_FUNCS =
  'action_emergency_stop|action_respond_info|action_raise_error|action_call_remote_method|range|dict|lipsum|cycler|joiner|namespace';

// Pin names across the MCUs Klipper supports (same list as the scanner):
// PA1, P1.24, gpio17, gpio0_27, ar5, analog3, EXP1_5, PIN_12.
const PIN_NAME = r`P[A-Z]\d{1,2}|P\d\.\d{1,2}|gpio\d{1,3}(?:_\d{1,3})?|(?:analog|ar)\d{1,3}|EXP\d_\d{1,2}|PIN_\d{1,2}`;
const PIN_END = r`(?=[\s,)\]}#;]|$)`;

const GCODE_KEY = r`(?:[A-Za-z0-9_]*_)?gcode`;
// A key line ends the previous value only when it starts in column 0 with
// something other than a comment: indented lines, blank lines and full-line
// comments all continue a value (configparser).
const VALUE_END = r`^(?=[^\s#;])`;

export default {
  $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'Klipper',
  scopeName: 'source.klipper',
  patterns: [
    { include: '#comment' },
    { include: '#section' },
    { include: '#gcode-option' },
    { include: '#rename-existing' },
    { include: '#option' },
  ],
  repository: {
    // ---------------------------------------------------------------- config
    comment: {
      patterns: [
        // The block Klipper writes for SAVE_CONFIG
        {
          match: r`^\s*#\*#.*$`,
          name: 'comment.line.number-sign.save-config.klipper',
        },
        { match: r`^\s*[#;].*$`, name: 'comment.line.number-sign.klipper' },
      ],
    },
    'trailing-comment': {
      match: r`(?<=\s)[#;].*$`,
      name: 'comment.line.number-sign.klipper',
    },
    section: {
      patterns: [
        // [gcode_macro NAME]: the name is a function, matching its call sites
        {
          match: r`^(\[)\s*(gcode_macro|delayed_gcode)\s+([^\]]*?)\s*(\])(?:\s+([#;].*))?`,
          captures: {
            1: { name: 'punctuation.definition.section.begin.klipper' },
            2: { name: 'entity.name.type.section.klipper' },
            3: { name: 'entity.name.function.macro.klipper' },
            4: { name: 'punctuation.definition.section.end.klipper' },
            5: { name: 'comment.line.number-sign.klipper' },
          },
          name: 'meta.section.klipper',
        },
        // [stepper_x], [tmc2209 stepper_x]: the type carries the color
        {
          match: r`^(\[)\s*([^\s\]]+)(?:\s+([^\]]*?))?\s*(\])(?:\s+([#;].*))?`,
          captures: {
            1: { name: 'punctuation.definition.section.begin.klipper' },
            2: { name: 'entity.name.type.section.klipper' },
            3: { name: 'entity.name.section.klipper' },
            4: { name: 'punctuation.definition.section.end.klipper' },
            5: { name: 'comment.line.number-sign.klipper' },
          },
          name: 'meta.section.klipper',
        },
      ],
    },
    // rename_existing: G28 names a command, so it reads like a call
    'rename-existing': {
      match: r`^(rename_existing)\s*([:=])\s*(${IDENT})`,
      captures: {
        1: { name: 'support.type.property-name.klipper' },
        2: { name: 'punctuation.separator.key-value.klipper' },
        3: { name: 'entity.name.function.gcode.klipper' },
      },
      name: 'meta.option.klipper',
    },
    option: {
      begin: r`^([A-Za-z0-9_.\-]+)\s*([:=])`,
      beginCaptures: {
        1: {
          patterns: [
            {
              match: r`^variable_.*$`,
              name: 'variable.other.property.template.klipper',
            },
            { match: r`.+`, name: 'support.type.property-name.klipper' },
          ],
        },
        2: { name: 'punctuation.separator.key-value.klipper' },
      },
      end: VALUE_END,
      name: 'meta.option.klipper',
      patterns: [{ include: '#comment' }, { include: '#value' }],
    },
    value: {
      patterns: [
        { include: '#trailing-comment' },
        {
          match: r`"[^"\n]*"`,
          name: 'string.quoted.double.klipper',
        },
        {
          match: r`'[^'\n]*'`,
          name: 'string.quoted.single.klipper',
        },
        {
          match: r`(?<![\w.:/-])(?:true|false|True|False)(?![\w.:/-])`,
          name: 'constant.language.boolean.klipper',
        },
        {
          match: r`(?<![\w.:/-])(?:none|None)(?![\w.:/-])`,
          name: 'constant.language.none.klipper',
        },
        { include: '#number' },
        { include: '#pin' },
        {
          match: r`(?<![\w])(?:~|\.\.?)?/[^\s,"'\[\]{}()]*`,
          name: 'string.other.path.klipper',
        },
        { match: r`[,]`, name: 'punctuation.separator.comma.klipper' },
        { match: r`[^\s,"'\[\]{}()#;][^\s,\[\]{}()]*`, name: 'string.unquoted.klipper' },
      ],
    },
    // ^!EBBCan:PB6 is one pin: modifiers, MCU, name
    pin: {
      patterns: [
        {
          match: r`(?<![\w.:/-])([\^!~]*)(?:([A-Za-z0-9_.]+)(:))?(${PIN_NAME})${PIN_END}`,
          captures: {
            1: { name: 'keyword.operator.pin-modifier.klipper' },
          },
          name: 'constant.other.pin.klipper',
        },
        {
          match: r`(?<![\w.:/-])([\^!~]*)[A-Za-z0-9_.]+:[A-Za-z0-9_]*virtual_endstop${PIN_END}`,
          captures: {
            1: { name: 'keyword.operator.pin-modifier.klipper' },
          },
          name: 'constant.other.pin.klipper',
        },
        // Bare modifiers in front of an aliased pin, e.g. `!EXP1_5` handled
        // above; this catches `^` alone before a name the lists don't know.
      ],
    },
    number: {
      match: r`(?<![\w./-])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?(?![\w/-]|\.\w|:[A-Za-z_])`,
      name: 'constant.numeric.klipper',
    },

    // ---------------------------------------------------------------- G-code
    'gcode-option': {
      begin: r`^(${GCODE_KEY})\s*([:=])`,
      beginCaptures: {
        1: { name: 'support.type.property-name.klipper' },
        2: { name: 'punctuation.separator.key-value.klipper' },
      },
      end: VALUE_END,
      name: 'meta.template.klipper',
      patterns: [
        { include: '#comment' },
        { include: '#jinja' },
        { include: '#gcode' },
      ],
    },
    gcode: {
      patterns: [
        { match: r`;.*$`, name: 'comment.line.semicolon.gcode.klipper' },
        // `# note` after a command or a {% %} tag (`{#` was taken by #jinja)
        { match: r`(?<=\s)#.*$`, name: 'comment.line.number-sign.klipper' },
        // G28, M104, T0: standard codes, vs. macros and extended commands
        {
          match: r`(?:^\s+|\G\s*|(?<=%\})\s*)([GMTgmt]\d+(?:\.\d+)?)(?=[\s;{]|$)`,
          captures: { 1: { name: 'keyword.control.gcode.klipper' } },
        },
        {
          match: r`(?:^\s+|\G\s*|(?<=%\})\s*)(${IDENT})(?=[\s;{]|$)`,
          captures: { 1: { name: 'entity.name.function.gcode.klipper' } },
        },
        // KEY=value
        {
          match: r`(?<![\w])(${IDENT})(=)`,
          captures: {
            1: { name: 'variable.parameter.gcode.klipper' },
            2: { name: 'punctuation.separator.parameter.klipper' },
          },
        },
        // X10, S{BED}: a letter glued to its value
        {
          match: r`(?<![\w])([XYZEFSPTIJRDHQxyzefsptijrdhq])(?=[-+.\d{])((?:[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)?)`,
          captures: {
            1: { name: 'variable.parameter.gcode.klipper' },
            2: { name: 'constant.numeric.klipper' },
          },
        },
        // MSG="bed {temp}": Jinja works inside quotes
        {
          begin: r`"`,
          end: r`"|(?=$)`,
          name: 'string.quoted.double.klipper',
          patterns: [{ include: '#jinja' }],
        },
        {
          match: r`(?<![\w.])(?:true|false|True|False)(?![\w.])`,
          name: 'constant.language.boolean.klipper',
        },
        { include: '#number' },
      ],
    },

    // ----------------------------------------------------------------- Jinja
    // Klipper's dialect: `{expr}` (single braces) next to `{% %}` and `{# #}`.
    jinja: {
      patterns: [
        {
          begin: r`\{#`,
          end: r`#\}`,
          name: 'comment.block.jinja.klipper',
          beginCaptures: { 0: { name: 'punctuation.definition.comment.begin.jinja.klipper' } },
          endCaptures: { 0: { name: 'punctuation.definition.comment.end.jinja.klipper' } },
        },
        {
          begin: r`\{%[-+]?`,
          end: r`[-+]?%\}`,
          name: 'meta.statement.jinja.klipper',
          beginCaptures: { 0: { name: 'punctuation.definition.tag.begin.jinja.klipper' } },
          endCaptures: { 0: { name: 'punctuation.definition.tag.end.jinja.klipper' } },
          patterns: [{ include: '#jinja-expr' }],
        },
        {
          begin: r`\{`,
          end: r`\}`,
          name: 'meta.expression.jinja.klipper',
          beginCaptures: { 0: { name: 'punctuation.definition.expression.begin.jinja.klipper' } },
          endCaptures: { 0: { name: 'punctuation.definition.expression.end.jinja.klipper' } },
          patterns: [{ include: '#jinja-expr' }],
        },
      ],
    },
    'jinja-expr': {
      patterns: [
        {
          match: r`\b(set)\b(?:\s+(${IDENT}))?`,
          captures: {
            1: { name: 'keyword.control.jinja.klipper' },
            2: { name: 'variable.other.readwrite.jinja.klipper' },
          },
        },
        {
          match: r`\b(macro)\b(?:\s+(${IDENT}))?`,
          captures: {
            1: { name: 'keyword.control.jinja.klipper' },
            2: { name: 'entity.name.function.jinja.klipper' },
          },
        },
        {
          match: r`\b(if|elif|else|endif|for|endfor|recursive|endset|endmacro|call|endcall|filter|endfilter|do|with|endwith|raw|endraw|include|import|from|as|block|endblock|extends|continue|break)\b`,
          name: 'keyword.control.jinja.klipper',
        },
        // Tests: `x is defined`, `x is not none`
        {
          match: r`\b(is)\b(?:\s+(not)\b)?(?:\s+(${TESTS})\b)?`,
          captures: {
            1: { name: 'keyword.operator.word.jinja.klipper' },
            2: { name: 'keyword.operator.word.jinja.klipper' },
            3: { name: 'support.function.test.jinja.klipper' },
          },
        },
        { match: r`\b(in|not|and|or)\b`, name: 'keyword.operator.word.jinja.klipper' },
        {
          match: r`\b(true|false|none|True|False|None)\b`,
          name: 'constant.language.jinja.klipper',
        },
        // Filters: a known name gets the function color; a typo like `|integer`
        // stays plain so it stands out.
        {
          match: r`(\|)\s*(${FILTERS})\b`,
          captures: {
            1: { name: 'keyword.operator.jinja.klipper' },
            2: { name: 'support.function.filter.jinja.klipper' },
          },
        },
        {
          match: r`(\|)\s*(${IDENT})`,
          captures: {
            1: { name: 'keyword.operator.jinja.klipper' },
            2: { name: 'meta.filter.unknown.jinja.klipper' },
          },
        },
        // Klipper's template context
        {
          match: r`\b(params|rawparams|printer)\b(?!\s*=[^=])`,
          name: 'variable.language.klipper',
        },
        {
          match: r`\b(${BUILTIN_FUNCS})(?=\s*\()`,
          name: 'support.function.builtin.jinja.klipper',
        },
        // obj.method(...) and obj.attr
        {
          match: r`(\.)\s*(${IDENT})(?=\s*\()`,
          captures: {
            1: { name: 'punctuation.accessor.jinja.klipper' },
            2: { name: 'entity.name.function.jinja.klipper' },
          },
        },
        {
          match: r`(\.)\s*(${IDENT})`,
          captures: {
            1: { name: 'punctuation.accessor.jinja.klipper' },
            2: { name: 'variable.other.property.jinja.klipper' },
          },
        },
        {
          match: r`\b(${IDENT})(?=\s*\()`,
          name: 'entity.name.function.jinja.klipper',
        },
        // round(precision=2)
        {
          match: r`\b(${IDENT})(?=\s*=(?!=))`,
          name: 'variable.parameter.jinja.klipper',
        },
        // {'x': 1}: a key reads like a property, not a string
        {
          match: r`'(?:[^'\\\n]|\\.)*'(?=\s*:)|"(?:[^"\\\n]|\\.)*"(?=\s*:)`,
          name: 'support.type.property-name.jinja.klipper',
        },
        {
          begin: r`"`,
          end: r`"`,
          name: 'string.quoted.double.jinja.klipper',
          patterns: [{ match: r`\\.`, name: 'constant.character.escape.jinja.klipper' }],
        },
        {
          begin: r`'`,
          end: r`'`,
          name: 'string.quoted.single.jinja.klipper',
          patterns: [{ match: r`\\.`, name: 'constant.character.escape.jinja.klipper' }],
        },
        {
          match: r`(?<![\w.])(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\b`,
          name: 'constant.numeric.jinja.klipper',
        },
        { match: r`==|!=|<=|>=|\*\*|//|[<>+\-*/%~]`, name: 'keyword.operator.jinja.klipper' },
        { match: r`=`, name: 'keyword.operator.assignment.jinja.klipper' },
        // dict literal inside an expression: {'a': 1}
        {
          begin: r`\{`,
          end: r`\}`,
          beginCaptures: { 0: { name: 'punctuation.section.braces.begin.jinja.klipper' } },
          endCaptures: { 0: { name: 'punctuation.section.braces.end.jinja.klipper' } },
          patterns: [{ include: '#jinja-expr' }],
        },
        { match: r`[()\[\]]`, name: 'punctuation.section.brackets.jinja.klipper' },
        { match: r`[,:]`, name: 'punctuation.separator.jinja.klipper' },
      ],
    },
  },
};
