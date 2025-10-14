import winston from 'winston';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// 确保日志目录存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 日志级别定义
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 自定义时间戳格式
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss.SSS'
});

// 结构化日志格式
const structuredFormat = winston.format.printf((info) => {
  const { timestamp, level, message, ...meta } = info;
  
  const log = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  return JSON.stringify(log);
});

// 开发环境格式（更易读）
const devFormat = winston.format.printf((info) => {
  const { timestamp, level, message, ...meta } = info;
  
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += '\n' + JSON.stringify(meta, null, 2);
  }
  
  return log;
});

// 创建日志器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    timestampFormat,
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: structuredFormat
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      format: structuredFormat
    }),
    // 应用日志文件（不包含HTTP日志）
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format((info) => info.level !== 'http' ? info : false)(),
        structuredFormat
      )
    })
  ]
});

// 控制台输出（开发环境）
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      devFormat
    )
  }));
}

// 日志上下文管理
class LogContext {
  private context: Record<string, any> = {};

  setRequestContext(req: Request) {
    this.context = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: (req as any).user?.id,
      userAgent: req.get('user-agent')
    };
  }

  addContext(key: string, value: any) {
    this.context[key] = value;
  }

  getContext() {
    return { ...this.context };
  }

  clear() {
    this.context = {};
  }
}

const logContext = new LogContext();

// 增强的日志方法
const structuredLogger = {
  // 基础日志方法
  error: (message: string, meta?: Record<string, any>) => {
    logger.error(message, { ...logContext.getContext(), ...meta });
  },
  
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, { ...logContext.getContext(), ...meta });
  },
  
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, { ...logContext.getContext(), ...meta });
  },
  
  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, { ...logContext.getContext(), ...meta });
  },
  
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, { ...logContext.getContext(), ...meta });
  },

  // 业务事件日志
  logEvent: (event: string, data?: Record<string, any>) => {
    logger.info(`Event: ${event}`, {
      ...logContext.getContext(),
      event,
      eventData: data
    });
  },

  // 性能日志
  logPerformance: (operation: string, duration: number, meta?: Record<string, any>) => {
    logger.info(`Performance: ${operation}`, {
      ...logContext.getContext(),
      operation,
      duration,
      ...meta
    });
  },

  // 安全事件日志
  logSecurity: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, any>) => {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    logger[level](`Security Event: ${event}`, {
      ...logContext.getContext(),
      securityEvent: event,
      severity,
      ...details
    });
  },

  // 数据库查询日志
  logQuery: (query: string, duration: number, params?: any[]) => {
    logger.debug('Database Query', {
      ...logContext.getContext(),
      query,
      duration,
      params: process.env.NODE_ENV === 'production' ? undefined : params
    });
  },

  // API调用日志
  logApiCall: (service: string, endpoint: string, duration: number, status: number, error?: any) => {
    const level = status >= 400 ? 'error' : 'info';
    logger[level](`API Call: ${service}`, {
      ...logContext.getContext(),
      service,
      endpoint,
      duration,
      status,
      error: error?.message || error
    });
  },

  // 用户行为日志
  logUserAction: (action: string, details?: Record<string, any>) => {
    logger.info(`User Action: ${action}`, {
      ...logContext.getContext(),
      userAction: action,
      ...details
    });
  },

  // 错误日志（带堆栈）
  logError: (error: Error, context?: Record<string, any>) => {
    logger.error(error.message, {
      ...logContext.getContext(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    });
  },

  // 设置请求上下文
  setRequestContext: (req: Request) => {
    logContext.setRequestContext(req);
  },

  // 添加自定义上下文
  addContext: (key: string, value: any) => {
    logContext.addContext(key, value);
  },

  // 清除上下文
  clearContext: () => {
    logContext.clear();
  },

  // 获取原始logger（用于特殊场景）
  getLogger: () => logger
};

// 日志分析工具
export const logAnalyzer = {
  // 分析错误趋势
  async analyzeErrors(hours: number = 24): Promise<any> {
    const logFile = path.join(logsDir, 'error.log');
    if (!fs.existsSync(logFile)) return null;

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const errors: Record<string, number> = {};
    
    lines.forEach(line => {
      try {
        const log = JSON.parse(line);
        const timestamp = new Date(log.timestamp).getTime();
        
        if (timestamp > cutoff) {
          const key = log.error?.name || log.message;
          errors[key] = (errors[key] || 0) + 1;
        }
      } catch (e) {
        // 忽略解析错误
      }
    });

    return {
      timeRange: `Last ${hours} hours`,
      totalErrors: Object.values(errors).reduce((sum, count) => sum + count, 0),
      errorTypes: Object.entries(errors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([type, count]) => ({ type, count }))
    };
  },

  // 分析性能指标
  async analyzePerformance(operation?: string): Promise<any> {
    const logFile = path.join(logsDir, 'app.log');
    if (!fs.existsSync(logFile)) return null;

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const metrics: number[] = [];
    
    lines.forEach(line => {
      try {
        const log = JSON.parse(line);
        if (log.message?.startsWith('Performance:') && 
            (!operation || log.operation === operation)) {
          metrics.push(log.duration);
        }
      } catch (e) {
        // 忽略解析错误
      }
    });

    if (metrics.length === 0) return null;

    metrics.sort((a, b) => a - b);
    
    return {
      operation: operation || 'all',
      count: metrics.length,
      min: metrics[0],
      max: metrics[metrics.length - 1],
      avg: metrics.reduce((sum, val) => sum + val, 0) / metrics.length,
      p50: metrics[Math.floor(metrics.length * 0.5)],
      p90: metrics[Math.floor(metrics.length * 0.9)],
      p95: metrics[Math.floor(metrics.length * 0.95)],
      p99: metrics[Math.floor(metrics.length * 0.99)]
    };
  },

  // 生成日志报告
  async generateReport(): Promise<string> {
    const errors = await this.analyzeErrors();
    const performance = await this.analyzePerformance();
    
    let report = '# 日志分析报告\n\n';
    report += `生成时间: ${new Date().toISOString()}\n\n`;
    
    if (errors) {
      report += '## 错误分析\n';
      report += `- 总错误数: ${errors.totalErrors}\n`;
      report += `- 时间范围: ${errors.timeRange}\n`;
      report += '\n### 错误类型分布\n';
      errors.errorTypes.forEach(({ type, count }) => {
        report += `- ${type}: ${count}次\n`;
      });
    }
    
    if (performance) {
      report += '\n## 性能分析\n';
      report += `- 操作: ${performance.operation}\n`;
      report += `- 样本数: ${performance.count}\n`;
      report += `- 最小值: ${performance.min}ms\n`;
      report += `- 最大值: ${performance.max}ms\n`;
      report += `- 平均值: ${performance.avg.toFixed(2)}ms\n`;
      report += `- P50: ${performance.p50}ms\n`;
      report += `- P90: ${performance.p90}ms\n`;
      report += `- P95: ${performance.p95}ms\n`;
      report += `- P99: ${performance.p99}ms\n`;
    }
    
    return report;
  }
};

export default structuredLogger;

