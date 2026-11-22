#!/usr/bin/env node
/* 程序化插图 CLI：词 → SVG 文件
   node render.js <词> <输出.svg> [--style plain|doodle|wash] [--size N] [--label]
   例：node render.js 山水 out.svg --style doodle --size 300 --label
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { illustrate, stats } = require('./illus.js');
const { doodleCard } = require('./doodle.js');
const { washCard } = require('./wash.js');

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flag = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const word = positional[0];
const out = positional[1];
if (!word || !out) {
  console.error('用法：node render.js <词> <输出.svg> [--style plain|doodle|wash] [--size N] [--label]');
  process.exit(2);
}
const size = parseInt(flag('size', 300), 10);
const style = String(flag('style', 'plain'));

let svg;
if (style === 'doodle') svg = doodleCard(word, size);
else if (style === 'wash') svg = washCard(word, size);
else svg = illustrate(word, { size, label: !!flag('label', false) });

fs.writeFileSync(out, svg);
const kind = (() => { try { return stats([word]); } catch (e) { return null; } })();
console.error(`wrote ${path.resolve(out)} (${style}, ${svg.length} chars)` +
  (kind ? ` — ${kind.drawn ? kind.duo ? 'duo 双景' : 'scene 主景' : 'plate 字牌（该词暂无可画图元）'}` : ''));
