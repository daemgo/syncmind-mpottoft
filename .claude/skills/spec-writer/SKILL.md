---
name: spec-writer
description: 基于已有解决方案(solution.md)生成结构化产品说明书(Spec/PRD)，聚焦"产品做什么"——功能清单、模块划分、页面结构、字段定义、交互流程。注意：本 skill 不处理客户原始需求的收集、整理、更新（那是 requirements 的职责）；也不做技术架构/接口设计。前置条件是已经有 solution.md。
metadata:
  short-description: 生成产品说明书(Spec)
  triggers:
    - "生成spec"
    - "出spec"
    - "写spec"
    - "产品说明书"
    - "写产品说明书"
    - "生成产品说明书"
    - "PRD"
    - "写PRD"
    - "生成PRD"
  examples:
    - "基于方案生成spec"
    - "帮我写产品说明书"
    - "生成PRD文档"
    - "出一份 spec"
  dependencies:
    - plan-writer    # 必须先有解决方案（solution.md）
    - humanizer-zh   # 输出人性化处理（必须）
---

基于 `solution.md` 的方案内容生成结构化产品需求说明书（spec.md）。直接执行，不输出本文档内容。

---

### 核心定位

**Spec = 产品需求说明书，聚焦"做什么"，不关心"怎么做"**

| Spec 包含 | Spec 不包含 |
|-----------|-------------|
| 产品背景、目标、用户 | 技术架构设计 |
| 功能清单、模块划分 | 接口/API 设计 |
| 页面结构、交互流程 | 数据库设计 |
| 字段定义、业务规则 | 埋点方案 |
| 原型/线框描述 | 性能优化方案 |

### 工作流程位置

```
/plan-writer（解决方案）
      ↓
   docs/plan/solution.md
      ↓
/spec-writer（本 skill：方案 → 结构化 Spec）
      ↓
   docs/spec/spec.md
      ↓
/init-app（可选：基于 Spec 生成 Demo 代码）
```

### 输出物

| 文件 | 格式 | 说明 |
|------|------|------|
| spec.md | Markdown | 结构化需求说明书，人可读、LLM 可解析 |

---

### 数据来源

#### 唯一输入

| 文件 | 用途 |
|------|------|
| `docs/plan/solution.md` | 方案内容（Markdown），包含功能设计、模块划分、技术选型 |

**不读取 requirements.json**。方案内容已经过 plan-writer 的 A/B 对弈，需求已被消化和取舍。

#### 前置条件

| 条件 | 处理 |
|------|------|
| solution.md 存在 + 目标场景有版本 | 正常执行 |
| solution.md 不存在 | 输出 `"请先执行 /plan-writer 生成解决方案。"` 后**立即结束，不追问、不补救** |
| solution.md 的 requirementsVersion="dialog" | 正常执行（对话直出方案也能生成 spec） |

**禁止行为**：不得向用户询问项目背景、项目类型或任何补充信息。本 Skill 的唯一输入是 solution.md，无需也不应通过对话收集额外上下文。

---

### 质量优先原则

**高质量 ≠ 内容多。内容多不解决真正问题 = 垃圾。**

| 维度 | 高质量 | 低质量（避免） |
|------|--------|---------------|
| **贴合方案** | 每个功能都能追溯到方案中的设计 | 凭空添加"可能有用"的功能 |
| **深度思考** | 解释"为什么这样设计" | 只列"做什么"，不说为什么 |
| **精炼不冗余** | 20 个字段解决问题 | 100 个字段显得专业 |
| **有取舍** | 明确说"不做什么"和原因 | 什么都想做，什么都做不好 |

#### 反模式

看到"用户管理"就写上增删改查 15 个功能 — 这不是全面，是没有思考。客户要什么就做什么。

---

### 执行流程

#### Step 1：读取方案

1. 读取 `docs/plan/solution.md`
2. 从 YAML frontmatter 提取 `version`、`scene`、`requirementsVersion`
3. 提取方案正文（Markdown）
4. 检查方案是否包含功能设计内容（第 2 章"解决方案"）

#### Step 2：生成 spec.md（1 Agent）

读取 `prompts/generate-spec-md.md`，启动 Agent：

| Agent | Prompt 文件 | 注入数据 |
|-------|------------|---------|
| generate-spec-md | `prompts/generate-spec-md.md` | `{solution_content}` + `{solution_version}` + `{solution_scene}` |

输出：完整的 spec.md Markdown 文档内容。

#### Step 3：Humanizer + 写文件

1. 从 Agent 输出中提取 spec.md 内容
2. 对"产品概述"（第一章）中的叙述性段落应用 `humanizer-zh` 处理，去除 AI 痕迹
3. 表格、字段定义等结构化内容**不做 humanizer 处理**（保持精确性）
4. 写入 `docs/spec/spec.md`

#### Step 4：输出摘要

向用户输出 1-2 句完成状态，包括写入文件路径。不输出方案内容本身。

---

### 更新机制

当用户说"更新 spec"或 solution.md 有新版本时：

1. 重新执行完整 Step 1-4 流程（2-3 分钟足够快，无需增量更新）
2. 版本号递增（1.0.0 → 1.1.0）
3. 用户可通过 `git diff` 对比变更，选择性接受

---

### 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| `/plan-writer` | **上游**：提供方案内容（solution.md） |
| `/init-app` | **下游**：可基于 spec.md 生成 Demo 代码 |
| `/humanizer-zh` | 后处理：spec.md 叙述性文本去 AI 痕迹 |

---

### 文件结构

```
.claude/skills/spec-writer/
├── SKILL.md                              # 本文件：编排逻辑 + 质量原则
├── output-templates/
│   └── spec-md-template.md               # spec.md 文档模板（章节结构与格式约定）
└── prompts/
    └── generate-spec-md.md               # 方案 → 结构化 Markdown spec
```
