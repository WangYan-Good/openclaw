# Avatar (头像) 功能 - TypeScript 数据结构

/**
 * OpenClaw Avatar 功能数据结构定义
 * 
 * 本文件定义了头像功能的核心数据结构，包括：
 * - Avatar 类型定义 (图片/Emoji/图标)
 * - Avatar 配置结构
 * - 用户头像偏好
 * - 头像存储元数据
 */

// ========================================
// 类型定义
// ========================================

export enum AvatarType {
  IMAGE = 'image',     // 图片类型 (PNG/JPG/GIF)
  EMOJI = 'emoji',     // Emoji 类型
  ICON = 'icon',       // 图标类型 (SVG)
}

export enum AvatarStatus {
  ACTIVE = 'active',         // 正常使用
  DEPRECATED = 'deprecated', // 废弃
  ARCHIVED = 'archived',     // 归档
}

export enum AvatarStorageType {
  LOCAL = 'local',     // 本地存储
  CLOUD = 'cloud',     // 云端存储 (预留给未来)
}

// ========================================
// 接口定义
// ========================================

/**
 * 头像基础属性
 */
export interface AvatarBase {
  id: string;                    // 头像唯一标识
  type: AvatarType;              // 头像类型
  data: string;                  // 头像数据 (URL/Emoji/SVG base64)
  name: string;                  // 头像名称
  description?: string;          // 头像描述
  status: AvatarStatus;          // 头像状态
  storageType: AvatarStorageType; // 存储类型
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
}

/**
 * 图片头像特定属性
 */
export interface ImageAvatar extends AvatarBase {
  type: AvatarType.IMAGE;
  imageUrl: string;              // 图片 URL 路径
  thumbnailUrl?: string;         // 缩略图 URL
  width?: number;                // 图片宽度
  height?: number;               // 图片高度
}

/**
 * Emoji 头像特定属性
 */
export interface EmojiAvatar extends AvatarBase {
  type: AvatarType.EMOJI;
  emoji: string;                 // Emoji 字符
  variant?: string;              // 变体 (如肤色)
}

/**
 * 图标头像特定属性
 */
export interface IconAvatar extends AvatarBase {
  type: AvatarType.ICON;
  svgData: string;               // SVG 数据 (内联或 base64)
  size?: string;                 // 图标大小
}

/**
 * 头像配置 (供 Agent 使用)
 */
export interface AvatarConfig {
  default: string;                              // 默认头像 ID
  alternatives?: string[];                      // 备选头像 ID 列表
  restricted?: boolean;                         // 是否只允许默认头像
  allowedTypes?: AvatarType[];                  // 允许的头像类型
}

/**
 * 用户头像偏好
 */
export interface UserAvatarPreference {
  userId: string;                               // 用户 ID
  agentId: string;                              // Agent ID
  selectedAvatarId?: string;                    // 选择的头像 ID
  avatarHistory: string[];                      // 头像历史记录
  preferences: {
    showAvatar: boolean;                        // 是否显示头像
    avatarSize: 'small' | 'medium' | 'large';  // 头像大小
  };
  updatedAt: string;                            // 更新时间
}

/**
 * 头像存储元数据
 */
export interface AvatarStorageMetadata {
  avatarId: string;
  version: number;                              // 版本号
  checksum: string;                             // 数据校验和 (SHA256)
  size: number;                                 // 字节大小
  storagePath: string;                          // 存储路径
  tags: string[];                               // 标签
  metadata?: Record<string, string>;            // 扩展元数据
}

/**
 * 头像访问控制
 */
export interface AvatarAccessControl {
  ownerId: string;                              // 所有者 ID
  allowedUsers: string[];                       // 允许访问的用户
  permittedActions: ('read' | 'write' | 'delete')[]; // 允许的操作
}

// ========================================
 * 聚合数据结构
// ========================================

/**
 * 完整的头像对象 (数据库存储格式)
 */
export interface AvatarEntity extends AvatarBase {
  config?: AvatarConfig;                        // 头像配置
  storage?: AvatarStorageMetadata;              // 存储元数据
  acl?: AvatarAccessControl;                    // 访问控制
}

/**
 * API响应格式
 */
export interface AvatarApiResponse {
  success: boolean;
  data?: AvatarEntity | AvatarEntity[];
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 头像列表查询参数
 */
export interface AvatarQueryParams {
  agentId?: string;
  userId?: string;
  type?: AvatarType;
  status?: AvatarStatus;
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
}

/**
 * 头像切换请求
 */
export interface AvatarSwitchRequest {
  userId: string;
  agentId: string;
  newAvatarId: string;
  reason?: string;
}

/**
 * 头像预览数据
 */
export interface AvatarPreview {
  id: string;
  type: AvatarType;
  previewData: string;               // 渲染用的数据
  thumbnail?: string;                // 缩略图
  metadata: {
    name: string;
    description?: string;
    tags: string[];
  };
}

// ========================================
// 常量定义
// ========================================

export const AVATAR_SIZES = {
  small: 24,
  medium: 48,
  large: 96,
  extraLarge: 128,
};

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const MAX_AVATAR_SIZE = 1024 * 1024; // 1MB

export const DEFAULT_AVATARS: Record<string, AvatarEntity> = {
  default: {
    id: 'avatar_default',
    type: AvatarType.EMOJI,
    data: '📋',
    name: '默认头像',
    description: '系统默认 Emoji 头像',
    status: AvatarStatus.ACTIVE,
    storageType: AvatarStorageType.LOCAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// ========================================
// 工具函数类型
// ========================================

export type AvatarValidator = (
  avatar: Partial<AvatarEntity>
) => { valid: boolean; errors?: string[] };

export type AvatarFormatter = (
  avatar: AvatarEntity
) => AvatarPreview;
