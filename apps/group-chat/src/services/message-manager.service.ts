# Message Manager (消息管理)

/**
 * OpenClaw Message Manager
 * 
 * 提供消息管理的核心功能：
 * - 消息发送/接收
 * - 消息广播
 * - 消息编辑/删除
 * - 消息已读回执
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  MessageInfo,
  MessageType,
  MessageStatus,
  GroupType,
  MessageQueryParams,
  MessagePageResult,
} from '../types/group-chat';

import { GroupManager } from './group-manager.service';
import { Logger } from '../utils/logger';

@Injectable()
export class MessageManager {
  private readonly logger = new Logger(MessageManager.name);
  private messages: Map<string, Map<string, MessageInfo>> = new Map(); // groupId -> Map<messageId, MessageInfo>

  constructor(
    private readonly groupManager: GroupManager,
    private readonly memberManager: MemberManager
  ) {}

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
    try {
      // 检查群组
      const group = await this.groupManager.getGroup(data.groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${data.groupId}`);
      }

      // 检查成员权限
      const member = await this.memberManager.getMember(data.groupId, data.senderId);
      
      if (!member) {
        throw new Error(`Member not found: ${data.senderId}`);
      }

      // 检查成员是否被封禁
      if (member.role === 'blocked') {
        throw new Error(`Member is banned: ${data.senderId}`);
      }

      const now = new Date().toISOString();

      const message: MessageInfo = {
        messageId: this.generateMessageId(),
        groupId: data.groupId,
        senderId: data.senderId,
        senderName: member.nickname,
        messageType: data.messageType,
        content: data.content,
        contentPreview: this.generateMessagePreview(data.content),
        status: MessageStatus.SENT,
        createdAt: now,
        sentAt: now,
        attachments: data.attachments,
        replyToMessageId: data.replyToMessageId,
      };

      // 添加消息
      let groupMessages = this.messages.get(data.groupId);
      if (!groupMessages) {
        groupMessages = new Map();
        this.messages.set(data.groupId, groupMessages);
      }
      groupMessages.set(message.messageId, message);

      this.logger.info(`Message sent: ${message.messageId}`);

      return message;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
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
    try {
      const messages: MessageInfo[] = [];

      // 检查群组
      const group = await this.groupManager.getGroup(data.groupId);
      
      if (!group) {
        throw new Error(`Group not found: ${data.groupId}`);
      }

      // 获取成员列表 (如果需要过滤角色)
      let members = await this.memberManager.listMembers(data.groupId);
      
      if (data.targetRoles) {
        members.members = members.members.filter(member =>
          data.targetRoles?.includes(member.role)
        );
      }

      // 向每个成员发送消息
      for (const member of members.members) {
        const message = await this.sendMessage({
          groupId: data.groupId,
          senderId: data.senderId,
          messageType: data.messageType,
          content: data.content,
        });
        messages.push(message);
      }

      this.logger.info(`Broadcasted ${messages.length} messages`);

      return messages;
    } catch (error) {
      this.logger.error('Error broadcasting message:', error);
      throw error;
    }
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
    try {
      // 检查消息
      const message = this.getMessage(groupId, messageId);
      
      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // 检查编辑权限
      if (message.senderId !== editorId) {
        const isAllowed = await this.memberManager.checkPermission(
          groupId,
          editorId,
          'admin'
        );
        
        if (!isAllowed) {
          throw new Error(`Permission denied: ${editorId}`);
        }
      }

      const updatedMessage = {
        ...message,
        content: newContent,
        contentPreview: this.generateMessagePreview(newContent),
        editedAt: new Date().toISOString(),
      };
      this.messages.get(groupId)!.set(messageId, updatedMessage);

      this.logger.info(`Message edited: ${messageId}`);
    } catch (error) {
      this.logger.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(
    groupId: string,
    messageId: string,
    deleterId: string
  ): Promise<void> {
    try {
      // 检查消息
      const message = this.getMessage(groupId, messageId);
      
      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // 检查删除权限
      let isAllowed = message.senderId === deleterId;
      
      if (!isAllowed) {
        isAllowed = await this.memberManager.checkPermission(
          groupId,
          deleterId,
          'admin'
        );
      }

      if (!isAllowed) {
        throw new Error(`Permission denied: ${deleterId}`);
      }

      const updatedMessage = {
        ...message,
        status: MessageStatus.FAILED, // 标记为删除
        deletedAt: new Date().toISOString(),
      };
      this.messages.get(groupId)!.set(messageId, updatedMessage);

      this.logger.info(`Message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   */
  async markMessageAsRead(
    groupId: string,
    messageId: string,
    readerId: string
  ): Promise<void> {
    try {
      // 检查成员
      const member = await this.memberManager.getMember(groupId, readerId);
      
      if (!member) {
        throw new Error(`Member not found: ${readerId}`);
      }

      // 标记消息已读
      const message = this.getMessage(groupId, messageId);
      
      if (message) {
        const updatedMessage = {
          ...message,
          status: MessageStatus.READ,
        };
        this.messages.get(groupId)!.set(messageId, updatedMessage);
      }

      this.logger.info(`Message marked as read: ${messageId} by ${readerId}`);
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * 查询消息
   */
  async queryMessages(
    params: MessageQueryParams
  ): Promise<MessagePageResult> {
    try {
      const groupMessages = this.messages.get(params.groupId);
      
      if (!groupMessages) {
        return { messages: [], total: 0, hasMore: false };
      }

      let messages = Array.from(groupMessages.values());

      // 过滤
      if (params.messageId) {
        messages = messages.filter(message => 
          message.messageId === params.messageId
        );
      }

      if (params.senderId) {
        messages = messages.filter(message => 
          message.senderId === params.senderId
        );
      }

      if (params.startTime) {
        messages = messages.filter(message => 
          new Date(message.createdAt).getTime() >= new Date(params.startTime!).getTime()
        );
      }

      if (params.endTime) {
        messages = messages.filter(message => 
          new Date(message.createdAt).getTime() <= new Date(params.endTime!).getTime()
        );
      }

      if (!params.includeDeleted) {
        messages = messages.filter(message => message.status !== 'failed');
      }

      if (!params.includeSystem) {
        messages = messages.filter(message => message.messageType !== 'system');
      }

      // 排序 (按创建时间倒序)
      messages = sortBy(messages, m => -new Date(m.createdAt).getTime());

      // 分页
      const total = messages.length;
      const page = params.offset ? Math.floor(params.offset / (params.limit || 20)) : 0;
      const pageSize = params.limit || 20;
      const start = page * pageSize;
      const paginatedMessages = messages.slice(start, start + pageSize);

      return {
        messages: paginatedMessages,
        total,
        hasMore: start + pageSize < total,
      };
    } catch (error) {
      this.logger.error('Error querying messages:', error);
      throw error;
    }
  }

  /**
   * 获取消息
   */
  async getMessage(groupId: string, messageId: string): Promise<MessageInfo | null> {
    const groupMessages = this.messages.get(groupId);
    return groupMessages?.get(messageId) || null;
  }

  /**
   * 获取消息统计
   */
  async getStats(groupId: string): Promise<{
    totalMessages: number;
    members: number;
    activeMembers: number;
    messagesPerDay: number;
  }> {
    const group = await this.groupManager.getGroup(groupId);
    
    if (!group) {
      return {
        totalMessages: 0,
        members: 0,
        activeMembers: 0,
        messagesPerDay: 0,
      };
    }

    const members = await this.memberManager.listMembers(groupId);
    const messages = await this.queryMessages({
      groupId,
      limit: 1000,
    });

    return {
      totalMessages: messages.total,
      members: members.total,
      activeMembers: members.members.filter(m => m.status !== 'offline').length,
      messagesPerDay: messages.total / 7, // 假设 7 天
    };
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成消息预览
   */
  private generateMessagePreview(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}
