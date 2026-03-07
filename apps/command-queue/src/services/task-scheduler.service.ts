# Task Scheduler (任务调度器)

/**
 * OpenClaw Task Scheduler
 * 
 * 提供任务调度的核心功能：
 * - 并发控制
 * - 批量执行
 * - 执行监控
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, sortBy } from 'lodash';
import * as asyncQueue from 'async/queue';

import {
  CommandTask,
  TaskStatus,
  BatchConfig,
  TaskResult,
  QueueConfig,
} from '../types/command-queue';

import { PriorityQueue } from './priority-queue.service';
import { Logger } from '../utils/logger';

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);
  privateQueue: any;
  private config: QueueConfig;
  private batchConfig: BatchConfig;
  private executingTasks: Set<string> = new Set();
  private completedTasks: Map<string, TaskResult> = new Map();

  constructor(
    private readonly priorityQueue: PriorityQueue,
    config: Partial<QueueConfig> = {},
    batchConfig: Partial<BatchConfig> = {}
  ) {
    this.config = {
      maxConcurrent: 2,
      defaultPriority: 'medium',
      executionMode: 'sequential',
      progressDisplay: {
        enabled: true,
        showSteps: true,
        showPercentage: true,
        showRemainingTime: true,
      },
      ...config,
    };

    this.batchConfig = {
      enabled: false,
      maxSize: 10,
      timeoutMs: 100,
      concurrentBatches: 2,
      ...batchConfig,
    };

    // 创建任务队列
    this.queue = async.queue(this.processTask.bind(this), this.config.maxConcurrent);
  }

  /**
   * 处理任务
   */
  private async processTask(
    task: CommandTask,
    callback: (error?: Error, result?: any) => void
  ): Promise<void> {
    try {
      this.executingTasks.add(task.taskId);

      // 执行任务
      const result = await this.executeTask(task);

      this.executingTasks.delete(task.taskId);
      this.completedTasks.set(task.taskId, result);

      callback(undefined, result);
    } catch (error) {
      this.executingTasks.delete(task.taskId);
      callback(error as Error);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: CommandTask): Promise<TaskResult> {
    try {
      this.logger.info(`Executing task: ${task.taskId}`);

      // 模拟任务执行 (实际应由任务处理器执行)
      const result: TaskResult = {
        success: true,
        taskId: task.taskId,
        result: { executed: true },
        executionTimeMs: 100,
        steps: [
          {
            step: 1,
            description: 'Task started',
            completedAt: new Date().toISOString(),
          },
          {
            step: 2,
            description: 'Task completed',
            completedAt: new Date().toISOString(),
          },
        ],
      };

      this.logger.info(`Task completed: ${task.taskId}`);

      return result;
    } catch (error) {
      this.logger.error('Error executing task:', error);
      
      return {
        success: false,
        taskId: task.taskId,
        error: {
          code: 'EXECUTION_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * 提交任务
   */
  async submitTask(task: CommandTask): Promise<void> {
    try {
      // 设置默认值
      if (!task.priority) {
        task.priority = this.config.defaultPriority;
      }
      if (!task.maxRetries) {
        task.maxRetries = 3;
      }

      // 添加到优先级队列
      await this.priorityQueue.submitTask(task);

      // 添加到调度队列
      this.queue.push(task, (error, result) => {
        if (error) {
          this.logger.error(`Task failed: ${task.taskId}`, error);
        } else {
          this.logger.info(`Task succeeded: ${task.taskId}`);
        }
      });
    } catch (error) {
      this.logger.error('Error submitting task:', error);
      throw error;
    }
  }

  /**
   * 批量执行
   */
  async executeBatch(taskIds: string[]): Promise<TaskResult[]> {
    try {
      this.logger.info(`Executing batch: ${taskIds.length} tasks`);

      const results: TaskResult[] = [];

      // 并发执行批次
      const concurrentQueue = async.queue(
        async (taskId: string) => {
          const task = await this.priorityQueue.getTask(taskId);
          if (task) {
            const result = await this.executeTask(task);
            results.push(result);
          }
        },
        this.batchConfig.concurrentBatches
      );

      // 添加任务到批次队列
      for (const taskId of taskIds) {
        concurrentQueue.push(taskId);
      }

      // 等待批次完成
      await new Promise((resolve, reject) => {
        concurrentQueue.drain = resolve;
        concurrentQueue.error = reject;
      });

      this.logger.info(`Batch execution completed: ${results.length} tasks`);

      return results;
    } catch (error) {
      this.logger.error('Error executing batch:', error);
      throw error;
    }
  }

  /**
   * 获取执行状态
   */
  async getStatus(): Promise<{
    executing: number;
    completed: number;
    queueSize: number;
  }> {
    const queueStats = await this.priorityQueue.getQueueStats();
    const totalQueued = Array.from(queueStats.values()).reduce((sum, n) => sum + n, 0);

    return {
      executing: this.executingTasks.size,
      completed: this.completedTasks.size,
      queueSize: totalQueued,
    };
  }

  /**
   * 获取配置
   */
  getConfig(): QueueConfig & { batchConfig: BatchConfig } {
    return {
      ...this.config,
      batchConfig: this.batchConfig,
    };
  }
}
