# Avatar Service (分身服务)

/**
 * OpenClaw Avatar Service
 * 
 * 提供分身的完整功能：
 * - Agent 管理
 * - 分身隔离
 * - 通信协调
 * - UI 接口
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  AgentInfo,
  AvatarStatus,
  AvatarRole,
  AvatarSession,
  Message,
  MessagePayload,
} from '../types/avatar-draft';

import { AgentManager } from './agent-manager.service';
import { AvatarIsolation } from './avatar-isolation.service';
import { CommunicationManager } from './communication-manager.service';
import { Logger } from '../utils/logger';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    @Inject('AgentManager') private readonly agentManager: AgentManager,
    @Inject('AvatarIsolation') private readonly isolation: AvatarIsolation,
    @Inject('CommunicationManager') private readonly communication: CommunicationManager
  ) {}

  /**
   * 创建分身
   */
  async createAvatar(data: {
    name: string;
    avatar: string;
    role: AvatarRole;
    description?: string;
    config?: any;
  }): Promise<AgentInfo> {
    // 创建 Agent
    const agent = await this.agentManager.createAgent(data);

    // 设置隔离模式
    await this.isolation.setIsolationMode(
      agent.agentId,
      data.config?.isolation || 'protected'
    );

    // 注册通信
    await this.communication.subscribeEvent(
      agent.agentId,
      `avatar.${agent.agentId}`
    );

    this.logger.info(`Avatar created: ${agent.name}`);

    return agent;
  }

  /**
   * 更新分身
   */
  async updateAvatar(
    agentId: string,
    data: Partial<AgentInfo>
  ): Promise<void> {
    await this.agentManager.updateAgent(agentId, data);
  }

  /**
   * 删除分身
   */
  async deleteAvatar(agentId: string): Promise<void> {
    // 取消订阅
    await this.communication.unsubscribeEvent(
      agentId,
      `avatar.${agentId}`
    );

    // 释放资源
    await this.isolation.releaseResources(agentId);

    // 删除 Agent
    await this.agentManager.deleteAgent(agentId);

    this.logger.info(`Avatar deleted: ${agentId}`);
  }

  /**
   * 启动分身
   */
  async startAvatar(agentId: string): Promise<void> {
    const agent = await this.agentManager.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await this.agentManager.updateAgent(agentId, {
      status: AvatarStatus.ACTIVE,
    });

    this.logger.info(`Avatar started: ${agent.name}`);
  }

  /**
   * 停止分身
   */
  async stopAvatar(agentId: string): Promise<void> {
    const agent = await this.agentManager.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await this.agentManager.updateAgent(agentId, {
      status: AvatarStatus.IDLE,
    });

    this.logger.info(`Avatar stopped: ${agent.name}`);
  }

  /**
   * 发送消息给分身
   */
  async sendMessage(
    to: string,
    payload: MessagePayload
  ): Promise<Message> {
    const message: Message = {
      messageId: this.generateMessageId(),
      type: MessageType.COMMAND,
      from: 'system',
      to,
      timestamp: new Date().toISOString(),
      payload,
    };

    await this.communication.sendMessage(message);

    return message;
  }

  /**
   * 分发消息
   */
  async dispatchMessage(message: Message): Promise<Message | void> {
    // 处理消息
    return this.communication.handleIncomingMessage(message);
  }

  /**
   * 获取分身列表
   */
  async listAvatars(params?: {
    status?: AvatarStatus;
    role?: AvatarRole;
    limit?: number;
    offset?: number;
  }): Promise<{
    agents: AgentInfo[];
    total: number;
  }> {
    return this.agentManager.queryAgents({
      ...params,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  /**
   * 获取分身状态
   */
  async getAvatarState(agentId: string): Promise<any> {
    const agent = await this.agentManager.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const state = await this.agentManager.getAgentState(agentId);
    
    return {
      agent,
      state,
    };
  }

  /**
   * 创建会话
   */
  async createSession(
    agentId: string,
    userId: string,
    channel: string
  ): Promise<AvatarSession> {
    const session: AvatarSession = {
      sessionId: this.generateSessionId(),
      agentId,
      userId,
      channel,
      startedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      messages: [],
      status: 'active',
    };

    this.logger.info(`Session created: ${session.sessionId}`);

    return session;
  }

  /**
   * 结束会话
   */
  async endSession(sessionId: string): Promise<void> {
    // TODO: 实际结束会话逻辑
    this.logger.info(`Session ended: ${sessionId}`);
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
