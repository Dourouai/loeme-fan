# Loeme 三款 App 与官网升级规划框架

> 版本：v0.1  
> 日期：2026-07-15  
> 用途：产品规划、设计评审与官网改版的统一讨论底稿

## 1. 总体方向

Loeme 不只是单个工具，而是一组面向视觉创作者的浏览器端生成式设计工具。

品牌主张建议统一为：

> **Small tools. Serious play.**  
> 用轻量、专注、可交付的工具，把视觉系统变成可以直接操作的创作材料。

整体采用“一个品牌、三款独立 App、一套共用底层”的产品结构：

```text
Loeme
├── Motif：组织图形
├── Flow：驱动图形
└── Morph：生成图形
```

三款 App 各自解决一个清晰问题，但共享 Workspace、素材、项目、导出和品牌体验，形成可以互相接力的创作链路。

## 2. 三款 App 的产品定位

| App | 一句话定位 | 核心动作 | 主要输入 | 主要输出 | 当前阶段 |
|---|---|---|---|---|---|
| Motif | 参数化 SVG 构图与图案工具 | Compose / Arrange / Repeat | 内置或导入 SVG | SVG | 已进入 MVP 实现 |
| Flow | 用力场编排大量图形的动态构图工具 | Add Field / Simulate / Freeze | 内置或 Motif 素材 | PNG | PRD 与技术验证 |
| Morph | 将有机生长过程转为可编辑矢量的生成工具 | Seed / Grow / Shape | 预设与笔刷 | SVG / PNG | PRD 与可行性验证 |

### 2.1 Motif：组织图形

- 用户价值：快速完成散点、网格、组合与无缝重复构图。
- 核心闭环：选素材 → 组合/排列 → 调色 → 预览 → 导出 SVG。
- 差异点：矢量原生、参数可复现、结果可继续编辑。
- 产品角色：三款 App 的基础产品，也是共享素材体系和 Workspace 的起点。

### 2.2 Flow：驱动图形

- 用户价值：不写代码，也能用旋涡、吸引和排斥形成有方向感的复杂构图。
- 核心闭环：选素材 → 添加力场 → 实时调整 → Freeze → 导出 PNG。
- 差异点：把粒子模拟变成直接操作的设计工作流，而不是技术演示。
- 产品角色：提供更强的动态探索与视觉冲击，是 Motif 素材的进阶用法。

### 2.3 Morph：生成图形

- 用户价值：快速生成细胞、珊瑚、迷宫、斑点等有机纹理，并得到可编辑矢量。
- 核心闭环：选预设 → 播种 → 生长 → Freeze → Shape → 导出。
- 差异点：把 Reaction–Diffusion 从抽象参数变成设计语言，并控制矢量复杂度。
- 产品角色：为 Loeme 生态生产新的原始图形和纹理素材。

## 3. 产品之间的关系

三款 App 不应只是并列展示，还应形成轻量的素材流转：

```text
Morph 生成有机 SVG
        ↓
Motif 组合、阵列与 Repeat
        ↓
Flow 进行流场编排与高密度构图
```

首阶段不必实现完整的跨 App 云同步，可以分三步推进：

1. **统一格式**：三款 App 使用兼容的 SVG 素材规范与项目元数据。
2. **本地流转**：提供“Open in Motif / Use in Flow”或下载后导入。
3. **Loeme Library**：有账号和云项目后，再建立跨 App 素材库与项目中心。

## 4. 共用产品底座

### 4.1 应优先共用

- 顶栏、三栏 Workspace、Inspector、状态栏和导出抽屉。
- 项目命名、Undo / Redo、本地保存、Reset 和错误反馈。
- Motif Library、缩略图、颜色方案和素材导入规则。
- 缩放、平移、Fit、选择态、滑杆和参数分组。
- 兼容性检测、性能降级提示、导出进度与成功状态。
- 埋点命名：首次有效结果、核心动作、Freeze、Export Started / Succeeded / Failed。

### 4.2 应保持独立

- 每款 App 的主任务、动词和模式切换。
- 画布渲染技术：Motif 偏 SVG，Flow 偏 WebGPU，Morph 为 WebGPU + 矢量提取。
- 主题强调色和画布氛围。
- 导出能力与性能边界。

原则是：**骨架一致、任务独立、视觉可辨、素材互通。**

## 5. 建议的产品优先级

### Phase 1：把 Motif 做成可信工具

- 完成当前 MVP Gate 和 SVG 导出闭环。
- 跑第一轮真实用户测试，验证 3 分钟首次构图。
- 沉淀 Workspace、素材、参数控件和导出的共用组件。
- 官网先以 Motif 为主入口，Flow 与 Morph 进入 Coming Soon / Preview。

### Phase 2：验证 Flow 的直接操纵价值

- 先做 WebGPU 性能原型与 Soft Orbit 默认示例。
- 验证添加、移动力场是否无需解释。
- 只交付静态 PNG，暂不扩展视频和 SVG。
- 复用 Motif Library，验证跨产品素材使用。

### Phase 3：验证 Morph 的“生成到矢量”闭环

- 先验证模拟、Freeze、轮廓提取和锚点简化。
- 优先保证默认预设 30 秒内有效、3 分钟内可导出。
- 验证生成的 SVG 是否值得进入 Motif 继续创作。

排序依据：Motif 能沉淀共用底座；Flow 更容易以实时画面展示品牌吸引力；Morph 的技术链更长，适合在矢量处理与 WebGPU 经验稳定后推进。

## 6. 官网升级目标

官网需要从“两个项目的展示页”升级为“Loeme 产品家族入口”，同时承担四个任务：

1. 让新访客在 5 秒内理解 Loeme 是什么。
2. 让用户看懂三款 App 的区别，并快速选对入口。
3. 用可互动的视觉结果证明产品价值。
4. 为未上线产品积累兴趣，而不是制造虚假可用感。

## 7. 官网信息架构

```text
/
├── Hero：品牌主张 + 三款 App 的统一价值
├── Product Family：Motif / Flow / Morph
├── How They Connect：Generate → Arrange → Flow
├── Interactive Showcase：可操作或可拖动的结果演示
├── Principles：Vector / Parametric / Local-first / Play
├── Updates：版本进展、实验与案例
└── Footer：About / Contact / Legal

/apps/motif
/apps/flow
/apps/morph
/about
/updates（可后置）
```

每款 App 的产品页统一采用：

```text
一句话价值
→ 真实结果演示
→ 三步工作流
→ 典型使用场景
→ 关键能力
→ 输出与兼容性
→ CTA
```

## 8. 首页首屏建议

### 核心文案结构

- Eyebrow：`LOEME CREATIVE TOOLS`
- 标题：保留 `Small tools. Serious play.`
- 副标题：`Browser-based tools for generating, arranging, and moving visual systems.`
- 主 CTA：`Explore the apps`
- 次 CTA：当前阶段指向 `Open Motif`
- 状态信息：不要再写固定的 “02 tools are live”，改成清晰的产品状态标签。

### 产品卡片状态

| App | 官网状态 | CTA |
|---|---|---|
| Motif | Available / Beta | Open Motif |
| Flow | In development / Preview | View preview / Join updates |
| Morph | In development / Experiment | View concept / Join updates |

卡片必须展示真实产品画面或代表性结果，并用一句动词区分：

- Motif — Arrange vector systems.
- Flow — Move forms with fields.
- Morph — Grow organic shapes.

## 9. Dustworks 的处理建议

当前官网把 Dustworks 与 Motif 并列为正式产品，但它与新的设计工具产品线定位不完全一致。建议二选一：

### 推荐方案：移入 Labs

- 首页主产品只保留 Motif、Flow、Morph。
- Dustworks 放入 `Experiments / Labs`，作为粒子、自动化与交互实验。
- 保留访问入口，但不参与“三款 App”的品牌叙事和产品数量。

### 备选方案：暂时隐藏

若近期不维护或体验尚未达到公开标准，从主导航和首页移除，路由继续保留。

## 10. 官网升级范围

### P0：这次必须完成

- 首页从 2 款调整为 3 款 App 产品家族。
- 统一三款 App 的定位、短文案、状态和 CTA。
- 增加 Generate → Arrange → Flow 的产品关系说明。
- 处理 Dustworks 的层级。
- 手机端可清晰浏览产品信息；App 编辑器仍可声明桌面优先。
- 完成基础 SEO、OG 图、favicon、About 与隐私说明。

### P1：上线后增强

- 每款 App 独立产品落地页。
- 真实案例、模板或 Before / After。
- 邮件更新订阅或候补名单。
- Updates / Changelog。
- 轻量、匿名且经同意的转化埋点。

### P2：产品生态成熟后

- 登录、Loeme Library 和跨 App 项目中心。
- 用户作品展示。
- 模板市场或共享链接。
- 定价与商业化页面。

## 11. 建议里程碑

| 里程碑 | 交付物 | 完成标准 |
|---|---|---|
| M1 定位收口 | 三款 App 定位、状态、命名和 Dustworks 决策 | 团队能用 30 秒讲清产品家族 |
| M2 官网结构 | 首页线框、内容清单、产品页模板 | 所有模块与 CTA 有明确目标 |
| M3 视觉与内容 | 桌面/移动视觉稿、真实产品素材、文案 | 不依赖概念性占位图 |
| M4 开发上线 | 首页与必要产品页、SEO、响应式 | 构建通过，入口与状态准确 |
| M5 数据复盘 | CTA、产品访问、首次使用与导出数据 | 能判断访客对哪款 App 最感兴趣 |

## 12. 需要尽快确认的决策

1. 三款正式 App 是否确定为 Motif、Flow、Morph。
2. Motif 对外状态使用 Beta、Early Access 还是 Available。
3. Flow 与 Morph 是只展示预告，还是开放可交互原型。
4. Dustworks 移入 Labs、隐藏，还是继续作为独立产品。
5. 官网本轮是否需要收集邮箱，以及使用什么更新机制。
6. 首轮官网主要面向中文用户、英文用户，还是双语。

## 13. 一句话执行原则

先用 Motif 建立“Loeme 是可信设计工具”的认知，再用 Flow 展示动态吸引力，用 Morph 补齐原创素材生成能力；官网围绕三者的差异与接力关系组织，而不是简单罗列三个项目。
