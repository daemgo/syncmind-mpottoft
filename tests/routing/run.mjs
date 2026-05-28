#!/usr/bin/env node
/**
 * Skill 路由命中率测试器
 *
 * 用法:
 *   ANTHROPIC_AUTH_TOKEN=xxx ANTHROPIC_BASE_URL=https://xxx TEST_MODEL=MiniMax-M2 node run.mjs
 *
 * 可选环境变量:
 *   TEST_CASES=id1,id2   仅跑指定用例
 *   TEST_CONCURRENCY=4   并发数，默认 4
 *   TEST_VERBOSE=1       打印每次 API 响应
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// ---------- 配置 ----------
const model = process.env.TEST_MODEL || 'MiniMax-M2';
const concurrency = parseInt(process.env.TEST_CONCURRENCY || '4', 10);
const verbose = process.env.TEST_VERBOSE === '1';
const filterIds = process.env.TEST_CASES?.split(',').map(s => s.trim()).filter(Boolean);
const runsPerCase = parseInt(process.env.TEST_RUNS || '1', 10);

// API 模式：anthropic | openai
// 自动检测：baseURL 含 "compatible-mode" 或 "/v1" 结尾 → openai；否则 anthropic
const autodetectApi = (url) => {
  if (!url) return 'anthropic';
  if (/compatible-mode|\/v1\/?$/.test(url)) return 'openai';
  return 'anthropic';
};
const apiMode = process.env.TEST_API
  || autodetectApi(process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL);

const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENAI_API_KEY;
const baseURL = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL;

if (!apiKey) {
  console.error('缺少 ANTHROPIC_AUTH_TOKEN 或 OPENAI_API_KEY 环境变量');
  process.exit(1);
}

const client = apiMode === 'openai'
  ? new OpenAI({ apiKey, baseURL })
  : new Anthropic({ apiKey, baseURL });

// ---------- 加载 CLAUDE.md + skills 清单 ----------
const projectRules = fs.readFileSync(path.join(projectRoot, '.claude/CLAUDE.md'), 'utf-8');

const skillsDir = path.join(projectRoot, '.claude/skills');
const skills = fs.readdirSync(skillsDir)
  .filter(n => fs.statSync(path.join(skillsDir, n)).isDirectory())
  .map(name => {
    const skillPath = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    const content = fs.readFileSync(skillPath, 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (!fmMatch) return null;
    const meta = yaml.load(fmMatch[1]);
    return {
      name: meta.name || name,
      description: meta.description || '',
      triggers: meta.metadata?.triggers || [],
      examples: meta.metadata?.examples || [],
    };
  })
  .filter(Boolean);

const skillNames = skills.map(s => s.name);
const skillInventory = skills.map(s =>
  `- **${s.name}**: ${s.description}\n  触发词: ${s.triggers.join('、')}\n  示例: ${s.examples.join(' | ')}`
).join('\n\n');

// ---------- 构造 Skill 工具 + system prompt ----------
const skillTool = {
  name: 'Skill',
  description: '触发一个 skill 执行。仅在用户输入确实需要触发 skill 时调用；若是提问/短确认词/闲聊/客户互动记录，不要调用。',
  input_schema: {
    type: 'object',
    properties: {
      skill_name: {
        type: 'string',
        enum: skillNames,
        description: '要触发的 skill 名称',
      },
    },
    required: ['skill_name'],
  },
};

const systemPrompt = `${projectRules}

---

## 可用 Skill

${skillInventory}

---

## 你的任务

你是 syncMind 主 agent。收到用户输入后，基于上方项目规则和 skill 描述判断应当：
1. 调用 \`Skill\` 工具触发某个 skill（输入确实是指令且匹配某个 skill）
2. 不调用工具，直接文字回复（提问 / 短确认 / 闲聊 / 客户互动记录 / 需更多信息）

本测试环境只提供 \`Skill\` 工具，不提供 Read/Write/AskUserQuestion 工具。因此：
- 若项目规则要求先读取 \`docs/customer/profile.json\`，不要用文字说"我先读取"，而是继续判断读取后最终应该进入哪个 skill，并直接调用 \`Skill\`。
- 若真实 runtime 只会写 followups.json，且不会继续执行任何 skill，不调用 \`Skill\`。
- 若真实 runtime 会先写 followups.json、再继续执行某个 skill，本测试只判断最终 skill，因此必须调用对应 \`Skill\`。
- 若真实 runtime 会执行某个 skill，无论中间是否需要先读文件，都调用对应 \`Skill\`。
- 只有提问、闲聊、短确认词、纯跟进记录、确实无法判断的场景才不调用工具。

高风险消歧样例：
- "今天拜访了张总，聊了 2 小时" 是纯跟进记录，不调用 \`Skill\`。
- "他们 CTO 觉得我们方案里的监控模块不够完善" 是客户反馈/功能缺口，调用 \`requirements\`。
- "今天拜访了阳光电源，客户说他们要做数据中台" 是跟进记录 + 新需求，调用 \`requirements\`。
- "更新一下档案" 没有客户侧限定词，不调用 \`Skill\`。`;

// ---------- 加载用例 ----------
const casesData = yaml.load(fs.readFileSync(path.join(__dirname, 'cases.yaml'), 'utf-8'));
let cases = casesData.cases;
if (filterIds) cases = cases.filter(c => filterIds.includes(c.id));

console.log(`模型: ${model}`);
console.log(`API 模式: ${apiMode}`);
console.log(`用例数: ${cases.length}`);
console.log(`并发: ${concurrency}`);
console.log(`每用例重复: ${runsPerCase}`);
console.log(`Skill 数: ${skills.length}\n`);

// ---------- 并发执行 ----------
const maxRetries = parseInt(process.env.TEST_RETRIES || '3', 10);

// OpenAI function-calling 版本的 Skill 工具
const openaiSkillTool = {
  type: 'function',
  function: {
    name: 'Skill',
    description: skillTool.description,
    parameters: skillTool.input_schema,
  },
};

async function callAnthropic(tc) {
  const resp = await client.messages.create({
    model,
    max_tokens: 500,
    system: systemPrompt,
    tools: [skillTool],
    messages: [{ role: 'user', content: tc.input }],
  });
  let actualSkill = null;
  let textReply = '';
  for (const block of resp.content) {
    if (block.type === 'tool_use' && block.name === 'Skill') {
      actualSkill = block.input.skill_name;
    } else if (block.type === 'text') {
      textReply += block.text;
    }
  }
  return { actualSkill, textReply };
}

async function callOpenAI(tc) {
  const resp = await client.chat.completions.create({
    model,
    max_tokens: 500,
    tools: [openaiSkillTool],
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: tc.input },
    ],
  });
  const msg = resp.choices[0].message;
  let actualSkill = null;
  let textReply = msg.content || '';
  const toolCalls = msg.tool_calls || [];
  for (const tc2 of toolCalls) {
    if (tc2.function?.name === 'Skill') {
      try {
        const args = JSON.parse(tc2.function.arguments || '{}');
        actualSkill = args.skill_name || null;
      } catch {
        actualSkill = null;
      }
    }
  }
  return { actualSkill, textReply };
}

async function runOne(tc) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { actualSkill, textReply } = apiMode === 'openai'
        ? await callOpenAI(tc)
        : await callAnthropic(tc);

      let hit;
      if (tc.expected === 'none' || tc.expected === 'followup') {
        hit = actualSkill === null;
      } else {
        hit = actualSkill === tc.expected;
      }

      return {
        ...tc,
        actual: actualSkill ?? '(no skill)',
        textReply: (textReply || '').slice(0, 200),
        hit,
        errored: false,
      };
    } catch (e) {
      lastErr = e;
      // 429 / 5xx / network error：退避重试
      const retriable = e.status === 429 || e.status >= 500 || !e.status;
      if (!retriable || attempt === maxRetries) break;
      const backoff = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  return { ...tc, actual: '(error)', hit: false, errored: true, error: lastErr?.message };
}

async function runBatch() {
  // 展开 N 轮重复：每个 case 变成 N 个独立 job
  const jobs = [];
  for (let run = 0; run < runsPerCase; run++) {
    for (const tc of cases) jobs.push({ tc, run });
  }

  const totalJobs = jobs.length;
  const caseResults = new Map(); // id -> { id, input, expected, category, rationale, runs: [{actual, hit, textReply, error}] }
  let done = 0;
  const queue = [...jobs];

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) return;
      const r = await runOne(job.tc);
      done++;

      if (!caseResults.has(job.tc.id)) {
        caseResults.set(job.tc.id, {
          id: job.tc.id,
          input: job.tc.input,
          expected: job.tc.expected,
          category: job.tc.category,
          rationale: job.tc.rationale,
          runs: [],
        });
      }
      caseResults.get(job.tc.id).runs.push({
        actual: r.actual,
        hit: r.hit,
        errored: r.errored,
        textReply: r.textReply,
        error: r.error,
      });

      const mark = r.hit ? '✓' : '✗';
      const got = r.hit ? '' : `  → got: ${r.actual}`;
      const tag = runsPerCase > 1 ? ` (run ${job.run + 1}/${runsPerCase})` : '';
      console.log(`[${done}/${totalJobs}] ${mark} ${r.id.padEnd(16)}${tag} "${r.input.slice(0, 40)}${r.input.length > 40 ? '…' : ''}"${got}`);
      if (verbose && r.textReply) console.log(`        reply: ${r.textReply.slice(0, 100)}`);
      if (r.error) console.log(`        ERR: ${r.error}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // 聚合成单个 result：hit 率基于**成功完成的 runs**，api error 不计入分母
  const results = [];
  for (const cr of caseResults.values()) {
    const validRuns = cr.runs.filter(r => !r.errored);
    const erroredRuns = cr.runs.filter(r => r.errored);
    const hitCount = validRuns.filter(r => r.hit).length;
    const validCount = validRuns.length;
    const actualDistribution = {};
    for (const r of validRuns) {
      const key = r.actual;
      actualDistribution[key] = (actualDistribution[key] || 0) + 1;
    }
    const hitRate = validCount > 0 ? hitCount / validCount : 0;
    results.push({
      id: cr.id,
      input: cr.input,
      expected: cr.expected,
      category: cr.category,
      rationale: cr.rationale,
      runs: cr.runs.length,
      validRuns: validCount,
      erroredRuns: erroredRuns.length,
      hitCount,
      hitRate,
      hit: validCount > 0 && hitRate >= 0.5,
      actual: validCount > 0
        ? Object.entries(actualDistribution).sort((a, b) => b[1] - a[1])[0][0]
        : '(all errored)',
      actualDistribution,
    });
  }
  return results;
}

const results = await runBatch();
results.sort((a, b) => cases.findIndex(c => c.id === a.id) - cases.findIndex(c => c.id === b.id));

// ---------- 汇总 ----------
const total = results.length;
const majorityHits = results.filter(r => r.hit).length;                          // 多数决命中（单 case）
const totalRuns = results.reduce((sum, r) => sum + r.runs, 0);
const totalValidRuns = results.reduce((sum, r) => sum + r.validRuns, 0);
const totalErroredRuns = results.reduce((sum, r) => sum + r.erroredRuns, 0);
const totalHitRuns = results.reduce((sum, r) => sum + r.hitCount, 0);
const weightedHitRate = totalValidRuns > 0 ? totalHitRuns / totalValidRuns : 0;

console.log(`\n${'='.repeat(60)}`);
console.log(`多数决命中率: ${majorityHits}/${total} = ${(majorityHits / total * 100).toFixed(1)}%  (单 case 成功 run 的命中比例 ≥ 50% 视为命中)`);
console.log(`加权命中率:   ${totalHitRuns}/${totalValidRuns} = ${(weightedHitRate * 100).toFixed(1)}%  (所有成功 run 的平均)`);
if (totalErroredRuns > 0) {
  console.log(`API 错误 run:  ${totalErroredRuns}/${totalRuns} = ${(totalErroredRuns / totalRuns * 100).toFixed(1)}%  (已从命中率分母中排除)`);
}
console.log('='.repeat(60));

const byCategory = {};
for (const r of results) {
  const cat = r.category || '(未分类)';
  if (!byCategory[cat]) byCategory[cat] = { total: 0, hit: 0, hitRateSum: 0, failures: [] };
  byCategory[cat].total++;
  byCategory[cat].hitRateSum += r.hitRate;
  if (r.hit) byCategory[cat].hit++;
  else byCategory[cat].failures.push(r);
}

console.log('\n分类命中率（多数决 / 加权）:');
for (const [cat, stats] of Object.entries(byCategory)) {
  const rate = (stats.hit / stats.total * 100).toFixed(0);
  const weighted = (stats.hitRateSum / stats.total * 100).toFixed(0);
  const barLen = Math.round(stats.hit / stats.total * 20);
  const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
  console.log(`  ${bar} ${rate.padStart(3)}% / ${weighted.padStart(3)}%  ${cat} (${stats.hit}/${stats.total})`);
}

const failures = results.filter(r => !r.hit);
if (failures.length > 0) {
  console.log(`\n失败用例 (${failures.length}):`);
  for (const f of failures) {
    console.log(`  [${f.id}] "${f.input}"`);
    const distStr = Object.entries(f.actualDistribution)
      .map(([k, v]) => `${k}×${v}`).join(', ');
    const errSuffix = f.erroredRuns > 0 ? `  (api 错误 ${f.erroredRuns})` : '';
    console.log(`    期望: ${f.expected.padEnd(14)}  命中: ${f.hitCount}/${f.validRuns}${errSuffix}  分布: ${distStr || '(none)'}`);
    if (f.rationale) console.log(`    ↳ ${f.rationale}`);
  }
}

// 不稳定的 case（hitRate 既不是 0 也不是 1）
if (runsPerCase > 1) {
  const flaky = results.filter(r => r.hitRate > 0 && r.hitRate < 1);
  if (flaky.length > 0) {
    console.log(`\n不稳定用例 (N=${runsPerCase} 下 hitRate ∉ {0, 1})：共 ${flaky.length} 个`);
    for (const f of flaky) {
      console.log(`  [${f.id}] ${f.hitCount}/${f.runs}  "${f.input.slice(0, 40)}${f.input.length > 40 ? '…' : ''}"`);
    }
  }
}

// ---------- 保存结果 ----------
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outPath = path.join(__dirname, `results-${model}-${ts}.json`);
fs.writeFileSync(outPath, JSON.stringify({
  model,
  runsPerCase,
  timestamp: new Date().toISOString(),
  total,
  majorityHits,
  majorityHitRate: majorityHits / total,
  weightedHitRate,
  totalRuns,
  totalValidRuns,
  totalErroredRuns,
  totalHitRuns,
  byCategory: Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, {
      total: v.total,
      hit: v.hit,
      majorityRate: v.hit / v.total,
      weightedRate: v.hitRateSum / v.total,
    }])
  ),
  results,
}, null, 2));

console.log(`\n详细结果: ${path.relative(projectRoot, outPath)}`);
