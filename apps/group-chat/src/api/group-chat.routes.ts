# OpenClaw Group Chat API 路由

/**
 * OpenClaw Group Chat API
 * 
 * REST API 接口定义：
 * - 群组管理
 * - 成员管理
 * - 消息管理
 * - 事件监听
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  GroupChatService,
} from '../services/group-chat.service';

import {
  GroupInfo,
  GroupType,
  GroupMember,
  MemberRole,
  MessageInfo,
  MessageType,
  GroupEvent,
  EventType,
} from '../types/group-chat';

// ========================================
// 路由处理器
// ========================================

/**
 * 创建群组处理器
 */
export const createGroupHandler = async (
  req: Request,
  res: Response<{ success: boolean; group: GroupInfo }>,
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

    const service = req.app.locals.groupChatService;

    const group = await service.createGroup({
      name: req.body.name,
      type: req.body.type as GroupType,
      creatorId: req.body.creatorId,
      description: req.body.description,
      avatar: req.body.avatar,
      settings: req.body.settings,
    });

    res.status(201).json({
      success: true,
      group,
      message: 'Group created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新群组处理器
 */
export const updateGroupHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    await service.updateGroup(req.params.groupId, req.body);

    res.json({
      success: true,
      message: 'Group updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除群组处理器
 */
export const deleteGroupHandler = async (
  req: Request,
  res: Response<{ success: boolean }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    await service.deleteGroup(req.params.groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 添加成员处理器
 */
export const addMemberHandler = async (
  req: Request,
  res: Response<{ success: boolean; member: GroupMember }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    const member = await service.addMember({
      groupId: req.params.groupId,
      memberId: req.body.memberId,
      role: req.body.role as MemberRole,
      nickname: req.body.nickname,
      avatar: req.body.avatar,
    });

    res.status(201).json({
      success: true,
      member,
      message: 'Member added successfully',
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
  res: Response<{ success: boolean; message: MessageInfo }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    const message = await service.sendMessage({
      groupId: req.params.groupId,
      senderId: req.body.senderId,
      messageType: req.body.messageType as MessageType,
      content: req.body.content,
      attachments: req.body.attachments,
      replyToMessageId: req.body.replyToMessageId,
    });

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
 * 广播消息处理器
 */
export const broadcastMessageHandler = async (
  req: Request,
  res: Response<{ success: boolean; messages: MessageInfo[] }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    const messages = await service.broadcastMessage({
      groupId: req.params.groupId,
      senderId: req.body.senderId,
      messageType: req.body.messageType as MessageType,
      content: req.body.content,
      targetRoles: req.body.targetRoles,
    });

    res.status(201).json({
      success: true,
      messages,
      message: 'Messages broadcasted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取群组统计处理器
 */
export const getGroupStatsHandler = async (
  req: Request,
  res: Response<{ success: boolean; stats: any }>,
  next: NextFunction
) => {
  try {
    const service = req.app.locals.groupChatService;

    const stats = await service.getGroupStats(req.params.groupId);

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

export const createGroupValidationRules = [
  body('name').notEmpty().withMessage('Group name is required'),
  body('type').notEmpty().withMessage('Group type is required'),
  body('creatorId').notEmpty().withMessage('Creator ID is required'),
  body('type').isIn(['private', 'small', 'medium', 'large', 'system', 'event'])
    .withMessage('Invalid group type'),
];

export const groupIdValidationRule = [
  param('groupId').notEmpty().withMessage('Group ID is required'),
];

// ========================================
// 路由配置
// ========================================

export function configureGroupChatRoutes(router: Router) {
  // 群组管理
  router.post(
    '/group-chat/groups',
    createGroupValidationRules,
    createGroupHandler
  );

  router.patch(
    '/group-chat/groups/:groupId',
    groupIdValidationRule,
    updateGroupHandler
  );

  router.delete(
    '/group-chat/groups/:groupId',
    groupIdValidationRule,
    deleteGroupHandler
  );

  // 成员管理
  router.post(
    '/group-chat/groups/:groupId/members',
    groupIdValidationRule,
    addMemberHandler
  );

  // 消息管理
  router.post(
    '/group-chat/groups/:groupId/messages',
    groupIdValidationRule,
    sendMessageHandler
  );

  router.post(
    '/group-chat/groups/:groupId/messages/broadcast',
    groupIdValidationRule,
    broadcastMessageHandler
  );

  // 群组统计
  router.get(
    '/group-chat/groups/:groupId/stats',
    groupIdValidationRule,
    getGroupStatsHandler
  );
}

// ========================================
// 导出服务初始化
// ========================================

export interface GroupChatServices {
  groupChatService: GroupChatService;
}

export function initializeGroupChatServices(services: GroupChatServices) {
  if (!services.groupChatService) {
    throw new Error('GroupChatService is required');
  }
}
