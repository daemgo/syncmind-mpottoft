---
name: profile
description: 生成或更新「客户企业背景档案」(docs/customer/profile.json)——仅在用户明确要求建立/更新客户档案或调研客户企业时触发，整合工商、政策、时机、风险等多维数据。
metadata:
  short-description: 生成企业数字化诊断档案
  triggers:
    - "生成客户档案"
    - "更新客户档案"
    - "客户档案"
    - "客户企业档案"
    - "面客准备"
    - "破冰准备"
    - "客户调研"
    - "调研这家企业"
    - "调研一下这家企业"
    - "profile"
  examples:
    - "为XX公司生成客户档案"
    - "帮我调研一下这家企业"
    - "生成面客准备档案"
    - "出一下客户档案"
  dependencies:
    - humanizer-zh
---

直接执行，不输出本文档任何内容。

---

### 企业名称获取

按以下优先级确定 `{company_name}`：

1. **用户消息中包含企业名称** → 直接使用
2. **`docs/customer/profile.json` 已存在** → 读取其中的 `companyName` 字段
3. **以上都没有** → 向用户询问企业名称（仅此一种情况需要追问）

### 覆盖保护检查（在执行流程之前，必须执行）

确定 `{company_name}` 后，读取 `docs/customer/profile.json`：

- **文件不存在** → 跳过检查，直接进入执行流程
- **文件存在**，提取现有 `companyName`：
  - **名称匹配**（同一企业，忽略"有限公司/股份/集团"等后缀，例如"阳光电源" ≡ "阳光电源股份有限公司"） → 视为"更新档案"，继续执行
  - **名称不匹配** → **立即停止**，使用 `AskUserQuestion` 工具询问用户是否覆盖（模板见 `.claude/shared/overwrite-guard.md`）。**未经明确确认，禁止覆盖**

---

### 硬性禁令（违反即视为执行失败）

1. **禁止在 Agent 返回前调用 `Write` 写入 `profile.json`**——profile.json 的内容只能由 collect-new 与 collect-risk 两个 Agent 的返回结果合并而来，主 Agent 不得自己拼凑"基础字段档案"。
2. **禁止向用户追问企业基本信息**（行业、产品、规模、痛点等）。AskUserQuestion 在本 skill 中**仅允许用于"覆盖保护确认"**一种场景（见上文覆盖保护检查）。首次建档时信息不足，走 collect-new.md 的推断流程，不向用户索取。
3. **禁止走"只写公司名和创建时间"的轻量路径**。信息不足不是跳过并行 Agent 的理由——Agent 本身就负责在信息稀疏时做行业推断。
4. 接到 `/profile` 或等价指令后，确定 `{company_name}` + 完成覆盖保护检查后，**下一个动作必须是在同一条消息中并行发起 2 个 Agent 工具调用**（collect-new + collect-risk），不得插入其他工具调用（Bash/Write/AskUserQuestion）。

---

### 执行流程

**第一步：并行采集与分析**

读取以下 2 个 prompt 文件，同时启动 2 个 Agent（在同一条消息中发起 2 个 Agent 工具调用）：

| Agent | Prompt 文件 | 职责 |
|-------|------------|------|
| collect-new | `prompts/collect-new.md` | 官网深挖 + 工商 + 财务 + 招聘 + 竞争 + 新闻 → 直接分析推演 |
| collect-risk | `prompts/collect-risk.md` | 司法风险 + 政策信号 |

启动每个 Agent 时，将 `{company_name}` 注入到 prompt 开头。

collect-new 还需注入：
- `{industry_pain_points}`：行业痛点库内容（`industry-pain-points.md`）

collect-new Agent 完成搜索后直接进行分析推演，返回结构化的分析结论（含企业画像、组织决策链、时机判断、技术栈推断、痛点、机会等）。

**Agent 工具预算约束（主 skill 口径）：**

- `collect-new`：查询服务（`WebFetch`）**最多 3 次**，搜索服务（`WebSearch`）**最多 2 次**。优先先用 1–2 次综合搜索锁定官网、工商、新闻、招聘与行业位势，再用最多 3 次查询补官网首页、产品/服务页、关于页。
- `collect-risk`：保持搜索服务 **1 次** + 查询服务 **1 次（可选）** 的轻量预算，只补司法风险与政策标签。

**第二步：合并与写入**

2 个 Agent 全部返回后：

1. **直接使用** collect-new 返回的 JSON 作为基础结构（字段名已经是正确的，不要改名）
2. 将 collect-new 的 `profile.*` 展开到顶层（companyName, shortName, summary, industry 等）
3. 将 collect-risk 的 `legal` 和 `policy` 合并为 `riskAndPolicy: { legal: {...}, policy: {...} }`：
   - `legal` 字段 1:1 映射：lawsuitCount, executedPerson, dishonestPerson, businessAnomalies, equityFreeze
   - `policy` 字段映射：isSpecializedSME, smeLevel, isHighTech, digitalTransformation(取 .hit 布尔值), esgGreen(取 .hit 布尔值)
   - 将命中的政策标签（如"专精特新""高新技术"）追加到 `tags[]`
4. **JSON 校验**：合并完成后，必须将最终 JSON 通过 `JSON.parse()` 解析验证。若解析失败，检查并修正格式问题（如多余逗号、缺少引号、非法字符等），直到解析通过后才写入文件
5. 将完整 JSON 写入 `docs/customer/profile.json`——**必须严格匹配下方的最终结构，逐字段对照，不允许新增、遗漏或改名任何字段**
5. 输出一句话告知用户完成，不输出完整 Markdown 档案（数据已写入文件，用户在页面上查看）

**profile.json 最终结构（严格模板，禁止偏离）：**

```json
{
  "companyName": "",
  "shortName": "",
  "summary": "",
  "industry": "",
  "subIndustry": "",
  "scale": "",
  "mainBusiness": "",
  "products": [{ "name": "", "description": "" }],
  "targetCustomers": [],
  "businessModel": "",
  "rating": "",
  "tags": [],
  "website": null,
  "slogan": null,
  "isListed": false,
  "stockCode": null,
  "revenueScale": null,
  "registration": {
    "registeredName": "",
    "registeredCapital": "",
    "paidCapital": "",
    "establishedDate": "",
    "legalRepresentative": "",
    "businessStatus": "",
    "shareholders": [],
    "branchCount": null,
    "interpretation": "",
    "organizationType": "",
    "keyFindings": []
  },
  "organization": {
    "type": "",
    "decisionChain": "",
    "keyPersons": [{ "name": "", "title": "" }],
    "salesStrategy": ""
  },
  "timing": {
    "phase": "",
    "analysisBasis": [],
    "entryStrategy": "",
    "urgency": ""
  },
  "hiring": {
    "keySignals": []
  },
  "competition": {
    "industryRank": "",
    "marketShare": "",
    "mainCompetitors": [],
    "knownClients": []
  },
  "riskAndPolicy": {
    "legal": {
      "lawsuitCount": null,
      "executedPerson": false,
      "dishonestPerson": false,
      "businessAnomalies": [],
      "equityFreeze": false
    },
    "policy": {
      "isSpecializedSME": false,
      "smeLevel": "",
      "isHighTech": false,
      "digitalTransformation": false,
      "esgGreen": false
    }
  },
  "painPoints": [{ "area": "", "description": "", "severity": "" }],
  "opportunities": [{ "area": "", "description": "", "likelihood": "" }],
  "analysisPath": "",
  "confidence": 0,
  "metadata": {
    "createdAt": "",
    "updatedAt": "",
    "createdBy": "AI",
    "version": "1.0",
    "sources": [],
    "confidence": 0
  }
}
```

**合并时必须遵守的规则（违反任何一条都会导致前端渲染失败）：**

1. collect-new 的 `profile.*` 必须**展开到顶层**——最终 JSON 中**不能存在 `profile` 嵌套对象**
2. `organization.decisionChain` 是**字符串**（一句话描述决策路径），**不是对象数组**
3. `organization.keyPersons` 每个元素是 `{ "name": "", "title": "" }`，**不是** `{ "role": "", "name": "", "influence": "" }`
4. collect-risk 的 `policy.digitalTransformation.hit` → `riskAndPolicy.policy.digitalTransformation`（**布尔值**，不保留对象结构）
5. collect-risk 的 `policy.esgGreen.hit` → `riskAndPolicy.policy.esgGreen`（**布尔值**，不保留对象结构）
6. `riskAndPolicy.legal.businessAnomalies` 必须是 **string[]**，不能是 boolean
7. `metadata` 必须存在，包含 createdAt/updatedAt/createdBy/version/sources/confidence
8. 使用 `scale`（不是 `employees`）、`products`（不是 `mainProducts`）、`paidCapital`（不是 `paidInCapital`）、`establishedDate`（不是 `foundedDate`）、`organizationType`（不是 `ownershipType`）

**降级策略**

| 场景 | 处理 |
|------|------|
| collect-risk Agent 超时/报错 | 用 collect-new 数据继续，风险字段标注缺失 |
| 搜索结果稀疏 | 基于行业/规模推断 |
| 全部搜索失败 | 直接走纯行业推断路径 |

不因信息不足停止执行。有限信息的推演档案远好于没有档案。

**版本管理**

| 场景 | 版本变化 |
|------|----------|
| 首次生成 | "1.0" |
| 用户要求"更新档案" | minor +0.1（如 1.0→1.1），重新执行采集，仅更新有变化的字段 |
| 核心字段变化（上市/融资/并购/行业变更） | major +1.0（如 1.1→2.0） |
