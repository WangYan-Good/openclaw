# Agent Manager (Agent 管理)

/**
 * OpenClaw Agent Manager
 * 
 * 提供 Agent 的核心管理功能：
 * - Agent 创建/删除
 * - Agent 配置管理
 * - Agent 状态监控
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  AgentInfo,
  AgentConfig,
  DEFAULT_AGENT_CONFIG,
  AvatarStatus,
  AvatarRole,
  AgentQueryParams,
  AgentPageResult,
} from '../types/avatar-draft';

import { Logger } from '../utils/logger';

@Injectable()
export class AgentManager {
  private readonly logger = new Logger(AgentManager.name);
  private agents: Map<string, AgentInfo> = new Map();
  private agentStates: Map<string, any> = new Map();

  /**
   * 创建 Agent
   */
  async createAgent(data: {
    name: string;
    avatar: string;
    role: AvatarRole;
    description?: string;
    config?: Partial<AgentConfig>;
  }): Promise<AgentInfo> {
    try {
      const agentId = this.generateAgentId();
      const now = new Date().toISOString();

      const agent: AgentInfo = {
        agentId,
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        status: AvatarStatus.ACTIVE,
        role: data.role,
        createdAt: now,
        config: {
          ...DEFAULT_AGENT_CONFIG,
          ...data.config,
        },
        tags: this.getDefaultTags(data.role),
      };

      this.agents.set(agentId, agent);
      this.agentStates.set(agentId, this.createInitialState(agentId));
      
      this.logger.info(`Agent created: ${agentId}`);

      return agent;
    } catch (error) {
      this.logger.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * 更新 Agent
   */
  async updateAgent(agentId: string, data: Partial<AgentInfo>): Promise<void> {
    try {
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const updatedAgent = {
        ...agent,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      this.agents.set(agentId, updatedAgent);
      this.logger.info(`Agent updated: ${agentId}`);
    } catch (error) {
      this.logger.error('Error updating agent:', error);
      throw error;
    }
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        throw new Error(`Agent not found: ${agentId`);
      }

      // 软删除
      await this.updateAgent(agentId, {
        status: AvatarStatus.DELETED,
      });

      // 清理状态
      this.agentStates.delete(agentId);

      this.logger.info(`Agent deleted: ${agentId}`);
    } catch (error) {
      this.logger.error('Error deleting agent:', error);
      throw error;
    }
  }

  /**
   * 获取 Agent
   */
  async getAgent(agentId: string): Promise<AgentInfo | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * 获取 Agent 状态
   */
  async getAgentState(agentId: string): Promise<any> {
    return this.agentStates.get(agentId) || this.createInitialState(agentId);
  }

  /**
   * 更新 Agent 状态
   */
  async updateAgentState(agentId: string, state: any): Promise<void> {
    this.agentStates.set(agentId, state);
  }

  /**
   * 查询 Agent
   */
  async queryAgents(
    params: AgentQueryParams
  ): Promise<AgentPageResult> {
    try {
      let agents = Array.from(this.agents.values());

      // 过滤
      if (params.status) {
        agents = agents.filter(agent => agent.status === params.status);
      }

      if (params.role) {
        agents = agents.filter(agent => agent.role === params.role);
      }

      if (params.tag) {
        agents = agents.filter(agent => agent.tags.includes(params.tag));
      }

      if (params.name) {
        const searchLower = params.name.toLowerCase();
        agents = agents.filter(agent =>
          agent.name.toLowerCase().includes(searchLower)
        );
      }

      if (params.isolation) {
        agents = agents.filter(agent =>
          agent.config.isolation === params.isolation
        );
      }

      // 分页
      const total = agents.length;
      const page = params.offset ? Math.floor(params.offset / (params.limit || 20)) : 0;
      const pageSize = params.limit || 20;
      const start = page * pageSize;
      const paginatedAgents = agents.slice(start, start + pageSize);

      return {
        agents: paginatedAgents,
        total,
        hasMore: start + pageSize < total,
      };
    } catch (error) {
      this.logger.error('Error querying agents:', error);
      throw error;
    }
  }

  /**
   * 获取 Agent 统计
   */
  async getStats(): Promise<{
    totalAgents: number;
    byRole: Map<AvatarRole, number>;
    byStatus: Map<AvatarStatus, number>;
    avgCPU: number;
    avgMemory: number;
  }> {
    const agents = Array.from(this.agents.values());

    const totalAgents = agents.length;
    const byRole = new Map<AvatarRole, number>();
    const byStatus = new Map<AvatarStatus, number>();
    let totalCPU = 0;
    let totalMemory = 0;

    agents.forEach(agent => {
      // 按角色统计
      const roleCount = byRole.get(agent.role) || 0;
      byRole.set(agent.role, roleCount + 1);

      // 按状态统计
      const statusCount = byStatus.get(agent.status) || 0;
      byStatus.set(agent.status, statusCount + 1);

      // 获取状态统计
      const state = this.agentStates.get(agent.agentId);
      if (state) {
        totalCPU += state.CPUUsage || 0;
        totalMemory += state.memoryUsage || 0;
      }
    });

    return {
      totalAgents,
      byRole,
      byStatus,
      avgCPU: totalAgents > 0 ? totalCPU / totalAgents : 0,
      avgMemory: totalAgents > 0 ? totalMemory / totalAgents : 0,
    };
  }

  /**
   * 生成 Agent ID
   */
  private generateAgentId(prefix: string = 'avatar'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 创建初始状态
   */
  private createInitialState(agentId: string): any {
    return {
      agentId,
      status: AvatarStatus.IDLE,
      activeSessions: 0,
      CPUUsage: 0,
      memoryUsage: 64, // MB
      uptimeMs: 0,
      lastHeartbeat: new Date().toISOString(),
    };
  }

  /**
   * 获取默认标签
   */
  private getDefaultTags(role: AvatarRole): string[] {
    const tagMap: Record<AvatarRole, string[]> = {
      assistant: ['general-purpose', 'conversational', 'friendly'],
      devops: ['devops', 'infrastructure', 'automation'],
      dev: ['development', 'coding', 'debugging'],
      qa: ['testing', 'quality', 'verification'],
      security: ['security', 'audit', 'protection'],
      customer_support: ['support', 'customer-service', 'helpdesk'],
      sales: ['sales', 'marketing', 'persuasion'],
      thoughter: ['thinking', 'analysis', 'reasoning'],
      creator: ['creative', 'writing', 'art'],
    };

    return tagMap[role] || ['general-purpose'];
  }
}
