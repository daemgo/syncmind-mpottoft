# 销售作战指南 — 分析规则

本文件供主 agent 参考，不启动 sub-agent。按 M1-M7 模块逐一分析，直接输出 JSON。

不做搜索，基于已读取的数据分析。信息不足时基于行业经验做合理推断。

如存在 `docs/organization/profile.md`，将其作为我方能力档案使用。它只用于销售打法、价值主张、竞对应对、能力边界和下一步行动，不作为客户需求来源。

---

## 分析模块

### M1：时机判断

根据 profile 中的信号判断时机阶段（刚融资/扩张期/转型期/稳定期/危机期）。

输出：时机阶段 + 切入策略 + 紧急程度（高/中/低）

### M2：竞对作战卡

识别 ≤3 个竞对（含"现状竞对"如 Excel/人工），每个竞对：
- 竞对优势（2-3 条）
- 竞对弱点（2-3 条）
- 应对策略（一句话）

如果我方能力档案包含 `competitorPlays[]`：
- 优先匹配客户当前竞对或现状替代方案
- 将 `ourAdvantages[]` 转化为贴合客户痛点的差异点表达
- 将 `counterStrategy` 融入应对策略
- 不要空泛说"我们更懂客户"

### M3：决策链

- 决策者 ≤3 人：姓名/部门 + 原因
- 影响者 ≤3 人：姓名/部门 + 原因
- 阻碍者 ≤2 人：姓名/部门 + 原因

### M4：禁区话题

从 profile 中识别敏感区域（司法风险、负面新闻、人事变动等），≤3 条。

如我方能力档案中存在 `capabilityBoundaries[]`，将不宜承诺的内容也纳入禁区或话术边界。例如部署方式、定制范围、交付周期、集成深度、效果承诺等。

### M5：访谈提纲（从 Requirements 同步）

**不再独立生成问题。** 所有问题统一由 `/requirements` 的 `pendingQuestions` 管理。

从 `requirements.json` 的 `current.pendingQuestions[]` 中读取，按 stage 分组筛选 status=pending 或 partially-answered 的问题：

- **screening**：首次接触可问的问题
- **deep-dive**：深入沟通时的需求验证问题
- **closing**：收尾确认和推进问题

直接引用问题的 id、question、priority、status，写入 `interviewGuide.fromRequirements`。

如果 `requirements.json` 不存在，`interviewGuide.fromRequirements` 输出空数组。

**tracking 计算**：
- `totalCount`：requirements 中所有 pendingQuestions 的数量
- `coveredCount`：status 为 answered 或 resolved 的数量
- `coverageRate`：coveredCount / totalCount（totalCount 为 0 时，coverageRate = 0）
- `pendingCritical`：status=pending 且 priority=必问 的问题 id 列表
- requirements.json 不存在时：全部归零（coverageRate=0, coveredCount=0, totalCount=0, pendingCritical=[]）

### M6：当前阶段建议

基于 M1 判断的时机阶段，给出当前阶段的销售建议：
- focus：当前阶段最应该关注什么（一句话）
- approach：推荐的打法/接触方式（一句话）
- risks：当前阶段最大的风险或容易犯的错（一句话）

### M7：我方能力锚定

如存在我方能力档案，综合以下字段修正 M1-M6：

| 字段 | 用法 |
|------|------|
| `valueProp` / `oneLiner` | 提炼 entryStrategy、stageAdvice.approach 的核心表达 |
| `industries` / `targetCustomer` | 判断当前客户是否为高匹配客群，影响 urgency 和 risks |
| `productLines[]` | 找到客户痛点对应的产品线和场景，用于价值主张 |
| `caseStudies[]` | 作为可信背书，转化为拜访时可提及的相似案例方向 |
| `deliveryCapability` | 形成交付前提、周期、集成方式的确认问题和风险提醒 |
| `capabilityBoundaries[]` | 形成禁区话题和不宜过度承诺的边界 |

能力不匹配时，不要放弃客户需求，而是在 `stageAdvice.risks`、`avoidTopics` 或后续行动中提示"需要先确认是否能承接/是否需要分期或伙伴配合"。

---

## 迭代规则

当已有 sales-guide.json 时（模式 B）：
- 只更新新输入影响的模块，其余保留原文
- 不重新分析 profile（信息已融入首次生成）
- 生成 changeSummary[] 记录本次变更

---

## 输出 JSON 结构

```json
{
  "salesGuide": {
    "timing": {
      "timingStage": "",
      "entryStrategy": "",
      "urgency": ""
    },
    "stageAdvice": {
      "focus": "",
      "approach": "",
      "risks": ""
    },
    "competitors": [
      {
        "name": "",
        "threat": "高|中|低",
        "strengths": [],
        "weaknesses": [],
        "counterStrategy": ""
      }
    ],
    "decisionChain": {
      "decisionMakers": [
        { "name": "", "department": "", "reason": "" }
      ],
      "influencers": [
        { "name": "", "department": "", "reason": "" }
      ],
      "blockers": [
        { "name": "", "department": "", "reason": "" }
      ]
    },
    "avoidTopics": [],
    "interviewGuide": {
      "fromRequirements": [
        {
          "questionId": "PQ-001",
          "stage": "screening|deep-dive|closing",
          "question": "",
          "priority": "必问|选问",
          "status": "pending|partially-answered"
        }
      ]
    },
    "tracking": {
      "coverageRate": 0,
      "coveredCount": 0,
      "totalCount": 0,
      "pendingCritical": []
    },
    "nextActions": [
      { "action": "", "deadline": "", "owner": "" }
    ],
    "metadata": {
      "generatedAt": null,
      "updatedAt": null,
      "version": "1.0"
    }
  }
}
```

### 输出约束

- competitors ≤ 3
- decisionMakers ≤ 3，influencers ≤ 3，blockers ≤ 2
- interviewGuide.fromRequirements：直接从 requirements.json 筛选，不自行生成
- avoidTopics ≤ 3
- 我方能力档案只能影响已有字段的内容表达，不新增顶层字段
- 所有文本中文，具体可执行
