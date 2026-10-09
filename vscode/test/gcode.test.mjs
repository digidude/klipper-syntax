import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, scopeOf } from './tokenize.mjs';

const has = (tokens, needle, prefix, nth = 0) =>
  assert.ok(
    scopeOf(tokens, needle, nth).some((s) => s.startsWith(prefix)),
    `${needle}: expected ${prefix}, got ${scopeOf(tokens, needle, nth).join(' < ')}`,
  );

test('sliced g-code lines', async () => {
  const t = await tokenize(
    ';TYPE:WALL-OUTER\nG1 X10.5 Y-3 E0.04 F1800 ; move\nM104 S215\nSET_PRESSURE_ADVANCE ADVANCE=0.05\nN12 G1 Z0.2*71\n',
    'source.gcode',
  );
  has(t, ';TYPE:WALL-OUTER', 'comment.line');
  has(t, 'G1', 'keyword.control.gcode');
  has(t, 'X', 'variable.parameter.gcode');
  has(t, '10.5', 'constant.numeric');
  has(t, '-3', 'constant.numeric');
  has(t, '; move', 'comment.line');
  has(t, 'M104', 'keyword.control.gcode');
  has(t, 'SET_PRESSURE_ADVANCE', 'entity.name.function.gcode');
  has(t, 'ADVANCE', 'variable.parameter.gcode');
  has(t, 'N12', 'constant.numeric.line-number');
});
