# Version Manager (版本管理) 服务

/**
 * OpenClaw Version Manager
 * 
 * 提供版本管理的核心功能：
 * - 版本信息存储和检索
 * - 版本验证和校验
 * - 版本回滚支持
 */

import { Inject, Injectable } from 'inversify';
import { isEmpty, isNil } from 'lodash';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as semver from 'semver';

import {
  VersionInfo,
  VersionSnapshot,
  Checksum,
  UpdateType,
  UpdateStatus,
  DiffResult,
} from '../types/hot-reload';

import { StorageService } from '../services/storage.service';
import { DiffService } from '../services/diff.service';
import { Logger } from '../utils/logger';

@Injectable()
export class VersionManager {
  private readonly logger = new Logger(VersionManager.name);
  private readonly versionsPath: string = '/var/lib/openclaw/versions';
  private readonly snapshotsPath: string = '/var/lib/openclaw/snapshots';

  constructor(
    @Inject('StorageService') private readonly storageService: StorageService,
    @Inject('DiffService') private readonly diffService: DiffService
  ) {}

  /**
   * 初始化版本管理器
   */
  async initialize(): Promise<void> {
    try {
      // 创建目录
      await this.storageService.mkdirp(this.versionsPath);
      await this.storageService.mkdirp(this.snapshotsPath);

      // 初始化当前版本
      const currentVersion = await this.getCurrentVersion();
      if (!currentVersion) {
        await this.setVersion('1.0.0', UpdateType.FULL, 'Initial version');
      }
    } catch (error) {
      this.logger.error('Error initializing version manager:', error);
      throw error;
    }
  }

  /**
   * 获取当前版本
   */
  async getCurrentVersion(): Promise<string | null> {
    try {
      const currentLink = path.join(this.versionsPath, 'current');
      const currentPath = await this.storageService.readSymlink(currentLink);
      return currentPath ? path.basename(currentPath) : null;
    } catch (error) {
      this.logger.error('Error getting current version:', error);
      return null;
    }
  }

  /**
   * 设置当前版本
   */
  async setVersion(
    version: string,
    updateType: UpdateType,
    changelog?: string
  ): Promise<VersionInfo> {
    try {
      const versionPath = path.join(this.versionsPath, version);
      
      // 检查版本是否存在
      if (!await this.storageService.exists(versionPath)) {
        throw new Error(`Version not found: ${version}`);
      }

      // 更新当前链接
      const currentLink = path.join(this.versionsPath, 'current');
      await this.storageService.symlink(versionPath, currentLink);

      // 创建版本信息
      const versionInfo: VersionInfo = {
        version,
        buildNumber: await this.getBuildNumber(version),
        releaseDate: new Date().toISOString(),
        type: updateType,
        status: UpdateStatus.COMPLETED,
        changelog,
      };

      // 保存版本信息
      await this.storageService.writeJson(
        path.join(versionPath, 'version.json'),
        versionInfo
      );

      this.logger.info(`Set current version: ${version}`);

      return versionInfo;
    } catch (error) {
      this.logger.error('Error setting version:', error);
      throw error;
    }
  }

  /**
   * 安装新版本
   */
  async installVersion(
    version: string,
    packagePath: string,
    checksum: string,
    updateType: UpdateType,
    changelog?: string
  ): Promise<VersionInfo> {
    try {
      this.logger.info(`Installing version: ${version}`);

      // 验证包
      await this.validatePackage(packagePath, checksum);

      // 创建版本目录
      const versionPath = path.join(this.versionsPath, version);
      await this.storageService.mkdirp(versionPath);

      // 解压包
      await this.storageService.extract(packagePath, versionPath);

      // 计算文件列表和校验和
      const files = await this.storageService.listFiles(versionPath);
      const checksums = await this.calculateChecksums(files, versionPath);

      // 创建快照
      const snapshot: VersionSnapshot = {
        snapshotId: crypto.randomUUID(),
        version,
        timestamp: new Date().toISOString(),
        files,
        checksums,
        size: await this.calculateTotalSize(files, versionPath),
      };

      await this.storageService.writeJson(
        path.join(this.snapshotsPath, `${version}.json`),
        snapshot
      );

      // 设置为当前版本
      const versionInfo = await this.setVersion(
        version,
        updateType,
        changelog
      );

      this.logger.info(`Version installed: ${version}`);

      return versionInfo;
    } catch (error) {
      this.logger.error('Error installing version:', error);
      throw error;
    }
  }

  /**
   * 卸载版本（归档）
   */
  async archiveVersion(version: string): Promise<void> {
    try {
      const versionPath = path.join(this.versionsPath, version);
      
      // 检查是否为当前版本
      const currentVersion = await this.getCurrentVersion();
      if (currentVersion === version) {
        throw new Error(`Cannot archive current version: ${version}`);
      }

      // 移动到归档目录
      const archivePath = path.join(this.versionsPath, 'archived', version);
      await this.storageService.rename(versionPath, archivePath);

      // 删除快照
      await this.storageService.delete(
        path.join(this.snapshotsPath, `${version}.json`)
      );

      this.logger.info(`Archived version: ${version}`);
    } catch (error) {
      this.logger.error('Error archiving version:', error);
      throw error;
    }
  }

  /**
   * 回滚到指定版本
   */
  async rollback(version: string): Promise<VersionInfo> {
    try {
      const versionInfo = await this.setVersion(version, UpdateType.FULL, 'Rollback');

      // 记录回滚日志
      await this.logRollback(version);

      this.logger.info(`Rolled back to version: ${version}`);

      return versionInfo;
    } catch (error) {
      this.logger.error('Error rolling back:', error);
      throw error;
    }
  }

  /**
   * 获取版本列表
   */
  async listVersions(): Promise<VersionInfo[]> {
    try {
      const versions: VersionInfo[] = [];

      // 获取所有版本目录
      const versionDirs = await this.storageService.listDirs(this.versionsPath);

      for (const dir of versionDirs) {
        if (dir === 'current' || dir === 'archived') continue;

        try {
          const versionPath = path.join(this.versionsPath, dir);
          const versionInfo = await this.storageService.readJson<VersionInfo>(
            path.join(versionPath, 'version.json')
          );

          if (versionInfo) {
            versions.push(versionInfo);
          }
        } catch (error) {
          this.logger.warn(`Failed to load version info: ${dir}`, error);
        }
      }

      // 按版本号排序
      versions.sort((a, b) => this.compareVersions(b.version, a.version));

      return versions;
    } catch (error) {
      this.logger.error('Error listing versions:', error);
      throw error;
    }
  }

  /**
   * 计算文件校验和
   */
  async calculateChecksums(
    files: string[],
    basePath: string
  ): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {};

    for (const filePath of files) {
      try {
        const fullPath = path.join(basePath, filePath);
        const buffer = await this.storageService.readFile(fullPath);
        checksums[filePath] = crypto
          .createHash('sha256')
          .update(buffer)
          .digest('hex');
      } catch (error) {
        this.logger.warn(`Failed to calculate checksum for: ${filePath}`, error);
      }
    }

    return checksums;
  }

  /**
   * 计算目录总大小
   */
  async calculateTotalSize(files: string[], basePath: string): Promise<number> {
    let totalSize = 0;
    for (const filePath of files) {
      try {
        const fullPath = path.join(basePath, filePath);
        const stats = await this.storageService.stat(fullPath);
        totalSize += stats.size;
      } catch (error) {
        this.logger.warn(`Failed to get file size: ${filePath}`, error);
      }
    }
    return totalSize;
  }

  /**
   * 获取构建号
   */
  async getBuildNumber(version: string): Promise<number> {
    try {
      const versionInfo = await this.storageService.readJson<VersionInfo>(
        path.join(this.versionsPath, version, 'version.json')
      );
      return versionInfo?.buildNumber || 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * 验证包完整性
   */
  async validatePackage(packagePath: string, expectedChecksum: string): Promise<boolean> {
    try {
      const buffer = await this.storageService.readFile(packagePath);
      const actualChecksum = crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');

      if (actualChecksum !== expectedChecksum) {
        throw new Error('Package checksum mismatch');
      }

      return true;
    } catch (error) {
      this.logger.error('Package validation failed:', error);
      throw error;
    }
  }

  /**
   * 比较两个版本
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      if (num1 !== num2) return num1 - num2;
    }

    return 0;
  }

  /**
   * 记录回滚日志
   */
  private async logRollback(version: string): Promise<void> {
    try {
      const logsPath = path.join(this.snapshotsPath, 'rollback_logs.json');
      const logs: { version: string; timestamp: string }[] = await this.storageService
        .readJson(logsPath)
        .catch(() => []);

      logs.push({
        version,
        timestamp: new Date().toISOString(),
      });

      await this.storageService.writeJson(logsPath, logs);
    } catch (error) {
      this.logger.warn('Failed to log rollback:', error);
    }
  }

  /**
   * 检查健康状态
   */
  async checkHealth(version: string): Promise<boolean> {
    try {
      const versionPath = path.join(this.versionsPath, version);
      
      // 检查版本目录
      if (!await this.storageService.exists(versionPath)) {
        return false;
      }

      // 检查版本信息
      const versionInfo = await this.storageService.readJson<VersionInfo>(
        path.join(versionPath, 'version.json')
      );

      if (!versionInfo || versionInfo.status !== UpdateStatus.COMPLETED) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
