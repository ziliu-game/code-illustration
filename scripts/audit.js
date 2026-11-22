#!/usr/bin/env node
/**
 * 审稿台：把所有"已画"的词铺成一张带编号的拼版，人眼判定有没有"画的其实是另一个词"。
 *
 *   node scripts/audit.js --batch words.json --out audit.html [--cols 8]
 *   node scripts/audit.js --apply bad.txt        # 把 bad.txt 里的词写进 PLATES（强制字牌）
 *   node scripts/audit.js --list                 # 打印当前审稿表
 *
 * 判定口径只有一条：**把图念一遍，念出来的是不是这个词。**
 * 是 → 留；不是 → 进 bad.txt，宁可不画。
 */
const fs = require('fs');
const path = require('path');
const I = require('./illus.js');

const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) opt[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
}

const CORE = path.join(__dirname, 'illus.js');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inner = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

function list() {
  const s = fs.readFileSync(CORE, 'utf8');
  const m = s.match(/\/\*PLATES:BEGIN\*\/([\s\S]*?)\/*PLATES:END\*\//);
  const body = m ? m[1] : '';
  const words = (body.match(/`[\s\S]*?`/) || ['``'])[0].replace(/`/g, '').trim().split(/\s+/).filter(Boolean);
  console.log('审稿表 ' + words.length + ' 词：' + words.join(' '));
}

function apply(file) {
  const incoming = fs.readFileSync(file, 'utf8').trim().split(/\s+/).filter(Boolean);
  const s = fs.readFileSync(CORE, 'utf8');
  const m = s.match(/\/\*PLATES:BEGIN\*\/([\s\S]*?)\/*PLATES:END\*\//);
  const body = m ? m[1] : '';
  const old = (body.match(/`([\s\S]*?)`/) || [, ''])[1].trim().split(/\s+/).filter(Boolean);
  const all = [...new Set([...old, ...incoming])];
  const wrapped = all.map(w => '  ' + w).join(' ');
  const block = `/*PLATES:BEGIN*/\nconst PLATES = new Set(\`\n${wrapped}\n\`.trim().split(/\\s+/).filter(Boolean));\n/*PLATES:END*/`;
  const s2 = s.replace(/\/\*PLATES:BEGIN\*\/([\s\S]*?)\/*PLATES:END\*\//, block);
  fs.writeFileSync(CORE, s2);
  console.log(`审稿表 ${old.length} → ${all.length} 词（新增 ${all.length - old.length}）`);
}

function sheet(words) {
  const cols = Number(opt.cols || 8);
  const drawn = words.filter(w => I.describe(w).head);
  const cells = drawn.map((w, i) => {
    const b = I.bodyOf(w);
    const art = b && b.art ? inner('<svg viewBox="0 0 100 100">' + b.art + '</svg>') : '';
    return `<figure data-i="${i + 1}" data-w="${esc(w)}"><div class="t"><svg viewBox="0 0 100 100">${art}</svg></div><figcaption><b>${i + 1}</b> ${esc(w)}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>审稿台</title><style>
body{margin:0;background:#efe9dc;font:13px/1.4 "PingFang SC","Noto Sans CJK SC",sans-serif;color:#3b3330}
.h{padding:10px 12px;font-size:12px;color:#6b6259;display:flex;justify-content:space-between;align-items:center}
.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:0 12px 12px}
figure{margin:0;background:#fffdf7;border:1px solid #ded6c6;border-radius:9px;padding:6px}
figure svg{width:100%;display:block}
figcaption{text-align:center;margin-top:4px;font-size:12px;color:#3b3330}
figcaption b{display:inline-block;min-width:22px;color:#b23a2f;font-weight:600}
</style></head><body>
<div class="h"><span>共 ${drawn.length} 词（已画）· 判定标准：把图念一遍，念出来的是不是这个词</span><span>编号用于写 bad.txt</span></div>
<div class="g">${cells}</div></body></html>`;
  const out = opt.out || 'audit.html';
  fs.writeFileSync(out, html);
  console.log(`审稿表 → ${out}（${drawn.length} 词，${cols} 列）`);
}

if (opt.list) list();
else if (opt.apply) apply(opt.apply);
else if (opt.batch) {
  const words = JSON.parse(fs.readFileSync(opt.batch, 'utf8'));
  sheet(words);
} else {
  console.log('用法：--batch <words.json> --out <html> | --apply <bad.txt> | --list');
}
