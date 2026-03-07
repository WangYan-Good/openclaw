# Hot Reload (热更新) 功能 - TypeScript 数据结构

/**
 * OpenClaw Hot Reload 功能数据结构定义
 * 
 * 本文件定义了热更新功能的核心数据结构，包括：
 * - 版本信息结构
 * - 差异对象结构
 * - 更新请求/响应
 * - 更新配置
 */

// ========================================
// 类型定义
// ========================================

export enum UpdateType {
  INCREMENTAL = 'incremental',  // 增量更新 (小版本)
  FULL = 'full',                 // 全量更新 (大版本)
}

export enum UpdateStatus {
  PENDING = 'pending',       // 待更新
  DOWNLOADING = 'downloading', // 下载中
  VALIDATING = 'validating',   // 验证中
  APPLYING = 'applying',       // 应用中
  COMPLETED = 'completed',     // 已完成
  FAILED = 'failed',           // 失败
  ROLLED_BACK = 'rolled_back', // 已回滚
}

export enum TriggerType {
  AUTO = 'auto',          // 自动检测
  MANUAL = 'manual',      // 用户手动
  SCHEDULED = 'scheduled', // 定时更新
  IDLE = 'idle',          // 闲时更新
}

export enum VersionScheme {
  SEMVER = 'semver', // 语义化版本 MAJOR.MINOR.PATCH
  DATE = 'date',     // 日期版本 YYYYMMDD
  BUILD = 'build',   // 构建号版本
}

// ========================================
// 接口定义
// ========================================

/**
 * 版本信息
 */
export interface VersionInfo {
  version: string;           // 版本号
  buildNumber: number;       // 构建号
  releaseDate: string;       // 发布日期
  commitHash?: string;       // Git 提交哈希
  changelog?: string;        // 变更日志
  type: UpdateType;          // 更新类型
  status: UpdateStatus;      // 状态
}

/**
 * 差异文件条目
 */
export interface DiffEntry {
  path: string;              // 文件路径
  type: DiffType;            // 变更类型
  oldHash?: string;          // 原文件哈希
  newHash?: string;          // 新文件哈希
  oldSize?: number;          // 原文件大小
  newSize?: number;          // 新文件大小
}

export enum DiffType {
  ADDED = 'added',     // 新增
  MODIFIED = 'modified', // 修改
  DELETED = 'deleted', // 删除
  MOVED = 'moved',     // 移动
}

/**
 * 差异集合
 */
export interface DiffResult {
  totalFiles: number;        // 总文件数
  added: DiffEntry[];        // 新增文件
  modified: DiffEntry[];     // 修改文件
  deleted: DiffEntry[];      // 删除文件
  moved: DiffEntry[];        // 移动文件
  totalSizeDiff: number;     // 总大小差异 (字节)
  isIncremental: boolean;    // 是否增量更新
}

/**
 * 更新请求
 */
export interface UpdateRequest {
  currentVersion: string;    // 当前版本
  targetVersion?: string;    // 目标版本 (可选, 不指定则获取最新)
  triggerType: TriggerType;  // 触发类型
  userConfirm: boolean;      // 用户是否确认
  downloadType?: UpdateType; // 下载类型 (增量/全量)
  scheduledTime?: string;    // 定时更新时间
}

/**
 * 更新响应
 */
export interface UpdateResponse {
  success: boolean;
  updateId?: string;         // 更新任务 ID
  versionInfo?: VersionInfo;
  diff?: DiffResult;
  downloadSize?: number;     // 下载大小
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 更新配置
 */
export interface HotReloadConfig {
  enabled: boolean;                        // 是否启用
  autoCheckInterval: number;              // 自动检查间隔 (毫秒)
  updateTriggers: TriggerType[];          // 允许的触发类型
  autoTriggerConditions: {
    time?: string;                        // 定时更新时间 (HH:mm)
    idleMinutes?: number;                 // 闲时更新 (分钟)
  };
  versionSource: VersionSource[];         // 版本源
  versionScheme: VersionScheme;           // 版本方案
  diffThresholdPercent: number;           // 增量更新阈值 (%)
  autoRollbackEnabled: boolean;           // 自动回滚
  maxRollbackAttempts: number;            // 最大回滚尝试次数
  healthCheck: {
    endpoint: string;                     // 健康检查端点
    timeoutMs: number;                    // 超时时间
    maxFailedChecks: number;              // 失败次数阈值
  };
}

export interface VersionSource {
  type: 'github' | 'internal' | 'custom';
  url: string;
  auth?: {
    type: 'token' | 'basic';
    value: string;
  };
}

/**
 * 版本快照
 */
export interface VersionSnapshot {
  snapshotId: string;
  version: string;
  timestamp: string;
  files: string[];          // 文件列表
  checksums: Record<string, string>; // 文件校验和
  size: number;             // 总大小
  diffFromPrevious?: string; // 与前一版本的差异
}

/**
 * 更新日志
 */
export interface UpdateLog {
  logId: string;
  updateId: string;
  version: string;
  timestamp: string;
  triggerType: TriggerType;
  status: UpdateStatus;
  durationMs?: number;
  diffStats?: DiffResult;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * 校验和
 */
export interface Checksum {
  algorithm: 'sha256' | 'md5';
  value: string;
  size: number;
}

// ========================================
// 工具函数类型
// ========================================

export type HashFunction = (data: Buffer | string) => string;

export type FileWalkerCallback = (
  filePath: string,
  stat: {
    size: number;
    isDirectory: boolean;
    isFile: boolean;
  }
) => void | boolean;

// ========================================
// 差异算法配置
// ========================================

export interface DiffAlgorithmConfig {
  chunkSize: number;           // 分块大小 (字节)
  maxDepth: number;            // 最大递归深度
  ignorePatterns: string[];    // 忽略模式
  followSymlinks: boolean;     // 是否跟随符号链接
  parallelThreshold: number;   // 并行处理阈值
}

// 默认配置
export const DEFAULT_DIFF_CONFIG: DiffAlgorithmConfig = {
  chunkSize: 4096,
  maxDepth: 100,
  ignorePatterns: [
    '.git/**',
    'node_modules/**',
    'dist/**',
    '*.log',
    'Thumbs.db',
    '.DS_Store',
  ],
  followSymlinks: false,
  parallelThreshold: 100,
};

// ========================================
// 辅助函数
// ========================================

/**
 * 检查是否为有效的语义化版本
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  return semverRegex.test(version);
}

/**
 * 比较两个版本
 * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 == v2
 */
export function compareSemver(v1: string, v2: string): number {
  if (!isValidSemver(v1) || !isValidSemver(v2)) {
    throw new Error('Invalid semver format');
  }

  const [major1, minor1, patch1] = v1.split('.').map(Number);
  const [major2, minor2, patch2] = v2.split('.').map(Number);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return patch1 - patch2;
}

/**
 * 计算更新类型
 */
export function calculateUpdateType(
  currentVersion: string,
  targetVersion: string,
  diffResult: DiffResult
): UpdateType {
  const current = currentVersion.split('.').map(Number);
  const target = targetVersion.split('.').map(Number);

  // MAJOR 变更 → 全量更新
  if (target[0] > current[0]) {
    return UpdateType.FULL;
  }

  // MINOR 或 PATCH 变更 + 大量文件变更 → 全量更新
  if (
    (target[1] > current[1] || target[2] > current[2]) &&
    diffResult.modified.length + diffResult.added.length > 100
  ) {
    return UpdateType.FULL;
  }

  // 默认增量更新
  return UpdateType.INCREMENTAL;
}

/**
 * 生成更新 ID
 */
export function generateUpdateId(): string {
  return `update_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
