/* 水墨晕染：同一批图元，改用"多点叠印"画成墨块——内部积墨、边缘自然虚，不依赖滤镜 */
'use strict';
const { illustrate } = require('./illus.js');

const INK = '#211d19', PAPER = '#f5efe3';

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const rnd = (s, i) => ((hash(s + '#' + i) % 1000) / 1000);
const lum = hex => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return .7;
  const n = parseInt(m[1], 16);
  return (.2126 * (n >> 16) + .7152 * ((n >> 8) & 255) + .0722 * (n & 255)) / 255;
};
const num = (v, seed, i) => { const n = parseFloat(v); return !isFinite(n) ? v : +(n + (rnd(seed, i) * 2 - 1) * .8).toFixed(2); };

function jit(tag, a, seed) {
  let k = 0;
  if (tag === 'path' && a.d) a.d = a.d.replace(/-?\d+\.?\d*/g, m => String(num(m, seed, k++)));
  else if (tag === 'polygon' && a.points) a.points = a.points.split(/\s+/).map(p => p.split(',').map(v => num(v, seed, k++)).join(',')).join(' ');
  else if (tag === 'rect') {
    a.x = String(num(a.x, seed, k++)); a.y = String(num(a.y, seed, k++));
    a.width = String(Math.max(1, num(a.width, seed, k++))); a.height = String(Math.max(1, num(a.height, seed, k++)));
  } else if (tag === 'circle') a.r = String(Math.max(.7, num(a.r, seed, k++)));
  return a;
}

const ATTR = /([a-zA-Z][a-zA-Z0-9:-]*)="([^"]*)"/g;
const ser = o => Object.entries(o).map(([k, v]) => k + '="' + v + '"').join(' ');

function artOf(word) {
  const svg = illustrate(word, { size: 100 });
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
    .replace(/<rect[^>]*fill="#f7f1e4"[^>]*rx="12"[^>]*\/>/, '')
    .replace(/<rect[^>]*width="88"[^>]*height="2.5"[^>]*\/>/, '');
}

/* 原色越深 → 墨越浓；浅色（纸白、墙）→ 淡墨 */
const toneOf = l => (l < .30 ? .215 : l > .88 ? .095 : .155);
const STAMP = 8;

function washify(src, seed) {
  let i = 0;
  return src.replace(/<(rect|circle|path|polygon|polyline|line|ellipse|text)([^>]*?)\/>/g, (m, tag, b) => {
    i++;
    const a = {}; let x; ATTR.lastIndex = 0;
    while ((x = ATTR.exec(b))) a[x[1]] = x[2];
    if (tag === 'text') { a.fill = INK; a.opacity = .88; return '<text ' + ser(a) + '>'; }
    const filled = a.fill && a.fill !== 'none';
    if (!filled) {
      a.fill = 'none'; a.stroke = INK; a.opacity = .9;
      a['stroke-width'] = +Math.max(.85, parseFloat(a['stroke-width'] || 2) * .68).toFixed(2);
      return '<' + tag + ' ' + ser(a) + '/>';
    }
    const tone = toneOf(lum(a.fill));
    jit(tag, a, seed + i);
    delete a.opacity; delete a.stroke; delete a['stroke-width'];
    let out = '';
    for (let k = 0; k < STAMP; k++) {
      const ang = rnd(seed + i, k * 3 + 1) * Math.PI * 2;
      const rad = 1.7 * Math.sqrt(rnd(seed + i, k * 3 + 2));
      const dx = +(Math.cos(ang) * rad).toFixed(2), dy = +(Math.sin(ang) * rad).toFixed(2);
      const op = +(tone * (.85 + rnd(seed + i, k * 3 + 3) * .4)).toFixed(3);
      out += '<' + tag + ' ' + ser({ ...a, fill: INK, stroke: 'none', opacity: op, transform: 'translate(' + dx + ' ' + dy + ')' }) + '/>';
    }
    // 水痕边
    for (let k = 0; k < 2; k++) {
      const dx = +((rnd(seed + i, 40 + k) * 2 - 1) * 1.3).toFixed(2), dy = +((rnd(seed + i, 50 + k) * 2 - 1) * 1.2).toFixed(2);
      out += '<' + tag + ' ' + ser({ ...a, fill: 'none', stroke: INK, 'stroke-width': 1.05, opacity: .34, transform: 'translate(' + dx + ' ' + dy + ')' }) + '/>';
    }
    // 飞白：以形状自身为裁剪区，里面走几笔纸色短痕
    const cid = 'cw' + i;
    const clip = '<clipPath id="' + cid + '"><' + tag + ' ' + ser(a) + '/></clipPath>';
    let dry = '';
    for (let k = 0; k < 3; k++) {
      const y0 = 8 + rnd(seed + i, 60 + k) * 84;
      const x0 = 4 + rnd(seed + i, 70 + k) * 40;
      const len = 30 + rnd(seed + i, 80 + k) * 55;
      const tilt = (rnd(seed + i, 90 + k) * 2 - 1) * 8;
      dry += '<path d="M' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' q' + (len / 2).toFixed(1) + ',' + tilt.toFixed(1) + ' ' + len.toFixed(1) + ',0" fill="none" stroke="' + PAPER + '" stroke-width="' + (2.6 + rnd(seed + i, 100 + k) * 3.4).toFixed(1) + '" stroke-linecap="round" opacity="' + (.16 + rnd(seed + i, 110 + k) * .16).toFixed(2) + '"/>';
    }
    return out + clip + '<g clip-path="url(#' + cid + ')">' + dry + '</g>';
  });
}

function washCard(word, size = 200) {
  const seed = hash(word);
  const body = washify(artOf(word), word);
  const speck = Array.from({ length: 9 }, (_, k) => {
    const x = 5 + rnd(word + 'x', k) * 90, y = 5 + rnd(word + 'y', k) * 90;
    const r = (.5 + rnd(word + 'r', k) * 1.8).toFixed(1);
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + INK + '" opacity="' + (.05 + rnd(word + 'o', k) * .12).toFixed(2) + '"/>';
  }).join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" overflow="hidden">'
    + '<rect width="100" height="100" fill="' + PAPER + '"/>'
    + speck
    + '<g transform="translate(4 4) scale(.92)">' + body + '</g>'
    + '<g transform="translate(84.5 83.5)"><rect x="0" y="0" width="9.5" height="9.5" rx="1" fill="#a8392c" opacity=".85"/>'
    + '<text x="4.75" y="5.0" text-anchor="middle" dominant-baseline="central" font-family="Kaiti SC,STKaiti,serif" font-size="5.8" fill="' + PAPER + '">' + [...word][0] + '</text></g>'
    + '</svg>';
}

module.exports = { washCard, washify, artOf };

if (require.main === module) {
  const WORDS = ['山水', '风雨', '车船', '花木', '小猫', '学校'];
  const T = 200, GAP = 14, PAIR = T * 2 + GAP, PAD = 54, HP = 46;
  const CW = PAD * 2 + PAIR * 2 + HP;
  const HEAD = 158, ROWL = T + 34 + 42;
  const CH = HEAD + ROWL * 3 + 26;
  const put = (s, x, y) => '<g transform="translate(' + x + ' ' + y + ')">' + s + '</g>';
  const cell = (w, x, y) => put(illustrate(w, { size: T }), x, y) + put(washCard(w, T), x + T + GAP, y)
    + '<text x="' + (x + T + GAP / 2) + '" y="' + (y + T + 24) + '" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="16" fill="#8a8073" letter-spacing="1">' + w + '</text>';
  const cap = (x, t, c) => '<text x="' + x + '" y="' + (HEAD - 30) + '" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="' + c + '">' + t + '</text>';
  const rows = [0, 1, 2].map(r => cell(WORDS[r * 2], PAD, HEAD + r * ROWL) + cell(WORDS[r * 2 + 1], PAD + PAIR + HP, HEAD + r * ROWL)).join('');
  const out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CW + ' ' + CH + '" width="' + CW + '" height="' + CH + '">'
    + '<rect width="' + CW + '" height="' + CH + '" fill="#fdfaf3"/>'
    + '<text x="' + CW / 2 + '" y="66" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="34" fill="#241f1b" letter-spacing="2">同一个词，两种画法</text>'
    + '<text x="' + CW / 2 + '" y="100" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#8a8073">左：现在的彩色图元　右：水墨晕染（同一套坐标，色块换成多点叠印的墨块 + 水痕边 + 飞白）</text>'
    + cap(PAD + T / 2, '现版 · 彩色图元', '#a0968a') + cap(PAD + T + GAP + T / 2, '水墨晕染', '#241f1b')
    + cap(PAD + PAIR + HP + T / 2, '现版', '#a0968a') + cap(PAD + PAIR + HP + T + GAP + T / 2, '水墨晕染', '#241f1b')
    + '<line x1="' + PAD + '" y1="' + (HEAD - 14) + '" x2="' + (CW - PAD) + '" y2="' + (HEAD - 14) + '" stroke="#ded5c4" stroke-width="1"/>'
    + rows
    + '<text x="' + CW / 2 + '" y="' + (CH - 16) + '" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="13" fill="#a0968a">全部由字符串拼成的 SVG 生成，无图片素材、无生图模型</text></svg>';
  require('fs').writeFileSync('/tmp/wash.svg', out);
  console.log('ok', CW, CH);
}
