# Skill 路由命中率测试

测目标模型（主要是 MiniMax）在 syncMind 项目里把用户输入路由到**正确 skill** 的命中率。

## 快速开始

```bash
cd tests/routing
npm install

# MiniMax（通过 Anthropic 兼容代理）
ANTHROPIC_AUTH_TOKEN=<token> \
ANTHROPIC_BASE_URL=<proxy-url> \
TEST_MODEL=MiniMax-M2 \
npm test

# 对比基线（可选）
TEST_MODEL=qwen3-max npm test
TEST_MODEL=claude-sonnet-4-6 npm test
```

## 工作原理

1. 读 `.claude/CLAUDE.md` 和 `.claude/skills/*/SKILL.md` 构造真实的项目系统提示
2. 定义一个 `Skill` 工具（input 是 skill name 的 enum）
3. 对每个用例用 Anthropic SDK 发起 `messages.create`，观察：
   - 模型调用了 `Skill` 工具 → actual = tool input 里的 skill_name
   - 模型没调用工具 → actual = "(no skill)"
4. 与 `cases.yaml` 里 `expected` 字段比对，统计命中率

**expected 的三种值**：
- skill 名（如 `requirements`）→ 必须调 Skill 工具且 name 匹配
- `none` → 必须不调用工具（提问/短确认/闲聊）
- `followup` → 必须不调用 skill 工具（主 agent 应走 followups.json 写入流程，不属于 skill）

## 用例结构

`cases.yaml` 按 category 分组：

| Category | 目标 |
|----------|------|
| 客户身份铁律 | MiniMax 下高频踩雷：说"客户/他们"就反问身份 |
| requirements 冷启动/更新 | 新增的更新类 triggers 是否真生效 |
| requirements vs spec 冲突 | "补充需求信息" 不再误走 spec-writer |
| profile / sales-guide / plan-writer / spec-writer | 各自核心场景 |
| 消歧-拜访 | "拜访了"（过去时态）vs "拜访方案"（规划） |
| 短确认词 / 提问 | 不应触发 skill |
| 多信息并存 | 优先级顺序 |

## 只跑部分用例

```bash
TEST_CASES=identity-01,conflict-01 npm test
```

## 并发、重复与重试

- **并发**：默认 4，`TEST_CONCURRENCY=8` 调整。MiniMax rate limit 较紧，并发 >4 容易 429
- **N 轮重复**：`TEST_RUNS=3`，每个用例重复 N 次取均值。MiniMax 单次结果噪声大（同一输入跑 5 次可能从 48% 飘到 66%），N=3 是找 stable baseline 的最小成本
- **重试**：内置 3 次重试（指数退避），429 / 5xx / 网络错误都会重试。API 错误不计入命中率分母（会单独打印出来）
- **推荐组合**：`TEST_CONCURRENCY=2 TEST_RUNS=3` — 最稳定的 baseline

## 结果输出

- 控制台输出每个用例 ✓/✗、分类 heatmap（多数决 / 加权）、失败详情（含 actual 分布）、不稳定用例清单
- **多数决命中率**：单 case 的 N 次 run 里命中次数 ≥ 50% 视为该 case 命中。适合看"核心场景是否稳定"
- **加权命中率**：所有成功 run 的平均。更反映"总体命中期望值"
- JSON 结果写到 `results-<model>-<timestamp>.json`，可以 diff 对比不同模型或改动前后

## 判定命中的局限

这个测试不是 100% 还原 Claude Agent SDK 的真实路由——有差异的地方：

1. 真实 runtime 里 skill 清单是 SDK 自动注入的系统 reminder，这里手动拼进 system prompt
2. 真实 Skill 工具的 description 可能略有不同（SDK 内部版本）
3. 真实场景下多轮对话和上下文会影响路由，这里每个用例都是单轮冷启动

但对于**单轮路由命中率**这个核心指标，结果有参考价值。

## 常见用法

**场景 A：改了 SKILL.md 的 description/triggers，验证没退步**
```bash
# 改动前跑一遍
TEST_MODEL=MiniMax-M2 npm test   # 保留 results-*.json

# 改动后再跑
TEST_MODEL=MiniMax-M2 npm test

# 对比两次 JSON 里 byCategory 的命中率
```

**场景 B：找出 MiniMax 的薄弱环节**
```bash
TEST_MODEL=MiniMax-M2 TEST_VERBOSE=1 npm test
```
看失败用例里模型的文字回复，判断是"理解偏差"还是"没意识到该触发 skill"。

**场景 C：调试单个卡壳用例**
```bash
TEST_CASES=conflict-01 TEST_VERBOSE=1 npm test
```
