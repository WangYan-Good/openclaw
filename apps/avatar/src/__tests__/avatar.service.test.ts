# Avatar 单元测试

/**
 * OpenClaw Avatar 功能单元测试
 * 
 * 测试覆盖:
 * - AvatarService 核心逻辑
 * - API 路由处理器
 * - 数据验证
 * - 错误处理
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AvatarService } from '../services/avatar.service';
import { AvatarRepository } from '../repositories/avatar.repository';
import { StorageService } from '../services/storage.service';
import { UserService } from '../services/user.service';
import { Logger } from '../utils/logger';
import {
  AvatarEntity,
  AvatarType,
  AvatarStatus,
  AvatarStorageMetadata,
  ImageAvatar,
  EmojiAvatar,
  IconAvatar,
  AvatarQueryParams,
  AvatarSwitchRequest,
} from '../types/avatar';

// Mock 依赖
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  delete: jest.fn(),
  getByAgentId: jest.fn(),
};

const mockStorageService = {
  delete: jest.fn(),
};

const mockUserService = {
  getUserAvatarPreference: jest.fn(),
  updateUserAvatarPreference: jest.fn(),
};

describe('AvatarService', () => {
  let avatarService: AvatarService;

  beforeEach(() => {
    // 重置 mock
    mockRepository.save.mockClear();
    mockRepository.findById.mockClear();
    mockRepository.list.mockClear();
    mockRepository.delete.mockClear();
    mockRepository.getByAgentId.mockClear();
    mockStorageService.delete.mockClear();
    mockUserService.getUserAvatarPreference.mockClear();
    mockUserService.updateUserAvatarPreference.mockClear();

    // 创建服务实例
    avatarService = new AvatarService(
      mockRepository as any,
      mockStorageService as any,
      mockUserService as any
    );
  });

  describe('createAvatar', () => {
    it('should create an image avatar', async () => {
      const avatarData = {
        type: AvatarType.IMAGE,
        data: 'https://example.com/avatar.png',
        name: 'Test Image Avatar',
        agentId: 'agent_1',
        userId: 'user_1',
      };

      mockRepository.save.mockImplementation((avatar) => {
        avatar.id = 'avatar_1';
        avatar.createdAt = new Date().toISOString();
        avatar.updatedAt = new Date().toISOString();
        avatar.storage = {
          avatarId: 'avatar_1',
          version: 1,
          checksum: 'test_checksum',
          size: JSON.stringify(avatar).length,
          storagePath: '/avatars/avatar_1',
          tags: [],
        };
        return avatar;
      });

      const result = await avatarService.createAvatar(avatarData);

      expect(result).toBeDefined();
      expect(result.type).toBe(AvatarType.IMAGE);
      expect(result.name).toBe('Test Image Avatar');
      expect(result.storage).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create an emoji avatar', async () => {
      const avatarData = {
        type: AvatarType.EMOJI,
        emoji: '📋',
        name: 'Test Emoji Avatar',
        agentId: 'agent_1',
        userId: 'user_1',
      };

      mockRepository.save.mockImplementation((avatar) => {
        avatar.id = 'avatar_2';
        avatar.createdAt = new Date().toISOString();
        avatar.updatedAt = new Date().toISOString();
        avatar.storage = {
          avatarId: 'avatar_2',
          version: 1,
          checksum: 'test_checksum',
          size: JSON.stringify(avatar).length,
          storagePath: '/avatars/avatar_2',
          tags: [],
        };
        return avatar;
      });

      const result = await avatarService.createAvatar(avatarData);

      expect(result).toBeDefined();
      expect(result.type).toBe(AvatarType.EMOJI);
      expect((result as EmojiAvatar).emoji).toBe('📋');
      expect(result.name).toBe('Test Emoji Avatar');
    });

    it('should create an icon avatar', async () => {
      const svgData = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;
      const avatarData = {
        type: AvatarType.ICON,
        svgData: svgData,
        name: 'Test Icon Avatar',
        agentId: 'agent_1',
        userId: 'user_1',
      };

      mockRepository.save.mockImplementation((avatar) => {
        avatar.id = 'avatar_3';
        avatar.createdAt = new Date().toISOString();
        avatar.updatedAt = new Date().toISOString();
        avatar.storage = {
          avatarId: 'avatar_3',
          version: 1,
          checksum: 'test_checksum',
          size: JSON.stringify(avatar).length,
          storagePath: '/avatars/avatar_3',
          tags: [],
        };
        return avatar;
      });

      const result = await avatarService.createAvatar(avatarData);

      expect(result).toBeDefined();
      expect(result.type).toBe(AvatarType.ICON);
      expect((result as IconAvatar).svgData).toBe(svgData);
      expect(result.name).toBe('Test Icon Avatar');
    });

    it('should throw error for invalid avatar type', async () => {
      const avatarData = {
        type: 'invalid' as any,
        data: 'test',
        name: 'Test',
        agentId: 'agent_1',
        userId: 'user_1',
      };

      await expect(avatarService.createAvatar(avatarData)).rejects.toThrow(
        'Unsupported avatar type'
      );
    });
  });

  describe('updateAvatar', () => {
    it('should update an existing avatar', async () => {
      const existingAvatar: AvatarEntity = {
        id: 'avatar_1',
        type: AvatarType.EMOJI,
        data: '📋',
        name: 'Old Name',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.findById.mockResolvedValue(existingAvatar);
      mockRepository.save.mockImplementation((avatar) => {
        avatar.updatedAt = new Date().toISOString();
        return avatar;
      });

      const updateData = {
        name: 'New Name',
        description: 'Updated description',
      };

      const result = await avatarService.updateAvatar('avatar_1', updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Updated description');
      expect(result.storage?.version).toBe(1);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if avatar not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        avatarService.updateAvatar('non_existent', {})
      ).rejects.toThrow('Avatar not found');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete an avatar', async () => {
      const existingAvatar: AvatarEntity = {
        id: 'avatar_1',
        type: AvatarType.EMOJI,
        data: '📋',
        name: 'Test',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storage: {
          avatarId: 'avatar_1',
          version: 1,
          checksum: 'test',
          size: 100,
          storagePath: '/avatars/avatar_1',
          tags: [],
        },
      };

      mockRepository.findById.mockResolvedValue(existingAvatar);
      mockRepository.delete.mockResolvedValue(undefined);

      await avatarService.deleteAvatar('avatar_1');

      expect(mockStorageService.delete).toHaveBeenCalledWith('/avatars/avatar_1');
      expect(mockRepository.delete).toHaveBeenCalledWith('avatar_1');
    });

    it('should throw error if avatar not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(avatarService.deleteAvatar('non_existent')).rejects.toThrow(
        'Avatar not found'
      );
    });
  });

  describe('getAvatar', () => {
    it('should get avatar by ID', async () => {
      const avatar: AvatarEntity = {
        id: 'avatar_1',
        type: AvatarType.EMOJI,
        data: '📋',
        name: 'Test',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.findById.mockResolvedValue(avatar);

      const result = await avatarService.getAvatar('avatar_1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('avatar_1');
      expect(mockRepository.findById).toHaveBeenCalledWith('avatar_1');
    });
  });

  describe('listAvatars', () => {
    it('should list avatars with pagination', async () => {
      const avatars: AvatarEntity[] = [
        {
          id: 'avatar_1',
          type: AvatarType.EMOJI,
          data: '📋',
          name: 'Test 1',
          status: AvatarStatus.ACTIVE,
          storageType: AvatarStorageType.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'avatar_2',
          type: AvatarType.IMAGE,
          data: 'https://example.com/avatar.png',
          name: 'Test 2',
          status: AvatarStatus.ACTIVE,
          storageType: AvatarStorageType.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockRepository.list.mockResolvedValue({
        items: avatars,
        total: 2,
      });

      const params: AvatarQueryParams = {
        page: 1,
        pageSize: 10,
      };

      const result = await avatarService.listAvatars(params);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('switchAvatar', () => {
    it('should switch avatar for user', async () => {
      const newAvatar: AvatarEntity = {
        id: 'avatar_2',
        type: AvatarType.EMOJI,
        data: '📝',
        name: 'New Avatar',
        status: AvatarStatus.ACTIVE,
        storageType: AvatarStorageType.LOCAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.findById.mockResolvedValue(newAvatar);
      mockUserService.updateUserAvatarPreference.mockResolvedValue({
        selectedAvatarId: 'avatar_2',
      });

      const request: AvatarSwitchRequest = {
        userId: 'user_1',
        agentId: 'agent_1',
        newAvatarId: 'avatar_2',
      };

      const result = await avatarService.switchAvatar(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('avatar_2');
      expect(mockRepository.findById).toHaveBeenCalledWith('avatar_2');
      expect(mockUserService.updateUserAvatarPreference).toHaveBeenCalledWith(
        'user_1',
        'agent_1',
        { selectedAvatarId: 'avatar_2' }
      );
    });

    it('should throw error if new avatar not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request: AvatarSwitchRequest = {
        userId: 'user_1',
        agentId: 'agent_1',
        newAvatarId: 'non_existent',
      };

      await expect(avatarService.switchAvatar(request)).rejects.toThrow(
        'Avatar not found'
      );
    });
  });

  describe('getAvatarConfig', () => {
    it('should get avatar config for agent', async () => {
      const avatars: AvatarEntity[] = [
        {
          id: 'avatar_1',
          type: AvatarType.EMOJI,
          data: '📋',
          name: 'Default',
          status: AvatarStatus.ACTIVE,
          storageType: AvatarStorageType.LOCAL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockRepository.getByAgentId.mockResolvedValue(avatars);

      const result = await avatarService.getAvatarConfig('agent_1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('avatar_1');
      expect(mockRepository.getByAgentId).toHaveBeenCalledWith('agent_1');
    });
  });
});

// ========================================
// API 路由处理器测试
// ========================================

import {
  createAvatarHandler,
  updateAvatarHandler,
  getAvatarHandler,
  listAvatarsHandler,
  switchAvatarHandler,
  previewAvatarHandler,
  createAvatarValidationRules,
  updateAvatarValidationRules,
  avatarIdValidationRule,
} from '../api/avatar.routes';

describe('Avatar API Routes', () => {
  describe('createAvatarHandler', () => {
    it('should validate required fields', async () => {
      const req = {
        body: {},
        app: {
          locals: {
            avatarService: {
              createAvatar: jest.fn().mockResolvedValue({ id: 'new_id' }),
            },
          },
        },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await createAvatarHandler(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
