---
name: requirements
description: 整理、更新、补充「客户需求文档」(requirements.json)。基于客户档案、拜访记录、对话内容生成或迭代结构化客户需求，覆盖冷启动推演、迭代补充、定版确认全流程。无论是首次整理、增删改需求条目、回答待确认问题、合并新拜访信息，还是需求定版，都走这个 skill。注意：不是"产品需求说明书/PRD/Spec"，那是 spec-writer 的职责。
metadata:
  short-description: 整理/更新客户需求文档
  triggers:
    - "整理需求"
    - "需求分析"
    - "客户需求"
    - "需求文档"
    - "需求整理"
    - "提炼需求"
    - "更新需求"
    - "修改需求"
    - "新增需求"
    - "补充需求"
    - "追加需求"
    - "调整需求"
    - "删除需求"
    - "改一下需求"
    - "加一条需求"
    - "回答需求问题"
    - "需求确认"
    - "需求定版"
  examples:
    - "整理这个客户的需求"
    - "基于拜访记录分析需求"
    - "帮我整理客户需求文档"
    - "补充需求信息"
    - "再补一条需求：客户希望支持多租户"
    - "把 xx 这条需求优先级改成 must-have"
    - "删掉数据大屏那条需求"
    - "我又拜访了客户，这是会议纪要……"
    - "我来回答之前的待确认问题"
    - "需求定版"
  dependencies:
    - profile
    - humanizer-zh
---

收到指令后立即开始执行，不输出本文档任何内容。

---

### 定位

| Skill | 阶段 | 核心问题 | 主要用户 |
|-------|------|----------|----------|
| `/profile` | 拜访前 | 客户是谁？ | 销售 |
| `/sales-guide` | 拜访前 | 怎么打？ | 销售 |
| **`/requirements`** | **全周期** | **客户要什么？** | **售前/方案团队** |
| `/plan-writer` | 方案阶段 | 怎么解决？ | 方案团队 |

### 核心理念：需求是活文档

需求不是一次性生成物，而是随销售推进持续演进的活文档：

```
v0.1  冷启动：profile + 行业痛点库 + 知识库 → 推演需求
v0.2  首访后：拜访记录 + v0.1 → 验证推演，补充新发现
v0.3  二次沟通：电话/微信记录 + v0.2 → 细化功能需求
v1.0  需求确认：客户确认 → 正式版本，驱动方案生成
v1.1+ 持续迭代：方案评审反馈 → 需求微调
```

每条需求自带 `confidence` 和 `source`，版本升级只改变化部分，保留完整变更轨迹。

---

### 前置条件

- **必须**：`docs/customer/profile.json` 存在
- **推荐**：有实际的拜访记录或客户沟通内容（冷启动模式除外）
- **可选**：`docs/customer/sales-guide.json`、`docs/organization/profile.md`、客户提供的文档/截图、`docs/knowledge-base/index.json`

> `docs/organization/profile.md` 是我方能力档案，只能用于判断能力适配、交付边界、风险假设和方案方向；不能把我方产品线直接生成成客户需求。

---

### 执行流程

**第零步：模式判断**

读取 `docs/customer/requirements.json`，判断执行模式：

| 条件 | 模式 | 说明 |
|------|------|------|
| requirements.json 不存在 | **A：冷启动** | 从零生成需求 |
| requirements.json 存在 + 用户说"需求确认/定版" | **C：版本确认** | 标记为正式版 |
| requirements.json 存在（其他所有情况） | **B：迭代补充** | 基于已有内容增量更新 |

> **重要**：只要 requirements.json 存在，就**不走冷启动**。已有的问题回答、salesInput、需求条目等是宝贵数据，不能覆盖。即使用户说"重新生成"，也走 Mode B，以已有文件为基础叠加。

---

#### 模式 A：冷启动

**步骤 1：收集输入 + 预取知识库**

1. 读取 `docs/customer/profile.json`
2. 读取 `docs/customer/sales-guide.json`（如存在）
3. 读取 `docs/organization/profile.md`（如存在）
4. 接收用户提供的素材（拜访记录/电话记录/文档/截图等，可选）
5. 从 profile.json 提取精简摘要 `{profile_summary}`，只保留以下字段：

```json
{
  "companyName": "",
  "industry": "",
  "subIndustry": "",
  "scale": "",
  "mainBusiness": "",
  "businessModel": "",
  "tags": [],
  "painPoints": [],
  "organization": { "type": "", "decisionChain": "" },
  "timing": { "phase": "", "urgency": "" },
  "opportunities": []
}
```

profile.json 中的工商原始数据、搜索来源 URL、详细财务信号等**不注入 Agent**，节省上下文。

6. 如 `docs/organization/profile.md` 存在，提取 `{organization_capability_brief}`，只保留与当前客户行业、痛点、需求相关的短 Markdown 摘要：

```markdown
## 我方能力摘要
- 公司定位：
- 匹配产品线：
- 可引用案例：
- 交付能力：
- 能力边界：
- 竞对打法：
```

文件不存在时：`{organization_capability_brief}` = 空字符串。

7. **预取知识库匹配数据**：调用知识库 API 获取匹配结果，存为 `{kb_match_data}`
   - `POST {APP_URL}/api/kb/match`（industry + keywords）
   - 对每个匹配结果 `GET {APP_URL}/api/kb/category/{id}`（最多 3 个）
   - API 失败或无结果时：`{kb_match_data}` = `{ "matchedModels": [], "noMatchReason": "..." }`

**步骤 2：并行分析**

根据是否有用户素材，启动 1-2 个并行 Agent：

| Agent | Prompt 文件 | 触发条件 | 职责 |
|-------|------------|---------|------|
| analyze-and-synthesize | `prompts/analyze-and-synthesize.md` | 始终执行 | 推演需求 + 分析知识库匹配 + 输出完整 requirements.json + 生成问题清单 |
| extract-from-input | `prompts/extract-from-input.md` | 用户提供了素材时 | 从原始素材提取需求信号 |

启动 analyze-and-synthesize 时注入：
- `{profile_summary}`：profile 精简摘要
- `{sales_guide_data}`：sales-guide.json 内容（如有）
- `{kb_match_data}`：知识库匹配结果（步骤 1 预取）
- `{industry_pain_points}`：行业痛点库内容（`skills/profile/industry-pain-points.md`）
- `{organization_capability_brief}`：我方能力 Markdown 摘要（如有）

启动 extract-from-input 时注入：
- `{user_input}`：用户提供的原始素材
- `{pending_questions}`：空数组（冷启动无历史问题）

**步骤 3：合并与写入**

- **无 extract Agent 时**：analyze-and-synthesize 的输出即为最终结果
- **有 extract Agent 时**：启动 analyze-and-synthesize（冷启动模式），额外注入 extract 结果，Agent 内部完成合并

Agent 输出完整的 JSON 结构（包含 salesInput、sources、needs、scope、constraints、successCriteria、solutionDirection、pendingQuestions、risksAndAssumptions、completionRate 等所有字段），编排器直接写入 `docs/customer/requirements.json`，遵循 `output-template.md` 中的写入规则。

输出一句话告知用户完成（含需求条数和完成度），不输出完整 Markdown（数据已写入文件，用户在页面上查看）。

---

#### 模式 B：迭代补充

**步骤 1：收集输入**

1. 读取现有 `docs/customer/requirements.json`
2. 读取 `docs/organization/profile.md`（如存在）
3. 接收用户提供的新素材（可能为空）

**步骤 2：提取新信号（有新素材时）**

仅当用户提供了新素材时，启动 extract-from-input Agent：
- 注入新素材
- 注入现有需求摘要（让 Agent 知道哪些已有、哪些是新增）
- 注入现有 `pendingQuestions[]`（status=pending 或 partially-answered 的问题，用于自动匹配素材中的答案）

无新素材时跳过此步骤。

**步骤 3：增量合并与写入**

启动 analyze-and-synthesize Agent（增量模式）：
- 注入 `{existing_requirements}`：现有 requirements.json 完整内容
- 有新素材时注入 `{extract_result}`：extract Agent 的输出
- 无新素材时不注入 `{extract_result}`，Agent 基于已有需求进行优化补充
- 注入 `{organization_capability_brief}`：我方能力 Markdown 摘要（如有），仅用于更新 solutionDirection、scope、risksAndAssumptions、pendingQuestions 等能力适配相关内容

Agent 内部完成合并（新增/验证/否定/修改），**保留所有已有数据**（已回答的问题、salesInput、constraints 等），输出更新后的完整 JSON。

Agent 输出完整 JSON 结构后直接写入 `docs/customer/requirements.json`。
输出一句话变更摘要（新增/修改/验证了什么），不输出完整 Markdown。

---

#### 模式 C：版本确认

**步骤 1：完成度检查**

读取 requirements.json，计算：
- 总体完成度（已确认需求 / 全部需求）
- 按类别的完成度
- 阻塞项（confidence=low 的 must-have 需求）

**步骤 2：确认或警告**

| 完成度 | 处理 |
|--------|------|
| ≥ 80% 且无阻塞项 | 标记为 v1.0 confirmed，输出正式需求文档 |
| 60%-80% | 使用 `AskUserQuestion` 警告缺失项并询问（见下方示例） |
| < 60% | 建议继续迭代，列出关键缺失 |

60%-80% 时的 AskUserQuestion 示例：
```
AskUserQuestion({
  questions: [{
    question: "当前需求完成度为 {完成度}%，以下关键项仍缺失：\n\n• {缺失项1}\n• {缺失项2}\n\n您希望：",
    options: [
      { label: "仍然确认定版", description: "将当前版本标记为 v1.0 confirmed" },
      { label: "继续补充", description: "回到迭代流程，补充缺失需求" }
    ]
  }]
})
```

**步骤 3：定版写入**

确认后：
- version 升为 "v1.0"
- status 改为 "confirmed"
- 输出完整的正式需求文档

---

### 降级策略

| 场景 | 处理 |
|------|------|
| sales-guide.json 不存在 | 仅用 profile + 行业库推演，标注信息来源有限 |
| 知识库无匹配行业 | analyze-and-synthesize 跳过知识库部分，用行业通用痛点 |
| 用户未提供素材（冷启动） | 全部走推演路径 |
| extract Agent 返回空 | 素材信息量不足，标注并继续 |

不因信息不足停止执行。有限信息的推演需求远好于没有需求文档。

---

### 版本管理

| 场景 | 版本变化 | status |
|------|----------|--------|
| 冷启动首次生成 | v0.1 | draft |
| 迭代补充 | +0.1（v0.1→v0.2→v0.3） | draft |
| 核心需求大幅变更 | +1.0（v0.3→v1.0 或 v1.1→v2.0） | draft |
| 用户确认定版 | 升至整数版（v0.x→v1.0） | confirmed |
| 定版后微调 | +0.1（v1.0→v1.1） | confirmed |

版本快照存储在 versions[] 数组中，每个版本保留完整内容，依赖 git 管理历史。

---

### 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| `/profile` | 上游输入：企业画像、行业、规模、痛点、技术栈 |
| `organization/profile.md` | 可选输入：我方产品线、案例、交付能力、能力边界；不作为客户需求来源 |
| `/sales-guide` | 可选输入：访谈提纲、切入策略、跟进记录 |
| `/knowledge-base` | 可选输入：行业 meta-model，匹配同行业软件需求模式 |
| `/plan-writer` | 下游消费：读取 needs[] 中 status=active 的条目生成方案 |
| `/spec-writer` | 下游消费：读取完整需求 + 约束 + 范围生成产品规格 |
