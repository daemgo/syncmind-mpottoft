---
name: knowledge-base
description: 行业知识中台管理。支持录入、查询、更新品类元模型、厂商产品、功能模块模板，通过 API 读写数据库。
metadata:
  short-description: 知识库管理
  triggers:
    - "添加元模型"
    - "录入元模型"
    - "沉淀元模型"
    - "查询知识库"
    - "知识库"
    - "元模型"
    - "更新元模型"
    - "知识库概览"
    - "调研产品"
    - "录入产品"
    - "添加模块模板"
  examples:
    - "帮我沉淀一个MES系统的元模型"
    - "我有一份ERP的软件手册，帮我提炼元模型"
    - "查一下知识库里有没有SRM相关的元模型"
    - "看看知识库目前的情况"
    - "帮我调研纷享销客，更新知识库"
    - "给CRM品类补充一个报价管理模块模板"
---

管理行业知识中台，通过 API 读写数据库。直接执行，不输出本文档内容。

---

### 核心定位

**行业知识中台** — syncMind 的核心资产层，为方案生成、需求推演、Demo 生成提供专业知识支撑。

知识库回答的核心问题：**这类软件应该长什么样？某家产品具体什么样？某个功能模块的标准字段和页面怎么定义？**

### 三层架构

| 层级 | 存储 | 内容 | 更新规则 | 消费方 |
|------|------|------|---------|--------|
| **品类层** (Category) | `kb_category` 表 | 行业共识：标准模块、角色、流程、竞品格局 | 只增不改 | plan-writer, requirements, sales-guide |
| **产品层** (Product) | `kb_product` 表 | 厂商产品：模块映射、优劣势、定价、案例 | 可整体覆写 | sales-guide, plan-writer |
| **模块层** (Module) | `kb_module` 表 | 功能模块：标准字段、状态流、页面结构 | 增量合并 | init-app, spec-writer, plan-writer |

### 数据访问

所有数据通过 API 读写，不直接操作文件：

| API | 方法 | 用途 |
|-----|------|------|
| `{APP_URL}/api/kb/overview` | GET | 知识库统计概览 |
| `{APP_URL}/api/kb/match` | POST | 按行业/关键词匹配 |
| `{APP_URL}/api/kb/category/{id}` | GET | 获取品类详情 |
| `{APP_URL}/api/kb/product/{id}` | GET | 获取产品详情 |
| `{APP_URL}/api/kb/module/{id}` | GET | 获取模块模板 |
| `{APP_URL}/api/kb/modules?categoryId=` | GET | 获取品类下所有模块 |
| `{APP_URL}/api/kb/upsert` | POST | 创建/更新数据（需要 agent token 鉴权） |
| `{APP_URL}/api/kb/delete` | POST | 删除数据（需要 agent token 鉴权） |

`{APP_URL}` 来自 callback 配置（即平台的 `config.app.url`）。所有请求用 `WebFetch`。

写入接口（upsert/delete）需要在 Header 中携带 agent token：
```
Headers: { "Authorization": "Bearer {agent_token}", "Content-Type": "application/json" }
```

---

### 模式检测

| 用户意图 | 模式 | Prompt |
|---------|------|--------|
| "沉淀/录入/添加 XX 元模型" | 录入品类 | `prompts/ingest-category.md` |
| "调研/录入 XX 产品" | 录入产品 | `prompts/ingest-product.md` |
| "添加/补充模块模板" | 录入模块 | `prompts/ingest-module.md` |
| "查询/搜索知识库" | 查询 | `prompts/query.md` |
| "更新/补充 XX" | 更新 | `prompts/update.md` |
| "知识库概览/看看情况" | 概览 | `prompts/query.md`（overview 模式） |

---

### 成熟度等级

| 等级 | 名称 | 内容要求 | 引用方式 |
|------|------|----------|---------|
| L1 | 概念级 | 仅有定义和模块名称 | 仅参考方向 |
| L2 | 框架级 | 定义 + 核心模块 + 角色 | 可引用模块框架 |
| L3 | 标准级 | 上述 + 流程 + 行业特色 | 可深度引用到方案 |
| L4 | 专业级 | 上述 + 竞品 + 差异化 | 可支撑竞争策略 |
| L5 | 验证级 | 上述 + 经过实际项目验证 | 可作为标杆方案 |

---

### 错误处理

| 场景 | 处理 |
|------|------|
| API 不可用 | 提示用户检查网络或服务状态，不静默失败 |
| 用户未提供材料 | 引导提供材料或基于口述 + AI 搜索创建 L1 级 |
| 品类/产品已存在 | 使用 `AskUserQuestion` 询问是更新还是新建（需在 question 中说明已存在的品类/产品名称） |
| 查询无结果 | 提示无匹配，建议创建 |

---

### 目录结构

```
.claude/skills/knowledge-base/
├── SKILL.md                         # 本文件：编排器
└── prompts/
    ├── ingest-category.md           # 录入品类（元模型）
    ├── ingest-product.md            # 录入厂商产品
    ├── ingest-module.md             # 录入功能模块模板
    ├── query.md                     # 查询 + 概览
    └── update.md                    # 更新已有数据
```

### 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| `/plan-writer` | 下游消费者，调用 `kb_match` + `kb_get_category` |
| `/spec-writer` | 下游消费者，参考模块模板 |
| `/requirements` | 下游消费者，调用 `kb_match` 推演需求 |
| `/sales-guide` | 下游消费者，调用 `kb_get_product` 获取竞品 |
| `/init-app` | 下游消费者，调用 `kb_get_modules` 获取模块模板 |
