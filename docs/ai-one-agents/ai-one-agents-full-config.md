# AI-One Agents 工作模式与配置方案

**版本**: v2.0  
**创建时间**: 2026-03-06 03:56 UTC  
**设计人**: AI-Secretary (小兰) 📋  
**状态**: 📝 完整设计中

---

## 📋 目录

1. [当前 agents 总览](#当前-agents-总览)
2. [各 agent 工作模式分析](#各-agent-工作模式分析)
3. [沟通对象矩阵](#沟通对象矩阵)
4. [配置方案设计](#配置方案设计)
5. [实施计划](#实施计划)

---

## 当前 agents 总览

### 已创建的 agents

| Agent | 目录 | Workspace | 状态 | 优先级 |
|-------|------|-----------|------|--------|
| **AI-Secretary** | `agents/secretary/` | `workspace-secretary/` | ✅ 运行中 | 🔴 当前会话 |
| **AI-CTO** | `agents/cto/` | `workspace-cto/` | ✅ 已创建 | 🔴 P0 |
| **AI-COO** | `agents/coo/` | `workspace-coo/` | ✅ 已创建 | 🔴 P0 |
| **AI-PM** | `agents/pm/` | `workspace-pm/` | ✅ 已创建 | 🔴 P0 |
| **AI-DevOps** | `agents/devops/` | `workspace-devops/` | ✅ 已创建 | 🟡 P1 |
| **AI-Main** | `agents/main/` | - | ✅ 已创建 | 🟢 系统 |

### 工作区已存在但 agent 未创建

| Agent | Workspace | 状态 | 优先级 |
|-------|-----------|------|--------|
| **AI-CPO** | `workspace-cpo/` | ⏳ 工作区存在 | 🔴 P0 |
| **AI-Analyst** | `workspace-analyst/` | ⏳ 工作区存在 | 🟡 P1 |
| **AI-Marketing** | `workspace-marketing/` | ⏳ 工作区存在 | 🟡 P1 |
| **AI-Auditor** | `workspace-auditor/` | ⏳ 工作区存在 | 🟡 P1 |
| **AI-QA** | `workspace-qa-1/` | ⏳ 工作区存在 | 🟡 P1 |

---

## 各 agent 工作模式分析

### AI-Secretary (小兰)

**角色**: 秘书总监

**工作模式**:
- ✅ **实时在线** - 随时响应主人指令
- ✅ **主动汇报** - 定期向主人汇报进度
- ✅ **协调调度** - 协调其他 agents 工作

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **CEO (主人)** | 实时 | 直接对话 | 接收指令、汇报工作 |
| **AI-CTO** | 每日 | sessions_spawn | 任务分配、进度跟踪 |
| **AI-COO** | 每日 | sessions_send | 资源协调 |
| **AI-PM** | 每日 | inbox 文件 | PRD 文档收集 |
| **所有 agents** | 每周 | 周报汇总 | 周度工作总结 |

**唤醒配置**:
```json
{
  "agentId": "secretary",
  "mode": "always_on",
  "priority": "highest",
  "autoResponse": true
}
```

---

### AI-CTO (技术总监)

**角色**: 技术决策 + 开发领导

**工作模式**:
- 📝 **项目驱动** - 按项目任务唤醒
- 📝 **异步开发** - 接收任务后独立开发
- 📝 **定期汇报** - 每日 18:00 UTC 汇报进度

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-Secretary** | 每日 | sessions_send | 进度汇报、问题上报 |
| **AI-DevOps** | 按需 | inbox 文件 | CI/CD 配置、部署任务 |
| **AI-PM** | 按需 | 会议/文档 | 需求评审、技术评审 |
| **AI-CPO** | 每周 | 会议 | 技术路线规划 |

**唤醒配置**:
```json
{
  "agentId": "cto",
  "mode": "on_demand",
  "priority": "high",
  "autoResponse": false,
  "scheduleCheck": "18:00 UTC daily"
}
```

**典型任务**:
```javascript
sessions_spawn({
  agentId: "cto",
  task: "开发 AI-One Phase 1 热更新系统",
  mode: "session",
  thread: true,
  timeoutSeconds: 7200,
  deliverTo: "secretary"
});
```

---

### AI-COO (运营总监)

**角色**: 资源协调 + 运营支持

**工作模式**:
- 📝 **资源调度** - 协调人力、物力资源
- 📝 **流程优化** - 优化工作流程
- 📝 **风险管理** - 识别和管理风险

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-Secretary** | 每日 | sessions_send | 资源状态汇报 |
| **AI-CTO** | 按需 | inbox 文件 | 资源申请审批 |
| **AI-PM** | 按需 | 会议 | 产品运营策略 |
| **AI-Marketing** | 每周 | 会议 | 市场推广计划 |

**唤醒配置**:
```json
{
  "agentId": "coo",
  "mode": "scheduled",
  "priority": "medium",
  "schedule": ["09:00 UTC", "18:00 UTC"],
  "autoResponse": false
}
```

---

### AI-PM (产品经理)

**角色**: 产品需求分析 + PRD 编写

**工作模式**:
- 📝 **需求驱动** - 根据产品需求开展工作
- 📝 **文档输出** - 输出 PRD、调研报告
- 📝 **协作配合** - 配合 AI-CPO 战略

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-Secretary** | 每日 | inbox 文件 | PRD 文档提交 |
| **AI-CPO** | 每周 | 会议 | 产品战略对齐 |
| **AI-CTO** | 按需 | 评审会议 | 需求评审、技术评审 |
| **AI-Marketing** | 按需 | 文档共享 | 产品特性说明 |

**唤醒配置**:
```json
{
  "agentId": "pm",
  "mode": "on_demand",
  "priority": "high",
  "deliverables": ["PRD", "research_report"],
  "autoResponse": false
}
```

**典型任务**:
```javascript
sessions_spawn({
  agentId: "pm",
  task: "编写 AI-One Phase 1 PRD 文档",
  mode: "session",
  thread: true,
  timeoutSeconds: 3600,
  output: ["workspace-pm/prd/phase1-prd.md"]
});
```

---

### AI-DevOps (运维工程师)

**角色**: CI/CD + 基础设施

**工作模式**:
- 📝 **任务驱动** - 接收 CI/CD 配置任务
- 📝 **自动化优先** - 优先使用自动化脚本
- 📝 **监控告警** - 监控系统状态

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-CTO** | 按需 | inbox 文件 | CI/CD 任务接收 |
| **AI-Secretary** | 每周 | 周报 | 基础设施状态 |
| **所有 agents** | 按需 | 系统通知 | 系统告警、维护通知 |

**唤醒配置**:
```json
{
  "agentId": "devops",
  "mode": "on_demand",
  "priority": "medium",
  "autoResponse": false,
  "monitoring": true
}
```

---

### AI-CPO (产品总监) - 待创建

**角色**: 产品战略规划

**工作模式**:
- 📝 **战略驱动** - 制定产品战略和路线图
- 📝 **决策支持** - 为 CEO 提供产品决策建议
- 📝 **指导执行** - 指导 AI-PM 执行

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **CEO (主人)** | 每周 | 会议/报告 | 产品战略汇报 |
| **AI-Secretary** | 每日 | sessions_send | 战略执行状态 |
| **AI-PM** | 每周 | 会议 | 产品战略对齐 |
| **AI-CTO** | 每周 | 会议 | 技术路线规划 |

**唤醒配置**:
```json
{
  "agentId": "cpo",
  "mode": "scheduled",
  "priority": "high",
  "schedule": ["Monday 10:00 UTC"],
  "autoResponse": false
}
```

---

### AI-Analyst (数据分析师) - 待创建

**角色**: 数据收集、分析、报告

**工作模式**:
- 📝 **数据驱动** - 收集和分析各类数据
- 📝 **报告输出** - 输出数据分析报告
- 📝 **洞察提供** - 提供业务洞察

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-Secretary** | 每日 | inbox 文件 | 数据报告提交 |
| **AI-COO** | 按需 | 数据请求 | 运营数据分析 |
| **AI-PM** | 按需 | 数据请求 | 用户行为分析 |
| **AI-Marketing** | 按需 | 数据请求 | 市场数据分析 |

**唤醒配置**:
```json
{
  "agentId": "analyst",
  "mode": "scheduled",
  "priority": "medium",
  "schedule": ["Daily 08:00 UTC"],
  "deliverables": ["daily_report", "weekly_analysis"]
}
```

---

### AI-Marketing (市场专员) - 待创建

**角色**: 品牌推广 + 市场推广

**工作模式**:
- 📝 **活动驱动** - 策划和执行市场活动
- 📝 **内容输出** - 输出市场宣传内容
- 📝 **渠道管理** - 管理各推广渠道

**沟通对象**:
| 对象 | 频率 | 方式 | 内容 |
|------|------|------|------|
| **AI-Secretary** | 每周 | 周报 | 市场推广汇报 |
| **AI-COO** | 按需 | 预算申请 | 市场预算审批 |
| **AI-PM** | 按需 | 产品资料 | 产品特性了解 |
| **AI-Analyst** | 按需 | 数据请求 | 市场数据分析 |

**唤醒配置**:
```json
{
  "agentId": "marketing",
  "mode": "on_demand",
  "priority": "low",
  "autoResponse": false
}
```

---

## 沟通对象矩阵

### 完整沟通矩阵

```
                │ CEO  │Secy │ CTO │ COO │ PM  │ CPO │DevOps│Analyst│Mktg │
────────────────┼──────┼─────┼─────┼─────┼─────┼─────┼──────┼───────┼─────┤
CEO (主人)       │  -   │ 实时 │ 按需│ 按需│ 按需│ 每周 │  -   │  -    │  -  │
AI-Secretary    │ 实时 │  -  │ 每日│ 每日│ 每日│ 每日 │ 每周 │ 每日  │ 每周│
AI-CTO          │  -   │ 每日 │  -  │ 按需│ 按需│ 每周 │ 按需 │ 按需  │  -  │
AI-COO          │  -   │ 每日 │ 按需│  -  │ 按需│ 按需 │ 按需 │ 按需  │ 每周│
AI-PM           │  -   │ 每日 │ 按需│ 按需│  -  │ 每周 │  -   │ 按需  │ 按需│
AI-CPO          │ 每周 │ 每日 │ 每周│ 按需│ 每周│  -  │  -   │ 按需  │ 按需│
AI-DevOps       │  -   │ 每周 │ 按需│  -  │  -  │  -  │  -   │  -    │  -  │
AI-Analyst      │  -   │ 每日 │  -  │ 按需│ 按需│  -  │  -   │  -    │ 按需│
AI-Marketing    │  -   │ 每周 │  -  │ 每周│ 按需│ 按需 │  -   │ 按需  │  -  │
```

**图例**:
- **实时**: 随时响应，秒级回复
- **每日**: 每日固定时间沟通
- **每周**: 每周固定时间沟通
- **按需**: 根据需要临时沟通

---

## 配置方案设计

### 方案 A: 基于 agents 目录的动态配置 (推荐) ⭐

**原理**: `agents_list` 根据 `/home/node/.openclaw/agents/` 目录动态生成权限配置

**实施步骤**:

1. **补全所有 agents 目录**
```bash
# 创建缺失的 agents
for agent in cpo analyst marketing auditor; do
  mkdir -p /home/node/.openclaw/agents/$agent
  cat > /home/node/.openclaw/agents/$agent/SOUL.md << EOF
# AI-${agent^^} SOUL

**角色**: AI-${agent^}

**职责**: TBD

**工作区**: /home/node/.openclaw/workspace-${agent}
EOF
done
```

2. **验证 agents_list**
```bash
agents_list
# 预期返回包含所有 agents
```

3. **测试唤醒**
```javascript
sessions_spawn({
  agentId: "cto",
  task: "测试任务",
  mode: "session"
});
```

**优点**:
- ✅ 简单，无需额外配置
- ✅ 自动发现新 agents
- ✅ 基于文件系统，易于管理

**缺点**:
- ⚠️ 无法细粒度控制权限
- ⚠️ 无法配置唤醒策略

---

### 方案 B: subagents.json 配置文件

**配置文件位置**: `~/.openclaw/subagents.json`

**配置内容**:
```json
{
  "version": 1,
  "requester": "secretary",
  "allowAny": false,
  "agents": [
    {
      "id": "cto",
      "name": "AI-CTO",
      "workspace": "workspace-cto",
      "mode": "on_demand",
      "priority": "high",
      "scheduleCheck": "18:00 UTC daily"
    },
    {
      "id": "coo",
      "name": "AI-COO",
      "workspace": "workspace-coo",
      "mode": "scheduled",
      "schedule": ["09:00 UTC", "18:00 UTC"]
    },
    {
      "id": "pm",
      "name": "AI-PM",
      "workspace": "workspace-pm",
      "mode": "on_demand",
      "priority": "high",
      "deliverables": ["PRD", "research_report"]
    },
    {
      "id": "cpo",
      "name": "AI-CPO",
      "workspace": "workspace-cpo",
      "mode": "scheduled",
      "schedule": ["Monday 10:00 UTC"]
    },
    {
      "id": "devops",
      "name": "AI-DevOps",
      "workspace": "workspace-devops",
      "mode": "on_demand",
      "monitoring": true
    },
    {
      "id": "analyst",
      "name": "AI-Analyst",
      "workspace": "workspace-analyst",
      "mode": "scheduled",
      "schedule": ["Daily 08:00 UTC"],
      "deliverables": ["daily_report"]
    },
    {
      "id": "marketing",
      "name": "AI-Marketing",
      "workspace": "workspace-marketing",
      "mode": "on_demand",
      "priority": "low"
    }
  ]
}
```

**优点**:
- ✅ 细粒度控制每个 agent
- ✅ 可配置唤醒策略
- ✅ 可配置交付物要求

**缺点**:
- ⚠️ 需要手动维护配置文件
- ⚠️ 新增 agent 需要更新配置

---

### 方案 C: 混合方案 (最佳实践) ⭐⭐⭐

**原理**: 结合方案 A 和方案 B 的优点

**实施**:

1. **agents 目录** - 用于 agent 发现
2. **subagents.json** - 用于细粒度配置
3. **workspace/{agent}/config.json** - 用于 agent 专属配置

**目录结构**:
```
~/.openclaw/
├── agents/
│   ├── secretary/
│   ├── cto/
│   └── ...
├── subagents.json          # 全局配置
└── workspace/
    ├── cto/
    │   └── config.json     # CTO 专属配置
    └── ...
```

**workspace/cto/config.json 示例**:
```json
{
  "agentId": "cto",
  "name": "AI-Chief Technology Officer",
  "workingHours": "09:00-18:00 UTC",
  "responseTime": "< 1 hour",
  "reportSchedule": "18:00 UTC daily",
  "tasks": {
    "maxConcurrent": 3,
    "defaultTimeout": 7200
  },
  "communication": {
    "preferredMethod": "sessions_send",
    "urgentMethod": "sessions_spawn"
  }
}
```

---

## 实施计划

### 阶段 1: 补全 agents 目录 (今天)

| Agent | 任务 | 状态 |
|-------|------|------|
| AI-CPO | 创建 agent 目录 + SOUL.md | ⏳ 待执行 |
| AI-Analyst | 创建 agent 目录 + SOUL.md | ⏳ 待执行 |
| AI-Marketing | 创建 agent 目录 + SOUL.md | ⏳ 待执行 |
| AI-Auditor | 创建 agent 目录 + SOUL.md | ⏳ 待执行 |

**执行命令**:
```bash
cd /home/node/.openclaw
for agent in cpo analyst marketing auditor; do
  mkdir -p agents/$agent
  # 创建 SOUL.md 等文件
done
```

---

### 阶段 2: 创建 subagents.json (明天)

**任务**:
- [ ] 创建 `~/.openclaw/subagents.json`
- [ ] 配置所有 agents 的唤醒策略
- [ ] 配置沟通方式和频率

**验证**:
```bash
agents_list
# 确认返回所有配置的 agents
```

---

### 阶段 3: 测试唤醒机制 (后天)

**测试用例**:

| 测试 | 命令 | 预期结果 | 状态 |
|------|------|---------|------|
| 唤醒 CTO | `sessions_spawn(agentId="cto")` | 成功创建 session | ⏳ 待测试 |
| 发送消息 | `sessions_send(sessionKey="agent:cto:main")` | 消息送达 | ⏳ 待测试 |
| inbox 文件 | 写入 `workspace-cto/inbox/` | AI-CTO 查看 | ⏳ 待测试 |
| 定期汇报 | 等待 18:00 UTC | 收到进度汇报 | ⏳ 待测试 |

---

### 阶段 4: 监控与优化 (持续)

**监控指标**:
- agent 响应时间
- 任务完成率
- 沟通频率统计
- 异常告警次数

**优化方向**:
- 调整唤醒策略
- 优化沟通频率
- 改进交付物质量

---

## 配置模板

### AI-CPO SOUL.md 模板

```markdown
# AI-CPO SOUL

**角色**: AI-Chief Product Officer (产品总监)

**职责**:
- 产品战略规划和路线图
- 产品决策支持
- 指导 AI-PM 执行
- 竞品分析

**汇报对象**: AI-Secretary (小兰)

**工作区**: /home/node/.openclaw/workspace-cpo

**沟通方式**:
- 与 CEO: 每周产品战略会议
- 与 AI-Secretary: 每日进度汇报
- 与 AI-PM: 每周产品对齐会议
- 与 AI-CTO: 每周技术路线会议

**当前任务**: 
- AI-One 产品战略规划
- Phase 1 产品决策支持
```

### AI-Analyst SOUL.md 模板

```markdown
# AI-Analyst SOUL

**角色**: AI-Data Analyst (数据分析师)

**职责**:
- 数据收集和整理
- 数据分析报告
- 业务洞察提供
- 数据仪表盘设计

**汇报对象**: AI-Secretary (小兰)

**工作区**: /home/node/.openclaw/workspace-analyst

**沟通方式**:
- 与 AI-Secretary: 每日数据报告
- 与 AI-COO: 运营数据分析
- 与 AI-PM: 用户行为分析
- 与 AI-Marketing: 市场数据分析

**当前任务**: 
- 建立数据收集机制
- 输出每日数据报告
```

---

## 监控与日志

### 唤醒日志格式

```
[时间戳] [级别] [请求方] [目标 agent] [操作] [结果]

示例:
[2026-03-06 03:56:00] [INFO] [secretary] [cto] [spawn] [success] session=agent:cto:subagent:xxx
[2026-03-06 03:56:01] [INFO] [cto] [secretary] [report] [success] task=热更新系统开发
[2026-03-06 05:56:01] [INFO] [cto] [secretary] [complete] [success] duration=2h
```

### 监控命令

```bash
# 查看活跃 agents
sessions_list --activeMinutes 60

# 查看特定 agent 状态
sessions_list --kind cto

# 查看唤醒历史
grep "spawn" ~/.openclaw/logs/agents.log

# 查看任务完成情况
grep "complete" ~/.openclaw/logs/agents.log
```

---

*设计人：小兰 📋 | AI-Secretary*  
*创建时间：2026-03-06 03:56 UTC*  
*版本：v2.0*  
*状态：📝 完整设计中*
