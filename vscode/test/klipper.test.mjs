import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, scopeOf } from './tokenize.mjs';

// First scope that starts with `prefix`, searching innermost first.
const has = (tokens, needle, prefix, nth = 0) =>
  assert.ok(
    scopeOf(tokens, needle, nth).some((s) => s.startsWith(prefix)),
    `${needle}: expected ${prefix}, got ${scopeOf(tokens, needle, nth).join(' < ')}`,
  );
const lacks = (tokens, needle, prefix, nth = 0) =>
  assert.ok(
    !scopeOf(tokens, needle, nth).some((s) => s.startsWith(prefix)),
    `${needle}: unexpected ${prefix} in ${scopeOf(tokens, needle, nth).join(' < ')}`,
  );

test('sections: type carries the color, macro names are functions', async () => {
  const t = await tokenize('[tmc2209 stepper_x]\n[gcode_macro PRINT_START]\n[printer]\n');
  has(t, 'tmc2209', 'entity.name.type.section');
  has(t, 'stepper_x', 'entity.name.section');
  has(t, 'gcode_macro', 'entity.name.type.section');
  has(t, 'PRINT_START', 'entity.name.function.macro');
  has(t, 'printer', 'entity.name.type.section');
});

test('options: keys, delimiters, macro variables, values', async () => {
  const t = await tokenize(
    '[stepper_x]\nrotation_distance: 40\nvariable_z_hot: 0.5\nmicrosteps = 16\nuse_x: true\nmode: None\n',
  );
  has(t, 'rotation_distance', 'support.type.property-name');
  has(t, ':', 'punctuation.separator.key-value');
  has(t, 'variable_z_hot', 'variable.other.property.template');
  has(t, '40', 'constant.numeric');
  has(t, '0.5', 'constant.numeric');
  has(t, 'true', 'constant.language.boolean');
  has(t, 'None', 'constant.language.none');
});

test('comments: full-line, inline, SAVE_CONFIG', async () => {
  const t = await tokenize('# top\n[mcu]\nserial: /dev/ttyACM0 # inline\n#*# [bed_mesh default]\n');
  has(t, '# top', 'comment.line');
  has(t, '# inline', 'comment.line');
  has(t, '#*# [bed_mesh default]', 'comment.line.number-sign.save-config');
});

test('pins are one constant with operator modifiers', async () => {
  const t = await tokenize(
    '[x]\nstep_pin: PF13\ndir_pin: !P1.24\nendstop_pin: ^!EBBCan:PB6\nz: probe:z_virtual_endstop\npins: PA1, ^EXP1_5, gpio0_27, ar5\n',
  );
  has(t, 'PF13', 'constant.other.pin');
  has(t, 'P1.24', 'constant.other.pin');
  has(t, '^!', 'keyword.operator.pin-modifier');
  has(t, 'EBBCan:PB6', 'constant.other.pin');
  has(t, 'probe:z_virtual_endstop', 'constant.other.pin');
  has(t, 'gpio0_27', 'constant.other.pin');
  has(t, 'ar5', 'constant.other.pin');
});

test('words that look like pins stay text', async () => {
  const t = await tokenize('[gcode_macro A]\ndescription: Note PA1x and mqtt://broker:1883\n');
  lacks(t, 'PA1x', 'constant.other.pin');
  has(t, 'PA1x', 'string.unquoted');
});

test('paths', async () => {
  const t = await tokenize('[mcu]\nserial: /dev/serial/by-id/usb-Klipper_rp2040-if00\n');
  has(t, '/dev/serial/by-id/usb-Klipper_rp2040-if00', 'string.other.path');
});

test('multi-line values continue on indented lines, even past comments', async () => {
  const t = await tokenize('[bed_mesh]\nfaulty_region_1_min:\n  1, 2\n# a comment\n  3, 4\nnext: 1\n');
  has(t, '3', 'constant.numeric');
  has(t, '# a comment', 'comment.line');
  has(t, 'next', 'support.type.property-name');
});

const MACRO = `[gcode_macro M]
gcode:
  G28
  M104 S{BED}
  {% if printer.toolhead.homed_axes == "xyz" %}
    SET_GCODE_VARIABLE MACRO=M VARIABLE=x VALUE={params.X|default(0)|float}
    RESPOND MSG="hello" ; note
  {% endif %}
  PRINT_START TARGET=100
next: 1
`;

test('gcode: commands, parameters, comments', async () => {
  const t = await tokenize(MACRO);
  has(t, 'G28', 'keyword.control.gcode');
  has(t, 'M104', 'keyword.control.gcode');
  has(t, 'S', 'variable.parameter.gcode');
  has(t, 'SET_GCODE_VARIABLE', 'entity.name.function.gcode');
  has(t, 'PRINT_START', 'entity.name.function.gcode');
  has(t, 'MACRO', 'variable.parameter.gcode');
  has(t, 'TARGET', 'variable.parameter.gcode');
  has(t, '100', 'constant.numeric');
  has(t, 'hello', 'string.quoted');
  has(t, '; note', 'comment.line');
});

test('the gcode block ends at the next column-0 key', async () => {
  const t = await tokenize(MACRO);
  has(t, 'next', 'support.type.property-name');
  lacks(t, 'next', 'meta.template');
});

test('jinja: delimiters, keywords, context, filters, properties', async () => {
  const t = await tokenize(MACRO);
  has(t, '{%', 'punctuation.definition.tag.begin');
  has(t, 'if', 'keyword.control.jinja');
  has(t, 'endif', 'keyword.control.jinja');
  has(t, 'printer', 'variable.language');
  has(t, 'toolhead', 'variable.other.property');
  has(t, '==', 'keyword.operator');
  has(t, 'params', 'variable.language');
  has(t, 'default', 'support.function.filter');
  has(t, 'float', 'support.function.filter');
});

test('jinja: unknown filters stay plain, known tests highlighted', async () => {
  const t = await tokenize(
    '[gcode_macro M]\ngcode:\n  {% if x|integer and y is defined and z is not none %}{% endif %}\n',
  );
  lacks(t, 'integer', 'support.function');
  has(t, 'integer', 'meta.filter.unknown');
  has(t, 'defined', 'support.function.test');
  has(t, 'none', 'support.function.test');
  has(t, 'and', 'keyword.operator.word');
});

test('jinja: set, macro, builtins, kwargs, dicts, comments, multi-line', async () => {
  const t = await tokenize(`[gcode_macro M]
gcode:
  {% set x = 1 %}
  {# note #}
  {% macro helper(a) %}{% endmacro %}
  { action_respond_info("hi") }
  {% set d = {'k': 2,
              'j': round(precision=2)} %}
  G1 X{x}
`);
  has(t, 'x', 'variable.other.readwrite', 0);
  has(t, ' note ', 'comment.block.jinja');
  has(t, 'helper', 'entity.name.function');
  has(t, 'action_respond_info', 'support.function.builtin');
  has(t, 'precision', 'variable.parameter.jinja');
  has(t, 'G1', 'keyword.control.gcode');
});

test('every *_gcode option is a template', async () => {
  const t = await tokenize('[homing_override]\nset_position_z: 1\n[pause_resume]\n[idle_timeout]\ngcode:\n  M84\n[x]\nbefore_pause_gcode:\n  SAVE\n');
  has(t, 'M84', 'keyword.control.gcode');
  has(t, 'SAVE', 'entity.name.function.gcode');
});

test('gcode on the same line as the key', async () => {
  const t = await tokenize('[gcode_macro M]\ngcode: G28\n');
  has(t, 'G28', 'keyword.control.gcode');
});

test('jinja inside a quoted gcode parameter', async () => {
  const t = await tokenize('[gcode_macro M]\ngcode:\n  RESPOND MSG="bed {temp|int} done"\n');
  has(t, 'temp', 'meta.expression.jinja');
  has(t, 'int', 'support.function.filter');
  has(t, ' done', 'string.quoted.double');
});

test('jinja strings keep escaped quotes inside the string', async () => {
  const t = await tokenize('[gcode_macro M]\ngcode:\n  {% set x = "a \\" b" ~ \'c \\\' d\' %}\n  G28\n');
  has(t, '\\"', 'constant.character.escape');
  has(t, ' b', 'string.quoted.double');
  has(t, '\\\'', 'constant.character.escape');
  has(t, ' d', 'string.quoted.single');
  // the next line is not swallowed by an unterminated string
  has(t, 'G28', 'keyword.control.gcode');
});
