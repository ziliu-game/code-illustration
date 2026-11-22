/* 墨线涂鸦动画：逐笔书写（stroke-dashoffset）+ 线条抖动（boil） */
'use strict';
const { artOf } = require('./doodle.js');

const INK = '#2b2622', INK2 = '#6f665c', PAPER = '#faf6ec';
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const rnd = (s, i) => ((hash(s + '#' + i) % 1000) / 1000);
const ATTR = /([a-zA-Z-]+)="([^"]*)"/g;
const ser = o => Object.entries(o).map(([k, v]) => k + '="' + v + '"').join(' ');
const DASH = 480;

/* t: 0..1 总进度；f: 当前帧号（用于抖动不同相位） */
function animArt(word, t, f) {
  let i = 0;
  const src = artOf(word);
  const N = (src.match(/<(rect|circle|path|polygon|polyline|line|ellipse|text)[^>]*?\/>/g) || []).length || 1;
  return src.replace(/<(rect|circle|path|polygon|polyline|line|ellipse|text)([^>]*?)\/>/g, (m, tag, b) => {
    i++;
    const a = {}; let x; ATTR.lastIndex = 0;
    while ((x = ATTR.exec(b))) a[x[1]] = x[2];
    const start = ((i - 1) / N) * .55;           // 每笔起点错开
    const p = Math.max(0, Math.min(1, (t - start) / .45));
    // 抖动：每 3 帧换一个相位
    const ph = Math.floor(f / 3) * 7 + i * 3;
    const bx = ((rnd(word + 'bx', ph) * 2 - 1) * .75).toFixed(2);
    const by = ((rnd(word + 'by', ph) * 2 - 1) * .6).toFixed(2);

    if (tag === 'text') {
      a.fill = INK; a.stroke = 'none'; a.opacity = p > .9 ? 1 : 0;
      return '<text ' + ser(a) + '>';
    }
    const filled = a.fill && a.fill !== 'none';
    const hadStroke = a.stroke && a.stroke !== 'none';
    const w0 = hadStroke ? parseFloat(a['stroke-width'] || 2) : 0;
    const w = +Math.max(1.05, (filled ? 1.5 : w0 * .5)).toFixed(2);
    delete a.opacity;
    a.fill = 'none';
    a.stroke = filled ? INK : INK2;
    a['stroke-width'] = w;
    a['stroke-linecap'] = 'round'; a['stroke-linejoin'] = 'round';
    a['stroke-dasharray'] = DASH + ' ' + DASH;
    a['stroke-dashoffset'] = +(DASH * (1 - p)).toFixed(1);
    return '<g transform="translate(' + bx + ' ' + by + ')"><' + tag + ' ' + ser(a) + '/></g>';
  });
}

function animFrame(word, t, f, size = 320) {
  const seed = hash(word);
  const specks = Array.from({ length: 12 }, (_, k) => {
    const x = 4 + rnd(word + 's', k) * 92, y = 4 + rnd(word + 't', k) * 92;
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (.5 + rnd(word + 'r', k) * .6).toFixed(1) + '" fill="' + INK + '" opacity="' + (.10 + rnd(word + 'o', k) * .12).toFixed(2) + '"/>';
  }).join('');
  const side = (x1, y1, x2, y2, k) => {
    const n = 10, pts = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, nx = -(y2 - y1), ny = (x2 - x1), len = Math.hypot(nx, ny) || 1;
      const off = (rnd(word + k, j) * 2 - 1) * .9;
      pts.push((x1 + (x2 - x1) * u + nx / len * off).toFixed(1) + ',' + (y1 + (y2 - y1) * u + ny / len * off).toFixed(1));
    }
    return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + INK + '" stroke-width="1.1" opacity=".5" stroke-linecap="round"/>';
  };
  const frame = side(5.2, 6.6, 95, 5.4, 'a') + side(94.8, 5.2, 94.6, 94.8, 'b')
    + side(95, 93.6, 5, 94.6, 'c') + side(5.4, 94.8, 5.0, 5.2, 'd');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" overflow="hidden">'
    + '<rect width="100" height="100" fill="' + PAPER + '"/>' + specks + frame
    + '<g transform="translate(1.5 2) scale(.97)">' + animArt(word, t, f) + '</g></svg>';
}

module.exports = { animFrame, animArt };

/* 生成循环 GIF：前 60% 逐笔写，后 40% 抖动 */
if (require.main === module) {
  const word = process.argv[2] || '山水';
  const FPS = 14, FRAMES = 42;
  const fs = require('fs'), path = require('path');
  const dir = '/tmp/anim_' + word;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let f = 0; f < FRAMES; f++) {
    const u = f / FRAMES;
    const t = u < .78 ? Math.min(1, u / .78) : 1;
    fs.writeFileSync(path.join(dir, 'f' + String(f).padStart(3, '0') + '.svg'), animFrame(word, t, f, 360));
  }
  console.log('frames', FRAMES);
}
