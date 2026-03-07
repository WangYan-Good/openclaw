# Diff Service (差异计算) 服务

/**
 * OpenClaw Diff Service
 * 
 * 提供文件差异计算功能：
 * - 基于文件内容的差异检测
 * - 分块哈希算法
 * - 增量更新包生成
 */

import { Inject, Injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { isEmpty, sortBy } from 'lodash';

import {
  DiffResult,
  DiffEntry,
  DiffType,
  DiffAlgorithmConfig,
  DEFAULT_DIFF_CONFIG,
  Checksum,
} from '../types/hot-reload';

import { Logger } from '../utils/logger';

@Injectable()
export class DiffService {
  private readonly logger = new Logger(DiffService.name);
  private readonly config: DiffAlgorithmConfig;

  constructor(config: DiffAlgorithmConfig = DEFAULT_DIFF_CONFIG) {
    this.config = config;
  }

  /**
   * 计算两个目录的差异
   */
  async calculateDiff(
    oldPath: string,
    newPath: string
  ): Promise<DiffResult> {
    try {
      this.logger.info('Calculating diff between directories');

      // 获取文件列表
      const oldFiles = await this.walkDirectory(oldPath);
      const newFiles = await this.walkDirectory(newPath);

      const added: DiffEntry[] = [];
      const modified: DiffEntry[] = [];
      const deleted: DiffEntry[] = [];
      const moved: DiffEntry[] = [];

      // 创建文件名到路径的映射
      const oldMap = this.createFileMap(oldFiles, oldPath);
      const newMap = this.createFileMap(newFiles, newPath);

      // 检测新增和修改
      for (const [relativePath, newPathInfo] of newMap) {
        if (oldMap.has(relativePath)) {
          // 文件存在，检查是否修改
          const oldInfo = oldMap.get(relativePath)!;
          if (!this.compareFiles(oldInfo, newPathInfo)) {
            const oldHash = await this.calculateFileHash(
              path.join(oldPath, oldInfo.path)
            );
            const newHash = await this.calculateFileHash(
              path.join(newPath, newPathInfo.path)
            );

            modified.push({
              path: relativePath,
              type: DiffType.MODIFIED,
              oldHash,
              newHash,
              oldSize: oldInfo.size,
              newSize: newPathInfo.size,
            });
          }
        } else {
          // 新增文件
          const newHash = await this.calculateFileHash(
            path.join(newPath, newPathInfo.path)
          );

          added.push({
            path: relativePath,
            type: DiffType.ADDED,
            newHash,
            newSize: newPathInfo.size,
          });
        }
      }

      // 检测删除
      for (const [relativePath, oldInfo] of oldMap) {
        if (!newMap.has(relativePath)) {
          const oldHash = await this.calculateFileHash(
            path.join(oldPath, oldInfo.path)
          );

          deleted.push({
            path: relativePath,
            type: DiffType.DELETED,
            oldHash,
            oldSize: oldInfo.size,
          });
        }
      }

      // 检测移动（简单实现）
      for (const del of deleted) {
        for (const add of added) {
          if (
            del.oldHash === add.newHash &&
            this.similarityScore(del.path, add.path) > 0.7
          ) {
            moved.push({
              path: del.path,
              type: DiffType.MOVED,
              oldHash: del.oldHash,
              oldSize: del.oldSize,
            });
            this.removeEntry(added, add.path);
            this.removeEntry(deleted, del.path);
          }
        }
      }

      // 计算总差异大小
      const totalSizeDiff = added.reduce((sum, e) => sum + (e.newSize || 0), 0) -
        deleted.reduce((sum, e) => sum + (e.oldSize || 0), 0);

      // 判断是否增量更新
      const totalFiles = newFiles.length;
      const changedFiles = modified.length + added.length + deleted.length;
      const changePercent = totalFiles > 0 ? (changedFiles / totalFiles) * 100 : 0;

      const isIncremental = changePercent < (this.config.diffThresholdPercent || 30);

      this.logger.info(`Diff calculated: ${added.length} added, ${modified.length} modified, ${deleted.length} deleted`);

      return {
        totalFiles,
        added,
        modified,
        deleted,
        moved,
        totalSizeDiff,
        isIncremental,
      };
    } catch (error) {
      this.logger.error('Error calculating diff:', error);
      throw error;
    }
  }

  /**
   * 计算文件哈希
   */
  async calculateFileHash(filePath: string, algorithm: 'sha256' | 'md5' = 'sha256'): Promise<string> {
    try {
      const stream = fs.createReadStream(filePath);
      const hash = crypto.createHash(algorithm);

      for await (const chunk of stream) {
        hash.update(chunk);
      }

      return hash.digest('hex');
    } catch (error) {
      this.logger.warn(`Failed to calculate hash for: ${filePath}`, error);
      return '';
    }
  }

  /**
   * 创建文件映射
   */
  private createFileMap(files: string[], basePath: string): Map<string, { path: string; size: number }> {
    const map = new Map<string, { path: string; size: number }>();

    for (const filePath of files) {
      const relativePath = path.relative(basePath, filePath);
      map.set(relativePath, {
        path: filePath,
        size: 0, // Will be calculated on demand
      });
    }

    return map;
  }

  /**
   * 移除条目
   */
  private removeEntry(entries: DiffEntry[], path: string): void {
    const index = entries.findIndex(e => e.path === path);
    if (index > -1) {
      entries.splice(index, 1);
    }
  }

  /**
   * 比较两个文件
   */
  private compareFiles(info1: { path: string; size: number }, info2: { path: string; size: number }): boolean {
    // 简单比较：路径和大小
    return info1.path === info2.path && info1.size === info2.size;
  }

  /**
   * 计算相似度分数
   */
  private similarityScore(path1: string, path2: string): number {
    const distance = this.editDistance(path1, path2);
    const maxLength = Math.max(path1.length, path2.length);
    return 1 - distance / maxLength;
  }

  /**
   * 编辑距离（Levenshtein distance）
   */
  private editDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 遍历目录
   */
  private async walkDirectory(dirPath: string, depth: number = 0): Promise<string[]> {
    if (depth > this.config.maxDepth) {
      return [];
    }

    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        // 检查是否应忽略
        if (this.shouldIgnore(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.walkDirectory(fullPath, depth + 1);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read directory: ${dirPath}`, error);
    }

    return files;
  }

  /**
   * 检查是否应忽略
   */
  private shouldIgnore(relativePath: string): boolean {
    return this.config.ignorePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(relativePath);
    });
  }

  /**
   * 生成差异文件
   */
  async generateDiffPatch(
    basePath: string,
    diffResult: DiffResult,
    patchPath: string
  ): Promise<void> {
    try {
      this.logger.info(`Generating diff patch: ${patchPath}`);

      // 创建补丁数据
      const patchData = {
        version: 1,
        basePath,
        diff: diffResult,
        timestamp: new Date().toISOString(),
        entries: {},
      };

      // 为每个修改/新增的文件生成补丁
      for (const entry of [...diffResult.modified, ...diffResult.added]) {
        const filePath = path.join(basePath, entry.path);
        const fileBuffer = await fs.readFile(filePath);
        const compressed = zlib.gzipSync(fileBuffer);
        patchData.entries[entry.path] = {
          compressed: true,
          size: compressed.length,
          originalSize: entry.newSize,
          data: compressed.toString('base64'),
        };
      }

      // 写入补丁文件
      await fs.writeFile(
        patchPath,
        JSON.stringify(patchData, null, 2)
      );

      this.logger.info(`Diff patch generated: ${patchPath}`);
    } catch (error) {
      this.logger.error('Error generating diff patch:', error);
      throw error;
    }
  }

  /**
   * 应用差异补丁
   */
  async applyDiffPatch(
    targetPath: string,
    patchPath: string
  ): Promise<void> {
    try {
      this.logger.info(`Applying diff patch: ${patchPath}`);

      // 读取补丁文件
      const patchDataRaw = await fs.readFile(patchPath, 'utf8');
      const patchData = JSON.parse(patchDataRaw) as typeof patchDataRaw;

      // 创建目录
      await fs.mkdir(targetPath, { recursive: true });

      // 应用每个文件
      for (const [filePath, entry] of Object.entries(patchData.entries)) {
        const targetFilePath = path.join(targetPath, filePath);
        const dirPath = path.dirname(targetFilePath);

        // 创建目录
        await fs.mkdir(dirPath, { recursive: true });

        if (entry.compressed) {
          // 解压缩
          const compressedBuffer = Buffer.from(entry.data, 'base64');
          const decompressed = zlib.gunzipSync(compressedBuffer);
          await fs.writeFile(targetFilePath, decompressed);
        } else {
          // 直接写入
          await fs.writeFile(targetFilePath, Buffer.from(entry.data, 'base64'));
        }
      }

      this.logger.info(`Diff patch applied: ${patchPath}`);
    } catch (error) {
      this.logger.error('Error applying diff patch:', error);
      throw error;
    }
  }

  /**
   * 计算快照差异
   */
  async compareSnapshots(
    oldSnapshot: string,
    newSnapshot: string
  ): Promise<DiffResult> {
    try {
      this.logger.info('Comparing snapshots');

      // 读取快照
      const oldData = JSON.parse(
        await fs.readFile(oldSnapshot, 'utf8')
      ) as { files: string[]; checksums: Record<string, string> };

      const newData = JSON.parse(
        await fs.readFile(newSnapshot, 'utf8')
      ) as { files: string[]; checksums: Record<string, string> };

      const added: DiffEntry[] = [];
      const modified: DiffEntry[] = [];
      const deleted: DiffEntry[] = [];

      // 检测新增
      for (const file of newData.files) {
        if (!oldData.files.includes(file)) {
          added.push({
            path: file,
            type: DiffType.ADDED,
            newHash: newData.checksums[file],
          });
        }
      }

      // 检测删除
      for (const file of oldData.files) {
        if (!newData.files.includes(file)) {
          deleted.push({
            path: file,
            type: DiffType.DELETED,
            oldHash: oldData.checksums[file],
          });
        }
      }

      // 检测修改
      for (const file of newData.files) {
        if (
          oldData.files.includes(file) &&
          oldData.checksums[file] !== newData.checksums[file]
        ) {
          modified.push({
            path: file,
            type: DiffType.MODIFIED,
            oldHash: oldData.checksums[file],
            newHash: newData.checksums[file],
          });
        }
      }

      return {
        totalFiles: newData.files.length,
        added,
        modified,
        deleted,
        moved: [],
        totalSizeDiff: 0,
        isIncremental: modified.length < 50,
      };
    } catch (error) {
      this.logger.error('Error comparing snapshots:', error);
      throw error;
    }
  }
}
