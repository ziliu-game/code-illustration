# 动画：让插图"逐笔长出来"

两条路，按运行环境选，不要混用。

## 路线 A：烘焙帧（离线出 GIF / 视频）

`scripts/anim.js` 以 `t(0..1)` + `f(帧号)` 为参数，产出**静态 SVG**：

```bash
node scripts/anim.js 山水          # 在 /tmp/anim_山水 下吐出 40 帧 svg
```

`scripts/mk_gif.py` 把多词拼成网格 GIF（楷体标签、首帧替换成"已画完"避免缩略图空白）：

```bash
python3 scripts/mk_gif.py out.gif 山水 风雨 车船
```

用于：课件贴片、公众号/短视频素材、给用户"预览动效"的样张。缺点：体积大（6 词 3×2 约 1.2MB），不能交互。

## 路线 B：网页内实时（推荐用于游戏/网页/单机 HTML）

两个子方案，**优先 CSS**：

### B1. CSS 关键帧（首选）

每个元素加 class + 两个自定义属性，SVG 内自带 `<style>`：

```html
<style>
.ikd{stroke-dasharray:var(--l) var(--l);animation:ikline .42s linear var(--t) both}
.ikb{animation:ikboil .34s steps(1,end) var(--t) infinite}
@keyframes ikline{from{stroke-dashoffset:var(--l)}to{stroke-dashoffset:0}}
@keyframes ikboil{0%{transform:translate(0,0)}33%{transform:translate(-.35px,.4px)}
50%{transform:translate(.3px,.25px)}100%{transform:translate(0,0)}}
</style>
<path d="..." class="ikd ikb" style="--l:180px;--t:0.018s"/>
```

- `--l` 必须是**该元素真实路径长度**，见下方"周长必须算"。
- `--t` 按元素序号步进（0.018s 一档），即"一笔一笔"；`both` 保证画完停在终态。
- 抖动用 `steps(1,end)` 做"帧跳"，比线性更像手绘；每 0.34s 换一次相位。

### B2. SMIL `<animate>`（兼容老 WebView，但浏览器自动化测不准）

`attributeName="stroke-dashoffset" from="L" to="0" dur="0.34s" fill="freeze"`。功能上没问题，但 Chromium `--virtual-time-budget` 对 SMIL 时间的推进不线性，**截图验收会误判**；能用 CSS 就别用 SMIL。

## 路线 C：SMIL 语义动效（词义是"过程"时用这条）

入场动画讲的是"怎么出现"，语义动效讲的是"这东西正在怎样"。`滴水`、`冒烟`、`融化`、`摇晃`、`飞舞`、`上升`、`闪烁`、`坠落`、`滚动`、`照耀`、`漂浮`、`流泪` 走这条，登记在 `scripts/illus.js` 的 `MOTION` 表。

```js
const MOK = (type, values, dur, extra = {}) =>   // animateTransform
  el('animateTransform', { attributeName: 'transform', type, values, dur, repeatCount: 'indefinite', ...extra });
const MOA = (attr, values, dur) =>                // animate
  el('animate', { attributeName: attr, values, dur, repeatCount: 'indefinite' });
const mg = (inner, tags, transform) => el('g', transform ? { transform } : {}, inner + tags);
```

**为什么不用 CSS**：接进游戏/页面后，外壳会把每个图形改写成描边元素（覆写 `class` 与 `style`），CSS class 动画会被打掉；SMIL 节点不是图形元素，外壳的正则碰不到它，且 `cairosvg` 忽略它 → 静态导出正好得到首帧。

四条实现规矩：

1. **动画和基础 transform 分两层**。`animateTransform` 会**替换** `transform`；同一元素既写 `transform="translate(...)"` 又挂 `scale` 动画 = 图形跳到原点。外层静态 `el('g',{transform})`，内层 `mg(inner, MOK(...))`。
2. **同一次动作只用一个 `animateTransform`**：要"边位移边旋转"就套两层 `<g>`（`坠落` 外层位移、内层旋转）。
3. **首帧要能独立看懂**——打印、缩略图、`anim:false` 用的都是它。
4. **预算**：一张卡 1 条主动效（+1 条透明度辅助），1.5–3s 循环，位移 ≤12px、旋转 ≤8°；`repeatCount="indefinite"`，不做一次性动画（会停在结束态，缩略图就废了）。

降级：`bodyOf(word, { anim:false })` → `stripAnim()` 去掉全部 SMIL；`prefers-reduced-motion`、PNG/GIF/打印一律走这条。

验收：动效没法用静态图看，**必须在浏览器里看两帧有没有差别**：

```bash
chromium --headless --disable-gpu --no-sandbox --virtual-time-budget=1    --screenshot=t0.png file:///path/card.html
chromium --headless --disable-gpu --no-sandbox --virtual-time-budget=900  --screenshot=t1.png file:///path/card.html
```

## 周长必须算（这条最容易翻车）

固定 `stroke-dasharray:480` 会让小图形（一个脏点、一个小圆）在动画最后一刻"啪"地跳出来，因为它的周长远小于 480。按形状估算：

- `circle` → `6.28r`；`ellipse` → `6.28*max(rx,ry)*.82`
- `rect` → `2(w+h)`；`line` → 两点距离
- `polygon/polyline` → 相邻点距离累加
- `path` → 从 `d` 里抽数字两两成点，近似累加（贝塞尔会偏大，可接受）

## 接进已有页面的正确姿势

**不要改主脚本的调用签名**（会牵动测试与覆盖率）。做法是"挂接"：包一层原函数，执行后往容器里 `insertAdjacentHTML('afterbegin', '<div class="图">' + svg + '</div>')`，并用 `orig.__hooked` 防重复挂载。

## 节奏

- 总时长控制在 **0.6s 内画完**，之后至少留 0.15s 静置，再触发下一步（飞走/翻页），否则观感是"没看清就没了"。
- 一屏同时动不超过 1 张。
- 弱机降级：只抖动、不逐笔（把 `.ikd` 换成静态描边）。
