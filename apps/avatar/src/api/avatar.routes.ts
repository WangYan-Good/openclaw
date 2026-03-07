# Avatar API 服务 - TypeScript 实现

/**
 * OpenClaw Avatar API 服务
 * 
 * 提供头像功能的 REST API 接口，支持：
 * - 头像创建/更新/删除
 * - 头像查询/列表
 * - 头像切换/预览
 * - 用户头像偏好管理
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  AvatarEntity,
  AvatarQueryParams,
  AvatarSwitchRequest,
  AvatarApiResponse,
  AvatarStorageMetadata,
  UserAvatarPreference,
  AvatarType,
} from '../types/avatar';

import { AvatarService } from '../services/avatar.service';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';

// ========================================
// 路由处理器
// ========================================

/**
 * 创建头像处理器
 */
export const createAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
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

    const { agentId, userId } = req.body;

    const avatar = await req.app.locals.avatarService.createAvatar({
      ...req.body,
      agentId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: avatar,
      message: 'Avatar created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新头像处理器
 */
export const updateAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
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

    const avatarId = req.params.id;
    const avatar = await req.app.locals.avatarService.updateAvatar(
      avatarId,
      req.body
    );

    res.json({
      success: true,
      data: avatar,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除头像处理器
 */
export const deleteAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const avatarId = req.params.id;
    
    await req.app.locals.avatarService.deleteAvatar(avatarId);

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 查询头像处理器
 */
export const getAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const avatarId = req.params.id;
    
    const avatar = await req.app.locals.avatarService.getAvatar(avatarId);

    if (!avatar) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Avatar not found' },
      });
    }

    res.json({
      success: true,
      data: avatar,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 列出头像处理器
 */
export const listAvatarsHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const params: AvatarQueryParams = {
      agentId: req.query.agentId as string,
      userId: req.query.userId as string,
      type: req.query.type as AvatarType,
      status: req.query.status as any,
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
      sortBy: req.query.sortBy as any || 'createdAt',
    };

    const result = await req.app.locals.avatarService.listAvatars(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 头像切换处理器
 */
export const switchAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const request: AvatarSwitchRequest = req.body;
    
    const avatar = await req.app.locals.avatarService.switchAvatar(request);

    res.json({
      success: true,
      data: avatar,
      message: 'Avatar switched successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 头像预览处理器
 */
export const previewAvatarHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const avatarId = req.params.id;
    
    const preview = await req.app.locals.avatarService.getAvatarPreview(avatarId);

    if (!preview) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Avatar preview not found' },
      });
    }

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户头像偏好处理器
 */
export const getUserAvatarPreferenceHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const { userId, agentId } = req.params;
    
    const preference = await req.app.locals.userService.getUserAvatarPreference(
      userId,
      agentId
    );

    res.json({
      success: true,
      data: preference,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户头像偏好处理器
 */
export const updateUserAvatarPreferenceHandler = async (
  req: Request,
  res: Response<AvatarApiResponse>,
  next: NextFunction
) => {
  try {
    const { userId, agentId } = req.params;
    
    const preference = await req.app.locals.userService.updateUserAvatarPreference(
      userId,
      agentId,
      req.body
    );

    res.json({
      success: true,
      data: preference,
      message: 'User avatar preference updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 路由验证规则
// ========================================

export const createAvatarValidationRules = [
  body('type')
    .isIn(['image', 'emoji', 'icon'])
    .withMessage('Invalid avatar type'),
  body('data').notEmpty().withMessage('Avatar data is required'),
  body('name').notEmpty().withMessage('Avatar name is required'),
  body('agentId').notEmpty().withMessage('Agent ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
];

export const updateAvatarValidationRules = [
  body('type')
    .optional()
    .isIn(['image', 'emoji', 'icon'])
    .withMessage('Invalid avatar type'),
  body('data').optional(),
  body('name').optional(),
];

export const avatarIdValidationRule = [
  param('id').notEmpty().withMessage('Avatar ID is required'),
];

// ========================================
// 路由配置
// ========================================

export function configureAvatarRoutes(router: Router) {
  // 创建头像
  router.post(
    '/avatars',
    createAvatarValidationRules,
    createAvatarHandler
  );

  // 更新头像
  router.put(
    '/avatars/:id',
    avatarIdValidationRule,
    updateAvatarValidationRules,
    updateAvatarHandler
  );

  // 删除头像
  router.delete(
    '/avatars/:id',
    avatarIdValidationRule,
    deleteAvatarHandler
  );

  // 获取头像
  router.get(
    '/avatars/:id',
    avatarIdValidationRule,
    getAvatarHandler
  );

  // 列出路由
  router.get(
    '/avatars',
    listAvatarsHandler
  );

  // 头像切换
  router.post(
    '/avatars/switch',
    switchAvatarHandler
  );

  // 头像预览
  router.get(
    '/avatars/:id/preview',
    avatarIdValidationRule,
    previewAvatarHandler
  );

  // 获取用户头像偏好
  router.get(
    '/users/:userId/agents/:agentId/avatar-preference',
    getUserAvatarPreferenceHandler
  );

  // 更新用户头像偏好
  router.put(
    '/users/:userId/agents/:agentId/avatar-preference',
    updateUserAvatarPreferenceHandler
  );
}

// ========================================
// 导出服务初始化
// ========================================

export interface AvatarServices {
  avatarService: AvatarService;
  userService: UserService;
  storageService: StorageService;
}

export function initializeAvatarServices(services: AvatarServices) {
  // 这里可以添加服务验证逻辑
  if (!services.avatarService) {
    throw new Error('AvatarService is required');
  }
  if (!services.userService) {
    throw new Error('UserService is required');
  }
  if (!services.storageService) {
    throw new Error('StorageService is required');
  }
}
