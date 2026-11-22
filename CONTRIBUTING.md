# 贡献指南

欢迎接手继续改。这个仓库的价值不在"图多好看"，而在**能被规则化地批量生产**——所以所有改动都要过同一道验收。

## 三条铁律

1. **不引入生图模型**。任何"抽一张图再描"的路子都不接受。
2. **不引入外部位图**。所有画面必须由 `<rect>/<circle>/<path>/<polygon>/<line>` 拼出；字体只用系统字体或明确授权的开源字体。
3. **同一批交付只许一种画风**（`plain` / `doodle` / `wash` 不能混着出）。

## 十三个扩展入口

先判断你要加的东西属于哪一层，别越层改。

### 1. 加一个字的图元（最常见）

按 [`references/icons.md`](references/icons.md) 的 6 步：查表 → 拆件 → 画函数 → 挂 `CHARMAP` → 看图验 → `stats()` 回归。

```bash
node -e "const I=require('./scripts/illus.js');console.log(I.describe('海鸥'))"
node scripts/render.js 海鸥 /tmp/t.svg && python3 -c "import cairosvg;cairosvg.svg2png(url='/tmp/t.svg',write_to='/tmp/t.png',output_width=400)"
```

新图元要回答一个问题：**它在 76px 下还剩几个特征？** 少于 2 个就简化，别硬塞细节。

### 2. 给已有图元加变体（优先于加新图元）

先看 `PART.*` 的零件能不能覆盖差异；能，就在 `A.xxx(p)` 里加参数分支，别复制一份函数。

判据：换个数还认得出是同一个东西 → 加参数；画法结构都变了 → 加函数。
挂触发参数的两处入口：`MOD`（修饰字，如 `雪山 → p:{snow:'heavy'}`）或 `CHARMAP`（字本身，如 `松 → tree{pine:true}`）。

### 3. 加一种关系（会改变一批词的构图）

1. `RELNAME` 加名字；
2. `relationOf(headArch, subArch)` 按 arch 加判定——**放在通用规则之前**，否则被 `SIDE` 吞掉；
3. `composeRel(rel, head, sub, headArch, subArch)` 加骨架；
4. 用 `describe()` 抽样确认命中（写 5 个例词逐一看）；
5. 跑 `validate.js` 看关系分布，确认不是"只命中 1 个词"的伪规则。

骨架必须遵守：**所有元素踩同一地平线**（`onGround`），**前后靠遮挡而非等分**。

### 4. 加一条词级构图（语义跑偏的词）

`WORDS` 表里一个词一个函数，用来救"字面拼接会读错"的词（`火车`、`学生`）。

判据：把两个字并排念一遍，念出来的不是这个词 → 该登记。

别滥用：词级表是补丁，不是主路径。只有关系层 + 图元层确实救不回来的词才进来。

### 6. 登记一条字义消歧（`SENSE`）

一个字在别的词里变成别的东西时，别加新图元，也别登记一堆词级配方——在 `SENSE` 里按搭档字挂义项：

```js
SENSE.石 = { 宝:['gem',{},'misc'], 子:['stone',{kind:'pebbles'},'stone'], 头:['stone',{kind:'boulder'},'stone'] };
```

判据：**这个字是"材料/通名"吗**（石/米/木/铁/水）。是就基本都需要 `SENSE`，因为它进哪个词就变哪个物件。

反向的改动不要提：把抽象词硬画成一幅具象图。`OPAQUE/ADVERB/META` 存在的意义就是**允许"不画"**。

### 7. 往审稿表里加词（最省事的改进）

发现某个词画成了别的东西：把它写进 `bad.txt`，跑 `node scripts/audit.js --apply bad.txt`，它就进 `PLATES` 强制字牌。

**先想想能不能补配方**（`WORDS`）——有图元只是组合错了，补一条配方比退回字牌更值（`水果`：`{hi:'fruit'}`、`关心`：`{hi:'heart'}`、`海鸥`：`{hi:'sea', si:'bird'}`）。救不动的才进表。

### 5. 登记一条词级配方（语义跑偏的词）

`WORDS` 表用"图元 + 关系"直接描述一个词，不再经过字。字段见 `SKILL.md`：`hi/si/rel/hp/sp/mark`。

判据：把两个字并排念一遍，念出来的不是这个词 → 才登记。`太阳`（印字牌）、`学生`（学校+幼苗）、`马路`（路面站一头牛）都属于这类。

**不要**登记 `山水`、`看书` 这种关系层已经判对的词——登记会绕开规则，以后规则改好它也享受不到。

验收：`node scripts/validate.js <词>` + `node scripts/demo.js words`，看两张图元在 76px 下是否还认得出、是否和同批撞图。

### 8. 加一条语义动效（词本身是个"过程"）

`滴水`、`冒烟`、`融化`、`摇晃` 这类词，定格图说不清，进 `scripts/illus.js` 的 `MOTION` 表：

```js
MOTION['融化'] = () => [
  地面与物件...,
  el('g', { transform: 'translate(50 82)' }, [
    mg(冰块的图形, MOK('scale', '1 1;1 .55', 2.6)),   // 外层静态位、内层挂动画
    mg(水滴的图形, MOK('translate', '0 0;0 9', 1.8))
  ].join(''))
].join('');
```

三条验收（缺一不可）：首帧**单独看懂**（`render.js 融化 out.svg` 看静态）；浏览器两帧**确有差别**（`--virtual-time-budget=1` vs `=900` 截图对比）；进游戏外壳后**动画还在**（数 DOM 里 `<animateTransform>` 的个数，别只看画面）。

配套规矩见 `SKILL.md`「动效语义层」与 `references/animation.md`「路线 C」。

### 9. 加一枚拟态符号（"没有主体"的感觉词）

适用：词的语义是**感觉或状态**，没有可画主体，用图元怎么画都像别的东西（`香`、`吵`、`疼`、`急`、`怕`）。

1. 先确认它不是"物"。是物就该进 `A`，不是符号。
2. 在 `scripts/illus.js` 的 `SYM` 里加纯函数，返回 `<g>` 字符串，100×100 卡面坐标，中心落在四角槽位（约 ±8 半径）；只用 `el/cir/pth/ln/arc`，**不许用滤镜**（cairosvg 不支持）。
3. 在词上试装：`WORDS['害怕'] = { hi:'person', mark:[['sym','sweat'],['sym','tremble']] }`；一枚符号最多两枚，顺序决定槽位（右上→左上→右下→左下）。
4. 缩到 76px 看还认不认得出，再跑 `node scripts/demo.js symbols`。
5. 规则见 [references/symbols.md](references/symbols.md)：同义词可同图（`赶忙/赶紧`），近义词不许（`宝石/石子`）。

### 10. 加一个状态双帧 / 一条程度刻度（"差值"与"轻重"词）

适用：`开关`、`昼夜`（两个状态之间的差），或 `滚烫`、`冰凉`（同一感觉的强弱）。

- 双帧：给器物图元加状态参数（`bulb.on`、`door.open`、`bowl.full`、`cup.broken`），再写 `WORDS['词'] = () => dualPanel(A.a(), A.a({...}))`；两帧缩到 46% 后仍要认得出是什么。
- 刻度：`mark` 里同一枚符号重复 1/2/3 次（1=轻、2=中、3=重，最多 3 枚），不要换记号。
- 跑 `node scripts/demo.js states`，并按 [references/symbols.md](references/symbols.md) 的两节验收。

### 11. 加一个会意字（部件本身就是图）

适用：会意/合体会意字，且**词义 = 字形义**（`灾`、`明`、`众`、`渔`）。字义与字形不一致的（`晶莹`、`说明`、`从来`）不要加。

1. 查部件都有图元（`A` 的键名）；缺部件先补图元，别用近义部件硬凑。
2. 在 `scripts/illus.js` 的 `HUI` 里登记 `{ parts: [...], lay: 'side'|'stack'|'tri' }`，主体在前的加 `front: 1`。
3. 在 `HUI_WORDS` 白名单里挑词：只放"念出来就是这个词"的（`灾难`→灾、`渔夫`→渔）。
4. 缩到 76px，遮住词牌问自己"念得出这个字吗"；念不出就回退。
5. 跑 `node scripts/demo.js decomp`，细则见 [references/decomposition.md](references/decomposition.md)。

### 12. 给抽象词"借动作"（没有实物，就借一个能读出词义的动作）

适用：词义是抽象的、但能对应一个具体动作的（`力量`、`努力`、`团结`、`自由`）。**不适用**：读不出动作的（`制度`、`逻辑`、`机会`）。

1. 先看 `A` 里能不能拼出动作（举石、推车、登台阶、开门放鸟），拆件优先。
2. 动作与词义要"念得出"：人举石念得出"力气"，人推石上坡念得出"努力"。
3. 写成 `WORDS` 的整幅函数（如 `力量: () => strengthArt()`），再叠符号补程度（`有力`=举石+星芒）。
4. 缩到 76px 看；念不出就退回单字牌，别为了覆盖率硬借。

### 13. 加一个"借场景"的抽象词（没有实物，就搭一个生活里的场景）

适用：抽象但人人有共同场景的词（`希望`、`困难`、`目标`、`危险`、`责任`）。**不适用**：借什么都念不出的（`制度`、`逻辑`、`礼貌`、`孤独`）。

1. 先问有没有"人人都会做"的场景；没有就别勉强。
2. 挑 2–3 件图元，其中**一件必须指向词义**（太阳的方位、箭的落点、担子的重量）。
3. 写成 `SCENE` 里的整幅函数，统一地平线 y=86；符号只做"语气"（感叹号/星芒/泪）。
4. 遮住词牌念一遍，念出来不是这个词就退出（`帮助`、`机会` 都这样撤过）。
5. 跑 `node scripts/demo.js scene`，细则见 [references/scenes.md](references/scenes.md)。

## CI 会替你跑什么

push / PR 触发 `.github/workflows/validate.yml`，四件事：脚本语法、`assets/` 与 `docs/` 是否与提交一致（改了生成器忘了提交产物会红）、三种画法冒烟、`npm run check`（170 词样本的硬伤/同构图/可画率）。

本地等价：`npm run demo && npm run site && npm run check`。**同构图超 12 次、可画率跌破 60% 都会让 PR 变红**——前者说明图元复用过度，后者说明删图元或改错了映射。

## 提交前必须跑

```bash
# 1. 单点验收（硬伤：外链/位图/体积/元素数 → 非 0 退出）
node scripts/validate.js 大山 火车 大海 上学

# 2. 全库验收（有词表就批量跑，盯"同构图重复率"与关系分布）
node scripts/validate.js --batch words.json --max-dupe 8

# 3. 示例拼版 + 展示页（改过图元/关系必跑，产物进 assets/ 与 docs/）
node scripts/demo.js
node scripts/site.js

# 4. 图片"打开看一眼"：缩到 76 宽，认不出就是没画对
python3 -c "import cairosvg;cairosvg.svg2png(url='assets/demo-variants.svg',write_to='/tmp/v.png',output_width=1240)"
```

**验收标准**：硬伤 0 个；同一构图重复不超过 `--max-dupe`；76px 下主体可辨；三种画法至少各出一张确认没丢元素。

## 代码约定

- 核心库 `scripts/illus.js` **零依赖**，不要往里面 require npm 包；坐标统一在 `0 0 100 100` 的 `viewBox` 里。
- 颜色只从 `C.*` 取，不要写死 hex——换主题时才不会到处改。
- 后处理（`doodle.js` / `wash.js`）只改属性，不重画：新增图元必须能被它们吃下去；属性正则要支持带数字的名字（`x1/y1/x2/y2`）。
- 新增脚本请带注释头（用途 + 用法 + 产物落在哪）。
- 文档与代码同步：改了行为就改 `SKILL.md` / `README.md` 的对应段落，别让文档说谎。

## 提交信息

`层: 做了什么`，例如：

```
rel: 补 CAUSE 的下坠箭头虚线
icon: 山体加 double 双峰变体
fix: doodle 正则丢 x1/y1 导致地平线消失
docs: 关系表补"对立未实现"标注
```

## 不接受的改动

- 引入滤镜（`feGaussianBlur`/`feTurbulence`）——`cairosvg` 不支持，本地渲染与 CI 都会挂。
- 用 ImageMagick 做 SVG→PNG 的流程。
- 为了让一个词好看而破坏同批一致性（改全局比例、改地平线位置）。
- 把抽象词硬编成具象物（"民主"画成投票箱，属于过度解读）。
- 往 `WORDS` 里塞关系层能判对的词，或一个词一条自绘 SVG（除非像 `火车` 那样一个字都借不到）。
