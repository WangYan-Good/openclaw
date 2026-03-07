# OpenClaw Command Queue 应用主入口

/**
 * OpenClaw Command Queue Application
 * 
 * 启动配置、依赖注入、服务初始化
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Container } from 'inversify';
import 'reflect-metadata';

import { configureCommandQueueRoutes } from './api/command-queue.routes';
import { CommandQueueService } from './services/command-queue.service';
import { PriorityQueue } from './services/priority-queue.service';
import { TaskScheduler } from './services/task-scheduler.service';
import { QueueConfig, DEFAULT_QUEUE_CONFIG } from '../types/command-queue';

// ========================================
// 依赖注入容器
// ========================================

const container = new Container();

// 注册服务
container
  .bind<CommandQueueService>('CommandQueueService')
  .to(CommandQueueService)
  .inSingletonScope();

container
  .bind<PriorityQueue>('PriorityQueue')
  .to(PriorityQueue)
  .inSingletonScope();

container
  .bind<TaskScheduler>('TaskScheduler')
  .to(TaskScheduler)
  .inSingletonScope();

// 配置 PriorityQueue
container
  .bind<QueueConfig>('QueueConfig')
  .toConstantValue(DEFAULT_QUEUE_CONFIG);

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
  configureCommandQueueRoutes(router);
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

const PORT = process.env.PORT || 3003;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Command queue service started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

export { app, container };
