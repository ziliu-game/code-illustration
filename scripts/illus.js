/* ==========================================================================
   字流·配词 — 代码绘图插图库 illus.js
   纯字符串拼 SVG，不依赖任何生图模型、不引用外部图片。
   每个字 → 一份"图元"，词 → 两个图元拼成一张小卡（宣纸底 + 双景窗 + 色带）。
   接口：
     illustrate(word, {size, label}) -> SVG 字符串
     drawChar(ch, size)               -> 单字 SVG
     stats(words)                     -> {scene, badge, total}
   ========================================================================== */
'use strict';

/* ---------- 基础绘图 ---------- */
const el = (t, a = {}, kids = '') => {
  const s = Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return kids ? `<${t} ${s}>${kids}</${t}>` : `<${t} ${s}/>`;
};
const g = (...kids) => kids.filter(Boolean).join('');

const C = {
  ink: '#3b3330', ink2: '#6b6259', paper: '#f7f1e4', paper2: '#efe6d4',
  red: '#b23a2f', jade: '#3f7a63', blue: '#39628f', gold: '#c2933c',
  clay: '#b9704a', plum: '#a8637e', slate: '#7b7469', white: '#fffdf7'
};

const cir = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...extra });
const rct = (x, y, w, h, fill, extra = {}) => el('rect', { x, y, width: w, height: h, fill, ...extra });
const pth = (d, fill, extra = {}) => el('path', { d, fill, ...extra });
const pol = (pts, fill, extra = {}) => el('polygon', { points: pts, fill, ...extra });
const ln = (x1, y1, x2, y2, w = 4, stroke = C.ink) => el('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round' });
const arc = (d, w = 3.6, stroke = C.ink) => el('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const OUT = (w = 3.2) => ({ stroke: C.ink, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

/* ---------- 参数化图元（均画在 0..100 的方框里，地平线 y=78） ---------- */
const A = {};

/* 天空 / 天象 */
A.sun = (p = {}) => g(
  p.rays === false ? '' : [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
    const rad = a * Math.PI / 180, r1 = 26, r2 = 33;
    return ln(50 + r1 * Math.cos(rad), 42 + r1 * Math.sin(rad), 50 + r2 * Math.cos(rad), 42 + r2 * Math.sin(rad), 2.6, C.gold);
  }).join(''),
  cir(50, 42, 18, C.gold, OUT()),
  arc('M40,38 q10,8 20,0', 2.4, C.red)
);

A.moon = () => g(
  pth('M62,24 a20,20 0 1,0 5,33 a24,24 0 1,1 -5,-33 z', C.white, OUT()),
  cir(30, 30, 2.6, C.gold), cir(38, 44, 2, C.gold), cir(24, 46, 1.8, C.gold),
  ln(20, 78, 80, 78, 2, C.ink2)
);

A.sky = () => g(A.sun({ rays: true }), A.cloud({ x: 18, y: 52, s: .55 }));

A.cloud = (p = {}) => {
  const x = p.x ?? 50, y = p.y ?? 40, s = p.s ?? 1;
  return el('g', { transform: `translate(${x - 50 * s},${y - 40 * s}) scale(${s})` },
    pth('M24,58 q-13,0 -13,-12 q0,-11 12,-12 q3,-14 18,-14 q14,0 18,12 q14,-2 16,10 q8,2 8,10 q0,6 -7,6 z', C.white, OUT()));
};

A.rain = () => g(
  A.cloud({ y: 34, s: .95 }),
  [0, 1, 2, 3, 4].map(i => ln(34 + i * 9, 56 + (i % 2) * 4, 30 + i * 9, 70 + (i % 2) * 4, 2.6, C.blue)).join('')
);

A.snow = () => g(
  [0, 1, 2].map(i => {
    const x = 28 + i * 22, y = 34 + (i % 2) * 14;
    return g([0, 60, 120].map(a => {
      const r = a * Math.PI / 180;
      return ln(x - 8 * Math.cos(r), y - 8 * Math.sin(r), x + 8 * Math.cos(r), y + 8 * Math.sin(r), 2.2, C.blue);
    }).join(''), cir(x, y, 2, C.blue));
  }).join('')
);

A.wind = () => g(
  arc('M24,34 q22,-10 30,4 q6,12 -8,14', 3, C.ink),
  arc('M30,56 q26,-8 34,4', 3, C.ink),
  arc('M52,72 q18,4 26,-6', 3, C.ink),
  pth('M70,66 q10,-4 12,4 q-8,6 -12,-4 z', C.jade)
);

A.lightning = () => g(A.cloud({ y: 30, s: .9 }), pol('52,48 40,72 50,72 42,88 62,64 52,64 60,48', C.gold, OUT(2)));

/* 地貌 / 植物 —— 一律"零件 + 装配"：形状是参数，变体不加新函数 */
const PART = {};

/* 山体轮廓：sharp 尖峰 / round 缓坡 / plateau 高原 / double 双峰 */
PART.slope = (shape, top) => {
  if (shape === 'plateau') return pol(`36,78 44,${top + 14} 80,${top + 14} 90,78`, C.white, OUT());
  if (shape === 'round') return pth(`M38,78 Q50,${top - 2} 66,${top - 2} Q82,${top - 2} 92,78 z`, C.white, OUT());
  if (shape === 'double') return g(
    pol(`38,78 54,${top + 8} 72,78`, C.white, OUT()),
    pol(`60,78 78,${top} 96,78`, C.white, OUT()));
  return pol(`46,78 68,${top} 96,78`, C.white, OUT());
};

/* 雪顶：高度是参数（0 = 无雪），形状跟着山体走 */
PART.snowCap = (shape, top, h) => {
  if (!h) return '';
  if (shape === 'plateau') return rct(46, top + 14, 32, Math.min(9, h * .38), C.blue, { rx: 1 });
  if (shape === 'round') {
    const ch = h * .55;
    return pth(`M52,${top + ch} Q63,${top - 1} 76,${top + 1} Q85,${top + 3} 88,${top + ch} z`, C.blue);
  }
  const apex = shape === 'double' ? 78 : 68;
  return pol(`${apex - h * .45},${top + h} ${apex},${top} ${apex + h * .45},${top + h} ${apex},${top + h + 5}`, C.blue);
};

/* 远山：永远比主峰低一截、压在山脚 */
PART.farRidge = top => pol(`74,78 88,${top + 18} 100,78`, C.paper2, OUT(2.4));

/* 山：shape 形状，top 峰顶高度（越小越高），snow 雪顶高度（'heavy' 或数字），far 远山 */
A.mountain = (p = {}) => {
  const shape = p.shape || (p.wide ? 'plateau' : 'sharp');
  const top = p.top ?? 18;
  const capH = p.snow === 'heavy' ? 30 : p.snow === false || p.snow === undefined ? 0
    : typeof p.snow === 'number' ? p.snow : 0;
  return g(
    pol(`4,78 32,28 58,78`, C.paper2, OUT()),
    p.far === false ? '' : PART.farRidge(top),
    PART.slope(shape, top),
    PART.snowCap(shape, top, capH),
    p.wide ? pol(`2,78 20,${top + 12} 40,78`, C.white, OUT(2.4)) : '',
    ln(2, 78, 98, 78, 2.4, C.ink)
  );
};

/* 水零件 */
PART.waveRow = (y, w = 4.4) => arc(`M8,${y} q13,-12 26,0 q13,12 26,0 q13,-12 26,0`, w, C.blue);
PART.spray = () => pth('M50,16 q10,12 0,18 q-10,-6 0,-18 z', C.blue, OUT(2.4));
PART.banks = () => g(
  arc('M0,80 q14,-5 26,-1', 2.2, C.ink2),
  arc('M74,79 q14,-4 26,1', 2.2, C.ink2));

/* 水：form 形态（waves 波纹 / lake 湖面 / rapids 急流），curves 条数 */
A.water = (p = {}) => {
  const form = p.form || (p.calm ? 'lake' : 'waves');
  const cy = p.cy ?? (form === 'lake' ? 44 : 52);
  const n = p.curves ?? (form === 'lake' ? 3 : form === 'rapids' ? 3 : 2);
  return g(
    Array.from({ length: n }, (_, i) => PART.waveRow(cy + i * (form === 'rapids' ? 12 : 17),
      form === 'rapids' ? 3.4 : 4.4)).join(''),
    form === 'lake' ? '' : PART.spray(),
    p.banks ? PART.banks() : ''
  );
};

/* 海：远处海平线 + 三排浪 + 浪花 + 日头，一眼是"辽阔"而不是"一盆水" */
A.sea = () => g(
  cir(76, 22, 8, C.gold, OUT(2.2)),
  ln(2, 44, 98, 44, 2.6, C.ink),
  [0, 1, 2].map(i => arc(`M0,${54 + i * 12} q14,-9 28,0 q14,9 28,0 q14,-9 44,0`, 4.2, C.blue)).join(''),
  arc('M18,53 q6,-6 12,0', 3, C.white),
  arc('M56,53 q6,-6 12,0', 3, C.white)
);

/* 江 / 河：一条有宽度的水带，两岸 + 三道流水线 */
A.river = (p = {}) => {
  const w = p.small ? 9 : 15;
  const d = p.small ? 'M8,26 C30,30 26,54 48,58 C68,62 66,74 92,76'
    : 'M4,24 C32,26 28,54 52,58 C76,62 72,78 98,80';
  return g(
    el('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': w + 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    el('path', { d, fill: 'none', stroke: C.blue, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    [[18, 30], [42, 50], [66, 66]].map(([x, y]) => el('path', { d: `M${x},${y} q6,-4 12,0`, fill: 'none', stroke: C.white, 'stroke-width': 2.4, 'stroke-linecap': 'round' })).join('')
  );
};

/* 树零件 */
PART.canopy = (pine) => pine
  ? g(pol(`50,32 74,60 26,60`, C.jade, OUT(2.8)), pol(`50,12 68,46 32,46`, C.jade, OUT()))
  : g(cir(50, 32, 24, C.jade, OUT()), arc('M32,26 q8,-10 18,-8', 2.4, C.white));

A.tree = (p = {}) => g(
  rct(44, p.pine ? 58 : 50, 12, p.pine ? 20 : 28, C.clay, { rx: 2, ...OUT() }),
  PART.canopy(p.pine)
);

A.fire = () => g(
  pth('M50,16 c16,18 24,26 24,38 a24,22 0 0,1 -48,0 c0,-14 10,-24 24,-38 z', C.red, OUT()),
  pth('M50,44 c9,10 13,15 13,21 a13,12 0 0,1 -26,0 c0,-8 5,-12 13,-21 z', C.gold)
);

/* 石有三种常见化身：碎块（默认）、大石头、鹅卵石堆——靠搭档字选，不然"宝石/石子/石头"画成同一个 */
A.stone = (p = {}) => {
  if (p.kind === 'boulder') return g(
    pol('14,80 22,50 44,40 70,48 86,80', C.slate, OUT()),
    pol('28,52 40,43 52,49 44,58', C.paper2, OUT(1.2)),
    ln(12,84,88,84,2.2,C.ink2), ln(34,60,48,74,1.6,C.ink2));
  if (p.kind === 'pebbles') return g(
    [[30,70,9],[49,61,7],[65,71,6],[38,53,4.5]].map(([x,y,r]) =>
      cir(x, y, r, C.slate, OUT(1.6))).join(''),
    ln(16,82,84,82,2.2,C.ink2), cir(28,66,1.6,C.ink2), cir(62,68,1.4,C.ink2));
  return g(
    pol('16,78 22,56 40,50 52,62 48,78', C.slate, OUT()),
    pol('50,78 58,62 74,58 86,72 84,78', C.paper2, OUT()),
    cir(30, 66, 2, C.ink2));
};

/* 尺：量词"米"（毫米/厘米/纳米）不是米粒 */
A.ruler = () => g(
  rct(12, 44, 76, 16, C.paper2, OUT()),
  [0,1,2,3,4,5,6,7].map(i => ln(20 + i * 9, 44, 20 + i * 9, i % 2 ? 52 : 56, i % 2 ? 1.6 : 2.2, C.ink2)).join(''),
  ln(20, 60, 80, 60, 1.2, C.slate));

/* 工厂：厂房 + 两根烟囱 + 烟，不用"工"字去借宝石 */
A.factory = () => g(
  rct(8, 54, 84, 30, C.paper2, OUT()),
  arc('M8,54 q10,-9 20,0 q10,9 20,0 q10,-9 20,0 q10,9 16,0', 2, C.ink2),
  rct(24, 58, 16, 16, '#cfd8de', OUT(1.4)), rct(52, 58, 16, 16, '#cfd8de', OUT(1.4)),
  rct(58, 30, 10, 24, C.slate, OUT(1.4)),
  [[68,24,5],[74,16,7],[81,9,9]].map(([x,y,r]) => cir(x, y, r, 'rgba(150,140,125,.28)', {})).join(''),
  ln(6, 84, 96, 84, 2, C.ink2));

A.soil = () => g(
  rct(8, 56, 84, 22, C.clay, { rx: 4, ...OUT() }),
  [[24, 0], [50, -3], [70, 2]].map(([x, d]) => g(
    arc(`M${x},56 q-5,-10 1,-16`, 2.4, C.jade),
    arc(`M${x},56 q5,-9 9,-13`, 2.4, C.jade)
  )).join(''),
  cir(62, 68, 2, C.ink2)
);

A.field = () => g(
  rct(12, 30, 76, 48, C.paper2, { rx: 3, ...OUT() }),
  ln(38, 30, 38, 78, 2, C.jade), ln(64, 30, 64, 78, 2, C.jade),
  ln(12, 48, 88, 48, 2, C.jade), ln(12, 64, 88, 64, 2, C.jade)
);

A.grass = () => g(
  [0, 1, 2].map(i => pth(`M${30 + i * 18},78 q${i === 1 ? -6 : i === 0 ? -16 : 10},-20 ${i === 1 ? -4 : i === 0 ? -10 : 16},-34 q6,20 ${i === 1 ? 6 : i === 0 ? 12 : -8},34 z`, C.jade, OUT(2.2))).join(''),
  ln(14, 78, 86, 78, 3, C.ink2)
);

A.flower = () => g(
  arc('M50,50 L50,78', 3, C.jade),
  pth('M50,64 q-18,-4 -20,-14 q18,-2 20,14 z', C.jade),
  [0, 72, 144, 216, 288].map(a => {
    const r = a * Math.PI / 180;
    return cir(50 + 12 * Math.cos(r), 36 + 12 * Math.sin(r), 8, C.plum, OUT(1.6));
  }).join(''),
  cir(50, 36, 5, C.gold, OUT(1.6))
);

A.leaf = () => g(
  pth('M22,72 q10,-40 50,-46 q-4,40 -50,46 z', C.jade, OUT()),
  arc('M30,66 q18,-26 38,-34', 2, C.ink2)
);

A.sprout = () => g(
  rct(40, 60, 20, 18, C.clay, { rx: 3, ...OUT() }),
  arc('M50,60 L50,40', 3, C.jade),
  pth('M50,44 q-16,-2 -20,-14 q16,-2 20,14 z', C.jade),
  pth('M50,50 q16,-2 20,-14 q-16,-2 -20,14 z', C.jade)
);

A.rice = () => g(
  pth('M22,56 q28,-8 56,0 q-6,26 -28,26 q-22,0 -28,-26 z', C.white, OUT()),
  arc('M26,64 q24,8 48,0', 2, C.ink2),
  [[38, 50], [50, 46], [62, 50], [44, 42], [56, 42]].map(([x, y]) => cir(x, y, 2.2, C.white, OUT(1.2))).join('')
);

A.fruit = () => g(
  cir(46, 52, 17, C.red, OUT()),
  cir(62, 56, 14, C.red, OUT()),
  arc('M50,36 q2,-8 8,-10', 2.4, C.ink),
  pth('M54,30 q14,-8 18,-2 q-8,8 -18,2 z', C.jade)
);

A.bamboo = () => g(
  [0, 1].map(i => g(
    rct(30 + i * 26, 26, 7, 52, C.jade, { rx: 2, ...OUT(1.8) }),
    ln(30 + i * 26, 44, 37 + i * 26, 44, 1.6, C.ink),
    ln(30 + i * 26, 60, 37 + i * 26, 60, 1.6, C.ink)
  )).join(''),
  arc('M37,34 q14,-10 20,-2', 2.4, C.jade)
);

/* 动物 */
A.bird = (p = {}) => {
  const comb = p.comb ? pol('58,22 62,14 66,22', C.red) : '';
  return g(
    cir(56, 56, 16, C.paper2, OUT()),
    cir(76, 40, 9, C.white, OUT()),
    comb,
    pol('84,40 94,44 84,48', C.gold, OUT(1.6)),
    cir(79, 38, 1.6, C.ink),
    pth('M40,54 q-10,-16 4,-18 q10,4 4,14 z', C.paper2, OUT(1.6)),
    ln(52, 72, 52, 84, 2.4, C.gold), ln(62, 72, 62, 84, 2.4, C.gold),
    arc('M44,68 q-14,2 -18,-6', 2, C.ink2)
  );
};

A.fish = () => g(
  pth('M18,50 q22,-16 44,0 q-22,16 -44,0 z', C.blue, OUT()),
  pol('18,50 6,38 6,62', C.blue, OUT(1.8)),
  pth('M46,36 q10,10 0,18', C.white, OUT(1.4)),
  cir(56, 46, 2, C.ink),
  arc('M10,74 q12,-6 24,0 q12,6 24,0 q12,-6 24,0', 2.4, C.blue)
);

A.cattle = (p = {}) => g(
  rct(26, 40, 46, 24, C.paper2, { rx: 10, ...OUT() }),
  cir(78, 38, 13, C.paper2, OUT()),
  p.horns === 'ram'
    ? g(arc('M72,24 q-8,-10 -2,-12 q10,2 6,12', 3, C.gold), arc('M84,22 q6,-12 10,-8 q-2,10 -10,8', 3, C.gold))
    : g(arc('M68,22 q-8,-8 -2,-10 q8,2 4,10', 2.6, C.ink2), arc('M86,22 q8,-8 2,-10 q-8,2 -4,10', 2.6, C.ink2)),
  cir(82, 38, 2, C.ink),
  ln(34, 64, 30, 82, 4, C.ink2), ln(44, 64, 40, 82, 4, C.ink2),
  ln(58, 64, 62, 82, 4, C.ink2), ln(66, 64, 70, 82, 4, C.ink2),
  arc('M26,46 q-10,6 -6,18', 3.2, C.ink2)
);

A.dog = (p = {}) => g(
  cir(50, 48, 16, C.paper2, OUT()),
  p.cat
    ? g(pol('40,34 44,20 54,30', C.paper2, OUT(1.8)), pol('60,34 56,20 46,30', C.paper2, OUT(1.8)))
    : g(pth('M36,36 q-12,-4 -10,12 q10,2 12,-6 z', C.clay, OUT(1.6)), pth('M64,36 q12,-4 10,12 q-10,2 -12,-6 z', C.clay, OUT(1.6))),
  cir(44, 46, 2, C.ink), cir(58, 46, 2, C.ink),
  cir(51, 56, 3, C.ink),
  p.cat ? g(ln(34, 52, 16, 48, 1.6, C.ink2), ln(34, 56, 15, 58, 1.6, C.ink2)) : arc('M50,60 q6,6 10,-2', 2, C.red),
  arc('M64,66 q16,2 12,14', 2.6, C.ink2)
);

A.cat = (p = {}) => A.dog({ ...p, cat: true });

/* 人 */
A.person = (p = {}) => {
  const hair = p.hair || 'short';
  const headY = p.child ? 40 : 34, r = p.child ? 11 : 13;
  return g(
    cir(50, headY, r, C.paper2, OUT()),
    hair === 'bun' ? cir(50 + r * .8, headY - r * .8, 5, C.ink2)
      : hair === 'pony' ? arc(`M${50 + r},${headY} q10,4 8,14`, 4, C.ink2)
        : arc(`M${50 - r + 2},${headY - 2} q${r - 2},-${r * .95} ${2 * (r - 2)},0`, 4.4, C.ink2),
    p.dress
      ? pol('50,52 34,78 66,78', p.color || C.plum, OUT())
      : g(rct(42, 48, 16, 22, p.color || C.plum, { rx: 3, ...OUT() }),
        ln(46, 70, 44, 84, 3, C.ink2), ln(54, 70, 56, 84, 3, C.ink2)),
    p.arms === 'up' ? g(arc('M42,52 q-10,-8 -8,-16', 2.6, C.ink2), arc('M58,52 q10,-8 8,-16', 2.6, C.ink2))
      : p.arms === 'wide' ? g(arc('M42,54 q-14,2 -18,10', 2.6, C.ink2), arc('M58,54 q14,2 18,10', 2.6, C.ink2))
        : p.arms === 'point' ? arc('M58,54 q14,-2 20,-8', 2.6, C.ink2)
          : g(arc('M42,54 q-8,8 -6,16', 2.6, C.ink2), arc('M58,54 q8,8 6,16', 2.6, C.ink2)),
    p.cane ? ln(74, 44, 84, 84, 3, C.clay) : ''
  );
};

A.group = () => g(A.person({ child: true }), el('g', { transform: 'translate(26,6) scale(.78)' }, A.person({ child: true, color: C.jade })));

A.runner = (p = {}) => g(
  cir(48, 30, 11, C.paper2, OUT()),
  pth('M48,42 l12,-4 l-6,20 l-10,0 z', p.color || C.clay, OUT()),
  arc('M58,48 q12,4 16,-6', 2.6, C.ink2),
  arc('M44,58 q-14,10 -22,22', 3, C.ink2),
  arc('M54,58 q10,10 6,24', 3, C.ink2),
  ln(20, 82, 40, 82, 2, C.ink2)
);

A.snail = () => g(
  cir(46, 58, 18, C.paper2, OUT()),
  arc('M46,58 a12,12 0 1,1 -2,-1', 2.2, C.ink2),
  arc('M64,56 q14,0 14,12', 3, C.ink2),
  ln(66, 56, 70, 44, 1.8, C.ink2), ln(72, 56, 78, 46, 1.8, C.ink2),
  cir(70, 43, 2, C.ink), ln(24, 78, 82, 78, 2, C.ink2)
);

A.jumper = () => g(
  cir(50, 20, 10, C.paper2, OUT()),
  pth('M50,30 l10,0 l-4,18 l-8,0 z', C.clay, OUT()),
  arc('M46,48 q-10,4 -14,14', 2.6, C.ink2), arc('M56,48 q12,2 14,-10', 2.6, C.ink2),
  arc('M46,64 q-4,8 -10,10', 2.6, C.ink2), arc('M54,64 q6,6 12,4', 2.6, C.ink2),
  arc('M12,32 q10,6 18,2', 2, C.ink2)
);

A.sitting = () => g(
  cir(46, 36, 11, C.paper2, OUT()),
  rct(40, 48, 26, 10, C.jade, { rx: 3, ...OUT(1.8) }),
  ln(52, 58, 52, 78, 3, C.ink2), ln(64, 58, 64, 78, 3, C.ink2),
  rct(24, 56, 24, 8, C.paper2, { rx: 2, ...OUT(1.8) }),
  ln(28, 64, 28, 78, 3, C.ink2)
);

A.teacher = () => g(
  el('g', { transform: 'translate(-2,0) scale(.78)' }, A.person({ arms: 'point', color: C.blue })),
  rct(54, 16, 40, 30, C.ink, { rx: 3, ...OUT(1.8) }),
  ln(60, 27, 88, 27, 2.2, C.white), ln(60, 36, 84, 36, 2.2, C.white),
  ln(64, 46, 64, 58, 2.6, C.clay), ln(56, 60, 72, 60, 2.6, C.clay)
);

/* 身体 */
A.hand = () => g(
  pth('M38,58 q-6,-18 2,-20 q6,0 6,16 l0,-22 q0,-6 6,-6 q6,0 6,6 l0,20 l0,-6 q0,-5 5,-5 q5,0 5,5 l0,8 l2,-4 q4,-4 7,0 q2,3 0,8 q-4,10 -12,16 q-10,6 -20,0 q-6,-4 -7,-9 z', C.paper2, OUT()),
  arc('M50,74 q6,4 12,2', 2, C.clay)
);

A.eye = () => g(
  pth('M12,50 q38,-26 76,0 q-38,26 -76,0 z', C.white, OUT()),
  cir(50, 50, 11, C.blue, OUT(1.8)),
  cir(50, 50, 5, C.ink),
  cir(46, 46, 2, C.white),
  ln(34, 30, 38, 34, 2, C.ink2), ln(50, 26, 50, 31, 2, C.ink2), ln(66, 30, 62, 34, 2, C.ink2)
);

A.ear = () => g(
  arc('M62,26 q-26,-6 -28,24 q-2,22 20,26 q16,2 18,-12', 3.4, C.ink),
  arc('M56,38 q-12,-2 -12,12 q0,12 10,12', 2.2, C.ink2),
  cir(60, 62, 2.4, C.clay)
);

A.mouth = () => g(
  pth('M22,46 q28,-12 56,0 q-10,24 -28,24 q-18,0 -28,-24 z', C.plum, OUT()),
  arc('M28,48 q22,-4 44,0', 2, C.ink2)
);

A.heart = (p = {}) => g(
  pth('M50,74 q-30,-18 -26,-34 q4,-14 18,-10 q6,2 8,8 q2,-6 8,-8 q14,-4 18,10 q4,16 -26,34 z', p.color || C.red, OUT()),
  arc('M38,42 q-6,2 -4,10', 2, C.white)
);

A.foot = () => g(
  pth('M40,30 q16,0 18,18 q2,16 -6,24 q-10,8 -20,2 q-8,-4 -4,-16 q4,-12 12,-28 z', C.paper2, OUT()),
  cir(62, 34, 4, C.paper2, OUT(1.4)), cir(68, 44, 3.4, C.paper2, OUT(1.4)), cir(70, 52, 3, C.paper2, OUT(1.4))
);

/* 状态双帧：同一个东西的两种状态并排，中间一道虚线 + 箭头（开/关、满/空、昼/夜） */
function dualPanel(a, b) {
  return g(
    el('g', { transform: 'translate(2,18) scale(.46)' }, a),
    el('g', { transform: 'translate(52,18) scale(.46)' }, b),
    el('line', { x1: 50, y1: 16, x2: 50, y2: 84, stroke: C.ink2, 'stroke-width': 1.6,
      'stroke-dasharray': '5 4', 'stroke-opacity': .65 }),
    ln(38, 9, 60, 9, 1.8, C.ink2),
    pol('62,9 54,5 54,13', C.ink2)
  );
}


/* ---------- 拆字会意：字义 = 部件意义之合（日月为明、人木为休、火火为炎） ----------
   三套版式：side 左右（前件大、后件小）、stack 上下（上件小、下件大）、tri 三件（上一下二） */
/* HUI 见 data/ */;

/* 允许走会意的词：逐个登记、逐个审稿（字形对了不等于词义对了） */
/* HUI_WORDS 见 data/ */;

function huiArt(char) {
  const h = HUI[char];
  if (!h) return '';
  const ic = n => (Array.isArray(n) ? A[n[0]](n[1]) : A[n]());
  const ground = ln(2, 88, 98, 88, 2.4, C.ink2);
  if (h.lay === 'side') {
    const front = h.front === 1 ? h.parts[1] : h.parts[0];
    const back = h.front === 1 ? h.parts[0] : h.parts[1];
    return g(at(0, 88 - 66, .66, ic(front)), at(44, 88 - 54, .54, ic(back)), ground);
  }
  if (h.lay === 'stack') {
    return g(at(6, 6, .42, ic(h.parts[0])), at(22, 88 - 52, .52, ic(h.parts[1])), ground);
  }
  return g(at(2, 88 - 40, .4, ic(h.parts[0])), at(58, 88 - 40, .4, ic(h.parts[1])),
    at(33, 6, .34, ic(h.parts[2])), ground);
}


/* 补件：人（女/子）、器物（冠/帽/刀/面包）、豕（家字的底） */
A.crown = () => g(
  pol('28,52 33,26 43,42 50,20 57,42 67,26 72,52', C.gold, OUT()),
  rct(28, 52, 44, 11, C.gold, { rx: 2, ...OUT() }),
  cir(50, 57, 2.6, C.red), cir(38, 57, 2, C.blue), cir(62, 57, 2, C.blue)
);

A.hat = () => g(
  pth('M32,52 q0,-26 18,-26 q18,0 18,26 z', C.blue, OUT()),
  pth('M12,52 q38,8 76,0 q3,11 -10,13 q-30,6 -58,0 q-10,-4 -8,-13 z', C.clay, OUT()),
  ln(32, 52, 68, 52, 1.8, C.ink2)
);

A.knife = () => g(
  pth('M22,72 l42,-48 q7,-8 13,-2 q6,6 -2,13 l-42,46 z', C.slate, OUT()),
  rct(14, 66, 16, 15, C.clay, { rx: 3, ...OUT() }),
  ln(44, 42, 54, 52, 1.6, C.white)
);

A.bread = () => g(
  pth('M16,52 q0,-24 34,-24 q34,0 34,24 q0,12 -34,12 q-34,0 -34,-12 z', C.clay, OUT()),
  arc('M30,44 q8,-7 16,0', 2, C.paper2), arc('M44,44 q8,-7 16,0', 2, C.paper2), arc('M58,44 q8,-7 16,0', 2, C.paper2),
  ln(16, 76, 84, 76, 2.2, C.ink2)
);

A.pig = () => g(
  cir(48, 54, 21, C.plum, OUT()),
  cir(74, 44, 12, C.plum, OUT()),
  cir(80, 47, 3.6, C.clay, OUT(1.4)),
  pol('70, 33 76, 24 81, 34', C.plum, OUT(1.6)),
  ln(38, 74, 38, 84, 3, C.ink2), ln(58, 74, 58, 84, 3, C.ink2),
  arc('M28, 46 q-9, -5 -6, -12', 2, C.ink2)
);

/* 力量 = 人举起石头（"力"没有可画之物，借"举重"这个动作） */
function strengthArt() {
  return g(
    at(10, 86 - 62, .62, A.person({ arms: 'up' })),
    at(27, 1, .4, A.stone()),
    ln(2, 86, 98, 86, 2.4, C.ink2));
}


/* ---------- 借场景：抽象词没有实物，就借一个"念得出词义"的场景 ----------
   判据只有一条：遮住词牌，把画面念出来，念的是不是这个词。念不出的不许进这张表。 */
/* SCENE 见 data/ */;

/* 器物 */
A.door = (p = {}) => g(
  rct(22, 14, 56, 64, C.clay, { rx: 3, ...OUT() }),
  p.open
    ? el('g', { transform: 'translate(30,22) rotate(-24,0,44)' },
      rct(0, 0, 34, 44, C.paper2, { rx: 2, ...OUT(2) }), cir(28, 22, 4, C.gold, OUT(1.6)))
    : g(rct(32, 24, 36, 46, C.paper2, { rx: 2, ...OUT(2) }), cir(62, 46, 4, C.gold, OUT(1.6))),
  rct(12, 74, 76, 8, C.slate, { rx: 2, ...OUT(2) })
);

A.house = () => g(
  pol('10,50 50,18 90,50 82,58 18,58', C.red, OUT()),
  rct(22, 56, 56, 24, C.paper2, OUT()),
  rct(40, 64, 20, 16, C.clay, { rx: 2, ...OUT(2) }),
  rct(28, 62, 9, 8, C.blue, { rx: 1.5, ...OUT(1.6) }),
  ln(12, 80, 88, 80, 3, C.ink2)
);

A.school = () => g(
  rct(18, 32, 64, 46, C.paper2, OUT()),
  pol('10,34 50,16 90,34', C.blue, OUT()),
  [[28, 44], [46, 44], [64, 44]].map(([x, y]) => rct(x, y, 14, 14, C.blue, { rx: 1.5, ...OUT(1.2) })).join(''),
  ln(50, 16, 50, 4, 2.4, C.ink2), pol('50,4 66,8 50,12', C.red)
);

A.book = () => g(
  pth('M14,30 q18,-6 34,2 q16,-8 34,-2 l0,40 q-18,-6 -34,2 q-16,-8 -34,-2 z', C.white, OUT()),
  ln(50, 32, 50, 72, 2, C.ink2),
  [38, 46, 54].map(y => ln(22, y, 44, y + 1, 1.6, C.ink2)).join(''),
  [38, 46, 54].map(y => ln(56, y + 1, 78, y, 1.6, C.ink2)).join('')
);

A.pen = () => g(
  pth('M26,62 l36,-36 q8,-8 14,-2 q6,6 -2,14 l-36,36 z', C.blue, OUT()),
  pol('26,62 24,78 40,74', C.ink2, OUT(2)),
  arc('M18,86 q30,-4 58,-8', 2.4, C.slate)
);

A.car = () => g(
  pth('M14,62 q0,-12 10,-14 l10,-12 q4,-4 10,-4 l26,0 q8,0 12,6 l8,10 q8,0 8,10 l0,8 q0,4 -4,4 l-76,0 q-4,0 -4,-4 z', C.red, OUT()),
  rct(34, 40, 22, 10, C.white, { rx: 2, ...OUT(1.4) }),
  cir(30, 72, 7, C.ink, OUT(1.6)), cir(70, 72, 7, C.ink, OUT(1.6)),
  cir(30, 72, 2, C.white), cir(70, 72, 2, C.white)
);

A.boat = () => g(
  pth('M14,60 q36,14 72,0 l-6,16 q-30,10 -60,0 z', C.clay, OUT()),
  ln(50, 60, 50, 20, 3, C.ink2),
  pol('54,24 58,54 34,54', C.white, OUT(1.6)),
  arc('M8,80 q16,-6 32,0 q16,6 32,0 q8,-3 16,0', 2.4, C.blue)
);

A.ball = () => g(
  cir(50, 48, 20, C.white, OUT()),
  arc('M30,44 q20,-10 40,0', 2.6, C.ink2),
  arc('M30,54 q20,10 40,0', 2.6, C.ink2),
  arc('M50,28 q-6,20 0,40', 2.2, C.red)
);

A.cup = (p = {}) => g(
  p.broken
    ? pth('M28,38 h18 l-4,12 l8,6 l-4,10 q-14,-2 -16,-16 z', C.white, OUT())
    : pth('M28,38 h40 v22 q0,16 -20,16 q-20,0 -20,-16 z', C.white, OUT()),
  p.broken
    ? pol('46,50 54,44 50,58 58,54', C.clay, OUT(1.2))
    : arc('M68,44 q12,0 12,8 q0,8 -12,8', 2.6, C.ink2),
  p.broken ? pth('M56,58 q10,-2 18,4 q-6,10 -18,6 z', C.white, OUT())
    : arc('M34,30 q6,-8 12,0', 2, C.blue2 || C.blue),
  p.broken
    ? pth('M58,76 q12,10 26,7 q-1,7 -13,7 q-11,0 -13,-14 z', C.blue, { 'fill-opacity': .55 })
    : arc('M30,82 q20,6 40,0', 2, C.ink2)
);

A.bowl = (p = {}) => g(
  p.full
    ? pth('M22,46 q28,6 56,0 l0,0 q-6,-14 -28,-12 q-22,-2 -28,12 z', C.white, OUT())
    : pth('M22,46 q28,6 56,0 q-4,26 -28,26 q-24,0 -28,-26 z', C.white, OUT()),
  p.full
    ? g([0, 1, 2, 3, 4].map(i => arc(`M${30 + i * 9},42 q3,-7 6,-1`, 1.8, C.ink2)).join(''))
    : arc('M28,56 q22,8 44,0', 2, C.ink2),
  p.full ? '' : g(arc('M46,42 q-6,-10 4,-14', 2, C.ink2), arc('M56,42 q-4,-10 6,-12', 2, C.ink2))
);

A.clothes = () => g(
  pol('34,26 44,22 50,28 56,22 66,26 78,40 68,48 64,44 64,74 36,74 36,44 32,48 22,40', C.plum, OUT()),
  arc('M44,22 q6,10 12,0', 2, C.ink)
);

A.chair = () => g(
  rct(40, 24, 30, 30, C.paper2, { rx: 3, ...OUT() }),
  rct(28, 52, 46, 9, C.clay, { rx: 2, ...OUT() }),
  ln(34, 61, 34, 78, 3, C.ink2), ln(70, 61, 70, 78, 3, C.ink2)
);

A.bulb = (p = {}) => g(
  cir(50, 40, 16, p.on === false ? C.paper2 : C.gold, OUT()),
  p.on === false ? ln(40, 32, 60, 48, 2, C.ink2) : '',
  rct(42, 56, 16, 10, C.slate, { rx: 2, ...OUT(1.6) }),
  p.on === false ? '' : [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
    const r = a * Math.PI / 180;
    return ln(50 + 24 * Math.cos(r), 40 + 24 * Math.sin(r), 50 + 30 * Math.cos(r), 40 + 30 * Math.sin(r), 2, C.gold);
  }).join('')
);

A.clock = () => g(
  cir(50, 46, 22, C.white, OUT()),
  ln(50, 46, 50, 34, 2.4, C.ink), ln(50, 46, 60, 52, 2.4, C.red),
  cir(50, 46, 2, C.ink)
);

A.calendar = () => g(
  rct(24, 26, 52, 46, C.white, { rx: 3, ...OUT() }),
  pol('24,30 76,30 76,38 24,38', C.red),
  cir(36, 24, 2.6, C.ink2), cir(64, 24, 2.6, C.ink2),
  [48, 58, 68].map(y => ln(34, y, 46, y, 1.8, C.ink2)).join('')
);

A.seal = () => g(
  rct(24, 20, 52, 56, C.red, { rx: 5, ...OUT(2.6) }),
  rct(31, 27, 38, 42, C.paper, { rx: 2 }),
  ln(36, 36, 64, 36, 3, C.red), ln(50, 36, 50, 48, 3, C.red),
  ln(36, 50, 64, 50, 3, C.red), ln(36, 62, 64, 62, 3, C.red)
);

A.path = () => g(
  pth('M70,80 q-20,-6 -18,-18 q2,-14 -10,-20 q-10,-6 -8,-18', C.clay, { ...OUT(), 'stroke-width': 7 }),
  cir(30, 34, 7, C.jade), cir(66, 62, 8, C.jade)
);

A.target = () => g(
  cir(50, 48, 22, C.white, OUT()),
  cir(50, 48, 12, C.red, OUT(1.6)),
  cir(50, 48, 4, C.white)
);

A.arrow = (p = {}) => {
  const dir = p.dir || 'up';
  if (dir === 'up') return g(ln(50, 82, 50, 30, 4, C.blue), pol('50,18 38,34 62,34', C.blue, OUT(1.6)), ln(20, 82, 80, 82, 2.4, C.ink2));
  if (dir === 'down') return g(ln(50, 18, 50, 66, 4, C.blue), pol('50,82 38,64 62,64', C.blue, OUT(1.6)));
  if (dir === 'in') return g(ln(78, 78, 42, 42, 4, C.blue), pol('34,34 56,32 38,54', C.blue, OUT(1.6)), rct(10, 62, 18, 16, C.paper2, { ...OUT(1.4) }));
  return g(ln(22, 78, 58, 42, 4, C.blue), pol('66,34 44,32 62,54', C.blue, OUT(1.6)));
};

A.circleArrow = () => g(
  arc('M72,44 a22,22 0 1,0 -8,30', 3.4, C.jade),
  pol('66,30 80,48 58,50', C.jade, OUT(1.6))
);

A.box = (p = {}) => g(
  rct(28, 40, 44, 38, C.clay, { rx: 3, ...OUT() }),
  pol('24,40 50,26 76,40', C.paper2, OUT()),
  p.open ? pth('M40,46 q10,-14 20,0 l0,10 q-10,6 -20,0 z', C.white, OUT(1.4)) : ''
);

A.blackboard = () => g(
  rct(10, 16, 80, 46, C.ink, { rx: 2, ...OUT() }),
  ln(22, 30, 56, 30, 3, C.white), ln(22, 40, 68, 40, 3, C.white), ln(22, 50, 46, 50, 3, C.white),
  ln(50, 62, 50, 78, 3.4, C.clay), ln(38, 80, 62, 80, 3, C.clay)
);

A.bridge = () => g(
  arc('M14,64 q36,-30 72,0', 4, C.slate),
  ln(14, 64, 14, 78, 3, C.slate), ln(86, 64, 86, 78, 3, C.slate), ln(50, 44, 50, 64, 2.6, C.slate),
  arc('M8,78 q14,-6 28,0 q14,6 28,0 q14,-6 28,0', 2.2, C.blue)
);

A.flag = () => g(
  ln(28, 82, 28, 20, 3, C.ink2),
  pol('28,24 74,30 28,44', C.red, OUT(1.6))
);

/* 宝石：切面冠部 + 尖底 + 台面线，跟"碎石"区分靠的就是这几条切面 */
A.gem = () => g(
  pol('34,30 50,18 66,30 78,46 50,82 22,46', C.blue, OUT()),
  ln(34, 30, 66, 30, 1.6, C.white),
  ln(22, 46, 78, 46, 1.6, C.white),
  ln(34, 30, 50, 46, 1.2, C.white), ln(66, 30, 50, 46, 1.2, C.white),
  ln(50, 46, 50, 82, 1.2, C.white),
  ln(22, 46, 34, 30, 1.2, C.white), ln(78, 46, 66, 30, 1.2, C.white),
  arc('M16,22 l3,7 l7,3 l-7,3 l-3,7 l-3,-7 l-7,-3 l7,-3 z', 1.6, C.gold),
  cir(80, 26, 2.2, C.gold));

A.swatch = (p = {}) => g(
  rct(26, 26, 48, 48, p.color || C.red, { rx: 4, ...OUT() }),
  arc('M26,44 q12,-6 24,0 q12,6 24,0', 2, 'rgba(255,255,255,.7)')
);

A.many = () => g(
  [[28, 34], [44, 28], [60, 36], [72, 30], [34, 50], [52, 46], [66, 54], [24, 62], [46, 62], [70, 68]].map(([x, y]) => cir(x, y, 4.2, C.jade)).join('')
);

A.few = () => g(cir(40, 48, 5, C.jade), cir(62, 56, 4, C.jade), arc('M18,78 q32,-6 64,0', 2, C.ink2));

A.steps = (p = {}) => g(
  rct(14, 62, 24, 16, C.paper2, OUT()), rct(38, 50, 24, 28, C.paper2, OUT()), rct(62, 38, 24, 40, C.paper2, OUT()),
  p.dir === 'down' ? pol('50,72 44,84 56,84', C.blue) : pol('50,30 44,18 56,18', C.blue)
);

/* ---------- 缺的"物"：马 / 罐 / 瓢 / 水塔 / 花生 ----------
   审稿表里退回的词，有 13 个不是语义问题，是压根没这几样东西的图元 */
A.horse = () => g(
  el('ellipse', { cx: 42, cy: 58, rx: 17, ry: 9.5, fill: '#d8c39c', ...OUT() }),  // 躯干
  pol('56,53 66,36 76,37 75,49 60,57', '#d8c39c', OUT()),      // 颈（斜向前上）
  pol('71,34 85,37 89,44 86,49 71,50', '#d8c39c', OUT()),       // 头（带下颌）
  ln(80, 45, 84, 45, 1.2, C.ink),                              // 嘴线
  pol('73,35 71,27 79,34', '#d8c39c', OUT(2)),                 // 耳
  arc('M57,50 q7,-9 11,-13', 2, C.ink2),                       // 鬃
  cir(83, 42, 1.5, C.ink),                                     // 眼
  ln(32, 66, 30, 83, 2.6, C.ink2), ln(38, 67, 37, 84, 2.6, C.ink2),
  ln(50, 67, 51, 84, 2.6, C.ink2), ln(57, 64, 60, 83, 2.6, C.ink2),
  ln(28, 83, 34, 83, 2.2, C.ink2), ln(35, 84, 41, 84, 2.2, C.ink2),
  ln(48, 84, 54, 84, 2.2, C.ink2), ln(57, 83, 63, 83, 2.2, C.ink2),
  arc('M26,54 q-11,10 -7,23', 2.6, C.ink2),                    // 尾
  ln(14, 86, 88, 86, 2.2, C.ink2));

A.jar = () => g(
  rct(30, 34, 40, 9, '#cfd8de', { rx: 2, ...OUT() }),           // 口沿
  pol('32,42 68,42 76,56 70,82 30,82 24,56', '#cfd8de', OUT()), // 罐身
  ln(33, 54, 67, 54, 1.6, '#8fb6c8'),                           // 水面
  arc('M34,68 q8,-4 16,0', 1.4, 'rgba(255,255,255,.75)'),
  ln(16, 86, 84, 86, 2.2, C.ink2));

A.ladle = () => g(
  cir(40, 58, 17, '#e9dcc2', OUT(2.6)),                         // 瓢身
  ln(23, 58, 57, 58, 2.4, C.ink),                               // 口沿
  ln(57, 57, 80, 29, 3, C.ink2),                                // 柄
  arc('M30,52 q10,-5 18,2', 1.4, '#c2ac86'),                    // 内壁弧
  ln(16, 84, 78, 84, 2.2, C.ink2));

A.tower = () => g(
  rct(32, 20, 36, 24, '#cfd8de', { rx: 4, ...OUT() }),           // 水箱
  arc('M30,20 q20,-9 40,0', 2.2, C.ink2),                        // 顶盖
  ln(34, 34, 66, 34, 1.6, '#8fb6c8'),
  ln(38, 44, 30, 84, 2.4, C.ink2), ln(62, 44, 70, 84, 2.4, C.ink2),
  ln(28, 84, 72, 84, 2.2, C.ink2), ln(35, 64, 65, 64, 1.8, C.ink2),
  [44, 54, 64, 74].map(y => ln(44, y, 48, y, 1.6, C.ink2)).join(''));

A.pod = () => g(
  cir(37, 64, 14, '#e2cf9f', OUT(2.6)),
  cir(57, 47, 14, '#e2cf9f', OUT(2.6)),
  arc('M47,70 q5,-7 3,-14', 1.6, '#a98c55'), arc('M49,42 q-5,7 -3,14', 1.6, '#a98c55'),
  [[25,60],[31,72],[42,74],[67,40],[64,52],[53,35]].map(([x, y]) => ln(x, y, x + 5, y - 4, 1.2, '#a98c55')).join(''),
  ln(14, 84, 86, 84, 2.2, C.ink2));

/* ---------- 字 → 图元映射 ----------
   每一项：字: [图元名, 参数, 分类色]                              */
/* ---------- 数据层：一字一文件 ----------
   词条、会意、场景都在 ../data/ 下：chars/<字>.json、hui/<字>.json、
   hui-words.json、scenes/<词>.js。加一个字只动一个文件，多人提交互不冲突。 */
const _fs = require('fs'), _path = require('path');
const DATA_DIR = _path.join(__dirname, '..', 'data');
const _readDir = (sub, ext) => {
  const d = _path.join(DATA_DIR, sub);
  let files = [];
  try { files = _fs.readdirSync(d); } catch (e) { return {}; }
  const out = {};
  for (const f of files) {
    if (!f.endsWith(ext)) continue;
    const k = f.slice(0, -ext.length);
    const p = _path.join(d, f);
    out[k] = ext === '.json' ? JSON.parse(_fs.readFileSync(p, 'utf8')) : require(p);
  }
  return out;
};
const CHARMAP = _readDir('chars', '.json');
const HUI = _readDir('hui', '.json');
const SCENE = _readDir('scenes', '.js');
const HUI_WORDS = JSON.parse(_fs.readFileSync(_path.join(DATA_DIR, 'hui-words.json'), 'utf8'));
/* 场景文件不直接依赖本文件内部作用域，用到什么由这里注入 */
const sceneCtx = () => ({ A, SYM, C, g, ln, arc, pol, at, rct, pth, cir });;

/* 数字图元：1–10 用点阵（数量直观） */
for (let n = 1; n <= 10; n++) {
  A['d' + n] = () => {
    const pos = {
      1: [[50, 46]], 2: [[34, 46], [66, 46]], 3: [[34, 34], [66, 34], [50, 62]],
      4: [[34, 34], [66, 34], [34, 62], [66, 62]],
      5: [[34, 34], [66, 34], [50, 48], [34, 62], [66, 62]],
      6: [[34, 30], [66, 30], [34, 48], [66, 48], [34, 66], [66, 66]],
      7: [[32, 28], [50, 28], [68, 28], [32, 48], [68, 48], [32, 66], [68, 66]],
      8: [[32, 28], [50, 28], [68, 28], [32, 48], [68, 48], [32, 66], [50, 66], [68, 66]],
      9: [[32, 28], [50, 28], [68, 28], [32, 48], [50, 48], [68, 48], [32, 66], [50, 66], [68, 66]],
      10: [[30, 26], [50, 26], [70, 26], [30, 44], [70, 44], [30, 62], [50, 62], [70, 62], [40, 78], [60, 78]]
    }[n];
    const r = n >= 7 ? 5.6 : n >= 4 ? 6.6 : 8;
    return g(pos.map(([x, y]) => cir(x, y, r, C.gold, OUT(2))).join(''), ln(22, 84, 78, 84, 2.6, C.ink2));
  };
}

/* ---------- 词的插图 ---------- */
const FIELDS = {
  sun: '#e7c98a', water: '#bcd6e4', fire: '#efc3b6', stone: '#d8d2c6', wood: '#c7d8c2',
  mouth: '#edc7c2', hand: '#e6c9b2', heart: '#efc3c8', eye: '#c9d3dc', woman: '#e8c9d3',
  rain: '#c9d7e6', speech: '#cfcfe0', grass: '#cbdcbf', num: '#e7d7b4', misc: '#e3dbcc'
};

const hasIcon = ch => Object.prototype.hasOwnProperty.call(CHARMAP, ch);

/* 多义字：同一个字在不同词里是完全不同的东西，靠"搭档字"选义。
   没有这张表，"宝石/石子/石头"都会画成同一块碎石，"毫米"会画成米粒。 */
const SENSE = {
  石: {
    宝: ['gem', {}, 'misc'], 钻: ['gem', {}, 'misc'], 玉: ['gem', {}, 'misc'],
    翠: ['gem', {}, 'misc'], 晶: ['gem', {}, 'misc'],
    子: ['stone', { kind: 'pebbles' }, 'stone'], 粒: ['stone', { kind: 'pebbles' }, 'stone'],
    头: ['stone', { kind: 'boulder' }, 'stone'], 块: ['stone', { kind: 'boulder' }, 'stone']
  },
  米: {
    毫: ['ruler', {}, 'misc'], 厘: ['ruler', {}, 'misc'], 纳: ['ruler', {}, 'misc'],
    微: ['ruler', {}, 'misc'], 公: ['ruler', {}, 'misc'], 千: ['ruler', {}, 'misc']
  },
  见: { 意: ['bulb', {}, 'misc'], 解: ['bulb', {}, 'misc'] }
};

const iconOf = (ch, partner) => {
  const s = SENSE[ch] && partner ? SENSE[ch][partner] : null;
  if (s) return s;
  return hasIcon(ch) ? CHARMAP[ch] : null;
};

function drawIconSVG(ch, size = 100) {
  const m = iconOf(ch);
  const body = m ? A[m[0]](m[1] || {}) : badgeSVG(ch);
  return el('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 100 100',
    width: size, height: size, 'shape-rendering': 'geometricPrecision', overflow: 'hidden'
  }, body);
}

/* 兜底色标：印章式字牌（仍是矢量，无外部资源） */
function badgeSVG(ch) {
  return g(
    rct(14, 14, 72, 72, C.paper, { rx: 10, ...OUT(2.4) }),
    rct(20, 20, 60, 60, 'none', { rx: 8, stroke: C.red, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }),
    el('text', {
      x: 50, y: 50, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Kaiti SC,STKaiti,KaiTi,serif', 'font-size': 40, fill: C.ink
    }, ch)
  );
}

/* 单个字卡：纸底 + 景窗 */
function drawChar(ch, size = 100) {
  const m = iconOf(ch);
  const field = FIELDS[m ? m[2] : 'misc'];
  return el('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 100 100', width: size, height: size, overflow: 'hidden'
  }, g(
    rct(0, 0, 100, 100, C.paper, { rx: 10 }),
    rct(6, 6, 88, 88, field, { rx: 8 }),
    el('g', { transform: 'translate(10,6) scale(.8)' }, m ? A[m[0]](m[1] || {}) : badgeSVG(ch))
  ));
}


/* ---------- 兜底字牌：纹样 + 大字 + 朱印（全矢量，按词确定性地变化） ---------- */
function hashStr(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
const TONES = ['#b23a2f', '#39628f', '#3f7a63', '#c2933c', '#a8637e', '#7b7469'];

function patternOf(seed, tint) {
  const kind = seed % 6, n = 4 + (seed >> 3) % 4;
  const op = 'opacity=".5"';
  const items = [];
  for (let i = 0; i < n; i++) {
    const x = 8 + ((seed >> (i * 3)) % 84), y = 10 + ((seed >> (i * 5 + 7)) % 70);
    if (kind === 0) items.push(cir(x, y, 3.4, tint, { opacity: .5 }));
    else if (kind === 1) items.push(arc(`M${x},${y} q7,-7 14,0 q7,7 14,0`, 2, tint));
    else if (kind === 2) items.push(ln(x, y, x + 12, y, 1.6, tint));
    else if (kind === 3) items.push(pol(`${x},${y} ${x + 8},${y - 6} ${x + 16},${y}`, tint, { opacity: .45 }));
    else if (kind === 4) items.push(arc(`M${x},${y} a6,6 0 1,0 12,0`, 1.8, tint));
    else items.push(rct(x, y, 9, 9, tint, { opacity: .22 }));
  }
  return items.join('');
}

function wordPlate(word, field) {
  const seed = hashStr(word);
  const tint = TONES[seed % TONES.length];
  const chars = [...word];
  const fs = chars.length > 2 ? 24 : 38;
  const gap = chars.length > 2 ? 24 : 42;
  const startX = 50 - (chars.length - 1) * gap / 2;
  return g(
    rct(10, 12, 80, 56, field, { rx: 8 }),
    patternOf(seed, tint),
    chars.map((ch, i) => el('text', {
      x: startX + i * gap, y: 44, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Kaiti SC,STKaiti,KaiTi,serif', 'font-size': fs, fill: C.ink
    }, ch)).join(''),
    rct(15, 17, 11, 11, C.red, { rx: 2, ...OUT(1.4) })
  );
}

/* 词卡：一幅主景 + 右下角陪衬小图 + 底部色带 */
/* 修饰语（颜色/大小/程度）与虚字（们/子/了…）只作修饰，不单独入画 */
const MODIFIER = new Set([...'大小新旧老红白黄蓝绿黑高低长短多少好美香真假很最太快慢冷热甜苦干净满空忙雪']);
const FUNC = new Set([...'们子头儿个的了是在有和与及就都也又些把被从向往处着过地得']);
/* 虚词 / 抽象语素：整词没有可见实体，硬画必然离题（如果→苹果、罕见→眼睛）
   —— 这类词一律退回字牌，宁可不画，也不画错 */
const OPAQUE = new Set([...'如然虽但而且或则就才都也还又及所被把将已经曾未各某其之乎者']);  // 只收虚词；「果」是实词，别误伤水果/松果
/* 引申义为主的字：单独能画成实物的场合很少（亮点→灯泡、服→衣服），
   一旦搭档字连图元都没有，基本是在抽象词里，改走字牌 */
const META = new Set([...'平明亮服方力年五字目浪见']);
const ADVERB = new Set([...'罕颇甚略稍极更最相较从才刚常曾']);

const POS = new Set([...'上下中内外里前后左右东西南北']);
function isPlain(ch) { return !MODIFIER.has(ch) && !FUNC.has(ch); }
const canPair = ch => isPlain(ch) && !POS.has(ch);

function pickHead(chars) {
  const cand = chars.map((c, i) => ({ c, i })).filter(x => hasIcon(x.c) && canPair(x.c));
  return cand.length ? cand[0].i : -1;
}

/* 修饰字不再被"吃掉"，而是变成参数：缩放 / 注入图元参数 / 记号 */
const MOD = {
  大: { k: { s: 1.12 } }, 小: { k: { s: .82 } },
  高: { k: { s: [1, 1.12] }, p: { top: 14 } }, 长: { k: { s: [1.26, 1] } },
  雪: { p: { snow: 'heavy' } }, 白: { p: { snow: 'heavy' } },
  红: { d: ['swatch', C.red] }, 黄: { d: ['swatch', C.gold] }, 蓝: { d: ['swatch', C.blue] },
  绿: { d: ['swatch', C.jade] }, 黑: { d: ['swatch', '#2f2b28'] },
  冷: { d: ['swatch', '#5b7fa6'] }, 热: { d: ['swatch', C.red] },
  新: { d: ['sparkle', 1] }, 美: { d: ['sparkle', 1] }, 香: { d: ['sparkle', 1] },
  快: { d: ['motion', 3] }, 多: { d: ['dots', 9] }, 好: { d: ['mark', 'check'] },
  坏: { d: ['mark', 'cross'] }, 老: { d: ['crack', 1] }
};

function collectMods(chars, head) {
  const o = { sx: 1, sy: 1, p: {}, decor: [] };
  chars.forEach((c, i) => {
    const m = MOD[c];
    if (!m || i === head) return;
    if (m.k && m.k.s) {
      const s = Array.isArray(m.k.s) ? m.k.s : [m.k.s, m.k.s];
      o.sx *= s[0]; o.sy *= s[1];
    }
    if (m.p) Object.assign(o.p, m.p);
    if (m.d) o.decor.push(m.d);
  });
  return o;
}

/* 无参照物的天气类图元（风/雨/雪/云）单独入画会不知大小，配一个小参照物 */
const REF = new Set(['wind', 'rain', 'snow', 'cloud', 'lightning']);

/* 词级构图：字面直译会读错的词，单独给一份 */
/* ---------- 审稿表（人工判定）----------
   被判定"画出来的是另一个词"的词放这里，强制走字牌。宁可留白，不要错图。
   由 scripts/audit.js --apply 维护，一行一个词，别手改标记。 */
/*PLATES:BEGIN*/
const PLATES = new Set(`
  三九 门口 手足 八方 儿女 可口 四方 来去 土木 一只 说明 玩笑 回首 机会 生病 风景 跳动 机灵 日本 迷人 
  陌生 浪花 镇静 松手 顿时 浪漫 风俗 水稻 拔河 水寨 翘起 吆喝 回味 日寇 肃静 一致 豁口 起源 海盗 生涯 
  一律 聊天 挽词 绽开 葬身 建树 
`.trim().split(/\s+/).filter(Boolean));
/*PLATES:END*/

/* ---------- 语义动效（MOTION）----------
   有些词的词义就是"过程"：滴水、冒烟、融化、摇晃……一张定格图说不清，
   只能靠"变化"本身表达。这里用 SMIL（<animateTransform>/<animate>）而不是 CSS：
   游戏外壳会把每个图形改成描边、覆盖 class 和 style，SMIL 不被它碰到；
   cairosvg 忽略 SMIL，导出静态图时自然落在"最有代表性的一帧"。 */
const MOK = (type, values, dur, extra = {}) =>
  el('animateTransform', { attributeName: 'transform', type, values, dur, repeatCount: 'indefinite', ...extra });
const MOA = (attr, values, dur, extra = {}) =>
  el('animate', { attributeName: attr, values, dur, repeatCount: 'indefinite', ...extra });
const stripAnim = s => s.replace(/<animateTransform[^>]*\/>/g, '').replace(/<animate [^>]*\/>/g, '');
/* 给一组图形挂动效：inner 是图形，tags 是 SMIL 标签 */
const mg = (inner, tags, transform) => el('g', transform ? { transform } : {}, inner + tags);

const MOTION = {
  滴水: () => [
    arc('M4,72 q16,-5 32,0 q16,5 32,0 q16,-5 30,0', 2.2, C.ink2),
    ln(2, 86, 98, 86, 2.2, C.ink2),
    arc('M42,78 q8,-5 16,0', 1.6, '#9db9c9'),
    mg(el('ellipse', { cx: 50, cy: 20, rx: 4.4, ry: 6.2, fill: '#9db9c9', ...OUT(2.2) }),
      MOK('translate', '0 0;0 50', 1.5))
  ].join(''),

  流泪: () => [
    at(4, -6, .72, A.eye()),
    ln(2, 86, 98, 86, 2.2, C.ink2),
    mg(el('ellipse', { cx: 34, cy: 58, rx: 3.4, ry: 5, fill: '#9db9c9', ...OUT(2) }),
      MOK('translate', '0 0;0 24', 1.4)),
    mg(el('ellipse', { cx: 52, cy: 56, rx: 3.4, ry: 5, fill: '#9db9c9', ...OUT(2) }),
      MOK('translate', '0 0;0 26', 1.4, { begin: '0.5s' }))
  ].join(''),

  冒烟: () => [
    rct(30, 52, 40, 26, C.paper2, OUT()),
    rct(44, 32, 9, 22, '#cfd8de', OUT(2.2)),
    ln(2, 86, 98, 86, 2.2, C.ink2),
    mg(cir(50, 30, 5, 'none', { stroke: '#8a8175', 'stroke-width': 2 }),
      MOK('translate', '0 0;0 -18', 2.2) + MOA('opacity', '.85;0', 2.2)),
    mg(cir(63, 26, 6.5, 'none', { stroke: '#8a8175', 'stroke-width': 2 }),
      MOK('translate', '0 0;0 -20', 2.6, { begin: '0.6s' }) + MOA('opacity', '.8;0', 2.6, { begin: '0.6s' }))
  ].join(''),

  融化: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    el('ellipse', { cx: 50, cy: 84, rx: 30, ry: 5, fill: '#cfe0e8', ...OUT(2) }),
    el('g', { transform: 'translate(50 82)' }, [
      mg(rct(-16, -34, 32, 34, '#dbe8ee', OUT(2.4)) +
        arc('M-16,-34 h32', 1.6, '#8fb6c8') +
        arc('M-8,-24 q8,-6 16,0', 1.4, '#8fb6c8') +
        arc('M-8,-14 q8,-5 16,0', 1.4, '#8fb6c8'),
        MOK('scale', '1 1;1 .55', 2.6)),
      mg(pth('M-15,-2 q4,6 0,11 q-4,-5 0,-11 z', '#9db9c9', OUT(1.8)),
        MOK('translate', '0 0;0 9', 1.8)),
      mg(pth('M15,-2 q4,6 0,11 q-4,-5 0,-11 z', '#9db9c9', OUT(1.8)),
        MOK('translate', '0 0;0 11', 2.2, { begin: '0.4s' }))
    ].join(''))
  ].join(''),

  摇晃: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    arc('M2,24 q10,-11 19,-3', 1.7, C.ink2),
    arc('M2,40 q10,-11 19,-3', 1.7, C.ink2),
    arc('M98,24 q-10,-11 -19,-3', 1.7, C.ink2),
    arc('M98,40 q-10,-11 -19,-3', 1.7, C.ink2),
    mg(A.tree({}), MOK('rotate', '-4 50 86;4 50 86;-4 50 86', 2.4))
  ].join(''),

  飞舞: () => [
    arc('M4,30 q12,-8 24,-2', 1.7, C.ink2),
    arc('M8,46 q11,-7 22,-2', 1.5, C.ink2),
    arc('M90,64 q-11,-8 -22,-2', 1.5, C.ink2),
    mg(A.bird({}), MOK('translate', '0 0;12 -12;0 0', 2))
  ].join(''),

  上升: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    mg(ln(50, 74, 50, 32, 3, C.blue) + pol('40,40 50,26 60,40', C.blue),
      MOK('translate', '0 8;0 -12;0 8', 1.6))
  ].join(''),

  闪烁: () => [
    at(22, 10, .5, A.bulb()),
    mg(pth('M72,26 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.8 }), MOA('opacity', '.2;1;.2', 1.4)),
    mg(pth('M86,52 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 l5,-2 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.3 }), MOA('opacity', '1;.2;1', 1.4))
  ].join(''),

  坠落: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    ln(10, 10, 15, 17, 1.4, C.ink2), ln(14, 24, 19, 31, 1.4, C.ink2), ln(18, 38, 23, 45, 1.4, C.ink2),
    mg(mg(at(0, -14, .8, A.leaf()), MOK('rotate', '0 50 26;-60 50 26;-120 50 26', 2.4)),
      MOK('translate', '0 0;0 34', 2.4))
  ].join(''),

  滚动: () => [
    ln(8, 28, 96, 84, 2.4, C.ink2),
    ln(6, 12, 20, 22, 1.6, C.ink2),
    ln(16, 8, 26, 18, 1.4, C.ink2),
    mg(mg(cir(26, 31, 9, C.clay, OUT(2.4)) + arc('M22,28 q4,-4 8,0', 1.4, '#fff'),
        MOK('rotate', '0 26 31;360 26 31', 1.2)),
      MOK('translate', '0 0;44 27', 2.4)),
    ln(2, 86, 98, 86, 2.2, C.ink2)
  ].join(''),

  照耀: () => [mg(A.sun({}), MOA('opacity', '.6;1;.6', 2.2))].join(''),

  漂浮: () => [
    arc('M2,76 q16,-5 32,0 q16,5 32,0 q16,-5 30,0', 2, C.ink2),
    mg(at(0, -8, 1, A.boat()), MOK('translate', '0 -3;0 3;0 -3', 3)),
    ln(2, 90, 98, 90, 2, C.ink2)
  ].join(''),

  落叶: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    at(2, 53, .42, A.tree({})),
    mg(mg(at(46, 10, .45, A.leaf()), MOK('rotate', '0 67 32;-55 67 32;-110 67 32', 2.4)),
      MOK('translate', '0 0;0 42', 2.4)),
    mg(mg(at(66, 2, .4, A.leaf()), MOK('rotate', '0 85 20;45 85 20;90 85 20', 2.8, { begin: '0.5s' })),
      MOK('translate', '0 0;0 50', 2.8, { begin: '0.5s' }))
  ].join(''),

  吹拂: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    arc('M4,30 q16,-9 32,-2', 1.8, C.ink2),
    arc('M4,44 q16,-9 32,-2', 1.6, C.ink2),
    arc('M4,58 q16,-9 32,-2', 1.4, C.ink2),
    mg(mg(at(44, 16, .5, A.leaf()), MOK('rotate', '0 69 40;-40 69 40;-80 69 40', 2.6)),
      MOK('translate', '0 0;10 -8;0 0', 2.6)),
    el('g', { transform: 'translate(16,36) scale(.5)' }, A.grass())
  ].join(''),

  下降: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    mg(ln(50, 26, 50, 68, 3, C.blue) + pol('40,58 50,74 60,58', C.blue),
      MOK('translate', '0 -8;0 6;0 -8', 1.6))
  ].join(''),

  俯冲: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    ln(8, 16, 24, 26, 1.6, C.ink2),
    ln(4, 30, 20, 40, 1.4, C.ink2),
    mg(mg(A.bird({}), MOK('rotate', '16 60 56;16 60 56', 3)),
      MOK('translate', '8 -16;-4 6;8 -16', 2.2))
  ].join(''),

  爆发: () => [
    [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => {
      const r = a * Math.PI / 180;
      return ln(50 + 12 * Math.cos(r), 50 + 12 * Math.sin(r), 50 + 30 * Math.cos(r), 50 + 30 * Math.sin(r), 2.4, C.red);
    }).join(''),
    mg(cir(50, 50, 9, C.gold, OUT(2)), MOK('scale', '1 1;2 2', 1.4) + MOA('opacity', '1;.15', 1.4)),
    mg(pth('M78,20 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.6 }), MOA('opacity', '.2;1;.2', 1.2)),
    ln(2, 86, 98, 86, 2.2, C.ink2)
  ].join(''),

  燃放: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    mg(pol('20,80 24,62 28,80', C.red, OUT(1.8)) + arc('M24,84 q-4,8 -1,12', 1.2, C.clay),
      MOK('translate', '0 0;0 -26', 2.2)),
    [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
      const r = a * Math.PI / 180;
      return ln(66 + 8 * Math.cos(r), 30 + 8 * Math.sin(r), 66 + 20 * Math.cos(r), 30 + 20 * Math.sin(r), 1.8, C.gold);
    }).join(''),
    mg(cir(66, 30, 6, C.red, OUT(1.6)) + cir(66, 30, 2.6, C.gold),
      MOK('scale', '1 1;1.7 1.7', 1.8, { begin: '1s' }) + MOA('opacity', '1;.25', 1.8, { begin: '1s' }))
  ].join(''),

  沸腾: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    arc('M22,60 q-8,0 -8,-6', 2.2, C.ink2),
    arc('M78,60 q8,0 8,-6', 2.2, C.ink2),
    rct(26, 50, 48, 28, C.slate, OUT(2.4)),
    el('ellipse', { cx: 50, cy: 50, rx: 23, ry: 4.6, fill: '#cfe0e8', ...OUT(1.8) }),
    mg(cir(40, 46, 3, 'none', { stroke: C.ink2, 'stroke-width': 1.6 }), MOK('translate', '0 0;0 -16', 1.6) + MOA('opacity', '.9;.1', 1.6)),
    mg(cir(52, 44, 3.6, 'none', { stroke: C.ink2, 'stroke-width': 1.6 }), MOK('translate', '0 0;0 -20', 2, { begin: '0.5s' }) + MOA('opacity', '.9;.1', 2, { begin: '0.5s' })),
    mg(cir(64, 46, 2.6, 'none', { stroke: C.ink2, 'stroke-width': 1.4 }), MOK('translate', '0 0;0 -15', 2.4, { begin: '1s' }) + MOA('opacity', '.9;.1', 2.4, { begin: '1s' }))
  ].join(''),

  焚烧: () => [
    ln(2, 86, 98, 86, 2.2, C.ink2),
    ln(22, 84, 74, 70, 4.2, C.clay),
    ln(28, 70, 76, 84, 4.2, C.clay),
    at(0, -8, .9, A.fire()),
    mg(pth('M80,56 l2.4,6 l6,2.4 l-6,2.4 l-2.4,6 l-2.4,-6 l-6,-2.4 l6,-2.4 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.4 }), MOA('opacity', '.25;1;.25', 1.8))
  ].join('')
};

const WORDS = {
  火车: () => g(
    cir(26, 34, 5, C.paper2, { opacity: .9 }), cir(16, 28, 4, C.paper2, { opacity: .85 }),
    cir(8, 22, 3, C.paper2, { opacity: .8 }),
    rct(22, 40, 10, 18, C.slate, { rx: 2, ...OUT(2) }),
    rct(56, 42, 30, 34, C.white, { rx: 3, ...OUT() }),
    rct(63, 48, 15, 11, C.blue, { rx: 1.5, ...OUT(1.4) }),
    rct(10, 58, 44, 18, C.paper2, { rx: 4, ...OUT() }),
    pol('2,80 12,80 6,90', C.slate, OUT(1.6)),
    cir(13, 63, 3.4, C.gold, OUT(1.6)),
    cir(22, 80, 7, C.ink), cir(22, 80, 2.6, C.paper),
    cir(40, 80, 7, C.ink), cir(40, 80, 2.6, C.paper),
    cir(68, 80, 7, C.ink), cir(68, 80, 2.6, C.paper),
    ln(2, 90, 98, 90, 2.6, C.ink),
    [12, 30, 48, 66, 84].map(x => ln(x, 90, x - 5, 97, 2, C.ink2)).join('')
  ),

  /* ---- 词级配方：直接指定"画哪两张图 + 什么关系"，绕开按字取图 ----
     字段：hi 主图元 / si 副图元 / rel 关系 / hp·sp 图元参数 / mark 记号
     用法：只有字面拼接会读错、且能靠现有图元说清楚的词才进来 */
  太阳: { hi: 'sun' },                    // 太、阳两个字都没图元，原来印字牌
  月亮: { hi: 'moon' },                   // 亮→灯泡，并排会画成"月亮+灯泡"
  今天: { hi: 'calendar' },
  明天: { hi: 'calendar', mark: [['arrow', 'right']] },   // 明→太阳，并排会画成"太阳+天空"
  昨天: { hi: 'calendar', mark: [['arrow', 'left']] },
  学生: { hi: 'person', si: 'book', rel: 'ACT' },      // 学校+幼苗，不是"学生"
  同学: { hi: 'group', si: 'book', rel: 'SIDE' },  // 学→学校，单画一栋楼
  人们: { hi: 'group' },                  // 人+们，只说一个人
  人口: { hi: 'group' },                  // 人+嘴，读成"人脸"
  上课: { hi: 'teacher', mark: [['arrow', 'up']] },         // teacher 图元自带黑板，别再加一块
  下课: { hi: 'teacher', mark: [['arrow', 'down']] },
  教室: { hi: 'blackboard', si: 'chair', rel: 'SIDE' },  // 黑板 + 椅子，才像一间教室

  黑板: { hi: 'blackboard' },
  作业: { hi: 'book', si: 'pen', rel: 'COMPOSE' },
  工人: { hi: 'person', si: 'box', rel: 'SIDE' },
  工厂: { hi: 'factory' },                            // 厂房+烟囱，不再借"工→宝石"
  宝石: { hi: 'gem' }, 钻石: { hi: 'gem' },           // 切面宝石，跟碎石区分开
  石子: { hi: 'stone', hp: { kind: 'pebbles' } },     // 鹅卵石堆
  石头: { hi: 'stone', hp: { kind: 'boulder' } },     // 大石块
  毫米: { hi: 'ruler' }, 厘米: { hi: 'ruler' }, 纳米: { hi: 'ruler' },
  石匠: { hi: 'person', si: 'stone', rel: 'ACT' },    // 石匠不是"一块石头"
  石级: { hi: 'steps' }, 石阶: { hi: 'steps' },
  水果: { hi: 'fruit' },                              // 水果不是"水+苹果"
  关心: { hi: 'heart' },                              // 关心借的是心，不是门
  海鸥: { hi: 'sea', si: 'bird', rel: 'SIDE' },        // 海面上一只鸟
  马蹄: { hi: 'horse' },                              // 蹄→马，原来画成牛
  飞驰: { hi: 'horse', mark: [['motion', 3]] },        // 飞驰是马在跑，不是鸟
  水罐: { hi: 'jar' },                                // 罐子，不是水波
  水瓢: { hi: 'ladle' },
  水塔: { hi: 'tower' },
  一盏: { hi: 'bulb' },                               // 一盏灯
  花生: { hi: 'pod' },
  云崖: { hi: 'mountain', si: 'cloud', rel: 'SIDE' },
  山涧: { hi: 'mountain', si: 'water', rel: 'SIDE' },
  专家: { hi: 'person', si: 'book', rel: 'ACT' },
  生字: { hi: 'book', mark: [['sparkle', 1]] },
  农民: { hi: 'person', si: 'field', rel: 'ACT' },
  医生: { hi: 'person', mark: [['cross']] },             // 生→幼苗，原来画成"幼苗"
  吃饭: { hi: 'person', si: 'bowl', rel: 'ACT' },        // 吃→碗，原来只有一只碗（现在：人 + 碗 + 递食弧）
  做饭: { hi: 'bowl', si: 'fire', rel: 'COMPOSE' },
  睡觉: { hi: 'sitting', mark: [['zzz']] },
  起床: { hi: 'person', si: 'sun', rel: 'SIDE' },        // 起→箭头，原来只有箭头
  开门: { hi: 'hand', si: 'door', rel: 'ACT', mark: [['motion', 2]] },
  关门: { hi: 'hand', si: 'door', rel: 'ACT', mark: [['arrow', 'down']] },
  回家: { hi: 'house', si: 'person', rel: 'PLACE' },
  电灯: { hi: 'bulb' },                   // 电→闪电，并排会画成"闪电+灯泡"
  马路: { hi: 'path' },                   // 马→牛，路面上原来站着一头牛
  椅子: { hi: 'chair' },
  医院: { hi: 'house', mark: [['cross']] },
  公园: { hi: 'tree', si: 'grass', rel: 'SIDE' },
  山路: { hi: 'path', si: 'mountain', rel: 'SIDE' },

  /* 补件解锁的具体名词 */
  儿子: { hi: 'person', hp: { child: true } },
  帽子: { hi: 'hat' },
  刀子: { hi: 'knife' },
  面包: { hi: 'bread' },
  国王: () => g(at(14, 86 - 66, .66, A.person()), at(30, 12, .4, A.crown()),
    ln(2, 86, 98, 86, 2.4, C.ink2)),
  力量: () => strengthArt(),
  有力: () => g(strengthArt(), SYM.spark()),
  努力: () => g(strengthArt(), SYM.sweat(), SYM.hurry()),

  /* 状态双帧：两种状态并排，说明"从哪一态到哪一态" */
  昼夜: () => dualPanel(A.sun(), A.moon()),
  开关: () => dualPanel(A.bulb({ on: false }), A.bulb()),

  /* 程度刻度：同一枚符号重复 1/2/3 次 = 轻/中/重（槽位由 SYM_SLOT 自动错开） */
  开水: { hi: 'cup', mark: [['sym', 'heat'], ['sym', 'heat']] },
  滚烫: { hi: 'bowl', mark: [['sym', 'heat'], ['sym', 'heat'], ['sym', 'heat']] },
  洪亮: { hi: 'mouth', mark: [['sym', 'sound'], ['sym', 'bang']] },
  破裂: { hi: 'cup', hp: { broken: true } },
  破碎: { hi: 'cup', hp: { broken: true } }
};

/* 感觉与情绪：主体 + 一枚拟态符号。这是"没有实物"的词唯一诚实的画法 */
const FEEL = {
  热: { hi: 'fire', mark: [['sym', 'heat']] },
  冷: { hi: 'wind', mark: [['sym', 'frost']] },
  香: { hi: 'flower', mark: [['sym', 'scent']] },
  吵: { hi: 'mouth', mark: [['sym', 'sound']] },
  静: { hi: 'mouth', mark: [['sym', 'mute']] },
  疼: { hi: 'person', mark: [['sym', 'pain'], ['sym', 'tear']] },
  累: { hi: 'person', mark: [['sym', 'sweat'], ['zzz']] },
  急: { hi: 'runner', mark: [['sym', 'hurry']] },
  晕: { hi: 'person', mark: [['sym', 'dizzy']] },
  怒: { hi: 'person', mark: [['sym', 'anger']] },
  怕: { hi: 'person', mark: [['sym', 'tremble'], ['sym', 'bang']] },
  困: { hi: 'person', mark: [['zzz']] },
  高兴: { hi: 'person', mark: [['sym', 'spark']] },
  生气: { hi: 'person', mark: [['sym', 'anger']] },
  害怕: { hi: 'person', mark: [['sym', 'tremble'], ['sym', 'bang'], ['sym', 'sweat']] },
  紧张: { hi: 'person', mark: [['sym', 'sweat'], ['sym', 'tremble']] },
  吃惊: { hi: 'person', mark: [['sym', 'bang'], ['sym', 'ask']] },
  惊讶: { hi: 'person', mark: [['sym', 'bang'], ['sym', 'ask']] },
  愤怒: { hi: 'person', mark: [['sym', 'anger']] },
  快乐: { hi: 'person', mark: [['sym', 'spark']] },
  兴奋: { hi: 'person', mark: [['sym', 'spark'], ['sym', 'sweat']] },
  难过: { hi: 'person', mark: [['sym', 'tear']] },
  伤心: { hi: 'person', mark: [['sym', 'tear'], ['sym', 'tremble']] },
  着急: { hi: 'person', mark: [['sym', 'hurry'], ['sym', 'sweat']] },
  /* 册内常用：天气感受、静/闹、惊、喜、悲、忙 */
  寒冷: { hi: 'wind', mark: [['sym', 'frost']] },
  温暖: { hi: 'sun', mark: [['sym', 'heat']] },
  香味: { hi: 'flower', mark: [['sym', 'scent']] },
  寂静: { hi: 'moon', mark: [['sym', 'mute']] },
  幽静: { hi: 'moon', si: 'house', rel: 'SIDE', mark: [['sym', 'mute']] },
  紧急: { hi: 'runner', mark: [['sym', 'hurry']] },
  赶忙: { hi: 'runner', mark: [['sym', 'hurry']] },
  连忙: { hi: 'runner', mark: [['sym', 'hurry']] },
  赶紧: { hi: 'runner', mark: [['sym', 'hurry']] },
  繁忙: { hi: 'runner', mark: [['sym', 'hurry'], ['sym', 'sweat']] },
  惊慌: { hi: 'person', mark: [['sym', 'bang'], ['sym', 'tremble']] },
  惊叹: { hi: 'person', mark: [['sym', 'bang'], ['sym', 'ask']] },
  惊异: { hi: 'person', mark: [['sym', 'bang'], ['sym', 'ask']] },
  喜悦: { hi: 'person', mark: [['sym', 'spark']] },
  悲哀: { hi: 'person', mark: [['sym', 'tear']] },
  忧伤: { hi: 'person', mark: [['sym', 'tear'], ['sym', 'tremble']] },
  困倦: { hi: 'person', mark: [['sym', 'sweat'], ['zzz']] },
  呐喊: { hi: 'mouth', mark: [['sym', 'sound'], ['sym', 'anger']] },
  怒吼: { hi: 'mouth', mark: [['sym', 'sound'], ['sym', 'anger']] }
};
Object.keys(FEEL).forEach(w => { if (!WORDS[w]) WORDS[w] = FEEL[w]; });

function applyMod(art, mod) {
  const sx = mod.sx, sy = mod.sy;
  if (sx === 1 && sy === 1) return art;
  return el('g', { transform: `translate(50,52) scale(${sx},${sy}) translate(-50,-52)` }, art);
}

/* ---------- 拟态符号库（SYM）----------
   情绪与感觉没有实物可画：不画"疼在哪"，只画"疼"这个记号。
   符号一律画在卡片边角（右上/右侧），主体照旧居中，不抢主体位置。 */
const SYM = {
  /* 汗：累、紧张、热 */
  sweat: () => g(
    pth('M77,15 q3.4,5 0,9.4 q-3.4,-4.4 0,-9.4 z', '#9db9c9', OUT(1.8)),
    pth('M87,25 q2.6,4 0,7.2 q-2.6,-3.4 0,-7.2 z', '#9db9c9', OUT(1.6)),
    arc('M84,39 q4,-2 8,0', 1.2, '#9db9c9')),

  /* 怒气：四道斜刺围一个点，读作"火冒" */
  anger: () => g(
    arc('M72,8 q9,-6 17,-1', 2.2, C.red),
    arc('M75,17 q9,-6 17,-1', 1.9, C.red),
    arc('M78,26 q8,-5 15,-1', 1.6, C.red)),

  /* 颤抖：短折线抖在身体两侧 */
  tremble: () => g(
    arc('M84,40 l3,-5 l-3,-5', 1.6, C.ink2),
    arc('M92,46 l3,-5 l-3,-5', 1.6, C.ink2),
    arc('M16,44 l-3,-5 l3,-5', 1.6, C.ink2)),

  /* 热：两道上飘的热浪 */
  heat: () => g(
    arc('M70,10 q5,5 0,10 q-5,5 0,10', 1.6, C.clay),
    arc('M80,6 q5,5 0,10 q-5,5 0,10', 1.4, C.clay)),

  /* 冷：一枚冰晶，带短刺 */
  frost: () => g(
    ln(80,8,80,28,1.4, C.blue), ln(71,13,89,23,1.4, C.blue), ln(89,13,71,23,1.4, C.blue),
    ln(80,8,76,12,1.1, C.blue), ln(80,8,84,12,1.1, C.blue),
    ln(80,28,76,24,1.1, C.blue), ln(80,28,84,24,1.1, C.blue)),

  /* 香：两缕上行气味线 */
  scent: () => g(
    arc('M64,26 q6,-4 0,-8 q-6,-4 0,-8', 1.6, C.jade),
    arc('M74,22 q6,-4 0,-8 q-6,-4 0,-8', 1.4, C.jade),
    cir(66,32,1.8, C.jade), cir(76,28,1.4, C.jade)),

  /* 声：三道外扩弧 */
  sound: () => g(
    arc('M82,40 q6,10 0,20', 1.8, C.ink2),
    arc('M88,35 q9,15 0,30', 1.6, C.ink2),
    arc('M94,30 q12,20 0,40', 1.4, C.ink2)),

  /* 静：声波被划掉 */
  mute: () => g(
    arc('M82,40 q6,10 0,20', 1.8, C.ink2),
    arc('M88,35 q9,15 0,30', 1.6, C.ink2),
    ln(80,34,96,60, 2.4, C.red)),

  /* 头晕：头上转圈 */
  dizzy: () => g(
    arc('M64,10 q14,-10 22,2 q10,14 -12,12', 2, C.ink2),
    arc('M70,30 q12,-8 20,2', 1.6, C.ink2),
    pth('M86,10 l1.8,5 l5,1.8 l-5,1.8 l-1.8,5 l-1.8,-5 l-5,-1.8 l5,-1.8 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.2 })),

  /* 泪：眼里掉出来的一颗 */
  tear: () => g(
    pth('M74,20 q3.6,5.4 0,10 q-3.6,-4.6 0,-10 z', '#9db9c9', OUT(1.8)),
    arc('M78,34 q4,-2 8,0', 1.2, '#9db9c9')),

  /* 疼：突刺 + 放射短线，标在身体上 */
  pain: () => g(
    pol('78,50 81,44 84,50 90,53 84,56 81,62 78,56 72,53', 'none', { stroke: C.red, 'stroke-width': 1.8 }),
    ln(90,42,95,38, 1.4, C.red), ln(92,60,97,64, 1.4, C.red)),

  /* 急：速度线 + 感叹号 */
  hurry: () => g(
    ln(8,26,20,32, 1.6, C.ink2), ln(6,38,18,44, 1.4, C.ink2),
    rct(84,8,4.4,14, C.red, { rx: 1 }),
    cir(86.2,28,2.2, C.red)),

  /* 惊：只是一枚感叹号 */
  bang: () => g(rct(84,8,4.4,14, C.ink2, { rx: 1 }), cir(86.2,28,2.2, C.ink2)),

  /* 问：问号（弧 + 点，不依赖字体） */
  ask: () => g(
    arc('M80,12 q8,-4 8,4 q0,5 -4,6', 2, C.ink2),
    cir(84,28,2.4, C.ink2)),

  /* 一闪而过的星：惊喜 */
  spark: () => g(
    pth('M76,10 l2.6,7 l7,2.6 l-7,2.6 l-2.6,7 l-2.6,-7 l-7,-2.6 l7,-2.6 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.8 }),
    pth('M90,30 l1.6,4.4 l4.4,1.6 l-4.4,1.6 l-1.6,4.4 l-1.6,-4.4 l-4.4,-1.6 l4.4,-1.6 z', 'none',
      { stroke: C.gold, 'stroke-width': 1.3 }))
};

const SYM_SLOT = [[0, 0], [-56, 2], [2, 34], [-58, 34]];
function decorOf(list) {
  let si = 0;
  return list.map(([k, v]) => {
    if (k === 'sym') {
      const o = SYM_SLOT[si++ % SYM_SLOT.length];
      return el('g', { transform: `translate(${o[0]} ${o[1]})` }, SYM[v] ? SYM[v]() : '');
    }
    if (k === 'swatch') return cir(90, 14, 4.2, v, OUT(1.4));
    if (k === 'mark') return v === 'check'
      ? arc('M82,14 l4,4 l7,-9', 2.6, C.jade)
      : arc('M83,10 l9,9 M92,10 l-9,9', 2.6, C.red);
    if (k === 'sparkle') return g(cir(14, 16, 3.2, C.gold, OUT(1.2)), cir(24, 10, 2.2, C.gold), cir(10, 27, 2, C.gold));
    if (k === 'motion') return [0, 1, 2].slice(0, v).map(i => ln(78 + i * 3, 60 + i * 12, 94 + i * 2, 66 + i * 12, 2, C.ink2)).join('');
    if (k === 'dots') return Array.from({ length: v }, (_, i) => cir(82 + (i % 3) * 7, 10 + Math.floor(i / 3) * 7, 2.6, C.slate)).join('');
    if (k === 'crack') return arc('M70,58 l4,6 l-3,5 l5,7', 1.6, C.ink2);
    // 红十：医疗类词（医生/医院）没有专属图元时的最小可信记号
    if (k === 'cross') return g(rct(84, 10, 14, 4.6, C.red, { rx: 1 }), rct(88.7, 5.3, 4.6, 14, C.red, { rx: 1 }));
    // 睡眠：三个 z 替代"看不到的睡着"
    if (k === 'zzz') return g(
      el('text', { x: 74, y: 34, 'font-size': 12, 'font-family': 'Kaiti SC,STKaiti,serif', 'font-style': 'italic', fill: C.ink2 }, 'z'),
      el('text', { x: 82, y: 24, 'font-size': 9.5, 'font-family': 'Kaiti SC,STKaiti,serif', 'font-style': 'italic', fill: C.ink2 }, 'z'),
      el('text', { x: 88, y: 16, 'font-size': 7.5, 'font-family': 'Kaiti SC,STKaiti,serif', 'font-style': 'italic', fill: C.ink2 }, 'z'));
    // 方向小箭头：给"开/关""进/出"这类差别只在方向上的词一个可见区别
    if (k === 'arrow') return v === 'down'
      ? arc('M84,70 l5,8 l5,-8', 2.2, C.ink2)
      : v === 'left' ? arc('M80,74 l-8,5 l8,5', 2.2, C.ink2)
        : v === 'right' ? arc('M92,74 l8,5 l-8,5', 2.2, C.ink2)
          : arc('M84,78 l5,-8 l5,8', 2.2, C.ink2);
    return '';
  }).join('');
}

/* ---------- 关系层：二字词先判"两个东西是什么关系"，关系决定构图 ---------- */
const RELNAME = {
  SINGLE: '单体', MOD: '修饰', PLATE: '字牌', SIDE: '并列', HOLD: '包含',
  PLACE: '场所', ACT: '动作', COMPOSE: '合成', STEP: '递进', CAUSE: '因果',
  SET: '集合', FOE: '对抗'
};
const CONTAIN = new Set(['bowl', 'cup', 'box']);
const PLACE_ARCH = new Set(['house', 'school', 'field', 'bridge', 'blackboard']);
const BODY = new Set(['hand', 'eye', 'ear', 'mouth', 'foot', 'heart']);
const WEATHER = new Set(['rain', 'snow', 'cloud', 'wind', 'lightning', 'sun', 'moon']);
const GROW = new Set(['sprout', 'grass', 'leaf', 'flower', 'tree', 'soil', 'field', 'water', 'sea', 'river']);
const MANY = new Set(['many', 'few', 'group']);
const VEHICLE = new Set(['car', 'boat']);
/* 能"数个数"的实体：只有这类词，「多/少」才用集合构图，其余仍走修饰 */
const COUNTABLE = new Set(['person', 'cattle', 'fish', 'bird', 'tree', 'flower', 'stone', 'fruit', 'grass', 'ball']);
/* 能"上/下"的对象：上楼、上山、上车、上学……方位字本身不进主景，但它决定了"递进"关系 */
const CLIMBABLE = new Set(['school', 'mountain', 'tree', 'car', 'door', 'house', 'bridge', 'field', 'boat', 'steps', 'path']);
const STEP_ARCH = new Set(['steps']);
/* 水族近义：溪/江/海/水 说的是同一样东西，主字已经更具体，不必并排 */
const WATERKIN = new Set(['water', 'sea', 'river']);

function relationOf(headArch, subArch) {
  if (headArch === null) return 'PLATE';
  if (subArch === null) return 'SINGLE';
  if (headArch === subArch) return 'SINGLE';          // 松树/石头：同一个东西说了两遍
  if (WATERKIN.has(headArch) && WATERKIN.has(subArch)) return 'SINGLE';  // 溪水/江水：通名不重复画
  if (MANY.has(subArch)) return 'SET';
  if (WEATHER.has(headArch) && GROW.has(subArch)) return 'CAUSE';
  if (CONTAIN.has(headArch)) return 'HOLD';
  if (VEHICLE.has(headArch) && WEATHER.has(subArch)) return 'COMPOSE';
  if (STEP_ARCH.has(headArch)) return 'STEP';
  if (BODY.has(headArch)) return 'ACT';
  if (PLACE_ARCH.has(headArch)) return 'PLACE';
  return 'SIDE';
}

const at = (x, y, s, inner) => el('g', { transform: `translate(${x},${y}) scale(${s})` }, inner);

/* 每种关系一套固定构图：改内容不改骨架，保证一整套看起来是一家人 */
function composeRel(rel, head, sub, headArch, subArch) {
  const ground = ln(2, 86, 98, 86, 2.4, C.ink2);
  // 落地原则：元素的"脚"必须踩在同一条地平线上，否则一律读成悬空
  const onGround = (x, s, inner) => at(x, 86 - 100 * s, s, inner);
  if (rel === 'SIDE') {
    // 并列不是等分：后景小且落在后、前景大且挡住它，靠遮挡与缩放读出前后
    return g(onGround(44, .52, sub), onGround(0, .66, head), ground);
  }
  if (rel === 'HOLD') {
    // 容器占主位，内容物缩进容器内腔
    return g(at(6, 6, .8, head), at(28, 40, .24, sub));
  }
  if (rel === 'PLACE') {
    // 场所：建筑在右、物件在左、共一条地面；门这类"属于建筑"的部件贴到墙根
    if (subArch === 'door') return g(onGround(36, .66, head), at(30, 52, .3, sub), ground);
    return g(onGround(42, .58, head), onGround(0, .38, sub), ground);
  }
  if (rel === 'ACT') {
    // 动作：主体在左，受事在右，中间一道作用弧 + 箭头
    return g(at(0, 10, .58, head), at(58, 32, .42, sub),
      arc('M36,56 q18,-18 26,-6', 2.4, C.ink2),
      pol('68,44 58,46 63,53', C.ink2));
  }
  if (rel === 'COMPOSE') {
    // 合成：主体大在前，附属小在后上（烟/云/风），背后加动势线
    return g(at(32, 2, .34, sub), at(0, 24, .68, head),
      [0, 1, 2].map(i => ln(4 + i * 3, 58 + i * 10, 22 + i * 3, 62 + i * 10, 2, C.ink2)).join(''), ground);
  }
  if (rel === 'STEP') {
    // 递进：四级台阶从下往上，主体站在顶端，箭头指出方向
    const stairs = g(
      rct(2, 78, 30, 9, C.paper2, OUT(1.8)),
      rct(12, 68, 30, 9, C.paper2, OUT(1.8)),
      rct(22, 58, 30, 9, C.paper2, OUT(1.8)),
      rct(32, 48, 26, 9, C.paper2, OUT(1.8)));
    const arrow = g(arc('M40,72 q6,-14 2,-30', 2.2, C.ink2), pol('36,40 44,40 40,33', C.ink2));
    return g(stairs, arrow, at(20, 48 - 100 * .42, .42, head));
  }
  if (rel === 'CAUSE') {
    // 因果：因在上（云/雨），果在下（苗/水），一条下坠虚线收尾
    return g(at(10, 2, .54, head), at(20, 40, .56, sub),
      [0, 1, 2].map(i => ln(52, 30 + i * 6, 52, 33 + i * 6, 2, C.slate)).join(''),
      pol('46,50 58,50 52,60', C.slate));
  }
  if (rel === 'SET') {
    // 集合：三个同类，近大远小，全部落地
    return g(onGround(-8, .38, head), onGround(22, .44, head), onGround(52, .52, head), ground);
  }
  return null;
}

function plan(word) {
  const chars = [...word].slice(0, 2);
  const head = word.length > 2 ? -1 : pickHead(chars);
  const mate = i => (chars.length === 2 ? chars[1 - i] : null);
  const hIcon = head >= 0 ? iconOf(chars[head], mate(head)) : null;
  const sub = chars.findIndex((c, i) => i !== head && hasIcon(c) && canPair(c)
    && iconOf(c, mate(i))[0] !== (hIcon ? hIcon[0] : null));
  const sIcon = sub >= 0 ? iconOf(chars[sub], mate(sub)) : null;
  const mods = chars.filter((c, i) => i !== head && MOD[c]).join('');
  const spec = WORDS[word];
  // 会意词：字义由部件合成，人工已审过 → 优先于自动规则与旧的字牌判决
  if (HUI_WORDS[word]) {
    return { chars, head: 0, hIcon: ['hui', { char: HUI_WORDS[word] }, 'misc'], sub: -1, sIcon: null, mods: '',
      baseRel: 'HUI', rel: 'HUI', many: false, spec: null, hui: HUI_WORDS[word] };
  }
  // 借场景词：人工登记的整幅构图
  if (SCENE[word]) {
    return { chars, head: 0, hIcon: null, sub: -1, sIcon: null, mods: '',
      baseRel: 'SCENE', rel: 'SCENE', many: false, spec: () => SCENE[word](sceneCtx()), scene: word };
  }
  // 审稿表：人工已判定画错 → 字牌（优先级高于一切自动规则）
  if (PLATES.has(word)) {
    return { chars, head: -1, hIcon: null, sub: -1, sIcon: null, mods: '', baseRel: 'PLATE', rel: 'PLATE', many: false, spec: null };
  }
  // 语义动效词：词义是过程，定格图说不清 → 走 MOTION
  if (MOTION[word]) {
    return { chars, head: 0, hIcon: ['motion', {}, 'misc'], sub: -1, sIcon: null, mods: '',
      baseRel: 'SINGLE', rel: 'MOTION', many: false, spec: null, motion: true };
  }
  // 抽象词：没有可见实体 → 直接字牌（head = -1 是"不画"的统一信号）
  const mateCh = head >= 0 ? chars.find((c, i) => i !== head) : null;
  const mateBlank = !!mateCh && !hasIcon(mateCh);
  if (!spec && (chars.some(c => OPAQUE.has(c)) || (hIcon && chars.some((c, i) => i !== head && ADVERB.has(c)))
      || (hIcon && META.has(chars[head]) && mateBlank))) {
    return { chars, head: -1, hIcon: null, sub: -1, sIcon: null, mods: '', baseRel: 'PLATE', rel: 'PLATE', many: false, spec: null };
  }
  const baseRel = spec && typeof spec === 'object'
    ? (spec.rel || (spec.si ? 'SIDE' : 'SINGLE'))
    : spec ? 'COMPOSE' : relationOf(hIcon ? hIcon[0] : null, sIcon ? sIcon[0] : null);
  const dir = chars[0] === '上' ? 'up' : chars[0] === '下' ? 'down' : null;
  const climb = !spec && baseRel === 'SINGLE' && !!dir && !!hIcon && CLIMBABLE.has(hIcon[0]);
  const many = !spec && baseRel === 'SINGLE' && chars.includes('多') && !!hIcon && COUNTABLE.has(hIcon[0]);
  const rel = spec ? baseRel : climb ? 'STEP' : many ? 'SET' : baseRel === 'SINGLE' && mods ? 'MOD' : baseRel;
  return { chars, head, hIcon, sub, sIcon, mods, baseRel, rel, many, spec };
}

/* 只出画面本体：不带卡片底、不带顶部色条、不带标签
   —— 游戏/网页自己套纸面与手绘边框时用这个；字牌词返回 null */
function bodyOf(word, opts = {}) {
  const p = plan(word);
  const mod = collectMods(p.chars, p.head);
  if (p.many) mod.decor = mod.decor.filter(d => d[0] !== 'dots');

  let art;
  if (p.hui) {
    art = huiArt(p.hui);
  } else if (p.motion) {
    art = MOTION[word]();
    if (opts.anim === false) art = stripAnim(art);   // 打印/PNG/GIF 走"最有代表性的一帧"
  } else if (p.spec && typeof p.spec === 'function') {
    // 整幅自绘的词级构图（如火车：一个字都借不到）
    art = p.spec();
  } else if (p.spec) {
    // 配方：主图元 + 可选副图元 + 关系骨架
    const head = A[p.spec.hi](p.spec.hp || {});
    const sub = p.spec.si ? A[p.spec.si](p.spec.sp || {}) : null;
    art = sub ? composeRel(p.rel, head, sub, p.spec.hi, p.spec.si) : at(10, 2, .82, head);
  } else if (p.head >= 0) {
    const params = { ...(p.hIcon[1] || {}), ...(p.baseRel === 'SINGLE' ? mod.p : {}) };
    const big = A[p.hIcon[0]](params);
    if (p.rel === 'STEP' || p.rel === 'SET') {
      art = composeRel(p.rel, big, big, p.hIcon[0], p.hIcon[0]);
    } else if (p.baseRel === 'SINGLE') {
      {
        art = applyMod(at(10, 2, .82, big), mod);
        if (REF.has(p.hIcon[0])) {
          // 天气类补一个参照物，解决"这道弧线是什么、有多大"
          art = g(art,
            ln(6, 82, 94, 82, 2.2, C.ink2),
            el('g', { transform: 'translate(14,36) scale(.62)' }, A.grass()),
            el('g', { transform: 'translate(64,50) scale(.4)' }, A.grass()));
        }
      }
    } else {
      art = applyMod(composeRel(p.baseRel, big, A[p.sIcon[0]](p.sIcon[1] || {}), p.hIcon[0], p.sIcon[0]), mod);
    }
  } else {
    return null;                     // 字牌：不在这一层画，调用方自己排字
  }
  /* 词级配方是"整幅自述"：不再叠加单字修饰记号（色片/动势线），只留配方自己的 mark */
  const dec = p.spec ? [] : mod.decor;
  return {
    art: art + decorOf(p.spec && p.spec.mark ? [...dec, ...p.spec.mark] : dec),
    p, mod,
    field: FIELDS[p.hIcon ? p.hIcon[2] : 'misc']
  };
}

function illustrate(word, opt = {}) {
  const size = opt.size || 100;
  const b = bodyOf(word, opt);
  const field = b ? b.field : FIELDS.misc;
  const art = b ? b.art : wordPlate(word, field);

  const label = opt.label
    ? el('text', {
      x: 50, y: 93, 'text-anchor': 'middle', 'font-family': 'Kaiti SC,STKaiti,serif',
      'font-size': 12, fill: C.ink2, 'letter-spacing': 2
    }, word)
    : '';

  return el('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 100 100',
    width: size, height: size, 'shape-rendering': 'geometricPrecision', overflow: 'hidden'
  }, g(
    rct(0, 0, 100, 100, C.paper, { rx: 12, ...OUT(2) }),
    rct(6, 6, 88, 2.5, field, { rx: 1 }),
    art,
    label
  ));
}

function describe(word) {
  const p = plan(word);
  const kind = p.rel === 'PLATE' ? 'plate'
    : p.rel === 'SINGLE' || p.rel === 'MOD' || p.rel === 'MOTION' ? 'scene'
    : p.rel === 'SIDE' ? 'duo' : 'rel';
  const spec = p.spec && typeof p.spec === 'object' ? p.spec : null;
  return {
    kind, rel: p.rel, word: !!p.spec,
    head: spec ? spec.hi : p.head >= 0 ? p.chars[p.head] : null,
    arch: spec ? spec.hi : p.hIcon ? p.hIcon[0] : null,
    sub: spec ? spec.si || null : p.sub >= 0 ? p.chars[p.sub] : null,
    subArch: spec ? spec.si || null : p.sIcon ? p.sIcon[0] : null,
    mods: p.mods
  };
}

function kindOf(word) { return describe(word).kind; }

function stats(words) {
  const c = { duo: 0, scene: 0, plate: 0, rel: 0 };
  const byRel = {};
  for (const w of words) {
    const d = describe(w);
    c[d.kind]++;
    byRel[d.rel] = (byRel[d.rel] || 0) + 1;
  }
  const drawn = c.duo + c.scene + c.rel;
  return { ...c, byRel, drawn, total: words.length, rate: words.length ? (drawn / words.length * 100).toFixed(1) : '0' };
}

module.exports = { illustrate, bodyOf, drawChar, drawIconSVG, stats, kindOf, describe, relationOf, RELNAME, wordPlate, hasIcon, CHARMAP, A, C };
