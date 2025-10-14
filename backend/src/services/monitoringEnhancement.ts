/**
 * 增强的监控与告警服务
 * 提供实时监控、智能告警、自动化运维等功能
 */

import { prisma } from '../lib/prisma';
import { cache } from '../lib/cache';
import { logger } from '../utils/monitoring';
import { errorNotifier } from './errorNotificationService';
import * as os from 'os';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 监控指标类型
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    rxBytes: number;
    txBytes: number;
    connections: number;
  };
  process: {
    uptime: number;
    pid: number;
    memory: number;
    cpu: number;
  };
}

interface ApplicationMetrics {
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
    poolUtilization: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictionRate: number;
    operations: number;
  };
  queue: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // 持续时间（秒）
  severity: 'info' | 'warning' | 'error' | 'critical';
  actions: AlertAction[];
  cooldown: number; // 冷却时间（秒）
  enabled: boolean;
}

interface AlertAction {
  type: 'email' | 'webhook' | 'restart' | 'scale' | 'custom';
  config: any;
}

interface Alert {
  ruleId: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  message: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export class MonitoringService {
  private static metrics: Map<string, any[]> = new Map();
  private static alerts: Map<string, Alert> = new Map();
  private static rules: AlertRule[] = [];
  private static lastAlertTime: Map<string, number> = new Map();
  
  /**
   * 初始化监控服务
   */
  static async initialize() {
    // 加载告警规则
    await this.loadAlertRules();
    
    // 启动监控循环
    this.startMonitoring();
    
    // 启动自动清理
    this.startCleanup();
    
    logger.info('Monitoring service initialized');
  }
  
  /**
   * 收集系统指标
   */
  static async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // CPU使用率
    const cpuUsage = await this.getCPUUsage();
    
    // 磁盘使用情况
    const diskUsage = await this.getDiskUsage();
    
    // 网络统计
    const networkStats = await this.getNetworkStats();
    
    // 进程信息
    const processInfo = {
      uptime: process.uptime(),
      pid: process.pid,
      memory: process.memoryUsage().rss / 1024 / 1024, // MB
      cpu: process.cpuUsage().user / 1000000 // 秒
    };
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024), // MB
        used: Math.round(usedMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        percentage: Math.round((usedMemory / totalMemory) * 100)
      },
      disk: diskUsage,
      network: networkStats,
      process: processInfo
    };
  }
  
  /**
   * 收集应用指标
   */
  static async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    // 数据库指标
    const dbMetrics = await this.getDatabaseMetrics();
    
    // API指标
    const apiMetrics = await this.getAPIMetrics();
    
    // 缓存指标
    const cacheMetrics = await this.getCacheMetrics();
    
    // 队列指标
    const queueMetrics = await this.getQueueMetrics();
    
    return {
      database: dbMetrics,
      api: apiMetrics,
      cache: cacheMetrics,
      queue: queueMetrics
    };
  }
  
  /**
   * 记录指标
   */
  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const timestamp = Date.now();
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push({
      timestamp,
      value,
      tags
    });
    
    // 保留最近1小时的数据
    const oneHourAgo = timestamp - 60 * 60 * 1000;
    const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
    this.metrics.set(name, filtered);
    
    // 检查告警规则
    this.checkAlertRules(name, value);
  }
  
  /**
   * 获取指标统计
   */
  static getMetricStats(name: string, duration: number = 300000): {
    min: number;
    max: number;
    avg: number;
    current: number;
    count: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const now = Date.now();
    const filtered = metrics.filter(m => m.timestamp > now - duration);
    
    if (filtered.length === 0) {
      return null;
    }
    
    const values = filtered.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      current: values[values.length - 1],
      count: values.length
    };
  }
  
  /**
   * 创建告警规则
   */
  static createAlertRule(rule: AlertRule) {
    this.rules.push(rule);
    logger.info(`Alert rule created: ${rule.name}`);
  }
  
  /**
   * 检查告警规则
   */
  private static checkAlertRules(metric: string, value: number) {
    const now = Date.now();
    
    for (const rule of this.rules) {
      if (!rule.enabled || rule.metric !== metric) {
        continue;
      }
      
      // 检查冷却时间
      const lastAlert = this.lastAlertTime.get(rule.id) || 0;
      if (now - lastAlert < rule.cooldown * 1000) {
        continue;
      }
      
      // 检查条件
      const triggered = this.evaluateCondition(value, rule.condition, rule.threshold);
      
      if (triggered) {
        // 检查持续时间
        const stats = this.getMetricStats(metric, rule.duration * 1000);
        if (!stats) continue;
        
        const allValuesMeetCondition = this.checkDuration(
          metric,
          rule.condition,
          rule.threshold,
          rule.duration
        );
        
        if (allValuesMeetCondition) {
          this.triggerAlert(rule, metric, value);
        }
      } else {
        // 检查是否需要解除告警
        this.resolveAlert(rule.id);
      }
    }
  }
  
  /**
   * 触发告警
   */
  private static async triggerAlert(rule: AlertRule, metric: string, value: number) {
    const alert: Alert = {
      ruleId: rule.id,
      timestamp: new Date(),
      metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: `${rule.name}: ${metric} is ${value} (threshold: ${rule.threshold})`,
      resolved: false
    };
    
    this.alerts.set(rule.id, alert);
    this.lastAlertTime.set(rule.id, Date.now());
    
    logger.warn(`Alert triggered: ${alert.message}`, {
      severity: rule.severity,
      metric,
      value,
      threshold: rule.threshold
    });
    
    // 执行告警动作
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert);
    }
  }
  
  /**
   * 解除告警
   */
  private static resolveAlert(ruleId: string) {
    const alert = this.alerts.get(ruleId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      logger.info(`Alert resolved: ${alert.message}`);
      
      // 发送解除通知
      errorNotifier.notifyWarning(
        `告警已解除: ${alert.message}`,
        { alert }
      );
    }
  }
  
  /**
   * 执行告警动作
   */
  private static async executeAlertAction(action: AlertAction, alert: Alert) {
    try {
      switch (action.type) {
        case 'email':
          await errorNotifier.notifyError({
            type: this.getSeverityType(alert.severity),
            message: alert.message,
            details: alert
          });
          break;
          
        case 'webhook':
          await this.sendWebhook(action.config.url, alert);
          break;
          
        case 'restart':
          if (alert.severity === 'critical') {
            await this.restartService(action.config.service);
          }
          break;
          
        case 'scale':
          await this.scaleService(action.config.service, action.config.instances);
          break;
          
        case 'custom':
          await this.executeCustomAction(action.config.script, alert);
          break;
      }
    } catch (error) {
      logger.error(`Failed to execute alert action: ${error}`);
    }
  }
  
  /**
   * 健康检查端点
   */
  static async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, any>;
    metrics: {
      system: SystemMetrics;
      application: ApplicationMetrics;
    };
  }> {
    const checks: Record<string, any> = {};
    
    // 数据库检查
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy' };
    } catch (error) {
      checks.database = { status: 'unhealthy', error: error };
    }
    
    // 缓存检查
    try {
      await cache.set('health', 'check', 'ok', { ttl: 10 });
      const value = await cache.get('health', 'check');
      checks.cache = { status: value === 'ok' ? 'healthy' : 'unhealthy' };
    } catch (error) {
      checks.cache = { status: 'unhealthy', error: error };
    }
    
    // 收集指标
    const [system, application] = await Promise.all([
      this.collectSystemMetrics(),
      this.collectApplicationMetrics()
    ]);
    
    // 判断整体状态
    const unhealthyChecks = Object.values(checks).filter(
      c => c.status === 'unhealthy'
    ).length;
    
    const status = unhealthyChecks === 0 
      ? 'healthy' 
      : unhealthyChecks === 1 
      ? 'degraded' 
      : 'unhealthy';
    
    return {
      status,
      checks,
      metrics: { system, application }
    };
  }
  
  /**
   * 自动恢复机制
   */
  static async attemptAutoRecovery(issue: string): Promise<boolean> {
    logger.info(`Attempting auto-recovery for: ${issue}`);
    
    try {
      switch (issue) {
        case 'high_memory':
          // 清理缓存
          await cache.flush();
          // 触发垃圾回收
          if (global.gc) {
            global.gc();
          }
          return true;
          
        case 'database_connection':
          // 重连数据库
          await prisma.$disconnect();
          await prisma.$connect();
          return true;
          
        case 'high_cpu':
          // 降低并发限制
          // 这里需要具体的业务逻辑
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Auto-recovery failed: ${error}`);
      return false;
    }
  }
  
  // 私有辅助方法
  
  private static async loadAlertRules() {
    // 默认告警规则
    this.rules = [
      {
        id: 'cpu_high',
        name: 'CPU使用率过高',
        metric: 'system.cpu.usage',
        condition: 'gt',
        threshold: 80,
        duration: 300,
        severity: 'warning',
        actions: [{ type: 'email', config: {} }],
        cooldown: 600,
        enabled: true
      },
      {
        id: 'memory_high',
        name: '内存使用率过高',
        metric: 'system.memory.percentage',
        condition: 'gt',
        threshold: 90,
        duration: 300,
        severity: 'error',
        actions: [
          { type: 'email', config: {} },
          { type: 'custom', config: { script: 'clear_cache.sh' } }
        ],
        cooldown: 600,
        enabled: true
      },
      {
        id: 'disk_full',
        name: '磁盘空间不足',
        metric: 'system.disk.percentage',
        condition: 'gt',
        threshold: 95,
        duration: 60,
        severity: 'critical',
        actions: [
          { type: 'email', config: {} },
          { type: 'custom', config: { script: 'cleanup_disk.sh' } }
        ],
        cooldown: 3600,
        enabled: true
      },
      {
        id: 'api_slow',
        name: 'API响应缓慢',
        metric: 'api.response_time',
        condition: 'gt',
        threshold: 1000,
        duration: 300,
        severity: 'warning',
        actions: [{ type: 'email', config: {} }],
        cooldown: 600,
        enabled: true
      },
      {
        id: 'error_rate_high',
        name: '错误率过高',
        metric: 'api.error_rate',
        condition: 'gt',
        threshold: 5,
        duration: 300,
        severity: 'error',
        actions: [
          { type: 'email', config: {} },
          { type: 'webhook', config: { url: process.env.ALERT_WEBHOOK_URL } }
        ],
        cooldown: 600,
        enabled: true
      }
    ];
  }
  
  private static startMonitoring() {
    // 每分钟收集一次指标
    setInterval(async () => {
      try {
        const systemMetrics = await this.collectSystemMetrics();
        const appMetrics = await this.collectApplicationMetrics();
        
        // 记录系统指标
        this.recordMetric('system.cpu.usage', systemMetrics.cpu.usage);
        this.recordMetric('system.memory.percentage', systemMetrics.memory.percentage);
        this.recordMetric('system.disk.percentage', systemMetrics.disk.percentage);
        
        // 记录应用指标
        this.recordMetric('api.response_time', appMetrics.api.averageResponseTime);
        this.recordMetric('api.error_rate', appMetrics.api.errorRate);
        this.recordMetric('database.connections', appMetrics.database.connections);
        this.recordMetric('cache.hit_rate', appMetrics.cache.hitRate);
        
        // 保存到缓存供仪表板使用
        await cache.set('monitoring', 'latest_metrics', {
          system: systemMetrics,
          application: appMetrics,
          timestamp: new Date()
        }, { ttl: 120 });
      } catch (error) {
        logger.error(`Monitoring error: ${error}`);
      }
    }, 60000);
  }
  
  private static startCleanup() {
    // 每小时清理一次旧数据
    setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      // 清理指标数据
      for (const [name, metrics] of this.metrics) {
        const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
        this.metrics.set(name, filtered);
      }
      
      // 清理已解决的告警
      for (const [id, alert] of this.alerts) {
        if (alert.resolved && alert.resolvedAt) {
          const resolvedTime = new Date(alert.resolvedAt).getTime();
          if (Date.now() - resolvedTime > 24 * 60 * 60 * 1000) {
            this.alerts.delete(id);
          }
        }
      }
    }, 60 * 60 * 1000);
  }
  
  private static async getCPUUsage(): Promise<number> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return usage;
  }
  
  private static async getDiskUsage(): Promise<{
    total: number;
    used: number;
    free: number;
    percentage: number;
  }> {
    try {
      const { stdout } = await execAsync('df -k / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      const total = parseInt(parts[1]) * 1024;
      const used = parseInt(parts[2]) * 1024;
      const free = parseInt(parts[3]) * 1024;
      const percentage = parseInt(parts[4]);
      
      return {
        total: Math.round(total / 1024 / 1024),
        used: Math.round(used / 1024 / 1024),
        free: Math.round(free / 1024 / 1024),
        percentage
      };
    } catch (error) {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }
  
  private static async getNetworkStats(): Promise<{
    rxBytes: number;
    txBytes: number;
    connections: number;
  }> {
    // 简化实现，实际应该读取网络接口统计
    return {
      rxBytes: 0,
      txBytes: 0,
      connections: 0
    };
  }
  
  private static async getDatabaseMetrics() {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as connections,
          SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active
        FROM information_schema.processlist
        WHERE db = DATABASE()
      `;
      
      return {
        connections: result[0]?.connections || 0,
        activeQueries: result[0]?.active || 0,
        slowQueries: 0,
        poolUtilization: 0
      };
    } catch (error) {
      return {
        connections: 0,
        activeQueries: 0,
        slowQueries: 0,
        poolUtilization: 0
      };
    }
  }
  
  private static async getAPIMetrics() {
    const stats = await cache.get('api', 'stats') || {
      requests: 0,
      errors: 0,
      totalTime: 0
    };
    
    const requestsPerMinute = stats.requests;
    const averageResponseTime = stats.requests > 0 
      ? stats.totalTime / stats.requests 
      : 0;
    const errorRate = stats.requests > 0 
      ? (stats.errors / stats.requests) * 100 
      : 0;
    
    return {
      requestsPerMinute,
      averageResponseTime,
      errorRate,
      activeConnections: 0
    };
  }
  
  private static async getCacheMetrics() {
    const stats = await cache.getStats();
    
    return {
      hitRate: stats?.hitRate || 0,
      memoryUsage: stats?.memoryUsage || 0,
      evictionRate: stats?.evictionRate || 0,
      operations: stats?.operations || 0
    };
  }
  
  private static async getQueueMetrics() {
    // 如果使用队列系统，这里应该返回实际的队列指标
    return {
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0
    };
  }
  
  private static evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }
  
  private static checkDuration(
    metric: string,
    condition: string,
    threshold: number,
    duration: number
  ): boolean {
    const metrics = this.metrics.get(metric);
    if (!metrics) return false;
    
    const now = Date.now();
    const startTime = now - duration * 1000;
    const relevantMetrics = metrics.filter(m => m.timestamp >= startTime);
    
    if (relevantMetrics.length === 0) return false;
    
    return relevantMetrics.every(m => 
      this.evaluateCondition(m.value, condition, threshold)
    );
  }
  
  private static getSeverityType(severity: string): 'CRITICAL' | 'ERROR' | 'WARNING' {
    switch (severity) {
      case 'critical': return 'CRITICAL';
      case 'error': return 'ERROR';
      default: return 'WARNING';
    }
  }
  
  private static async sendWebhook(url: string, data: any) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      logger.error(`Failed to send webhook: ${error}`);
    }
  }
  
  private static async restartService(service: string) {
    logger.info(`Restarting service: ${service}`);
    try {
      await execAsync(`pm2 restart ${service}`);
    } catch (error) {
      logger.error(`Failed to restart service: ${error}`);
    }
  }
  
  private static async scaleService(service: string, instances: number) {
    logger.info(`Scaling service ${service} to ${instances} instances`);
    try {
      await execAsync(`pm2 scale ${service} ${instances}`);
    } catch (error) {
      logger.error(`Failed to scale service: ${error}`);
    }
  }
  
  private static async executeCustomAction(script: string, alert: Alert) {
    logger.info(`Executing custom action: ${script}`);
    try {
      const env = {
        ...process.env,
        ALERT_METRIC: alert.metric,
        ALERT_VALUE: alert.value.toString(),
        ALERT_THRESHOLD: alert.threshold.toString(),
        ALERT_SEVERITY: alert.severity
      };
      
      await execAsync(script, { env });
    } catch (error) {
      logger.error(`Failed to execute custom action: ${error}`);
    }
  }
}
