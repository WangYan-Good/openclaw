# Avatar 集成测试

/**
 * OpenClaw Avatar 功能集成测试
 * 
 * 测试覆盖:
 * - 头像功能 3 个场景的完整流程
 * - 与其他服务的集成
 * - API 端到端测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Router } from 'express';

import { configureAvatarRoutes, createAvatarHandler } from '../api/avatar.routes';
import { AvatarService } from '../services/avatar.service';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';
import {
  AvatarEntity,
  AvatarType,
  AvatarStatus,
  AvatarStorageMetadata,
} from '../types/avatar';

// Mock 服务
const createMockServices = () => {
  const avatarService = {
    createAvatar: jest.fn(),
    updateAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    getAvatar: jest.fn(),
    listAvatars: jest.fn(),
    switchAvatar: jest.fn(),
    getAvatarPreview: jest.fn(),
    getAvatarConfig: jest.fn(),
    getCurrentAvatar: jest.fn(),
  };

  const userService = {
    getUserAvatarPreference: jest.fn(),
    updateUserAvatarPreference: jest.fn(),
  };

  const storageService = {
    delete: jest.fn(),
  };

  return { avatarService, userService, storageService };
};

describe('Avatar Integration Tests', () => {
  let app: express.Express;
  let { avatarService, userService, storageService } = createMockServices();

  beforeEach(() => {
    // 重置 mock
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // 配置路由
    const router = Router();
    configureAvatarRoutes(router);

    app.use('/api', router);

    // 设置服务实例
    app.locals.avatarService = avatarService;
    app.locals.userService = userService;
    app.locals.storageService = storageService;
  });

  // ========================================
  // 场景 1: Agent 配置头像
  // ========================================
  
  describe('Scenario 1: Agent Avatar Configuration', () => {
    it('should create an agent avatar', async () => {
      const avatarData = {
        type: AvatarType.EMOJI,
        emoji: '📋',
        name: 'AI-Secretary Avatar',
        description: 'Default avatar for AI-Secretary',
        agentId: 'secretary',
        userId: 'system',
      };

      const createdAvatar: AvatarEntity = {
        id: 'avatar_secretary_1',
        type: AvatarType.EMOJI,
        data: '📋',
        emoji: '📋',
        name: 'AI-Secretary Avatar',
        description: 'Default avatar for AI-Secretary',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storage: {
          avatarId: 'avatar_secretary_1',
          version: 1,
          checksum: 'test_checksum',
          size: 100,
          storagePath: '/avatars/secretary_1',
          tags: ['default', 'agent'],
        },
      };

      avatarService.createAvatar.mockResolvedValue(createdAvatar);

      const response = await request(app)
        .post('/api/avatars')
        .send(avatarData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('avatar_secretary_1');
      expect(response.body.data.type).toBe(AvatarType.EMOJI);
      expect(response.body.data.emoji).toBe('📋');
    });

    it('should list agent avatars', async () => {
      const avatars: AvatarEntity[] = [
        {
          id: 'avatar_secretary_1',
          type: AvatarType.EMOJI,
          data: '📋',
          emoji: '📋',
          name: 'Default Avatar',
          status: AvatarStatus.ACTIVE,
          storageType: AvatarStorageType.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'avatar_secretary_2',
          type: AvatarType.IMAGE,
          data: 'https://example.com/secretary.png',
          name: 'Professional Avatar',
          status: AvatarStatus.ACTIVE,
          storageType: AvatarStorageType.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      avatarService.listAvatars.mockResolvedValue({
        items: avatars,
        total: 2,
      });

      const response = await request(app)
        .get('/api/avatars?agentId=secretary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });
  });

  // ========================================
  // 场景 2: 用户切换头像
  // ========================================

  describe('Scenario 2: User Avatar Switching', () => {
    it('should switch avatar for user', async () => {
      const existingAvatar = {
        id: 'avatar_user_1',
        type: AvatarType.EMOJI,
        data: '📋',
        emoji: '📋',
        name: 'Old Avatar',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newAvatar = {
        id: 'avatar_user_2',
        type: AvatarType.IMAGE,
        data: 'https://example.com/new-avatar.png',
        name: 'New Avatar',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      avatarService.switchAvatar.mockResolvedValue(newAvatar);

      const switchRequest = {
        userId: 'user_1',
        agentId: 'secretary',
        newAvatarId: 'avatar_user_2',
      };

      const response = await request(app)
        .post('/api/avatars/switch')
        .send(switchRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('avatar_user_2');
      expect(response.body.message).toBe('Avatar switched successfully');

      expect(avatarService.switchAvatar).toHaveBeenCalledWith(switchRequest);
    });

    it('should get user avatar preference', async () => {
      const preference = {
        userId: 'user_1',
        agentId: 'secretary',
        selectedAvatarId: 'avatar_user_2',
        avatarHistory: ['avatar_user_1', 'avatar_user_2'],
        preferences: {
          showAvatar: true,
          avatarSize: 'medium',
        },
        updatedAt: new Date().toISOString(),
      };

      userService.getUserAvatarPreference.mockResolvedValue(preference);

      const response = await request(app)
        .get('/api/users/user_1/agents/secretary/avatar-preference')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.selectedAvatarId).toBe('avatar_user_2');
    });
  });

  // ========================================
  // 场景 3: 头像预览和管理
  // ========================================

  describe('Scenario 3: Avatar Preview and Management', () => {
    it('should get avatar preview', async () => {
      const preview = {
        id: 'avatar_user_2',
        type: AvatarType.IMAGE,
        previewData: 'https://example.com/new-avatar.png',
        metadata: {
          name: 'New Avatar',
          description: ' Professional avatar',
          tags: ['professional', 'image'],
        },
      };

      avatarService.getAvatarPreview.mockResolvedValue(preview);

      const response = await request(app)
        .get('/api/avatars/avatar_user_2/preview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('avatar_user_2');
    });

    it('should get avatar 404 for non-existent', async () => {
      avatarService.getAvatarPreview.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/avatars/non_existent/preview')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should delete avatar', async () => {
      avatarService.deleteAvatar.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/avatars/avatar_user_1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avatar deleted successfully');
    });
  });

  // ========================================
  // 端到端测试
  // ========================================

  describe('E2E: Complete Avatar Workflow', () => {
    it('should complete full avatar workflow', async () => {
      // 步骤 1: 创建头像
      const createAvatarData = {
        type: AvatarType.EMOJI,
        emoji: '🏗️',
        name: 'Architect Avatar',
        agentId: 'cto',
        userId: 'system',
      };

      avatarService.createAvatar.mockResolvedValue({
        id: 'avatar_cto_architect',
        type: AvatarType.EMOJI,
        data: '🏗️',
        emoji: '🏗️',
        name: 'Architect Avatar',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storage: {
          avatarId: 'avatar_cto_architect',
          version: 1,
          checksum: 'test',
          size: 100,
          storagePath: '/avatars/architect',
          tags: [],
        },
      });

      const createResponse = await request(app)
        .post('/api/avatars')
        .send(createAvatarData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // 步骤 2: 查询头像
      avatarService.getAvatar.mockResolvedValue(createResponse.body.data);

      const getResponse = await request(app)
        .get('/api/avatars/avatar_cto_architect')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('Architect Avatar');

      // 步骤 3: 预览头像
      avatarService.getAvatarPreview.mockResolvedValue({
        id: 'avatar_cto_architect',
        type: AvatarType.EMOJI,
        previewData: '🏗️',
        metadata: {
          name: 'Architect Avatar',
          tags: [],
        },
      });

      const previewResponse = await request(app)
        .get('/api/avatars/avatar_cto_architect/preview')
        .expect(200);

      expect(previewResponse.body.success).toBe(true);
      expect(previewResponse.body.data.previewData).toBe('🏗️');

      // 步骤 4: 切换头像
      avatarService.switchAvatar.mockResolvedValue(createResponse.body.data);

      const switchResponse = await request(app)
        .post('/api/avatars/switch')
        .send({
          userId: 'owner',
          agentId: 'cto',
          newAvatarId: 'avatar_cto_architect',
        })
        .expect(200);

      expect(switchResponse.body.success).toBe(true);

      // 步骤 5: 更新用户偏好
      userService.updateUserAvatarPreference.mockResolvedValue({
        userId: 'owner',
        agentId: 'cto',
        selectedAvatarId: 'avatar_cto_architect',
      });

      const updateResponse = await request(app)
        .put('/api/users/owner/agents/cto/avatar-preference')
        .send({ selectedAvatarId: 'avatar_cto_architect' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
    });
  });
});
