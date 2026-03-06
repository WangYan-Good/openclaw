# 🦞 AI-One — 一个人的 AI 公司

**基于 OpenClaw 的定制化 Agent 平台**

## Phase 1: 迁移与热更新系统

**工期**: 2026-03-05 ~ 2026-03-17  
**进度**: 35%

## P0 功能

- [x] Phase 1 启动 (03-05) ✅
- [x] 详细设计 (03-06) ✅
- [x] 代码库 Fork (03-06) ✅
- [x] 版本检测 (03-06) ✅
- [ ] 热更新核心 (03-13) ⏳
- [ ] 回滚机制 (03-15) ⏳
- [ ] 数据迁移 (03-15) ⏳
- [ ] 兼容性测试 (03-16) ⏳
- [ ] CI/CD 流水线 (03-17) ⏳

## 项目结构

```
ai-one/
├── src/
│   └── updater/
│       └── VersionDetector.ts   # 版本检测器 ✅
├── tests/
│   └── updater/
│       └── VersionDetector.test.ts  ✅
├── docs/
│   └── phase1-design.md         # 详细设计文档 ✅
└── README.md
```

## 仓库配置

```bash
# AI-One 仓库
origin  git@github.com:WangYan-Good/ai-one.git

# OpenClaw 上游
upstream  git@github.com:WangYan-Good/openclaw.git
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 启动应用
pnpm start
```

## 文档

- [Phase 1 设计文档](docs/phase1-design.md)

## 提交历史

```bash
git log --oneline
```

---

*代理 CTO: AI-Secretary (小兰) 📋*  
*更新时间：2026-03-06 02:30 UTC*
