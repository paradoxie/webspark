import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response, NextFunction } from 'express';
import os from 'os';

// 创建日志目录
import fs from 'fs';
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// 创建日志传输器
const transports: winston.transport[] = [];

// 控制台传输器
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// 错误日志文件
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat
  })
);

// 综合日志文件
transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
  })
);

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// HTTP请求日志中间件
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 记录请求信息
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id
  };

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    };

    // 根据状态码决定日志级别
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// 性能监控
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  // 开始计时
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  // 结束计时并记录
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer ${label} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    // 记录指标
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(duration);
    
    // 保留最近100个值
    if (values.length > 100) {
      values.shift();
    }

    logger.debug(`Performance: ${label} took ${duration}ms`);
    return duration;
  }

  // 获取统计信息
  getStats(label: string) {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)]
    };
  }

  // 获取所有指标
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [label, _] of this.metrics) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 系统监控
class SystemMonitor {
  private interval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 60000) {
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        cpuCount: os.cpus().length
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    logger.info('System Metrics', metrics);
    
    // 检查内存使用率
    const memoryUsagePercent = (1 - metrics.system.freeMemory / metrics.system.totalMemory) * 100;
    if (memoryUsagePercent > 90) {
      logger.error('High memory usage detected', { 
        usagePercent: memoryUsagePercent.toFixed(2) 
      });
    }

    // 检查负载
    const loadPerCpu = metrics.system.loadAverage[0] / metrics.system.cpuCount;
    if (loadPerCpu > 2) {
      logger.warn('High system load detected', { 
        loadPerCpu: loadPerCpu.toFixed(2) 
      });
    }
  }
}

export const systemMonitor = new SystemMonitor();

// 错误监控
export function setupErrorMonitoring() {
  // 未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    // 优雅关闭
    process.exit(1);
  });

  // 未处理的Promise拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      reason,
      promise
    });
  });

  // 警告
  process.on('warning', (warning: Error) => {
    logger.warn('Process Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
}

// 业务指标监控
export class BusinessMetrics {
  static async recordWebsiteView(websiteId: number, userId?: number) {
    logger.info('Website View', { websiteId, userId });
  }

  static async recordUserSignup(userId: number, provider: string) {
    logger.info('User Signup', { userId, provider });
  }

  static async recordWebsiteSubmission(websiteId: number, userId: number) {
    logger.info('Website Submission', { websiteId, userId });
  }

  static async recordError(error: Error, context: Record<string, any>) {
    logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      context
    });
  }
}

// 监控路由
export function createMonitoringRoutes() {
  const router = require('express').Router();

  router.get('/metrics', (req: Request, res: Response) => {
    res.json({
      performance: performanceMonitor.getAllStats(),
      system: {
        platform: os.platform(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  });

  return router;
}
