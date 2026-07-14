# Loeme Motif MVP 需求与架构审计

> 状态：Review v0.2  
> 日期：2026-07-14  
> 审计对象：[MVP PRD](./mvp-prd.md) · [技术架构](./technical-architecture.md)

## 1. 审计结论

整体方向合理，可以进入分阶段 Engine Spike 和可用性原型阶段。第二轮审计确认产品不应被 Repeat 单点阻断：有限画板构图是一条可独立交付的基础路径，Repeat 是重要但可单独验收的专业模块。

最有价值的产品主张已经清楚：

```text
少量矢量素材
→ 参数化组合与编排
→ 可复现探索
→ Artboard 或 Repeat 输出
→ 可信 SVG 导出
```

技术上使用浏览器端 TypeScript、自有 Pattern Engine、SVG 渲染和轻量节点 UI 是正确路线，不需要 GPU 后端，也不应基于完整 SVG 编辑器魔改。

当前方案的主要风险不是技术栈，而是范围逐步膨胀，以及“看起来无缝”与“真正可交付”之间的差距。

## 2. 合理性评分

| 维度 | 评分 | 判断 |
|---|---:|---|
| 用户问题清晰度 | 8/10 | 参数化组合、探索、可选 Repeat 和 SVG 交付是明确痛点 |
| MVP 克制度 | 8/10 | Artboard 与 Repeat 分门后，技术风险不再绑死整个产品 |
| 节点模型 | 8/10 | Input / Compose / Arrange / Colorway / Output 足够表达 MVP |
| 工作流完整性 | 9/10 | 内置素材解决冷启动，Artboard 提供独立交付路径 |
| 技术可行性 | 8/10 | 浏览器端可以完成；SVG Normalize 和 Flatten Export 是难点 |
| 可扩展性 | 9/10 | Motif → Set → Instances → Pattern 可以继续扩展 Field/Assign |
| 生产可信度 | 6/10 | 需要通过真实软件回导、跨边界碰撞和 SVG 兼容测试证明 |

## 3. 产品范围审计

### 3.1 P0 Core 是真正的验证版本

P0 应只验证：

```text
Input
→ Scatter / Grid
→ Colorway
→ Artboard
→ Flattened Artboard SVG
```

P0 Core 不应该被以下能力阻塞：

- Compose。
- Square / Brick / Half Drop Repeat。
- Brick / Half Drop。
- Compact SVG。
- 可自由编辑的 Network。
- 三种完整工作模式。
- 项目 JSON 迁移体验。

如果 P0 Core 无法让目标用户完成有效构图，增加 Repeat 或更多节点不会解决核心问题。

### 3.2 Repeat 是独立技术门

Repeat Gate 同时验证：Square Wrap、四边与四角、环面碰撞、Repeat Preview、Seam Check 和 Repeat Flattened Export。它们必须作为整体达到 Stable，不能只凭画布看起来连续就宣称生产可用。

Repeat Gate 未通过时，产品仍可作为参数化矢量构图工具继续验证；但界面不能把 Repeat 标记为稳定生产能力。

### 3.3 P1 才是完整 MVP

P1 增加：

- Compose。
- Offset Rows / Columns。
- Brick / Half Drop。
- Saved Variants。
- 有限 Network 编辑。
- Compact SVG 与项目文件。

这一层用于验证产品差异化与长期工作流，而不是验证基础渲染能力。

### 3.4 不应提前进入的能力

以下需求即使“很适合节点”，也不应提前：

- Field / Density Map。
- Assign 独立节点。
- Along Path。
- Mask / Blend / Boolean。
- 逐实例 Bake 编辑。
- AI Motif。
- 自定义 Node。

它们会同时扩大引擎、UI、文档、历史记录和导出测试面。

## 4. 用户流程审计

### 4.1 已经完整的流程

- 多素材导入和权重配置。
- Scatter / Array 切换。
- Colorway 配色。
- Tile / Repeat 预览。
- SVG 导出回导。

### 4.2 原方案存在的断点

#### Compose 会丢失未组合素材

如果 Compose 将整个 Motif Set 替换成一个组合 Motif，用户无法同时使用“花束”和原来的独立果实。

修正：增加 `Composition Only` 与 `Append to Set`，默认 `Append to Set`。

#### 随机探索没有保存候选

只有 Shuffle Seed 会让用户担心丢失满意结果，导致探索行为变得保守。

修正：保存完整 Arrange 参数快照，最多保留 6 个候选。只保存 Seed 不足以恢复方案。

#### Avoid Overlap 承诺过强

MVP 使用圆形或 AABB 近似碰撞，不可能保证复杂图形完全不重叠。

修正：产品文案改为 `Reduce Overlap`，并说明属于近似控制。

#### Seam Check 定义不清

“检查接缝”容易被理解为系统能够自动判断视觉质量。

修正：系统负责边界副本完整性、越界裁切和结构错误；最终视觉节奏由用户判断。

### 4.3 第二轮补齐的流程缺口

#### 新用户必须先准备 SVG

这会把产品价值验证错误地变成素材准备能力验证。

修正：首批内置 24 个经过审核和预先 Normalize 的 Starter Motif，加 4 个示例，让用户无需上传即可完成第一次构图和导出。素材数量不是 MVP 指标。

#### Output 默认等同 Repeat

这会让海报、包装正面、图标墙等有限构图场景无法成立，也让 Wrap 风险成为整个产品的阻断项。

修正：Output 明确分为 `Artboard` 与 `Repeat`。只有 Repeat 启用环面边界、Wrap、Seam Check 和多 Tile 导出。

#### 内置素材升级会改变旧项目

如果项目只保存 catalog ID，素材库更新或下架会导致旧项目失真。

修正：选择内置素材时，将审核后的 normalized SVG、checksum、版本和许可证元数据复制进项目。

## 5. 节点设计审计

### 5.1 节点数量合理

5 个节点已经接近 MVP 上限：

```text
Input → Compose? → Arrange → Colorway? → Output
```

Normalize 保持为 Input 内部步骤是正确决定。对目标用户而言，“格式规范化”是系统责任，不应要求用户理解。

### 5.2 Arrange 当前职责较重，但 MVP 可接受

Arrange 同时承担：

- 位置生成。
- 素材分配。
- 随机变化。
- 近似碰撞。

长期应该拆成 Points / Assign / Jitter / Constraint，但 MVP 拆分会让节点图难以理解。当前应保持 Compound 形态，只在底层接口中保留拆分可能。

### 5.3 Network 的价值需要验证

第一版图结构几乎固定，用户不一定需要全功能节点画布。

建议验证两种界面：

1. Canvas 下方的固定 Recipe Strip。
2. 可拖拽、可连线的完整 Network。

如果设计师只使用固定 Strip，P0 可以推迟自由连线，减少大量交互和状态复杂度。

## 6. 技术架构审计

### 6.1 架构选择合理

- React/TypeScript 适合浏览器工作台。
- XYFlow 只负责节点交互，计算由自有引擎完成。
- SVG.js 只作操作辅助，不作为项目数据源。
- 项目使用版本化 JSON。
- Pattern Engine 使用纯函数和确定性 Seed。
- Preview 使用 `<symbol>/<use>`，Export 支持 Flatten。

这些边界清晰且便于测试，但第二轮审计对实现方式做了四项修正：

1. Motif 接入现有 Loeme React/Next-compatible/Vinext 应用壳，不创建独立 Vite 应用。
2. P0 使用固定 Recipe Strip，XYFlow 延后到 Network 价值被用户验证以后。
3. Pattern Engine 必须是无 DOM、无 React 的纯 TypeScript；SVG.js 不能进入 Worker 或项目模型。
4. IndexedDB 使用带 schema migration 的封装层；工作台在 hydration 后加载本地项目。

### 6.2 最高风险：SVG Normalize

“只支持 SVG”并不等于输入简单。不同软件可能产生：

- 缺失或异常 ViewBox。
- 多层 Transform。
- ClipPath、Mask、Filter。
- CSS class 和 style block。
- Gradient、Pattern Paint。
- 外链图片和字体。
- 重复 ID。

建议先定义 20–30 个真实素材 fixture，再决定支持范围，不能先承诺“所有 SVG”。

### 6.3 最高风险：Flattened Export

Flattened SVG 需要确保：

- Transform 应用正确。
- Stroke 在非等比缩放下行为明确。
- Gradient 坐标保持正确。
- ID 不冲突。
- Group 层级与视觉顺序一致。
- 重新导入后视觉一致。

因此 Flattened Export 应在 Engine Spike 阶段验证，不应留到 UI 完成之后。

### 6.4 无缝碰撞必须使用环面空间

如果碰撞只检查中心 Tile，左右边缘各自合法的两个实例可能在 Repeat 后重叠。

Scatter 的 Min Distance 和 Reduce Overlap 必须把对侧实例视为邻居，同时覆盖四角情况。

### 6.5 Seed 需要版本化

Seed 本身不能保证长期复现。以下变化都会改变结果：

- PRNG 算法变化。
- 随机数消费顺序变化。
- Bounds 算法变化。
- 碰撞尝试顺序变化。

节点必须保存 `algorithmVersion`，Normalize 的几何、视觉和碰撞 Bounds 必须在导入时固化，旧项目不能静默切换算法。

### 6.6 SVG 安全不能只依赖一个 Sanitizer

DOMPurify 官方支持 SVG 清洗，但其默认策略不是 Loeme Motif 的完整格式规范。正确链路是：大小与复杂度预检、DOMPurify、Motif 标签/属性/URL 白名单、引用深度检查、规范化输出、导出前复检。

原始 `sourceSvg` 可以作为文本保留，但永远不能直接插入 DOM。项目预览和导出只能使用 `normalizedSvg`。

### 6.7 Flattened 的定义需要收窄

Flattened 应表示展开 `use`、`symbol` 和最终 `pattern` 引用，而不是强制把所有变换烘焙到 Path。后者会显著增加 Arc、Stroke、Gradient 和非等比缩放的实现风险。

保留安全的 `<g transform>` 仍然是独立、可编辑的生产 SVG，只要目标软件兼容测试通过。

### 6.8 Output Mode 是计算上下文

Artboard 使用有限边界，Repeat 使用环面边界。切换模式必须使 Arrange 缓存失效；否则用户可能看到相同位置，但跨边界碰撞仍按旧模式计算。

## 7. 需要验证的产品假设

| 假设 | 验证方法 | 失败信号 |
|---|---|---|
| 用户能从内置素材理解价值 | 无上传首次任务 | 用户仍不知道从哪里开始或素材风格掩盖布局价值 |
| 用户愿意只从 SVG 开始 | 访谈与导入任务 | 大部分用户只有 PNG/JPG 且无法获得 SVG |
| Scatter + Grid 足以产生首个价值 | 5 位设计师任务测试 | 用户必须依赖 Half Drop/Compose 才能完成基本图样 |
| Artboard 本身具有独立价值 | 海报/包装有限构图任务 | 用户只在需要无缝图样时认为工具有价值 |
| 节点能增加理解而非负担 | Recipe Strip 与 Network 对照测试 | 用户忽略 Network 或频繁误连 |
| 参数化比手工复制更高效 | 与 Illustrator 当前流程对比 | 首次操作耗时没有明显下降 |
| Flattened SVG 满足交付 | 在目标软件中打开测试 | 错位、丢色、渐变错误或文件过大 |
| 近似碰撞可以接受 | 复杂 Motif 测试 | 用户认为 Reduce Overlap 不可信 |

## 8. 建议的验证顺序

### Gate 1A：Vector Core 可行性

```text
内置素材 + 20 个真实 SVG
→ Normalize
→ Scatter/Grid
→ Artboard Preview
→ Flattened Artboard Export
→ 回导
```

通过标准：没有安全问题；声明支持的 fixture 100% 不发生静默损坏；固定 Seed 一致；Artboard 导出可在目标软件重新打开。

### Gate 1B：Repeat 可行性

```text
Evaluated Scene
→ Toroidal Collision
→ Square Wrap
→ 4×4 Preview
→ Seam Check
→ Flattened Repeat Export
```

通过标准：四边和四角结构正确，跨边界碰撞无漏判，Repeat 导出可重新打开。失败不阻止 Gate 2 验证 Artboard Core。

### Gate 2：核心任务可用性

提供固定 Recipe Strip，不开放自由连线。

通过标准：5 位目标用户中至少 4 位能从内置素材完成 Scatter、Artboard Preview 和 Export；另设 Repeat 任务观察专业用户是否理解 Tile 与接缝。

### Gate 3：差异化功能

加入 Compose、Saved Variants、Brick/Half Drop 和有限 Network。

通过标准：用户主动使用其中至少一项，并认为它比通用矢量软件节省时间。

## 9. 发布阻断条件

出现以下任一情况，不应进入公开 MVP：

- 导出的 SVG 无法在目标矢量软件稳定打开。
- 同一项目重新打开后 Seed 结果发生变化。
- SVG 导入能够触发外链请求或脚本执行。
- 复杂素材导致整个工作台长时间无响应且无法取消。
- 用户无法理解 Motif 与 Composition 的区别。
- 内置素材缺少可追溯来源或明确许可证。

以下情况不阻止 Artboard Core 发布，但必须阻止 Repeat 标记为 Stable：

- 边缘或四角 Wrap 存在结构性错误。
- 环面碰撞存在跨边界漏判。
- Repeat Flattened SVG 与预览不一致。

## 10. 最终判断

方案可以继续，但应将“节点编辑器”视为交互手段，而不是 MVP 成功标准。

真正的 MVP Core 成功标准只有三个：

1. 设计师能更快得到满意矢量构图。
2. 同一结果可以稳定复现。
3. 导出的 SVG 可以可信交付。

只要这三个目标成立，Repeat、Field、Assign、Along Path 和自定义 Node 都有自然的扩展空间；如果这三个目标不成立，继续增加节点只会放大复杂度。

第二轮最终结论：产品与技术框架在拆除 Repeat 单点依赖、接入现有 Loeme 应用壳、增加 Starter Library 治理后更加合理。当前可以推进 `Vector Core Spike` 和 `Repeat Gate`，但不应先实现自由节点连线。
