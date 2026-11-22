#!/usr/bin/env node
/* 统计"待补清单"：哪些词走字牌、缺哪些字、差多少能画。
   用法：node scripts/wanted.js [--json]
   数据：tests/words-14686.txt（一行一词，公开词库快照）
   产物：默认打印汇总；--json 输出完整清单到 stdout（供 WANTED.md 更新） */
const fs = require('fs');
const path = require('path');
const I = require('./illus.js');

const ROOT = path.join(__dirname, '..');
const wordsFile = path.join(ROOT, 'tests', 'words-14686.txt');
const words = fs.readFileSync(wordsFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

const json = process.argv.includes('--json');
const res = { total: words.length, plate: 0, byKind: {}, missing: {}, onlyScene: [], samples: {} };

for (const w of words) {
  let kind = 'ERR';
  try { kind = I.describe(w).kind; } catch (e) { kind = 'ERR'; }
  res.byKind[kind] = (res.byKind[kind] || 0) + 1;
  if (kind !== 'plate') continue;

  res.plate++;
  const miss = [...w].filter(c => !I.hasIcon(c));
  for (const c of miss) {
    if (!res.missing[c]) res.missing[c] = { n: 0, words: [] };
    res.missing[c].n++;
    if (res.missing[c].words.length < 3) res.missing[c].words.push(w);
  }
  if (!miss.length) res.onlyScene.push(w);
  else if ((res.samples[miss[0]] || []).length < 3) {
    (res.samples[miss[0]] = res.samples[miss[0]] || []).push(w);
  }
}

const drawable = res.total - res.plate;
res.rate = +(drawable / res.total * 100).toFixed(1);
res.drawn = drawable;
res.missingRanked = Object.entries(res.missing)
  .sort((a, b) => b[1].n - a[1].n)
  .map(([ch, v]) => ({ ch, n: v.n, words: v.words }));

if (json) {
  console.log(JSON.stringify(res, null, 1));
} else {
  console.log(`词库 ${res.total} 条 · 可画 ${res.drawn}（${res.rate}%）· 字牌 ${res.plate}`);
  console.log('按关系分布：', JSON.stringify(res.byKind));
  console.log(`两字都有图、只缺构图：${res.onlyScene.length} 条`);
  console.log(`缺字 ${res.missingRanked.length} 个，前 12：` +
    res.missingRanked.slice(0, 12).map(x => `${x.ch}(${x.n})`).join(' '));
}
