#!/usr/bin/env node
/* 示例资产生成器：把关系层、图元变体、三种画法各拼成一张拼版 SVG
   产物默认写到 assets/，纯 SVG、零依赖；需要 PNG 再用 cairosvg 转：
     python3 -c "import cairosvg; cairosvg.svg2png(url='assets/demo-relations.svg', write_to='assets/demo-relations.png', output_width=1200)"
   用法：
     node scripts/demo.js            # 全部
     node scripts/demo.js relations  # 只出关系层
*/
'use strict';
const fs = require('fs');
const path = require('path');
const I = require('./illus.js');
const D = require('./doodle.js');
const W = require('./wash.js');

const OUT = path.join(__dirname, '..', 'assets');
const FONT = 'Kaiti SC, STKaiti, KaiTi, serif';
const CARD = 100;

/* 把一张词卡当成"嵌套 svg"塞进拼版，靠 viewBox 缩放 */
function card(word, style) {
  const svg = style === 'doodle' ? D.doodleCard(word, CARD)
    : style === 'wash' ? W.washCard(word, CARD)
      : I.illustrate(word, { size: CARD });
  return svg.includes('overflow=') ? svg : svg.replace('<svg ', '<svg overflow="hidden" ');
}

function iconCard(fn, p) {
  const bg = `<rect x="0" y="0" width="${CARD}" height="${CARD}" rx="12" fill="#f7f1e4" stroke="#3b3330" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD}" height="${CARD}" viewBox="0 0 100 100" overflow="hidden">${bg}${I.A[fn](p)}</svg>`;
}

function sheet(title, items, cols) {
  const cell = 118, pad = 14, label = 22;
  const rows = Math.ceil(items.length / cols);
  const w = cols * cell + pad * 2, h = rows * (cell + label) + label + pad * 2;
  const cells = items.map(([text, a, b], i) => {
    const x = pad + (i % cols) * cell, y = label + pad + Math.floor(i / cols) * (cell + label);
    const art = typeof b === 'object' ? iconCard(a, b) : card(a, b);
    return `<g transform="translate(${x + 4},${y + 2}) scale(${(cell - 8) / CARD})">${art}</g>`
      + `<text x="${x + cell / 2 - 2}" y="${y + cell + 14}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#6b6259">${text}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<rect width="${w}" height="${h}" fill="#fffdf7"/>`
    + `<text x="${pad}" y="${pad + 10}" font-family="${FONT}" font-size="17" fill="#2b2622">${title}</text>`
    + cells + '</svg>';
}

const RELATION_ITEMS = [
  ['并列·山水', '山水'], ['修饰·大山', '大山'], ['包含·吃药', '吃药'],
  ['场所·家门', '家门'], ['动作·看书', '看书'], ['合成·火车', '火车'],
  ['因果·雨水', '雨水'], ['集合·人多', '人多'], ['递进·上学', '上学']
];

/* 变体拼版直接调图元：参数差异才不会被"字"这层掩盖 */
const VARIANT_ITEMS = [
  ['山·尖峰', 'mountain', {}], ['山·大雪顶', 'mountain', { snow: 'heavy' }],
  ['山·缓坡', 'mountain', { shape: 'round', top: 26 }], ['山·高原', 'mountain', { shape: 'plateau', top: 22 }],
  ['水·波纹', 'water', {}], ['水·湖面', 'water', { form: 'lake' }],
  ['水·急流', 'water', { form: 'rapids', banks: true }], ['树·阔叶', 'tree', {}],
  ['树·针叶', 'tree', { pine: true }], ['江·宽河', 'river', {}]
];

/* 词级配方：字面拼接会读错的词，直接给"图 + 关系" */
const WORDS_ITEMS = [
  ['太阳', '太阳'], ['月亮', '月亮'], ['今天·明天·昨天', '明天'], ['学生', '学生'],
  ['上课', '上课'], ['教室', '教室'], ['作业', '作业'], ['农民', '农民'],
  ['医生', '医生'], ['吃饭', '吃饭'], ['睡觉', '睡觉'], ['马路', '马路'],
  ['椅子', '椅子'], ['医院', '医院'], ['回家', '回家']
];

const STYLE_ITEMS = [
  ['彩色卡片', '山水', 'plain'], ['墨线涂鸦', '山水', 'doodle'], ['水墨晕染', '山水', 'wash'],
  ['彩色卡片', '上学', 'plain'], ['墨线涂鸦', '上学', 'doodle'], ['水墨晕染', '上学', 'wash']
];

const MOTION_ITEMS = [
  ['滴水', '滴水'], ['流泪', '流泪'], ['冒烟', '冒烟'], ['融化', '融化'],
  ['摇晃', '摇晃'], ['飞舞', '飞舞'], ['上升', '上升'], ['闪烁', '闪烁'],
  ['坠落', '坠落'], ['滚动', '滚动'], ['照耀', '照耀'], ['漂浮', '漂浮'],
  ['落叶', '落叶'], ['吹拂', '吹拂'], ['下降', '下降'], ['俯冲', '俯冲'],
  ['爆发', '爆发'], ['燃放', '燃放'], ['沸腾', '沸腾'], ['焚烧', '焚烧']
];

const SYMBOLS_ITEMS = [
  ['香', '香'], ['吵', '吵'], ['静', '静'], ['疼', '疼'],
  ['累', '累'], ['急', '急'], ['晕', '晕'], ['怒', '怒'],
  ['怕', '怕'], ['紧张', '紧张'], ['生气', '生气'], ['高兴', '高兴'],
  ['寒冷', '寒冷'], ['温暖', '温暖'], ['香味', '香味'], ['寂静', '寂静'],
  ['紧急', '紧急'], ['惊慌', '惊慌'], ['喜悦', '喜悦'], ['忧伤', '忧伤']
];

const STATES_ITEMS = [
  ['昼夜（双帧）', '昼夜'], ['开关（双帧）', '开关'], ['开水（2 级热）', '开水'],
  ['滚烫（3 级热）', '滚烫'], ['洪亮（声波+叹号）', '洪亮'], ['破裂（杯碎）', '破裂'], ['破碎（杯碎）', '破碎']
];

const DECOMP_ITEMS = [
  ['明·日+月', '明'], ['休·人倚木', '休'], ['看·手搭目', '看'], ['采·手摘木', '采'],
  ['岛·鸟栖山', '岛'], ['岩·山上石', '岩'], ['炎·二火', '炎'], ['森·三木', '森'],
  ['从·二人', '从'], ['灾难·宀下火', '灾难'], ['观众·三人', '观众'], ['宝贝·宀中玉', '宝贝']
];

const PARTS_ITEMS = [
  ['好·女+子', '好'], ['安·宀下女', '安'], ['家·宀下豕', '家'],
  ['儿子·小孩参数', '儿子'], ['帽子·新器物', '帽子'], ['刀子·新器物', '刀子'],
  ['面包·新器物', '面包'], ['国王·戴冠', '国王'], ['力量·借举石', '力量'],
  ['有力·举石+星芒', '有力'], ['努力·举石+速度线', '努力']
];

const SCENE_ITEMS = [
  ['希望·芽+日', '希望'], ['未来·路+日', '未来'], ['危险·雷+人', '危险'], ['困难·人+山', '困难'],
  ['漂亮·花+星', '漂亮'], ['目标·箭中靶', '目标'], ['责任·挑担', '责任'], ['感动·心+泪', '感动']
];

const jobs = {
  words: ['词级配方：字面拼接读错的词，逐词登记', WORDS_ITEMS, 5],
  relations: ['关系层：九种构图各出一张', RELATION_ITEMS, 5],
  variants: ['图元变体：同一主体靠参数换造型', VARIANT_ITEMS, 5],
  styles: ['三种画法：同一份图元，换后处理', STYLE_ITEMS, 3],
  motion: ['动效语义：静态首帧（网页/游戏里这些词会动）', MOTION_ITEMS, 5],
  symbols: ['拟态符号：没有主体可画时，画"感觉"的记号', SYMBOLS_ITEMS, 5],
  states: ['状态双帧与程度刻度：两态并排 / 记号叠数表轻重', STATES_ITEMS, 4],
  decomp: ['拆字会意：部件本身就是图，字义由部件合成', DECOMP_ITEMS, 4],
  parts: ['补件与借动作：先参数、再补件、最后借动作', PARTS_ITEMS, 4],
  scene: ['借场景：抽象词借一个念得出词义的生活场景', SCENE_ITEMS, 4]
};

const only = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
for (const [key, [title, items, cols]] of Object.entries(jobs)) {
  if (only && only !== key) continue;
  const file = path.join(OUT, `demo-${key}.svg`);
  fs.writeFileSync(file, sheet(title, items, cols));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
