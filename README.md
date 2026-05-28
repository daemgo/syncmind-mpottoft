# syncMind Skills

AI 驱动的 B2B 销售智能助手平台，为销售团队提供客户分析、方案生成、知识库管理等一站式能力。

## 项目定位

syncMind 是一套基于 Claude AI 的销售赋能工具集，通过结构化的 Skills 和行业知识库，帮助销售人员：

- 快速建立客户档案，掌握客户全貌
- 生成专业解决方案，提升方案质量
- 沉淀行业知识，形成竞争壁垒
- 自动化重复工作，释放销售精力

## 技术栈

- **前端框架**: Next.js 16 + React 19
- **UI 组件**: shadcn/ui + Tailwind CSS v4
- **AI 能力**: Claude Skills（基于 Claude Code）
- **类型系统**: TypeScript 5
- **包管理**: pnpm

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
xiezi-skills/
├── .claude/
│   ├── CLAUDE.md              # 全局配置和输出规范
│   └── skills/                # Claude Skills 目录
│       ├── humanizer-zh/      # 文本人性化处理
│       ├── profile/           # 客户档案生成
│       ├── sales-guide/       # 销售进攻指南
│       ├── requirements/      # 需求分析整理
│       ├── plan-writer/       # 解决方案撰写
│       ├── spec-writer/       # 产品规格说明
│       ├── insights/          # AI 洞察分析
│       ├── knowledge-base/    # 知识库管理
│       ├── init-project/      # 项目初始化
│       └── init-app/          # 应用代码生成
├── docs/
│   ├── customer/              # 当前客户数据
│   ├── customers/             # 客户列表
│   ├── knowledge-base/        # 行业知识库
│   │   ├── index.json         # 知识库索引
│   │   └── meta-models/       # 元模型目录
│   │       └── common/        # 通用元模型
│   │           ├── crm.json           # CRM 元模型
│   │           ├── erp.json           # ERP 元模型
│   │           ├── crm-vendors/       # CRM 厂商模型
│   │           └── erp-vendors/       # ERP 厂商模型
│   └── plan/                  # 方案文档
└── src/                       # 前端应用代码
    ├── app/                   # Next.js App Router
    ├── components/            # UI 组件
    └── types/                 # TypeScript 类型定义
```

## Skills 列表

| Skill | 命令 | 说明 |
|-------|------|------|
| **profile** | `/profile` | 基于客户名称生成客户档案，自动搜索公开信息 |
| **sales-guide** | `/sales-guide` | 生成销售进攻指南，包含破冰话术、竞对分析 |
| **requirements** | `/requirements` | 整理分析客户需求，输出结构化需求文档 |
| **plan-writer** | `/plan-writer` | 生成专业解决方案，A/B 方案对比+专家评审 |
| **spec-writer** | `/spec-writer` | 生成产品需求规格说明书 |
| **insights** | `/insights` | 基于客户数据生成 AI 洞察分析 |
| **knowledge-base** | `/knowledge-base` | 行业知识库管理，元模型录入和查询 |
| **init-project** | `/init-project` | 一句话初始化项目，自动调用相关 skill |
| **init-app** | `/init-app` | 基于 Spec 生成前端 Demo 代码 |
| **humanizer-zh** | `/humanizer-zh` | 去除文本 AI 痕迹，使输出更自然 |

## 知识库

知识库采用两层架构：

### 通用层（Meta Model）
定义产品品类的通用模块、流程、角色，作为分析和对比的基准。

- **CRM 元模型** (`crm.json`) - 客户管理、线索、商机、服务等模块定义
- **ERP 元模型** (`erp.json`) - 财务、采购、销售、库存、生产等模块定义

### 厂商层（Vendor Model）
具体厂商产品的详细分析，映射到通用模型。

**CRM 厂商**:
- 纷享销客 (`fxiaoke.json`) - 连接型 CRM，ShareAI 9 大 Agent
- 销售易 (`neocrm.json`) - 腾讯系 CRM，NeoAgent 6 大 Agent
- 销帮帮 (`xbongbong.json`) - 钉钉生态，中小企业首选

**ERP 厂商**:
- 金蝶云·星空 (`kingdee-k3.json`) - AI 星空，中型制造业
- 用友 U9 Cloud (`yonyou-u9c.json`) - 中大型离散制造
- 用友 BIP 5 (`yonyou-bip5.json`) - 大型企业集团
- 用友 YonSuite (`yonyou-yonsuite.json`) - 成长型企业

## 输出规范

所有 Skill 输出遵循 `humanizer-zh` 规则：

1. 去除 AI 痕迹（避免"此外"、"至关重要"等词汇）
2. 打破公式结构（避免三段式、否定排比）
3. 直接陈述事实，不绕圈子
4. 混合句子长度，段落结尾多样化

## 使用示例

### 初始化客户档案

```
/profile 阿里巴巴
```

### 生成销售指南

```
/sales-guide
```

### 生成解决方案

```
/plan-writer
```

### 查询知识库

```
/knowledge-base 查询纷享销客的AI能力
```

## 开发指南

### 添加新的 Skill

1. 在 `.claude/skills/` 下创建目录
2. 编写 `SKILL.md` 定义 skill 逻辑
3. 确保输出经过 humanizer-zh 处理

### 添加新的厂商模型

1. 在对应的 `vendors/` 目录创建 JSON 文件
2. 遵循现有模型结构（meta、overview、moduleMapping 等）
3. 更新 `index.json` 和父级元模型的 vendors 数组

## License

Private
