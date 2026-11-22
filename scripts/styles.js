/**
 * 代码绘图风格谱系 —— 同一题材「山·月·松」，12 种程序化画法
 * 全部为字符串拼 SVG，无位图、无生图模型。
 */
const fs = require('fs');

/* ---------- 通用 ---------- */
const el = (t, a = {}, kids = '') => {
  const s = Object.entries(a).filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v}"`).join(' ');
  return kids ? `<${t} ${s}>${kids}</${t}>` : `<${t} ${s}/>`;
};
const G = (...k) => k.filter(Boolean).join('');
const cir = (cx, cy, r, fill, ex = {}) => el('circle', { cx, cy, r, fill, ...ex });
const rct = (x, y, w, h, fill, ex = {}) => el('rect', { x, y, width: w, height: h, fill, ...ex });
const pth = (d, fill, ex = {}) => el('path', { d, fill, ...ex });
const pol = (pts, fill, ex = {}) => el('polygon', { points: pts, fill, ...ex });
const ln = (x1, y1, x2, y2, w, stroke, ex = {}) => el('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round', ...ex });
const txt = (x, y, s, size, fill, extra = {}) => el('text', { x, y, 'text-anchor': 'middle', 'font-family': 'PingFang SC,Noto Sans CJK SC,sans-serif', 'font-size': size, fill, ...extra }, s);

function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- 场景几何（0..100 坐标系） ---------- */
const SKY = { y: 6, h: 76 };
const MTN_BACK = [[8, 82], [30, 48], [44, 62], [58, 42], [80, 82]];
const MTN_FRONT = [[26, 82], [46, 54], [60, 68], [72, 60], [92, 82]];
const MOON = { x: 73, y: 27, r: 13 };
const PINE = { x: 19, base: 82, top: 44 };
const pinTris = () => [
  [[9, 64], [29, 64], [19, 48]],
  [[11, 72], [27, 72], [19, 58]],
  [[13, 80], [25, 80], [19, 70]]
];

/* ---------- 12 种风格 ---------- */
const STYLES = [];

/* 1 扁平图标 */
STYLES.push({
  name: '扁平矢量图标', note: '几何块面 · 统一描边 · 4 色',
  draw: () => G(
    rct(0, 0, 100, 100, '#f7f1e4'),
    pth('M0,6 H100 V78 H0 Z', '#dfe9ee'),
    pol(MTN_BACK.map(p => p.join(',')).join(' '), '#b9cdd6', { stroke: '#2f2a26', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    pol(MTN_FRONT.map(p => p.join(',')).join(' '), '#eef3f2', { stroke: '#2f2a26', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    cir(MOON.x, MOON.y, MOON.r, '#e9b44c', { stroke: '#2f2a26', 'stroke-width': 2 }),
    rct(PINE.x - 2, 68, 4, 14, '#9a6a45', { stroke: '#2f2a26', 'stroke-width': 1.8 }),
    pinTris().map(t => pol(t.join(','), '#3f7a63', { stroke: '#2f2a26', 'stroke-width': 2, 'stroke-linejoin': 'round' })).join(''),
    ln(4, 82, 96, 82, 2.4, '#2f2a26')
  )
});

/* 2 单线涂鸦 */
STYLES.push({
  name: '单线涂鸦线稿', note: '一笔抖动 · 只描边 · 手账感',
  draw: () => {
    const R = rnd(7), ink = '#33302c';
    const jit = (pts, amp = 1.4) => pts.map(([x, y]) => `${(x + (R() - .5) * amp).toFixed(1)},${(y + (R() - .5) * amp).toFixed(1)}`).join(' ');
    const hatch = (pts, n) => {
      let out = '';
      for (let i = 1; i < n; i++) {
        const t = i / n, [x1, y1] = pts[0], [x2, y2] = pts[2];
        out += ln(x1 + (x2 - x1) * t + 3, y1 + (y2 - y1) * t - 3, x1 + (x2 - x1) * t + 9, y1 + (y2 - y1) * t + 5, 1.1, ink);
      }
      return out;
    };
    return G(
      rct(0, 0, 100, 100, '#fbf6ea'),
      pth(`M4,70 Q16,52 26,64 Q36,48 50,66 Q64,50 76,64 Q86,56 96,70`, 'none', { stroke: ink, 'stroke-width': 1.6, fill: 'none' }),
      pth(`M26,82 L46,54 L60,68 L72,60 L92,82`, 'none', { stroke: ink, 'stroke-width': 2, fill: 'none' }),
      hatch(MTN_FRONT, 16),
      pol(pinTris()[0].join(','), 'none', { stroke: ink, 'stroke-width': 1.8 }),
      pol(pinTris()[1].join(','), 'none', { stroke: ink, 'stroke-width': 1.8 }),
      ln(19, 70, 19, 82, 1.6, ink),
      cir(MOON.x, MOON.y, MOON.r, 'none', { stroke: ink, 'stroke-width': 1.8 }),
      // 手绘式螺旋月亮
      pth(`M${MOON.x - 4},${MOON.y - 4} q6,-5 9,2 q3,8 -6,9 q-8,1 -8,-7 q0,-6 6,-6`, 'none', { stroke: ink, 'stroke-width': 1.1, fill: 'none' }),
      ln(4, 86, 96, 86, 1.4, ink),
      txt(94, 14, '速写', 4.5, '#a89c8c', { 'text-anchor': 'end', 'font-style': 'italic' })
    );
  }
});

/* 3 像素 8-bit */
STYLES.push({
  name: '像素 8-bit', note: '32×32 网格 · 5 色调色板',
  draw: () => {
    const N = 32, cell = 100 / N, R = rnd(5);
    const pal = { sky1: '#16263d', sky2: '#1f3b5c', sky3: '#2c5578', mtn: '#0e1a28', mtnLit: '#24435f', moon: '#f6e2a8', tree: '#1f4a3a', ground: '#0a1118' };
    const ridge = x => 40 + 26 * Math.exp(-((x - 34) ** 2) / 620) + 20 * Math.exp(-((x - 62) ** 2) / 420);
    const inPine = (x, y) => {
      const px = 15, top = 44, base = 78;
      if (x < px - 7 || x > px + 7 || y < top || y > base) return false;
      const t = (y - top) / (base - top);
      return Math.abs(x - px) < 3 + t * 5;
    };
    let out = '';
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + .5) * cell, y = (j + .5) * cell;
      const h = ridge(x);
      let c;
      if (Math.hypot(x - 72, y - 24) < 13) c = pal.moon;
      else if (inPine(x, y)) c = pal.tree;
      else if (y > h + 14) c = pal.mtn;
      else if (y > h) c = (Math.abs(x - 34) < 9 ? pal.mtnLit : pal.mtn);
      else if (y > 82) c = pal.ground;
      else c = y < 30 ? pal.sky1 : y < 55 ? pal.sky2 : pal.sky3;
      if ((i + j) % 2 === 0 && c === pal.sky2) c = pal.sky1;
      if (y > 84) c = pal.ground;
      out += rct(i * cell, j * cell, cell + .35, cell + .35, c);
    }
    return G(out, rct(0, 0, 100, 100, 'none', { stroke: '#0a1118', 'stroke-width': 2.2 }));
  }
});

/* 4 流场线 */
STYLES.push({
  name: '流场线（Flow Field）', note: '约 500 条短线 · 噪声场定向',
  draw: () => {
    const R = rnd(11);
    const field = (x, y) => Math.sin(x * .05) * Math.cos(y * .045 + 1.1) * 2.2 + Math.cos(x * .11 - y * .03) * 1.0;
    const ridge = x => 44 + 24 * Math.exp(-((x - 34) ** 2) / 700) + 17 * Math.exp(-((x - 62) ** 2) / 460);
    let out = '';
    for (let k = 0; k < 520; k++) {
      let x = R() * 100, y = R() * 100;
      const inside = y > ridge(x) || (Math.abs(x - 15) < 9 && y > 46);
      const steps = 5 + Math.floor(R() * 6);
      let d = '';
      for (let t = 0; t < steps; t++) {
        d += `${t ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
        const a = field(x, y) * 1.25;
        x += Math.cos(a) * 2.2; y += Math.sin(a) * 2.2;
      }
      const dm = Math.hypot(x - 72, y - 24);
      if (dm < 12) continue;
      const nearMoon = dm < 18;
      out += el('path', {
        d, fill: 'none',
        stroke: inside ? '#13293b' : (nearMoon ? '#c9772f' : '#7ba6bb'),
        'stroke-width': inside ? .75 : .5,
        opacity: inside ? .85 : (nearMoon ? .85 : .55),
        'stroke-linecap': 'round'
      });
    }
    let ridgeLine = '';
    for (let x = 0; x <= 100; x += 1.5) ridgeLine += `${x},${ridge(x).toFixed(1)} `;
    return G(
      rct(0, 0, 100, 100, '#f1f4f1'),
      out,
      el('polyline', { points: ridgeLine, fill: 'none', stroke: '#2a4a5c', 'stroke-width': .7, opacity: .45 }),
      cir(72, 24, 12.5, '#fbfdfd', { opacity: .98 }),
      cir(72, 24, 12.5, 'none', { stroke: '#d8892f', 'stroke-width': 1.4 }),
      cir(72, 24, 3, '#e9a13f')
    );
  }
});

/* 5 等距体素 */
STYLES.push({
  name: '等距体素', note: '立方体堆叠 · 三面明暗',
  draw: () => {
    const N = 13, u = 4.1, ox = 50, oy = 26;
    const proj = (i, j, k) => [ox + (i - j) * u * 1.5, oy + (i + j) * u * .75 - k * u * 1.5];
    const cube = (i, j, k, top, left, right) => {
      const [x, y] = proj(i, j, k), w = u * 1.5, h = u * .75, d = u * 1.5;
      return G(
        pol(`${x},${y - h} ${x + w},${y} ${x},${y + h} ${x - w},${y}`, top),
        pol(`${x - w},${y} ${x},${y + h} ${x},${y + h + d} ${x - w},${y + d}`, left),
        pol(`${x + w},${y} ${x},${y + h} ${x},${y + h + d} ${x + w},${y + d}`, right)
      );
    };
    const H = (i, j) => {
      const a = 5.2 * Math.exp(-((i - 2.5) ** 2) / 6 - ((j - 6) ** 2) / 12);
      const b = 3.6 * Math.exp(-((i - 10) ** 2) / 8 - ((j - 4) ** 2) / 9);
      return Math.max(0, Math.round(1 + a + b));
    };
    let out = '';
    for (let s = 0; s < N * 2; s++) for (let i = 0; i < N; i++) {
      const j = s - i; if (j < 0 || j >= N) continue;
      const h = H(i, j);
      for (let k = 0; k < h; k++) {
        out += cube(i, j, k, k === h - 1 ? '#e7f1ea' : '#a9c8bb', k === h - 1 ? '#7ea694' : '#7ea694', k === h - 1 ? '#547f6f' : '#547f6f');
      }
    }
    // 悬空的"月"：三块暖色体素
    out += cube(8, 2, 8, '#ffe6a8', '#e0a53c', '#b97f22');
    out += cube(9, 2, 8, '#fff0c4', '#e8b451', '#c68a2b');
    out += cube(8, 3, 8, '#f9dc94', '#d99b32', '#b0761e');
    // 松：一根高柱
    for (let k = 0; k < 3; k++) out += cube(5, 9, k, '#d7ead9', '#84ad91', '#4f7a63');
    out += cube(5, 9, 3, '#cfe6d2', '#7ea88a', '#4b7460');
    return G(rct(0, 0, 100, 100, '#f0f4ee'), out);
  }
});

/* 6 包豪斯几何 */
STYLES.push({
  name: '包豪斯几何构成', note: '圆 / 三角 / 条块 · 三原色',
  draw: () => G(
    rct(0, 0, 100, 100, '#f2e8d5'),
    rct(0, 74, 100, 12, '#20201e'),
    cir(70, 30, 17, '#e0a51c'),
    pth('M10,74 L30,44 L50,74 Z', '#1f4e79'),
    pth('M44,74 L64,50 L84,74 Z', '#b8352c'),
    rct(84, 14, 5, 60, '#20201e'),
    pth('M14,74 L14,40 L26,74 Z', '#3f7a63'),
    cir(20, 34, 4.4, '#20201e'),
    cir(56, 86, 7, '#f2e8d5', { opacity: 0 }),
    pth('M52,86 a7,7 0 0,0 14,0 Z', '#f2e8d5')
  )
});

/* 7 丝网印刷（网点 + 错版） */
STYLES.push({
  name: '丝网印刷 / 网点', note: '双色叠印 · 半调网屏 · 轻微错位',
  draw: () => {
    const ink1 = '#ef5b52', ink2 = '#28457f', ink3 = '#3f7a63';
    const dots = (x0, y0, w, h, step, rfn, color) => {
      let o = '';
      for (let y = y0; y < y0 + h; y += step) for (let x = x0; x < x0 + w; x += step) {
        const r = rfn(x, y); if (r <= .3) continue;
        o += cir(x, y, r, color);
      }
      return o;
    };
    const skyPath = 'M0,0 H100 V56 H0 Z';
    const mtnPath = 'M12,82 L34,44 L52,66 L66,50 L92,82 Z';
    const pinePath = 'M15,74 L7,52 L23,52 Z M15,82 L5,64 L25,64 Z';
    return G(
      rct(0, 0, 100, 100, '#fbf3e2'),
      el('clipPath', { id: 'rs0' }, pth(skyPath, '#000')),
      el('g', { 'clip-path': 'url(#rs0)' }, dots(0, 4, 100, 56, 4.6, (x, y) => 1.4 + Math.sin(x * .18) * .9, ink2)),
      el('clipPath', { id: 'rs1' }, pth(mtnPath, '#000')),
      el('g', { 'clip-path': 'url(#rs1)' }, dots(0, 42, 100, 42, 3.6, (x, y) => 2.6 - (y - 42) * .035, ink1)),
      el('clipPath', { id: 'rs2' }, pth(pinePath, '#000')),
      el('g', { 'clip-path': 'url(#rs2)' }, dots(2, 50, 30, 34, 3.2, () => 1.8, ink3)),
      pol('12,82 34,44 52,66 66,50 92,82', 'none', { stroke: ink1, 'stroke-width': 1.1, opacity: .8 }),
      el('g', { transform: 'translate(1.2,-1)' }, cir(72, 26, 15, '#f7943e')),
      cir(72, 26, 15, 'none', { stroke: ink1, 'stroke-width': .8 }),
      ln(0, 84, 100, 84, 3.2, ink2),
      txt(96, 78, '2C', 4.2, ink2, { 'text-anchor': 'end', opacity: .75 })
    );
  }
});

/* 8 工程蓝图 */
STYLES.push({
  name: '工程蓝图', note: '深底白线 · 网格 · 标注',
  draw: () => {
    let grid = '';
    for (let i = 0; i <= 100; i += 10) grid += ln(i, 0, i, 100, .4, '#1e4f7d', { opacity: .55 }) + ln(0, i, 100, i, .4, '#1e4f7d', { opacity: .55 });
    let hatch = '';
    for (let i = -30; i < 120; i += 6) hatch += el('line', { x1: i, y1: 82, x2: i + 30, y2: 44, stroke: '#9cc7ea', 'stroke-width': .6, opacity: .7 });
    return G(
      rct(0, 0, 100, 100, '#0d2c4a'),
      grid,
      el('clipPath', { id: 'clB' }, pth('M26,82 L46,54 L60,68 L72,60 L92,82 Z', '#000')),
      el('g', { 'clip-path': 'url(#clB)' }, hatch),
      pth('M8,82 L30,48 L44,62 L58,42 L80,82 Z', 'none', { stroke: '#cfe6fb', 'stroke-width': 1.4 }),
      pth('M26,82 L46,54 L60,68 L72,60 L92,82 Z', 'none', { stroke: '#ffffff', 'stroke-width': 1.8 }),
      cir(MOON.x, MOON.y, MOON.r, 'none', { stroke: '#ffffff', 'stroke-width': 1.6 }),
      ln(MOON.x, MOON.y, MOON.x + MOON.r, MOON.y, .8, '#ffffff'),
      txt(MOON.x + MOON.r + 3, MOON.y + 1.5, 'R13', 3.6, '#cfe6fb', { 'text-anchor': 'start' }),
      ln(26, 88, 92, 88, .8, '#9cc7ea'),
      ln(26, 86, 26, 90, .8, '#9cc7ea'), ln(92, 86, 92, 90, .8, '#9cc7ea'),
      txt(59, 94, '66.0', 3.8, '#cfe6fb'),
      // 树：三视图式轮廓
      pol(pinTris()[0].join(','), 'none', { stroke: '#ffffff', 'stroke-width': 1.2 }),
      pol(pinTris()[1].join(','), 'none', { stroke: '#ffffff', 'stroke-width': 1.2 }),
      ln(19, 70, 19, 82, 1.2, '#ffffff'),
      ln(19, 82, 19, 88, .8, '#9cc7ea', { 'stroke-dasharray': '2 2' }),
      rct(64, 86, 32, 11, 'none', { stroke: '#9cc7ea', 'stroke-width': .8 }),
      txt(80, 90.5, 'ZL-100 / 山月松', 2.8, '#cfe6fb'),
      txt(80, 94.6, 'SCALE 1:1', 2.4, '#8ab6d6')
    );
  }
});

/* 9 木刻排线 */
STYLES.push({
  name: '木刻 / 排线', note: '黑白 · 平行排线疏密',
  draw: () => {
    const hatchRegion = (id, path, angle, gap, w) => {
      let lines = '';
      const rad = angle * Math.PI / 180;
      for (let i = -40; i < 150; i += gap) {
        const x1 = i, y1 = -20, x2 = i + Math.sin(rad) * 200, y2 = -20 + Math.cos(rad) * 200;
        lines += ln(x1, y1, x2, y2, w, '#17140f');
      }
      return el('clipPath', { id }, pth(path, '#000')) + el('g', { 'clip-path': `url(#${id})` }, lines);
    };
    return G(
      rct(0, 0, 100, 100, '#f6efdf'),
      hatchRegion('hSky', 'M0,4 H100 V54 H0 Z', 0, 7.5, .8),
      hatchRegion('hMtn', 'M8,82 L30,48 L44,62 L58,42 L80,82 Z', 46, 3.2, 1.4),
      hatchRegion('hMtn2', 'M26,82 L46,54 L60,68 L72,60 L92,82 Z', 132, 2.2, 1.8),
      cir(MOON.x, MOON.y, MOON.r, '#f6efdf'),
      cir(MOON.x, MOON.y, MOON.r, 'none', { stroke: '#17140f', 'stroke-width': 1.6 }),
      pol(pinTris()[0].join(','), 'none', { stroke: '#17140f', 'stroke-width': 1.6 }),
      pol(pinTris()[1].join(','), 'none', { stroke: '#17140f', 'stroke-width': 1.6 }),
      pol(pinTris()[2].join(','), '#17140f'),
      rct(17, 76, 4, 8, '#17140f'),
      pth('M8,82 L30,48 L44,62 L58,42 L80,82 Z', 'none', { stroke: '#17140f', 'stroke-width': 2 }),
      pth('M26,82 L46,54 L60,68 L72,60 L92,82 Z', 'none', { stroke: '#17140f', 'stroke-width': 2.2 }),
      ln(2, 85, 98, 85, 2.4, '#17140f')
    );
  }
});

/* 10 低多边形 */
STYLES.push({
  name: '低多边形', note: '三角面片 · 按高度着色',
  draw: () => {
    const R = rnd(31), N = 9, pts = [];
    for (let j = 0; j <= N; j++) { pts[j] = []; for (let i = 0; i <= N; i++) {
      pts[j][i] = [i * 100 / N + (R() - .5) * 4, j * 100 / N + (R() - .5) * 4];
    }}
    const heightAt = (x, y) => {
      const ridge = 78 - 30 * Math.sin(Math.max(0, x / 100) * Math.PI * .95) - 8 + 6 * Math.cos(x * .2);
      return y > ridge ? 1 : 0;
    };
    const shade = (v, x, y) => {
      const dm = Math.hypot(x - MOON.x, y - MOON.y);
      if (dm < MOON.r + 2) return '#f2c56b';
      if (v > .5) return y > 76 ? '#24404f' : '#3c6a78';
      const sky = 1 - y / 100;
      return sky > .6 ? '#8fb6c8' : sky > .35 ? '#a8c6d2' : '#c8dae0';
    };
    const tri = (a, b, c) => {
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
      const v = Math.max(heightAt(a[0], a[1]), heightAt(b[0], b[1]), heightAt(c[0], c[1]));
      return pol(`${a.join(',')} ${b.join(',')} ${c.join(',')}`, shade(v, cx, cy), { stroke: 'rgba(255,255,255,.22)', 'stroke-width': .5 });
    };
    let out = '';
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      out += tri(pts[j][i], pts[j][i + 1], pts[j + 1][i]);
      out += tri(pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]);
    }
    return G(rct(0, 0, 100, 100, '#dceef5'), out);
  }
});

/* 11 霓虹线稿 */
STYLES.push({
  name: '霓虹发光', note: '黑底 · 三层描边叠出光晕',
  draw: () => {
    const glow = (d, color) => G(
      pth(d, 'none', { stroke: color, 'stroke-width': 8, opacity: .12, 'stroke-linecap': 'round' }),
      pth(d, 'none', { stroke: color, 'stroke-width': 4.2, opacity: .3, 'stroke-linecap': 'round' }),
      pth(d, 'none', { stroke: '#ffffff', 'stroke-width': 1.4, opacity: .95, 'stroke-linecap': 'round' })
    );
    const cyan = '#27e0ff', pink = '#ff3ea5';
    let grid = '';
    for (let i = 0; i <= 100; i += 10) grid += ln(i, 0, i, 100, .5, '#123', { opacity: .35 });
    return G(
      rct(0, 0, 100, 100, '#05070d'),
      grid,
      glow('M8,82 L30,48 L44,62 L58,42 L80,82', cyan),
      glow('M26,82 L46,54 L60,68 L72,60 L92,82', cyan),
      glow(`M${MOON.x - 13},${MOON.y} A13,13 0 1,1 ${MOON.x + 13},${MOON.y} A13,13 0 0,1 ${MOON.x - 13},${MOON.y}`, pink),
      glow('M19,44 L9,64 L29,64 Z', pink),
      glow('M19,58 L11,72 L27,72 Z', pink),
      glow('M19,70 L13,80 L25,80 Z', pink),
      ln(19, 80, 19, 84, 2, pink, { opacity: .8 }),
      ln(4, 88, 96, 88, 1.4, cyan, { opacity: .55 })
    );
  }
});

/* 12 水墨 */
STYLES.push({
  name: '水墨晕染', note: '渐变模拟墨色 · 大量留白',
  draw: () => {
    const defs = G(
      el('radialGradient', { id: 'w1', cx: '45%', cy: '55%', r: '55%' },
        G(el('stop', { offset: '0%', 'stop-color': '#33322e', 'stop-opacity': .8 }),
          el('stop', { offset: '60%', 'stop-color': '#33322e', 'stop-opacity': .35 }),
          el('stop', { offset: '100%', 'stop-color': '#33322e', 'stop-opacity': 0 }))),
      el('radialGradient', { id: 'w2', cx: '50%', cy: '50%', r: '55%' },
        G(el('stop', { offset: '0%', 'stop-color': '#171614', 'stop-opacity': .9 }),
          el('stop', { offset: '100%', 'stop-color': '#171614', 'stop-opacity': 0 }))),
      el('radialGradient', { id: 'w3', cx: '50%', cy: '50%', r: '50%' },
        G(el('stop', { offset: '0%', 'stop-color': '#a84a35', 'stop-opacity': .75 }),
          el('stop', { offset: '75%', 'stop-color': '#a84a35', 'stop-opacity': .18 }),
          el('stop', { offset: '100%', 'stop-color': '#a84a35', 'stop-opacity': 0 })))
    );
    return G(
      rct(0, 0, 100, 100, '#f5f1e7'),
      defs,
      // 远山：一层淡墨
      el('ellipse', { cx: 30, cy: 58, rx: 40, ry: 20, fill: 'url(#w1)', opacity: .45 }),
      el('ellipse', { cx: 62, cy: 66, rx: 34, ry: 17, fill: 'url(#w1)', opacity: .38 }),
      // 主山：浓墨压底
      el('ellipse', { cx: 46, cy: 78, rx: 26, ry: 13, fill: 'url(#w2)', opacity: .55 }),
      pth('M14,81 Q30,56 46,70 Q60,56 76,81', 'none', { stroke: '#26241f', 'stroke-width': 1.5, opacity: .6 }),
      el('ellipse', { cx: 44, cy: 74, rx: 22, ry: 10, fill: 'url(#w2)', opacity: .45 }),
      // 月
      el('ellipse', { cx: 74, cy: 24, rx: 15, ry: 15, fill: 'url(#w3)' }),
      cir(74, 24, 9.5, 'none', { stroke: '#a84a35', 'stroke-width': .9, opacity: .5 }),
      // 松：中锋用笔
      el('ellipse', { cx: 52, cy: 62, rx: 50, ry: 9, fill: '#f5f1e7', opacity: .62 }),
      pth('M20,79 Q19,66 20,50', 'none', { stroke: '#1b1a17', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: .9 }),
      pth('M20,57 Q13,58 7,63 Q14,62 20,60', '#1b1a17', { opacity: .78 }),
      pth('M20,62 Q27,63 33,69 Q26,68 20,66', '#1b1a17', { opacity: .78 }),
      pth('M20,68 Q14,70 10,76 Q17,74 20,71', '#1b1a17', { opacity: .72 }),
      pth('M20,74 Q25,76 29,81 Q23,79 20,77', '#1b1a17', { opacity: .7 }),
      // 朱印
      rct(79, 79, 10, 10, '#a84a35', { rx: 1.2, opacity: .9 }),
      txt(84, 86.2, '山', 4.8, '#f5f1e7')
    );
  }
});

/* ---------- 拼版 ---------- */
const TILE = 320, PAD = 30, HEAD = 110, LBL = 62;
const COLS = 4, ROWS = Math.ceil(STYLES.length / COLS);
const W = COLS * (TILE + PAD) + PAD;
const H = HEAD + ROWS * (TILE + LBL + PAD) + PAD;

const cells = STYLES.map((s, i) => {
  const cx = PAD + (i % COLS) * (TILE + PAD);
  const cy = HEAD + Math.floor(i / COLS) * (TILE + LBL + PAD);
  const body = s.draw();
  return G(
    el('svg', { x: cx, y: cy, width: TILE, height: TILE, viewBox: '0 0 100 100', overflow: 'hidden' }, body),
    rct(cx, cy, TILE, TILE, 'none', { stroke: '#d8cfbf', 'stroke-width': 1 }),
    txt(cx + 14, cy + TILE + 26, `${String(i + 1).padStart(2, '0')}`, 13, '#b8ac98', { 'text-anchor': 'start', 'font-weight': 700 }),
    txt(cx + 40, cy + TILE + 26, s.name, 15, '#2b2620', { 'text-anchor': 'start' }),
    txt(cx + 14, cy + TILE + 47, s.note, 11.5, '#8c8172', { 'text-anchor': 'start' })
  );
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="100%" height="100%" fill="#fbf7ef"/>
${txt(W / 2, 52, '代码画图，能画出多少种风格？', 26, '#2b2620')}
${txt(W / 2, 78, '同一题材「山 · 月 · 松」，12 种纯程序化画法 —— 没有一张图来自生图模型', 12.5, '#8c8172')}
${ln(PAD, 92, W - PAD, 92, 1, '#e2d8c8')}
${cells}
</svg>`;

const OUT = process.argv[2] || 'styles.svg';
fs.writeFileSync(OUT, svg);
console.log('wrote', OUT, W + 'x' + H);
