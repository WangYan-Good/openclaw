# Member Manager (成员管理)

/**
 * OpenClaw Member Manager
 * 
 * 提供成员管理的核心功能：
 * - 成员加入/离开
 * - 成员角色变更
 * - 成员封禁/解封
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  GroupMember,
  MemberRole,
  MemberStatus,
  GroupType,
  MAX_MEMBERS,
} from '../types/group-chat';

import { GroupManager } from './group-manager.service';
import { Logger } from '../utils/logger';

@Injectable()
export class MemberManager {
  private readonly logger = new Logger(MemberManager.name);
  private members: Map<string, Map<string, GroupMember>> = new Map(); // groupId -> Map<memberId, GroupMember>

  constructor(private readonly groupManager: GroupManager) {}

  /**
   * 添加成员
   */
  async addMember(data: {
    groupId: string;
    memberId: string;
    role?: MemberRole;
    nickname?: string;
    avatar?: string;
  }): Promise<GroupMember> {
    try {
      const group = await this.groupManager.getGroup(data.groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${data.groupId}`);
      }

      // 检查群组状态
      if (group.status !== 'active') {
        throw new Error(`Group is not active: ${data.groupId}`);
      }

      // 检查成员数量限制
      if (group.memberCount >= group.maxMembers) {
        throw new Error(`Group is full: ${data.groupId}`);
      }

      // 检查成员是否已存在
      const existingMember = this.getMember(data.groupId, data.memberId);
      if (existingMember) {
        throw new Error(`Member already exists: ${data.memberId}`);
      }

      const now = new Date().toISOString();

      const member: GroupMember = {
        memberId: data.memberId,
        groupId: data.groupId,
        role: data.role || MemberRole.MEMBER,
        joinedAt: now,
        nickname: data.nickname,
        avatar: data.avatar,
        status: MemberStatus.OFFLINE,
      };

      // 添加成员
      let groupMembers = this.members.get(data.groupId);
      if (!groupMembers) {
        groupMembers = new Map();
        this.members.set(data.groupId, groupMembers);
      }
      groupMembers.set(data.memberId, member);

      // 更新群组成员数
      await this.groupManager.updateGroup(data.groupId, {
        memberCount: group.memberCount + 1,
      });

      this.logger.info(`Member added: ${data.memberId} to ${data.groupId}`);

      return member;
    } catch (error) {
      this.logger.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * 离开群组
   */
  async leaveGroup(groupId: string, memberId: string): Promise<void> {
    try {
      const group = await this.groupManager.getGroup(groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }

      // 检查成员是否存在
      const member = this.getMember(groupId, memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      // 更新成员状态
      const updatedMember = {
        ...member,
        leftAt: new Date().toISOString(),
      };
      this.members.get(groupId)!.set(memberId, updatedMember);

      // 更新群组成员数
      await this.groupManager.updateGroup(groupId, {
        memberCount: group.memberCount - 1,
      });

      this.logger.info(`Member left: ${memberId} from ${groupId}`);
    } catch (error) {
      this.logger.error('Error leaving group:', error);
      throw error;
    }
  }

  /**
   * 设置成员角色
   */
  async setMemberRole(
    groupId: string,
    memberId: string,
    newRole: MemberRole
  ): Promise<GroupMember> {
    try {
      // 检查成员是否存在
      const member = this.getMember(groupId, memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      // 更新角色
      const updatedMember = {
        ...member,
        role: newRole,
      };
      this.members.get(groupId)!.set(memberId, updatedMember);

      this.logger.info(`Member role updated: ${memberId} to ${newRole}`);

      return updatedMember;
    } catch (error) {
      this.logger.error('Error setting member role:', error);
      throw error;
    }
  }

  /**
   * 踢出成员
   */
  async kickMember(
    groupId: string,
    memberId: string,
    reason?: string
  ): Promise<void> {
    try {
      // 检查成员是否存在
      const member = this.getMember(groupId, memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      // 删除成员
      this.members.get(groupId)!.delete(memberId);

      // 更新群组成员数
      const group = await this.groupManager.getGroup(groupId);
      if (group) {
        await this.groupManager.updateGroup(groupId, {
          memberCount: group.memberCount - 1,
        });
      }

      this.logger.info(`Member kicked: ${memberId} from ${groupId}`);
    } catch (error) {
      this.logger.error('Error kicking member:', error);
      throw error;
    }
  }

  /**
   * 封禁成员
   */
  async banMember(
    groupId: string,
    memberId: string,
    reason?: string
  ): Promise<void> {
    try {
      // 设置成员角色为 BLOCKED
      await this.setMemberRole(groupId, memberId, MemberRole.BLOCKED);

      this.logger.info(`Member banned: ${memberId} from ${groupId}`);
    } catch (error) {
      this.logger.error('Error banning member:', error);
      throw error;
    }
  }

  /**
   * 解封成员
   */
  async unbanMember(groupId: string, memberId: string): Promise<void> {
    try {
      // 恢复成员角色为 MEMBER
      await this.setMemberRole(groupId, memberId, MemberRole.MEMBER);

      this.logger.info(`Member unbanned: ${memberId} from ${groupId}`);
    } catch (error) {
      this.logger.error('Error unbanning member:', error);
      throw error;
    }
  }

  /**
   * 更新成员状态
   */
  async updateMemberStatus(
    groupId: string,
    memberId: string,
    status: MemberStatus
  ): Promise<void> {
    try {
      const member = this.getMember(groupId, memberId);
      
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      const updatedMember = {
        ...member,
        status,
        lastSeen: new Date().toISOString(),
      };
      this.members.get(groupId)!.set(memberId, updatedMember);
    } catch (error) {
      this.logger.error('Error updating member status:', error);
      throw error;
    }
  }

  /**
   * 获取成员
   */
  async getMember(groupId: string, memberId: string): Promise<GroupMember | null> {
    const groupMembers = this.members.get(groupId);
    return groupMembers?.get(memberId) || null;
  }

  /**
   * 列出成员
   */
  async listMembers(groupId: string, params?: {
    role?: MemberRole;
    status?: MemberStatus;
    limit?: number;
    offset?: number;
    includeOffline?: boolean;
  }): Promise<{ members: GroupMember[]; total: number }> {
    const groupMembers = this.members.get(groupId);
    
    if (!groupMembers) {
      return { members: [], total: 0 };
    }

    let members = Array.from(groupMembers.values());

    // 过滤
    if (params?.role) {
      members = members.filter(member => member.role === params.role);
    }

    if (params?.status) {
      members = members.filter(member => member.status === params.status);
    }

    if (params?.includeOffline === false) {
      members = members.filter(member => member.status !== MemberStatus.OFFLINE);
    }

    // 过滤已离开的成员
    members = members.filter(member => !member.leftAt);

    const total = members.length;

    // 分页
    if (params?.limit && params?.offset) {
      const start = params.offset;
      const end = start + params.limit;
      members = members.slice(start, end);
    }

    return { members, total };
  }

  /**
   * 检查成员权限
   */
  async checkPermission(
    groupId: string,
    memberId: string,
    requiredRole: MemberRole
  ): Promise<boolean> {
    const member = await this.getMember(groupId, memberId);
    
    if (!member) {
      return false;
    }

    return this.checkMemberPermission(member.role, requiredRole);
  }

  /**
   * 检查成员权限 (内部方法)
   */
  private checkMemberPermission(
    memberRole: MemberRole,
    requiredRole: MemberRole
  ): boolean {
    const roles = Object.values(MemberRole);
    const memberIndex = roles.indexOf(memberRole);
    const requiredIndex = roles.indexOf(requiredRole);
    return memberIndex <= requiredIndex;
  }

  /**
   * 获取群组成员数
   */
  async getMemberCount(groupId: string): Promise<number> {
    const members = await this.listMembers(groupId);
    return members.total;
  }
}
