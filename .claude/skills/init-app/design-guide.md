# Design System Guide

本指南定义生成代码的设计系统规则。所有生成的页面必须遵循这些规则。

语言约定：本文档使用命令式语言。"禁止"表示绝对不可以，"必须"表示必须执行。

---

## 1. 设计哲学

### 1.1 核心原则

| 原则 | 含义 | 设计决策 |
|------|------|---------|
| **保持上下文** | 不需要离开当前页面的操作，就不要跳转 | 创建/编辑→Dialog，详情→独立页面，删除→AlertDialog |
| **渐进式展露** | 默认展示最重要的，次要信息按需出现 | Sidebar 可折叠，表格只放关键列 |
| **无品牌化** | Demo 中不放任何品牌标识（syncMind、logo 等） | Sidebar 顶部只放系统名称文字，页面标题/Tab 用业务名称 |
| **视觉锚点** | 每个区域需要非文字着陆点引导视线 | 彩色头像、图标前缀、加粗数值、Badge |
| **卡片即故事** | 卡片是微型叙事，不是字段容器 | 三层：身份→上下文→关键指标 |

### 1.2 视觉规则

- 产品性格：专业、干净、信息密度适中，不拥挤也不空洞
- **Surface 定义层级**：用背景色区分内容层次（page background → card surface → nested surface）。禁止在 layout 区域之间加 border 分隔
- **结构中性，内容多彩，交互用主色**：背景、边框、布局用中性色（白/灰），禁止用 brand color 做大面积背景。数据内容用丰富色彩（头像多色、Badge 多色、图表 5 色盘、Stats Card 图标不同色系）。交互状态（Sidebar active、Tab active、选中态）用 primary 色高亮，不用灰色
- 圆角策略：Card `rounded-xl`，Button/Input `rounded-lg`，Badge `rounded-full`
- 阴影策略：静态 `shadow-sm`，hover `shadow-md transition-shadow`，弹层 `shadow-lg`
- 每个可见区域最多 **1 个 primary 按钮**，其余用 outline/ghost

### 1.3 数据展示策略

不是所有数据都适合表格。根据数据特征选择展示形式：

| 数据特征 | 推荐展示 | 理由 |
|---------|---------|------|
| 结构化列表（>5 列） | Table | 信息密度高，可排序筛选 |
| 少量关键指标（3-6 个） | Stats Card 网格 | 一目了然，视觉冲击力 |
| 实体概览（含状态+摘要） | Card 列表/网格 | 比表格更直观，适合移动端 |
| 时间序列 | Chart + 趋势卡片 | 趋势比数字更有意义 |
| 详情中的字段组 | Description Card（label-value 对） | 分组清晰，比平铺表单更紧凑 |

**Card 优先场景**：Dashboard 统计、实体概览列表、详情页信息分组。当数据条目少于 10 条且每条有明确的「标题+状态+摘要」结构时，优先用 Card 网格而不是 Table。

---

## 2. 颜色系统

**铁律**：
- 禁止硬编码 hex/rgb/oklch，使用语义 token（`bg-background`、`text-foreground` 等）或 Tailwind 色阶
- 使用 Tailwind 色阶时（如 `bg-amber-50`），**必须同时写 `dark:` 变体**
- 主色已在 globals.css 定义，不要覆盖

**状态着色原则**：区分两类状态——终态（成功=green、失败=red、取消=gray）和流程态（有先后顺序的阶段）。流程态**每个阶段必须用不同颜色**，按进度从冷色到暖色渐变分配，禁止全部用 gray outline。

**图表**：必须通过 ChartConfig 指定每个数据系列的颜色，禁止使用 recharts 默认黑色。颜色用 CSS 变量 `var(--color-chart-1)` 到 `var(--color-chart-5)`，或直接用 Tailwind 色值（如 `hsl(var(--chart-1))`）

**Stats Card**：每张卡片必须有图标 + 不同色系背景（emerald/blue/violet/amber），禁止纯文字+数字的白板卡片。趋势箭头只用于有时间对比的指标（如"较上月"），静态值（如概率百分比）不加趋势箭头。

---

## 3. 布局与组件规则

**页面骨架**：sticky header（标题+操作按钮）→ 内容区。列表页 header 右侧放新建按钮，详情页左侧放返回按钮。

**导航层级**：Sidebar → PageHeader → Tabs，禁止跳级。

**Sidebar**：可折叠（展开 w-60 / 折叠 w-16 仅图标），移动端用 Sheet overlay。

**响应式**：所有网格必须写移动端断点（sm/md/lg）。表格必须 `overflow-x-auto`。

**按钮**：每区域最多 1 个 primary，其余 outline/ghost。危险操作用 destructive。

**表格行操作**：禁止 inline 按钮，用 DropdownMenu（MoreHorizontal 图标触发）。

**图表**：必须生成真实 recharts 图表，禁止占位符。使用 ChartContainer + ChartConfig。

**Entity Card vs Table**：有人名/公司+状态+联系方式 → Card 网格；纯数值 → Table；两者都行 → 优先 Card。

**金额格式**：`¥X,XXX.XX`，右对齐。表格 ID 列用 `font-mono`。

