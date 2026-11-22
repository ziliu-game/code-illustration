#!/usr/bin/env node
/* 生成 GitHub Pages 展示页（docs/index.html），单文件、不依赖外网资源
   用法：node scripts/site.js
   产物：docs/index.html + docs/.nojekyll
   依赖：只读 assets/demo-*.svg 与 scripts 里的生成函数，不联网
*/
'use strict';
const fs = require('fs');
const path = require('path');
const I = require('./illus.js');
const D = require('./doodle.js');
const W = require('./wash.js');

const ROOT = path.join(__dirname, '..');
/* 仓库地址：命令行 --repo 优先，其次 package.json 的 repository.url；
   都没有时展示页不渲染仓库链接，避免出现 404 的坏链 */
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const REPO = (process.argv.find(a => a.startsWith('http'))
  || (pkg.repository && pkg.repository.url) || '').replace(/\/$/, '');
if (!REPO) console.log('提示：package.json 未配 repository.url，展示页暂不带仓库链接');

const DOCS = path.join(ROOT, 'docs');

/* 把拼版 SVG 变成可自适应宽度的一段内联 SVG */
function inlineSheet(file) {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', file), 'utf8');
  // 拼版自带一行标题，展示页里由 <h2> 承担，去掉免得说两遍
  const stripped = svg.replace(/<text[^>]*font-size="17"[^>]*>[^<]*<\/text>/, '');
  return stripped.replace('<svg ', '<svg class="sheet" preserveAspectRatio="xMidYMid meet" ');
}

/* 同一张卡片的三种画法：给展示页做"画法切换" */
const SWITCH_WORDS = ['山水', '上学', '大海', '学生'];
function styleCards() {
  const styles = { plain: '彩色', doodle: '墨线', wash: '水墨' };
  return SWITCH_WORDS.map(w => {
    const one = style => style === 'doodle' ? D.doodleCard(w, 100)
      : style === 'wash' ? W.washCard(w, 100) : I.illustrate(w, { size: 100 });
    return `<figure class="sw" data-word="${w}">
      <div class="stack">
        <div class="art" data-style="plain">${one('plain')}</div>
        <div class="art" data-style="doodle" hidden>${one('doodle')}</div>
        <div class="art" data-style="wash" hidden>${one('wash')}</div>
      </div>
      <figcaption><span class="w">${w}</span>
        <span class="seg">${Object.keys(styles).map((k, i) => `<button type="button" data-style="${k}"${i === 0 ? ' class="on"' : ''}>${styles[k]}</button>`).join('')}</span>
      </figcaption>
    </figure>`;
  }).join('');
}

/* 语义动效：这些词的画面自带 SMIL，网页里会动 */
const MOTION_WORDS = ['滴水', '流泪', '冒烟', '融化', '摇晃', '飞舞', '上升', '闪烁', '坠落', '滚动', '照耀', '漂浮',
  '落叶', '吹拂', '下降', '俯冲', '爆发', '燃放', '沸腾', '焚烧'];
function motionCards() {
  return MOTION_WORDS.map(w => `<figure class="sw">
      <div class="stack"><div class="art">${I.illustrate(w, { size: 200 })}</div></div>
      <figcaption><span class="w">${w}</span></figcaption>
    </figure>`).join('');
}

const STATS = [
  ['22.4%', '册内 1296 词的可画率'],
  ['25.2%', '14919 词表上的可画率'],
  ['1181B', '单张 SVG 体积中位'],
  ['0', '硬伤（外链/位图/超限）'],
  ['15', '拟态符号'],
  ['21', '会意字部件表'],
  ['93', '图元'],
  ['20', '语义动效词（SMIL）']
];

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>code-illustration · 纯代码画汉字插图</title>
<meta name="description" content="用字符串拼 SVG 把汉字词变成可批量、可编辑的插图，不调用生图模型、不引用位图。">
<style>
:root{--paper:#fffdf7;--ink:#3b3330;--ink2:#6b6259;--line:#e3dbcc;--clay:#b46b4a;--blue:#3a6f9e;--jade:#5b8a68}
*{box-sizing:border-box}
body{margin:0;background:#f3ece0;color:var(--ink);font:16px/1.7 "Kaiti SC",STKaiti,KaiTi,Georgia,serif}
.wrap{max-width:1060px;margin:0 auto;padding:0 22px}
header{padding:64px 0 30px;border-bottom:1px solid var(--line);background:var(--paper)}
.kicker{color:var(--ink2);letter-spacing:.16em;font-size:12px;margin:0 0 10px}
h1{margin:0 0 12px;font-size:40px;line-height:1.25;font-weight:600}
.lede{margin:0;color:var(--ink2);max-width:44em}
.badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;padding:0;list-style:none}
.badges li{background:#f6f0e4;border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:13px;color:var(--ink2)}
.badges b{color:var(--ink);font-weight:600;margin-right:6px}
main section{padding:46px 0;border-bottom:1px solid var(--line)}
h2{font-size:24px;margin:0 0 8px;font-weight:600}
h2 span{color:var(--ink2);font-size:13px;font-weight:400;margin-left:10px;letter-spacing:.08em}
p.note{color:var(--ink2);margin:0 0 20px;max-width:52em}
figure{margin:0}
.sheet{display:block;width:100%;height:auto;background:var(--paper);border:1px solid var(--line);border-radius:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px}
.sw{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 12px 10px}
.stack{position:relative;aspect-ratio:1;max-width:200px;margin:0 auto}
.stack .art svg{width:100%;height:auto;display:block}
.sw figcaption{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}
.sw .w{font-size:18px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}
.seg button{border:0;background:transparent;color:var(--ink2);font:inherit;font-size:12px;padding:4px 9px;cursor:pointer}
.seg button+button{border-left:1px solid var(--line)}
.seg button.on{background:var(--ink);color:var(--paper)}
#pause{border:1px solid var(--line);background:var(--paper);color:var(--ink2);font:inherit;font-size:13px;padding:4px 12px;border-radius:999px;cursor:pointer}
pre{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:16px 18px;overflow:auto;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#3a342e}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.two{display:grid;grid-template-columns:1fr 1fr;gap:26px}
footer{padding:30px 0 60px;color:var(--ink2);font-size:13px}
footer a{color:var(--clay)}
@media (max-width:720px){h1{font-size:30px}.two{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="wrap">
  <p class="kicker">CODE ILLUSTRATION · 程序化插图</p>
  <h1>用代码画汉字插图，<br>不调用生图模型</h1>
  <p class="lede">把词拆成参数化图元，再判"两个字是什么关系"套固定构图骨架。输出是<b>能改、能批量、约 1KB</b> 的 SVG——不是位图，也不是提示词。</p>
  <ul class="badges">${STATS.map(([v, l]) => `<li><b>${v}</b>${l}</li>`).join('')}</ul>
</div></header>

<main>
<section><div class="wrap">
  <h2>三种画法<span>同一份图元 · 换后处理</span></h2>
  <p class="note">彩色承载语义，适合低识字量；墨线只描边，省墨、手账气质；水墨靠多点叠印伪造柔边，适合古诗山水。<b>点卡片右下角切换画法</b>——同一份图元，只换后处理；同一批只能一种画风。</p>
  <div class="grid">${styleCards()}</div>
</div></section>

<section><div class="wrap">
  <h2>关系层<span>关系决定构图，不是把两个图标并排</span></h2>
  <p class="note">并排只是十种关系里的一种。递进画台阶与方向，动作画作用弧，因果画上下与下坠箭头——同一批词因此像一家人。</p>
  ${inlineSheet('demo-relations.svg')}
</div></section>

<section><div class="wrap">
  <h2>词级配方<span>按字取图一定错的词</span></h2>
  <p class="note">"太阳"两个字都没图元，"学生"会被画成"学校+幼苗"，"马路"的路面上会站一头牛。这类词绕开字，直接写"画哪两张图 + 什么关系"。</p>
  ${inlineSheet('demo-words.svg')}
</div></section>

<section><div class="wrap">
  <h2>动效语义<span>词本身就是"过程"</span></h2>
  <p class="note">滴水、冒烟、融化、摇晃、飞舞、坠落、滚动、燃放、沸腾——这些词定格怎么画都差一口气，它们说的是"正在发生"。画面自带 SMIL 动画，<b>下面这些卡片是真的在动</b>（静态导出自动落在最有代表性的首帧）。<button type="button" id="pause">暂停 / 继续</button></p>
  <div class="grid">${motionCards()}</div>
</div></section>

<section><div class="wrap">
  <h2>拟态符号<span>没有主体可画，就画"感觉"的记号</span></h2>
  <p class="note">香、吵、疼、累、急、怒、怕、晕——这些词缺的不是图元，是"感觉怎么画"的约定。漫画早给了现成语汇：汗滴=累、三道蒸汽弧=怒、上飘热浪=热、两缕线=气味、外扩弧=声、红斜杠=静。这批记号收进 <code>SYM</code>（15 枚），只挂四角槽位，一卡最多两枚；先把"能画的物"画完，符号是最后一招。</p>
  ${inlineSheet('demo-symbols.svg')}
</div></section>

<section><div class="wrap">
  <h2>拆字会意<span>部件本身就是图</span></h2>
  <p class="note">会意字的图不用"找物件"：日+月=明、人倚木=休、手搭目=看、宀下火=灾、三木=森。这一层同时讲对了<b>字形</b>与<b>字义</b>，对识字场景最划算。18 个字的部件表 + 三套版式（左右 / 上下 / 三件），但只有"词义 = 字形义"的词才许启用。</p>
  ${inlineSheet('demo-decomp.svg')}
</div></section>

<section><div class="wrap">
  <h2>借场景<span>抽象词借一个念得出词义的生活场景</span></h2>
  <p class="note">抽象词没有实体，但多数在生活里有场景。两件最多三件图元搭一个：嫩芽+初升的太阳=希望，人+一座比自己高的山=困难，靶心+射中红心的箭=目标，人挑担子=责任。<b>判据只有一条：遮住词牌念一遍，念的是不是这个词</b>——<code>帮助</code>（大人指小孩→"指"）与 <code>机会</code>（开着的门+星芒→"告示牌"）都因念不对而撤掉。</p>
  ${inlineSheet('demo-scene.svg')}
</div></section>

<section><div class="wrap">
  <h2>补件与借动作<span>先参数、再补件、最后借动作</span></h2>
  <p class="note">会意字卡住多半是缺部件。"女/子"不必新画——<code>A.person</code> 早带 <code>dress</code>/<code>hair:'bun'</code>/<code>child</code>；真缺的只有豕（<code>A.pig</code>），补上后 <b>家</b>、<b>安</b> 都立住。器物补了冠/帽/刀/面包。抽象词像"力"没有可画之物，就<b>借动作</b>：人举石念得出"力气"，推石上坡念得出"努力"——但"制度""逻辑"借什么都念不出，直接字牌。</p>
  ${inlineSheet('demo-parts.svg')}
</div></section>

<section><div class="wrap">
  <h2>状态双帧 / 程度刻度<span>两态并排，记号叠数表轻重</span></h2>
  <p class="note">"开关""昼夜"这种词说的是<b>两个状态之间的差</b>：左右两帧同一件东西，中间一道虚线加箭头，念出来就是"从关到开"。程度词则用同一枚记号叠 1/2/3 次——一层热浪是温、三层是滚烫；一层冰晶是凉、三层是冰凉。不新增图元，只借参数与重复。</p>
  ${inlineSheet('demo-states.svg')}
</div></section>

<section><div class="wrap">
  <h2>图元是零件 + 装配<span>换参数，不是复制函数</span></h2>
  <p class="note">山有尖峰、缓坡、高原、双峰；水有波纹、湖面、急流；树分阔叶与针叶。判据是：换个数还认得出是同一个东西，就加参数。</p>
  ${inlineSheet('demo-variants.svg')}
</div></section>

<section><div class="wrap">
  <h2>开始用<span>零依赖 · Node ≥ 18</span></h2>
  <div class="two">
    <pre><code># 单张
node scripts/render.js 山水 out.svg
node scripts/render.js 山水 out.svg --style doodle --size 300 --label

# SVG → PNG
python3 -c "import cairosvg;cairosvg.svg2png(url='out.svg', write_to='out.png', output_width=600)"

# 批量验收（硬伤非 0 退出）
node scripts/validate.js --batch words.json --max-dupe 8</code></pre>
    <pre><code># 词级配方：绕开"字"这一层
WORDS['学生'] = { hi:'person', si:'book', rel:'ACT' }
WORDS['医生'] = { hi:'person', mark:[['cross']] }

# 图元变体：零件 + 参数
A.mountain({ shape:'round', top:26, snow:'heavy' })
A.water({ form:'lake' })
A.tree({ pine:true })

# 拟态符号：没有主体的感觉词
WORDS['害怕'] = { hi:'person', mark:[['sym','sweat'],['sym','tremble']] }
WORDS['寂静'] = { hi:'moon', mark:[['sym','mute']] }

# 动效语义：网页里会动，静态导出是首帧
bodyOf('融化')                  // 带 SMIL
bodyOf('融化', { anim:false })   // 去掉动画</code></pre>
  </div>
</div></section>
</main>

<footer><div class="wrap">
  MIT · 代码独立编写，思路参考 spotkit / anatomy / draw-tech-svg ·
  ${REPO ? `<a href="${REPO}">仓库</a> · <a href="${REPO}/blob/main/README.md">README</a> · <a href="${REPO}/blob/main/SKILL.md">SKILL.md</a> · <a href="${REPO}/blob/main/CONTRIBUTING.md">CONTRIBUTING</a> · ` : ''}
  页面由 <code>node scripts/site.js</code> 生成
</div></footer>

<script>
let paused = false;
const pauseBtn = document.getElementById('pause');
if (pauseBtn) pauseBtn.addEventListener('click', () => {
  paused = !paused;
  document.querySelectorAll('svg').forEach(sv => {
    try { paused ? sv.pauseAnimations() : sv.unpauseAnimations(); } catch (e) {}
  });
});
document.querySelectorAll('.sw').forEach(fig => {
  const arts = [...fig.querySelectorAll('.art')];
  const btns = [...fig.querySelectorAll('.seg button')];
  btns.forEach(btn => btn.addEventListener('click', () => {
    const s = btn.dataset.style;
    btns.forEach(b => b.classList.toggle('on', b === btn));
    arts.forEach(a => { a.hidden = a.dataset.style !== s; });
  }));
});
</script>
</body>
</html>`;

fs.mkdirSync(DOCS, { recursive: true });
fs.writeFileSync(path.join(DOCS, 'index.html'), page);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
console.log('wrote docs/index.html', (page.length / 1024).toFixed(1) + 'KB');
