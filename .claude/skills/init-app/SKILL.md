---
name: init-app
description: 生成可运行的前端 Demo 代码。支持三种输入：Spec 文档、方案文档、用户直接描述。主对话直接执行分析+生成+验证。
metadata:
  short-description: 生成 Demo 代码
  triggers:
    - "生成demo"
    - "生成代码"
    - "init-app"
    - "初始化应用"
    - "生成应用"
    - "做个demo"
    - "创建一个系统"
  examples:
    - "基于 spec 生成 demo"
    - "生成前端代码"
    - "我要一个 CRM 系统，管理客户、商机、合同"
    - "做一个项目管理的 demo"
  dependencies:
    - spec-writer  # 推荐先有 Spec 文档（非必须）
---

在现有项目中生成可运行的前端 Demo 代码。直接执行，不输出本文档内容。

---

### 核心定位

**生成纯前端 Mock Demo**：基于 Spec、方案或用户描述，生成完整的前端界面 + Mock 数据，代码可直接运行。

#### 重要约束

- **在现有项目中生成**：项目基础设施已就绪，在现有项目基础上添加功能
- **基础技术栈固定**：TanStack Start + Vite、React、TypeScript、Tailwind CSS v4、shadcn/ui，**不接受改变**
- **纯前端 Demo**：Mock 数据的前端演示，不包含真实后端

---

### 三种输入模式

| 模式 | 触发条件 | 数据来源 | 精度 |
|------|---------|---------|------|
| **Mode A: Spec 驱动** | `docs/spec/spec.md` 存在 | spec.md 结构化 Markdown | 最高 |
| **Mode B: Solution 降级** | 无 spec，有 `docs/plan/solution.md` | 从方案 Markdown 提取 | 中等 |
| **Mode C: 对话直接** | 用户描述了具体系统/需求 | 用户对话描述 | 快速原型 |

---

### 模式检测

**核心原则：用户意图优先于文件检测。**

```
1. 先判断用户意图：
   - 用户描述了具体系统（如「生成CRM系统」「做一个项目管理」）→ 直接 Mode C，不检查文件
   - 用户说「基于 spec 生成」「基于方案生成」→ 检查对应文件
   - 用户说「生成 demo」「init-app」等泛指 → 按文件优先级检测

2. 仅当泛指时，按文件检测：
   a. docs/spec/spec.md 存在 → Mode A
   b. 否则 docs/plan/solution.md 存在 → 尝试用 `AskUserQuestion` 询问用户：
      ```
      AskUserQuestion({
        questions: [{
          question: "检测到已有解决方案（docs/plan/solution.md），请选择 Demo 生成方式：",
          options: [
            { label: "先生成 Spec 再生成 Demo", description: "推荐，精度最高。先运行 /spec-writer，再基于 Spec 生成" },
            { label: "直接基于方案生成 Demo", description: "速度快，但页面结构为推断" }
          ]
        }]
      })
      ```
      用户选「先生成 Spec 再生成 Demo」→ 自动执行 /spec-writer 生成 spec.md，完成后继续以 Mode A 执行
      用户选「直接基于方案生成 Demo」→ Mode B
      **如果 AskUserQuestion 超时或不可用** → 自动选择「直接基于方案生成 Demo」（Mode B），不中断流程
   c. 否则 → Mode C
```

**禁止反复追问**：
- 用户给出了系统类型（如 CRM、ERP、项目管理），**不要再问子类型和使用对象**
- **一次只问一个问题**
- 只有用户描述完全无法判断系统类型时（如只说了「做个管理系统」），才用一个选项确认
- 确认后立即执行，不再追问细节

---

### 执行流程

**在主对话中直接执行** `prompts/generate.md` 的流程（分析 → 生成 → 验证），**禁止使用 Agent 委托**。

原因：
- Agent 子进程中 `AskUserQuestion` 无法传递给用户，会超时失败
- 用户无法看到生成中间过程（Read/Write/Build），体验差
- 主对话直接执行仅多占上下文，对一次性生成任务无影响

禁止多 Agent 并行：多个 Agent 操作同一文件系统会导致文件竞争、import 错误和反复 build-fix 循环。

---

### 增量更新

当再次运行时，如果 `docs/spec/.spec-mapping.yaml` 存在：

1. 比对 specHash → 无变化则输出「无更新」并停止
2. 有变化时标记模块：
   - 新模块 → 生成
   - 变更模块（未锁定） → 重新生成
   - 锁定模块（`locked: true`） → 跳过
   - 删除模块 → 警告（不自动删除文件）
3. 共享基础设施仅在 sitemap/dict 变化时重新生成

---

### 代码规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 路由文件 | TanStack Router 约定 | `src/routes/samples/index.tsx`, `src/routes/samples/$id.tsx` |
| 路由路径 | kebab-case | `/samples`, `/sample-receive` |
| 组件文件 | kebab-case | `sample-table.tsx` |
| 组件名 | PascalCase | `SampleTable` |
| 函数 | camelCase | `getSampleList` |
| 常量 | UPPER_SNAKE_CASE | `SAMPLE_STATUS` |
| 类型 | PascalCase | `Sample`, `SampleStatus` |

- TypeScript 严格模式
- 函数组件 + Hooks
- Tailwind CSS 样式，语义化颜色 token
- shadcn/ui 组件规范
- 代码注释用英文

---

### 参考文件

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `design-guide.md` | 设计系统指南（颜色、排版、布局、组件规则） | 生成代码前 |
| `_contracts/data-flow.md` 第 3 节 | spec.md → init-app 的字段契约 | Mode A 分析阶段 |

---

### 目录结构

```
.claude/skills/init-app/
├── SKILL.md              # 本文件：入口（主对话直接执行）
├── design-guide.md       # 设计系统指南
└── prompts/
    └── generate.md       # 全合一 Agent Prompt（分析+生成+验证）
```

---

### 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| `/spec-writer` | 上游，提供 Spec 文档（Mode A） |
| `/plan-writer` | 上游，提供方案文档（Mode B） |
| `/requirements` | 上上游，提供需求数据 |
