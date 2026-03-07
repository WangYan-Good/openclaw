# Command Queue Service (命令队列服务)

/**
 * OpenClaw Command Queue Service
 * 
 * 提供命令队列的完整功能：
 * - 队列管理
 * - 任务执行
 * - 进度监控
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';

import {
  CommandTask,
  TaskStatus,
  Priority,
  QueueConfig,
  BatchConfig,
  TaskQueryParams,
  TaskResult,
  QueueStats,
} from '../types/command-queue';

import { PriorityQueue } from './priority-queue.service';
import { TaskScheduler } from './task-scheduler.service';
import { Logger } from '../utils/logger';

@Injectable()
export class CommandQueueService {
  private readonly logger = new Logger(CommandQueueService.name);
  private queueConfig: QueueConfig;
  private batchConfig: BatchConfig;

  constructor(
    @Inject('PriorityQueue') private readonly priorityQueue: PriorityQueue,
    @Inject('TaskScheduler') private readonly scheduler: TaskScheduler
  ) {
    this.queueConfig = this.priorityQueue.getConfig();
  }

  /**
   * 创建任务
   */
  async createTask(data: {
    taskType: string;
    payload: Record<string, any>;
    priority?: Priority;
    sessionId?: string;
    callerId: string;
  }): Promise<CommandTask> {
    try {
      const task: CommandTask = {
        taskId: this.generateTaskId(),
        taskType: data.taskType,
        payload: data.payload,
        priority: data.priority || Priority.MEDIUM,
        status: TaskStatus.PENDING,
        createdAt: new Date().toISOString(),
        executionMode: 'sequential',
        maxRetries: 3,
        progress: {
          currentStep: 0,
          totalSteps: 1,
          percentage: 0,
        },
        metadata: {
          callerId: data.callerId,
          sessionId: data.sessionId,
        },
      };

      return task;
    } catch (error) {
      this.logger.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * 提交任务
   */
  async submitTask(task: CommandTask): Promise<void> {
    try {
      // 更新状态
      task.status = TaskStatus.QUEUED;
      task.queuedAt = new Date().toISOString();

      // 提交到优先级队列
      await this.priorityQueue.submitTask(task);

      // 提交到调度器
      await this.scheduler.submitTask(task);

      this.logger.info(`Task submitted: ${task.taskId}`);
    } catch (error) {
      this.logger.error('Error submitting task:', error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      await this.priorityQueue.cancelTask(taskId);
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
      await this.priorityQueue.retryTask(taskId);
      this.logger.info(`Task retried: ${taskId}`);
    } catch (error) {
      this.logger.error('Error retrying task:', error);
      throw error;
    }
  }

  /**
   * 批量执行
   */
  async executeBatch(taskIds: string[]): Promise<TaskResult[]> {
    try {
      return await this.scheduler.executeBatch(taskIds);
    } catch (error) {
      this.logger.error('Error executing batch:', error);
      throw error;
    }
  }

  /**
   * 获取任务
   */
  async getTask(taskId: string): Promise<CommandTask | null> {
    return this.priorityQueue.getTask(taskId);
  }

  /**
   * 列出任务
   */
  async listTasks(params?: TaskQueryParams): Promise<{
    items: CommandTask[];
    total: number;
  }> {
    return this.priorityQueue.listTasks(params);
  }

  /**
   * 获取统计
   */
  async getStats(): Promise<{ queue: QueueStats; scheduler: any }> {
    const queueStats = await this.priorityQueue.getQueueStats();
    const schedulerStatus = await this.scheduler.getStatus();

    const queueInfo: QueueStats = {
      queueName: 'command_queue',
      size: schedulerStatus.queueSize,
      executing: schedulerStatus.executing,
    };

    return {
      queue: queueInfo,
      scheduler: schedulerStatus,
    };
  }

  /**
   * 获取配置
   */
  getConfig(): QueueConfig & { batchConfig: BatchConfig } {
    return {
      ...this.queueConfig,
      batchConfig: this.scheduler.getConfig().batchConfig,
    };
  }

  /**
   * 修改配置
   */
  async setConfig(
    queueConfig: Partial<QueueConfig>,
    batchConfig?: Partial<BatchConfig>
  ): Promise<void> {
    if (queueConfig) {
      this.queueConfig = { ...this.queueConfig, ...queueConfig };
      await this.priorityQueue.setConfig(queueConfig);
      this.logger.info('Queue config updated');
    }

    if (batchConfig) {
      // TODO: 更新调度器配置
      this.logger.info('Batch config updated');
    }
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 计算平均等待时间
   */
  async getAverageWaitingTime(): Promise<number> {
    const { items } = await this.listTasks();
    const completed = items.filter(t => t.startedAt && t.completedAt);
    
    if (completed.length === 0) return 0;

    const totalWait = completed.reduce((sum, t) => {
      const wait = new Date(t.startedAt!).getTime() - new Date(t.queuedAt!).getTime();
      return sum + wait;
    }, 0);

    return totalWait / completed.length;
  }

  /**
   * 计算成功率
   */
  async getSuccessRate(): Promise<number> {
    const { items } = await this.listTasks();
    const completed = items.filter(t => 
      t.status === TaskStatus.SUCCESS || 
      t.status === TaskStatus.FAILED
    );
    
    if (completed.length === 0) return 0;

    const successCount = completed.filter(t => t.status === TaskStatus.SUCCESS).length;
    return successCount / completed.length;
  }
}
