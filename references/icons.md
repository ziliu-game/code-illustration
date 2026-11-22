# 图元体系与扩字流程

## 结构

```
字 ──CHARMAP──> [图元名, 参数]  ──A[图元名]──> SVG 片段（0~100 坐标系）
词 ──kindOf()──> duo（双景）/ scene（主景）/ plate（字牌，无图元时兜底）
```

- `CHARMAP`：`{'山': ['mountain'], '水': ['wave'], ...}`，**178 字**；一个汉字最多 2 个图元，第二个当点缀。
- `A`：约 35 个参数化图元函数（`mountain(p)`、`wave(p)`、`tree(p)`、`house(p)`…），统一签名 `(p) => string`，`p` 可传颜色/数量/翻转。
- `hasIcon(ch)` / `iconOf(ch)`：查表。
- `canPair(ch)`：区分"能当主景"和"只能当点缀"（点、光、雪这类）。
- `wordPlate(word, field)`：两字都画不出时，退化成字牌（字 + 色带），不要硬凑怪图。

## 加一个字的完整流程（按顺序做，别跳）

1. **查**：`node -e "const i=require('./scripts/illus.js');console.log(i.hasIcon('檐'),i.iconOf('檐'))"` — 已有就复用。
2. **拆**：把字拆成 2~3 个几何件（如"檐" = 屋脊横线 + 上翘三角 + 两片瓦）。拆不出来就承认它不适合画，落成字牌。
3. **画**：在 `A` 里加一个函数，只返回 `<path>/<rect>/<circle>/<polygon>` 字符串，坐标都在 0~100 内，**留 8 的安全边**（外框 6 处有描边）。
4. **挂**：新建 `data/chars/<字>.json`，参数数组第二个位置放点缀图元名。
5. **验**：`node scripts/render.js 屋檐 /tmp/x.svg --label` → `cairosvg.svg2png` → 用 `Read` 看 `x.png`。**必须真的看图**，不要凭代码猜。
6. **回归**：`node -e "const i=require('./scripts/illus.js');console.log(i.stats(['山水','屋檐','太阳']))"` 确认没把别的词挤成 plate。

## 三个真实踩过的坑

- `rct(x,y,w,h,fill)` 必须写 `width`/`height`，写成 `w`/`h` 会渲染成 0 尺寸且不报错。
- `pth(d, fill, extra)` 的第三个参数是**附加属性**，别把 `stroke` 当填充色传进去，会生成非法属性。
- 图元里再嵌 `<svg>`（缩放复用一个图元）时必须加 `overflow="hidden"`，否则子元素会溢出到卡片外。

## 覆盖率

`stats(words)` 返回 `{duo, scene, plate, drawn, total, rate}`。画得出来的比例叫**画面化率**——真实 12 册 1296 词约 23%，低年级高（一上 79%），高年级几乎全是抽象词。想提升只有一条路：按年级高频词优先补图元，别平铺全表。

## 变体优先于新图元

同一个物要区分"大小/程度/形态"时，**加参数，别加函数**：

- `A.mountain({ top: 8 })` 更尖、`{ snow: 'heavy' }` 大雪顶、`{ wide: true }` 高原；`高原/雪山/高山` 全部走参数。
- `A.water({ calm: true })` 湖、`{ series: 3 }` 多排浪；`海` 用独立的 `A.sea()`（需要有地平线才像"辽阔"），`江/河` 用 `A.river({ small })`（要有宽度才像"带"）。
- 判断标准：**换个参数还认得出是同一个东西** → 参数；**画法结构都变了** → 新函数。

新加的 `sea`/`river` 由路径描边构成，`ln()` 画的地平线在 doodle/wash 里依赖属性正则保留坐标——那条正则必须支持带数字的属性名（`x1/y1/x2/y2`），否则线会全部丢成空元素。
