# Communication Manager (通信管理)

/**
 * OpenClaw Communication Manager
 * 
 * 提供通信的核心功能：
 * - 消息发送/接收
 * - 事件订阅/监听
 * - 通信协议管理
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  Message,
  MessageType,
  CommunicationProtocol,
  AvatarDraftConfig,
} from '../types/avatar-draft';

import { Logger } from '../utils/logger';

@Injectable()
export class CommunicationManager {
  private readonly logger = new Logger(CommunicationManager.name);
  private messageHandlers: Map<string, any[]> = new Map(); // protocol -> handlers
  private eventSubscriptions: Map<string, Set<string>> = new Map(); // event -> agents
  private config: AvatarDraftConfig;

  constructor(config: Partial<AvatarDraftConfig> = {}) {
    this.config = {
      communication: {
        protocol: CommunicationProtocol.WS,
        endpoint: 'ws://localhost:8080',
        timeoutMs: 10000,
      },
      ...config,
    };
  }

  /**
   * 发送消息
   */
  async sendMessage(message: Message): Promise<boolean> {
    try {
      // 检查协议
      const protocol = this.config.communication.protocol;
      
      if (protocol === CommunicationProtocol.WS) {
        return await this.sendViaWebSocket(message);
      }
      
      if (protocol === CommunicationProtocol.HTTP) {
        return await this.sendViaHTTP(message);
      }

      if (protocol === CommunicationProtocol.IPC) {
        return await this.sendViaIPC(message);
      }

      if (protocol === CommunicationProtocol.NATS) {
        return await this.sendViaNATS(message);
      }

      throw new Error(`Unsupported protocol: ${protocol}`);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * 发送消息 (WebSocket)
   */
  private async sendViaWebSocket(message: Message): Promise<boolean> {
    try {
      // TODO: 实际 WebSocket 发送逻辑
      this.logger.debug(`WS Message sent: ${message.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending via WebSocket:', error);
      return false;
    }
  }

  /**
   * 发送消息 (HTTP)
   */
  private async sendViaHTTP(message: Message): Promise<boolean> {
    try {
      // TODO: 实际 HTTP 发送逻辑
      this.logger.debug(`HTTP Message sent: ${message.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending via HTTP:', error);
      return false;
    }
  }

  /**
   * 发送消息 (IPC)
   */
  private async sendViaIPC(message: Message): Promise<boolean> {
    try {
      // TODO: 实际 IPC 发送逻辑
      this.logger.debug(`IPC Message sent: ${message.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending via IPC:', error);
      return false;
    }
  }

  /**
   * 发送消息 (NATS)
   */
  private async sendViaNATS(message: Message): Promise<boolean> {
    try {
      // TODO: 实际 NATS 发送逻辑
      this.logger.debug(`NATS Message sent: ${message.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending via NATS:', error);
      return false;
    }
  }

  /**
   * 订阅事件
   */
  async subscribeEvent(
    agentId: string,
    event: string
  ): Promise<void> {
    try {
      let agents = this.eventSubscriptions.get(event);
      
      if (!agents) {
        agents = new Set();
        this.eventSubscriptions.set(event, agents);
      }
      
      agents.add(agentId);
      
      this.logger.info(`Agent subscribed to event: ${agentId} -> ${event}`);
    } catch (error) {
      this.logger.error('Error subscribing to event:', error);
      throw error;
    }
  }

  /**
   * 取消订阅事件
   */
  async unsubscribeEvent(
    agentId: string,
    event: string
  ): Promise<void> {
    try {
      const agents = this.eventSubscriptions.get(event);
      
      if (agents) {
        agents.delete(agentId);
      }
      
      this.logger.info(`Agent unsubscribed from event: ${agentId} -> ${event}`);
    } catch (error) {
      this.logger.error('Error unsubscribing from event:', error);
      throw error;
    }
  }

  /**
   * 注册消息处理器
   */
  async registerMessageHandler(
    protocol: CommunicationProtocol,
    handler: any
  ): Promise<void> {
    try {
      let handlers = this.messageHandlers.get(protocol);
      
      if (!handlers) {
        handlers = [];
        this.messageHandlers.set(protocol, handlers);
      }
      
      handlers.push(handler);
      
      this.logger.info(`Message handler registered: ${protocol}`);
    } catch (error) {
      this.logger.error('Error registering message handler:', error);
      throw error;
    }
  }

  /**
   * 处理收到的消息
   */
  async handleIncomingMessage(message: Message): Promise<Message | void> {
    try {
      this.logger.debug(`Handling message: ${message.messageId}`);

      // 检查是否是广播消息
      if (message.to === '*') {
        const-subscribers = this.eventSubscriptions.get(message.type);
        
        for (const subscriber of subScribers || []) {
          // TODO: 转发给订阅者
        }
      }

      // 执行消息处理器
      const handlers = this.messageHandlers.get(this.config.communication.protocol);
      
      for (const handler of handlers || []) {
        const result = await handler(message);
        if (result) {
          return result;
        }
      }
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
      throw error;
    }
  }

  /**
   * 发布事件
   */
  async publishEvent(event: string, data?: any): Promise<void> {
    try {
      const message: Message = {
        messageId: this.generateMessageId(),
        type: MessageType.EVENT,
        from: 'system',
        to: '*',
        timestamp: new Date().toISOString(),
        payload: {
          event,
          eventData: data,
        },
      };

      await this.handleIncomingMessage(message);

      this.logger.info(`Event published: ${event}`);
    } catch (error) {
      this.logger.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 获取通信配置
   */
  getConfig(): AvatarDraftConfig {
    return this.config;
  }

  /**
   * 更新通信配置
   */
  async updateConfig(config: Partial<AvatarDraftConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
