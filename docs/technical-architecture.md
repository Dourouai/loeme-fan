# Loeme Motif MVP 技术架构文档

> 状态：Draft v0.3  
> 日期：2026-07-14  
> 适用范围：SVG-first、浏览器端参数化图样编辑器 MVP

配套文档：[Loeme Motif MVP 产品需求文档](./mvp-prd.md)

审计记录：[Loeme Motif MVP 需求与架构审计](./mvp-audit.md)

## 1. 文档目标

本文定义 Loeme Motif MVP 的技术边界、核心数据模型、模块职责、节点执行方式、SVG 处理策略和交付验收标准。应用挂载于现有 Loeme 站点的 `/apps/motif`，不是独立部署的第二套前端。

MVP 需要跑通的基础主链路是：

```text
导入图形
→ 可选的素材组合
→ 参数化编排
→ 配色
→ Artboard 输出
→ 导出 SVG
```

Repeat 作为独立输出能力接在同一 Evaluated Scene 之后：

```text
Evaluated Scene → Wrap / Repeat → Seam Check → Repeat SVG
```

本文不试图设计一个通用矢量编辑器或通用可视化编程平台。

## 2. 技术原则

1. **SVG-first**：输入、内部资产和输出都以矢量图形为主，不把位图转矢量作为 MVP 能力。
2. **浏览器本地计算**：核心编排、预览和导出不依赖 GPU 或后端渲染服务。
3. **结构化项目优先**：项目文件是结构化数据，不以 SVG DOM 作为唯一数据源。
4. **确定性优先**：相同素材、参数和 Seed 必须产生相同结果。
5. **节点 UI 与计算解耦**：节点画布只负责交互，节点执行由自有 Pattern Engine 完成。
6. **先约束后扩展**：MVP 只开放 5 种产品节点，底层模型为未来节点预留扩展点。
7. **导出可信**：导出的 SVG 必须能重新导入并保持视觉结果一致。
8. **Repeat 可拔插**：有限画板构图不依赖 Wrap；Repeat 技术门失败不能破坏 Artboard 输出。

## 3. MVP 技术范围

### 3.1 包含

- 导入一个或多个 SVG 图形。
- 使用构建时审核和 Normalize 的内置 Starter Motif。
- 自动清理和规范化 SVG。
- 将多个素材组合为一个复合 Motif。
- Scatter 与 Array 两种编排模式。
- 可复现的随机种子。
- 基础防重叠和最小间距。
- 图形权重、缩放范围、旋转范围和位置扰动。
- 受控色板映射。
- Artboard 有限画板输出。
- Square、Brick、Half Drop 平铺。
- Artboard、单 Tile 与多 Tile 实时预览。
- Compact SVG 与 Flattened SVG 导出。
- 本地项目保存、Undo/Redo 和项目 JSON 导出。

### 3.2 不包含

- PNG/JPG 输入与位图矢量化。
- AI Motif 生成。
- 路径节点级编辑。
- Boolean、Mask、Blend、Warp、沿路径排列。
- 通用表达式节点或代码节点。
- 多人协作和云端项目同步。
- TIFF、PDF、AI 等生产格式。
- 服务端渲染或 GPU 任务队列。

## 4. 推荐技术栈

| 层 | 选择 | 职责 |
|---|---|---|
| 应用壳 | 现有 React 19 + TypeScript + Next-compatible/Vinext | 复用 Loeme 路由、样式、Cloudflare 构建与部署 |
| 路由 | `/apps/motif` 下的应用路由 | 入口、新建、项目工作台与模板 |
| 节点画布 | P1 引入 `@xyflow/react` | 只负责节点拖动、连接、选择、缩放和小地图 |
| SVG 操作 | 原生 SVG DOM；`@svgdotjs/svg.js` 仅在交互层按需引入 | 不进入纯计算引擎或项目数据模型 |
| SVG 清洗 | DOMPurify + Motif 严格白名单与二次语义校验 | DOMPurify 是第一道防线，不替代业务白名单 |
| 状态管理 | Zustand + Immer | 项目状态、选择态、参数更新和历史记录 |
| 本地持久化 | Dexie / IndexedDB | 项目、素材、缩略图、schema migration |
| 计算 | 自研 TypeScript Pattern Engine | Compose、Scatter、Array、Wrap 和 Colorway |
| 后台计算 | Web Worker 适配层 | 大量实例计算，不阻塞界面 |
| 测试 | Vitest + 浏览器端 E2E | 纯函数、SVG 快照、导入导出和主流程测试 |

### 4.1 开源项目的使用边界

| 项目 | 使用方式 | 结论 |
|---|---|---|
| [XYFlow](https://github.com/xyflow/xyflow) | P1 作为节点交互层 | MIT；P0 固定 Recipe Strip 不依赖它 |
| [SVG.js](https://github.com/svgdotjs/svg.js) | 仅在主线程交互层按需使用 | MIT；项目模型与 Worker Engine 不依赖 DOM 库 |
| [DOMPurify](https://github.com/cure53/DOMPurify) | SVG 清洗的第一道防线 | Apache-2.0/MPL-2.0；清洗后仍执行标签、属性、URL 和复杂度白名单 |
| [Dexie](https://github.com/dexie/Dexie.js) | IndexedDB schema 与 migration 包装 | Apache-2.0；仅本地持久化，不等于云同步 |
| [Tessera](https://github.com/SwiftedMind/Tessera) | 研究 Organic/Grid、Seed、碰撞、Toroidal Wrap 等算法 | MIT；Web 端使用 TypeScript 重写，不引入 Swift 运行时 |
| [Pattern Monster](https://github.com/catchspider2002/svelte-svg-patterns) | 研究 Pattern 定义、参数和 SVG 导出 | MIT；不作为布局引擎 |
| [SVG-Edit](https://github.com/SVG-Edit/svgedit) | 参考选择框、变换手柄、历史记录和图层交互 | MIT；MVP 不嵌入完整编辑器 |
| [FlowTile](https://flowtile.vercel.app/) | 参考边缘复制和 Square/Brick 交互 | 未可靠确认源码仓库和许可前，不复制代码 |
| VTracer | 暂不使用 | MVP 只接受 SVG，无位图转换链路 |
| Patterium | 只参考产品形态 | 未明确许可，不复用代码 |

## 5. 总体架构

```text
┌────────────────────────────────────────────────────┐
│                    Workspace UI                    │
│  Motifs Library · Canvas · Network · Inspector     │
└─────────────────────────┬──────────────────────────┘
                          │ commands / selections / files
                ┌─────────▼──────────┐
                │ Import Pipeline    │
                │ DOM sanitize       │
                │ normalize → asset  │
                └─────────┬──────────┘
                          │ approved asset / commands
┌─────────────────────────▼──────────────────────────┐
│                     Project Store                  │
│ assets · compositions · graph · settings · history│
└───────────────┬─────────────────────┬──────────────┘
                │                     │
        ┌───────▼────────┐    ┌──────▼──────────┐
        │ Graph Evaluator │    │ Persistence     │
        │ typed DAG/cache │    │ IndexedDB/JSON  │
        └───────┬────────┘    └─────────────────┘
                │
┌───────────────▼────────────────────────────────────┐
│                  Pattern Engine                    │
│ pure TS: compose · arrange · colorway · wrap       │
└───────────────┬────────────────────────────────────┘
                │ evaluated scene
        ┌───────▼────────┐
        │ SVG Renderer    │
        │ preview/export  │
        └────────────────┘
```

Import Pipeline 运行在浏览器主线程的隔离 DOM 上，负责不可信 SVG。Pattern Engine 只接收通过 schema 校验的规范化资产和数值参数，因此可以在 Worker 与测试环境运行。

## 6. 领域数据模型

### 6.1 基础类型

```ts
type ID = string

type Vec2 = {
  x: number
  y: number
}

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

type Matrix2D = {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}
```

### 6.2 素材

```ts
type MotifLicense = {
  source: 'loeme' | 'user' | 'openclipart' | 'lucide' | 'tabler' | 'other'
  author?: string
  license: 'proprietary' | 'CC0-1.0' | 'MIT' | 'ISC' | 'Apache-2.0' | 'user-owned'
  sourceUrl?: string
  modified: boolean
  assetVersion: number
}

type MotifAsset = {
  id: ID
  name: string
  origin: 'upload' | 'built-in' | 'composition'
  sourceSvg?: string
  normalizedSvg: string
  viewBox: Bounds
  bounds: {
    geometry: Bounds
    visual: Bounds
    collision: Bounds
  }
  colorSlots: Array<{
    id: string
    original: string
  }>
  checksum: string
  license: MotifLicense
  warnings: string[]
}
```

`sourceSvg` 只作为不可执行文本保留用户原始输入，不允许进入预览或导出 DOM；项目导出默认可以不包含它。`normalizedSvg` 是唯一可进入计算、预览和导出的版本。

内置素材在构建时完成 Normalize 和安全测试。用户选择内置素材后，将其 `normalizedSvg`、checksum 和许可证元数据复制到项目中，而不是只保存在线库引用，避免素材升级导致旧项目变化。

`geometry` 用于坐标和对齐，`visual` 包含受支持的 Stroke 并用于裁切检查，`collision` 用于 Min Distance/Reduce Overlap，允许在视觉边界基础上加入统一 padding。三类边界都在 Normalize 时固化，不能在每次打开项目时重新测量。

### 6.3 组合图形

```ts
type Composition = {
  id: ID
  name: string
  width: number
  height: number
  origin: Vec2
  children: Array<{
    id: ID
    assetId: ID
    transform: Matrix2D
    zIndex: number
    visible: boolean
    locked: boolean
  }>
}
```

Compose 只保存素材引用与相对变换，不破坏原始路径。

### 6.4 实例与图样

```ts
type SceneInstance = {
  id: ID
  motifRef: ID
  transform: Matrix2D
  colorMap?: Record<string, string>
  sourceIndex: number
  wrappedFrom?: ID
}

type EvaluatedScene = {
  bounds: {
    width: number
    height: number
  }
  instances: SceneInstance[]
  seed: number
  warnings: PatternWarning[]
}

type OutputSettings =
  | {
      mode: 'artboard'
      width: number
      height: number
      unit: 'px' | 'mm'
      clip: boolean
    }
  | {
      mode: 'repeat'
      tile: {
        width: number
        height: number
        unit: 'px' | 'mm'
        repeat: 'square' | 'brick' | 'halfDrop'
      }
    }
```

Arrange 始终输出有限的 `EvaluatedScene`。只有 Output 为 `repeat` 时才调用 Wrap、环面碰撞检查和 Seam Check；Artboard 不产生环绕副本。

内部坐标使用当前文档单位的 SVG user units，导出时 `viewBox` 数值与文档宽高一致。切换 px/mm 默认按 CSS 96 px/in 换算以保持物理尺寸，并作为一次可撤销操作同时转换尺寸、间距和实例变换；不允许只改单位标签。

### 6.5 布局候选

```ts
type ArrangeVariant = {
  id: ID
  name: string
  arrangeNodeId: ID
  mode: 'scatter' | 'array'
  seed: number
  parameters: Record<string, unknown>
  thumbnailKey: string
  createdAt: string
}
```

Variant 保存 Arrange 的完整参数快照，而不只保存 Seed；否则后续修改 Density 或 Scale 后无法恢复原结果。每个项目 MVP 最多保存 6 个。

### 6.6 项目

```ts
type MotifProject = {
  schemaVersion: number
  id: ID
  name: string
  assets: Record<ID, MotifAsset>
  compositions: Record<ID, Composition>
  arrangeVariants: Record<ID, ArrangeVariant>
  palettes: Record<ID, Palette>
  output: OutputSettings
  graph: {
    nodes: ProjectNode[]
    edges: ProjectEdge[]
  }
  canvas: {
    viewport: { x: number; y: number; zoom: number }
    previewRepeat: number
  }
  createdAt: string
  updatedAt: string
}
```

所有项目文件必须包含 `schemaVersion`，后续通过 migration 升级。

### 6.7 路由与客户端边界

```text
/apps/motif                 应用入口
/apps/motif/new             创建本地项目
/apps/motif/projects/:id    客户端工作台
/apps/motif/templates       内置模板
```

工作台组件使用明确的客户端边界。服务端不得读取 IndexedDB；首屏先渲染稳定 Skeleton，再在 hydration 后加载项目。Pattern Engine 和 schema 包不能依赖 React、Next/Vinext、DOM 或 Cloudflare API，使其能够在主线程、Web Worker 和测试环境复用。

## 7. 节点系统

### 7.1 MVP 可见节点

```text
Input → Compose? → Arrange → Colorway → Output
```

| 节点 | 输入 | 输出 | 是否可选 |
|---|---|---|---|
| Input | 资产引用 | Motif Set | 否 |
| Compose | Motif Set | Motif / Motif Set | 是 |
| Arrange | Motif Set + Bounds | Scene | 否 |
| Colorway | Scene + Palette | Scene | 是 |
| Output | Scene | Artboard / Pattern | 否 |

Normalize 是 Input 内部步骤，不作为默认可见节点。

### 7.2 类型化端口

```ts
type PortDataType =
  | 'motif'
  | 'motif-set'
  | 'instances'
  | 'scene'
  | 'palette'
  | 'artboard'
  | 'pattern'
```

连接创建时进行类型校验。节点 UI 可以通过颜色和形状表示类型，但运行时必须依赖 `PortDataType`，不能依赖视觉样式。

### 7.3 节点定义接口

```ts
type NodeDefinition<I, P, O> = {
  type: string
  version: number
  inputSchema: unknown
  parameterSchema: unknown
  outputSchema: unknown
  evaluate(input: I, params: P, context: EvalContext): O | Promise<O>
}
```

后续 Compound Node、Field、Assign 等能力可以继续使用同一接口。

### 7.4 Graph Evaluator

Evaluator 负责：

1. 校验必需输入和端口类型。
2. 检测环路；MVP 图必须是 DAG。
3. 对节点进行拓扑排序。
4. 根据输入 Hash、参数 Hash 和节点版本生成缓存键。
5. 只重算受影响的下游节点。
6. 将错误和警告返回 UI，不让单个节点错误导致项目崩溃。

```ts
type EvalContext = {
  projectId: ID
  seed: number
  domain: {
    width: number
    height: number
    boundary: 'finite' | 'toroidal'
  }
  signal: AbortSignal
  cache: NodeCache
}
```

参数拖动期间只提交最新任务。每个 Worker 任务包含递增 `jobId`；UI 丢弃过期结果。长计算必须支持分块检查取消标记，无法协作取消时终止并重建专用 Worker，不能只依赖无法中断同步循环的 `AbortSignal`。

`domain` 是项目级计算上下文：Artboard 使用 `finite`，Repeat 使用 `toroidal`。Output Mode 改变时必须使 Arrange 及其下游缓存失效，不能把 Wrap 仅当作最后一步视觉复制。

## 8. SVG 导入与 Normalize

### 8.1 支持元素

MVP 允许：

- `svg`
- `g`
- `path`
- `rect`
- `circle`
- `ellipse`
- `line`
- `polyline`
- `polygon`
- 仅引用当前文档内部 ID 的 `use`，Normalize 时展开并限制递归深度
- `defs` 中的基础渐变
- `fill`、`stroke`、`opacity` 和基础 transform
- 可被安全内联的简单 class 样式：仅限 fill、stroke、stroke-width、opacity

### 8.2 禁止或移除

- `script`
- `foreignObject`
- `doctype`、实体声明和处理指令
- HTML 事件属性
- 外部 URL、外链图片和外链字体
- 动画元素
- `filter`、`style` 原始块和无法安全内联的 CSS
- `mask`、复杂 `clipPath` 与嵌套 `pattern`
- 可执行或网络相关引用

### 8.3 Normalize 流程

```text
解析 XML
→ 文件大小、节点数和嵌套深度预检
→ DOMPurify SVG 清洗
→ Motif 标签、属性、CSS、URL 和引用白名单二次校验
→ 验证 viewBox
→ 展开受支持的内部 use 与简单样式
→ 展平可处理的嵌套 transform
→ 计算可视边界
→ 统一局部坐标与原点
→ 提取颜色槽位
→ 生成缩略图与 checksum
→ 保存 MotifAsset
```

Normalize 必须保留原文件，不进行不可逆覆盖。

颜色槽位 MVP 只覆盖可明确识别的 solid fill 和 solid stroke。渐变、Pattern Paint 和复杂 Paint Server 默认保留原样并标记为不可映射，不能为了支持 Colorway 而破坏视觉结果。

### 8.4 错误策略

| 情况 | 处理 |
|---|---|
| 不存在 viewBox | 根据可视边界生成 |
| 仅有 width/height | 转换为 viewBox |
| 外链资源 | 移除并提示 |
| Filter / Mask / 复杂 ClipPath | 默认拒绝该效果并提供降级预览，用户确认后才接受 |
| 无可见路径 | 拒绝导入 |
| 极端复杂路径 | 超过硬上限拒绝；接近软上限显示性能警告 |

不得把“被清洗掉了什么”作为安全判断依据。只有通过完整白名单、引用解析、复杂度限制并生成规范化结果的素材才能进入项目。

### 8.5 内置素材构建管线

```text
原始候选
→ 许可证和来源人工审核
→ Normalize CLI / Build Script
→ 统一 viewBox、中心点、颜色槽位和 bounds
→ 安全与复杂度测试
→ SVG 视觉 golden snapshot
→ 生成带 checksum 的只读 catalog
```

Catalog 只包含审核通过的 `normalizedSvg` 和元数据。品牌 Logo、知名角色、来源不明或没有明确许可证的素材不得进入构建产物。第三方许可证清单随应用发布。

## 9. Compose Engine

Compose 支持：

- 添加、删除和复制子素材。
- 移动、旋转、缩放与镜像。
- 调整图层顺序。
- 锁定和隐藏子素材。
- 对齐、分布和基础吸附。
- 设置组合原点和组合边界。
- 保存为可复用 Composition。
- `compositionOnly`：只输出组合后的 Motif。
- `appendToSet`：输出组合后的 Motif，并透传未参与组合的输入 Motif。

不支持路径布尔运算、锚点编辑和自由绘制。

Compose 的输出仍为结构化引用；预览和导出时才展开为 SVG `<g>`。

`appendToSet` 是产品默认值。Compose 必须按输入 ID 明确记录哪些 Motif 被消费、哪些被透传，不能依赖数组位置隐式判断。

## 10. Arrange Engine

### 10.1 统一输入输出

```ts
type ArrangeInput = {
  motifs: Array<{
    ref: ID
    weight: number
    enabled: boolean
    baseScale: number
  }>
  bounds: {
    width: number
    height: number
    boundary: 'finite' | 'toroidal'
  }
}

type ArrangeOutput = SceneInstance[]
```

### 10.2 Scatter 模式

MVP 参数：

```ts
type ScatterParams = {
  seed: number
  targetCount: number
  minDistance: number
  scaleRange: [number, number]
  rotationRange: [number, number]
  positionJitter: number
  reduceOverlap: boolean
}
```

实现策略：

1. 使用固定 Seed 的 PRNG。
2. 使用整数 `targetCount` 作为目标实例数；UI 可以显示 Density，但必须同时显示目标数量。
3. 使用候选点采样生成位置。
4. 根据权重选择 Motif。
5. 生成 scale、rotation 和 jitter。
6. 使用空间哈希进行邻域碰撞查询；仅当 `boundary = toroidal` 时，边界附近实例同时查询对侧虚拟邻居。
7. 达到最大尝试次数后停止并返回未满足密度警告。

MVP 碰撞先使用圆形或 AABB 近似，不做精确路径碰撞。因此产品文案使用 `Reduce Overlap`，不能承诺完全避免重叠。

实例数不能由一个未定义的 0–100 Density 隐式推导，否则更改画板尺寸或 Motif 会产生不可解释的结果。未来可以增加“按面积保持密度”，MVP 先保存明确的 `targetCount` 和实际成功放置数量。

### 10.3 Array 模式

```ts
type ArrayParams = {
  mode: 'grid' | 'offsetRows' | 'offsetColumns'
  rows: number
  columns: number
  spacingX: number
  spacingY: number
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
  assignment: 'sequence' | 'alternate' | 'weighted'
}
```

Array 负责在当前 Scene Bounds 中生成位置并分配素材。`offsetRows` 和 `offsetColumns` 只描述画板或 Tile 内部的阵列错位；Square、Brick、Half Drop 等最终重复结构由 Output 定义。未来可以将 Position 和 Assign 拆成独立节点，但 MVP 不暴露这一层。

### 10.4 确定性

以下值共同决定计算结果：

```text
Node version
+ Asset checksum
+ Parameters
+ Seed
+ Scene bounds
+ Output mode；Repeat 模式下包含 Tile size 和 repeat structure
```

不得使用未注入的 `Math.random()`。

MVP 固定使用一个明确版本的 32-bit PRNG，并将 `algorithmVersion` 写入 Arrange 节点数据。所有随机调用必须按稳定顺序消费；坐标、角度和缩放在进入输出前按约定精度舍入。算法升级时增加版本，不静默改变旧项目结果。

Normalize 得到的 geometry、visual 与 collision Bounds 写入项目文件。后续布局不得在每次打开项目时重新依赖浏览器 `getBBox()` 计算，否则不同浏览器可能产生细微布局漂移。

## 11. 边缘环绕与无缝平铺

本模块只在 Output Mode 为 `repeat` 时启用。Artboard 模式使用有限坐标空间，不创建显示副本，也不执行环面碰撞。

Tile 坐标采用 `[0, width) × [0, height)`。

原实例跨越边界时生成显示副本：

```text
左越界  → x + width
右越界  → x - width
上越界  → y + height
下越界  → y - height
角落越界 → 同时修正 x 与 y
```

环绕副本必须：

- 引用相同 Motif。
- 保持相同 transform、颜色与层级。
- 通过 `wrappedFrom` 指向原实例。
- 不作为新的可编辑逻辑实例保存。

Brick 与 Half Drop 需要在行/列重复时增加相应半周期偏移。

### 11.1 环面碰撞

Reduce Overlap 和 Min Distance 必须在环面空间中判断。靠近左边界的实例要与右边界实例互为邻居，上下边界和四角同理。只在中心 Tile 内检查碰撞会得到“中心看似正常、重复后发生重叠”的错误结果。

实现可通过查询点的 8 个周期偏移完成，无需真的复制参与计算的实例：

```text
(0, 0)
(±width, 0)
(0, ±height)
(±width, ±height)
```

## 12. Colorway Engine

Colorway 不直接搜索任意颜色字符串，而是在 Normalize 阶段生成稳定的 `colorSlot`。

```ts
type Palette = {
  id: ID
  colors: string[]
}

type ColorwayParams = {
  paletteId: ID
  mapping: Record<string, number>
  preserveStroke: boolean
}
```

MVP 支持手动槽位映射和一键顺序映射，不做智能色彩相似度优化。

## 13. SVG 预览与导出

### 13.1 实时预览

- 每个 Motif 写入 `<defs><symbol>`。
- 每个实例通过 `<use>` 引用 symbol。
- 单 Tile 只保留逻辑实例和必要的环绕副本。
- Repeat Preview 使用 `<pattern>` 或受控的 Tile 克隆。
- 调参时只更新受影响的实例属性，避免重新解析素材路径。

### 13.2 Compact SVG

保留：

- `<defs>`
- `<symbol>`
- `<use>`
- 必要 transform

优点是文件小、结构清晰。

### 13.3 Flattened SVG

- 展开 `<use>`、`symbol` 和最终 `<pattern>` 引用。
- 保留或合并安全的 `<g transform>`；MVP 不承诺把所有 transform 烘焙进 path `d`。
- 输出独立图形组。
- 删除运行时缓存和私有编辑器状态；许可证或来源 metadata 可以保留。

优点是兼容更多生产软件。Flattened 导出应作为 MVP 默认推荐选项。

这里的 Flattened 准确定义是“展开复用与 Pattern 引用”，不是“把所有元素转换成单一 Path”。这样可以避免非等比缩放下的 Arc、Stroke 和 Gradient 被错误改写。

### 13.4 导出验收

导出 SVG 必须：

1. 包含明确 `viewBox`、width 和 height。
2. 不包含脚本、外链资源或编辑器私有 URL。
3. 重新导入 Loeme Motif 后视觉一致。
4. 在浏览器中独立打开时视觉一致。
5. Repeat 模式下四边和四角不存在结构性缺失、裁切或错位。
6. 在约定的浏览器与至少两个目标矢量软件中重新打开，尺寸、层级顺序和主要视觉一致。

## 14. 状态、历史与持久化

### 14.1 状态分层

| 状态 | 示例 | 是否写入项目 |
|---|---|---|
| Project State | 素材、节点、参数、Tile | 是 |
| UI State | 当前面板、悬停、弹窗 | 否 |
| Selection State | 当前节点、当前元素 | 可选 |
| Derived State | 计算结果、缩略图、缓存 | 否，可重建 |

### 14.2 Undo/Redo

进入历史记录的动作：

- 添加、删除和连接节点。
- 修改节点参数。
- Compose 子元素变换。
- 素材添加和删除。
- Tile 设置修改。

连续滑杆输入在指针释放时合并为一条历史记录。

### 14.3 本地保存

- IndexedDB 自动保存当前项目。
- 用户可以导出 `.loeme.json` 项目文件。
- SVG 资产以内嵌字符串保存，避免本地文件引用失效。
- Derived cache 可以删除并重新生成。
- IndexedDB 只在 hydration 后打开；数据库升级使用显式 schema migration，并保留升级失败时的项目 JSON 导出路径。
- Undo/Redo 使用命令或 Immer patches，不保存完整项目快照；大型 SVG 字符串和缩略图不得在每一步历史中复制。

## 15. 性能策略

MVP 性能目标：

- 常规项目包含不超过 12 个 Motif。
- 单 Tile 建议实例数不超过 500。
- Artboard 建议实例数不超过 1,000；Repeat 4×4 Preview 使用虚拟复用，不生成 16 份项目数据。
- 参数修改后的目标预览反馈小于 100 ms；复杂计算允许显示短暂 calculating 状态。
- 节点 UI 更新不得导致全部 SVG 路径重新渲染。
- Flattened 导出设路径节点数与预计文件大小软上限；超过硬上限时拒绝并给出 Compact 或降密度建议。

实现策略：

- Motif 使用 `<symbol>/<use>` 复用。
- 节点结果按输入和参数 Hash 缓存。
- Scatter 使用空间哈希降低碰撞查询成本。
- 拖动滑杆时使用 requestAnimationFrame 合并更新。
- 大于阈值的 Arrange 计算进入 Web Worker。
- 缩略图与主预览分开缓存。

## 16. 安全要求

- SVG 导入必须经过白名单清理。
- 使用 DOMPurify 后仍执行 Motif 专用 allowlist；不得使用默认 SVG Profile 直接作为最终信任依据。
- 不执行用户 SVG 中的脚本、事件、动画和外链请求。
- 不允许 `foreignObject`。
- 禁止 `doctype`、实体、外部 CSS、危险 URL scheme、递归 `use` 和超限引用深度。
- 导出前再次执行安全校验。
- 项目 JSON 通过 schema 校验后再载入。
- 所有 ID 在导入时重新命名，避免 defs 和 DOM ID 冲突。
- 原始 `sourceSvg` 仅作为文本保存，永不写入 `innerHTML`；所有可见预览只使用规范化结果。
- 配置严格 CSP，至少限制脚本来源并阻止 SVG 触发任意网络加载。

## 17. 测试策略

### 17.1 单元测试

- Seed 的确定性。
- Artboard 与 Repeat 的 boundary mode 切换和缓存失效。
- 旧 `algorithmVersion` 在升级后仍保持相同结果。
- Scatter 数量和最小距离。
- `targetCount`、实际放置数量和 px/mm 可撤销换算。
- Grid、Offset Rows、Offset Columns 坐标。
- geometry、visual、collision Bounds 的固化与 migration。
- 四边与四角 Wrap。
- 环面空间中的跨边界碰撞和最小距离。
- 颜色槽位映射。
- Compose 的 `compositionOnly` 与 `appendToSet`。
- Arrange Variant 的保存、恢复和删除。
- Graph 拓扑排序、环路和端口类型校验。
- Project schema migration。
- 内置 Motif catalog 的 checksum、许可证字段和视觉快照。
- 恶意 SVG：脚本、事件、外链、data URL、DOCTYPE、递归 use、超深嵌套和超大路径。

### 17.2 黄金样例

建立固定素材和参数的 SVG golden fixtures：

- 单 Motif Square。
- 内置 Motif Artboard。
- 多 Motif Scatter。
- Brick。
- Half Drop。
- 四角越界。
- Compose 后再 Arrange。
- Compact 与 Flattened 导出。
- Artboard Flattened 导出不得意外包含 Wrap 副本。

### 17.3 端到端测试

```text
进入 /apps/motif
→ 从内置库选择 3 个 Motif
→ 组合两个 Motif
→ 选择 Scatter
→ 修改 Seed
→ 导出 Artboard SVG
→ 切换 Repeat Preview
→ 导出 Repeat SVG
→ 重新导入验证
```

## 18. 主要技术风险

| 风险 | 影响 | MVP 对策 |
|---|---|---|
| SVG 来源差异大 | 导入失败或视觉变化 | 明确白名单、保留原文件、展示警告 |
| 原始 SVG 被误插入 DOM | XSS 或外链请求 | 原始文本与规范化资产分离，DOMPurify + 业务白名单 + CSP |
| 精确路径碰撞昂贵 | Scatter 卡顿 | 圆形/AABB 近似 + 空间哈希 |
| 中心 Tile 碰撞正确但重复后重叠 | 结果不是真正无缝 | 使用环面邻域进行碰撞判断 |
| 大量复杂路径 | 预览卡顿 | symbol/use、实例上限、Worker |
| Flatten transform 兼容性 | 导出错位 | 建立 golden fixtures 和回导测试 |
| 浏览器 Bounds 计算差异 | 同一项目跨浏览器布局漂移 | 导入时固化 Normalize Bounds，不在运行时重复测量 |
| 算法升级改变旧 Seed 结果 | 用户保存的方案失效 | 节点保存 `algorithmVersion` 并提供迁移策略 |
| 节点系统过度复杂 | 开发范围失控 | MVP 只注册 5 种可见节点 |
| Repeat 阻塞整个产品 | 基础构图无法发布 | Artboard 与 Repeat 使用独立 Output Mode 和发布 Gate |
| 现有应用壳或 Vinext 演进 | 编辑器被框架升级牵连 | Engine/schema 独立纯 TS；工作台只通过客户端适配层接入 |
| 开源代码或素材许可不清 | 法律风险 | 代码使用明确许可依赖；素材仅用自有、CC0 或批准的宽松许可并保存来源清单 |

## 19. 实施顺序

### Phase 0A：Vector Core Spike

```text
内置或导入 SVG
→ Normalize
→ Seed Scatter / Array
→ Artboard Preview
→ Flattened Artboard SVG
```

验收标准：20–30 个目标 SVG fixture 中，支持范围内 100% 无静默损坏；相同 Seed 结果一致，Artboard 导出可回导。

### Phase 0B：Repeat Gate

```text
Evaluated Scene
→ Toroidal Collision
→ Wrap
→ 4×4 Repeat Preview
→ Flattened Repeat SVG
```

验收标准：四边和四角结构正确，跨边界碰撞无漏判，导出在目标软件中可重新打开。未通过时，Artboard Core 仍可继续进入 Workspace。

### Phase 1：Workspace

- Motif Library。
- `/apps/motif` 路由、Starter Library、Canvas 与 Artboard Preview。
- Inspector。
- 固定 Recipe Strip。
- 本地保存与 Undo/Redo。

### Phase 2：Compose 与方案探索

- 组合编辑模式。
- 子素材变换与图层。
- 保存复合 Motif。
- 保存、预览和恢复 Arrange 参数候选；每个项目最多 6 个。

### Phase 3：有限节点编辑

- 验证用户确实需要 Network 后才安装和接入 XYFlow。
- Add Node。
- 类型化连接。
- 插入和移除 Compose/Colorway。
- 节点缓存与错误状态。

## 20. 技术决策结论

MVP 接入现有 Loeme React + TypeScript 应用壳，以纯 TypeScript 实现确定性的 Vector/Pattern Engine。P0 使用固定 Recipe Strip；只有 Network 需求通过验证后，P1 才以 XYFlow 处理节点交互。SVG.js 不是引擎依赖，最多作为主线程 SVG 交互辅助。

不以 SVG-Edit、Tessera 或 Pattern Monster 作为应用骨架；它们分别作为交互、算法和导出参考。项目主数据使用版本化结构化 JSON，SVG 是输入、规范化资产、预览和输出格式。Artboard 是基础交付路径，Repeat 是可独立验证和发布的专业模块。
