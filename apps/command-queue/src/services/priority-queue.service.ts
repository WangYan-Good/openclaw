# Priority Queue (优先级队列)

/**
 * OpenClaw Priority Queue
 * 
 * 提供优先级队列的核心功能：
 * - 多层级优先级队列 (high/medium/low)
 * - 排队管理
 * - 优先级调度
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  CommandTask,
  Priority,
  TaskStatus,
  QueueConfig,
  PriorityNode,
  queueComparator,
} from '../types/command-queue';

import { Logger } from '../utils/logger';

@Injectable()
export class PriorityQueue {
  private readonly logger = new Logger(PriorityQueue.name);
  private queues: Map<string, PriorityNode[]> = new Map();
  private tasks: Map<string, CommandTask> = new Map();
  private config: QueueConfig;
  private taskIdCounter: number = 0;

  constructor(config: QueueConfig) {
    this.config = config;
    
    // 初始化队列
    this.queues.set('high', []);
    this.queues.set('medium', []);
    this.queues.set('low', []);
  }

  /**
   * 提交任务
   */
  async submitTask(task: CommandTask): Promise<void> {
    try {
      // 设置任务状态
      task.status = TaskStatus.QUEUED;
      task.queuedAt = new Date().toISOString();
      
      // 确定队列
      const queueName = this.getQueueName(task.priority);
      
      // 添加到队列
      const priorityNode: PriorityNode = {
        taskId: task.taskId,
        priority: task.priority,
        createdAt: Date.now(),
        priorityValue: this.getPriorityValue(task.priority),
      };
      
      this.getQueue(queueName).push(priorityNode);
      this.tasks.set(task.taskId, task);
      
      // 排序队列
      this.sortQueue(queueName);
      
      this.logger.info(`Task queued: ${task.taskId} (priority: ${task.priority})`);
    } catch (error) {
      this.logger.error('Error submitting task:', error);
      throw error;
    }
  }

  /**
   * 获取下一个任务
   */
  async getNextTask(): Promise<CommandTask | null> {
    try {
      // 按优先级顺序检查队列
      const queueNames = ['high', 'medium', 'low'];
      
      for (const queueName of queueNames) {
        const queue = this.getQueue(queueName);
        
        if (queue.length > 0) {
          // 取出最高优先级任务
          const node = queue.shift()!;
          const task = this.tasks.get(node.taskId);
          
          if (task) {
            task.status = TaskStatus.EXECUTING;
            task.startedAt = new Date().toISOString();
            
            return task;
          }
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error getting next task:', error);
      return null;
    }
  }

  /**
   * 完成任务
   */
  async completeTask(
    taskId: string,
    success: boolean,
    result?: Record<string, any>
  ): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      task.status = success ? TaskStatus.SUCCESS : TaskStatus.FAILED;
      task.completedAt = new Date().toISOString();

      this.logger.info(`Task completed: ${taskId} (success: ${success})`);
    } catch (error) {
      this.logger.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // 从队列中移除
      for (const queue of this.queues.values()) {
        const index = queue.findIndex(node => node.taskId === taskId);
        if (index > -1) {
          queue.splice(index, 1);
          break;
        }
      }

      task.status = TaskStatus.CANCELLED;

      this.logger.info(`Task cancelled: ${taskId}`);
    } catch (error) {
      this.logger.error('Error cancelling task:', error);
      throw error;
    }
  }

  /**
   * 重试任务
   */
  async retryTask(taskId: string): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // 重置任务状态
      task.status = TaskStatus.QUEUED;
      task.queuedAt = new Date().toISOString();
      task.startedAt = undefined;
      task.completedAt = undefined;

      // 添加到队列
      const queueName = this.getQueueName(task.priority);
      const priorityNode: PriorityNode = {
        taskId: task.taskId,
        priority: task.priority,
        createdAt: Date.now(),
        priorityValue: this.getPriorityValue(task.priority),
      };
      
      this.getQueue(queueName).push(priorityNode);
      this.sortQueue(queueName);

      this.logger.info(`Task retried: ${taskId}`);
    } catch (error) {
      this.logger.error('Error retrying task:', error);
      throw error;
    }
  }

  /**
   * 获取队列统计
   */
  async getQueueStats(): Promise<Map<string, number>> {
    const stats = new Map<string, number>();
    
    for (const [queueName, queue] of this.queues.entries()) {
      stats.set(queueName, queue.length);
    }
    
    return stats;
  }

  /**
   * 获取队列配置
   */
  getConfig(): QueueConfig {
    return this.config;
  }

  /**
   * 修改队列配置
   */
  async setConfig(config: Partial<QueueConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取任务
   */
  async getTask(taskId: string): Promise<CommandTask | null> {
    return this.tasks.get(taskId) || null;
  }

  /**
   * 列出任务
   */
  async listTasks(params?: {
    status?: TaskStatus;
    priority?: Priority;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: CommandTask[]; total: number }> {
    let items = Array.from(this.tasks.values());

    // 过滤
    if (params) {
      if (params.status) {
        items = items.filter(t => t.status === params.status);
      }
      if (params.priority) {
        items = items.filter(t => t.priority === params.priority);
      }
    }

    const total = items.length;

    // 分页
    if (params?.page && params?.pageSize) {
      const startIndex = (params.page - 1) * params.pageSize;
      items = items.slice(startIndex, startIndex + params.pageSize);
    }

    return { items, total };
  }

  /**
   * 获取队列
   */
  private getQueue(queueName: string): PriorityNode[] {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * 对队列排序
   */
  private sortQueue(queueName: string): void {
    const queue = this.getQueue(queueName);
    queue.sort((a, b) => {
      // 优先级值降序
      if (a.priorityValue !== b.priorityValue) {
        return b.priorityValue - a.priorityValue;
      }
      // 时间戳升序
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * 获取队列名称
   */
  private getQueueName(priority: Priority): string {
    return `${priority}_priority`;
  }

  /**
   * 获取优先级值
   */
  private getPriorityValue(priority: Priority): number {
    const values = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return values[priority] || 1;
  }
}
