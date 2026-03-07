# Avatar Service - 核心业务逻辑

/**
 * OpenClaw Avatar Service
 * 
 * 提供头像功能的核心业务逻辑：
 * - 头像创建/更新/删除
 * - 头像查询/列表
 * - 头像切换/预览
 */

import { Inject, Injectable } from 'inversify';
import * as uuid from 'uuid/v4';
import { isEmpty, isNil } from 'lodash';

import {
  AvatarEntity,
  AvatarQueryParams,
  AvatarSwitchRequest,
  AvatarApiResponse,
  AvatarType,
  AvatarStatus,
  ImageAvatar,
  EmojiAvatar,
  IconAvatar,
} from '../types/avatar';

import { AvatarRepository } from '../repositories/avatar.repository';
import { StorageService } from '../services/storage.service';
import { UserService } from '../services/user.service';
import { Logger } from '../utils/logger';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    @Inject('AvatarRepository') private readonly repository: AvatarRepository,
    @Inject('StorageService') private readonly storageService: StorageService,
    @Inject('UserService') private readonly userService: UserService
  ) {}

  /**
   * 创建头像
   */
  async createAvatar(data: Partial<AvatarEntity>): Promise<AvatarEntity> {
    try {
      const avatarId = uuid();
      const now = new Date().toISOString();

      // 根据类型创建不同的头像对象
      let avatar: AvatarEntity;

      switch (data.type) {
        case AvatarType.IMAGE: {
          const imageAvatar: ImageAvatar = {
            id: avatarId,
            type: AvatarType.IMAGE,
            data: data.imageUrl || '',
            imageUrl: data.imageUrl || '',
            name: data.name || '',
            description: data.description,
            status: AvatarStatus.ACTIVE,
            storageType: AvatarStorageType.LOCAL,
            createdAt: now,
            updatedAt: now,
          };
          avatar = imageAvatar;
          break;
        }

        case AvatarType.EMOJI: {
          const emojiAvatar: EmojiAvatar = {
            id: avatarId,
            type: AvatarType.EMOJI,
            data: data.emoji || '',
            emoji: data.emoji || '',
            name: data.name || '',
            description: data.description,
            status: AvatarStatus.ACTIVE,
            storageType: AvatarStorageType.LOCAL,
            createdAt: now,
            updatedAt: now,
          };
          avatar = emojiAvatar;
          break;
        }

        case AvatarType.ICON: {
          const iconAvatar: IconAvatar = {
            id: avatarId,
            type: AvatarType.ICON,
            data: data.svgData || '',
            svgData: data.svgData || '',
            name: data.name || '',
            description: data.description,
            status: AvatarStatus.ACTIVE,
            storageType: AvatarStorageType.LOCAL,
            createdAt: now,
            updatedAt: now,
          };
          avatar = iconAvatar;
          break;
        }

        default:
          throw new Error(`Unsupported avatar type: ${data.type}`);
      }

      // 保存到存储
      const storageMetadata: AvatarStorageMetadata = {
        avatarId: avatarId,
        version: 1,
        checksum: this.calculateChecksum(avatar),
        size: JSON.stringify(avatar).length,
        storagePath: `/avatars/${avatarId}`,
        tags: [],
      };

      avatar.storage = storageMetadata;

      // 保存到仓库
      await this.repository.save(avatar);

      this.logger.info(`Avatar created: ${avatarId}`);

      return avatar;
    } catch (error) {
      this.logger.error('Error creating avatar:', error);
      throw error;
    }
  }

  /**
   * 更新头像
   */
  async updateAvatar(avatarId: string, data: Partial<AvatarEntity>): Promise<AvatarEntity> {
    try {
      const existingAvatar = await this.repository.findById(avatarId);

      if (!existingAvatar) {
        throw new Error(`Avatar not found: ${avatarId}`);
      }

      // 更新字段
      const updatedAvatar: AvatarEntity = {
        ...existingAvatar,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      // 更新存储元数据
      if (updatedAvatar.storage) {
        updatedAvatar.storage.version += 1;
        updatedAvatar.storage.checksum = this.calculateChecksum(updatedAvatar);
        updatedAvatar.storage.size = JSON.stringify(updatedAvatar).length;
      }

      await this.repository.save(updatedAvatar);

      this.logger.info(`Avatar updated: ${avatarId}`);

      return updatedAvatar;
    } catch (error) {
      this.logger.error('Error updating avatar:', error);
      throw error;
    }
  }

  /**
   * 删除头像
   */
  async deleteAvatar(avatarId: string): Promise<void> {
    try {
      const avatar = await this.repository.findById(avatarId);

      if (!avatar) {
        throw new Error(`Avatar not found: ${avatarId}`);
      }

      // 删除存储
      if (avatar.storage?.storagePath) {
        await this.storageService.delete(avatar.storage.storagePath);
      }

      // 从仓库删除
      await this.repository.delete(avatarId);

      this.logger.info(`Avatar deleted: ${avatarId}`);
    } catch (error) {
      this.logger.error('Error deleting avatar:', error);
      throw error;
    }
  }

  /**
   * 获取头像
   */
  async getAvatar(avatarId: string): Promise<AvatarEntity | null> {
    return this.repository.findById(avatarId);
  }

  /**
   * 列出头像
   */
  async listAvatars(params: AvatarQueryParams): Promise<{
    items: AvatarEntity[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const result = await this.repository.list(params);

      return {
        items: result.items,
        total: result.total,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };
    } catch (error) {
      this.logger.error('Error listing avatars:', error);
      throw error;
    }
  }

  /**
   * 切换头像
   */
  async switchAvatar(request: AvatarSwitchRequest): Promise<AvatarEntity> {
    try {
      const { userId, agentId, newAvatarId } = request;

      // 验证新头像存在
      const newAvatar = await this.repository.findById(newAvatarId);

      if (!newAvatar) {
        throw new Error(`Avatar not found: ${newAvatarId}`);
      }

      // 更新用户偏好
      await this.userService.updateUserAvatarPreference(
        userId,
        agentId,
        { selectedAvatarId: newAvatarId }
      );

      this.logger.info(`Avatar switched for user ${userId}, agent ${agentId}: ${newAvatarId}`);

      return newAvatar;
    } catch (error) {
      this.logger.error('Error switching avatar:', error);
      throw error;
    }
  }

  /**
   * 获取头像预览
   */
  async getAvatarPreview(avatarId: string): Promise<{
    id: string;
    type: AvatarType;
    previewData: string;
    metadata: {
      name: string;
      description?: string;
      tags: string[];
    };
  } | null> {
    try {
      const avatar = await this.repository.findById(avatarId);

      if (!avatar) {
        return null;
      }

      let previewData = '';

      switch (avatar.type) {
        case AvatarType.IMAGE:
          previewData = avatar.imageUrl || avatar.data;
          break;
        case AvatarType.EMOJI:
          previewData = avatar.emoji || avatar.data;
          break;
        case AvatarType.ICON:
          previewData = avatar.svgData || avatar.data;
          break;
      }

      return {
        id: avatar.id,
        type: avatar.type,
        previewData,
        metadata: {
          name: avatar.name,
          description: avatar.description,
          tags: avatar.storage?.tags || [],
        },
      };
    } catch (error) {
      this.logger.error('Error getting avatar preview:', error);
      throw error;
    }
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(avatar: AvatarEntity): string {
    const data = JSON.stringify({
      id: avatar.id,
      type: avatar.type,
      data: avatar.data,
      name: avatar.name,
    });
    
    // 简化版 checksum (实际应使用 hash) 
    // TODO: Replace with SHA256 hash in production
    return btoa(data).substring(0, 32);
  }

  /**
   * 根据 Agent ID 获取头像配置
   */
  async getAvatarConfig(agentId: string): Promise<AvatarEntity | null> {
    try {
      const avatars = await this.repository.getByAgentId(agentId);

      if (avatars.length === 0) {
        return null;
      }

      // 找到默认头像
      const defaultAvatar = avatars.find(a => a.status === AvatarStatus.ACTIVE);

      return defaultAvatar || avatars[0];
    } catch (error) {
      this.logger.error('Error getting avatar config:', error);
      throw error;
    }
  }

  /**
   * 获取用户当前头像
   */
  async getCurrentAvatar(userId: string, agentId: string): Promise<AvatarEntity | null> {
    try {
      const preference = await this.userService.getUserAvatarPreference(
        userId,
        agentId
      );

      if (!preference.selectedAvatarId) {
        return this.getAvatarConfig(agentId);
      }

      return this.repository.findById(preference.selectedAvatarId);
    } catch (error) {
      this.logger.error('Error getting current avatar:', error);
      throw error;
    }
  }
}
