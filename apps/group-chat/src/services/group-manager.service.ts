# Group Manager (群组管理)

/**
 * OpenClaw Group Manager
 * 
 * 提供群组管理的核心功能：
 * - 群组创建/删除
 * - 群组查询/统计
 * - 群组设置管理
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  GroupInfo,
  GroupType,
  GroupStatus,
  GroupSettings,
  DEFAULT_GROUP_SETTINGS,
  MAX_MEMBERS,
  GroupQueryParams,
  GroupPageResult,
} from '../types/group-chat';

import { Logger } from '../utils/logger';

@Injectable()
export class GroupManager {
  private readonly logger = new Logger(GroupManager.name);
  private groups: Map<string, GroupInfo> = new Map();

  /**
   * 创建群组
   */
  async createGroup(data: {
    name: string;
    type: GroupType;
    creatorId: string;
    description?: string;
    avatar?: string;
    settings?: Partial<GroupSettings>;
  }): Promise<GroupInfo> {
    try {
      const groupId = this.generateGroupId();
      const now = new Date().toISOString();

      const group: GroupInfo = {
        groupId,
        name: data.name,
        type: data.type,
        status: GroupStatus.ACTIVE,
        creatorId: data.creatorId,
        createdAt: now,
        description: data.description,
        avatar: data.avatar,
        memberCount: 1, // 创建者默认为成员
        inviteCode: this.generateInviteCode(),
        maxMembers: MAX_MEMBERS[data.type],
        settings: {
          ...DEFAULT_GROUP_SETTINGS,
          ...data.settings,
        },
      };

      this.groups.set(groupId, group);
      this.logger.info(`Group created: ${groupId}`);

      return group;
    } catch (error) {
      this.logger.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * 更新群组
   */
  async updateGroup(groupId: string, data: Partial<GroupInfo>): Promise<void> {
    try {
      const group = this.groups.get(groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }

      const updatedGroup = {
        ...group,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      this.groups.set(groupId, updatedGroup);
      this.logger.info(`Group updated: ${groupId}`);
    } catch (error) {
      this.logger.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * 删除群组
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const group = this.groups.get(groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }

      // 软删除
      await this.updateGroup(groupId, {
        status: GroupStatus.DELETED,
      });

      this.logger.info(`Group deleted: ${groupId}`);
    } catch (error) {
      this.logger.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * 获取群组
   */
  async getGroup(groupId: string): Promise<GroupInfo | null> {
    return this.groups.get(groupId) || null;
  }

  /**
   * 查询群组
   */
  async queryGroup(
    params: GroupQueryParams
  ): Promise<GroupPageResult> {
    try {
      let groups = Array.from(this.groups.values());

      // 过滤
      if (params.memberId) {
        // TODO: 根据成员 ID 过滤
        groups = groups.filter(group => group.memberCount > 0);
      }

      if (params.type) {
        groups = groups.filter(group => group.type === params.type);
      }

      if (params.status) {
        groups = groups.filter(group => group.status === params.status);
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        groups = groups.filter(group =>
          group.name.toLowerCase().includes(searchLower) ||
          (group.description?.toLowerCase().includes(searchLower))
        );
      }

      // 分页
      const total = groups.length;
      const page = params.offset ? Math.floor(params.offset / (params.limit || 20)) : 0;
      const pageSize = params.limit || 20;
      const start = page * pageSize;
      const paginatedGroups = groups.slice(start, start + pageSize);

      return {
        groups: paginatedGroups,
        total,
        hasMore: start + pageSize < total,
      };
    } catch (error) {
      this.logger.error('Error querying groups:', error);
      throw error;
    }
  }

  /**
   * 获取群组统计
   */
  async getStats(): Promise<{
    totalGroups: number;
    groupsByType: Map<GroupType, number>;
    groupsByStatus: Map<GroupStatus, number>;
    averageMemberCount: number;
  }> {
    const groups = Array.from(this.groups.values());

    const totalGroups = groups.length;
    const groupsByType = new Map<GroupType, number>();
    const groupsByStatus = new Map<GroupStatus, number>();
    let totalMemberCount = 0;

    groups.forEach(group => {
      // 按类型统计
      const typeCount = groupsByType.get(group.type) || 0;
      groupsByType.set(group.type, typeCount + 1);

      // 按状态统计
      const statusCount = groupsByStatus.get(group.status) || 0;
      groupsByStatus.set(group.status, statusCount + 1);

      // 累计成员数
      totalMemberCount += group.memberCount;
    });

    return {
      totalGroups,
      groupsByType,
      groupsByStatus,
      averageMemberCount: totalGroups > 0 ? totalMemberCount / totalGroups : 0,
    };
  }

  /**
   * 生成群组 ID
   */
  private generateGroupId(): string {
    return `grp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
