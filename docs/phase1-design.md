# AI-One Phase 1 详细设计文档

**版本**: v0.1  
**创建时间**: 2026-03-06 02:17 UTC  
**作者**: AI-Secretary (小兰) - 代理 CTO  
**状态**: 📝 编写中

---

## 📋 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [版本检测系统](#版本检测系统)
4. [热更新系统](#热更新系统)
5. [回滚机制](#回滚机制)
6. [数据迁移](#数据迁移)
7. [兼容性测试](#兼容性测试)
8. [CI/CD 流水线](#ci-cd-流水线)
9. [实施计划](#实施计划)

---

## 概述

### Phase 1 目标

从 OpenClaw 迁移到 AI-One，实现热更新能力

**工期**: 2026-03-05 ~ 2026-03-17 (2 周)

### P0 功能范围

| # | 功能 | 工期 | 优先级 |
|---|------|------|--------|
| 1 | Fork OpenClaw 代码库 | 0.5 天 | P0 |
| 2 | 版本检测系统 | 2 天 | P0 |
| 3 | 热更新系统核心 | 5 天 | P0 |
| 4 | 回滚机制 | 2 天 | P0 |
| 5 | 数据迁移工具 | 2 天 | P0 |
| 6 | 兼容性测试 | 2 天 | P0 |
| 7 | CI/CD 流水线 | 2 天 | P0 |

### 技术栈

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| **运行时** | Node.js 22+ | 与 OpenClaw 兼容 |
| **包管理** | pnpm | 快速、节省空间 |
| **版本控制** | Git + GitHub | 独立仓库 |
| **CI/CD** | GitHub Actions | 自动化测试 + 发布 |

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      AI-One 架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              热更新系统 (新增)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Version  │  │ Update   │  │ Hot      │          │   │
│  │  │ Detector │─▶│ Manager  │─▶│ Loader   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                            │                        │   │
│  │                     ┌──────┴──────┐                 │   │
│  │                     │ Rollback    │                 │   │
│  │                     │ Manager     │                 │   │
│  │                     └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Gateway    │  │   Skills    │  │   Memory    │  ← 保留 │
│  │  (兼容)     │  │  (兼容)     │  │  (兼容)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
ai-one/
├── src/
│   ├── gateway/              # 网关服务 (保留)
│   ├── skills/               # 技能系统 (保留)
│   ├── memory/               # 记忆系统 (保留)
│   └── updater/              # 热更新系统 (新增)
│       ├── VersionDetector.ts   # 版本检测
│       ├── UpdateManager.ts     # 更新管理
│       ├── HotLoader.ts         # 热加载
│       └── RollbackManager.ts   # 回滚管理
├── tests/                    # 测试用例
├── docs/                     # 文档
├── package.json              # 依赖配置
└── README.md                 # 项目说明
```

---

## 版本检测系统

### 设计目标

- 检测 GitHub Release 新版本
- 轮询间隔 < 5 分钟
- 支持版本比较
- 通知机制

### 架构

```
┌─────────────────┐
│ VersionDetector │
├─────────────────┤
│ - pollInterval  │
│ - currentVersion│
│ - repo          │
├─────────────────┤
│ + check()       │
│ + compare()     │
│ + notify()      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ GitHub API      │
│ /repos/:owner/  │
│ /releases/latest│
└─────────────────┘
```

### 实现方案

```typescript
// src/updater/VersionDetector.ts
export class VersionDetector {
  private pollInterval: number = 300000; // 5 分钟
  private currentVersion: string;
  private repo: string = 'ai-one/ai-one';
  
  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }
  
  async check(): Promise<ReleaseInfo | null> {
    const response = await fetch(
      `https://api.github.com/repos/${this.repo}/releases/latest`
    );
    const release = await response.json();
    const latestVersion = release.tag_name;
    
    if (this.compare(latestVersion, this.currentVersion) > 0) {
      return {
        version: latestVersion,
        url: release.assets[0].browser_download_url,
        notes: release.body
      };
    }
    
    return null;
  }
  
  compare(v1: string, v2: string): number {
    // 语义化版本比较
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
}
```

### 测试用例

```typescript
// tests/updater/VersionDetector.test.ts
describe('VersionDetector', () => {
  it('should detect newer version', async () => {
    const detector = new VersionDetector('1.0.0');
    // Mock GitHub API response
    const release = await detector.check();
    expect(release).toBeDefined();
  });
  
  it('should compare versions correctly', () => {
    const detector = new VersionDetector('1.0.0');
    expect(detector.compare('1.0.1', '1.0.0')).toBe(1);
    expect(detector.compare('1.0.0', '1.0.0')).toBe(0);
    expect(detector.compare('0.9.9', '1.0.0')).toBe(-1);
  });
});
```

---

## 热更新系统

### 设计目标

- 更新检测 < 5 分钟
- 应用更新 < 2 分钟
- 服务中断 < 30 秒
- 支持回滚

### 架构

```
┌─────────────────────────────────────────┐
│          UpdateManager                  │
├─────────────────────────────────────────┤
│ 1. 创建快照                              │
│ 2. 下载更新包                            │
│ 3. 验证 SHA256                           │
│ 4. 解压更新包                            │
│ 5. 热加载新代码                          │
│ 6. 优雅重启                              │
└─────────────────────────────────────────┘
```

### 实现方案

```typescript
// src/updater/UpdateManager.ts
export class UpdateManager {
  async applyUpdate(release: ReleaseInfo) {
    // 1. 创建当前版本快照
    await this.rollback.createSnapshot();
    
    // 2. 下载更新包
    const packagePath = await this.downloader.download(release.url);
    
    // 3. 验证 SHA256
    const valid = await this.downloader.verify(packagePath, release.sha256);
    if (!valid) {
      throw new Error('SHA256 验证失败');
    }
    
    // 4. 解压更新包
    await this.downloader.extract(packagePath);
    
    // 5. 热加载新代码
    await this.loader.load();
    
    // 6. 优雅重启
    await this.gracefulRestart();
  }
  
  private async gracefulRestart() {
    // 等待当前请求完成 (最长 30 秒)
    await this.waitForActiveRequests(30000);
    
    // 发送重启信号
    process.send({ type: 'RESTART' });
    
    // 等待新进程启动
    await this.waitForNewProcess(10000);
    
    // 关闭旧进程
    process.exit(0);
  }
}
```

---

## 回滚机制

### 设计目标

- 快照创建 < 10 秒
- 快照恢复 < 60 秒
- 最多保留 3 个快照
- 自动回滚

### 实现方案

```typescript
// src/updater/RollbackManager.ts
export class RollbackManager {
  private snapshotDir = '~/.openclaw/ai-one/snapshots';
  private maxSnapshots = 3;
  
  async createSnapshot() {
    const timestamp = Date.now();
    const snapshotPath = path.join(this.snapshotDir, `snapshot-${timestamp}`);
    
    // 复制当前代码
    await fs.copy(
      path.join(__dirname, '../../'),
      path.join(snapshotPath, 'code')
    );
    
    // 保存版本信息
    await fs.writeJson(
      path.join(snapshotPath, 'metadata.json'),
      {
        timestamp,
        version: process.env.AI_ONE_VERSION,
        nodeVersion: process.version
      }
    );
    
    // 清理旧快照
    await this.cleanupOldSnapshots();
  }
  
  async rollback() {
    const latestSnapshot = await this.getLatestSnapshot();
    if (!latestSnapshot) {
      throw new Error('没有可用的快照');
    }
    
    // 恢复代码
    await fs.copy(
      path.join(latestSnapshot, 'code'),
      path.join(__dirname, '../../')
    );
    
    // 重启服务
    process.send({ type: 'RESTART' });
  }
}
```

---

## 数据迁移

### 迁移范围

| 数据类型 | 来源 | 目标 | 方式 |
|---------|------|------|------|
| **配置文件** | ~/.openclaw/config.json | ~/.openclaw/ai-one/config.json | 复制 + 适配 |
| **Memory 数据** | ~/.openclaw/memory/ | ~/.openclaw/ai-one/memory/ | 迁移 |
| **Skills** | ~/.openclaw/skills/ | ~/.openclaw/ai-one/skills/ | 链接 |
| **会话数据** | ~/.openclaw/sessions/ | ~/.openclaw/ai-one/sessions/ | 迁移 |

### 迁移脚本

```typescript
// scripts/migrate.ts
async function migrate() {
  console.log('开始数据迁移...');
  
  // 1. 复制配置文件
  await fs.copy(
    '~/.openclaw/config.json',
    '~/.openclaw/ai-one/config.json'
  );
  
  // 2. 迁移 Memory 数据
  await fs.copy(
    '~/.openclaw/memory/',
    '~/.openclaw/ai-one/memory/'
  );
  
  // 3. 创建 Skills 符号链接
  await fs.symlink(
    '~/.openclaw/skills/',
    '~/.openclaw/ai-one/skills/'
  );
  
  console.log('数据迁移完成!');
}
```

---

## 兼容性测试

### 测试范围

| 测试类型 | 测试内容 | 预期结果 |
|---------|---------|---------|
| **Skills 测试** | weather, pdf, xlsx, pptx, docx | 全部通过 |
| **Channels 测试** | webchat, telegram, whatsapp | 全部通过 |
| **Memory 测试** | 读写、查询、删除 | 全部通过 |
| **Tools 测试** | browser, exec, nodes | 全部通过 |

### 测试脚本

```typescript
// tests/compatibility.test.ts
describe('Compatibility Tests', () => {
  it('should load all skills', async () => {
    const skills = ['weather', 'pdf', 'xlsx', 'pptx', 'docx'];
    for (const skill of skills) {
      const loaded = await loadSkill(skill);
      expect(loaded).toBeDefined();
    }
  });
  
  it('should connect all channels', async () => {
    const channels = ['webchat', 'telegram', 'whatsapp'];
    for (const channel of channels) {
      const connected = await connectChannel(channel);
      expect(connected).toBe(true);
    }
  });
});
```

---

## CI/CD 流水线

### GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint

  release:
    needs: test
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/*
```

---

## 实施计划

### 时间表

| 日期 | 任务 | 交付物 |
|------|------|--------|
| **03-06** | 详细设计 + Fork 代码库 | 设计文档 + AI-One 仓库 |
| **03-07-08** | 版本检测系统 | VersionDetector 模块 |
| **03-09-13** | 热更新系统核心 | UpdateManager 模块 |
| **03-14-15** | 回滚 + 迁移 | RollbackManager + MigrationTool |
| **03-16** | 兼容性测试 | 测试报告 |
| **03-17** | Phase 1 验收 | CEO 验收会议 |

### 里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 代码库 Fork | 03-06 | AI-One 仓库创建 |
| M2: 版本检测 | 03-08 | VersionDetector 模块 |
| M3: 热更新核心 | 03-13 | UpdateManager 模块 |
| M4: 回滚 + 迁移 | 03-15 | RollbackManager + MigrationTool |
| M5: 测试完成 | 03-16 | 测试报告 |
| M6: Phase 1 验收 | 03-17 | CEO 验收会议 |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **工期紧张** | 中 | 高 | 聚焦 P0 功能，P1 延后 |
| **技术难度** | 低 | 中 | 参考成熟方案，小步快跑 |
| **兼容性问题** | 中 | 高 | 早期测试，充分验证 |

---

*创建人：小兰 📋 | AI-Secretary (代理 CTO)*  
*创建时间：2026-03-06 02:17 UTC*  
*状态：📝 编写中*
