# Group Chat Service (群聊服务)

/**
 * OpenClaw Group Chat Service
 * 
 * 提供群聊的完整功能：
 * - 群组管理
 * - 成员管理
 * - 消息管理
 * - 事件广播
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  GroupInfo,
  GroupType,
  GroupStatus,
  GroupMember,
  MemberRole,
  MessageInfo,
  MessageType,
  GroupEvent,
  EventType,
  GroupQueryParams,
  MemberQueryParams,
  MessageQueryParams,
  GroupPageResult,
  MessagePageResult,
} from '../types/group-chat';

import { GroupManager } from './group-manager.service';
import { MemberManager } from './member-manager.service';
import { MessageManager } from './message-manager.service';
import { Logger } from '../utils/logger';

@Injectable()
export class GroupChatService {
  private readonly logger = new Logger(GroupChatService.name);

  constructor(
    @Inject('GroupManager') private readonly groupManager: GroupManager,
    @Inject('MemberManager') private readonly memberManager: MemberManager,
    @Inject('MessageManager') private readonly messageManager: MessageManager
  ) {}

  /**
   * 创建群组
   */
  async createGroup(data: {
    name: string;
    type: GroupType;
    creatorId: string;
    description?: string;
    avatar?: string;
    settings?: any;
  }): Promise<GroupInfo> {
    return this.groupManager.createGroup(data);
  }

  /**
   * 更新群组
   */
  async updateGroup(groupId: string, data: Partial<GroupInfo>): Promise<void> {
    await this.groupManager.updateGroup(groupId, data);
  }

  /**
   * 删除群组
   */
  async deleteGroup(groupId: string): Promise<void> {
    await this.groupManager.deleteGroup(groupId);
  }

  /**
   * 获取群组
   */
  async getGroup(groupId: string): Promise<GroupInfo | null> {
    return this.groupManager.getGroup(groupId);
  }

  /**
   * 查询群组
   */
  async queryGroups(params: GroupQueryParams): Promise<GroupPageResult> {
    return this.groupManager.queryGroup(params);
  }

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
    return this.memberManager.addMember(data);
  }

  /**
   * 离开群组
   */
  async leaveGroup(groupId: string, memberId: string): Promise<void> {
    await this.memberManager.leaveGroup(groupId, memberId);
  }

  /**
   * 设置成员角色
   */
  async setMemberRole(
    groupId: string,
    memberId: string,
    role: MemberRole
  ): Promise<GroupMember> {
    return this.memberManager.setMemberRole(groupId, memberId, role);
  }

  /**
   * 踢出成员
   */
  async kickMember(
    groupId: string,
    memberId: string,
    reason?: string
  ): Promise<void> {
    await this.memberManager.kickMember(groupId, memberId, reason);
  }

  /**
   * 封禁成员
   */
  async banMember(
    groupId: string,
    memberId: string,
    reason?: string
  ): Promise<void> {
    await this.memberManager.banMember(groupId, memberId, reason);
  }

  /**
   * 解封成员
   */
  async unbanMember(groupId: string, memberId: string): Promise<void> {
    await this.memberManager.unbanMember(groupId, memberId);
  }

  /**
   * 发送消息
   */
  async sendMessage(data: {
    groupId: string;
    senderId: string;
    messageType: MessageType;
    content: string;
    attachments?: any[];
    replyToMessageId?: string;
  }): Promise<MessageInfo> {
    return this.messageManager.sendMessage(data);
  }

  /**
   * 广播消息
   */
  async broadcastMessage(data: {
    groupId: string;
    senderId: string;
    messageType: MessageType;
    content: string;
    targetRoles?: string[];
  }): Promise<MessageInfo[]> {
    return this.messageManager.broadcastMessage(data);
  }

  /**
   * 编辑消息
   */
  async editMessage(
    groupId: string,
    messageId: string,
    newContent: string,
    editorId: string
  ): Promise<void> {
    await this.messageManager.editMessage(groupId, messageId, newContent, editorId);
  }

  /**
   * 删除消息
   */
  async deleteMessage(
    groupId: string,
    messageId: string,
    deleterId: string
  ): Promise<void> {
    await this.messageManager.deleteMessage(groupId, messageId, deleterId);
  }

  /**
   * 查询消息
   */
  async queryMessages(params: MessageQueryParams): Promise<MessagePageResult> {
    return this.messageManager.queryMessages(params);
  }

  /**
   * 获取群组统计
   */
  async getGroupStats(groupId: string): Promise<{
    group: any;
    members: number;
    messages: number;
    activeMembers: number;
  }> {
    const group = await this.groupManager.getGroup(groupId);
    
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    const members = await this.memberManager.listMembers(groupId);
    const messages = await this.messageManager.queryMessages({ groupId, limit: 1000 });
    const activeMembers = members.members.filter(m => m.status !== 'offline').length;

    return {
      group: {
        name: group.name,
        type: group.type,
        memberCount: group.memberCount,
      },
      members: members.total,
      messages: messages.total,
      activeMembers,
    };
  }

  /**
   * 获取群组设置
   */
  async getGroupSettings(groupId: string): Promise<any> {
    const group = await this.groupManager.getGroup(groupId);
    
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    return group.settings;
  }

  /**
   * 更新群组设置
   */
  async updateGroupSettings(
    groupId: string,
    settings: Partial<any>
  ): Promise<void> {
    const group = await this.groupManager.getGroup(groupId);
    
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    await this.groupManager.updateGroup(groupId, {
      settings: {
        ...group.settings,
        ...settings,
      },
    });
  }
}
