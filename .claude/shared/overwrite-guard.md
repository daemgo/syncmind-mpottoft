# 客户数据覆盖保护 — AskUserQuestion 模板

写 `docs/customer/` 前检测到目标企业与 `profile.json` 中 `companyName` 不匹配时使用：

```
AskUserQuestion({
  questions: [{
    question: "当前项目已有「{现有企业}」的客户档案，您输入的是「{新企业}」。\n\n覆盖将删除现有的档案、需求、销售指南等全部数据，且不可恢复。",
    options: [
      { label: "覆盖", description: "删除现有数据，采集「{新企业}」" },
      { label: "取消", description: "保留现有数据，不执行" }
    ]
  }]
})
```

**比对规则**：忽略"有限公司""股份""集团"等后缀，取核心名称比较。例：
- "阳光电源" ≡ "阳光电源股份有限公司"
- "字节跳动" ≡ "北京字节跳动科技有限公司"
