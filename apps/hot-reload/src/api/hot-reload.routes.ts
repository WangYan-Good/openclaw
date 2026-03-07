# Hot Reload API 路由

/**
 * OpenClaw Hot Reload API
 * 
 * REST API 接口定义：
 * - 版本检查
 * - 更新处理
 * - 回滚操作
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  HotReloadService,
} from '../services/hot-reload.service';

import {
  UpdateRequest,
  UpdateResponse,
  TriggerType,
} from '../types/hot-reload';

// ========================================
// 路由处理器
// ========================================

/**
 * 检查更新处理器
 */
export const checkForUpdatesHandler = async (
  req: Request,
  res: Response<UpdateResponse>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.hotReloadService;
    
    const result = await service.checkForUpdates();

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 处理更新处理器
 */
export const processUpdateHandler = async (
  req: Request,
  res: Response<UpdateResponse>,
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

    const service = req.app.locals.hotReloadService;
    
    const request: UpdateRequest = {
      currentVersion: req.body.currentVersion,
      targetVersion: req.body.targetVersion,
      triggerType: req.body.triggerType as TriggerType,
      userConfirm: req.body.userConfirm || true,
    };

    const result = await service.processUpdate(request);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 回滚处理器
 */
export const rollbackHandler = async (
  req: Request,
  res: Response<UpdateResponse>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.hotReloadService;
    
    const version = req.params.version;
    
    const result = await service.rollback(version);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取版本列表处理器
 */
export const listVersionsHandler = async (
  req: Request,
  res: Response<{ success: boolean; versions: any[] }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.hotReloadService;
    
    const versions = await service.listVersions();

    res.json({
      success: true,
      versions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 健康检查处理器
 */
export const healthCheckHandler = async (
  req: Request,
  res: Response<{ health: boolean; version: string }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.hotReloadService;
    const version = await req.app.locals.versionManager.getCurrentVersion();

    const health = await service.checkHealth(version || '1.0.0');

    res.json({
      health,
      version,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 验证规则
// ========================================

export const processUpdateValidationRules = [
  body('currentVersion').notEmpty().withMessage('Current version is required'),
  body('triggerType')
    .optional()
    .isIn(['auto', 'manual', 'scheduled', 'idle'])
    .withMessage('Invalid trigger type'),
  body('userConfirm')
    .optional()
    .isBoolean()
    .withMessage('User confirm must be boolean'),
];

export const rollbackValidationRule = [
  param('version').notEmpty().withMessage('Version is required'),
];

// ========================================
// 路由配置
// ========================================

export function configureHotReloadRoutes(router: Router) {
  // 检查更新
  router.get('/hot-reload/check-updates', checkForUpdatesHandler);

  // 处理更新
  router.post(
    '/hot-reload/update',
    processUpdateValidationRules,
    processUpdateHandler
  );

  // 回滚
  router.post(
    '/hot-reload/rollback/:version',
    rollbackValidationRule,
    rollbackHandler
  );

  // 获取版本列表
  router.get('/hot-reload/versions', listVersionsHandler);

  // 健康检查
  router.get('/hot-reload/health', healthCheckHandler);
}

// ========================================
// 导出服务初始化
// ========================================

export interface HotReloadServices {
  hotReloadService: HotReloadService;
  versionManager: any;
}

export function initializeHotReloadServices(services: HotReloadServices) {
  if (!services.hotReloadService) {
    throw new Error('HotReloadService is required');
  }
  if (!services.versionManager) {
    throw new Error('VersionManager is required');
  }
}
