# 我方能力档案契约

`docs/organization/profile.md` 是 syncMind 平台注入到项目工作区的我方能力档案。它描述的是**我方公司/团队能做什么**，不是当前客户的企业背景。

---

## 读写边界

- 所有销售链路 skill 只能**读取**该文件，禁止在客户项目中创建或修改它。
- 文件不存在时视为"未配置我方能力档案"，继续执行，不追问用户。
- 该文件不能替代客户档案、客户需求、拜访记录或客户原话。
- 该文件使用 Markdown 存储，方便模型快速读取、裁剪和引用；不要要求 agent 将其转换为完整 JSON 再分析。

---

## 标准路径

```text
docs/organization/profile.md
```

---

## Markdown 模板

```markdown
# 我方能力档案：{companyName}

## 公司定位

- 一句话定位：{oneLiner}
- 官网：{website}
- 成立时间：{founded}
- 团队规模：{size}
- 重点行业：{industries}
- 核心价值主张：{valueProp}

## 目标客户

- 行业：{targetCustomer.industry}
- 规模：{targetCustomer.size}
- 关键角色：{targetCustomer.role}
- 收入规模：{targetCustomer.revenue}
- 说明：{targetCustomer.note}

## 产品线与能力

### {productLine.name}

- 描述：{productLine.description}
- 典型场景：{productLine.scenarios}
- 核心优势：{productLine.strengths}

## 案例资产

### {caseStudy.title}

- 行业：{caseStudy.industry}
- 客户类型：{caseStudy.customerType}
- 客户问题：{caseStudy.problem}
- 我方方案：{caseStudy.solution}
- 结果成效：{caseStudy.result}
- 关联产品：{caseStudy.relatedProduct}

## 交付能力

- 实施方式：{deliveryCapability.implementationMode}
- 典型周期：{deliveryCapability.typicalTimeline}
- 集成能力：{deliveryCapability.integrationCapabilities}
- 服务范围：{deliveryCapability.serviceScope}
- 客户侧前提：{deliveryCapability.prerequisites}
- 报价与商务备注：{deliveryCapability.pricingNotes}

## 能力边界

- {capabilityBoundary}

## 竞对打法

### {competitorPlay.competitor}

- 竞对定位：{competitorPlay.positioning}
- 我方优势：{competitorPlay.ourAdvantages}
- 应对策略：{competitorPlay.counterStrategy}

## 更新信息

- 更新时间：{updatedAt}
```

---

## 读取方式

下游 skill 读取该 Markdown 后，只抽取与当前客户行业、痛点、需求、竞对相关的段落，构造成短摘要注入后续 Agent。不要把整篇能力档案无差别塞进客户方案。

建议摘要结构：

```markdown
## 我方能力摘要
- 公司定位：
- 匹配产品线：
- 可引用案例：
- 交付能力：
- 能力边界：
- 竞对打法：
```

---

## 使用原则

1. **客户优先**：客户需求必须来自 `docs/customer/profile.json`、`docs/customer/requirements.json`、拜访材料、知识库或用户输入，不能因为我方有某项能力就生成客户需求。
2. **能力约束**：方案设计、销售打法和下一步行动可以参考我方产品线、案例、交付能力、边界和竞对打法。
3. **边界透明**：能力边界只能用于风险、假设、范围边界、下一步确认事项，不能直接删除客户侧需求。
4. **案例克制**：案例只能作为相似案例或可信背书，不得编造客户名称、结果数字或承诺效果。
5. **差异化表达**：竞对打法可用于竞对应对和差异化优势，但必须结合当前客户痛点和需求，不做空泛对比。
