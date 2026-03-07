# Command Queue API 路由

/**
 * OpenClaw Command Queue API
 * 
 * REST API 接口定义：
 * - 任务创建/提交
 * - 任务状态查询
 * - 进度监控
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  CommandQueueService,
} from '../services/command-queue.service';

import {
  CommandTask,
  TaskStatus,
  Priority,
  TaskQueryParams,
} from '../types/command-queue';

// ========================================
// 路由处理器
// ========================================

/**
 * 创建任务处理器
 */
export const createTaskHandler = async (
  req: Request,
  res: Response<{ success: boolean; task: CommandTask }>,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: errors.array().join(', ') },
      });
    }

    const service = req.app.locals.commandQueueService;

    const task = await service.createTask({
      taskType: req.body.taskType,
      payload: req.body.payload,
      priority: req.body.priority as Priority,
      sessionId: req.body.sessionId,
      callerId: req.body.callerId || 'unknown',
    });

    res.status(201).json({
      success: true,
      task,
      message: 'Task created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 提交任务处理器
 */
export const submitTaskHandler = async (
  req: Request,
  res: Response<{ success: boolean; task: CommandTask }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    const task = await service.createTask({
      taskType: req.body.taskType,
      payload: req.body.payload,
      priority: req.body.priority as Priority,
      sessionId: req.body.sessionId,
      callerId: req.body.callerId || 'unknown',
    });

    await service.submitTask(task);

    res.status(201).json({
      success: true,
      task,
      message: 'Task submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取任务处理器
 */
export const getTaskHandler = async (
  req: Request,
  res: Response<{ success: boolean; task?: CommandTask }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    const task = await service.getTask(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消任务处理器
 */
export const cancelTaskHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    await service.cancelTask(req.params.taskId);

    res.json({
      success: true,
      message: 'Task cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 重试任务处理器
 */
export const retryTaskHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    await service.retryTask(req.params.taskId);

    res.json({
      success: true,
      message: 'Task retried successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量执行处理器
 */
export const executeBatchHandler = async (
  req: Request,
  res: Response<{ success: boolean; results: any[] }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    const results = await service.executeBatch(req.body.taskIds);

    res.json({
      success: true,
      results,
      message: 'Batch execution completed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取统计处理器
 */
export const getStatsHandler = async (
  req: Request,
  res: Response<{ success: boolean; stats: any }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.commandQueueService;

    const stats = await service.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 验证规则
// ========================================

export const createTaskValidationRules = [
  body('taskType').notEmpty().withMessage('Task type is required'),
  body('payload').notEmpty().withMessage('Task payload is required'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid priority'),
  body('callerId').notEmpty().withMessage('Caller ID is required'),
];

export const taskIdValidationRule = [
  param('taskId').notEmpty().withMessage('Task ID is required'),
];

// ========================================
// 路由配置
// ========================================

export function configureCommandQueueRoutes(router: Router) {
  // 创建任务
  router.post(
    '/command-queue/tasks',
    createTaskValidationRules,
    createTaskHandler
  );

  // 提交任务
  router.post(
    '/command-queue/tasks/submit',
    createTaskValidationRules,
    submitTaskHandler
  );

  // 获取任务
  router.get(
    '/command-queue/tasks/:taskId',
    taskIdValidationRule,
    getTaskHandler
  );

  // 取消任务
  router.post(
    '/command-queue/tasks/:taskId/cancel',
    taskIdValidationRule,
    cancelTaskHandler
  );

  // 重试任务
  router.post(
    '/command-queue/tasks/:taskId/retry',
    taskIdValidationRule,
    retryTaskHandler
  );

  // 批量执行
  router.post(
    '/command-queue/batch/execute',
    executeBatchHandler
  );

  // 获取统计
  router.get('/command-queue/stats', getStatsHandler);
}

// ========================================
// 导出服务初始化
// ========================================

export interface CommandQueueServices {
  commandQueueService: CommandQueueService;
}

export function initializeCommandQueueServices(services: CommandQueueServices) {
  if (!services.commandQueueService) {
    throw new Error('CommandQueueService is required');
  }
}
