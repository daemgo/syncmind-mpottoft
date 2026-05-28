# Skill 数据流契约

本文档定义 skill 之间的数据传递契约。每个 skill 在读写文件时，必须遵守此处定义的字段约定。

---

## 数据流全景

```
用户输入
  │
  ├─→ /profile ──→ docs/customer/profile.json
  │                    │
  ├─→ /requirements ──→ docs/customer/requirements.json
  │                    │
  │                    ▼
  ├─→ /sales-guide ──→ docs/customer/sales-guide.json
  │   (依赖 profile，可选读取 requirements)
  │
  │   requirements.json ──→ /plan-writer ──→ docs/plan/solution.md
  │   (或用户对话 Mode C)                         │
  │                                               ▼
  │                                    /spec-writer ──→ docs/spec/spec.md
  │                                                          │
  │                                                          ▼
  └─→ /init-app ──→ src/ (前端代码)
      (读取 spec.md)

平台注入
  │
  └─→ docs/organization/profile.md
       (我方能力档案，只读 Markdown 输入，被 requirements / sales-guide / plan-writer 可选读取)
```

**单链数据流**：requirements.json → plan-writer → solution.md → spec-writer → spec.md → init-app

**能力约束支线**：organization/profile.md 不产生客户需求，只用于能力匹配、竞对打法、方案边界、实施策略和风险控制。详细契约见 `_contracts/organization-capability.md`。

---

## 关键接口契约

### 0. organization/profile.md → 销售链路（可选）

`docs/organization/profile.md` 由 syncMind 平台根据工作区企业档案生成或同步，描述我方公司能力。所有下游 skill 将其视为只读 Markdown 输入。

| 字段路径 | 用途 | 读取方 |
|----------|------|--------|
| `companyName` / `oneLiner` / `valueProp` | 我方定位与价值主张 | requirements / sales-guide / plan-writer |
| `industries[]` / `targetCustomer` | 判断客户行业、规模、角色是否匹配 | requirements / sales-guide / plan-writer |
| `productLines[]` | 识别可承接的产品线、功能模块和优势 | requirements / sales-guide / plan-writer |
| `caseStudies[]` | 相似案例背书、风险判断、方案可信度 | sales-guide / plan-writer |
| `deliveryCapability` | 实施方式、周期、集成能力、服务范围、客户侧前提 | requirements / plan-writer |
| `capabilityBoundaries[]` | 不承诺事项、范围边界、待确认风险 | requirements / sales-guide / plan-writer |
| `competitorPlays[]` | 竞对作战卡和差异化表达 | sales-guide / plan-writer |

**硬规则**：
- 不能把我方产品线直接写成客户需求。
- 不能因为我方暂时缺少某能力而删除客户已经表达的需求。
- 对超出我方能力的客户需求，应进入范围边界、风险、分期、合作/集成假设或待确认问题。

### 1. requirements.json → plan-writer

plan-writer 采用 2-Agent 架构（build-plan + critique-and-revise），有两种数据入口：
- **Mode A**（有 requirements.json）：Phase 1 内联读取 requirements.json + profile.json，构建 `{customer_brief}`（Markdown 摘要）
- **Mode C**（无 requirements.json）：由 `parse-dialog` → `rebuild-from-dialog` 从用户对话 + 知识库重建等效 `{customer_brief}`

两种模式输出相同结构的 Markdown 摘要，后续 Phase 2/3 Agent 无差别消费。

**Phase 1 从 requirements.json 和 profile.json 提取的字段**：

项目背景信息来自 **profile.json**（不是 requirements.json）：

| 字段路径 | 来源文件 | 用途 | 必须 |
|----------|----------|------|------|
| `companyName` | profile.json | 客户名称 | 是 |
| `industry` / `subIndustry` | profile.json | 行业分类 | 是 |
| `scale` | profile.json | 企业规模 | 是 |
| `mainBusiness` / `businessModel` | profile.json | 项目背景 | 是 |
| `painPoints[]` | profile.json | 现有挑战/痛点 | 是 |
| `timing.phase` | profile.json | 数字化阶段 | 否 |
| `current.needs[]` (status=active/verified) | requirements.json | 按业务/功能/技术分组的需求 | 是 |
| `current.needs[].confidence` | requirements.json | 置信度（low 的在方案中用委婉表述） | 是 |
| `current.constraints.budget` | requirements.json | 预算约束 | 否 |
| `current.constraints.timeline` | requirements.json | 时间约束 | 否 |
| `current.successCriteria` | requirements.json | 成功标准 | 否 |
| `currentVersion` | requirements.json | 需求版本号 | 是 |

**数据质量门控**（Phase 1 内联检查）：
- requirements.json 不存在 → 提示先执行 /requirements
- active 需求 < 2 → 提示需求不足
- 大多数 confidence=low 且缺少关键约束 → 提示信息不足

### 2. solution.md → spec-writer

spec-writer 的**唯一输入**是 solution.md，不读取 requirements.json。方案内容已经过 plan-writer 的"草案 + 审阅修订"，需求已被消化和取舍。

solution.md 采用 YAML frontmatter + Markdown 正文格式：

```markdown
---
version: v1
scene: normal
requirementsVersion: v2
createdAt: 2026-03-25T10:00:00Z
summary: 基于当前客户需求生成的解决方案
---

## 1. 客户现状与需求
...
```

| 字段 | 位置 | 用途 | 必须 |
|------|------|------|------|
| `version` | frontmatter | 方案版本号，写入 spec.md 的来源标注 | 是 |
| `scene` | frontmatter | 方案场景 ID | 是 |
| `requirementsVersion` | frontmatter | 需求来源标识（版本号或 "dialog"） | 否 |
| 方案正文 | Markdown body | 提取功能模块/页面/字段设计 | 是 |

**前置条件**：solution.md 存在且包含方案正文。`requirementsVersion="dialog"` 时也正常执行。

**版本历史**：由 git 管理，不在文件内存储多版本。

**场景管理**：多文件方式（solution.md = normal，solution-competitive.md = 竞标场景）。

### 3. spec.md → init-app

init-app 采用单 Agent 架构（分析 → 生成 → 验证在同一个 Agent 内完成），无中间产物文件。

#### 3.0 三种输入模式

| 模式 | 触发条件 | 输入 | 精度 |
|------|---------|------|------|
| Mode A | spec.md 存在 | spec.md 结构化 Markdown | 最高 |
| Mode B | 无 spec，有 solution.md | solution.md Markdown 提取 | 中等 |
| Mode C | 用户描述了具体系统 | 用户对话描述 | 快速原型 |

**关键设计**：无 init-plan.json 中间产物。Agent 在同一上下文中完成分析和代码生成，分析结果作为 Agent 内部理解直接用于生成代码。增量更新通过 `.spec-mapping.yaml` 的 hash 对比实现。

#### 3.2 spec.md → init-plan.json 字段映射（Mode A）

**这是最关键的契约**。init-app analyze agent 从 spec.md 的 Markdown 表格中提取结构化信息：

| spec.md 内容 | init-app 映射目标 | 说明 |
|-------------|-------------------|------|
| 二、信息架构 站点地图 | 导航菜单 + 路由结构 | 路由决定文件路径，图标决定菜单图标 |
| 三、功能模块 各页面 | `src/routes/[route]/index.tsx` 等 | 一个页面一个路由文件（TanStack Router） |
| 页面的 **布局** 标注 | 页面骨架模板 | 必须是: `list` / `detail` / `form` / `dashboard` / `steps` / `custom` |
| 区块标题中的类型标注 | 组件类型 | **必须是以下枚举值之一** |
| 字段表（fieldKey 列） | 表单字段 | `fieldKey` 用作代码中的字段名 |
| 列定义表（fieldKey 列） | 表格列 | `fieldKey` 对应 mock 数据的 key |
| 操作表 | 操作按钮 | 位置列决定按钮位置 |
| 四、全局规则 数据字典 | `src/lib/dict.ts` | `dict-xxx` ID 被字段的"选项来源"引用 |
| 四、全局规则 状态流转 | Badge 颜色 + 状态流转逻辑 | 颜色列决定 Badge 颜色 |

#### sections[].type 枚举值（spec-writer 和 init-app 必须一致）

```typescript
type SectionType =
  | "table"       // → Table 组件
  | "form"        // → Form + Input + Select
  | "card"        // → Card 信息卡片
  | "cards"       // → Card 列表
  | "chart"       // → recharts + ChartContainer
  | "tabs"        // → Tabs 标签页
  | "steps"       // → div + Badge 步骤条
  | "timeline"    // → div + 左侧竖线时间线
  | "description" // → dl + grid 描述列表
  | "statistic"   // → Card + 大号数字 + 趋势
  | "custom"      // → 自定义
```

**spec-writer 禁止使用此枚举之外的 type 值**，否则 init-app 无法映射组件。

#### pages[].layout 枚举值

```typescript
type PageLayout =
  | "list"       // 列表页：筛选 + 表格 + 分页
  | "detail"     // 详情页：信息展示 + 标签页
  | "form"       // 表单页：数据录入
  | "dashboard"  // 仪表盘：卡片 + 图表
  | "steps"      // 步骤页：分步操作
  | "custom"     // 自定义
```

#### fields[].type 枚举值

```typescript
type FieldType =
  | "text" | "textarea" | "number" | "money" | "percent"
  | "date" | "datetime" | "daterange" | "time"
  | "select" | "multiselect" | "radio" | "checkbox" | "switch"
  | "upload" | "image" | "richtext"
  | "cascader" | "treeselect" | "user" | "department"
  | "address" | "phone" | "email" | "idcard" | "url"
  | "color" | "rate" | "slider" | "custom"
```

### 4. profile.json → sales-guide

sales-guide 从 profile.json 读取的字段：

| 字段路径 | 用途 | 必须 |
|----------|------|------|
| `profile.timing` | 时机分析输入、数字化阶段 | 是 |
| `profile.riskAndPolicy` | 政策杠杆、风险评估、禁区话题 | 是 |
| `profile.organization` | 决策链基础 | 是 |
| `profile.competition` | 竞对识别、行业位置 | 是 |
| `profile.painPoints` | 价值主张、破冰素材 | 是 |
| `profile.opportunities` | 机会点、切入角度 | 否 |
| `profile.contacts` | 决策链具名角色 | 否 |
| `profile.scale` | 竞对匹配、组织类型推断 | 是 |
| `profile.industry` / `profile.subIndustry` | 行业竞对、典型痛点 | 是 |

### 5. requirements.json → sales-guide（可选）

sales-guide 从 requirements.json 读取的字段（丰富策略，非必须）：

| 字段路径 | 用途 | 必须 |
|----------|------|------|
| `current.needs[]` (priority=must) | 价值主张对齐、访谈问题设计 | 否 |
| `current.constraints.budget` | 异议预判（价格异议）、紧急度评估 | 否 |
| `current.constraints.timeline` | 紧急度评估、行动计划节奏 | 否 |
| `current.users[]` | 访谈问题定向、决策链补充 | 否 |
| `current.pendingQuestions[]` | 融入访谈提纲的定制问题 | 否 |
| `currentVersion` / `status` | 判断需求成熟度 | 否 |

---

## 字段引用规则

### dictionary 引用

spec-writer 在字段表的"说明"列中引用字典时（如 `选项来源: dict-sample-status`），必须确保该 dict ID 在全局规则 4.2 数据字典中存在。

init-app 根据字段的选项来源引用，从全局规则数据字典查找选项，生成到 `src/lib/dict.ts`。

### statusFlows 引用

`statusFlows[].statuses[].color` 的值会被 init-app 映射为 Badge 的颜色类名。建议使用：
`gray` / `blue` / `green` / `red` / `yellow` / `purple` / `orange`

---

## 版本兼容

各 skill 写入文件时，必须维护版本信息：

| 文件 | 版本字段 | 格式 |
|------|----------|------|
| requirements.json | `currentVersion` | "v0.1", "v0.2", ..., "v1.0" |
| solution.md | frontmatter `version` | "v1", "v2", ...（git 管理历史版本） |
| spec.md | 文档头 版本标注 | "1.0.0"（git 管理历史版本） |
| sales-guide.json | `version` | "1.0", "1.1", ..., "2.0" |
