/* 墨线涂鸦：把 illus.js 同一批图元"只描边 + 手抖一笔"，不另画一套 */
'use strict';
const { illustrate, CHARMAP } = require('./illus.js');

const INK = '#2b2622', INK2 = '#6f665c', PAPER = '#faf6ec';

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const rnd = (seed, i) => ((hash(seed + '#' + i) % 1000) / 1000);

/* 取出 illustrate() 里的"画"部分（去掉纸底与色带） */
function artOf(word) {
  const svg = illustrate(word, { size: 100 });
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  // 纸底（rx=12 的整幅 rect）与顶部 2.5 高色带
  return inner
    .replace(/<rect[^>]*fill="#f7f1e4"[^>]*rx="12"[^>]*\/>/, '')
    .replace(/<rect[^>]*width="88"[^>]*height="2.5"[^>]*\/>/, '');
}

const ATTR = /([a-zA-Z][a-zA-Z0-9:-]*)="([^"]*)"/g;

/* 逐元素改属性：实色填充 → 空心描边 */
function lineify(src, seed) {
  let i = 0;
  return src.replace(/<(rect|circle|path|polygon|polyline|line|ellipse|text)([^>]*?)\/>/g, (m, tag, body) => {
    i++;
    const a = {}; let x;
    ATTR.lastIndex = 0;
    while ((x = ATTR.exec(body))) a[x[1]] = x[2];
    if (tag === 'text') {
      a.fill = INK; a.stroke = 'none';
      return `<text ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>`;
    }
    const filled = a.fill && a.fill !== 'none';
    const hadStroke = a.stroke && a.stroke !== 'none';
    const w0 = hadStroke ? parseFloat(a['stroke-width'] || 2) : 0;
    const j = rnd(seed, i);
    let w = filled ? 1.35 + j * .55 : Math.max(1.05, w0 * .5);
    if (hadStroke && !filled) a.stroke = INK2;
    else a.stroke = INK;
    a['stroke-width'] = (+w.toFixed(2));
    a.fill = 'none';
    a['stroke-linecap'] = 'round'; a['stroke-linejoin'] = 'round';
    // 手抖：整体微位移
    const dx = ((j * 2 - 1) * .9).toFixed(2), dy = ((rnd(seed, i + 77) * 2 - 1) * .75).toFixed(2);
    const t = `translate(${dx} ${dy})`;
    const inner = `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`;
    return `<g transform="${t}">${inner}</g>`;
  });
}

const W = (n, s) => Math.round(n * s * 100) / 100;

/* 涂鸦卡：纸 + 手绘双框 + 描边画 + 落款 */
function doodleCard(word, size = 200) {
  const art = lineify(artOf(word), word);
  const seed = hash(word);
  const specks = Array.from({ length: 14 }, (_, k) => {
    const x = 4 + rnd(word + 's', k) * 92, y = 4 + rnd(word + 't', k) * 92;
    return `<circle cx="${W(x, 1)}" cy="${W(y, 1)}" r="${W(.5 + rnd(word + 'r', k) * .6, 1)}" fill="${INK}" opacity="${.10 + rnd(word + 'o', k) * .12}"/>`;
  }).join('');
  // 手绘边框：四条微微起伏的折线，不是规整矩形
  const side = (x1, y1, x2, y2, k) => {
    const n = 10, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, nx = -(y2 - y1), ny = (x2 - x1), len = Math.hypot(nx, ny) || 1;
      const off = (rnd(word + k, i) * 2 - 1) * .9;
      pts.push(`${W(x1 + (x2 - x1) * t + nx / len * off, 1)},${W(y1 + (y2 - y1) * t + ny / len * off, 1)}`);
    }
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".5" stroke-linecap="round"/>`;
  };
  const frame = side(5.2, 6.6, 95, 5.4, 'a') + side(94.8, 5.2, 94.6, 94.8, 'b')
    + side(95, 93.6, 5, 94.6, 'c') + side(5.4, 94.8, 5.0, 5.2, 'd');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" overflow="hidden">
<rect x="0" y="0" width="100" height="100" fill="${PAPER}"/>
${specks}
${frame}
<g transform="translate(1.5 2) scale(.97)">${art}</g>
</svg>`;
}

module.exports = { doodleCard, lineify, artOf };

/* ---------- 对照样张 ---------- */
if (require.main === module) {
  const { illustrate } = require('./illus.js');
  const WORDS = ['山水', '风雨', '车船', '花木', '小猫', '学校'];
  const T = 200, GAP = 14, PAIR = T * 2 + GAP, PAD = 54;
  const CW = PAD * 2 + PAIR * 2 + 46;
  const HEAD = 158, ROWL = T + 34 + 42;
  const CH = HEAD + ROWL * 3 + 26;

  const put = (s, x, y) => `<g transform="translate(${x} ${y})">${s}</g>`;

  const rows = WORDS.map((w, r) => {
    const pair = (px, idx) => {
      const ox = PAD + px;
      const oy = HEAD + r * ROWL;
      return put(`<g>${illustrate(w, { size: T })}</g>`, ox, oy)
        + put(doodleCard(w, T), ox + T + GAP, oy)
        + `<text x="${ox + T + GAP / 2}" y="${oy + T + 20}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="17" fill="#8a8073">${w}</text>`;
    };
    return pair(0, 0) + pair(PAIR + 46, 1) && (put(`${illustrate(w, { size: T })}`, PAD, HEAD + r * ROWL)
      + put(doodleCard(w, T), PAD + T + GAP, HEAD + r * ROWL)
      + `<text x="${PAD + T + GAP / 2}" y="${HEAD + r * ROWL + T + 22}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="17" fill="#8a8073">${w}</text>`
      + put(`${illustrate(WORDS[r], { size: T })}`, PAD + PAIR + 46, HEAD + r * ROWL));
  });

  /* 只排 3 行 × 2 组（每组 = 现版 + 涂鸦），共 6 词 */
  const six = WORDS;
  const rowFor = (r) => {
    const y = HEAD + r * ROWL;
    const cell = (w, x) => put(illustrate(w, { size: T }), x, y) + put(doodleCard(w, T), x + T + GAP, y)
      + `<text x="${x + T + GAP / 2}" y="${y + T + 24}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="16" fill="#8a8073" letter-spacing="1">${w}</text>`;
    return cell(six[r * 2], PAD) + cell(six[r * 2 + 1], PAD + PAIR + 46);
  };

  const cols = `
<text x="${PAD + T / 2}" y="${HEAD - 30}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#a0968a">现版 · 彩色图元</text>
<text x="${PAD + T + GAP + T / 2}" y="${HEAD - 30}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#b23a2f">墨线涂鸦 · 同构图只描边</text>
<text x="${PAD + PAIR + 46 + T / 2}" y="${HEAD - 30}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#a0968a">现版</text>
<text x="${PAD + PAIR + 46 + T + GAP + T / 2}" y="${HEAD - 30}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#b23a2f">墨线涂鸦</text>`;

  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}">
<rect x="0" y="0" width="${CW}" height="${CH}" fill="#fdfaf3"/>
<text x="${CW / 2}" y="66" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="34" fill="#2b2622" letter-spacing="2">同一个词，两种画法</text>
<text x="${CW / 2}" y="100" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="15" fill="#8a8073">左：现在的彩色图元　右：墨线涂鸦（同一套坐标，只把填充改成描边 + 手抖）</text>
${cols}
<line x1="${PAD}" y1="${HEAD - 14}" x2="${CW - PAD}" y2="${HEAD - 14}" stroke="#ded5c4" stroke-width="1"/>
${[0, 1, 2].map(rowFor).join('')}
<text x="${CW / 2}" y="${CH - 16}" text-anchor="middle" font-family="Kaiti SC,STKaiti,serif" font-size="13" fill="#a0968a">全部由字符串拼成的 SVG 生成，无图片素材、无生图模型</text>
</svg>`;
  require('fs').writeFileSync('/tmp/doodle.svg', out);
  console.log('ok', CW, CH);
}
