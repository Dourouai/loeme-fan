# Loeme Motif MVP 产品需求文档

> 状态：Draft v0.3  
> 日期：2026-07-14  
> 产品阶段：可用性与技术可行性验证

配套文档：[Loeme Motif MVP 技术架构文档](./technical-architecture.md)

审计记录：[Loeme Motif MVP 需求与架构审计](./mvp-audit.md)

## 1. 产品概述

Loeme Motif 是一款面向图形、品牌、纺织和表面设计师的浏览器端参数化矢量图形工作台，产品入口固定为 `/apps/motif`。

用户可以使用内置 Motif 或导入一个或多个矢量图形，通过有限、可理解的节点完成素材组合、阵列或自然分布、配色，并输出有限画板构图或无缝重复图样。

MVP 不追求成为完整矢量编辑器，而是验证以下核心价值：

> 用户是否愿意用“可视化参数 + 实时画布 + 简化节点图”的方式制作可控、可复现、可导出的矢量构图；Repeat 是专业输出能力，而不是产品成立的唯一前提。

## 2. 用户问题

现有工作流通常存在以下问题：

- 在通用矢量软件里制作无缝平铺需要手工复制、偏移和检查边缘。
- 随机散点布局难以保持间距、权重和视觉节奏。
- 调整密度、比例或随机结果后，需要重复大量手工工作。
- 多个图形组合成花束、徽章等新元素时，缺少可复用的结构。
- 最终效果与单 Tile 之间来回切换成本高。
- 位图转矢量质量不稳定，不适合作为可靠生产链路。

## 3. 目标用户

### 3.1 核心用户

- 纺织、服装、家居和包装图样设计师。
- 插画师与品牌设计师。
- 熟悉 Illustrator/Figma，但不一定熟悉节点工具的创作者。

### 3.2 用户特征

- 已经拥有或能够获得矢量 Motif。
- 希望快速探索多种布局和配色。
- 需要重复可复现、可修改，而不是一次性生成图片。
- 在乎 SVG 的可编辑性与生产兼容性。

## 4. MVP 产品目标

### 4.1 核心目标

1. 用户能在 3 分钟内从内置或导入素材得到第一个有效矢量构图。
2. 用户不需要理解复杂节点编程，也能完成主流程。
3. 同一 Seed 与参数始终产生相同结果。
4. 用户能把多个素材组合成一个可复用 Motif。
5. 导出的 SVG 可以独立打开并重新导入 Loeme Motif。

### 4.2 产品验证指标

| 指标 | MVP 目标 |
|---|---|
| 首次任务完成率 | 70% 以上测试用户无需指导完成选材或导入到导出 |
| Time to First Composition | 中位数不超过 3 分钟 |
| 导出成功率 | 95% 以上项目成功生成有效 SVG |
| Seed 可复现性 | 100% 相同输入得到相同布局 |
| 首次素材就绪率 | 100% 新项目无需上传文件即可开始 |
| 核心流程崩溃率 | 用户测试中无阻断级崩溃 |

以上指标用于产品测试，不代表公开商业 SLA。

## 5. MVP 边界

### 5.1 包含

- SVG 素材导入与自动 Normalize。
- 内置 Starter Library 与项目 Motif Library。
- 多素材启用、权重和默认比例设置。
- 素材视觉组合 Compose。
- Scatter 与 Array 编排。
- Colorway 配色映射。
- Artboard 有限画板输出。
- Square、Brick、Half Drop 重复结构。
- Artboard、Tile 和 Repeat 实时预览。
- Compact / Flattened SVG 导出。
- Canvas、Network、Preview 三种工作模式。
- 本地自动保存、Undo/Redo 和项目文件导入导出。
- 保存并恢复少量布局候选版本。

### 5.2 不包含

- 位图输入、抠图和位图转 SVG。
- AI Motif 生成。
- 路径锚点编辑和自由绘制。
- Boolean、Mask、Blend、Warp。
- Density Field、Along Path、精确形状碰撞。
- 任意代码节点、自定义插件和节点市场。
- 多人协作、评论和云端同步。
- 电商、素材售卖和下单流程。
- TIFF、PDF、AI 等额外生产格式。

## 6. 产品核心原则

1. **Canvas first**：最终构图始终是第一视觉焦点。
2. **Progressive disclosure**：默认只出现必要控制，高级结构通过 Network 展开。
3. **节点使用设计语言**：节点叫 Input、Compose、Arrange，而不是暴露底层文件格式术语。
4. **实时且可复现**：每次参数变化及时反馈，随机结果可以通过 Seed 复现。
5. **生产边界透明**：明确告诉用户导出内容、限制和潜在兼容性问题。

## 7. 信息架构

### 7.0 路由

```text
/apps/motif                 应用入口与最近项目
/apps/motif/new             新建项目
/apps/motif/projects/:id    项目工作台
/apps/motif/templates       示例与起始模板
```

URL 使用小写；界面品牌显示 `Loeme / Motif`。工作台是客户端应用边界，首屏可以由应用壳渲染，但项目恢复和编辑不依赖服务端状态。

```text
Workspace
├── Top Bar
│   ├── Project
│   ├── Canvas / Network / Preview
│   ├── Undo / Redo
│   ├── Live
│   └── Export
├── Starter / Project Motif Library
├── Main Canvas
├── Node Graph
├── Inspector
└── Add Node
```

### 7.1 工作模式

| 模式 | 目标 | 默认布局 |
|---|---|---|
| Canvas | 快速创作和调参 | 大画布、节点区收起、Inspector 展开 |
| Network | 查看和调整数据流程 | 节点画布最大化、结果预览缩小 |
| Preview | 检查有限构图或重复效果 | 输出预览最大化、编辑控件弱化；Repeat 时显示接缝工具 |

### 7.2 可伸缩面板

- Motif Library 可收为左侧窄轨。
- Inspector 可收为右侧窄轨。
- Node Graph 可收起、平衡显示或最大化。
- 面板变化后 Canvas 自动填充剩余空间。
- 用户的布局偏好保存在本地。

## 8. 默认工作流

新项目不展示空白节点画布，系统创建完整的五步 Recipe；Compose 默认 Bypass，不阻断快速出图：

```text
Input → Compose → Arrange → Colorway → Output
```

完整用户流程：

```text
创建项目
→ 选择内置 Motif 或导入 SVG
→ 可选：组合 Motif
→ 选择 Scatter 或 Array
→ 调整密度、间距、比例、旋转和 Seed
→ 调整 Colorway
→ 选择 Artboard 或 Repeat 输出
→ Repeat 模式下检查 Tile 与接缝
→ 导出 SVG
```

### 8.1 MVP 核心任务

MVP 必须优先保证以下六个任务完整，不以节点数量作为完成标准。

| 核心任务 | 用户需要完成的结果 | 对应能力 |
|---|---|---|
| 零素材开始 | 不上传文件也能立即体验完整流程 | Starter Library + Input |
| 快速混排 | 将 2–6 个 Motif 做成自然散点 | Input + Arrange/Scatter |
| 规则阵列 | 将 Motif 做成规整、错位阵列 | Input + Arrange/Array |
| 素材拼接 | 将花、叶、枝组合成一个新元素 | Compose |
| 方案探索 | 随机探索并保存满意候选 | Seed + Saved Variants |
| 可靠交付 | 导出有限画板；Repeat 模式下额外检查接缝 | Output |

### 8.2 典型用户场景

#### 场景 1：已有一组独立 Motif

用户导入花、叶和果实，希望通过权重控制主花与陪衬素材的出现比例，并快速得到自然散点结果。

#### 场景 2：需要先做一个花束

用户将一朵花与两片叶子组合为新 Motif，同时仍希望原来的独立叶片继续参与 Scatter。

#### 场景 3：寻找满意随机结果

用户连续 Shuffle Seed，对比多个候选，并保存 2–3 个满意版本后返回继续调整。

#### 场景 4：制作规则几何图样

用户通过 Grid、Offset Rows 或 Offset Columns 排列图形，并使用 Sequence 或 Alternate 控制素材顺序。

#### 场景 5：交付生产文件

用户在 4×4 Preview 中检查四边和四角，选择 Flattened SVG，导出后在其他矢量软件中打开。

#### 场景 6：素材存在兼容问题

用户导入包含 Filter、外链或异常 ViewBox 的 SVG。系统保留可用图形、说明发生了什么，并让用户决定是否继续。

#### 场景 7：没有自备素材

用户从 Botanical 或 Basics 中选择 3 个内置 Motif，在不上传文件的情况下完成 Scatter、换色和导出。

#### 场景 8：只需要有限构图

用户为海报或包装正面制作一个 1200 × 800 的矢量构图，选择 Artboard Output，不启用 Wrap、Seam Check 或 Repeat Grid。

## 9. 节点产品定义

MVP 注册 5 种可见节点。Normalize 是 Input 的内部步骤，不显示为默认节点。

### 9.1 Input

**用户场景**

用户从内置 Starter Library、项目素材库或本地文件选择一个或多个图形，作为构图生成的起点。

**功能**

- 拖拽或文件选择导入 SVG。
- 一次选择多个文件。
- 浏览并添加内置 Motif；添加后复制为项目资产，保证项目可移植。
- 显示素材缩略图、名称和导入状态。
- 对每个素材设置：
  - Enabled。
  - Weight。
  - Base Scale。
  - Allow Rotation。
  - Allow Mirror。
- 自动执行 Normalize。
- 输出 Motif Set。

**状态**

- Empty：引导上传。
- Processing：解析和规范化中。
- Ready：显示素材数量和预览。
- Warning：部分效果被移除或路径复杂。
- Error：没有有效图形或无法解析。

**辅助文案**

> 导入或选择图形，作为图样编排的起点。

### 9.2 Compose

**用户场景**

用户将花、叶、枝条等多个 Motif 拼成一个固定花束或复合图形，再把它作为整体参与布局。

**功能**

- 从 Input 选择两个或以上 Motif。
- 进入 Compose 编辑模式。
- 移动、缩放、旋转和镜像子素材。
- 复制、隐藏、锁定子素材。
- 调整图层顺序。
- 基础对齐、分布和吸附。
- 设置组合原点。
- 保存为项目中的新 Composition。
- Compose 必须输出一个明确的 Motif Set，并由 Arrange 原样消费；Inspector 显示“Output to Arrange”素材托盘。
- 支持三种集合变换：
  - Replace Selected（默认）：参与组合的素材被新 Composition 替换，未参与素材继续透传。
  - Keep Source Parts：Composition 与全部原素材共同输出。
  - Composition Only：只输出组合后的 Motif。
- 默认使用 Replace Selected，使 Compose 成为真实的中间处理节点，同时避免重复排列被组合的源素材。

**不支持**

- 路径合并、相减和交集。
- 锚点编辑。
- Mask 与 Blend Mode。

**辅助文案**

> 将多个图形拼接成一个可复用的组合元素。

### 9.3 Arrange

**用户场景**

用户希望将 Motif 以自然散点或规则阵列的方式布置在有限画板或 Repeat Tile 中。

**通用功能**

- 先通过带结果缩略图的视觉模式卡选择 Scatter / Array，再显示该模式的高频参数。
- 高频参数控制在 Density、Spacing / Columns、Size Variation、Rotation Variation。
- Seed 与精确 Scale Range 默认收进 Advanced，避免首次使用时形成参数墙。
- Seed。
- 素材分配：Sequence / Alternate / Weighted。
- 实时预览。
- Bypass。
- Shuffle Seed。
- Save Variant：保存当前 Arrange 模式、Seed 和全部参数。
- Variants：查看缩略图、恢复或删除已保存候选；MVP 每个项目最多保存 6 个。

#### Scatter 模式

| 参数 | 功能 |
|---|---|
| Density / Count | 控制目标实例数量，并显示实际放置数量 |
| Min Distance | 控制最小间距 |
| Scale Range | 控制实例大小范围 |
| Rotation Range | 控制旋转范围 |
| Position Jitter | 控制位置扰动 |
| Reduce Overlap | 使用近似碰撞减少重叠，但不承诺完全无重叠 |
| Seed | 固定随机结果 |

#### Array 模式

| 参数 | 功能 |
|---|---|
| Layout | Grid / Offset Rows / Offset Columns |
| Rows / Columns | 控制阵列数量 |
| Spacing X/Y | 控制水平和垂直间距 |
| Offset X/Y | 控制错位程度 |
| Scale | 控制统一比例 |
| Rotation | 控制统一旋转 |
| Assignment | Sequence / Alternate / Weighted |

**辅助文案**

> 使用自然散点或规则阵列生成可复现的图形布局。

### 9.4 Colorway

**用户场景**

用户希望保留图样结构，快速尝试不同配色或匹配品牌色板。

**功能**

- 从带真实 Motif 缩略图的 Colorway 卡片中选择 Palette。
- 自动展示 Normalize 提取的颜色槽位。
- 手动将原色槽位映射到目标颜色。
- 一键按顺序映射。
- 保留或替换 Stroke。
- Bypass。
- 保存 Colorway Preset。
- 对不支持重新映射的渐变或复杂 Paint 保留原样，并显示提示。

**不支持**

- AI 自动配色。
- Pantone 和专色生产管理。
- 高级色差与印刷模拟。

**辅助文案**

> 将图形颜色映射到受控色板，生成不同配色版本。

### 9.5 Output

**用户场景**

用户确定输出尺寸并导出可继续使用的 SVG；需要无缝图样时再开启 Repeat。

**功能**

- 通过用途卡片选择 Artboard / Repeat，而不是抽象开关。
- 提供 Square / Landscape / Portrait 快速尺寸和精确 Width / Height。
- 设置 Artboard 或 Tile Width / Height。
- 单位：px / mm。
- Artboard 模式：有限画板预览、背景和导出，不生成环绕副本。
- Repeat 模式的 Repeat Structure：
  - Square。
  - Brick。
  - Half Drop。
- Repeat 模式提供 Tile Preview、2×2、4×4、自适应 Repeat Preview 和 Seam Check。
- Background Color。
- 导出 Compact SVG。
- 导出 Flattened SVG。
- 将 SVG 重新导入检查。

**Seam Check 定义**

- 高亮所有跨越 Tile 边界的逻辑实例。
- 显示对应边与四角的同步副本。
- 提供 Boundary Overlay 和 Seam Highlight。
- 对缺失副本、越界裁切和无效 Tile 尺寸显示错误。
- 不承诺自动判断所有视觉接缝问题，最终审美判断仍由用户完成。

**辅助文案**

> 导出有限构图，或检查平铺边缘并导出无缝图样。

## 10. Normalize 内部能力

Normalize 不作为默认节点，但用户可以在 Input 中查看处理结果。

系统自动：

- 清理不安全元素和外部引用。
- 生成或修复 viewBox。
- 统一局部坐标和原点。
- 处理基础嵌套 Transform。
- 计算并固化几何、视觉和碰撞 Bounds。
- 提取 Fill / Stroke 颜色槽位。
- 生成缩略图。

用户看到的反馈示例：

> 已规范化 3 个图形，其中 1 个不受支持的滤镜已移除。

## 11. Motif Library

### 11.1 列表能力

- 网格缩略图。
- 选择和多选。
- 搜索名称。
- 重命名。
- 删除。
- 查看来源和处理警告。
- 标记 Composition。

### 11.2 添加素材

- 从 Starter Library 添加。
- 点击 Add Motif。
- 拖入工作台。
- 拖入 Input 节点。
- 导入项目文件时自动恢复。

### 11.3 素材与节点关系

- Library 是项目资产集合。
- Input 保存资产引用，不复制素材内容。
- 删除正在使用的素材时必须二次确认并显示受影响节点。

### 11.4 内置 Starter Library

MVP 首批内置 24 个经过人工审核和预先 Normalize 的 Motif，分为 Basics、Botanical、Organic 和 Symbols；另外提供 4 个示例 Composition/Template。达到首次任务覆盖后不继续以数量扩张。

- 优先使用 Loeme 原创、CC0、MIT、ISC 或 Apache-2.0 素材。
- 不接受许可证缺失、来源不明、品牌 Logo、知名角色或限制商业用途的素材。
- 每个素材记录来源、作者、许可证、源 URL、修改状态、版本和 checksum。
- 素材在构建时完成安全清理、视觉快照和复杂度检查，运行时不重新信任源文件。
- 用户把内置素材加入项目时，项目内嵌经过规范化的版本；后续素材库升级不得改变旧项目。
- 应用提供 Third-party Licenses 页面；需要时在 SVG `<metadata>` 或项目清单中保留来源信息。

## 12. Canvas 交互

### 12.1 通用操作

- Pan。
- Zoom。
- Fit View。
- Tile / Repeat 切换。
- 显示 Tile Boundary。
- 显示中心 Tile。
- 切换背景色。

### 12.2 Compose 编辑模式

- 单击选中子素材。
- 拖动移动。
- 角点缩放。
- 旋转手柄旋转。
- Shift 保持比例或角度步进。
- 方向键微调位置。
- Escape 退出当前选择。

### 12.3 Arrange 预览

- 实例默认不可逐个编辑。
- 选中 Arrange 后显示布局边界和密度信息。
- Shuffle Seed 只修改 Seed，不修改其他参数。
- MVP 不提供 Bake 后逐实例编辑。

## 13. Network 交互

### 13.1 默认能力

- 点击节点后 Inspector 与 Canvas 同步。
- 拖动节点位置。
- 缩放、平移和 Fit Graph。
- 显示类型化端口和连接。
- 显示节点状态：Ready / Calculating / Warning / Error / Bypassed。
- 展开或收起节点卡片。

### 13.2 有限编辑

- Required 节点：Input、Arrange、Output，不允许删除。
- Optional 节点：Compose、Colorway，可以插入、旁路或移除。
- 连接必须符合端口类型。
- MVP 不允许创建环路。
- Add Node 面板只展示 Compose 和 Colorway，以及已有节点的说明。

### 13.3 节点卡片

默认卡片显示：

- 节点名称和状态。
- 一个小型实时预览。
- 输入和输出端口。
- 最多 3 个关键参数摘要。

完整参数只出现在 Inspector。

## 14. Inspector

- Inspector 内容跟随当前选中节点。
- 节点条只负责切换工作阶段；Canvas 展示结果，Inspector 承担当前任务。
- 每个节点统一按“任务说明 → 主要视觉决策 → 3–4 个高频控制 → Advanced”组织。
- Arrange、Colorway、Output 的首个选择必须使用可预判结果的视觉卡片，不能只使用文本 Tab。
- 参数按 2–4 个分组展示；低频精确参数默认折叠。
- 每组提供 Reset。
- 数值参数同时提供输入框和 Slider。
- 参数修改实时更新 Canvas。
- 除 Output 外，Inspector 底部主按钮进入下一节点；Output 才显示最终导出动作。
- 计算中显示轻量状态，不锁死其他面板。
- 错误信息必须说明原因和恢复方式。

## 15. Preview

Preview 模式用于判断整体节奏，不提供复杂编辑。Artboard 模式只显示有限画板；Repeat 模式才显示多 Tile 和接缝工具。

支持：

- 单 Tile。
- 2×2。
- 4×4。
- Fit Screen。
- Tile Boundary。
- Seam Highlight。
- Square / Brick / Half Drop 切换。
- 背景色调整。

MVP 不包含服装、墙面、包装等 3D Mockup。

## 16. 导出

### 16.1 导出面板

| 设置 | 选项 |
|---|---|
| Format | SVG |
| Structure | Compact / Flattened |
| Area | Artboard / Single Tile / Repeat Grid |
| Repeat Grid | 2×2 / 4×4 |
| Unit | px / mm |
| Background | Transparent / Solid |

### 16.2 导出前检查

- 是否存在节点错误。
- 是否存在外链资源。
- 是否存在空素材。
- Tile 尺寸是否有效。
- Repeat 模式下是否存在结构性边缘断裂。
- Flattened 文件大小预估。

### 16.3 成功状态

导出完成后显示：

- 文件名称。
- Tile 尺寸。
- Output Mode；Repeat 模式下显示 Repeat Structure。
- 实例数量。
- Compact / Flattened 状态。

## 17. 项目管理

### 17.1 新建项目

- 项目名称。
- 默认 Tile 比例：Square。
- 默认 Recipe。
- 创建后直接进入 Canvas。

### 17.2 自动保存

- 重要操作完成后本地自动保存。
- 顶部显示 Saved / Saving / Error。
- 页面刷新后恢复最近项目。

### 17.3 项目文件

- 导出 `.loeme.json`。
- 导入 `.loeme.json`。
- 检查版本并执行 migration。
- 缺失或损坏素材时给出明确错误。

## 18. Undo / Redo

支持撤销：

- 参数修改。
- 节点插入、移除和旁路。
- Compose 变换。
- Motif 添加、删除和重命名。
- Tile 和预览设置。

滑杆连续拖动视为一次操作。

## 19. 错误与空状态

| 场景 | 用户反馈 |
|---|---|
| 无素材 | 引导添加第一个 Motif |
| SVG 无有效图形 | 拒绝导入并说明原因 |
| 移除不支持效果 | 导入成功，但显示 Warning |
| Arrange 无法满足密度 | 保留当前结果并建议降低密度或间距 |
| 导出文件过大 | 建议 Compact SVG 或减少实例数 |
| 节点断开 | Canvas 保留上一次有效结果，并标记断点 |
| 项目保存失败 | 显示重试和项目 JSON 导出入口 |

## 20. 功能需求清单

### P0：必须完成

| ID | 需求 |
|---|---|
| P0-00 | `/apps/motif` 可进入应用，用户能从内置 Starter Library 新建项目 |
| P0-01 | 用户可以导入多个有效 SVG Motif |
| P0-02 | 系统安全清理并 Normalize 素材 |
| P0-03 | 默认 Recipe 自动创建并产生预览 |
| P0-04 | Arrange 支持 Scatter |
| P0-05 | Arrange 支持 Grid Array |
| P0-06 | Seed 结果可复现 |
| P0-07 | Output 支持 Artboard 模式和有限边界 |
| P0-08 | 支持 Colorway 槽位映射 |
| P0-09 | 支持 Artboard Preview |
| P0-10 | 支持 Artboard Flattened SVG 导出 |
| P0-11 | 支持本地自动保存和 Undo/Redo |

### P0-R：Repeat 技术门

Repeat 是 Loeme Motif 的重要专业能力，但不阻断有限画板构图版本成立。以下需求必须整体通过后，Repeat 才能对用户标记为 Stable：

| ID | 需求 |
|---|---|
| P0-R01 | 支持 Square 环绕，覆盖四边和四角副本 |
| P0-R02 | 支持 Tile 与 2×2 / 4×4 Repeat Preview |
| P0-R03 | Reduce Overlap 使用环面邻域检查跨边界实例 |
| P0-R04 | Repeat Flattened SVG 导出与重新打开保持一致 |
| P0-R05 | Seam Check 能检测结构性缺失、裁切和无效 Tile |

### P1：MVP 完整体验

| ID | 需求 |
|---|---|
| P1-01 | Compose 编辑与保存复合 Motif |
| P1-02 | Array 支持 Offset Rows / Columns |
| P1-03 | Repeat 支持 Brick / Half Drop |
| P1-04 | Compact SVG 导出 |
| P1-05 | 项目 JSON 导入导出 |
| P1-06 | Network 有限添加、移除和旁路节点 |
| P1-07 | 三种工作模式和可伸缩面板 |
| P1-08 | SVG 回导一致性检查 |
| P1-09 | 保存、预览和恢复最多 6 个 Arrange Variants |

## 21. 验收场景

### 场景 A：多素材 Scatter

```text
Given 用户导入花、叶、果实 3 个图形
When 用户选择 Scatter，调整 Density、Spacing 和 Seed
Then Canvas 实时更新，刷新项目后结果保持一致
```

### 场景 B：组合图形

```text
Given 用户已经导入花和叶
When 用户插入 Compose，将它们拼成花束并保存
Then Arrange 可以把花束作为一个整体进行分布
```

### 场景 C：规则阵列

```text
Given Input 中存在多个 Motif
When 用户选择 Array 和 Alternate 分配方式
Then Motif 按确定顺序排列，并能调整行列与间距
```

### 场景 D：无缝输出

```text
Given 图形跨越 Tile 左边界和上边界
When 用户查看 4×4 Repeat Preview
Then 对边和对角位置出现同步副本，视觉连续
```

### 场景 E：导出回导

```text
Given 用户完成一个图样
When 导出 Flattened SVG 并重新导入
Then 单 Tile 的尺寸、颜色和视觉结果一致
```

### 场景 F：Compose 透传素材

```text
Given Input 包含花、叶和果实
When 用户将花和叶组合，并选择 Append to Set
Then Arrange 的输入同时包含新组合 Motif 和未参与组合的果实
```

### 场景 G：保存随机候选

```text
Given 用户正在调整 Scatter
When 用户保存候选 A、Shuffle Seed 后保存候选 B，再恢复候选 A
Then Arrange 的模式、Seed 和全部参数恢复到候选 A 的状态
```

### 场景 H：跨边界碰撞

```text
Given Reduce Overlap 已开启，两个实例分别靠近 Tile 左右边界
When 它们通过平铺后实际发生重叠
Then Arrange 将它们视为邻居参与碰撞判断，而不是只检查中心 Tile
```

### 场景 I：不兼容 SVG

```text
Given 用户导入包含外链图片和 Filter 的 SVG
When Normalize 完成
Then 外链被阻止，Filter 被保留或移除的结果得到明确说明，用户可以取消或接受导入
```

### 场景 J：使用内置素材完成首次任务

```text
Given 用户没有准备任何本地 SVG
When 用户从 Starter Library 选择 3 个 Motif 并应用 Scatter
Then 无需上传文件即可预览、换色并导出 Artboard SVG
```

### 场景 K：Repeat 不影响有限画板交付

```text
Given 当前项目选择 Artboard Output
When 用户导出 Flattened SVG
Then 系统不执行 Wrap 或 Seam Check，导出的有限构图可以独立打开
```

## 22. 非功能需求

### 性能

- 常规参数修改目标反馈时间小于 100 ms。
- 500 个实例以内保持可交互。
- 复杂计算不得阻塞面板收起、模式切换和取消操作。
- Flattened 导出前显示预计实例数、路径节点数和文件大小；超过软上限必须确认。

### 安全

- 不执行 SVG 中的脚本、事件和外链请求。
- 项目文件必须通过 schema 校验。
- 导出文件不得包含用户输入的可执行内容。
- 原始未清理 SVG 永远不能通过 `innerHTML` 进入可见 DOM。

### 可用性

- 所有图标操作有 Tooltip。
- 关键操作可以使用键盘完成。
- 颜色不作为状态的唯一表达方式。
- 参数错误就地说明，不使用无法行动的通用错误提示。

### 兼容性

- 支持当前主流桌面版 Chrome、Safari 和 Firefox。
- MVP 不承诺移动端编辑体验。

## 23. 埋点建议

在用户明确同意分析的前提下记录：

- Project Created。
- First Motif Imported。
- First Built-in Motif Added。
- First Composition Rendered。
- Arrange Mode Changed。
- Compose Created。
- Output Mode Selected。
- Repeat Preview Opened。
- Export Started / Succeeded / Failed。
- Time to First Composition。

不上传用户的 SVG 内容、项目内容和导出文件。

## 24. 发布前验证

- 至少 20 组不同来源 SVG 导入测试。
- 全部 24 个内置 Motif 和 4 个示例的许可证、来源、安全和视觉快照检查。
- 至少 5 个 Artboard 项目的导出回导测试。
- 至少 10 组边缘与四角环绕样例。
- Scatter 与 Array 固定 Seed 回归测试。
- 跨 Tile 边界的碰撞与最小距离测试。
- Compose Only / Append to Set 两种输出测试。
- Arrange Variant 保存与恢复测试。
- 5 个完整项目的导出回导测试。
- 5 位目标设计师完成无引导任务测试。
- 检查全部第三方依赖许可并生成 attribution 清单。

## 25. 后续扩展方向

MVP 验证成功后按以下顺序扩展：

1. Field / Density Map。
2. Assign 独立节点与更复杂权重规则。
3. Along Path 与 Orient。
4. Mask、Blend 和更精确碰撞。
5. Compound Node 和 My Nodes。
6. AI 生成原生或受约束的矢量 Motif。
7. 云端项目、团队协作和版本历史。

未来节点仍遵循同一条数据链：

```text
Motif → Motif Set → Points → Instances → Pattern
```

## 26. MVP 产品结论

Loeme Motif MVP 不提供一个空白、复杂的节点编程环境，而是提供一条默认可运行的 Recipe。用户以 Canvas 为主完成创作，在需要理解结构时进入 Network。

第一版的产品承诺是：

> 用少量矢量素材，在浏览器里快速生成可复现、可组合并可导出的 SVG 构图；需要时进一步生成无缝 Repeat。

### 26.1 范围守门规则

满足以下条件的新需求才能进入 MVP：

1. 直接解决上述六个核心任务之一。
2. 不引入新的输入格式或服务端计算链路。
3. 不要求路径级矢量编辑。
4. 能使用现有 5 个节点表达，或作为节点内部参数实现。
5. 有明确验收场景和失败状态。

不满足条件的需求进入 Post-MVP Backlog，不通过增加节点临时解决。
