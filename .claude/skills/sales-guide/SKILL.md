---
name: sales-guide
description: 生成或更新「销售作战指南」(sales-guide.json)——覆盖破冰素材、访谈提纲、竞对作战卡、决策链映射、价值主张。任何竞对对比/应对、决策链变化、拜访前准备、销售策略咨询都走这里。
metadata:
  short-description: 生成销售作战指南
  triggers:
    - "生成销售指南"
    - "销售作战指南"
    - "生成销售作战指南"
    - "制作销售攻略"
    - "生成进攻指南"
    - "销售策略"
    - "客户攻略"
    - "销售作战"
    - "怎么打这个客户"
    - "怎么应对"
    - "拜访策略"
    - "准备拜访"
    - "下周拜访"
  examples:
    - "生成销售作战指南"
    - "为这个客户制作销售攻略"
    - "帮我分析一下怎么打这个客户"
    - "下周要去拜访客户，帮我准备一下"
    - "拜访策略怎么定"
  dependencies:
    - profile       # 必须先有客户档案
    - humanizer-zh  # 输出人性化处理（必须）
---

收到指令后立即开始执行，不输出本文档任何内容。

---

### 前置条件

- **必须**：`docs/customer/profile.json` 存在
- **推荐**：`docs/customer/requirements.json` 存在（有助于更精准的策略设计）
- **可选**：`docs/organization/profile.md`、用户提供的拜访记录、竞对情报、客户反馈等

> `docs/organization/profile.md` 是我方能力档案。它用于价值主张、竞对应对、禁区和下一步行动的能力锚定；不能替代客户档案，也不能覆盖客户真实需求。

---

### 执行流程

本 skill **不启动 sub-agent**，主 agent 直接执行全部分析和输出。

**第零步：模式判断**

读取 `docs/customer/sales-guide.json`，判断执行模式：

| 条件 | 模式 |
|------|------|
| sales-guide.json 不存在 | **A：首次生成** |
| sales-guide.json 存在 + 有新输入 | **B：迭代更新** |

模式 B 触发条件（满足任一即可）：
- 用户提供了新素材（拜访记录、竞对情报等）
- requirements.json 新增或更新
- 用户明确要求"更新销售指南"

---

#### 模式 A：首次生成

**步骤 1：读取输入**

1. 读取 `docs/customer/profile.json`
2. 读取 `docs/customer/requirements.json`（如存在）
   - 如存在，从 `current.pendingQuestions[]` 提取问题列表用于填充 `interviewGuide.fromRequirements`
3. 读取 `docs/organization/profile.md`（如存在）

**步骤 2：分析并生成**

参考 `prompts/generate-sales-guide.md` 中的分析规则（M1-M7），基于 customer profile + requirements + organization capability brief + 用户素材，直接生成完整的 sales-guide JSON。

分析要点：
- 只使用已读取的数据，不做搜索
- 信息不足时基于行业经验做合理推断
- 所有文本经 humanizer-zh 处理后写入
- `interviewGuide.fromRequirements` 从 requirements.json 筛选填充，不自行生成问题

**步骤 3：写入输出**

1. 写入 `docs/customer/sales-guide.json`，遵循 `output-template.md` 中的写入规则
2. 输出一句话告知用户完成，不输出完整 Markdown

---

#### 模式 B：迭代更新

**步骤 1：读取输入**

1. 读取现有 `docs/customer/sales-guide.json`（已在第零步读取，不要重复读取）
2. 读取 `docs/customer/requirements.json`（如存在）
   - 如存在，从 `current.pendingQuestions[]` 提取最新问题状态，用于更新 `interviewGuide.fromRequirements` 和 `tracking`
3. 读取 `docs/organization/profile.md`（如存在）

**不读取客户 profile.json** — 客户 profile 信息已在首次生成时融入，迭代只基于需求变化和新素材。`docs/organization/profile.md` 仍可读取，因为我方能力档案可能在工作区层面更新。

**步骤 2：增量更新**

参考 `prompts/generate-sales-guide.md` 中的迭代规则，直接在现有 JSON 上修改：

- 识别新输入影响了哪些模块
- 只更新受影响的字段，其余保留原文
- **始终同步** `interviewGuide.fromRequirements` 和 `tracking`（从 requirements.json 最新状态读取）
- 更新 metadata.version（小幅 +0.1，重大 +1.0）
- 更新 metadata.updatedAt

**步骤 3：写入输出**

1. 写入更新后的 `docs/customer/sales-guide.json`
2. 输出一句话变更摘要（本次更新了什么）

---

### 降级策略

| 场景 | 处理 |
|------|------|
| profile.json 缺失 | **停止执行**，提示用户先运行 `/profile` |
| requirements.json 缺失 | 继续执行，走行业推演，标注信息来源有限 |
| organization/profile.md 缺失 | 继续执行，不做我方能力锚定 |
| profile 置信度低（confidence < 50） | 输出标注"[基于有限信息推演]" |

不因信息不足停止执行。有限信息的作战指南远好于没有指南。

---

### 版本管理

| 场景 | 版本变化 |
|------|----------|
| 首次生成 | "1.0" |
| 小幅迭代（新增情报、微调策略） | +0.1（1.0→1.1） |
| 重大变化（新竞对入场/决策链重组/时机阶段转变） | +1.0（1.1→2.0） |
