# Loeme Morph MVP 产品需求文档

> 状态：Draft v0.2（Implementation-ready）  
> 日期：2026-07-15  
> 产品阶段：WebGPU 生成与矢量导出可行性验证  
> 建议入口：`/apps/morph`

## 1. 产品概述

Loeme Morph 是一款面向平面、品牌、包装和图案设计师的浏览器端有机图形生成工具。用户通过少量预设和参数，在画布上“播种”并观察 Reaction–Diffusion（反应扩散）纹理生长，冻结满意结果后，将纹理转换为可编辑的矢量形状并导出 SVG。

产品沿用 Loeme Motif 已验证的工作台结构与交互语言，但不复用其紫色配色。Morph 使用更偏自然实验室的“藻绿 + 珊瑚橙 + 暖沙色”视觉体系。

MVP 验证的核心价值：

> 用户能否在不理解数学模型的前提下，用涂抹、预设和少量参数，在 3 分钟内生成具有设计价值、可以继续编辑的有机矢量图形。

## 2. 用户问题

- 手工绘制细胞、珊瑚、迷宫、斑点等有机纹理耗时且难以自然。
- 常见生成艺术演示只能观看或导出位图，难以进入 Figma、Illustrator 等生产流程。
- Reaction–Diffusion 的 Feed、Kill 等术语对普通设计师不直观。
- 高分辨率程序纹理直接矢量化容易产生过多锚点和碎片。
- 用户需要在“自由生长”与“结果可控”之间取得平衡。

## 3. 目标用户

### 3.1 核心用户

- 品牌和平面设计师。
- 包装、纺织与表面图案设计师。
- 插画师、动态视觉设计师和创意开发者。
- 熟悉 Figma 或 Illustrator，但不熟悉 shader、方程或节点编程的创作者。

### 3.2 典型用途

- 品牌辅助纹理与海报背景。
- 包装、印花、壁纸和无缝图案素材。
- Logo、文字周围的有机轮廓。
- 点描、木纹、指纹、细胞与珊瑚式图形。
- 激光切割、绘图机或刺绣前的矢量素材探索。

以上是探索用途，不是生产兼容承诺。MVP 不保证无缝接缝、刀路连续性、最小加工间距、刺绣针迹或特定设备兼容性。

### 3.3 用户故事与优先级

- **P0**：内部原型与公开 MVP 均不可缺少，缺失即阻断发布。
- **P1**：可以不进入第一轮技术原型，但必须在公开 MVP 前完成。
- **P2**：MVP 后验证，不进入本期开发承诺。

| ID | 优先级 | 用户故事 |
|---|---|---|
| US-01 | P0 | 作为首次用户，我希望打开页面即看到正在生长的有效图案，无需理解参数或上传素材。 |
| US-02 | P0 | 作为设计师，我希望用预设、画笔和少量直观参数控制形态，获得有意图而非纯随机的结果。 |
| US-03 | P0 | 作为设计师，我希望冻结任意时刻并无损调整矢量参数，以便反复比较结果。 |
| US-04 | P0 | 作为设计师，我希望导出可在 Figma、Illustrator 和浏览器继续使用的 Filled Shape SVG。 |
| US-05 | P0 | 作为用户，我希望在刷新、GPU 异常或误操作后恢复最近一次有效工作。 |
| US-06 | P0 | 作为不兼容设备用户，我希望看到明确原因和支持环境，而不是空白画布。 |
| US-07 | P1 | 作为设计师，我希望生成多层 Contour Lines，并调整线宽和分层颜色。 |
| US-08 | P1 | 作为设计师，我希望导出透明或带背景的 1×、2×、4× PNG。 |
| US-09 | P1 | 作为用户，我希望系统提示复杂度，并给出可以直接执行的降复杂度建议。 |
| US-10 | P2 | 作为设计师，我希望使用图片、文字或 Logo 作为约束，并生成 Repeat、中心线或动画。 |

## 4. MVP 目标与成功指标

### 4.1 产品目标

1. 新用户无需上传文件即可在 30 秒内看到有效图案。
2. 用户能在 3 分钟内完成“播种 → 生长 → 冻结 → 矢量化 → 导出”。
3. 参数变化和画笔操作具有即时视觉反馈。
4. 导出的 SVG 是独立、无脚本、可在主流矢量工具中继续编辑的文件。
5. 矢量结果在视觉保真与锚点数量之间保持可解释的平衡。

### 4.2 验证指标

| 指标 | MVP 目标 |
|---|---|
| 首次有效图案时间 | 中位数不超过 30 秒 |
| 首次完整导出时间 | 中位数不超过 3 分钟 |
| 核心任务完成率 | 70% 以上测试用户无需指导完成 SVG 导出 |
| 模拟交互帧率 | 推荐桌面设备上目标 45 FPS 以上 |
| SVG 导出成功率 | 95% 以上冻结结果可生成有效 SVG |
| 默认导出复杂度 | 默认预设控制在 10,000 个锚点以内 |
| 浏览器不支持反馈 | 100% 明确说明原因和建议操作 |

### 4.3 指标口径

| 指标 | 统一口径 | MVP 判断条件 |
|---|---|---|
| 首次有效图案时间 | 从工作台开始加载到首次成功渲染非空、非纯色模拟帧；仅统计 WebGPU 可用的冷启动 | P50 ≤ 30 秒，P90 ≤ 60 秒 |
| 首次完整导出时间 | 固定可用性任务中，从页面打开到首次成功触发下载 | P50 ≤ 180 秒，P90 ≤ 300 秒 |
| 无指导任务完成率 | 首次使用、支持设备、无口头提示，5 分钟内完成 SVG 导出 | 至少 6/8 名测试者完成 |
| 结果可用性 | 测试者将结果用于指定海报或包装任务，并按 5 分制评价“可继续编辑和使用” | 至少 6/8 名评分 ≥ 4 |
| SVG 技术成功率 | 成功触发下载 / 用户确认导出；主动取消不计失败 | ≥ 95%；累计 100 次后再作线上判断 |
| 矢量预览延迟 | 参数停止变化到真实 Path 预览完成；锚点不超过 20,000 | P50 ≤ 300ms，P95 ≤ 1s |
| 自动恢复成功率 | 存在有效本地记录时，刷新后恢复项目的比例 | ≥ 99% |
| 无崩溃会话率 | 支持设备上没有页面崩溃、未处理 GPU 错误或不可恢复导出错误 | ≥ 99% |

线上指标只统计用户明确同意匿名分析的样本；发布 Gate 以任务测试、自动化测试和兼容测试为准。

## 5. 产品原则

1. **先玩再理解**：默认预设立即生长，不要求用户理解 Feed / Kill。
2. **Canvas first**：主画布始终是视觉中心，参数服务于画面。
3. **设计语言优先**：界面使用“分裂、连结、粗细、速度”等词，专业参数由版本化预设管理，不直接暴露。
4. **过程可暂停**：用户可随时冻结、继续或重置，不会因切换模式丢失结果。
5. **矢量边界透明**：实时显示形状、路径和锚点数量，避免生成不可用文件。
6. **原始结果不丢失**：Shape 阶段的调整不破坏冻结的模拟结果。

## 6. MVP 核心工作流

```text
选择生长预设
→ 在画布涂抹种子
→ 观察纹理生长并微调
→ Freeze 冻结结果
→ 调整 Fill level、Edge smoothing 与 Path detail
→ 预览矢量路径复杂度
→ 导出 SVG 或 PNG
```

产品顶部使用三个工作模式，代替 Motif 的 Canvas / Network / Preview：

```text
Grow → Shape → Export
```

- **Grow**：涂抹种子、控制生长、寻找形态。
- **Shape**：从冻结结果提取矢量轮廓并清理路径。
- **Export**：检查背景、尺寸、颜色和文件复杂度后下载。

模式允许来回切换。未冻结前点击 Shape 等同于执行 Freeze：系统先完成当前计算帧、创建冻结快照，再进入 Shape，不弹确认框。第一次发生时用一次性 Toast 说明“已冻结当前生长结果，可随时返回继续”。

### 6.1 产品状态模型

| 状态 | 画布行为 | 允许操作 | 顶栏主操作 |
|---|---|---|---|
| Initializing | 显示骨架与 WebGPU 检测进度 | 无 | Checking GPU… |
| Growing | 模拟持续演化，可涂抹 | 画笔、预设、参数、Freeze | Freeze & Shape |
| Freezing | 停止提交新迭代，等待 GPU 快照读回 | 无；防止重复 Freeze / Resume | Creating snapshot… |
| Frozen | 停在不可变快照 | 进入 Shape、Resume、保存版本 | Resume growth |
| Vectorizing | 显示上一版矢量结果与更新状态 | 可继续调参；只采用最后一次输入 | Building paths… |
| Vector Ready | 显示当前真实矢量结果 | Shape 参数、颜色、进入 Export | Review Export |
| Exporting | 保持预览并显示进度 | 可取消下载准备，不可重复触发 | Preparing… |
| Error | 保留最后一个可用结果 | Retry、返回 Grow、查看原因 | Retry |

状态规则：

- Growing 离开 Grow 时必须先生成快照；同一时刻只能存在一个 Working Snapshot。创建成功前不切换模式，避免“静默暂停”。
- Resume Growth 从当前 Working Snapshot 恢复，并使现有矢量结果标记为 Outdated；旧结果仍可查看，但不可作为最新导出结果。
- Shape 参数变化不修改 Working Snapshot，只重新计算 Vector Result。
- Export 仅使用当前 Vector Result；如果结果为 Outdated，先重新矢量化再开放导出。无有效结果时 Export 保持可聚焦的 `aria-disabled` 状态，并说明“Create a vector shape before exporting.”
- 页面进入后台时自动暂停 GPU 迭代；回到前台后继续，避免图案在用户不可见时悄然变化。
- GPU 或矢量计算发生错误时，不清空 Working Snapshot 和上一版 Vector Result。

### 6.2 首次使用体验

1. 初始化默认值固定为 `Cells / Balanced / Add Seed / Brush 6% / Fit`，使用固定初始 Seed；初始化文案为“Preparing the growth canvas…”
2. GPU 就绪后立即生长，首屏不出现空白画布。
3. 画布出现提示：“Paint to guide the growth. Freeze when you find a shape you like.”画笔光标显示真实作用范围。
4. 图案进入可辨识阶段后提示：“看到喜欢的形态时，点击 Freeze。”该提示仅出现一次。
5. 首次 Freeze 自动进入 Shape，并聚焦 Fill level 控件。
6. 首次生成矢量结果后，以非模态提示指向锚点数量和 Review Export。

引导不使用阻断式教学弹窗；用户的任何画笔或参数操作都会关闭当前提示。

### 6.3 模式与破坏性操作规则

- 切换预设会载入新预设的调校默认值并重启模拟。若当前结果尚未冻结，系统先创建恢复检查点，并提供 8 秒 Undo Toast；不弹确认框。
- Shuffle 会清空当前生长状态并生成新 Seed；同样提供 Undo。
- Restart Pattern 恢复当前预设的固定初始 Seed、保留当前参数并自动生长。
- Clear Seeds 恢复稳定背景浓度场，不改变预设与参数。
- Reset Project 位于项目菜单，恢复所有默认值并清除本地 Frozen Versions，需要二次确认。
- 在 Shape 或 Export 返回 Grow 时保持冻结；只有点击 Resume Growth 才重新开始迭代。

## 7. 信息架构与布局

整体沿用现有 Loeme Motif 的桌面工作台：64px 顶栏、左侧资源面板、中央主画布、右侧 Inspector。保持面板圆角、卡片层级、Range 控件、顶部主操作按钮等既有交互习惯。

```text
Workspace
├── Top Bar
│   ├── Loeme / Morph + Project Name
│   ├── Grow / Shape / Export
│   ├── Undo / Redo
│   ├── Simulation Status
│   └── Freeze / Export
├── Left Panel
│   ├── Presets
│   ├── Seed Brushes
│   └── Frozen Versions
├── Main Canvas
│   ├── Simulation / Vector Preview
│   ├── Zoom / Fit
│   └── Inline Status
└── Right Inspector
    ├── Growth Parameters
    ├── Vector Parameters
    ├── Colorway
    └── Output Summary
```

### 7.1 顶栏

- 品牌：`Loeme / Morph`。
- 可编辑项目名，默认 `Untitled Morph`。
- Grow / Shape / Export 分段切换。
- Undo / Redo。
- 状态：Growing、Frozen、Vector Ready、Saved。
- Grow 模式主按钮为 Freeze & Shape；Shape 模式主按钮为 Review Export，Resume Growth 作为次级操作；Export 模式根据格式显示 Download SVG / Download PNG。

### 7.2 左侧面板

Grow 模式：

- 预设列表：Cells、Coral、Maze、Worms。
- 画笔：Add Seed、Erase、Reset。
- 画笔尺寸。
- 最近的 3 个 Frozen Versions。

Shape 模式：

- 输出类型：Filled Shape、Contour Lines。
- 颜色方案预设。
- 返回冻结版本。

Export 模式：

- SVG / PNG 格式切换。
- 1× / 2× / 4× PNG 尺寸。
- 下载前检查项。

### 7.3 中央画布

- MVP 画板固定为 1:1、`1024 × 1024` 逻辑单位，提供 Fit、100%、放大、缩小。
- Grow 模式显示实时 Reaction–Diffusion 模拟。
- 主键或单指拖动执行当前画笔；绘制时显示笔刷圆环，缩放后笔刷的实际模拟范围不变。
- Shape 模式默认显示矢量填充预览；可切换原始模拟、轮廓线和锚点预览。
- 画布底部显示简短状态：分辨率、迭代速度、形状数、锚点数。
- 模拟进行时允许平移和缩放；Space + 拖动或中键拖动平移，滚轮以指针位置缩放，双指执行缩放与平移。

### 7.4 右侧 Inspector

Grow 模式默认控制：

- Growth speed：Slow ↔ Fast，默认 Balanced。
- Form：Spots ↔ Stripes。
- Feature size：Fine ↔ Bold。

Shape 模式左侧只保留 Output Type 与 Frozen Versions；全部 Geometry 和 Colorway 参数统一放在右侧 Inspector，避免两侧重复。

Shape 模式控制：

- Fill level：决定哪些浓度区域成为形状。
- Edge smoothing：平滑标量场边缘。
- Path detail：控制保留细节与锚点数量。
- Remove small shapes：删除小碎片。
- Invert fill：反转前景与背景，仅 Filled Shape。
- Contour layers / spacing / line width：仅 Contour Lines。

Export 模式摘要：

- 画板尺寸。
- 形状数量。
- 路径数量。
- 锚点数量。
- 文件大小预估。
- 兼容性或复杂度警告。

### 7.5 尺寸与响应式边界

- 桌面工作台以 1440×900 为基准；`≥1280px` 使用 240px 左栏 + 自适应画布 + 320px Inspector。
- `960–1279px` 时左右面板改为互斥抽屉，画布保持状态且不重新采样。
- `<960px` 显示“建议使用更大窗口”提示并允许 Continue anyway；不丢失项目。
- 高度小于 640px 时顶栏压缩到 56px，面板独立滚动。
- 手机端 MVP 仅展示产品说明、最近冻结结果和浏览器兼容状态，不提供编辑控件。
- 触控笔与横屏平板作为尽力支持项，不作为 MVP 发布 Gate。

### 7.6 快捷键与画布手势

| 操作 | 快捷键 / 手势 |
|---|---|
| Add Seed | `B` |
| Erase | `E` |
| Freeze / Resume Growth | `F` |
| Undo / Redo | `⌘/Ctrl + Z` / `⌘/Ctrl + Shift + Z` |
| 调整笔刷 | `[` / `]` |
| 平移画布 | `Space + 拖动` 或中键拖动 |
| 缩放画布 | 触控板捏合或 `⌘/Ctrl + 滚轮` |
| Fit | `0` |
| 临时隐藏轮廓 / 锚点辅助 | 按住 `H` |

当焦点位于文本框或数值输入时，不触发单键快捷键。所有快捷键必须有按钮入口和 Tooltip，不能作为唯一操作方式。

## 8. 视觉方向

### 8.1 延续 Motif 的部分

- 轻量桌面工作台结构。
- 半透明白色面板和柔和阴影。
- 16px 面板圆角、10px 控件圆角。
- 紧凑顶栏、居中的模式切换、右侧主按钮。
- 左资源、中央画布、右参数的固定认知。
- Geist / Inter 类无衬线字体与小号标签体系。

### 8.2 Morph 独立配色

方向：**Natural Lab / 自然实验室**。避免延续 Motif 的紫色科技感，使用温暖底色与生物荧光式强调色。

| 角色 | 建议色值 | 用途 |
|---|---|---|
| Workspace | `#F2EFE7` | 页面暖沙背景 |
| Panel | `#FBFAF6` | 左右面板 |
| Canvas Dark | `#12211B` | 默认模拟画布 |
| Primary Text | `#17201C` | 主文字 |
| Muted Text | `#747B75` | 次级说明 |
| Border | `#E1DED4` | 分隔线 |
| Moss Accent | `#3D7A5F` | 主按钮、选中状态 |
| Bio Lime | `#C8F45D` | Growing、实时状态、高亮 |
| Coral | `#FF715B` | 画笔、警告、对比色 |
| Water Blue | `#74B7C9` | 第二层轮廓或辅助状态 |

界面主体保持安静，强颜色主要出现在画布、颜色预设和实时状态，不把整个界面染成绿色。

## 9. 功能需求

### 9.1 项目与状态

- 首次打开自动创建 `Cells / Balanced / Add Seed / Brush 6% / Fit` 项目，不展示空白画布。
- 项目包含当前模拟参数、Working Snapshot、最多 3 个 Frozen Versions、矢量参数和配色。
- 参数、界面偏好和二进制快照存入 IndexedDB；不将大型模拟数据写入 localStorage。
- 参数和界面状态在操作停止 800ms 后保存；GPU Recovery Snapshot 在操作停止 2 秒后异步保存，连续生长时最多每 10 秒一次；Freeze 与导出前立即保存。
- 保存状态与模拟状态分开显示：`Growing / Frozen` 与 `Saving… / Saved locally`。Saved locally 只表示当前设备已写入，不代表云备份。
- 刷新或重新打开时恢复最近 Working Snapshot、模式、参数和 Frozen Versions；Growing 状态恢复为 Frozen，由用户主动 Resume Growth。
- 支持 Undo / Redo，覆盖参数、单次完整笔画、Reset、预设切换和矢量参数。
- Grow 的 Undo 在 GPU 内存保留最近 8 个操作检查点；关闭页面后不保留撤销历史。Shape 参数保留最近 40 步历史。
- Reset Project 需二次确认。

### 9.2 Reaction–Diffusion 模拟

- 使用 WebGPU compute shader 实时计算。
- 默认模拟分辨率 512×512；可根据设备能力降至 256×256。
- 内置四个经过设计调校的预设：

| 预设 | 视觉结果 | 适合用途 |
|---|---|---|
| Cells | 分裂细胞、圆形斑点 | 品牌纹理、包装 |
| Coral | 珊瑚与泡状连接 | 有机背景、印花 |
| Maze | 连续迷宫、指纹 | 海报、辅助图形 |
| Worms | 细长虫状、流动条纹 | 动态视觉、线性图案 |

- Add Seed 画笔写入反应物；Erase 恢复背景状态。
- Freeze 停止模拟并创建不可变快照。
- Resume Growth 从冻结快照继续生长。
- Shuffle 在保持当前预设的前提下重新生成初始种子。
- MVP 用户界面不显示 Feed / Kill、Du / Dv 或 dt；这些数值只存在于内部版本化预设与诊断日志。

#### 设计参数规格

对用户展示的参数必须映射到经过验证的安全参数区间，避免把一个滑杆直接线性连接到任意 Feed / Kill 数值而产生全黑、全白或不生长的结果。

| 控件 | 范围与默认值 | 用户感知 | 实现规则 |
|---|---|---|---|
| Growth Speed | 0.25×–2.00×；默认 1.00× | 生长快慢，不改变最终风格 | 映射为 30–240 steps/sec；固定 `dt`，不修改反应参数 |
| Form | Spots 0–100 Stripes；预设决定默认值 | 从独立斑点到连续纹路 | 沿预先校准的 Feed / Kill 参数曲线插值 |
| Feature size | Fine 0–100 Bold；默认由预设给出 | 图案单元粗细 | 通过预设 LUT 联动缩放 `Du / Dv` 且保持比值；只使用稳定区间 |

四个预设各自保存 `Du`、`Dv`、`F`、`K`、默认 Form、Feature size 和初始种子配方。具体数值写入版本化常量，不允许 UI 层散落魔法数。MVP 不提供含义不够唯一的 Spread 控件；连接与留白主要由 Preset、Form 和用户笔画共同决定。

#### 模拟与画笔规则

- 固定时间步长，迭代计数使用整数；同一设备、浏览器版本、参数、Seed 和笔画序列应得到相同结果。不同 GPU 的浮点差异只承诺视觉一致，不承诺逐像素一致。
- Add Seed 将笔刷覆盖区域平滑写入激活物浓度；Erase 将区域恢复为稳定背景浓度。
- 指针事件按画布坐标插值，快速拖动时连续笔迹不得出现大于笔刷半径 50% 的断点。
- 笔刷范围为模拟画布短边的 1%–20%，默认 6%；支持硬度固定为 70% 的羽化边缘，MVP 不单独暴露 Hardness。
- 一次 `pointerdown → pointerup` 视为一个 Undo 操作。参数滑杆一次拖动也合并为一个 Undo 操作。
- 页面不可见、窗口最小化、设备切换或系统休眠时停止提交新迭代。

### 9.3 矢量化

- 基于冻结浓度场进行阈值分割。
- 使用 Marching Squares 提取封闭轮廓。
- Filled Shape 输出闭合 SVG Path。
- Contour Lines 按多个阈值提取 2–5 层轮廓。
- 支持标量场平滑与拓扑安全的路径简化；若使用 Douglas–Peucker，必须配合拓扑校验和 tolerance 回退。
- 自动删除低于 Remove small shapes 阈值的碎片。
- 对孔洞保留正确 fill-rule。
- 参数变化经过 120ms debounce 后提交 Worker，只显示最后一次请求的结果；较慢时显示 Updating 状态。
- 当锚点超过 20,000 时显示黄色警告；超过 50,000 时默认阻止导出，用户主动确认后可继续。

#### Shape 参数规格

| 控件 | 范围与默认值 | 行为 |
|---|---|---|
| Fill level | UI 0–100；默认 50；内部 0.05–0.95 | 选择激活物浓度高于阈值的区域 |
| Edge smoothing | UI 0–100；默认 20；内部 σ 0–2.5px | 对冻结标量场执行 Gaussian Smooth，不修改原始快照 |
| Path detail | UI 0–100；默认 75；内部 tolerance 8–0px | 值越高保留的细节和锚点越多 |
| Remove small shapes | 画板面积 0–1%；默认 0.05% | 删除小于阈值的封闭外环；其内部孔洞一并删除 |
| Invert fill | Off；默认关闭 | 交换前景与背景区域；仅 Filled Shape 显示 |
| Contour layers | Filled 固定 1；Contours 为 2–5，默认 3 | 围绕当前 Fill level 生成多个层级 |
| Contour spacing | 5–25；默认 15 | 仅 Contours；3 层默认阈值为 Fill level 的 `-15 / 0 / +15` |
| Line width | 0.5–16px；默认 2px | 仅 Contours；以 1024 逻辑单位画板为基准 |

归一化映射固定为：

```text
threshold = 0.05 + 0.90 × fillLevel / 100
smoothSigma = 2.5 × edgeSmoothing / 100
simplifyTolerance = 8 × (1 - pathDetail / 100)
minimumArea = 1024 × 1024 × removeSmallShapesPercent / 100
contourLevel(i) = clamp(fillLevel + (i - (layerCount - 1) / 2) × contourSpacing, 0, 100)
```

UI 数值取整不改变内部浮点精度；输入框允许的小数步长由控件规格决定。

算法要求：

- Marching Squares 对边缘交点使用线性插值，不以单元格中心代替。
- 对 5 / 10 两种歧义单元使用一致的 asymptotic decider，避免轮廓随机翻转。
- 模拟边缘先增加 1px 稳定背景 padding，再决定轮廓是否沿画板闭合。
- 线段拼接为闭合 Ring 后，按包含关系识别外环与孔洞；SVG 统一使用 `fill-rule="evenodd"`。
- 标量场固定使用激活物 `V`；前景判定为 `V >= Threshold`。
- 线段拼接使用网格边 ID，不使用浮点坐标字符串作为连接键；交点插值零分母使用固定 epsilon。
- 处理顺序固定为：解码 V → Gaussian Smooth → 阈值 → 轮廓提取 → Ring / Hole 分类 → 小面积过滤 → 拓扑安全简化 → 校验 → SVG 序列化。
- Simplify 后检查自交、孔洞逃逸、退化环、NaN 和越界；失败时逐级降低 tolerance，直到恢复合法拓扑。
- Filled Shape 的 Invert 输出“画板矩形减去原前景”的复合路径；Contour Lines 不改变几何，因此隐藏 Invert。
- Contour 阈值以主 Fill level 为中心，按 Contour spacing 等距生成并 clamp 到 `[0,100]`；输出 `fill="none"`、`stroke-linecap="round"`、`stroke-linejoin="round"`。
- 矢量预览必须渲染实际生成的 Path，不使用视觉相似但结构不同的 shader 近似。
- 结果摘要展示 Shapes、Paths、Anchors 和实际序列化字节数；文件大小不使用粗略估算。

### 9.4 配色

- 提供至少四套内置 Colorway。
- Filled Shape 支持背景色和前景色。
- Contour Lines 支持按层分配颜色。
- 支持透明背景。
- MVP 不提供完整颜色管理、专色或 ICC Profile。

### 9.5 导出

- SVG：独立文件，不包含脚本、外链或运行时依赖；根节点固定 `viewBox="0 0 1024 1024"`。
- PNG：透明或带背景，支持 1× / 2× / 4×。
- SVG 每个颜色或轮廓层生成一个 `<g>`；同层封闭轮廓合并为 Path，并保留 `fill-rule="evenodd"`。
- 文件名格式：`{project-name}-{preset}-{timestamp}.svg`。
- 导出前显示形状数、路径数和锚点数。
- 导出后保留当前项目，不跳转页面。
- PNG 是“当前 Vector Result + 当前配色”的光栅化结果，与 SVG 预览保持一致；MVP 不额外导出原始浓度纹理。
- PNG 1×、2×、4× 分别以 1024、2048、4096px 短边为默认尺寸；设备内存不足时禁用 4×并说明原因。
- 透明背景时 SVG 不写入背景矩形；有背景时写入画板大小的首个 `<rect>`。
- Contour Lines 按层建立 `<g data-layer>`，Filled Shape 生成一个前景组；不输出编辑器私有命名空间。
- 下载准备成功才触发浏览器保存；失败时保留当前结果并提供 Retry。

### 9.6 Frozen Versions

- 每次 Freeze 自动创建新版本，新版排在最前；不要求额外点击 Save。
- 最多保留 3 个。创建第 4 个时自动淘汰最旧版本，并提供 Undo Toast，避免打断创作。
- 空状态文案为“Frozen shapes will appear here.”
- 缩略图显示预设、冻结时间和主要 Shape 模式，不显示技术参数串。
- 切换版本恢复对应浓度场、迭代计数、预设、Grow 参数及该版本最后使用的 Shape 参数；全局 Colorway 保持当前值。
- Resume Growth 从选中版本复制出新的可变状态，不覆盖原版本。
- 删除版本需要一次确认；删除当前版本后 Working Snapshot 保持不变。

### 9.7 可访问性与减少动态效果

- 所有状态除颜色外同时使用文字或图标表达；Growing / Frozen 不得只依赖绿点变化。
- 常用文字与控件达到 WCAG AA 对比度；Bio Lime 不单独作为浅色背景上的正文颜色。
- Range 同时提供键盘步进和可输入数值；屏幕阅读器可读出名称、当前值与单位。
- 画布提供可访问名称和实时状态摘要，但不对每个像素或轮廓节点生成可访问元素。
- `prefers-reduced-motion: reduce` 时首屏以 Frozen 示例开始，用户点击 Start Growth 后才播放。
- Toast 不抢焦点；错误对话框需要可聚焦标题、明确操作并可用 Escape 关闭。

### 9.8 浏览器兼容与异常

- 首次进入依次检测安全上下文、`navigator.gpu`、adapter、device、required limits 和基础 shader pipeline。
- 不支持时展示解释页面：设备不支持、浏览器建议、PNG/SVG 示例结果。
- MVP 不实现 WebGL 或 CPU 实时模拟降级。
- 设备丢失时保留最近一次冻结快照，并允许刷新恢复。
- 模拟性能不足时自动降低 steps/sec 并给出非阻断提示。
- 正式支持范围为桌面 Chrome 和 Edge 发布时最近两个稳定版本；Safari 和 Firefox 在专项验证完成前标记为 Beta，不静默宣称完整支持。
- 新项目初始化时可以基于能力选择 512 或 256；已有项目运行中只能降低 steps/sec，不能自动降低分辨率。

### 9.9 关键反馈文案

| 场景 | 用户文案 | 主要操作 |
|---|---|---|
| 恢复成功 | Restored your last Morph. | Resume growth |
| 无 Frozen Version 可恢复 | Your settings are saved, but the live pattern couldn’t be recovered. | Restart pattern |
| 空矢量结果 | No shapes at this fill level. Lower Fill level or reduce Remove small shapes. | Reset shape settings |
| 20k anchors | This shape may be slow to edit. Lower Path detail or increase Remove small shapes. | Keep editing |
| 50k anchors | This SVG is very complex and may be slow in Figma or Illustrator. | Go back and simplify / Download anyway |
| 超过硬上限 | This result is too complex to export safely. Lower Path detail and try again. | Back to Shape |
| 本地保存失败 | Couldn’t save this project in your browser. Keep this tab open and export your work. | Export now |
| Device lost | The graphics device was reset. Your latest frozen version is safe. | Reload Morph |
| WebGPU 不可用 | Morph needs WebGPU to grow patterns on this device. | View supported browsers |

超过 20,000 anchors 时不逐点绘制锚点辅助，显示“Too many anchors to preview.”；错误信息必须保留上一版可用结果并提供下一步，不显示无法行动的泛化“Something went wrong”。

## 10. MVP 范围

### 10.1 必须包含

- `/apps/morph` 单页工作台。
- Grow / Shape / Export 三模式。
- WebGPU Reaction–Diffusion 实时模拟。
- Cells、Coral、Maze、Worms 四个预设。
- Add Seed、Erase、画笔尺寸、Reset。
- Freeze、Resume Growth、Shuffle。
- Fill level、Edge smoothing、Path detail、Remove small shapes、Invert fill。
- Filled Shape 和 Contour Lines。
- Contour Layers、Contour Spacing 和 Line Width。
- 四套配色、透明背景。
- SVG 与 PNG 导出。
- 路径复杂度反馈。
- 最多 3 个 Frozen Versions。
- 本地自动保存、Undo / Redo。
- WebGPU 检测、性能降级提示和设备丢失反馈。

### 10.2 MVP 不包含

- 图片、Logo、文字作为生长遮罩或种子。
- 无缝 Repeat 和 Tile 接缝检查。
- 用户导入 SVG Motif 进行填充。
- 中心线 / Skeleton 矢量化。
- 路径锚点编辑、Boolean、Mask 和手动修形。
- 动画、视频、GIF 或 Lottie 导出。
- 3D 材质和位移贴图。
- Feed / Kill 参数地图浏览器。
- 多层 Reaction–Diffusion 系统。
- 云端项目、账号、分享链接和协作。
- 移动端完整编辑体验。

### 10.3 范围解释

若本节与典型用途或其他描述冲突，以本节为准：

- MVP 只有一个本地项目和最多 3 个 Frozen Versions，不包含项目列表、云同步或分享。
- MVP 只有单个 1:1、1024 逻辑单位画板，不提供自定义尺寸和非正方形画板。
- Filled Shape 是闭合填充复合路径；Contour Lines 是按阈值分组的描边轮廓，不是中心线或加工刀路。
- Feed / Kill 只存在于内部版本化预设，用户界面不直接暴露原始数值。
- PNG 是当前矢量结果的光栅化版本，不是独立的原始模拟纹理导出。
- 可复现性是相同版本与设备上的视觉一致，不是跨 GPU 的逐像素一致。
- 本地保存不等于云备份；浏览器清理站点数据可能删除项目。

## 11. 核心任务与验收标准

### 任务 A：零学习成本开始

用户打开应用后，无需上传或设置即可看到 Cells 图案持续生长。

验收：首屏出现有效画面；预设和 Freeze 是清晰的主要操作。

### 任务 B：用画笔控制生长

用户选择 Add Seed，在画布拖动后产生新的生长区域；Erase 可以局部移除。

验收：笔迹跟手，无明显坐标偏移；撤销可恢复最近一次笔画。

### 任务 C：冻结并矢量化

用户点击 Freeze，进入 Shape，调整 Fill level 和 Path detail 得到封闭轮廓。

验收：预览与冻结结果结构一致；调整 Path detail 时锚点数量明确变化。

### 任务 D：可靠导出

用户导出 Filled Shape SVG，并在浏览器、Figma 或 Illustrator 中打开。

验收：文件有效、无脚本或外链；背景透明设置正确；视觉与预览基本一致。

### 任务 E：处理复杂结果

用户生成节点过多的图案，系统给出明确提示并推荐降低 Path detail 或提高 Remove small shapes。

验收：警告包含当前锚点数和可执行的修复建议，不只显示“导出失败”。

### 11.1 可执行验收定义

- 默认项目不得出现空白、纯色、NaN、闪烁或 shader 编译错误；四个预设使用固定 Seed 做截图回归。
- 100% 缩放下画笔中心与指针坐标偏差不超过 2 CSS px；缩放、平移和高 DPR 下不得方向反转或比例漂移。
- Freeze 快照与点击时最后一个完整模拟帧一致；Shape 调参不能改变冻结数据。
- 参数停止变化后 100ms 内出现处理中反馈；过期 Worker 结果不得覆盖最新设置。
- 发布测试样例的 SVG 重新栅格化后，与应用内矢量预览的非抗锯齿区域差异不超过 1%。
- SVG 必须可被 XML 解析，不包含 `script`、`foreignObject`、事件属性、外链、`NaN`、`Infinity` 或空 viewBox；孔洞与透明背景正确。
- PNG 像素尺寸、颜色、背景和 Alpha 与导出摘要一致。
- 20k、50k 和硬上限三档复杂度反馈按规范触发；Worker 不得因超大结果使页面失去响应。
- 刷新后恢复预设、Frozen Versions、Shape 参数、Colorway 和最近 Recovery Snapshot。
- 不支持 WebGPU、device lost、IndexedDB 配额不足和导出失败均显示标准化原因、保留可恢复数据并给出下一步。
- 所有非画布控件可完全键盘操作，焦点可见、状态不只依赖颜色、主要文字和控件达到 WCAG AA。

## 12. 技术方案摘要

```text
WebGPU Compute
├── Ping texture A：当前 U / V 浓度
├── Pong texture B：下一轮 U / V 浓度
├── Brush pass：写入或擦除种子
└── Render pass：颜色映射与画布显示

Frozen Snapshot
→ 读取浓度数据到 CPU
→ Decode V / Gaussian Smooth
→ Threshold
→ Marching Squares
→ Ring / Hole classification
→ Minimum Area / Topology-safe Simplify
→ SVG Path
```

### 12.1 Gray–Scott 数值定义

MVP 固定使用 9 点 Laplacian、Euler 积分和无通量边界。开发实现、CPU 参考测试和 GPU shader 必须使用同一公式：

```text
L(X) = -Xcenter + 0.20 × Σ(Xaxis) + 0.05 × Σ(Xdiagonal)

U' = clamp(U + (Du × L(U) - U × V² + F × (1 - U)) × dt, 0, 1)
V' = clamp(V + (Dv × L(V) + U × V² - (F + K) × V) × dt, 0, 1)
```

- 固定 `dt = 1.0`，Growth Speed 只决定每秒执行多少个 step。
- 画布外采样采用 clamp-to-edge，实现近似无通量边界。
- 背景稳定态固定为 `(U=1, V=0)`。
- Ping / Pong 每个 simulation step 交换一次，不允许同一 dispatch 原地读写。

预设初始校准值如下；进入 Closed Alpha 前允许调校一次，之后以版本化 Golden Fixtures 锁定：

| Preset | Du | Dv | F | K | Form | Feature size | 初始种子 |
|---|---:|---:|---:|---:|---:|---:|---|
| Cells | 0.16 | 0.08 | 0.0367 | 0.0649 | 25 | 45 | 中央与周边 8–12 个软圆点 |
| Coral | 0.16 | 0.08 | 0.0545 | 0.0620 | 55 | 60 | 中央不规则环 + 少量噪点 |
| Maze | 0.16 | 0.08 | 0.0290 | 0.0570 | 85 | 50 | 稀疏网格噪声块 |
| Worms | 0.16 | 0.08 | 0.0780 | 0.0610 | 65 | 35 | 3–5 条短笔画 + 随机点 |

- Form 不跨预设直接线性修改任意参数，而使用每个预设单独校准的 `F/K LUT`。
- Feature size 归一化为 `t=0…1`，使用 LUT 将 Du / Dv 同比缩放到基准值的 0.65–1.45 倍；保持 `Du:Dv` 比值。
- 256 与 512 分辨率分别保存校准表，不能直接共用扩散参数。项目初始化后固定模拟分辨率，运行中不得静默切换。
- Shuffle 使用固定版本的 seeded PRNG；笔画命令记录归一化坐标、半径、模式和应用的 simulation step，不按真实时间重放。

### 12.2 GPU 资源合同

- Ping / Pong 使用基线可写的 `rgba16float`；R/G 通道存 U/V，B/A 保留。
- Texture usage 至少包含 `STORAGE_BINDING | TEXTURE_BINDING | COPY_SRC | COPY_DST`。
- Compute workgroup 固定为 `8×8`；初始化时校验 adapter/device、纹理尺寸与 workgroup limits。
- 页面必须监听 `device.lost` 和 uncaptured error；不能只检查 `navigator.gpu`。
- 默认 512×512；能力检测或基准帧不达标时，新项目以 256×256 初始化并使用对应预设表。
- 运行期间性能下降只减少 steps/sec，不改变分辨率、参数或既有结果；恢复后不追赶后台遗漏 step。

### 12.3 画笔合同

- Add Seed 的中心区域写入预设指定的 U/V 值，边缘使用径向平滑 falloff；Erase 恢复 `(1,0)`。
- 笔迹采样间距不得超过当前半径的 50%，优先使用 coalesced pointer events。
- 使用 pointer capture；正确处理 DPR、Fit、缩放、平移与 Y 轴翻转后再转换为模拟纹理坐标。
- 一次 `pointerdown → pointerup` 是一个命令；笔迹落在确定的 simulation step，不与帧率绑定。
- Grow Undo 使用 GPU texture copy 保留最近 8 个检查点；内存不足时减少检查点数量并明确提示，不影响当前画布。

### 12.4 Freeze 与快照

```text
Growing
→ 停止提交新 step
→ 等待最后一个 command buffer 完成
→ copyTextureToBuffer
→ mapAsync
→ 生成 snapshot-id
→ 写入 IndexedDB
→ Frozen
```

- 快照保留完整 RGBA16F 原始字节；512² 单个快照约 2MiB。
- `bytesPerRow` 按 WebGPU 的 256 字节要求对齐。
- Freezing 期间合并或拒绝重复 Freeze，不允许旧异步结果覆盖较新的 generation-id。
- Resume Growth 将快照恢复到两个工作纹理，并从保存的迭代计数继续。
- IndexedDB 保存一个 Recovery Snapshot 和最多三个 Frozen Versions，项目软上限 16MiB；达到上限先淘汰最旧非当前版本。
- 配额或写入失败时保持内存内作品，并持续显示：“Couldn’t save this project in your browser. Keep this tab open and export your work.”

### 12.5 Vector Worker 协议

- Freeze 后只向 Worker 传输一次 snapshot buffer，并按 `snapshot-id` 缓存解码后的 V 场。
- Shape 调参只发送 `snapshot-id + settings + generation-id`，不得每次复制 2MiB 快照。
- 输入经过 120ms debounce；Worker 使用 latest-wins，旧任务在阶段边界协作取消。
- 处理期间保留上一版有效预览并降至 60% opacity，显示“Updating paths…”；导出暂时禁用。
- Ring / Hole 使用包围盒预筛选与 point-in-polygon 建立包含层级，以嵌套奇偶判断孔洞，不依赖路径方向。
- Filled Shape 每个连通域输出 compound path，统一 `fill-rule="evenodd"`；路径坐标保留最多 3 位小数。
- 空结果文案：“No shapes at this fill level.”并建议降低 Fill level 或 Remove small shapes。

### 12.6 可复现性边界

- 同一 app version、project schema、浏览器、GPU backend、模拟分辨率、步数和命令序列应得到视觉一致结果。
- 浮点 shader 不承诺跨 GPU、驱动或浏览器逐像素一致，因此 Frozen Snapshot 是项目恢复的事实来源，参数与 Seed 不是唯一来源。
- 预设算法或数值变更必须提升 `algorithm_version`；旧项目继续使用旧版本或以只读模式导出，不能静默套用新参数。

### 12.7 性能预算

| 场景 | 发布预算 |
|---|---|
| 512²、Balanced、默认预设连续运行 | 参考设备 P50 ≥ 45 FPS，30 秒无持续下降 |
| 笔画视觉反馈 | P95 ≤ 50ms |
| Freeze + 快照读回 | P50 ≤ 250ms，P95 ≤ 750ms |
| Filled Shape 矢量化（≤20k anchors） | P50 ≤ 300ms，P95 ≤ 1s |
| 5 层 Contours（≤50k anchors） | P95 ≤ 2s |
| 默认 SVG 序列化 | P95 ≤ 1s |
| 主线程长任务 | 单次不得超过 100ms；矢量计算不得运行在主线程 |
| 应用峰值内存 | 目标 ≤ 128MiB；不含浏览器与 GPU 驱动自身开销 |

### 12.8 项目数据边界

```text
MorphProject
├── project_schema_version
├── algorithm_version
├── name
├── preset_id / seed / simulation_resolution / iteration_count
├── growth_settings
├── recovery_snapshot_id
├── frozen_versions[0..2]
│   ├── snapshot_id / created_at / thumbnail
│   ├── preset / seed / iteration_count / growth_settings
│   └── shape_settings
├── current_shape_settings
├── colorway
└── ui_preferences
```

- 二进制浓度场以独立 snapshot record 存储，项目 JSON 只引用 ID。
- `project_schema_version` 负责存储迁移，`algorithm_version` 负责模拟语义；两者不可混用。
- 项目名写入文件名前移除路径分隔符、控制字符和 HTML 特殊字符，并限制 80 个字符。
- 遇到高于当前支持版本的项目时进入只读预览 / 导出模式，不能静默覆盖。

## 13. 建议实施阶段

### Milestone 1：Simulation Core

- WebGPU 初始化、设备能力检测与错误状态。
- Gray–Scott ping-pong compute pipeline。
- 默认预设、实时渲染、Freeze / Resume Growth / Reset。

验收：四个预设可稳定产生明显不同的形态。

### Milestone 2：Creative Controls

- Add Seed / Erase 画笔。
- 设计语言参数映射。
- Shuffle、Undo / Redo、画布缩放和平移。

验收：用户可有意识地改变图案的起点、位置和大体形态。

### Milestone 3：Vector Pipeline

- 冻结快照读取。
- Fill level、Marching Squares、孔洞处理。
- Edge smoothing、Path detail、Remove small shapes。
- Filled Shape 和 Contour Lines。

验收：默认结果可控制在 10,000 锚点以内，路径闭合且无明显自交错误。

### Milestone 4：Export & Project

- SVG / PNG 导出。
- 复杂度检查与错误提示。
- 本地自动保存和项目恢复。
- 配色与透明背景。

验收：刷新后可恢复项目；导出结果与预览一致。

### Milestone 5：Release Gate

- 推荐桌面浏览器回归。
- 高 DPI、窗口尺寸变化与 GPU device lost 测试。
- Figma、Illustrator 和浏览器 SVG 打开测试。
- 首轮 5–8 名设计师可用性测试。

## 14. 上线 Gate

### Core Gate

- 支持 WebGPU 的浏览器中，默认项目可直接运行。
- 四个预设均能生成稳定、可辨识的结果。
- Freeze / Resume Growth 不丢失当前状态。
- Add Seed / Erase 与实际指针位置一致。
- Shape 参数调整不会修改冻结快照。
- 默认 SVG 可以独立打开并继续编辑。
- 刷新后可以恢复最近项目。
- 无阻断级构建、运行或导出错误。

### Vector Gate

- 输出路径闭合，孔洞方向或 fill-rule 正确。
- 降低 Path detail 能显著减少锚点且不破坏主体形状。
- 小碎片过滤符合 Remove small shapes 设置。
- 超大文件有预警和明确处理方式。
- PNG 与 SVG 背景透明选项一致。

### 14.1 发布测试环境

正式 Gate 至少覆盖：

- Apple Silicon、8GB 内存的 macOS 参考设备。
- Windows 11、集成显卡、8GB 内存的参考设备。
- 512×512、默认 Balanced、连续运行 30 秒。
- 四预设 × 20 个固定 Seed。
- Filled Shape 与 2–5 层 Contour Lines。
- 发布时最近两个稳定版 Chrome / Edge；Safari / Firefox Beta 环境单独记录。
- Figma 当前线上版本、Illustrator 当前与上一主版本、浏览器直接打开 SVG。

自动测试至少覆盖：

- Gray–Scott 小网格 CPU / GPU 容差对比。
- Marching Squares 16 种 case、5 / 10 鞍点、触边、孔洞、嵌套孔洞和 Invert。
- 简化后的闭环、自交、孔洞逃逸、退化环、NaN 和越界检查。
- Fit、缩放、平移、DPR 1/2 下的画笔坐标。
- 快速重复 Freeze / Resume、Worker 竞态和过期结果取消。
- device lost、存储配额不足、快照损坏和项目 Schema 迁移。
- SVG 重新栅格化与 Golden Preview 像素差异测试。

## 15. 上线后的首轮观察

- 用户最常选择的预设。
- 首次主动涂抹前的时间。
- Freeze 前平均生长时长。
- Fill level / Edge smoothing / Path detail 的调整频率。
- Filled Shape / Contour Lines 使用比例。
- 导出 SVG / PNG 比例。
- 导出前平均锚点数量。
- 因复杂度警告放弃导出的比例。
- 用户是否寻找文字、Logo、图片输入或 Repeat 功能。

MVP 不上传用户项目、笔画或导出内容。正式埋点只记录功能事件和匿名性能指标，并在用户同意后启用。

### 15.1 事件埋点规范

所有事件使用版本化名称和固定属性白名单。通用属性只允许 `app_version`、`event_schema_version`、首次会话标记、浏览器/系统大类、能力等级、模拟分辨率和匿名会话 ID。

| 事件 | 触发时机 | 允许的业务属性 |
|---|---|---|
| `morph_app_opened` | 工作台外壳完成加载 | is_first_session |
| `morph_capability_checked` | WebGPU 检测完成 | supported、标准化 reason_code |
| `morph_first_pattern_visible` | 首次有效模拟帧完成 | startup_ms、resolution |
| `morph_preset_selected` | 切换预设 | preset |
| `morph_brush_stroke_committed` | 一次完整笔画结束 | add/erase、尺寸档位、时长档位 |
| `morph_freeze_created` | 快照成功 | preset、growth_duration_bucket |
| `morph_vector_preview_completed` | 矢量预览成功 | output_type、latency_ms、形状/锚点档位 |
| `morph_complexity_warning_shown` | 首次进入复杂度档位 | warning_level、anchor_count_bucket |
| `morph_export_started` | 用户确认导出 | format、output_type、anchor_count_bucket |
| `morph_export_completed` | 序列化成功并触发下载 | format、duration_ms、file_size_bucket |
| `morph_export_failed` | 导出中断 | format、标准化 error_code |
| `morph_project_restored` | 本地恢复完成 | success、标准化 error_code |
| `morph_device_lost` | GPU device lost | recoverable、当前阶段 |

参数调整事件在停止操作 500ms 后合并，只记录参数名和归一化档位。核心漏斗为：

```text
capability_supported
→ first_pattern_visible
→ first_meaningful_edit
→ freeze_created
→ vector_preview_completed
→ export_completed
```

### 15.2 隐私与数据治理

- 匿名产品统计默认关闭，用户明确同意后启用；拒绝或撤回不影响产品功能。
- 项目参数、笔画、Snapshot、颜色和导出内容只存浏览器本地，不上传服务器。
- 事件和错误日志不得包含项目名、笔画坐标、颜色原值、Seed、像素、SVG Path、文件或完整 GPU 名称。
- 不使用 WebGPU 能力、画布输出、字体或 GPU 型号进行设备指纹识别；能力只保留粗粒度档位。
- 尊重 Global Privacy Control / Do Not Track；提供“清除本地项目与统计标识”入口。
- 原始匿名事件最长保留 90 天，之后删除或仅保留无法回溯至会话的聚合数据。
- IndexedDB 可能被浏览器清理，界面必须明确“Saved locally”，不得暗示云备份。

### 15.3 导出安全

- SVG 只允许 `svg`、`rect`、`g`、`path` 等所需静态图形元素及白名单属性。
- 禁止脚本、事件处理器、`foreignObject`、网络 URL 和 data URL。
- 超过 50,000 anchors 需要二次确认；超过 100,000 anchors 或序列化后大于 25MiB 时硬性阻止导出。
- 序列化前后均检查有限数值、合法 viewBox、闭合路径与文件大小。
- 第三方算法或依赖进入发布包前必须完成许可证与安全审查。

## 16. MVP 后的优先候选

1. 文字、Logo 和图片作为 Seed / Mask。
2. 无缝 Repeat 与 Loeme Motif 联动。
3. 用户 Motif 按浓度场填充。
4. 中心线和 Plotter 路径导出。
5. 动画循环与 MP4 / WebM 导出。

其中最值得优先验证的是“文字或 Logo 作为生长约束”，因为它能把数学图案直接转化为品牌设计任务；与 Loeme Motif 的联动则适合作为第二阶段的产品组合能力。

## 17. 版本与发布策略

| 阶段 | 范围 | 发布条件 |
|---|---|---|
| v0.1 Internal Prototype | Simulation、Freeze、基础 Filled Shape | 四预设稳定，无阻断崩溃 |
| v0.2 Closed Alpha | 全部 P0，邀请设计师测试 | 至少 8 人测试，6/8 无指导完成；高优先级问题关闭 |
| v0.3 Public Beta / MVP | 全部 P0 与 P1 | 浏览器、恢复、隐私、导出兼容与安全 Gate 全部通过 |
| v1.0 | 不在本 PRD 范围 | 根据 Beta 数据另立需求 |

- 应用使用语义化版本；本地项目独立维护 `project_schema_version` 和 `algorithm_version`。
- Contour Lines、匿名统计和 Morph 总入口支持独立关闭，出现兼容或隐私问题时可快速止损。
- Public Beta 前至少进行 48 小时内部稳定性观察。
- 以下任一情况暂停扩量：导出失败率 >5%、恢复失败率 >1%、无崩溃会话率 <99%、可复现项目损坏、隐私或 SVG 安全问题。
- 每次发布记录应用版本、项目 Schema、算法版本、支持浏览器、已知限制与回滚版本。

## 18. 关键依赖

| 依赖 | 责任角色 | 发布前条件 |
|---|---|---|
| Loeme 工作台壳层与设计组件 | 前端 / 设计 | 复用布局和交互，不污染 Motif 现有样式 |
| WebGPU、Worker、IndexedDB、Blob API | 图形工程 | 支持矩阵、device lost 与配额异常测试通过 |
| Marching Squares、平滑、简化 | 图形工程 | 固定样例、孔洞、自交和复杂度回归通过 |
| Figma / Illustrator 兼容环境 | QA / 设计 | 导入、孔洞、透明、颜色和复杂文件测试通过 |
| 统计与错误上报 | 数据 / 前端 | 明确同意、属性白名单、删除和保留周期可执行 |
| 隐私与同意文案 | 产品 / 法务 | Public Beta 前审核完成 |
| 第三方算法与字体 | 前端 | 来源稳定、许可和安全审查完成 |
| Golden Fixtures | QA / 图形工程 | 四预设和两类矢量输出纳入发布回归 |

核心 Grow、Shape、保存和导出在页面资源加载完成后不依赖后端；统计服务故障不能阻断创作。

## 19. 主要风险与应对

| 风险 | 影响 | 应对与 Gate |
|---|---|---|
| WebGPU 与驱动差异 | 无法进入、形态异常 | 能力检测、明确支持矩阵、固定设备截图回归 |
| device lost 或内存压力 | 当前工作丢失 | Recovery Snapshot、Frozen Version、可恢复错误状态 |
| 锚点数量爆炸 | Worker 卡死、文件难编辑 | 可取消计算、20k/50k/100k 分档与 25MiB 上限 |
| 孔洞、自交和边缘错误 | SVG 视觉或拓扑错误 | Golden Fixtures、重新栅格化差异测试、无效结果阻止导出 |
| IndexedDB 被清理或配额不足 | 用户误认为已备份 | Saved locally 文案、容量检测和持续警告 |
| 跨 GPU 结果差异 | 用户认为项目损坏 | 保存浓度快照，明确可复现边界 |
| 参数术语难懂 | 用户无法有意控制 | 设计语言标签、四预设、高级参数不直接暴露 |
| 持续运动导致不适或耗电 | 可访问性与体验问题 | Reduce Motion、后台暂停、显著 Freeze 控件 |
| 分析日志泄露作品 | 隐私风险 | Opt-in、严格事件白名单、禁止内容字段和指纹数据 |
| 设计软件解析差异 | 生产不可用 | 真实 Figma / Illustrator 文件回归 |

## 20. 开放问题与默认决策

| ID | 待决问题 | 没有进一步决策时的默认方案 | 决策节点 |
|---|---|---|---|
| OQ-01 | Safari / Firefox 是否正式支持 | Chrome / Edge 正式支持，其余标记 Beta | Milestone 1 |
| OQ-02 | 预设最终 F/K 与 Form LUT | 以本 PRD 初值调校，并在 Closed Alpha 前锁定 | Milestone 1 |
| OQ-03 | 复杂 SVG 是否允许强制导出 | 50k 二次确认，100k 或 25MiB 硬阻止 | Milestone 3 |
| OQ-04 | 本地项目容量 | 单项目、3 个版本、16MiB 软上限 | Milestone 4 |
| OQ-05 | 匿名统计授权方式 | 明确 Opt-in，拒绝不影响功能 | Milestone 4 |
| OQ-06 | 错误上报服务 | 只发标准化错误码；未通过隐私审查则不上远程日志 | Milestone 4 |
| OQ-07 | iPad 完整编辑 | 不作为 MVP Gate，只验证说明页与基础查看 | Release Gate |
| OQ-08 | 默认 Colorway | Cells + 深藻绿画布 + Bio Lime 前景 | 视觉评审前 |
| OQ-09 | 反馈是否可以附加作品 | 默认不附加，用户单独选择后再说明 | Public Beta 前 |
| OQ-10 | 何时做产品去留判断 | 达到 100 个有效首次会话并完成 8 人任务测试后复盘 | Public Beta 后 |
