// Source for syntaxes/gcode.tmLanguage.json (run `npm run build`).
// Sliced G-code, line by line. Stateless on purpose: slicer files run to
// millions of lines, and VS Code re-tokenizes from the top.

const r = String.raw;
const IDENT = r`[A-Za-z_][A-Za-z0-9_]*`;

export default {
  $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'G-code',
  scopeName: 'source.gcode',
  patterns: [
    { include: '#comment' },
    { include: '#line-number' },
    { include: '#command' },
    { include: '#parameters' },
  ],
  repository: {
    comment: {
      patterns: [
        { match: r`;.*$`, name: 'comment.line.semicolon.gcode' },
        { match: r`\([^)\n]*\)`, name: 'comment.block.parenthesis.gcode' },
      ],
    },
    // N123 at the start of a line, and a trailing *71 checksum
    'line-number': {
      patterns: [
        { match: r`^\s*(N\d+)\b`, captures: { 1: { name: 'constant.numeric.line-number.gcode' } } },
        { match: r`(\*)(\d+)\s*(?=;|$)`, captures: {
          1: { name: 'keyword.operator.checksum.gcode' },
          2: { name: 'constant.numeric.checksum.gcode' },
        } },
      ],
    },
    command: {
      patterns: [
        // G1, M104, T0, G92.1: standard codes
        {
          match: r`(?:^\s*(?:N\d+\s+)?)([GMTgmt]\d+(?:\.\d+)?)(?=[\s;(*]|$)`,
          captures: { 1: { name: 'keyword.control.gcode' } },
        },
        // SET_PRESSURE_ADVANCE, PRINT_START: Klipper commands and macros
        {
          match: r`(?:^\s*(?:N\d+\s+)?)(${IDENT})(?=[\s;(*]|$)`,
          captures: { 1: { name: 'entity.name.function.gcode' } },
        },
      ],
    },
    parameters: {
      patterns: [
        // ADVANCE=0.05
        {
          match: r`(?<![\w])(${IDENT})(=)`,
          captures: {
            1: { name: 'variable.parameter.gcode' },
            2: { name: 'punctuation.separator.parameter.gcode' },
          },
        },
        // X10.5, E-0.4, F1800: a letter glued to its value
        {
          match: r`(?<![\w])([A-Za-z])(?=[-+.\d])((?:[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)?)`,
          captures: {
            1: { name: 'variable.parameter.gcode' },
            2: { name: 'constant.numeric.gcode' },
          },
        },
        { match: r`"[^"\n]*"`, name: 'string.quoted.double.gcode' },
        { match: r`(?<![\w.])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?`, name: 'constant.numeric.gcode' },
      ],
    },
  },
};
