#!/usr/bin/env node
/* 交付前自动验收：把"打开看一眼"变成可复跑的断言
   用法：
     node scripts/validate.js 大山 火车 大海 ...
     node scripts/validate.js --batch words.json        # ["大山","火车",...]
     node scripts/validate.js --batch words.json --max-dupe 12
     node scripts/validate.js --batch words.json --max-dupe 12 --fail-dupe --min-drawn 60
   退出码非 0：有硬伤（外链/位图/空卡/超体积）；加 --fail-dupe 时同构图超阈值也算失败；
   --min-drawn N 表示可画率低于 N% 判失败（防"悄悄删图元"）。                        */
'use strict';
const fs = require('fs');
const I = require('./illus.js');

const MAX_BYTES = 9000;     // 单张 base SVG 体积上限
const MAX_ELEMS = 320;      // 元素数上限
const MIN_PART = 2.2;       // 小于此尺寸的元素在 76px 下会糊成噪点
const MAX_TINY = 3;         // 允许几个极小元素（点缀星点等）

const argv = process.argv.slice(2);
const opt = { batch: null, maxDupe: 8, failDupe: false, minDrawn: null, words: [] };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--batch') opt.batch = argv[++i];
  else if (argv[i] === '--max-dupe') opt.maxDupe = +argv[++i];
  else if (argv[i] === '--fail-dupe') opt.failDupe = true;
  else if (argv[i] === '--min-drawn') opt.minDrawn = +argv[++i];
  else opt.words.push(argv[i]);
}
const words = opt.batch ? JSON.parse(fs.readFileSync(opt.batch, 'utf8')) : opt.words;
if (!words.length) {
  console.error('用法: node scripts/validate.js 大山 火车 大海   |   --batch words.json');
  process.exit(2);
}

/* 结构指纹：抹掉所有数值，只留"画了什么东西、什么颜色"的骨架
   —— 用来抓"一百个词同一张图"这种 silently 的重复 */
function fingerprint(svg) {
  return svg
    .replace(/-?\d+(?:\.\d+)?/g, '#')   // 坐标与尺寸全部归一，保留形状与颜色
    .replace(/viewBox="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><');
}

function audit(word) {
  const svg = I.illustrate(word, { size: 76 });   // 按词卡真实尺寸产出
  const issues = [];
  const size = Buffer.byteLength(svg, 'utf8');

  // 1. 纯代码铁律：不许有任何外部引用
  if (/<image|href=|xlink:|data:image|\burl\(http/i.test(svg)) issues.push('外链/位图');
  // 2. 体积与元素数
  const elems = (svg.match(/<[a-z]/g) || []).length;
  if (size > MAX_BYTES) issues.push(`体积 ${size}B > ${MAX_BYTES}`);
  if (elems > MAX_ELEMS) issues.push(`元素 ${elems} > ${MAX_ELEMS}`);

  // 3. 小尺寸可读：数一下糊掉的零件
  const tiny = [];
  for (const m of svg.matchAll(/<circle[^>]*r="([\d.]+)"/g)) if (+m[1] < MIN_PART) tiny.push(+m[1]);
  for (const m of svg.matchAll(/<rect[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/g)) {
    if (Math.min(+m[1], +m[2]) < MIN_PART) tiny.push(Math.min(+m[1], +m[2]));
  }
  if (tiny.length > MAX_TINY) issues.push(`过小元素 ${tiny.length} 个`);


  const d = I.describe(word);
  return { word, kind: d.kind, rel: d.rel, arch: d.arch, size, elems, issues, fp: fingerprint(svg) };
}

const rows = words.map(audit);

/* 同构图重复：同一个指纹出现太多次，说明"图元复用过度" */
const byFp = {};
for (const r of rows) (byFp[r.fp] ||= []).push(r.word);
const dupes = Object.entries(byFp)
  .filter(([, ws]) => ws.length > opt.maxDupe)
  .map(([fp, ws]) => ({ n: ws.length, sample: ws.slice(0, 6), fp }))
  .sort((a, b) => b.n - a.n);

const kinds = rows.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {});
const rels = rows.reduce((a, r) => (a[r.rel] = (a[r.rel] || 0) + 1, a), {});
const bad = rows.filter(r => r.issues.length);

/* 报告 */
const pad = (s, n) => String(s).padEnd(n, ' ');
console.log(`\n验收 ${rows.length} 张 —— 词卡 76px 尺寸`);
console.log(`构图分布：${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join('  ')}`);
console.log(`关系分布：${Object.entries(rels).map(([k, v]) => `${I.RELNAME[k] || k} ${v}`).join('  ')}`);
console.log(`单张体积中位：${rows.map(r => r.size).sort((a, b) => a - b)[Math.floor(rows.length / 2)]}B`);
if (bad.length) {
  console.log('\n[问题]');
  bad.slice(0, 20).forEach(r => console.log(`  ${pad(r.word, 6)} ${r.issues.join('；')}`));
  if (bad.length > 20) console.log(`  …另有 ${bad.length - 20} 条`);
} else console.log('\n[问题] 无');
if (dupes.length) {
  console.log(`\n[同构图重复 > ${opt.maxDupe}]`);
  dupes.slice(0, 5).forEach(d => console.log(`  ${d.n} 次：${d.sample.join(' ')} …`));
} else console.log(`\n[同构图重复] 无（阈值 ${opt.maxDupe}）`);

/* 可画率兜底：删图元、改映射都能让这个数悄悄掉下去 */
const drawn = rows.filter(r => r.kind !== 'plate').length;
const rate = +(drawn / rows.length * 100).toFixed(1);

/* 退出条件：硬伤（外链/位图/超体积/空卡）必挂；--fail-dupe 时同构图也挂；--min-drawn 时低于阈值挂 */
const hard = rows.filter(r => r.issues.some(i => /外链|位图|体积/.test(i)));
const dupeFail = opt.failDupe && dupes.length > 0;
const drawnFail = opt.minDrawn !== null && rate < opt.minDrawn;
if (opt.minDrawn !== null) console.log(`\n[可画率] ${drawn}/${rows.length} = ${rate}%（下限 ${opt.minDrawn}%）`);
if (dupeFail) console.log('[判定] 同构图超阈值');
if (hard.length || dupeFail || drawnFail) {
  console.error('\n✗ 验收未通过');
  process.exit(1);
}
process.exit(0);
