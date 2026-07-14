# Loeme Motif MVP 开发与上线计划

> 状态：Approved for implementation  
> 日期：2026-07-14  
> 入口：`/apps/motif`

## 1. 上线目标

上线一个可以被真实用户完整体验的浏览器端 SVG 参数化构图工具。用户无需账号、后端或 GPU，可以从内置素材或本地 SVG 开始，完成布局探索、预览和 SVG 导出。

本次上线验证的核心问题：

1. 用户是否能在 3 分钟内完成第一个矢量构图。
2. Scatter / Grid 是否比手工复制更高效。
3. Artboard 输出是否已经具有独立价值。
4. Square Repeat 是否能成为可信的增强能力。
5. 用户是否愿意继续使用更高级的 Compose 与 Network。

## 2. 本次范围

### 必须上线

- `/apps/motif` 单页工作台。
- 12–24 个内置 Starter Motif。
- 严格子集的 SVG 文件导入。
- 固定 Recipe：Input → Arrange → Colorway → Output。
- Scatter 与 Grid。
- Seed 固定与 Shuffle。
- Count、Spacing、Scale、Rotation 参数。
- Artboard / Square Repeat 输出模式。
- 单画板与多 Tile 预览。
- 4 套内置 Colorway。
- Flattened SVG 下载。
- 浏览器本地自动保存与重置项目。
- 导入错误、密度不足和导出状态反馈。

### 本次不做

- Compose 编辑。
- Brick / Half Drop。
- Compact SVG。
- 自由节点连接与 XYFlow。
- 云端项目和登录。
- 位图输入与 AI 生成。
- 精确路径碰撞。
- 移动端完整编辑体验。

## 3. 实施阶段

### Milestone 1：Workspace

- Loeme / Motif 顶部导航。
- 左侧 Starter / Project Motif Library。
- 中央 Artboard / Repeat Canvas。
- 固定 Recipe Strip。
- 右侧 Arrange / Output Inspector。
- 桌面优先的响应式布局。

验收：用户能选择内置 Motif，并理解从 Input 到 Output 的固定流程。

### Milestone 2：Vector Core

- 项目数据模型。
- 固定 Seed PRNG。
- Scatter 和 Grid 生成器。
- 有限画板边界。
- Motif 权重与颜色分配。
- 参数调整后的实时预览。

验收：刷新前后相同 Seed 和参数得到相同布局。

### Milestone 3：Repeat 与导出

- Square Wrap 显示副本。
- 3×3 Repeat Preview。
- Tile Boundary。
- Flattened Artboard SVG。
- Flattened Square Repeat SVG。

验收：导出文件不包含脚本和外链；在浏览器重新打开后与预览一致。

### Milestone 4：导入与本地保存

- 文件大小预检。
- SVG 标签、属性和 URL 白名单。
- ViewBox 读取与规范化。
- 不支持内容的明确错误。
- 本地项目自动恢复。
- Reset Project。

验收：恶意或不支持 SVG 不进入预览；有效基础 SVG 可以参与排列。

### Milestone 5：上线

- 生产构建。
- 服务端路由检查。
- 主要交互与导出回归。
- 私有部署。
- 记录首轮用户测试问题。

## 4. 发布 Gate

### Core Gate

- 内置素材无需上传即可完成首次任务。
- Scatter 与 Grid 均能生成有效构图。
- 同一 Seed 结果一致。
- Artboard SVG 可以独立打开。
- 项目刷新后可以恢复。
- 无阻断级控制台或构建错误。

### Repeat Gate

- 左右、上下和四角副本正确。
- 3×3 预览结构连续。
- Repeat SVG 与预览一致。
- Repeat 出错不会影响 Artboard 导出。

## 5. 上线后的第一轮指标

- Time to First Composition。
- Starter Motif 被添加次数。
- Scatter / Grid 使用比例。
- Shuffle Seed 次数。
- Artboard / Repeat 使用比例。
- Export Started / Succeeded / Failed。
- 用户是否主动寻找 Compose 或 Network。

MVP 不上传用户 SVG 或项目内容；正式埋点必须在用户同意后启用。

