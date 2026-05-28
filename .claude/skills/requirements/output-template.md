# 输出规则

> **重要**：以下 Markdown 模板定义的是**页面渲染格式**（前端展示用），不是 agent 对话输出。agent 对话中只需输出一句话摘要，具体见 SKILL.md 中各模式的输出指令。

## Markdown 展示模板（页面渲染用）

根据模式不同，使用不同的展示结构。

### 模式 A/B 通用展示（首次生成 & 迭代补充）

```markdown
# 【需求文档】：{customerName}

> {版本} · {状态} · 完成度 {completionRate.overall}% · {日期}

## 0. 需求来源
[sources 模块：列出所有信息来源，标注类型和日期]
[迭代模式下：标注"本次新增来源"]

## 1. 需求清单
[needs[] 模块：按 category 分组展示]

### 业务需求
[每条需求：标题 | 优先级 | 置信度 | 来源标签]

### 功能需求
[同上，按 module 子分组]

### 技术需求
[同上]

### 其他需求（数据/集成/安全/非功能）
[合并展示，按重要性排序]

## 2. 用户角色
[users[] 模块：角色、数量、主要任务]

## 3. 约束条件
[constraints 模块：总预算/预期上线时间]

## 4. 范围与优先级
[scope 模块：范围内/范围外/未来范围]
[phases 分期规划]
[priorityMatrix 优先级矩阵]

## 5. 方案方向建议
[solutionDirection 模块：初步方案建议]

## 6. 风险与假设
[risksAndAssumptions 模块]

## 7. 待验证问题
[pendingQuestions 模块：分优先级列出]
```

### 迭代模式额外输出（模式 B 在文档前插入）

```markdown
---
### 本次更新摘要

**输入**：{inputSummary}
**版本**：{上一版本} → {当前版本}

**变更**：
- {changeSummary 条目}

**新增需求**：{数量} 条
**验证假设**：{数量} 条（confidence 升级）
**否定假设**：{数量} 条
**问题更新**：{回答数} 个问题被回答，{剩余数} 个待解决
---
```

### 模式 C 展示（版本确认）

```markdown
# 【需求文档 · 正式版】：{customerName}

> v1.0 · 已确认 · {日期}

[完整需求文档，格式同模式 A 但：]
- 移除所有内部标注
- rejected 的需求不展示
- confidence=low 的需求标注"⚠ 未充分验证"
- 添加"确认记录"章节
```

### 问题清单展示（所有模式结尾附加）

```markdown
---

## 待回答问题

### 首次接触可问（screening）

1. **{question}** `{priority}`
   背景：{purpose}
   建议问：{targetPerson}

### 深入沟通时问（deep-dive）

2. **{question}** `{priority}`
   背景：{purpose}
   建议问：{targetPerson}

### 收尾确认（closing）

3. **{question}** `{priority}`
   背景：{purpose}

### 已回答的问题

4. ~~{question}~~ → {answer}

---
直接回复答案或粘贴新的沟通记录，系统会自动匹配并更新问题状态。
```

> 需求文档已生成。根据 `completionRate.overall` 值提示下一步：
> - **≤ 40%**：需求还比较初步，建议先运行 `/sales-guide` 生成销售作战指南，准备下次拜访时补充验证。
> - **> 40%**：需求已有一定基础，可运行 `/plan-writer` 生成解决方案，或运行 `/sales-guide` 更新销售策略。

---

## JSON 写入规则

写入路径：`docs/customer/requirements.json`

**重要：写入的 JSON 必须严格遵循下面的结构。`current` 包含所有实际数据，`versions` 冷启动时为空数组。**

### 目标结构示例（冷启动）

```json
{
  "currentVersion": "v0.1",
  "status": "draft",
  "versions": [],
  "current": {
    "salesInput": {
      "salesPerson": "",
      "lastUpdated": "",
      "overallAssessment": {
        "customerIntent": "",
        "projectUrgency": "",
        "budgetSituation": "",
        "competitionStatus": "",
        "winProbability": "",
        "keyObstacles": [],
        "confidenceLevel": ""
      },
      "keyPersons": [],
      "realNeeds": { "explicitNeeds": [], "implicitNeeds": [], "suspectedNeeds": [] },
      "decisionFactors": { "primaryFactor": "", "secondaryFactors": [], "dealBreakers": [] },
      "notes": "",
      "concerns": [],
      "suggestions": []
    },
    "sources": { "meetings": [], "documents": [], "communications": [], "observations": [] },
    "needs": [
      {
        "id": "REQ-001",
        "category": "business",
        "title": "需求标题",
        "description": "需求描述",
        "priority": "must",
        "confidence": "low",
        "source": { "type": "profile-inference", "detail": "来源说明", "raw": null },
        "status": "active",
        "module": "模块名",
        "relatedPainPoints": ["痛点"],
        "firstVersion": "v0.1",
        "lastUpdated": "v0.1",
        "history": []
      }
    ],
    "users": [
      { "role": "角色名", "description": "人数和职责", "mainTasks": ["任务1"] }
    ],
    "scope": { "inScope": [], "outOfScope": [], "futureScope": [], "phases": [], "priorityMatrix": [] },
    "constraints": {
      "budget": { "total": "", "flexibility": "" },
      "timeline": { "expectedStart": "", "expectedGoLive": "" }
    },
    "successCriteria": {},
    "risksAndAssumptions": {
      "risks": [{ "description": "风险描述", "impact": "高", "mitigation": "应对措施" }],
      "assumptions": [{ "description": "假设描述", "impact": "高" }],
      "dependencies": []
    },
    "solutionDirection": {
      "overallApproach": "",
      "recommendedApproach": null,
      "technicalDirection": null,
      "implementationStrategy": null,
      "nextSteps": []
    },
    "pendingQuestions": [
      {
        "id": "PQ-001",
        "category": "业务",
        "priority": "必问",
        "stage": "screening",
        "question": "问题内容",
        "purpose": "提问目的",
        "expectedDirection": "期望方向",
        "targetPerson": "目标角色",
        "relatedNeedIds": ["REQ-001"],
        "status": "pending",
        "answer": null,
        "resolvedInVersion": null
      }
    ],
    "completionRate": {
      "overall": 25,
      "byCategory": { "business": 40, "functional": 20, "technical": 20 },
      "blockers": ["阻塞项说明"]
    }
  }
}
```

### 写入策略

- **首次写入（冷启动）**：`versions: []`，所有数据写入 `current`
- **迭代写入**：
  1. 读取现有文件
  2. 将当前 `current` 连同 `currentVersion` 复制到 `versions[]` 作为历史快照
  3. 更新 `currentVersion`
  4. 更新 `current` 为新内容
- **确认写入**：更新 status 为 confirmed，版本升为整数

### 我方能力档案使用

如读取 `docs/organization/profile.md`，只能影响 `solutionDirection`、`scope`、`risksAndAssumptions`、`pendingQuestions`、`successCriteria` 等字段。不得新增 `needs[].source.type`，不得把我方产品线直接写成客户需求。

### 置信度标签映射

在 Markdown 展示中，使用 `confidence` + `source.type` 组合判断显示标签（不依赖独立的 `isAssumption` 字段）：

| confidence | source.type | 显示标签 |
|------------|-------------|----------|
| high | 任意 | `[已确认]` |
| medium | sales-observation | `[销售判断]` |
| medium | 其他 | _(无标签)_ |
| low | profile-inference | `[档案推演]` |
| low | case-matching | `[行业案例]` |
| low | industry-pattern | `[行业通用]` |

### source 类型标签映射（用于来源说明）

| source.type | 显示标签 |
|-------------|----------|
| customer-stated | 客户原话 |
| sales-observation | 销售观察 |
| profile-inference | 档案推演 |
| industry-pattern | 行业通用 |
| case-matching | 行业案例 |

### pendingQuestions 字段说明

| 字段 | 说明 |
|------|------|
| stage | `screening`（首次接触）/ `deep-dive`（深入沟通）/ `closing`（收尾确认） |
| status | `pending`（待回答）/ `answered`（已回答）/ `partially-answered`（部分回答）/ `resolved`（已解决，关联需求全部 verified）/ `invalidated`（已失效，关联需求被 rejected） |
| answer | 问题的回答内容，从素材中提取或用户直接提供 |
| resolvedInVersion | 问题在哪个版本被解决的，如 "v0.3" |

### needs status 标签映射

| status | 显示处理 |
|--------|----------|
| active | 正常展示 |
| verified | 展示，标注 `✓` |
| rejected | 模式 A/B 中展示并标注 ~~删除线~~；模式 C 中不展示 |
| deferred | 展示在"未来范围"章节 |

### humanizer-zh 规则

所有文本输出（Markdown 展示部分）必须经过 humanizer-zh 处理：
- 需求描述不要写成广告文案
- 痛点描述用客户的话，不用我们的话
- 方案方向建议直接说，不绕圈子
- JSON 中的字段值保持简洁客观，不美化
