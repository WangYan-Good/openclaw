# OpenClaw Hot Reload 应用主入口

/**
 * OpenClaw Hot Reload Application
 * 
 * 启动配置、依赖注入、服务初始化
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Container } from 'inversify';
import 'reflect-metadata';

import { configureHotReloadRoutes } from './api/hot-reload.routes';
import { HotReloadService } from './services/hot-reload.service';
import { VersionManager } from './services/version-manager.service';
import { DiffService } from './services/diff.service';
import { DEFAULT_DIFF_CONFIG } from '../types/hot-reload';

// ========================================
// 依赖注入容器
// ========================================

const container = new Container();

// 注册服务
container
  .bind<HotReloadService>('HotReloadService')
  .to(HotReloadService)
  .inSingletonScope();

container
  .bind<VersionManager>('VersionManager')
  .to(VersionManager)
  .inSingletonScope();

container
  .bind<DiffService>('DiffService')
  .to(DiffService)
  .inSingletonScope();

// 配置 DiffService
container
  .bind<DiffService>('DiffService')
  .toDynamicValue(() => new DiffService(DEFAULT_DIFF_CONFIG))
  .inSingletonScope();

// ========================================
// 应用初始化
// ========================================

export function createApp() {
  const app = express();

  // 中间件
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 配置路由
  const router = express.Router();
  configureHotReloadRoutes(router);
  app.use('/api', router);

  // 错误处理中间件
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    
    res.status(500).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
      },
    });
  });

  // 404 处理
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  return app;
}

// ========================================
// 启动应用
// ========================================

const PORT = process.env.PORT || 3002;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Hot reload service started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

export { app, container };
