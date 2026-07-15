# Loeme Flow MVP 产品需求文档

> 状态：Draft v0.3  
> 日期：2026-07-15  
> 产品阶段：交互价值与 WebGPU 技术可行性验证

关联产品：[Loeme Motif MVP 产品需求文档](./mvp-prd.md)

## 1. 产品概述

Loeme Flow 是一款面向平面、品牌、动态图形和表面设计师的浏览器端流场图形编排器，产品入口为 `/apps/flow`。

用户选择内置图形或复用 Motif Library 中的 SVG 素材，在画布上放置旋涡、吸引和排斥三类力场，让大量图形实时流动、形成构图；用户在满意时冻结画面，并导出静态 PNG。

Flow 不建立第二套编辑器框架，而是与 Motif 共用 Loeme Workspace 骨架、素材模型、项目操作、配色体验和导出入口。MVP 验证的核心价值是：

> 用户是否能通过直接操纵画布上的力场，在 3 分钟内得到传统散点和阵列工具难以快速制作的、有方向感和视觉节奏的构图。

## 2. 用户问题

- 通用设计软件中的大量对象编排依赖手工复制、旋转和微调。
- 粒子或流场效果通常需要动态图形软件、插件或编程能力。
- 参数化生成工具常以代码和抽象参数为中心，设计师难以直接控制构图焦点和留白。
- 动态模拟容易产生好看的瞬间，但缺少“冻结、比较、交付”的设计工作流。
- 高对象数量下，传统 DOM/SVG 实时预览性能不足。

## 3. 目标用户与场景

### 3.1 核心用户

- 海报、品牌和视觉系统设计师。
- 包装、纺织与表面图样设计师。
- 动态设计师和创意编程初学者。
- 熟悉 Figma、Illustrator 或 After Effects，但不编写 Shader 的创作者。

### 3.2 MVP 典型场景

1. 使用数千片叶子制作环形流动的品牌海报背景。
2. 预留一块可在其他设计软件中继续放置标题或 Logo 的构图留白。
3. 叠加两个旋涡，生成 S 形或对流式构图。
4. 快速 Shuffle 初始分布，冻结并比较多个视觉候选。
5. 导出高分辨率 PNG，进入其他设计软件继续排版。

## 4. MVP 产品目标

### 4.1 核心目标

1. 用户进入工作台后 30 秒内看到正在流动的有效示例，而不是空白画布。
2. 用户无需理解向量、粒子或 Shader，即可添加和移动一个力场。
3. 用户能在 3 分钟内完成“修改流场 → 冻结 → 导出”的完整闭环。
4. 支持至少 12,000 个图形在推荐设备上保持可交互预览。
5. Flow 与 Motif 在信息架构和基础操作上保持一致，降低学习成本。

### 4.2 产品验证指标

| 指标 | MVP 目标 |
|---|---|
| 首次有效操作 | 80% 用户无需帮助完成一次力场添加或移动 |
| 首次构图时间 | 中位数不超过 3 分钟 |
| 冻结与导出完成率 | 70% 以上测试用户完成完整闭环 |
| 推荐设备预览性能 | 12,000 个实例时交互帧率不低于 30 FPS |
| 导出成功率 | 95% 以上项目成功导出 PNG |
| WebGPU 不可用说明 | 100% 明确展示原因和建议浏览器，不出现无反馈空白页 |

### 4.3 指标口径

- 产品任务指标只统计通过 WebGPU 能力检测且工作区宽度不低于 1080px 的可编辑会话；Unsupported 和 Reduced Motion 会话单独报告，不混入失败率。
- “首次有效操作”定义为成功提交一次力场创建或移动，不把点击工具按钮计为完成。
- “首次构图时间”从 WebGPU 首帧 Ready 开始，到用户第一次成功 Freeze 为止；初始化时间另行统计。
- “完整闭环”从 WebGPU 首帧 Ready 开始，到第一次 `flow_export_succeeded` 为止。
- 导出成功率分母为 `flow_export_started`，同一次导出的自动 Retry 仍属于同一尝试。
- 性能指标同时记录项目请求实例数和实际有效实例数；不能用较低起始档或用户降档后的结果冒充 12,000 实例性能。

## 5. 产品原则

1. **同一骨架**：Flow 与 Motif 共享 Workspace，不发明新的面板逻辑和项目操作。
2. **Canvas first**：力场直接在结果画布上创建和操纵，Inspector 只负责精调。
3. **先玩后学**：默认示例立即运动；概念通过结果和工具命名自然解释。
4. **模拟服务于构图**：Freeze、Shuffle、候选和导出比物理真实性更重要。
5. **性能边界透明**：初始化时选择合适起始档；创作中性能不足只提出明确建议，不静默改变作品。
6. **结果可保存**：相同 Seed 产生一致的初始分布；用户认可的最终结果以 Frozen Snapshot 为准，不承诺不同 GPU 上连续模拟后的像素级一致。

### 5.1 MVP 决策摘要

以下决策视为 MVP 基线，设计和开发不再自行扩大：

| 决策项 | MVP 结论 | 原因 |
|---|---|---|
| 产品形态 | Motif 同站点下的独立 App | 共用产品语言，同时保持任务聚焦 |
| 实时技术 | WebGPU-only | 避免维护体验明显不同的双渲染链路 |
| 交付类型 | 静态 PNG | 先验证构图价值，不提前进入动画编辑 |
| 输入素材 | P0 内置素材；P1 项目 SVG | 先隔离 SVG 纹理化与导入风险 |
| 力场类型 | Vortex、Attract、Repel | 足以形成方向、聚集和留白三类核心效果 |
| 力场上限 | 8 个 | 保持交互可理解并限制 Uniform/Buffer 复杂度 |
| 运行状态 | Live、Frozen、Recovering、Unavailable | 覆盖正常创作和 WebGPU 异常 |
| 候选 | P0，最多 3 个 | “发现并保留好瞬间”属于核心价值，不是装饰功能 |
| 确定性 | Seed 保证初始状态；Snapshot 保证最终状态 | 跨 GPU 浮点模拟不承诺逐帧完全一致 |
| 移动端 | 只读兼容提示 | MVP 专注桌面创作体验 |

### 5.2 MVP 成功与停止标准

- 若用户能快速生成满意画面，但极少保存或导出，说明产品更像演示而非工具，需要优先改善冻结与交付。
- 若大多数用户依赖默认 Recipe、但不会主动添加力场，说明直接操纵模型仍不清楚，需要先改交互再增加力场类型。
- 若 12,000 实例性能不稳定，但 6,000 实例仍能产生相同设计价值，不以追求数量延迟测试。
- 若静态 PNG 已无法承载核心用户任务，再进入视频或 SVG 方向；MVP 阶段不同时验证两种交付假设。

## 6. 与 Motif 共用的交互骨架

```text
Workspace
├── Top Bar
│   ├── Loeme / Flow + Project
│   ├── Canvas / Fields（P1）/ Preview
│   ├── Undo / Redo
│   ├── Live / Frozen
│   └── Export
├── Left Panel
│   └── Starter / Project Motif Library
├── Main Canvas
│   └── Floating Field Toolbar（Select / Vortex / Attract / Repel）
├── Flow Strip（复用 Motif 的 Recipe 区域）
├── Inspector
└── Status Bar（WebGPU、实例数、帧率）
```

### 6.1 骨架映射

| Motif | Flow | 复用规则 |
|---|---|---|
| Canvas | Canvas | 相同缩放、平移、面板收放和选择反馈 |
| Network | Fields（P1） | P0 与当前 Motif 一样显示 Soon；P1 用于批量管理力场，不阻塞直接画布工作流 |
| Preview | Preview | 最大化冻结结果和导出尺寸预览 |
| Motif Library | Motif Library | 共用内置素材、项目素材和缩略图 |
| Arrange Inspector | Context Inspector | 相同字段、滑杆、分组和 Reset 模式；根据 Flow Strip 或画布选择切换内容 |
| Live | Live / Frozen | 沿用顶栏状态位置，Freeze 是 Flow 特有主操作 |
| Export | Export | 复用抽屉、检查、进度和成功状态 |

### 6.2 不复用的部分

- Flow MVP 不显示 Motif 的 Compose、Arrange、Repeat 和 Seam Check。
- Motif 的 SVG Renderer 不承担实时模拟；Flow 主画布由 WebGPU 渲染。
- Flow 的力场手柄是画布对象，不作为通用矢量对象进入 Motif 编辑模型。

### 6.3 P0 各区域职责

| 区域 | 固定内容 | 交互职责 |
|---|---|---|
| Top Bar | 项目名、Canvas/Fields(Soon)/Preview、Undo/Redo、Live Badge、Freeze/Resume、Candidates、Export | 全局状态和交付；Badge 只显示状态，按钮单独执行操作 |
| Left Panel | Starter / Project 两个 Library Tab、Motif 网格、Import(P1) | 选择参与模拟的图形；不放力场列表，避免与素材混杂 |
| Canvas Header | 当前画板、实例数、FPS、Fit、显示手柄 | 视图状态与性能信息 |
| Floating Toolbar | Select、Vortex、Attract、Repel | 创建和选择力场；沿用 Motif Canvas 左下工具条的样式 |
| Main Canvas | 有限画板、WebGPU 内容、力场手柄、Pasteboard | 直接操纵与结果预览 |
| Flow Strip | Input → Fields → Simulation → Colorway → Output 五张固定卡 | 点击卡片切换 Inspector，不允许增删或重新连线 |
| Inspector | 当前上下文参数；无选择时显示 Simulation | 精确编辑、Reset、字段说明与错误反馈 |
| Candidates Popover | 最多 3 张缩略图、保存/恢复/覆盖/删除 | 保留构图瞬间；从顶栏独立入口打开，不占用 Flow Strip |

### 6.4 模式定义

- **Canvas（P0）**：默认创作模式，显示完整三栏、Flow Strip 和直接操纵画布。
- **Fields（P1）**：批量查看最多 8 个力场的名称、类型、开关和参数，并保留缩小的 Live Preview。P0 顶栏显示 `Soon` 且不可点击，与当前 Motif 的 Network 处理一致。
- **Preview（P0）**：隐藏 Library 和 Flow Strip，最大化 Frozen 输出；Inspector 只显示尺寸、背景和 Export。

P0 不在 Fields 模式尚未实现时复制第二套力场列表。当前力场可通过画布手柄选择；所有力场的启用和删除入口放在 `Fields` Flow 卡选中后的 Inspector 列表中。

P0 的 `Starter` 显示全部内置素材，`Project` 只显示已加入当前项目的 1–6 个素材及权重；Import 入口标记为 P1。在 Project 为空时提供“从 Starter 添加”，不展示文件上传空状态。

## 7. 信息架构与路由

```text
/apps/flow                 应用入口与最近项目
/apps/flow/new             新建项目
/apps/flow/projects/:id    项目工作台
/apps/flow/templates       示例与起始模板（P1）
```

工作台默认进入 Canvas 模式，并加载 Soft Orbit 示例。MVP 不展示空项目。

## 8. 视觉设计方向

Flow 采用“同骨架、异主题”的产品家族策略。布局尺寸、组件位置、操作反馈和响应式规则参考已经开发完成的 Motif App；颜色、画布氛围和动态标识使用 Flow 独立主题。

### 8.1 必须继承的布局

| 区域 | 继承 Motif 的规则 | Flow 内容 |
|---|---|---|
| Top Bar | 64px 高度、品牌与项目名、居中模式切换、右侧主操作 | Canvas / Fields / Preview、Live/Freeze、Export |
| Workspace | 三栏结构、14px 间距和外边距 | 左侧素材与工具、中间画布、右侧 Inspector |
| Left Panel | 224px 宽、Library 卡片和底部导入入口 | Starter/Project Motifs + Field Tools |
| Center | 主画布 + 166px 底部 Recipe 区域 | WebGPU Canvas + Flow Strip |
| Right Panel | 272px 宽、分组 Inspector | Selection / Simulation / Colorway / Output |
| Panels | 16px 圆角、轻边框、轻阴影、Sticky 侧栏 | 保持完全一致 |

Flow 首版应尽量复用 Motif 的 DOM 层级、Spacing Token 和基础组件。除非力场操作确实需要，不为了“看起来不同”改变布局。

### 8.2 Flow 配色：Mineral Current

Motif 当前使用明亮紫色和轻盈白色，气质偏精确、柔和、图样工具。Flow 改为矿物绿、珊瑚橙和深墨画布，表达流动、能量和方向，同时保持专业设计工具的克制感。

| Token | 色值 | 用途 |
|---|---|---|
| `--flow-bg` | `#EEF1EB` | Workspace 背景 |
| `--flow-panel` | `rgba(250, 251, 247, .94)` | 左右面板和工具条 |
| `--flow-text` | `#17201D` | 主文字 |
| `--flow-muted` | `#737D77` | 次级文字 |
| `--flow-line` | `#DDE3DC` | 边框与分隔线 |
| `--flow-canvas` | `#101815` | 默认画布背景 |
| `--flow-accent` | `#197A65` | 选中态、主链接和输入焦点 |
| `--flow-accent-soft` | `#DDF3EA` | 轻选中背景 |
| `--flow-energy` | `#FF6B4A` | Repel、警示和动态能量点 |
| `--flow-live` | `#B7F34A` | Live 状态和 Freeze 成功反馈 |
| `--flow-vortex` | `#A88AF4` | Vortex 手柄 |

### 8.3 颜色使用规则

- 页面框架仍以浅色面板为主，深色只用于 Canvas，不做全屏深色后台。
- 绿色是主操作色；橙色只表示排斥、能量或需要注意的状态。
- Live 使用荧光绿小面积点缀，不用作大面积按钮背景。
- Vortex、Attract、Repel 分别使用紫、绿、橙，并同时提供图标和文字，不能只靠颜色区分。
- 用户 Colorway 只影响画板内容，不反向改变编辑器主题。
- Export 按钮沿用 Motif 的位置和尺寸，但改为深矿物绿渐变。

### 8.4 组件视觉差异

- Motif 卡片保持原结构；Flow 中选中卡片使用绿色边框而非紫色。
- 力场手柄采用半透明同心圆、方向箭头和作用范围，不使用普通矩形控制框。
- Live 时 Canvas 边缘出现极弱的绿色状态光，不使用持续闪烁。
- Frozen 时 Canvas 右上角显示静态 `FROZEN` 胶囊，顶栏按钮切换为 `Resume`。
- Flow Strip 的节点形态比 Motif Network 更轻，只显示 Input、Fields、Simulation、Colorway、Output 五段固定链路。
- 动效时长统一为 160–220ms；模拟运动本身不受普通 UI Transition 控制。

### 8.5 字体与密度

- 继续使用 Geist Sans / Inter，不引入新的品牌字体。
- 标题、Eyebrow、数值输出沿用 Motif 的字号层级。
- GPU 数值、Seed、FPS 和实例数使用 Geist Mono 或系统等宽字体。
- UI 密度与 Motif 一致，不把 Flow 做成游戏化控制台或 Shader IDE。

### 8.6 响应式边界

- MVP 创作工作台最小宽度保持 1080px，与 Motif 一致。
- 1080–1279px 时允许收起 Library；Inspector 保持可见。
- 小于 1080px 显示“建议使用桌面设备”查看模式，不提供完整编辑。
- 高度不足 680px 时允许中心底部 Flow Strip 收起，Canvas 优先保留。

## 9. 核心数据流

Flow 使用固定、可理解的数据流，不开放任意节点连接：

```text
Input → Seed → Fields → Simulation → Colorway → Freeze → Output
```

| 阶段 | 用户心智 | MVP 能力 |
|---|---|---|
| Input | 用什么图形 | P0 选择 1–6 个内置素材；P1 加入项目 SVG |
| Seed | 从哪里开始 | 数量、初始分布、随机种子、Shuffle |
| Fields | 往哪里流 | 创建、移动、删除、开关力场 |
| Simulation | 怎么运动 | 速度、阻尼、自然扰动、边界行为 |
| Colorway | 长什么样 | 选择色板和背景色 |
| Freeze | 定格哪一刻 | 暂停模拟并生成 Working Snapshot，可另存为 Candidate |
| Output | 如何交付 | 导出 PNG |

核心数据流描述计算阶段，不等于 UI 卡片数量。P0 Flow Strip 将 Seed 合并进 Simulation，将 Freeze 合并进 Output，因此固定显示 `Input → Fields → Simulation → Colorway → Output` 五张卡；底层仍保留独立 Seed 和 Snapshot 数据，避免未来扩展时迁移项目模型。

### 9.1 工作台状态模型

Flow 的运行状态与 UI 选择状态分开管理。选择了某个力场，不代表模拟已经暂停。

```text
Initializing
├── 成功 → Live
└── 失败 → Unavailable

Live ──Freeze──→ Frozen ──Resume──→ Live
  │                 │
  ├──Device lost──→ Recovering ←──Device lost──┤
  │                 │
  └─────────────────┴──恢复成功→ Frozen
                         └──恢复失败→ Unavailable
```

| 状态 | 模拟 | 可编辑力场 | 可改配色 | 可导出 | 自动保存 |
|---|---|---|---|---|---|
| Initializing | 否 | 否 | 否 | 否 | 项目配置 |
| Live | 是 | 是 | 是 | 否 | 配置与最近 Snapshot |
| Frozen | 否 | 否；需 Resume | 是 | 是 | 配置与当前 Snapshot |
| Recovering | 否 | 否 | 否 | 否；恢复 Device 后重试 | 配置与最近 Snapshot |
| Unavailable | 否 | 否 | 否 | 否；可下载 P0 原始记录备份 | 配置 |

### 9.2 编辑工具状态

画布始终只处于一种工具状态：

- **Select（V）**：默认工具；选择、拖动力场，拖动画布空白处平移。
- **Vortex（1）**、**Attract（2）**、**Repel（3）**：点击空白处创建一个力场，创建后自动返回 Select，避免连续误加。
- **Pan（Space 按住）**：临时覆盖当前工具；Space + 拖动始终平移画布。
- 滚轮或触控板缩放以指针位置为中心，范围 `25%–400%`。
- Escape 取消尚未完成的创建或返回 Select；Delete/Backspace 删除选中力场，但焦点位于输入框时不触发。

MVP 不提供套索、多选、成组和对齐。一次只选择一个力场。

### 9.3 参数变更对模拟的影响

| 操作 | 是否保留当前位置 | 是否清空速度 | 是否产生新 Seed | 是否进入 Undo |
|---|---:|---:|---:|---:|
| 移动力场 | 是 | 否 | 否 | 是；一次拖动记一条 |
| 修改 Strength/Radius | 是 | 否 | 否 | 是；连续滑动合并 |
| 修改 Speed/Drag/Noise | 是 | 否 | 否 | 是；连续滑动合并 |
| 切换 Colorway | 是 | 否 | 否 | 是 |
| 减少实例数量 | 是；停用高索引实例 | 否 | 否 | 是 |
| 增加实例数量 | 保留已有实例；确定性初始化新增实例 | 仅新增实例 | 否 | 是 |
| 切换 Motif 集合或权重 | 否，重新初始化全部实例 | 是 | 否 | 是 |
| Shuffle | 否 | 是 | 是 | 是 |
| 应用 Recipe | 是 | 否 | 否 | 是 |
| 恢复 Candidate | 恢复 Snapshot | 恢复 Snapshot | 恢复其 Seed | 是 |

### 9.4 Action × State 权限矩阵

| 操作 | Live | Frozen | Recovering | Unavailable |
|---|---|---|---|---|
| 添加/移动/删除力场 | 可用 | 禁用，提示 Resume | 禁用 | 禁用 |
| 修改力场或 Simulation 参数 | 可用 | 禁用，提示 Resume | 禁用 | 禁用 |
| 切换 Motif、数量、Recipe | 可用 | 禁用，提示 Resume | 禁用 | 禁用 |
| Colorway / 背景 | 可用 | 可用，不改变 Snapshot 几何 | 禁用 | 禁用 |
| Freeze | 可用 | 不显示 | 不显示 | 不显示 |
| Resume | 不显示 | 可用 | 不显示 | 不显示 |
| Shuffle | 可用 | 显示 `Resume & Shuffle`；确认后进入 Live | 禁用 | 禁用 |
| Save Candidate | 禁用 | 可用 | 禁用 | 禁用 |
| Restore Candidate | 提示会停止当前 Live，确认后进入 Frozen | 可用，进入 Frozen | 恢复 Device 后可用 | 禁用 |
| Preview | 自动 Freeze 后进入 | 可用 | 禁用 | 禁用 |
| Export PNG | 禁用并提示 Freeze | 可用 | 禁用 | 禁用 |
| Undo/Redo | 可用；不倒放模拟时间 | 可用；只处理冻结前后可恢复操作 | 禁用 | 禁用 |

禁用操作必须说明需要 Resume、Freeze 或恢复 Device，不能只降低透明度。Colorway 在 Frozen 状态属于展示属性：它可以变化并导出，但不改写 Candidate；另存 Candidate 时记录新的 Colorway。

## 10. MVP 核心交互

### 10.1 首次进入

- 默认加载 3 种内置 Motif、12,000 个实例和 2 个力场。
- 画面立即运动，并对默认旋涡显示一次性提示：“拖动这个旋涡，改变图形的流向”。
- 默认处于 Select 工具并选中一个 Vortex；用户完成首次拖动后，再提示通过工具按钮添加新力场。
- Initializing 预热会在 12,000、6,000 或 2,000 中选择起始档并说明结果；进入可编辑状态后不再未经确认改变实例数。

### 10.2 添加力场

1. 用户从画布 Floating Toolbar 选择 Vortex、Attract 或 Repel；按钮进入明确的按下状态，指针显示对应图标。
2. 用户点击画布创建力场，创建位置即力场中心。
3. 新力场自动选中，Inspector 显示其参数。
4. 工具自动返回 Select；用户拖动力场中心改变位置，画面持续响应。
5. Delete/Backspace 或列表中的删除按钮移除力场。
6. 达到 8 个上限时，创建按钮禁用并显示“最多 8 个力场”；不允许点击后无反馈。

### 10.3 选择和移动

- 力场手柄始终位于图形之上，可通过“显示力场”开关隐藏。
- 点击手柄选中；拖动调整位置。
- 选中状态显示作用范围和方向。
- Select 状态拖动画布空白区域执行平移；Field Tool 激活时点击创建，Space + 拖动仍可平移。
- Escape 退出当前工具，返回 Select。
- 拖动手柄时只更新 GPU 预览；松开指针后提交一次项目状态和 Undo 记录。
- 手柄被画布内容遮挡时仍保持最低 3:1 对比度，并提供 36×36px 的最小命中区域。

### 10.4 Freeze 与 Live

- 顶栏显示明确状态：`Live` 或 `Frozen`。
- Freeze 停止状态更新并读取当前 Snapshot；Freeze/Resume 是运行状态操作，不进入 Undo 历史，也不会自动占用 Candidate 槽位。
- Frozen 时仍可切换 Preview、配色和背景，但不能移动力场。
- Resume 从当前状态继续模拟，不重新随机。
- Frozen 状态提供主操作 `Save Candidate`；保存成功后显示缩略图和序号。
- Shuffle 会重置初始分布；若当前 Frozen Snapshot 尚未保存为 Candidate，第一次执行时提示“当前画面尚未保存”，用户确认后继续。该提示在当前项目会话中不重复。
- Freeze 的视觉停止反馈目标在 100ms 内完成；Snapshot 异步捕获目标在 12,000 实例下 P95 500ms、30,000 实例下 P95 1s。捕获期间显示 `Saving snapshot…`，不接受重复 Freeze，但允许继续查看 Frozen 画面。

### 10.5 Quick Recipes

MVP 内置 3 个配方，用于降低空白画布门槛：

| 配方 | 力场组合 | 典型效果 |
|---|---|---|
| Soft Orbit | 中央旋涡 + 偏心吸引 | 柔和环流 |
| Type Space | 中央排斥 + 两侧旋涡 | 预留中央排版空间；不识别文字轮廓 |
| Cross Current | 两个反向旋涡 | S 形对流 |

应用配方会替换当前力场，但不替换素材和色板；支持 Undo。

### 10.6 画板、相机与输出比例

- Flow 项目始终有一个有限画板；模拟边界、Preview 和导出共用同一宽高比。
- 新项目默认 Landscape `16:9`，也可选择 Square `1:1` 或 Portrait `4:5`。
- 工作台中的灰色区域是 Pasteboard；画板外不创建力场，实例也只在画板边界内 Wrap。
- Zoom、Pan 和 Fit 只改变编辑相机，不改变力场位置、模拟范围或导出结果。
- `Fit` 将完整画板居中并保留至少 24px 边距；首次打开和面板收放后自动 Fit，用户手动缩放后不再强制覆盖。
- 改变宽高比会使用相同 Seed 重新初始化实例，并按归一化坐标保留力场位置；若当前 Snapshot 未保存，执行前提示一次。
- 调整最终像素尺寸但不改变宽高比，不重置模拟。
- Frozen/Preview 中不能直接切换到另一宽高比；`Change artboard` 会显示 `Resume & Resize` 确认，确认后返回 Canvas、重新初始化并进入 Live。
- Preview 只显示与当前画板比例匹配的 P0 尺寸预设：16:9 对应 Landscape、1:1 对应 Square、4:5 对应 Portrait。

### 10.7 Inspector 上下文

右侧 Inspector 根据选择显示一个上下文，避免同时堆叠全部参数：

| 当前选择 | Inspector 首屏 |
|---|---|
| 无选择 | Simulation、Canvas、Colorway |
| 单个力场 | Field 参数；下方折叠 Simulation |
| Motif 卡片 | Weight、Size variation、Enabled |
| Frozen Candidate | Candidate 名称、Restore、Delete、Export |
| Preview | Output size、Background、Export |

切换选择不改变 Live/Frozen 状态。Inspector 每组提供 Reset；Field Reset 只重置当前力场，Simulation Reset 需要确认并用相同 Seed 重新初始化。

## 11. 力场产品定义

### 11.1 通用属性

每个力场包含：

- 稳定 ID、可编辑名称与不可变类型。
- 归一化画布位置 X/Y：左上为 `(0,0)`，右下为 `(1,1)`；改变输出尺寸时按比例保持位置。
- Strength：力度，UI 范围 `0.00–1.00`，默认 `0.60`。
- Radius：作用半径，范围为画板短边的 `5%–100%`，默认 `35%`。
- Enabled：临时开关。

所有力场从中心到 Radius 使用平滑衰减，Radius 外不再施力，避免无限作用范围造成难以理解的全局变化。Vortex 使用独立 Direction 控件表达顺/逆时针；UI 不向用户暴露负 Strength。

### 11.2 Vortex

- 用途：形成旋涡、环流和 S 形走势。
- Inspector：Direction（Clockwise / Counter-clockwise）、Strength、Radius。
- 画布反馈：虚线圆环和顺/逆时针箭头。
- 默认值：Clockwise、Strength `0.60`、Radius `40%`。

### 11.3 Attract

- 用途：将图形聚向焦点或构图区域。
- Inspector：Strength、Radius、Soft Core。
- 画布反馈：向内的同心圆。
- Soft Core 防止实例无限聚成一个像素；默认是 Radius 的 `8%`，MVP 不对用户开放。

### 11.4 Repel

- 用途：预留可继续放置标题、Logo 或主体的区域；MVP 不识别其真实轮廓。
- Inspector：力度、作用半径、核心半径。
- 画布反馈：向外扩散的同心圆。
- Core Radius 默认是 Radius 的 `12%`；进入 Core 的实例使用平滑最大排斥力，不产生瞬间跳变。

### 11.5 MVP 限制

- 每个项目最多 8 个力场。
- 不支持自由绘制方向场。
- 不支持图片、文字轮廓或路径生成力场。
- 不支持力场时间轴和关键帧。

### 11.6 力场合成与稳定性

- 每个力场创建时分配稳定 ID；上传 GPU 前按稳定 ID 排序并映射到 8 个固定 Slot。同一 Tick 中基于同一粒子状态、按固定 Slot 顺序计算全部启用力场再求和，因此用户拖动列表显示顺序不会改变结果。由于 `f32` 加法不满足结合律，Engine 不允许使用不稳定容器遍历顺序。
- Vortex 产生切向加速度，Attract 产生指向中心的径向加速度，Repel 产生背离中心的径向加速度。
- Radius 内使用版本化 Smoothstep 衰减，中心奇点使用 Soft Core/Core Radius 处理，禁止对零长度向量直接 Normalize。
- 合成后最大加速度限制为画板短边 `3.0/s²`，最大速度限制为画板短边 `1.2/s`；Speed 是整体时间倍率，不绕过稳定性限制。
- Wrap 后保留速度、上次方向、旋转、缩放和实例属性，只改变位置到对应边界。
- Engine 常量属于 `simulationVersion`；调整常量必须升级版本，旧 Candidate 仍从 Snapshot 恢复。

## 12. Simulation Inspector

### 12.1 全局参数

| 参数 | 默认值 | 范围 |
|---|---:|---:|
| Instance Count | 12,000 | 2,000–30,000 |
| Shape Size | 1.00 | 0.40–1.80 |
| Speed | 1.00 | 0.10–2.20 |
| Drag / 阻尼 | 0.965 | 0.90–0.995 |
| Natural Noise | 0.35 | 0.00–1.00 |
| Seed | 284 | 0–999999 |

参数语义：

- Speed 是模拟时间倍率，不直接覆盖各力场 Strength。
- Drag 越接近 1，图形保留速度越久；UI 对用户显示为“惯性”，以“低 / 中 / 高”作为辅助说明。
- Natural Noise 产生连续方向扰动，不应表现为逐帧抖动。
- Shape Size 是全局倍率；每个实例仍保留由 Seed 决定的 `±25%` 尺寸变化。
- 图形默认沿速度方向旋转，并增加由 Seed 决定的固定角度偏移；当速度接近 0 时保持上一次方向，避免闪烁。

模拟采用固定 `1/60s` 时间步并记录整数 `simulationTick`。每个渲染帧最多补算 4 步，超过部分丢弃：帧率不低于 15 FPS 时应保持真实时间速度；严重卡顿时允许表现为慢动作，并触发降档建议，不能为追赶墙钟时间造成长时间卡死。页面切入后台时暂停 RAF、清空累积时间，返回前台后从原状态继续，不补算离开期间的时间。

PRNG、Noise 和 Simulation Algorithm 分别带独立版本号。初始化与噪声使用产品定义的整数 Hash/PRNG，不依赖 `Math.random()`、墙钟时间或平台纹理噪声。Shuffle 可以使用安全随机源生成新 Seed，但必须先将 Seed 写入项目状态，再初始化 GPU Buffer。

### 12.2 边界行为

MVP 仅支持 Wrap：图形从一侧离开后从另一侧进入。Bounce、Kill/Respawn 和障碍物碰撞进入 P1。

Wrap 以画板边界和实例视觉半径计算：实例完全离开一侧后才从对应另一侧进入，避免在边缘突然断裂。编辑器缩放和平移不改变模拟边界。

### 12.3 素材分配

- 选择 1–6 个 Motif。
- 每个 Motif 支持启用/停用和权重。
- 图形比例由 Normalize 后的 visual bounds 决定。
- MVP 不支持图形之间的精确碰撞。

### 12.4 图形渲染规则

- WebGPU 不直接解析 SVG DOM。P0 内置 Motif 在构建时生成经过审核的透明纹理图集和尺寸元数据。
- 每个实例在 GPU 中保存位置、速度、旋转、缩放、素材索引和颜色索引；Live 状态不创建数千个 DOM 节点。
- P1 用户 SVG 先经过 Motif Normalize Pipeline，再在浏览器本地栅格化进入临时纹理图集。
- 单个素材图集单元的默认质量不低于 512×512；根据导出尺寸可重新生成更高质量图集。
- 素材切换或权重修改会重新初始化粒子，不承诺保留当前构图；执行前对未保存 Snapshot 做同 Shuffle 的一次性提醒。
- 不支持的 SVG 特性沿用 Motif 的导入说明；不能安全栅格化时拒绝加入 Flow，而不是显示空实例。

## 13. Colorway

- 复用 Motif 的 Palette 数据和 Colorway 组件。
- MVP 提供至少 6 组内置色板。
- 支持背景色和 3–6 个前景色。
- 颜色在实例初始化时由 Seed 确定，模拟过程中不闪烁变化。
- Frozen 状态下切换色板不会改变图形位置。

## 14. 候选、保存与历史

### 14.1 Frozen Candidates

- 用户可保存最多 3 个冻结候选；达到上限时必须先删除或替换指定候选，不自动删除最旧候选。
- 候选保存版本化 Packed Snapshot、画板比例、力场参数、Seed、素材版本和 Colorway 引用。
- 每个候选生成一张固定尺寸缩略图；缩略图只是列表预览，不能代替 Snapshot。
- 切换候选进入 Frozen 状态。
- 删除候选不删除项目。
- Candidate 是不可变快照。恢复后修改配色会形成新的 Working Snapshot，不覆盖原候选；用户只能另存新候选或删除原候选。
- 若候选引用的素材版本缺失，仍显示缩略图，但禁用 Restore，并解释缺失素材。

Snapshot 以最终画面可恢复为目标，不保存计算过程中的临时缓冲。P0 粒子步长固定为 32 bytes；30,000 个实例约 960KB，包含 Header 后单个候选必须控制在 1.5MB 以内。若设备存储不足，保存失败不能破坏当前 GPU Frozen Buffer。

Snapshot Header 至少包含：`snapshotVersion`、`projectRevision`、`configRevision`、`simulationVersion`、`prngVersion`、`noiseVersion`、`particleStride`、`particleCount`、`simulationTick`、画板比例、素材 checksum 列表、Buffer byte length 和 Snapshot checksum。每个粒子必须保存位置、速度、上次有效方向、缩放、素材索引、颜色索引与稳定随机属性。

Freeze 捕获协议：

1. 接受 Freeze 后禁止下一次 Compute Dispatch，最多允许当前已提交工作再完成 1 个 Tick。
2. 在 GPU 内将当前粒子 Buffer 复制到独立 Snapshot Buffer，界面目标在 100ms 内显示 Frozen。
3. 使用独立 Staging Buffer 异步 `mapAsync`，不阻塞 Frozen 画面与 Preview。
4. 校验 Header、byte length 和 checksum 后写入 IndexedDB；完成前状态显示 `Saving snapshot…`。
5. 捕获或持久化失败时保留 GPU Frozen Buffer，允许 Retry 或直接导出，不把失败状态标为 Saved。

禁止通过读取可见 Canvas 代替粒子 Snapshot，也禁止在 Live 每帧或定时同步回读全部粒子。

持久化使用原子 `SnapshotBundle`：Header、粒子 Buffer、捕获时完整 Simulation Config、Field Config、画板、素材 checksum 和 Colorway 在同一 IndexedDB Transaction 中提交。恢复时默认使用 Bundle 内的捕获配置，不把最新 Live Draft 强行套到旧粒子状态；只有明确列为展示属性的 Colorway 和背景色可以由用户在 Frozen 后重新应用。

### 14.2 自动保存

- 项目配置、力场、素材引用和候选保存在 IndexedDB。
- Live 运行中的每一帧不进入 Undo 历史，也不持续写入存储。
- 自动保存项目配置和最近一次 Frozen/Candidate Snapshot；不每 10 秒回读 Live GPU 状态。
- Live Draft Config 与 SnapshotBundle 分开保存并各带 Revision。Live 状态关闭或刷新页面后，默认从最近 SnapshotBundle 及其捕获配置恢复为 Frozen，不把更新的 Draft Config 与旧 Buffer 混用。
- 若 Draft Revision 新于 Snapshot，恢复后提示“有较新的实时参数，但运行状态未捕获”，用户可选择 `Restart latest settings`，以 Draft 的 Seed 和配置重新初始化为 Frozen；若从未 Freeze，则直接走该路径。
- 配置修改采用 500ms 防抖保存；保存状态沿用 Motif 顶栏的 `Saving / Saved` 反馈。
- 项目 Schema 必须带版本号；不兼容迁移失败时保留原始记录并提供 P0 紧急原始记录下载，不静默清空。该只读备份不等于 P1 的正式项目 JSON 导入导出格式。

### 14.3 Undo / Redo

纳入历史：添加、移动、删除力场，修改参数，应用配方，Shuffle、画板比例、素材集合，以及 Candidate 保存、恢复、替换和删除。Freeze/Resume 不进入编辑历史。连续拖动或滑杆调整只生成一个历史记录。

Undo/Redo 的行为规则：

- 每个已提交操作记录配置 Patch，并在 GPU 内保留对应粒子状态 Buffer；Undo/Redo 恢复 Buffer、配置和记录时的 Live/Frozen 模式，不尝试通过反向计算倒放模拟。
- 拖动开始记录操作前状态，松开记录操作后状态；滑杆从 pointer/key interaction 开始到结束合并为一条。
- Shuffle 的 Undo 必须恢复 Shuffle 前的位置与速度，而不只是旧 Seed；改变画板比例和素材集合遵循相同规则。
- Candidate 保存/删除可以 Undo；Candidate Snapshot 不重复复制进普通历史条目，而以稳定 ID 引用。删除 Candidate 后，在相关历史条目被淘汰前保留其数据。
- 历史受双重预算约束：最多 40 条且 GPU/CPU Snapshot 总计不超过 64MB；必须至少保证 12,000 实例下 20 条。超过预算时从最旧且未被 Candidate 引用的条目开始淘汰。
- Undo 历史不跨浏览器会话保存，Device lost 后允许清空并说明；Candidate、当前 Frozen Snapshot 和项目配置必须跨会话保存。

### 14.4 项目生命周期

- `/apps/flow` 显示最近项目；每张卡包含项目名、最近 Snapshot 缩略图、更新时间和画板比例。
- 新建项目总是复制当前版本的 Starter，不与模板保持在线引用。
- 项目名默认为 `Untitled Flow`，支持顶栏直接重命名；空名称在失焦时回退为上一个有效名称。
- 项目列表支持 Duplicate 和 Delete；Delete 需要确认，MVP 不提供云端回收站。
- Duplicate 复制配置、素材引用和 Candidates，但生成新项目 ID、创建时间和独立 Snapshot 记录。
- IndexedDB 不可用或写入失败时，编辑器继续当前会话，但顶栏持续显示 `Not saved`，并在关闭页面前使用浏览器离开提醒。
- 找不到项目时显示“项目不存在或已被删除”，提供返回 Flow 首页和新建项目，不自动创建同 ID 空项目。
- 项目数据损坏时先保留原始记录，尝试恢复配置与最后有效 Snapshot；失败后显示错误代码和 P0 原始记录备份下载入口。

## 15. Preview 与导出

### 15.1 Preview

- Preview 默认要求 Frozen；若仍为 Live，进入时自动 Freeze 并提示。
- 显示最终比例、裁切边界和背景色。
- Preview 以当前输出尺寸和比例重新渲染，不拉伸工作台截图。
- UI 直接显示最终像素尺寸，不使用容易与设备 DPR 混淆的 1×/2×/4× 倍率概念。
- 返回 Canvas 后保持 Frozen，不自动 Resume。

### 15.2 MVP 导出

- PNG，默认 1920×1080。
- 预设尺寸：Square 2048×2048、Landscape 1920×1080、Portrait 1080×1350。
- P0 只使用预设尺寸；P1 自定义尺寸范围为每边 `256–4096px`、总像素不超过 8.4MP，超过时阻止导出并解释限制。
- 支持透明背景；透明时以直通 Alpha 导出，并提前提示半透明边缘效果。
- 导出不包含力场手柄、状态信息和编辑 UI。
- 统一以 sRGB 输出；PNG 的像素尺寸必须与用户选择完全一致。
- 导出使用 Frozen Snapshot 在离屏目标中重新渲染，不读取缩放后的可见画布，也不依赖 `preserveDrawingBuffer`。
- 若目标分辨率需要更高质量 Motif 纹理，导出前本地重建纹理图集并显示进度。
- 导出失败后保留 Frozen 状态和设置，提供 Retry；不生成 0 字节或部分文件。

### 15.3 导出检查

导出按钮仅在存在有效 Frozen Snapshot 时可用。导出前检查：

1. WebGPU Device 可用，或已有可由新 Device 恢复的 Snapshot。
2. Snapshot 引用的素材和纹理均存在。
3. 输出尺寸在设备与产品限制内。
4. 预计显存预算可接受；不足时建议降低尺寸，而不是自动改变用户选择。
5. 透明背景设置与 Preview 一致。

导出成功后显示文件名、尺寸、文件大小与 `Export again`，不自动 Resume 模拟。

### 15.4 PNG 技术契约

P0 导出链路固定为：

```text
Frozen Particle Buffer
→ rgba8unorm-srgb 离屏 Render Texture
→ copyTextureToBuffer
→ 去除 256-byte bytesPerRow Padding
→ sRGB 解码为线性 RGB
→ 在线性空间将 Premultiplied Alpha 转为 Straight Alpha
→ 重新编码为 sRGB；Alpha 为 0 时强制 RGB 为 0
→ Worker 编码 PNG
```

- 不使用 `canvas.toBlob()`、`getCurrentTexture()` 截图或 `preserveDrawingBuffer`。
- CSS sRGB 色值进入 Shader 前转为线性值，由 sRGB Render Target 完成输出编码。
- 透明导出必须在线性空间反预乘；禁止直接用 sRGB 编码后的 RGB 除以 Alpha，避免合成到深色或浅色背景时出现黑边、白边和色偏。
- PNG 编码和行 Padding 整理尽量放入 Worker，完成后及时释放 Readback Buffer、Texture 和中间 RGBA 数据。
- 连续导出不得改变主画布 Snapshot、Colorway 或 Live/Frozen 状态。

### 15.5 暂不包含

- SVG、PDF、视频、GIF 和帧序列导出。
- 30,000 个独立 SVG 元素的矢量化交付。
- 动画时长、循环和关键帧编辑。

## 16. WebGPU 与兼容性

- WebGPU 是 Flow MVP 的核心运行条件，不提供功能不完整的 Canvas 2D 模拟降级。
- 应用只在 HTTPS 或本地开发安全上下文中提供；启动时依次检测安全上下文、`navigator.gpu`、Adapter、Device、所需纹理尺寸和 Buffer 限制。
- 不支持时展示独立兼容页，说明推荐浏览器和设备要求，并允许返回 Motif。
- Device lost 时立即停止提交 GPU 工作，保留项目配置与最近 Snapshot，并自动尝试恢复一次；失败后进入 Recovering 页面，由用户触发“重新启动画布”。
- 恢复成功后进入 Frozen，不自动继续运动；避免用户在恢复期间错过构图状态。
- 根据 Adapter 限制和实测帧率提供 2,000、6,000、12,000、30,000 四档实例等级。进入编辑后如需降档，必须由用户确认；降档停用高索引实例，同时降低 Compute Dispatch 和 Draw Count，但不重新初始化其余实例。
- 状态栏显示 WebGPU 状态、实例数和近似帧率，不暴露显卡型号等不必要信息。

### 16.1 性能分档规则

1. Initializing 阶段以 6,000 实例、用户当前 Canvas Backing Size（DPR 上限 2）预热最多 1 秒，结合 Adapter Limits 选择 12,000、6,000 或 2,000 起始档；1440×900 仅作为团队 QA 基准，不是运行时固定视口。
2. 进入可编辑状态后继续监测；连续 3 个 1 秒窗口出现帧间隔中位数差于 33.3ms，或 P95 差于 50ms，且页面可见、未在拖动时，只提示建议降至下一档，不自动执行。
3. 用户确认后停用高索引实例、提交一次可 Undo 的项目变更；`effectiveCount` 同时控制 Compute Dispatch 和 Render Instance Count，确保计算与绘制都有实际收益。其余实例位置、速度和 Seed 不变。
4. 提示后至少冷却 10 秒；用户拒绝或 Undo 后，当前会话不再次提示，但状态栏保留性能警告。
5. 性能恢复后不自动升档；用户可手动提高。重新启用的高索引实例按 Seed 与索引确定性初始化，不使用停用前的陈旧时间状态。
6. 30,000 是明确标记的 High 档，仅由用户主动选择。

性能统计以用户可见的 `requestAnimationFrame` 帧间隔为主，不强制依赖可选的 `timestamp-query`；同时每秒异步采样一次 `queue.onSubmittedWorkDone()` 延迟，以发现 CPU 仍能提交但 GPU Queue 已持续积压的情况。采样不得逐帧 Await 或阻塞主循环。浏览器标签页不可见、系统处于省电模式、窗口 Resize 或正在导出时，不采集降档样本。Initializing 选择的起始档写入项目；之后实例数只有用户操作才能改变，不能静默改变作品规模。

若 Queue 完成延迟连续 3 个样本超过 200ms，即使 RAF 表面正常也触发低性能建议；诊断面板只显示“GPU backlog”，不暴露硬件型号。

### 16.2 Snapshot 与跨设备一致性

- Seed 生成器、实例索引分配、初始位置、素材索引、颜色索引和尺寸扰动必须由产品自有算法定义并带版本号。
- 相同版本、Seed 和配置应产生相同初始分布。
- 连续 WebGPU 浮点模拟只要求视觉一致，不保证不同浏览器和 GPU 每一帧位级相同。
- Candidate 通过保存位置、速度、方向、缩放和实例属性的版本化 Packed Snapshot 保证最终构图可恢复。
- 项目升级如果改变模拟算法，旧 Candidate 仍按 Snapshot 恢复；只有用户主动 Shuffle 或 Reset 后才使用新算法。

### 16.3 GPU 错误与 Device lost 恢复协议

- `device.lost`：执行完整 Device 恢复；主动页面卸载或应用主动 `device.destroy()` 不显示 Recovering。
- `device.onuncapturederror` 中的 Validation Error：停止当前操作，进入不可恢复的开发/兼容错误状态并记录分类码；不重建相同 Pipeline 形成循环。
- Out-of-memory：释放当前操作创建的临时资源；模拟阶段建议降低实例档，导出阶段建议降低尺寸，主画布 Snapshot 保持 Frozen。
- Device lost 后取消 RAF、停止提交命令，并使用初始化 Generation Token 阻止旧异步任务在新 Device 建立后写回状态。
- 依次执行 Context unconfigure、重新申请 Adapter/Device、重建 Pipeline、纹理图集、Uniform/Storage Buffer 和 Bind Group。
- 每次丢失只自动重试一次；自动失败后进入 Recovering，不形成无限循环。
- 最近持久化 Candidate/Working Snapshot 目标在 5 秒内恢复为 Frozen；无法恢复尚未 Freeze 的最后 Live 帧，必须明确提示用户恢复到了哪个 Snapshot。
- 没有 Snapshot 时用已保存 Seed 和配置重新初始化为 Frozen，并显示“实时状态未保存”。
- Device lost 后 Undo GPU Buffer 可以清空，但项目配置和 Candidate 不得删除或覆盖。

### 16.4 内置 Motif 纹理契约

- P0 内置素材以同尺寸 `texture_2d_array` 构建，每个 Motif 一层，使用至少 512×512 的单色 Alpha Mask 并生成 Mipmap。
- P0 Colorway 按实例为 Alpha Mask 着色；不承诺保留内置 SVG 的多色槽。多色槽纹理属于后续能力。
- 高分辨率导出可换用更高分辨率图集，但不得重新计算素材 Bounds、中心或实例变换。
- 项目保存内置素材的规范化内容 checksum 和版本，不只保存可变的在线 Library ID。
- P1 用户 SVG 不能仅声明“复用 Motif Pipeline”。进入开发前必须把 Normalize、白名单、Bounds、checksum 和栅格化固化为真实共享模块；当前实现不完整时，Flow Import 保持关闭。
- P1 初始输入限制沿用当前已验证基线：单文件不超过 300KB、节点不超过 1,200、Path 字符预算不超过 100,000；后续只能通过测试放宽，不能静默接受后再产生空实例。

## 17. MVP 范围

### 17.1 P0：必须完成

- 复用 Motif Workspace 骨架和响应式面板。
- WebGPU 实例渲染与 Compute Shader 状态更新。
- 从内置 Library 选择 1–6 个 Motif，支持启用和权重；2,000–30,000 实例数量控制。
- Vortex、Attract、Repel 三种力场。
- 画布创建、选择、拖动、删除力场。
- 力度、范围、速度、阻尼、噪声和 Seed。
- Live、Freeze、Resume 和 Shuffle。
- 3 个 Quick Recipes。
- 复用 Colorway，支持背景色。
- 最多 3 个 Frozen Candidates。
- Landscape、Square、Portrait 三种画板比例和 PNG 尺寸预设，支持透明背景。
- 性能预热、起始档选择、低性能建议、手动质量档位和状态反馈。
- Undo/Redo、本地项目保存、迁移失败时的原始记录备份下载和 WebGPU 错误状态。

### 17.2 P1：MVP 完整体验

- 导入用户 SVG，并复用 Motif Normalize Pipeline。
- 自定义导出尺寸，单边不超过 4096px、总像素不超过 8.4MP。
- Bounce 和 Kill/Respawn 边界行为。
- 正式、可重新导入的项目 JSON 导入导出。

### 17.3 明确不做

- 路径流场、文字避让、图片方向场和手绘向量场。
- 无缝 Repeat、Tile 接缝检查和纺织生产文件；需要无缝图样时使用 Motif。
- 图形间碰撞、刚体、流体或布料模拟。
- 3D、景深、灯光和材质系统。
- 动画时间轴、音频响应和视频导出。
- AI 生成素材或 Prompt 生成力场。
- 多人协作、云同步和模板市场。
- 移动端完整创作；移动端 MVP 仅支持查看项目兼容说明。

## 18. 验收场景

### 场景 A：首次创建旋涡

用户进入默认示例，选择 Vortex 并点击画布；新旋涡出现并立即改变图形运动方向。用户拖动旋涡时，结果连续响应。

### 场景 B：预留排版空间

用户应用 Type Space 配方，中央区域形成可继续排版的留白；调整 Repel Radius 后，留白范围同步变化。MVP 不导入或识别标题与 Logo，也不承诺围绕其真实轮廓避让。

### 场景 C：反向双旋涡

用户添加两个 Vortex，将其中一个方向设为 Counter-clockwise，画面形成可辨识的双向对流。

### 场景 D：冻结候选

用户点击 Freeze，画面停止且状态变为 Frozen；保存候选后 Resume，原候选仍可恢复且位置一致。

### 场景 E：导出 PNG

用户在 Frozen 状态选择 1920×1080，导出文件不包含力场手柄，颜色与 Preview 一致。

### 场景 F：性能降级

设备在 12,000 实例下持续低于阈值，系统建议降至 6,000；用户确认后构图中前 6,000 个实例位置不变，并可 Undo 恢复更高数量。

### 场景 G：WebGPU 不可用

浏览器不支持 WebGPU 时，用户看到明确说明、推荐环境和返回 Motif 的入口，不出现无限加载或空白画布。

### 18.1 P0 验收矩阵

| 能力 | 前置条件 | 操作 | 可验收结果 |
|---|---|---|---|
| 默认项目 | 支持 WebGPU、首次进入 | 打开 `/apps/flow/new` | 3 秒内出现完整工作台；初始化后画面运动，默认有 2 个力场 |
| 创建力场 | Live、力场少于 8 个 | 选择 Repel 后点击画板 | 100ms 内出现手柄并影响运动；工具回到 Select；Undo 可完整移除 |
| 移动力场 | Live、选中力场 | 拖动手柄再松开 | 拖动期间连续反馈；松开后只增加 1 条 Undo 记录 |
| 参数合并 | Live、选中力场 | 连续拖动 Strength 滑杆 2 秒 | 结果连续变化；松开后只增加 1 条 Undo 记录 |
| 数量降档 | 12,000 实例连续低于阈值 | 用户确认系统的 6,000 建议 | 前 6,000 个实例位置不变；出现 Undo；10 秒内不重复提示 |
| Freeze | Live、12,000 实例 | 点击 Freeze | 100ms 内视觉停止；P95 500ms 内捕获 Snapshot；画面最多再推进 1 Tick |
| 保存候选 | Frozen、候选少于 3 个 | 点击 Save Candidate | 出现缩略图；刷新页面后候选仍可恢复为相同构图 |
| 候选上限 | 已有 3 个候选 | 再次 Save Candidate | 不自动覆盖；要求选择覆盖目标或取消 |
| 页面恢复 | Live 状态下关闭页面 | 重新打开项目 | 恢复最近 Snapshot 为 Frozen；无 Snapshot 时以配置重新初始化为 Frozen |
| 后台暂停 | Live | 切换标签页 10 秒后返回 | 不补算 10 秒；从离开时的状态继续，无大幅跳变 |
| PNG 导出 | 有 Frozen Snapshot | 导出 Landscape | 得到 1920×1080 PNG；不含手柄；与 Preview 在容许抗锯齿差异内一致 |
| 透明导出 | Frozen、透明背景 | 导出 PNG | 背景 Alpha 为 0；图形边缘无背景色污染 |
| Device lost | 已有 Frozen Snapshot | 模拟 Device lost | 停止提交；恢复后进入 Frozen；Snapshot 和项目配置不丢失 |
| 无 WebGPU | 不支持或非安全上下文 | 打开 Flow | 显示具体原因和建议动作；可返回 Motif；无无限 Loading |

### 18.2 空状态、限制与失败状态

| 状态 | 产品反馈 | 可继续动作 |
|---|---|---|
| 没有启用 Motif | 画布不运行，提示“至少选择一个图形” | 打开 Library 并选择素材 |
| 没有力场 | 图形保持轻微基础漂移，提示添加力场 | 添加力场或应用 Recipe |
| 8 个力场 | 创建工具禁用并说明上限 | 删除或关闭已有力场 |
| 3 个 Candidates | Save 禁用，展示覆盖或管理入口 | 覆盖、删除或取消 |
| 存储空间不足 | 保留当前 Frozen 画面，说明候选未保存 | 删除候选、导出 PNG、重试 |
| 纹理图集失败 | 标出具体 Motif，不渲染空白实例 | 移除素材或返回 Motif 修复 |
| 导出显存不足 | 保留设置和 Snapshot | 选择更小的尺寸预设后重试 |
| Shader / Validation Error | 停止当前操作，显示错误分类码，不循环重建 | 返回项目列表；开发环境查看诊断 |
| Device 恢复失败 | 进入 Recovering，不清空项目 | 重试、P1 下载项目 JSON、返回项目列表 |
| 项目版本过新 | 只读展示项目元数据，不尝试降级写回 | 下载 P0 原始记录备份或升级应用 |

## 19. 非功能需求

### 性能

- 推荐桌面设备 12,000 实例下目标 60 FPS，最低可接受 30 FPS。
- 力场拖动到画面反馈的目标延迟低于 100ms。
- 默认项目从路由可交互到 WebGPU 首帧的 P75 目标低于 3 秒；超过 1 秒必须显示阶段化初始化反馈。
- Freeze 视觉停止 P95 低于 100ms；Snapshot 捕获在 12,000 实例下 P95 低于 500ms、30,000 实例下低于 1 秒；IndexedDB 持久化 P95 低于 1 秒。
- 1920×1080 PNG 导出 P95 低于 5 秒；2048×2048 PNG 导出 P95 低于 8 秒。
- 12,000 实例连续运行 60 秒时，帧率中位数不低于 45 FPS，P95 帧间隔不高于 33.3ms。
- 单帧模拟不进行 GPU → CPU 全量粒子回读。
- Live 状态不逐帧触发 React 状态更新和持久化。
- 主线程 Long Task 超过 100ms 时记录开发诊断；拖动力场时不得由 React 重渲染全部实例。
- 每个 Candidate Snapshot 建议不超过 1.5MB，单项目本地数据目标不超过 10MB（不含用户导入源文件）。

### 可用性

- 所有力场类型同时使用图形、颜色与文字区分。
- Inspector 数值支持键盘输入、滑杆和 Reset。
- Freeze、Shuffle 和 Export 提供键盘可访问名称。
- Reduced Motion 用户首次进入默认 Frozen，可主动开始模拟。
- Canvas 工具必须可通过键盘切换；Inspector 中所有数值均可不用拖动手柄完成设置。
- 非装饰文字与背景满足 WCAG AA；力场选中和错误状态不只依赖颜色。
- Toast 不抢夺焦点，错误对话框关闭后将焦点返回触发操作。

### 浏览器与设备测试矩阵

- 发布测试覆盖 macOS 和 Windows 上最近两个稳定大版本的 Chrome、Edge，以及 macOS 上最近两个稳定大版本的 Safari。
- 浏览器是否进入编辑器最终以运行时能力检测为准，不只依据 User-Agent。
- 集成显卡和独立显卡各至少覆盖一台测试设备；最低档设备必须能以 2,000 实例完成主流程。
- 浏览器缩放 `80%–200%`、系统 DPR `1–2` 下，手柄命中区和导出像素尺寸保持正确。
- MVP 不保证移动浏览器、虚拟机、远程桌面或被企业策略关闭 WebGPU 的环境可编辑。

### 安全

- 用户 SVG 必须经过 Motif 的 Normalize 与安全白名单。
- 不执行 SVG 中的脚本、外链、事件和不受支持的 Filter。
- PNG 导出在本地完成，不上传用户素材和画面。
- 不把 Shader 编译错误、Adapter 信息或用户素材内容发送到分析系统；错误遥测仅使用归类代码。
- 对 GPU Buffer 和纹理尺寸执行产品级上限检查，不直接使用用户输入创建无界资源。

## 20. 建议埋点

- `flow_project_created`
- `flow_webgpu_ready`：initial_quality、init_duration_bucket
- `flow_field_added`：type、count_after
- `flow_field_moved`：type，不记录精确坐标
- `flow_recipe_applied`：recipe
- `flow_shuffled`
- `flow_frozen`：time_to_first_freeze、snapshot_duration_bucket、requested_count、effective_count、field_count
- `flow_resumed`
- `flow_candidate_saved`
- `flow_candidate_restored`
- `flow_export_started`：size、transparent
- `flow_export_succeeded` / `flow_export_failed`
- `flow_initial_quality_selected`：quality、reason_bucket
- `flow_quality_reduction_suggested` / `flow_quality_changed`：from、to、fps_bucket、accepted
- `flow_device_lost` / `flow_device_recovered`：reason_bucket、attempt
- `flow_webgpu_unavailable`：reason_bucket

不采集用户 SVG 内容、精确构图坐标、导出图片或 GPU 型号。

## 21. 发布守门规则

MVP 只有同时满足以下条件才可进入公开测试：

1. 默认示例在支持 WebGPU 的推荐浏览器上可稳定运行 10 分钟。
2. 三类力场的创建、移动、删除和 Undo 均通过验收。
3. Freeze 后的画面与 PNG 导出视觉一致。
4. Device lost、WebGPU 不可用和低性能设备均有明确恢复或退出路径。
5. Flow 与 Motif 的顶栏、面板、素材库、Inspector 和 Export 交互不存在两套规则。
6. 10 个固定 Seed × 4 个实例档位在同一算法版本内重复初始化，CPU 参考数据和上传前 Buffer 字节一致。
7. 60Hz 与 120Hz 环境各运行 10 秒，`simulationTick` 差异不超过 1；后台停留 30 秒 Tick 不增长。
8. 三个支持系统/浏览器组合完整通过 P0 验收矩阵；未通过的环境不进入正式支持列表。
9. 连续导出 20 次没有 0 字节文件、状态污染或持续显存增长。
10. 项目刷新、Candidate 恢复和一次 Device lost 演练均不丢失最近持久化 Snapshot。

## 22. MVP 产品结论

Flow MVP 不是完整的粒子动画软件，也不是通用 Shader 编辑器。它是 Loeme 现有参数化图形工作台中的第二种编排方法：Motif 使用规则与随机布局建立静态图样，Flow 使用可直接操纵的力场建立具有方向和节奏的构图。

最小闭环固定为：

```text
默认动态示例
→ 添加或移动力场
→ 调整全局运动参数
→ Freeze
→ 保存候选
→ 导出 PNG
```

任何不能明显提高这个闭环成功率的能力，都不进入 MVP。

## 23. 推荐交付切片

开发按可独立演示的纵向切片推进，每一阶段都保持同一 Workspace 骨架：

| 切片 | 交付结果 | 退出条件 |
|---|---|---|
| 0. Shell & Theme | `/apps/flow` 路由、Motif 同骨架、Mineral Current 主题、静态默认画面 | 三栏和 Flow Strip 在目标尺寸稳定，无 WebGPU 也有明确兼容页 |
| 1. GPU Core | 固定时间步、确定性初始化、Alpha Mask 实例渲染、Wrap | 12,000 实例基准、Seed Fixture 和后台暂停通过 |
| 2. Direct Fields | 三类力场、手柄、Toolbar、Inspector、Recipe | 创建/拖动/删除/方向/范围和 8 个上限通过 |
| 3. State & History | Live/Frozen、Packed Snapshot、Undo/Redo、性能降档 | 状态矩阵、Freeze 阈值、Shuffle Undo 和 Device lost 演练通过 |
| 4. Candidates & Project | 3 个 Candidate、IndexedDB、最近项目、Duplicate/Delete | 刷新恢复、配额失败和 Schema Migration 通过 |
| 5. Preview & PNG | 三种比例、透明背景、离屏 sRGB PNG | 像素尺寸、Alpha、连续 20 次导出和视觉基准通过 |
| 6. Release Hardening | 可访问性、浏览器矩阵、埋点、错误文案 | §18、§19、§21 全部守门项通过 |

### 23.1 不阻塞开发的内容选择

以下内容需要设计阶段确定，但不改变引擎与产品范围：

- 默认 3–6 个内置 Motif 的具体造型。
- 6 组 Colorway 的最终色值与命名。
- Starter 项目名称与默认 Frozen 缩略图。
- Quick Recipe 的展示名称和缩略图。
- 兼容页、性能降档和未保存提示的最终文案。
