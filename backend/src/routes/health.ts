import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import os from 'os';
import { cache } from '../lib/cache';

const router = Router();

// 基础健康检查
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.status(200).json(healthInfo);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// 详细健康检查
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  
  // 数据库检查
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      type: 'mysql'
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // 缓存检查
  try {
    const cacheStart = Date.now();
    const testKey = 'health_check_test';
    await cache.set('health', testKey, 'test', { ttl: 10 });
    const value = await cache.get('health', testKey);
    await cache.delete('health', testKey);
    
    checks.cache = {
      status: value === 'test' ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - cacheStart,
      type: 'memory'
    };
  } catch (error) {
    checks.cache = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // 文件系统检查
  try {
    const fs = await import('fs/promises');
    const fsStart = Date.now();
    await fs.access('./uploads', fs.constants.W_OK);
    checks.filesystem = {
      status: 'healthy',
      responseTime: Date.now() - fsStart,
      uploadsDirectory: 'writable'
    };
  } catch (error) {
    checks.filesystem = {
      status: 'unhealthy',
      error: 'Uploads directory not writable'
    };
  }
  
  // 系统资源
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  checks.system = {
    status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
    memory: {
      total: Math.round(totalMemory / 1024 / 1024),
      free: Math.round(freeMemory / 1024 / 1024),
      used: Math.round(usedMemory / 1024 / 1024),
      usagePercent: Math.round(memoryUsagePercent)
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg()
    },
    process: {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }
  };
  
  // 依赖服务检查
  const dependencies: Record<string, any> = {};
  
  // 检查外部API（如果有）
  if (process.env.EXTERNAL_API_URL) {
    try {
      const apiStart = Date.now();
      const response = await fetch(process.env.EXTERNAL_API_URL + '/health');
      dependencies.externalApi = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - apiStart,
        statusCode: response.status
      };
    } catch (error) {
      dependencies.externalApi = {
        status: 'unhealthy',
        error: 'Connection failed'
      };
    }
  }
  
  // 总体状态
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warning');
  
  const overallStatus = !allHealthy ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    checks,
    dependencies
  });
});

// 数据库统计
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      userCount,
      websiteCount,
      commentCount,
      activeUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.website.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    res.json({
      database: {
        users: {
          total: userCount,
          activeToday: activeUsers
        },
        websites: {
          total: websiteCount
        },
        comments: {
          total: commentCount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

// 就绪检查（用于K8s等容器编排）
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // 检查必要的服务是否就绪
    await prisma.$queryRaw`SELECT 1`;
    
    // 检查必要的环境变量
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        ready: false,
        reason: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }
    
    res.json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: 'Service not ready',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 存活检查（用于K8s等容器编排）
router.get('/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

export default router;
