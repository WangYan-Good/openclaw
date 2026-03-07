# Avatar Draft (分身) 功能 - TypeScript 数据结构

/**
 * OpenClaw Avatar Draft 功能数据结构定义
 * 
 * 本文件定义了分身系统的核心数据结构，包括：
 * - Agent 结构
 * - 分身配置
 * - 通信消息
 * - 隔离策略
 */

// ========================================
// 枚举定义
// ========================================

/**
 * 分身状态
 */
export enum AvatarStatus {
  ACTIVE = 'active',          // 活跃
  IDLE = 'idle',              // 空闲
  BUSY = 'busy',              // 忙碌
  MAINTENANCE = 'maintenance', // 维护中
  DELETED = 'deleted',        // 已删除
}

/**
 * 隔离级别
 */
export enum IsolationLevel {
  SHARED = 'shared',          // 共享模式 (最轻量)
  PROTECTED = 'protected',    // 保护模式 (内存隔离)
  FULL = 'full',              // 完全隔离 (独立进程/容器)
}

/**
* 消息类型
*/
export enum MessageType {
  COMMAND = 'command',        // 指令消息
  EVENT = 'event',            // 事件消息
  DATA = 'data',              // 数据消息
  RESPONSE = 'response',      // 响应消息
  ERROR = 'error',            // 错误消息
  SYSTEM = 'system',          // 系统消息
}

/**
 * 分身角色
 */
export enum AvatarRole {
  ASSISTANT = 'assistant',    // 助手
  DEVOPS = 'devops',          // 运维工程师
  DEV = 'dev',                // 开发者
  QA = 'qa',                  // 测试
  SECURITY = 'security',      // 安全专家
  CUSTOMER_SUPPORT = 'customer_support', // 客服
  SALES = 'sales',            // 销售
  THOUGHTER = 'thoughter',    // 思考者
  CREATOR = 'creator',        // 创作者
}

/**
 * 通信协议
 */
export enum CommunicationProtocol {
  WS = 'ws',                  // WebSocket
  HTTP = 'http',              // HTTP/REST
  IPC = 'ipc',                // 进程间通信
  NATS = 'nats',              // NATS 消息队列
}

/**
 * 分身标签类型
 */
export enum AvatarTagType {
  SKILL = 'skill',            // 技能标签
  PROPERTY = 'property',      // 属性标签
  CAPABILITY = 'capability',  // 能力标签
  ROLE = 'role',              // 角色标签
}

// ========================================
// 接口定义
// ========================================

/**
 * Agent 基础属性
 */
export interface BaseAgent {
  agentId: string;              // Agent 唯一标识
  name: string;                 // Agent 名称
  avatar: string;               // 分身头像
  description?: string;         // 描述
  status: AvatarStatus;        // 状态
  role: AvatarRole;            // 角色
  createdAt: string;            // 创建时间
  updatedAt?: string;           // 更新时间
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  model: string;                // 大模型名称
  systemPrompt: string;         // 系统提示词
  temperature: number;          // 温度参数 (0-2)
  topP: number;                 // 核采样参数 (0-1)
  maxTokens: number;            // 最大生成长度
  contextWindow: number;        // 上下文窗口大小
  tools: string[];              // 可用工具列表
  isolation: IsolationLevel;    // 隔离级别
  memoryRetrieval: {
    enabled: boolean;           // 启用记忆检索
    topK: number;               // 检索Top-K结果
    threshold: number;          // 相似度阈值
  };
  reasoning: {
    enabled: boolean;           // 启用推理
    chainOfThought: boolean;    // 链式思考
    verbose: boolean;           // 详细输出
  };
}

/**
 * Agent 信息
 */
export interface AgentInfo extends BaseAgent {
  config: AgentConfig;          // Agent 配置
  tags: string[];               // 标签列表
  metadata?: Record<string, any>; // 元数据
}

/**
 * Agent 状态
 */
export interface AgentState {
  agentId: string;
  status: AvatarStatus;
  currentTaskId?: string;       // 当前任务 ID
  activeSessions: number;       // 活跃会话数
  CPUUsage: number;             // CPU 使用率 (%)
  memoryUsage: number;          // 内存使用量 (MB)
  uptimeMs: number;             // 运行时间 (ms)
  lastHeartbeat: string;        // 最后心跳时间
}

/**
 * 分身配置
 */
export interface AvatarDraftConfig {
  maxAgents: number;            // 最大分身数
  defaultIsolation: IsolationLevel; // 默认隔离级别
  maxConcurrency: number;       // 最大并发数
  heartbeatInterval: number;    // 心跳间隔 (ms)
  cleanupInterval: number;      // 清理间隔 (ms)
  communication: {
    protocol: CommunicationProtocol; // 通信协议
    endpoint: string;             // 端点地址
    timeoutMs: number;            // 超时时间
  };
  resourceLimits: {
    maxCPU: number;               // 最大 CPU 使用率 (%)
    maxMemory: number;            // 最大内存 (MB)
    timeoutMs: number;            // 超时时间 (ms)
  };
}

/**
 * 通信消息
 */
export interface Message {
  messageId: string;            // 消息 ID
  type: MessageType;            // 消息类型
  from: string;                 // 发送者 (Agent ID)
  to: string;                   // 接收者 (Agent ID 或 '*')
  timestamp: string;            // 时间戳
  payload: MessagePayload;      // 消息负载
  responseTo?: string;          // 响应消息 ID
  metadata?: Record<string, any>; // 元数据
}

/**
 * 消息负载
 */
export interface MessagePayload {
  // 指令消息
  command?: string;             // 命令名称
  commandPayload?: any;         // 命令参数
  
  // 事件消息
  event?: string;               // 事件名称
  eventData?: any;              // 事件数据
  
  // 数据消息
  data?: any;                   // 数据内容
  
  // 响应消息
  success?: boolean;            // 是否成功
  result?: any;                 // 结果
  error?: MessageError;         // 错误信息
  
  // 系统消息
  systemMessage?: string;       // 系统消息
}

/**
 * 消息错误
 */
export interface MessageError {
  code: string;                 // 错误码
  message: string;              // 错误消息
  details?: Record<string, any>; // 详细信息
}

/**
 * 分身会话
 */
export interface AvatarSession {
  sessionId: string;            // 会话 ID
  agentId: string;              // Agent ID
  userId: string;               // 用户 ID
  channel: string;              // 通信渠道
  startedAt: string;            // 开始时间
  lastActive: string;           // 最后活跃
  messages: Message[];          // 消息历史
  status: SessionStatus;       // 会话状态
  metadata?: Record<string, any>; // 元数据
}

export enum SessionStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  COMPLETED = 'completed',
  TIMED_OUT = 'timed_out',
}

/**
 * 分身任务
 */
export interface AvatarTask {
  taskId: string;               // 任务 ID
  agentId: string;              // Agent ID
  sessionId?: string;           // 会话 ID
  type: string;                 // 任务类型
  input: any;                   // 输入数据
  output?: any;                 // 输出数据
  status: TaskStatus;          // 任务状态
  progress: number;             // 进度 (0-100)
  startedAt?: string;           // 开始时间
  completedAt?: string;         // 完成时间
  metadata?: Record<string, any>; // 元数据
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * 分身标签
 */
export interface AvatarTag {
  tagId: string;
  type: AvatarTagType;
  name: string;                 // 标签名
  value: string;                // 标签值
  agentIds: string[];           // 关联的 Agent ID
  count: number;                // 使用次数
  metadata?: Record<string, any>; // 元数据
}

/**
 * 分身池状态
 */
export interface AvatarPoolState {
  totalAgents: number;          // 总 Agent 数
  activeAgents: number;         // 活跃 Agent 数
  byRole: Map<AvatarRole, number>; // 按角色统计
  byStatus: Map<AvatarStatus, number>; // 按状态统计
  memoryUsage: number;          // 总内存 (MB)
  avgCPUUsage: number;          // 平均 CPU 使用率
}

/**
 * Agent 查询参数
 */
export interface AgentQueryParams {
  status?: AvatarStatus;
  role?: AvatarRole;
  tag?: string;
  name?: string;
  isolation?: IsolationLevel;
  limit?: number;
  offset?: number;
}

/**
 * Agent 分页结果
 */
export interface AgentPageResult {
  agents: AgentInfo[];
  total: number;
  hasMore: boolean;
}

/**
 * 会话查询参数
 */
export interface SessionQueryParams {
  agentId?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

/**
 * 会话分页结果
 */
export interface SessionPageResult {
  sessions: AvatarSession[];
  total: number;
  hasMore: boolean;
}

// ========================================
// 常量定义
// ========================================

// 默认配置
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'default',
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  contextWindow: 4096,
  tools: ['read', 'write', 'exec', 'browser'],
  isolation: IsolationLevel.PROTECTED,
  memoryRetrieval: {
    enabled: true,
    topK: 5,
    threshold: 0.7,
  },
  reasoning: {
    enabled: false,
    chainOfThought: true,
    verbose: false,
  },
};

// 默认分身配置
export const DEFAULT_AVATAR_DRAFT_CONFIG: AvatarDraftConfig = {
  maxAgents: 100,
  defaultIsolation: IsolationLevel.PROTECTED,
  maxConcurrency: 10,
  heartbeatInterval: 30000,     // 30 秒
  cleanupInterval: 300000,      // 5 分钟
  communication: {
    protocol: CommunicationProtocol.WS,
    endpoint: 'ws://localhost:8080',
    timeoutMs: 10000,
  },
  resourceLimits: {
    maxCPU: 80,
    maxMemory: 1024,
    timeoutMs: 300000,          // 5 分钟
  },
};

// 隔离级别资源占用
export const ISOLATION_RESOURCE_COST = {
  [IsolationLevel.SHARED]: { cpu: 5, memory: 64 },
  [IsolationLevel.PROTECTED]: { cpu: 10, memory: 256 },
  [IsolationLevel.FULL]: { cpu: 20, memory: 512 },
};

// ========================================
// 工具函数类型
// ========================================

export type AgentFilter = (agent: AgentInfo) => boolean;

export type MessageHandler = (message: Message) => Promise<Message | void>;

// ========================================
// 辅助函数
// ========================================

/**
 * 检查 Agent 是否活跃
 */
export function isAgentActive(agent: AgentInfo): boolean {
  return agent.status === AvatarStatus.ACTIVE || agent.status === AvatarStatus.IDLE;
}

/**
 * 检查 Agent 是否可分配任务
 */
export function canAssignTask(agent: AgentInfo): boolean {
  return isAgentActive(agent) && agent.status !== AvatarStatus.BUSY;
}

/**
 * 获取隔离级别资源占用
 */
export function getIsolationResources(level: IsolationLevel): {
  cpu: number;
  memory: number;
} {
  return ISOLATION_RESOURCE_COST[level] || ISOLATION_RESOURCE_COST[IsolationLevel.PROTECTED];
}

/**
 * 计算 Agent 数量比率
 */
export function calculateAgentRatio(
  agents: AgentInfo[],
  status: AvatarStatus
): number {
  if (agents.length === 0) return 0;
  const count = agents.filter(agent => agent.status === status).length;
  return count / agents.length;
}

/**
 * 生成 Agent ID
 */
export function generateAgentId(prefix: string = 'avatar'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 生成消息 ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 格式化 Agent 状态
 */
export function formatAgentStatus(
  state: AgentState,
  info: AgentInfo
): {
  status: AvatarStatus;
  details: string;
  progress?: number;
} {
  if (state.status === AvatarStatus.MAINTENANCE) {
    return {
      status: state.status,
      details: 'Maintenance in progress',
    };
  }

  if (state.status === AvatarStatus.DELETED) {
    return {
      status: state.status,
      details: 'Agent has been deleted',
    };
  }

  if (state.status === AvatarStatus.BUSY) {
    return {
      status: state.status,
      details: `Busy with task: ${state.currentTaskId}`,
    };
  }

  return {
    status: state.status,
    details: `Running ${info.role} role`,
    progress: state.activeSessions > 0 ? 50 : 0,
  };
}

/**
 * 计算 Agent 平均性能
 */
export function calculateAgentPerformance(
  states: AgentState[]
): {
  avgCPU: number;
  avgMemory: number;
  uptimeAvg: number;
  activeRate: number;
} {
  if (states.length === 0) {
    return {
      avgCPU: 0,
      avgMemory: 0,
      uptimeAvg: 0,
      activeRate: 0,
    };
  }

  const totalCPU = states.reduce((sum, s) => sum + s.CPUUsage, 0);
  const totalMemory = states.reduce((sum, s) => sum + s.memoryUsage, 0);
  const totalUptime = states.reduce((sum, s) => sum + s.uptimeMs, 0);
  const activeCount = states.filter(s => s.status === AvatarStatus.ACTIVE).length;

  return {
    avgCPU: totalCPU / states.length,
    avgMemory: totalMemory / states.length,
    uptimeAvg: totalUptime / states.length,
    activeRate: activeCount / states.length,
  };
}

/**
 * 验证 Agent 配置
 */
export function validateAgentConfig(config: AgentConfig): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (config.temperature < 0 || config.temperature > 2) {
    issues.push('Temperature must be between 0 and 2');
  }

  if (config.topP < 0 || config.topP > 1) {
    issues.push('TopP must be between 0 and 1');
  }

  if (config.maxTokens <= 0) {
    issues.push('MaxTokens must be positive');
  }

  if (config.contextWindow <= 0) {
    issues.push('Context window must be positive');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * 创建系统消息
 */
export function createSystemMessage(
  from: string,
  to: string,
  content: string
): Message {
  return {
    messageId: generateMessageId(),
    type: MessageType.SYSTEM,
    from,
    to,
    timestamp: new Date().toISOString(),
    payload: {
      systemMessage: content,
    },
  };
}

/**
 * 创建响应消息
 */
export function createResponseMessage(
  original: Message,
  success: boolean,
  result?: any,
  error?: MessageError
): Message {
  return {
    messageId: generateMessageId(),
    type: MessageType.RESPONSE,
    from: original.to,
    to: original.from,
    responseTo: original.messageId,
    timestamp: new Date().toISOString(),
    payload: {
      success,
      result,
      error,
    },
  };
}
