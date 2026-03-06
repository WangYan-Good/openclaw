# AI-One Agent 唤醒配置完整手册

**版本**: v2.1  
**创建时间**: 2026-03-06 04:13 UTC  
**设计人**: AI-Secretary (小兰) 📋

---

## 📋 目录

1. [组织架构图](#组织架构图)
2. [唤醒规则总览](#唤醒规则总览)
3. [完整唤醒矩阵](#完整唤醒矩阵)
4. [各部门唤醒配置](#各部门唤醒配置)
5. [紧急情况处理](#紧急情况处理)
6. [配置文件位置](#配置文件位置)

---

## 🏢 组织架构图

```
                         CEO (主人) 👑
                              │
                              ▼
                    AI-Secretary (小兰) 📋 [Level 0]
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │ AI-CTO    │       │ AI-COO    │       │AI-Auditor │ [Level 1]
   │软件服务部  │       │市场金融部  │       │ 审计中心  │
   └─────┬─────┘       └─────┬─────┘       └───────────┘
         │                   │
    ┌────┴────────────────┐  │
    │   技术中心 (Level 2) │  │
    ├─────────────────────┤  │
    │ AI-PM               │  │
    │ AI-Backend          │  │
    │ AI-Frontend         │  │
    │ AI-QA-1             │  │
    │ AI-Reviewer         │  │
    │ AI-DevOps           │  │
    └─────────────────────┘  │
                             │
                        ┌────┴────────────────┐
                        │   金融部 (Level 2)   │
                        ├─────────────────────┤
                        │ AI-Finance          │
                        │ AI-Investment       │
                        │ AI-Marketing        │
                        │ AI-Analyst          │
                        └─────────────────────┘
```

---

## 🔐 唤醒规则总览

### 规则 1: 平级沟通
- **允许**: 直接 `sessions_send` 沟通
- **示例**: AI-Backend ↔ AI-Frontend

### 规则 2: 上下级沟通
- **上级→下级**: 可 `sessions_spawn` 唤醒
- **下级→上级**: 仅限紧急情况

### 规则 3: 跨级沟通 (上→下)
- **允许**: 上级可唤醒任意下级
- **示例**: AI-Secretary → AI-QA-1

### 规则 4: 跨级沟通 (下→上)
- **限制**: 仅限紧急情况
- **路径**: 必须通过直接上级中转

### 规则 5: 跨部门沟通
- **要求**: 必须通过部门 Peer 连接点
- **连接点**: AI-CTO ↔ AI-COO ↔ AI-Auditor ↔ AI-CPO

---

## 📊 完整唤醒矩阵

### 唤醒权限图

| 唤醒方 \ 被唤醒方 | Secy | CTO | COO | Auditor | CPO | PM | Backend | Frontend | QA | Reviewer | DevOps | Finance | Invest | Mktg | Analyst |
|------------------|------|-----|-----|---------|-----|----|---------|----------|----|----------|--------|---------|--------|------|---------|
| **AI-Secretary** |  -   |  ✅  |  ✅  |   ✅    |  ✅  | ✅  |   ✅    |    ✅    | ✅  |    ✅    |   ✅   |   ✅    |   ✅   |  ✅  |   ✅    |
| **AI-CTO**       |  ❌  |  -  |  🟡  |   🟡    |  🟡  | ✅  |   ✅    |    ✅    | ✅  |    ✅    |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-COO**       |  ❌  |  🟡  |  -  |   🟡    |  🟡  | ❌  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   ✅    |   ✅   |  ✅  |   ✅    |
| **AI-Auditor**   |  ❌  |  🟡  |  🟡  |   -     |  🟡  | ✅* |   ✅*   |    ✅*   | ✅* |    ✅*   |   ✅*  |   ✅*   |   ✅*  |  ✅* |   ✅*   |
| **AI-CPO**       |  ❌  |  🟡  |  🟡  |   🟡    |  -   | ✅  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-PM**        |  ❌* |  ❌* |  ❌  |   ❌    |  ❌* | -  |   ✅    |    ✅    | ✅  |    ✅    |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-Backend**   |  ❌* |  ❌* |  ❌  |   ❌    |  ❌  | ✅  |   -     |    ✅    | ✅  |    ✅    |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-Frontend**  |  ❌* |  ❌* |  ❌  |   ❌    |  ❌  | ✅  |   ✅    |    -     | ✅  |    ✅    |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-QA-1**      |  ❌* |  ❌* |  ❌  |   ❌    |  ❌  | ✅  |   ✅    |    ✅    | -  |    ✅    |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-Reviewer**  |  ❌* |  ❌* |  ❌  |   ❌    |  ❌  | ✅  |   ✅    |    ✅    | ✅  |    -     |   ✅   |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-DevOps**    |  ❌* |  ❌* |  ❌  |   ❌    |  ❌  | ✅  |   ✅    |    ✅    | ✅  |    ✅    |   -    |   ❌    |   ❌   |  ❌  |   ❌    |
| **AI-Finance**   |  ❌* |  ❌  |  ❌* |   ❌    |  ❌  | ❌  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   -     |   ✅   |  ✅  |   ✅    |
| **AI-Investment**|  ❌* |  ❌  |  ❌* |   ❌    |  ❌  | ❌  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   ✅    |   -    |  ✅  |   ✅    |
| **AI-Marketing** |  ❌* |  ❌  |  ❌* |   ❌    |  ❌  | ❌  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   ✅    |   ✅   |  -   |   ✅    |
| **AI-Analyst**   |  ❌* |  ❌  |  ❌* |   ❌    |  ❌  | ❌  |   ❌    |    ❌    | ❌  |    ❌    |   ❌   |   ✅    |   ✅   |  ✅  |   -     |

**图例**:
- ✅ = 可直接唤醒 (sessions_spawn)
- ✅* = 审计权限 (Auditor 可审查唤醒)
- 🟡 = Peer 沟通 (sessions_send)
- ❌ = 不可直接唤醒 (需通过 Peer 中转)
- ❌* = 紧急情况可唤醒直接上级

---

## 📁 各部门唤醒配置

### 秘书处 (Level 0)

| Agent | 可唤醒 | 可被唤醒 | 沟通方式 |
|-------|--------|---------|---------|
| **AI-Secretary** | 所有 agents | CEO (主人) | sessions_spawn/sessions_send |

---

### 软件服务部 (Level 1-2)

#### AI-CTO (部长)
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| PM, Backend, Frontend, QA-1, Reviewer, DevOps | Secretary | COO, Auditor, CPO |

#### AI-PM
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO, CPO | Backend, Frontend, QA-1, Reviewer, DevOps |

#### AI-Backend
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO | PM, Frontend, QA-1, Reviewer, DevOps |

#### AI-Frontend
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO | PM, Backend, QA-1, Reviewer, DevOps |

#### AI-QA-1
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO | PM, Backend, Frontend, Reviewer, DevOps |

#### AI-Reviewer
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO | PM, Backend, Frontend, QA-1, DevOps |

#### AI-DevOps
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, CTO | PM, Backend, Frontend, QA-1, Reviewer |

---

### 市场金融部 (Level 1-2)

#### AI-COO (部长)
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| Finance, Investment, Marketing, Analyst | Secretary | CTO, Auditor, CPO |

#### AI-Finance
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, COO | Investment, Marketing, Analyst |

#### AI-Investment
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, COO | Finance, Marketing, Analyst |

#### AI-Marketing
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, COO | Finance, Investment, Analyst |

#### AI-Analyst
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| (无) | Secretary, COO | Finance, Investment, Marketing |

---

### 审计中心 (Level 1)

#### AI-Auditor
| 可唤醒 | 可被唤醒 | 平级沟通 | 审计目标 |
|--------|---------|---------|---------|
| 所有 Level 2 agents | Secretary | CTO, COO, CPO | 所有执行层 agents |

---

### 产品战略 (Level 1)

#### AI-CPO
| 可唤醒 | 可被唤醒 | 平级沟通 |
|--------|---------|---------|
| PM | Secretary | CTO, COO, Auditor |

---

## 🚨 紧急情况处理

### 定义
紧急情况包括:
- 严重 bug 影响生产
- 安全漏洞
- 系统宕机
- 数据丢失风险

### 紧急唤醒流程

```
Level 2 → Level 1 (紧急)
示例：AI-QA-1 → AI-CTO

1. 使用 sessions_send 发送【紧急】前缀消息
2. 如 30 分钟无响应，可使用 sessions_spawn 唤醒
3. 同时通知 AI-Secretary
```

### 紧急跨级唤醒

```
Level 2 → Level 0 (极紧急)
示例：AI-QA-1 → AI-Secretary

1. 必须先尝试联系直接上级 (AI-CTO)
2. 如直接上级无响应，可联系 AI-Secretary
3. 消息必须包含【极紧急】前缀和原因
```

---

## 📁 配置文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| **subagents.json** | `~/.openclaw/subagents.json` | 全局唤醒配置 |
| **Agent SOUL.md** | `~/.openclaw/agents/{id}/SOUL.md` | 各 agent 角色定义 |
| **Agent Workspace** | `~/.openclaw/workspace-{id}/SOUL.md` | 各 agent 工作区 |
| **唤醒配置文档** | `workspace-secretary/docs/agent-wakeup-config.md` | 本文档 |

---

## 🔧 使用示例

### 示例 1: AI-Secretary 唤醒 AI-CTO

```javascript
sessions_spawn({
  agentId: "cto",
  task: "开发 AI-One Phase 1 热更新系统",
  mode: "session",
  thread: true,
  timeoutSeconds: 7200
});
```

### 示例 2: AI-CTO 唤醒 AI-Backend

```javascript
sessions_spawn({
  agentId: "backend",
  task: "实现用户认证模块",
  mode: "session",
  thread: true,
  timeoutSeconds: 3600
});
```

### 示例 3: AI-Backend 联系 AI-Frontend (平级)

```javascript
sessions_send({
  sessionKey: "agent:frontend:main",
  message: "API 接口已更新，请同步更新前端调用"
});
```

### 示例 4: AI-Finance 联系 AI-Backend (跨部门)

```javascript
// 错误：不能直接联系
// sessions_send({ sessionKey: "agent:backend:main" })

// 正确：通过 Peer 中转
sessions_send({
  sessionKey: "agent:coo:main",
  message: "需要技术部协助导出财务数据"
});
// AI-COO → AI-CTO → AI-Backend
```

### 示例 5: AI-QA-1 紧急联系 AI-CTO

```javascript
// 紧急情况
sessions_send({
  sessionKey: "agent:cto:main",
  message: "【紧急】发现严重安全漏洞，需要立即处理"
});
```

---

## 📊 配置验证

### 验证命令

```bash
# 查看已配置的 agents
agents_list

# 查看活跃 sessions
sessions_list --activeMinutes 60

# 查看特定 agent 状态
sessions_list --kind cto
```

### 预期结果

```json
{
  "requester": "secretary",
  "allowAny": false,
  "agents": [
    {"id": "secretary", "configured": true},
    {"id": "cto", "configured": true},
    {"id": "coo", "configured": true},
    {"id": "cpo", "configured": true},
    {"id": "pm", "configured": true},
    {"id": "backend", "configured": true},
    {"id": "frontend", "configured": true},
    {"id": "qa-1", "configured": true},
    {"id": "reviewer", "configured": true},
    {"id": "devops", "configured": true},
    {"id": "auditor", "configured": true},
    {"id": "finance", "configured": true},
    {"id": "investment", "configured": true},
    {"id": "marketing", "configured": true},
    {"id": "analyst", "configured": true}
  ]
}
```

---

*创建人：小兰 📋 | AI-Secretary*  
*创建时间：2026-03-06 04:13 UTC*  
*版本：v2.1*
