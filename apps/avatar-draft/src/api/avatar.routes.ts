# OpenClaw Avatar Draft API 路由

/**
 * OpenClaw Avatar Draft API
 * 
 * REST API 接口定义：
 * - Agent 管理
 * - 分身操作
 * - 消息通信
 * - 会话管理
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  AvatarService,
} from '../services/avatar.service';

import {
  AgentInfo,
  AvatarRole,
  Message,
  MessagePayload,
  AvatarSession,
} from '../types/avatar-draft';

// ========================================
// 路由处理器
// ========================================

/**
 * 创建分身处理器
 */
export const createAvatarHandler = async (
  req: Request,
  res: Response<{ success: boolean; agent: AgentInfo }>,
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

    const service = req.app.locals.avatarService;

    const agent = await service.createAvatar({
      name: req.body.name,
      avatar: req.body.avatar,
      role: req.body.role as AvatarRole,
      description: req.body.description,
      config: req.body.config,
    });

    res.status(201).json({
      success: true,
      agent,
      message: 'Avatar created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新分身处理器
 */
export const updateAvatarHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.avatarService;

    await service.updateAvatar(req.params.agentId, req.body);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除分身处理器
 */
export const deleteAvatarHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.avatarService;

    await service.deleteAvatar(req.params.agentId);

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发送消息处理器
 */
export const sendMessageHandler = async (
  req: Request,
  res: Response<{ success: boolean; message: Message }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.avatarService;

    const message: Message = await service.sendMessage(
      req.params.agentId,
      req.body.payload
    );

    res.status(201).json({
      success: true,
      message,
      message: 'Message sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分身状态处理器
 */
export const getAvatarStateHandler = async (
  req: Request,
  res: Response<{ success: boolean; state: any }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.avatarService;

    const state = await service.getAvatarState(req.params.agentId);

    res.json({
      success: true,
      state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建会话处理器
 */
export const createSessionHandler = async (
  req: Request,
  res: Response<{ success: boolean; session: AvatarSession }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.avatarService;

    const session = await service.createSession(
      req.params.agentId,
      req.body.userId,
      req.body.channel
    );

    res.status(201).json({
      success: true,
      session,
      message: 'Session created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 验证规则
// ========================================

export const createAvatarValidationRules = [
  body('name').notEmpty().withMessage('Avatar name is required'),
  body('avatar').notEmpty().withMessage('Avatar URL is required'),
  body('role').notEmpty().withMessage('Avatar role is required'),
  body('role').isIn(['assistant', 'devops', 'dev', 'qa', 'security', 'customer_support', 'sales', 'thoughter', 'creator'])
    .withMessage('Invalid avatar role'),
];

export const agentIdValidationRule = [
  param('agentId').notEmpty().withMessage('Agent ID is required'),
];

// ========================================
// 路由配置
// ========================================

export function configureAvatarRoutes(router: Router) {
  // Agent 管理
  router.post(
    '/avatar-draft/avatars',
    createAvatarValidationRules,
    createAvatarHandler
  );

  router.patch(
    '/avatar-draft/avatars/:agentId',
    agentIdValidationRule,
    updateAvatarHandler
  );

  router.delete(
    '/avatar-draft/avatars/:agentId',
    agentIdValidationRule,
    deleteAvatarHandler
  );

  // 消息通信
  router.post(
    '/avatar-draft/avatars/:agentId/messages',
    agentIdValidationRule,
    sendMessageHandler
  );

  // 状态查询
  router.get(
    '/avatar-draft/avatars/:agentId/state',
    agentIdValidationRule,
    getAvatarStateHandler
  );

  // 会话管理
  router.post(
    '/avatar-draft/avatars/:agentId/sessions',
    agentIdValidationRule,
    createSessionHandler
  );
}

// ========================================
// 导出服务初始化
// ========================================

export interface AvatarServices {
  avatarService: AvatarService;
}

export function initializeAvatarServices(services: AvatarServices) {
  if (!services.avatarService) {
    throw new Error('AvatarService is required');
  }
}
