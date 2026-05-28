# 输出规则

## JSON 写入规则

写入路径：`docs/customer/sales-guide.json`

**重要：写入的 JSON 必须严格遵循下面的结构，最外层用 `salesGuide` 包裹。**

### 目标结构示例

```json
{
  "salesGuide": {
    "timing": {
      "timingStage": "选型评估期",
      "entryStrategy": "从核心痛点切入的具体策略",
      "urgency": "中高"
    },
    "stageAdvice": {
      "focus": "当前阶段重点",
      "approach": "推荐打法",
      "risks": "当前阶段风险"
    },
    "competitors": [
      {
        "name": "竞对名称",
        "threat": "高",
        "strengths": ["优势1"],
        "weaknesses": ["劣势1"],
        "counterStrategy": "应对策略"
      }
    ],
    "decisionChain": {
      "decisionMakers": [{"name": "张三", "department": "CEO", "reason": "最终拍板"}],
      "influencers": [{"name": "李四", "department": "IT", "reason": "技术选型"}],
      "blockers": []
    },
    "avoidTopics": ["敏感话题"],
    "interviewGuide": {
      "quickScreening": [{"question": "筛选问题", "purpose": "目的"}],
      "closingQuestions": [{"question": "收尾问题", "purpose": "目的"}]
    },
    "tracking": {
      "coverageRate": 0,
      "coveredCount": 0,
      "totalCount": 0,
      "categories": []
    },
    "nextActions": [
      {"action": "具体行动", "deadline": "时间", "owner": "负责人"}
    ],
    "metadata": {
      "generatedAt": "2026-04-09T01:46:00Z",
      "updatedAt": "2026-04-09T01:46:00Z",
      "version": "1.0"
    }
  }
}
```

### 写入策略

- **首次写入**：创建完整 JSON，最外层必须有 `salesGuide` 包裹
- **迭代写入**：只覆盖有变化的字段
- **始终更新**：metadata.generatedAt（首次）/ metadata.updatedAt（迭代）、metadata.version
- **我方能力档案**：如读取 `docs/organization/profile.md`，只能融入 timing、stageAdvice、competitors、avoidTopics、nextActions 等既有字段，不新增顶层字段
- **UTF-8 编码**，JSON 缩进 2 个空格

### interviewGuide 同步规则

`interviewGuide.fromRequirements` 从 `requirements.json` 的 `current.pendingQuestions[]` 筛选：
- 只取 status=pending 或 partially-answered 的问题
- 保留 questionId、stage、question、priority、status 字段
- 按 stage 分组：screening → deep-dive → closing
- requirements.json 不存在时输出空数组

`tracking` 基于 requirements.json 的全部 pendingQuestions 计算（含已回答的），反映问题整体覆盖进度。

### humanizer-zh 处理清单

| 字段路径 | 处理重点 |
|----------|---------|
| timing.entryStrategy | 具体可执行，不泛泛 |
| competitors[].counterStrategy | 像有经验的销售在教新人 |
| nextActions[].action | 具体到可执行 |
