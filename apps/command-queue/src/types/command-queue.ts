# Command Queue (命令队列) 功能 - TypeScript 数据结构

/**
 * OpenClaw Command Queue 功能数据结构定义
 * 
 * 本文件定义了命令队列的核心数据结构，包括：
 * - 任务结构
 * - 队列配置
 * - 优先级定义
 * - 进度跟踪
 */

// ========================================
// 类型定义
// ========================================

export enum Priority {
  HIGH = 'high',     // 🔴 高优先级
  MEDIUM = 'medium', // 🟡 中优先级
  LOW = 'low',       // 🟢 低优先级
}

export enum TaskStatus {
  PENDING = 'pending',       // 待执行
  QUEUED = 'queued',         // 已排队
  EXECUTING = 'executing',   // 执行中
  SUCCESS = 'success',       // 成功
  FAILED = 'failed',         // 失败
  SKIPPED = 'skipped',       // 跳过
  CANCELLED = 'cancelled',   // 已取消
}

export enum ExecutionMode {
  SEQUENTIAL = 'sequential',  // 顺序执行
  CONCURRENT = 'concurrent',  // 并行执行
}

// ========================================
// 接口定义
// ========================================

/**
 * 任务基础属性
 */
export interface BaseTask {
  taskId: string;                 // 任务唯一标识
  taskType: string;               // 任务类型 (skill_call, tool_call, etc.)
  payload: Record<string, any>;   // 任务内容
  priority: Priority;             // 优先级
  status: TaskStatus;            // 当前状态
  createdAt: string;              // 创建时间
  queuedAt?: string;              // 排队时间
  startedAt?: string;             // 开始执行时间
  completedAt?: string;           // 完成时间
}

/**
 * 命令队列任务
 */
export interface CommandTask extends BaseTask {
  executionMode: ExecutionMode;   // 执行模式
  dependsOn?: string[];          // 依赖的任务 ID
  maxRetries: number;            // 最大重试次数
  timeoutMs?: number;            // 超时时间 (毫秒)
  progress: TaskProgress;        // 进度信息
  metadata: {
    callerId: string;             // 调用者 ID
    sessionId?: string;           // 会话 ID
    priorityOverride?: boolean;   // 是否覆盖默认优先级
  };
}

/**
 * 任务进度
 */
export interface TaskProgress {
  currentStep: number;            // 当前步骤
  totalSteps: number;             // 总步骤数
  percentage: number;             // 完成百分比 (0-100)
  estimatedRemainingMs?: number;  // 估计剩余时间 (毫秒)
  details?: string;               // 详细步骤描述
}

/**
 * 队列配置
 */
export interface QueueConfig {
  maxConcurrent: number;         // 最大并发数
  defaultPriority: Priority;     // 默认优先级
  executionMode: ExecutionMode;  // 执行模式
  progressDisplay: {
    enabled: boolean;             // 是否显示进度
    showSteps: boolean;           // 显示步骤
    showPercentage: boolean;      // 显示百分比
    showRemainingTime: boolean;   // 显示剩余时间
  };
}

/**
 * 批量操作配置
 */
export interface BatchConfig {
  enabled: boolean;              // 是否启用批量
  maxSize: number;               // 最大批量大小
  timeoutMs: number;             // 批量等待超时
  concurrentBatches: number;     // 并行批量数
}

/**
 * 调度器状态
 */
export interface SchedulerState {
  queuedTasks: string[];         // 排队中的任务 ID
  executingTasks: string[];      // 执行中的任务 ID
  completedTasks: string[];      // 已完成的任务 ID
  failedTasks: string[];         // 失败的任务 ID
  totalQueued: number;           // 排队总数
  totalExecuting: number;        // 执行总数
  totalCompleted: number;        // 完成总数
  totalFailed: number;           // 失败总数
}

/**
 * 优先级队列节点
 */
export interface PriorityNode {
  taskId: string;
  priority: Priority;
  createdAt: number;
  priorityValue: number;         // 内部优先级值 (用于排序)
}

/**
 * 任务调度请求
 */
export interface ScheduleRequest {
  task: CommandTask;
  queueName: string;             // 队列名称 (high/medium/low)
}

/**
 * 批量执行请求
 */
export interface BatchExecutionRequest {
  taskIds: string[];
  maxConcurrent: number;
  priority?: Priority;
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: Priority;
  agentId?: string;
  sessionId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 任务结果
 */
export interface TaskResult {
  success: boolean;
  taskId: string;
  result?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  executionTimeMs?: number;
  steps?: {
    step: number;
    description: string;
    completedAt: string;
  }[];
}

/**
 * 队列统计
 */
export interface QueueStats {
  queueName: string;
  size: number;                    // 队列长度
  executing: number;               // 执行中数量
  waitingTimeAvgMs?: number;       // 平均等待时间
  executionTimeAvgMs?: number;     // 平均执行时间
  successRate?: number;            // 成功率
}

// ========================================
// 常量定义
// ========================================

export const PRIORITY_VALUES: Record<Priority, number> = {
  [Priority.HIGH]: 3,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 1,
};

export const DEFAULT_TASK_TIMEOUT = 60000; // 60 秒
export const DEFAULT_MAX_CONCURRENT = 2;
export const DEFAULT_PRIORITY = Priority.MEDIUM;

// 队列名称
export const QUEUE_NAMES = {
  HIGH: 'high_priority',
  MEDIUM: 'medium_priority',
  LOW: 'low_priority',
  PAYMENT: 'payment', // 付费队列
};

// 进度显示默认值
export const DEFAULT_PROGRESS_DISPLAY = {
  enabled: true,
  showSteps: true,
  showPercentage: true,
  showRemainingTime: true,
};

// 默认队列配置
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: DEFAULT_MAX_CONCURRENT,
  defaultPriority: DEFAULT_PRIORITY,
  executionMode: ExecutionMode.SEQUENTIAL,
  progressDisplay: DEFAULT_PROGRESS_DISPLAY,
};

// 默认批量配置
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  enabled: false,
  maxSize: 10,
  timeoutMs: 100,
  concurrentBatches: 2,
};

// ========================================
// 工具函数类型
// ========================================

export type TaskFilter = (task: CommandTask) => boolean;

export type PriorityComparator = (a: PriorityNode, b: PriorityNode) => number;

// ========================================
// 辅助函数
// ========================================

/**
 * 获取优先级值
 */
export function getPriorityValue(priority: Priority): number {
  return PRIORITY_VALUES[priority];
}

/**
 * 计算优先级排序
 */
export function priorityComparator(a: PriorityNode, b: PriorityNode): number {
  // 优先级值降序
  if (a.priorityValue !== b.priorityValue) {
    return b.priorityValue - a.priorityValue;
  }
  // 时间戳升序 (先到先服务)
  return a.createdAt - b.createdAt;
}

/**
 * 生成任务 ID
 */
export function generateTaskId(prefix: string = 'task'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 计算平均等待时间
 */
export function calculateAverageWaitingTime(tasks: CommandTask[]): number {
  const waitingTimes = tasks
    .filter(t => t.queuedAt && t.startedAt)
    .map(t => {
      const queued = new Date(t.queuedAt!).getTime();
      const started = new Date(t.startedAt!).getTime();
      return started - queued;
    });

  if (waitingTimes.length === 0) return 0;
  return waitingTimes.reduce((sum, t) => sum + t, 0) / waitingTimes.length;
}

/**
 * 计算平均执行时间
 */
export function calculateAverageExecutionTime(tasks: CommandTask[]): number {
  const executionTimes = tasks
    .filter(t => t.startedAt && t.completedAt)
    .map(t => {
      const started = new Date(t.startedAt!).getTime();
      const completed = new Date(t.completedAt!).getTime();
      return completed - started;
    });

  if (executionTimes.length === 0) return 0;
  return executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length;
}

/**
 * 计算成功率
 */
export function calculateSuccessRate(tasks: CommandTask[]): number {
  const completed = tasks.filter(t => t.status === TaskStatus.SUCCESS).length;
  const total = tasks.filter(t => t.status !== TaskStatus.PENDING && t.status !== TaskStatus.QUEUED).length;
  
  if (total === 0) return 0;
  return completed / total;
}

/**
 * 格式化进度显示
 */
export function formatProgressDisplay(progress: TaskProgress): string {
  const { currentStep, totalSteps, percentage } = progress;
  
  if (percentage === 100) return '✅ Completed';
  
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  return `${bar} ${percentage}% (${currentStep}/${totalSteps})`;
}

/**
 * 计算估计剩余时间
 */
export function estimateRemainingTime(progress: TaskProgress, avgStepTimeMs: number): number {
  const stepsRemaining = progress.totalSteps - progress.currentStep;
  return stepsRemaining * avgStepTimeMs;
}
