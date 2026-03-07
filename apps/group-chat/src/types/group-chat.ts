# Group Chat (群聊) 功能 - TypeScript 数据结构

/**
 * OpenClaw Group Chat 功能数据结构定义
 * 
 * 本文件定义了群聊的核心数据结构，包括：
 * - 群组结构
 * - 消息结构
 * - 成员角色
 * - 事件类型
 */

// ========================================
// 枚举定义
// ========================================

/**
 * 群组类型
 */
export enum GroupType {
  PRIVATE = 'private',        // 私聊群 (2人)
  SMALL = 'small',            // 小型群 (<10人)
  MEDIUM = 'medium',          // 中型群 (<100人)
  LARGE = 'large',            // 大型群 (>=100人)
  SYSTEM = 'system',          // 系统群
  EVENT = 'event',            // 事件群
}

/**
 * 成员角色
 */
export enum MemberRole {
  OWNER = 'owner',        // 所有者
  ADMIN = 'admin',        // 管理员
  MODERATOR = 'moderator', // 主播/主持人
  MEMBER = 'member',      // 普通成员
  GUEST = 'guest',        // 临时访客
  BLOCKED = 'blocked',    // 被封禁
}

/**
 * 消息类型
 */
export enum MessageType {
  TEXT = 'text',          // 文本消息
  IMAGE = 'image',        // 图片消息
  AUDIO = 'audio',        // 语音消息
  VIDEO = 'video',        // 视频消息
  FILE = 'file',          // 文件消息
  SYSTEM = 'system',      // 系统消息
  NOTICE = 'notice',      // 公告
  COMMAND = 'command',    // 命令消息
  EVENT = 'event',        // 事件消息
}

/**
 * 消息状态
 */
export enum MessageStatus {
  PENDING = 'pending',    // 待发送
  SENDING = 'sending',    // 发送中
  SENT = 'sent',          // 已发送
  DELIVERED = 'delivered', // 已接收
  READ = 'read',          // 已读
  FAILED = 'failed',      // 发送失败
}

/**
 * 事件类型
 */
export enum EventType {
  MEMBER_JOINED = 'member_joined',           // 成员加入
  MEMBER_LEFT = 'member_left',               // 成员离开
  MEMBER_ROLE_CHANGED = 'member_role_changed', // 成员角色变更
  MEMBER_KICKED = 'member_kicked',           // 成员被踢
  MEMBER_BANNED = 'member_banned',           // 成员被封禁
  GROUP_CREATED = 'group_created',           // 群组创建
  GROUP_UPDATED = 'group_updated',           // 群组更新
  GROUP_DELETED = 'group_deleted',           // 群组删除
  MESSAGE_SENT = 'message_sent',             // 消息发送
  MESSAGE_READ = 'message_read',             // 消息已读
  MESSAGE_DELETED = 'message_deleted',       // 消息删除
  ERROR = 'error',                           // 错误事件
}

/**
 * 群组状态
 */
export enum GroupStatus {
  ACTIVE = 'active',      // 活跃
  INACTIVE = 'inactive',  // 非活跃
  ARCHIVED = 'archived',  // 已归档
  DELETED = 'deleted',    // 已删除
}

// ========================================
// 接口定义
// ========================================

/**
 * 群组基础属性
 */
export interface BaseGroup {
  groupId: string;                // 群组唯一标识
  name: string;                   // 群组名称
  type: GroupType;                // 群组类型
  status: GroupStatus;           // 群组状态
  creatorId: string;              // 创建者 ID
  createdAt: string;              // 创建时间
  updatedAt?: string;             // 更新时间
  metadata?: Record<string, any>; // 元数据
}

/**
 * 群组信息
 */
export interface GroupInfo extends BaseGroup {
  description?: string;           // 群组描述
  avatar?: string;                // 群组头像 (URL)
  memberCount: number;            // 成员数量
  inviteCode?: string;           // 邀请码
  maxMembers: number;            // 最大成员数
  settings: GroupSettings;       // 群组设置
}

/**
 * 群组设置
 */
export interface GroupSettings {
  allowInvite: boolean;           // 允许邀请
  allowMessageEdit: boolean;      // 允许消息编辑
  allowMessageDelete: boolean;    // 允许消息删除
  messageRetentionDays: number;   // 消息保留天数
  requireApproval: boolean;       // 需要审批加入
  showMemberList: boolean;        // 显示成员列表
  enableTypingIndicator: boolean; // 启用正在输入提示
  enableReadReceipts: boolean;    // 启用已读回执
}

/**
 * 群组成员
 */
export interface GroupMember {
  memberId: string;               // 成员 ID
  groupId: string;                // 群组 ID
  role: MemberRole;               // 成员角色
  joinedAt: string;               // 加入时间
  leftAt?: string;                // 离开时间
  nickname?: string;              // 昵称
  avatar?: string;                // 头像 (URL)
  status?: MemberStatus;          // 在线状态
  lastSeen?: string;              // 最后上线时间
  metadata?: Record<string, any>; // 元数据
}

/**
 * 成员在线状态
 */
export enum MemberStatus {
  ONLINE = 'online',      // 在线
  IDLE = 'idle',          // 离开
  DO_NOT_DISTURB = 'dnd', // 勿打扰
  OFFLINE = 'offline',    // 离线
}

/**
 * 消息基础属性
 */
export interface BaseMessage {
  messageId: string;              // 消息唯一标识
  groupId: string;                // 群组 ID
  senderId: string;               // 发送者 ID
  senderName?: string;            // 发送者名称
  senderAvatar?: string;          // 发送者头像
  messageType: MessageType;       // 消息类型
  content: string;                // 消息内容
  status: MessageStatus;         // 消息状态
  createdAt: string;              // 创建时间
  sentAt?: string;                // 发送时间
  editedAt?: string;              // 编辑时间
  deletedAt?: string;             // 删除时间
  metadata?: Record<string, any>; // 元数据
}

/**
 * 消息信息
 */
export interface MessageInfo extends BaseMessage {
  contentPreview?: string;        // 消息预览 (用于列表)
  attachments?: Attachment[];     // 附件列表
  reactionCount?: number;         // 回复数
  forwardCount?: number;          // 转发数
  replyToMessageId?: string;      // 回复的消息 ID
}

/**
 * 附件信息
 */
export interface Attachment {
  type: string;                   // 附件类型
  url: string;                    // 附件 URL
  name?: string;                  // 附件名称
  size?: number;                  // 文件大小
  mimeType?: string;              // MIME 类型
  metadata?: Record<string, any>; // 元数据
}

/**
 * 消息编辑记录
 */
export interface MessageEdit {
  editId: string;
  messageId: string;
  senderId: string;
  oldContent: string;
  newContent: string;
  editedAt: string;
}

/**
 * 消息撤回/删除记录
 */
export interface MessageDeletion {
  deletionId: string;
  messageId: string;
  deletedBy: string;              // 删除者 ID (管理员/系统)
  reason?: string;                // 删除原因
  deletedAt: string;
}

/**
 * 消息已读记录
 */
export interface MessageRead {
  messageId: string;
  groupId: string;
  readBy: string;                 // 已读用户 ID
  readAt: string;
}

/**
 * 群组事件
 */
export interface GroupEvent {
  eventId: string;
  groupId: string;
  eventType: EventType;
  timestamp: string;
  payload: any;                   // 事件具体内容
  initiatorId?: string;           // 事件发起者
}

/**
 * 事件负载
 */
export interface EventPayload {
  // 成员加入
  memberId?: string;
  memberName?: string;
  
  // 成员离开
  leftMemberId?: string;
  leftMemberName?: string;
  
  // 成员角色变更
  memberId?: string;
  memberName?: string;
  oldRole?: MemberRole;
  newRole?: MemberRole;
  
  // 消息发送
  messageId?: string;
  message?: MessageInfo;
  
  // 错误
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 消息查询参数
 */
export interface MessageQueryParams {
  groupId: string;
  messageId?: string;
  senderId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  includeSystem?: boolean;
}

/**
 * 消息分页结果
 */
export interface MessagePageResult {
  messages: MessageInfo[];
  total: number;
  hasMore: boolean;
}

/**
 * 成员查询参数
 */
export interface MemberQueryParams {
  groupId: string;
  role?: MemberRole;
  status?: MemberStatus;
  limit?: number;
  offset?: number;
  includeOffline?: boolean;
}

/**
 * 群组查询参数
 */
export interface GroupQueryParams {
  memberId?: string;
  type?: GroupType;
  status?: GroupStatus;
  search?: string;                // 搜索关键词
  limit?: number;
  offset?: number;
}

/**
 * 群组分页结果
 */
export interface GroupPageResult {
  groups: GroupInfo[];
  total: number;
  hasMore: boolean;
}

// ========================================
// 常量定义
// ========================================

// 消息保留期 (天)
export const MESSAGE_RETENTION_DAYS = {
  [GroupType.PRIVATE]: 30,
  [GroupType.SMALL]: 30,
  [GroupType.MEDIUM]: 7,
  [GroupType.LARGE]: 3,
  [GroupType.SYSTEM]: 1,
  [GroupType.EVENT]: 7,
};

// 默认设置
export const DEFAULT_GROUP_SETTINGS: GroupSettings = {
  allowInvite: true,
  allowMessageEdit: true,
  allowMessageDelete: true,
  messageRetentionDays: 7,
  requireApproval: false,
  showMemberList: true,
  enableTypingIndicator: true,
  enableReadReceipts: true,
};

// 最大成员数
export const MAX_MEMBERS = {
  [GroupType.PRIVATE]: 2,
  [GroupType.SMALL]: 50,
  [GroupType.MEDIUM]: 500,
  [GroupType.LARGE]: 5000,
  [GroupType.SYSTEM]: 10000,
  [GroupType.EVENT]: 100000,
};

// ========================================
// 工具函数类型
// ========================================

export type MessageFilter = (message: MessageInfo) => boolean;

export type MemberFilter = (member: GroupMember) => boolean;

// ========================================
// 辅助函数
// ========================================

/**
 * 获取消息保留期
 */
export function getRetentionPeriod(groupType: GroupType): number {
  return MESSAGE_RETENTION_DAYS[groupType] || MESSAGE_RETENTION_DAYS[GroupType.MEDIUM];
}

/**
 * 获取最大成员数
 */
export function getMaxMembers(groupType: GroupType): number {
  return MAX_MEMBERS[groupType] || MAX_MEMBERS[GroupType.MEDIUM];
}

/**
 * 检查成员权限
 */
export function checkMemberPermission(
  memberRole: MemberRole,
  requiredRole: MemberRole
): boolean {
  const roles = Object.values(MemberRole);
  const memberIndex = roles.indexOf(memberRole);
  const requiredIndex = roles.indexOf(requiredRole);
  return memberIndex <= requiredIndex;
}

/**
 * 检查消息是否过期
 */
export function isMessageExpired(
  message: MessageInfo,
  retentionDays: number
): boolean {
  const createdAt = new Date(message.createdAt).getTime();
  const now = Date.now();
  const expiredTime = createdAt + retentionDays * 24 * 60 * 60 * 1000;
  return now > expiredTime;
}

/**
 * 生成消息预览
 */
export function generateMessagePreview(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
}

/**
 * 格式化消息
 */
export function formatMessage(
  message: MessageInfo,
  includeContent: boolean = true
): MessageInfo {
  const formatted = { ...message };
  
  if (!formatted.contentPreview && formatted.content) {
    formatted.contentPreview = generateMessagePreview(formatted.content);
  }
  
  if (!includeContent) {
    delete formatted.content;
  }
  
  return formatted;
}

/**
 * 计算群组成员活跃度
 */
export function calculateMemberActivity(
  members: GroupMember[],
  startTime: string,
  endTime: string
): {
  total: number;
  active: number;
  activeRate: number;
} {
  const total = members.length;
  const active = members.filter(member => {
    if (!member.lastSeen) return false;
    const lastSeen = new Date(member.lastSeen).getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return lastSeen >= start && lastSeen <= end;
  }).length;
  
  return {
    total,
    active,
    activeRate: total > 0 ? active / total : 0,
  };
}

/**
 * 计算消息统计
 */
export function calculateMessageStats(
  messages: MessageInfo[],
  startTime?: string,
  endTime?: string
): {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  system: number;
  text: number;
  media: number;
} {
  const stats = {
    total: messages.length,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    system: 0,
    text: 0,
    media: 0,
  };

  messages.forEach(message => {
    switch (message.status) {
      case MessageStatus.SENT:
        stats.sent++;
        break;
      case MessageStatus.DELIVERED:
        stats.delivered++;
        break;
      case MessageStatus.READ:
        stats.read++;
        break;
      case MessageStatus.FAILED:
        stats.failed++;
        break;
    }

    if (message.messageType === MessageType.SYSTEM) {
      stats.system++;
    }

    if ([MessageType.TEXT, MessageType.IMAGE, MessageType.AUDIO, MessageType.VIDEO, MessageType.FILE].includes(message.messageType)) {
      if (message.messageType === MessageType.TEXT) {
        stats.text++;
      } else {
        stats.media++;
      }
    }
  });

  return stats;
}
