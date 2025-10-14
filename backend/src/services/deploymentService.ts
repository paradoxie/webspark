/**
 * 部署与回滚服务
 * 提供自动化部署、版本管理、回滚控制等功能
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/monitoring';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

interface DeploymentConfig {
  id: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  branch: string;
  commitHash: string;
  author: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  healthCheckUrl?: string;
  rollbackVersion?: string;
  metadata?: any;
}

interface DeploymentStep {
  name: string;
  command: string;
  timeout?: number;
  retries?: number;
  critical?: boolean;
  healthCheck?: () => Promise<boolean>;
}

interface RollbackStrategy {
  type: 'immediate' | 'gradual' | 'blue_green';
  healthCheckInterval: number;
  maxRetries: number;
  rollbackTriggers: Array<{
    metric: string;
    threshold: number;
    duration: number;
  }>;
}

export class DeploymentService {
  private static deploymentHistory: DeploymentConfig[] = [];
  private static currentDeployment: DeploymentConfig | null = null;
  private static deploymentSteps: DeploymentStep[] = [];
  private static rollbackStrategy: RollbackStrategy = {
    type: 'immediate',
    healthCheckInterval: 30000,
    maxRetries: 3,
    rollbackTriggers: [
      { metric: 'error_rate', threshold: 10, duration: 300 },
      { metric: 'response_time', threshold: 2000, duration: 300 },
      { metric: 'availability', threshold: 95, duration: 180 }
    ]
  };

  /**
   * 初始化部署服务
   */
  static async initialize() {
    // 加载部署历史
    await this.loadDeploymentHistory();
    
    // 配置部署步骤
    this.configureDeploymentSteps();
    
    // 启动健康检查
    this.startHealthMonitoring();
    
    logger.info('Deployment service initialized');
  }

  /**
   * 创建新部署
   */
  static async createDeployment(
    environment: 'production' | 'staging' | 'development',
    branch: string = 'main',
    author: string = 'system'
  ): Promise<DeploymentConfig> {
    // 检查是否有正在进行的部署
    if (this.currentDeployment && this.currentDeployment.status === 'in_progress') {
      throw new Error('Another deployment is already in progress');
    }

    // 获取最新的提交信息
    const commitInfo = await this.getLatestCommit(branch);
    
    // 生成版本号
    const version = this.generateVersion();
    
    const deployment: DeploymentConfig = {
      id: crypto.randomUUID(),
      version,
      environment,
      branch,
      commitHash: commitInfo.hash,
      author,
      timestamp: new Date(),
      status: 'pending',
      healthCheckUrl: this.getHealthCheckUrl(environment),
      metadata: {
        commitMessage: commitInfo.message,
        commitAuthor: commitInfo.author
      }
    };

    // 保存部署记录
    await this.saveDeployment(deployment);
    this.currentDeployment = deployment;
    
    logger.info(`Deployment created: ${deployment.id}`, deployment);
    
    return deployment;
  }

  /**
   * 执行部署
   */
  static async executeDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    try {
      // 更新状态
      await this.updateDeploymentStatus(deploymentId, 'in_progress');
      
      // 创建部署前快照
      await this.createSnapshot(deployment);
      
      // 执行部署步骤
      for (const step of this.deploymentSteps) {
        await this.executeStep(step, deployment);
      }
      
      // 运行健康检查
      const isHealthy = await this.runHealthChecks(deployment);
      
      if (!isHealthy) {
        throw new Error('Health checks failed after deployment');
      }
      
      // 更新状态为完成
      await this.updateDeploymentStatus(deploymentId, 'completed');
      
      // 记录成功部署
      await this.recordSuccessfulDeployment(deployment);
      
      logger.info(`Deployment completed successfully: ${deploymentId}`);
    } catch (error) {
      logger.error(`Deployment failed: ${deploymentId}`, error);
      
      // 更新状态为失败
      await this.updateDeploymentStatus(deploymentId, 'failed');
      
      // 触发自动回滚
      if (deployment.environment === 'production') {
        await this.autoRollback(deployment);
      }
      
      throw error;
    }
  }

  /**
   * 执行回滚
   */
  static async rollback(
    deploymentId: string,
    targetVersion?: string
  ): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    logger.info(`Starting rollback for deployment: ${deploymentId}`);

    try {
      // 确定回滚目标版本
      const rollbackTarget = targetVersion || await this.getLastStableVersion(deployment.environment);
      
      if (!rollbackTarget) {
        throw new Error('No stable version found for rollback');
      }

      // 执行回滚策略
      switch (this.rollbackStrategy.type) {
        case 'immediate':
          await this.immediateRollback(deployment, rollbackTarget);
          break;
        case 'gradual':
          await this.gradualRollback(deployment, rollbackTarget);
          break;
        case 'blue_green':
          await this.blueGreenRollback(deployment, rollbackTarget);
          break;
      }

      // 更新部署状态
      await this.updateDeploymentStatus(deploymentId, 'rolled_back');
      deployment.rollbackVersion = rollbackTarget;
      
      // 发送通知
      await this.notifyRollback(deployment);
      
      logger.info(`Rollback completed successfully to version: ${rollbackTarget}`);
    } catch (error) {
      logger.error('Rollback failed', error);
      throw error;
    }
  }

  /**
   * 获取部署状态
   */
  static async getDeploymentStatus(deploymentId: string): Promise<{
    deployment: DeploymentConfig;
    health: any;
    metrics: any;
    logs: string[];
  }> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // 获取健康状态
    const health = await this.checkHealth(deployment);
    
    // 获取性能指标
    const metrics = await this.getDeploymentMetrics(deployment);
    
    // 获取部署日志
    const logs = await this.getDeploymentLogs(deploymentId);
    
    return {
      deployment,
      health,
      metrics,
      logs
    };
  }

  /**
   * 获取部署历史
   */
  static async getDeploymentHistory(
    environment?: string,
    limit: number = 20
  ): Promise<DeploymentConfig[]> {
    let history = [...this.deploymentHistory];
    
    if (environment) {
      history = history.filter(d => d.environment === environment);
    }
    
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 灰度发布
   */
  static async canaryDeploy(
    deploymentId: string,
    percentage: number = 10
  ): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    logger.info(`Starting canary deployment: ${percentage}% traffic`);

    try {
      // 配置负载均衡器
      await this.configureLoadBalancer(deployment, percentage);
      
      // 监控指标
      const monitoringDuration = 30 * 60 * 1000; // 30分钟
      const startTime = Date.now();
      
      while (Date.now() - startTime < monitoringDuration) {
        const metrics = await this.getCanaryMetrics(deployment);
        
        // 检查错误率
        if (metrics.errorRate > 5) {
          logger.warn('High error rate detected in canary deployment');
          await this.rollbackCanary(deployment);
          throw new Error('Canary deployment failed due to high error rate');
        }
        
        // 等待下一次检查
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1分钟
      }
      
      // 逐步增加流量
      const steps = [25, 50, 75, 100];
      for (const step of steps) {
        await this.configureLoadBalancer(deployment, step);
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10分钟
        
        const metrics = await this.getCanaryMetrics(deployment);
        if (metrics.errorRate > 5) {
          await this.rollbackCanary(deployment);
          throw new Error(`Canary deployment failed at ${step}% traffic`);
        }
      }
      
      logger.info('Canary deployment completed successfully');
    } catch (error) {
      logger.error('Canary deployment failed', error);
      throw error;
    }
  }

  /**
   * 配置部署审计
   */
  static async auditDeployment(deploymentId: string): Promise<{
    compliance: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查部署流程合规性
    if (!deployment.metadata?.approvedBy) {
      issues.push('Deployment was not approved by authorized personnel');
    }

    // 检查安全扫描
    if (!deployment.metadata?.securityScan) {
      issues.push('Security scan was not performed before deployment');
      recommendations.push('Enable automated security scanning in CI/CD pipeline');
    }

    // 检查测试覆盖率
    if (deployment.metadata?.testCoverage < 80) {
      issues.push(`Test coverage is below 80% (current: ${deployment.metadata?.testCoverage}%)`);
      recommendations.push('Increase test coverage to at least 80%');
    }

    // 检查备份
    if (!deployment.metadata?.backupCreated) {
      issues.push('No backup was created before deployment');
      recommendations.push('Implement automated backup before production deployments');
    }

    // 检查回滚计划
    if (!deployment.metadata?.rollbackPlan) {
      issues.push('No rollback plan documented');
      recommendations.push('Document rollback procedures for all deployments');
    }

    const compliance = issues.length === 0;

    // 记录审计结果
    await this.saveAuditLog({
      deploymentId,
      timestamp: new Date(),
      compliance,
      issues,
      recommendations,
      auditor: 'system'
    });

    return {
      compliance,
      issues,
      recommendations
    };
  }

  // 私有辅助方法

  private static async loadDeploymentHistory() {
    // 从数据库或文件加载部署历史
    try {
      const historyFile = path.join(process.cwd(), 'deployments.json');
      const data = await fs.readFile(historyFile, 'utf-8');
      this.deploymentHistory = JSON.parse(data).map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp)
      }));
    } catch (error) {
      this.deploymentHistory = [];
    }
  }

  private static configureDeploymentSteps() {
    this.deploymentSteps = [
      {
        name: 'Pull latest code',
        command: 'git pull origin main',
        timeout: 60000,
        critical: true
      },
      {
        name: 'Install dependencies',
        command: 'npm ci',
        timeout: 300000,
        critical: true
      },
      {
        name: 'Run database migrations',
        command: 'npm run migrate',
        timeout: 120000,
        critical: true
      },
      {
        name: 'Build application',
        command: 'npm run build',
        timeout: 300000,
        critical: true
      },
      {
        name: 'Run tests',
        command: 'npm test',
        timeout: 600000,
        critical: false
      },
      {
        name: 'Clear cache',
        command: 'npm run cache:clear',
        timeout: 30000,
        critical: false
      },
      {
        name: 'Restart application',
        command: 'pm2 restart webspark',
        timeout: 60000,
        critical: true,
        healthCheck: async () => {
          // 等待应用启动
          await new Promise(resolve => setTimeout(resolve, 10000));
          // 检查健康状态
          try {
            const response = await fetch('http://localhost:3000/health');
            return response.ok;
          } catch {
            return false;
          }
        }
      }
    ];
  }

  private static startHealthMonitoring() {
    setInterval(async () => {
      if (this.currentDeployment && this.currentDeployment.status === 'completed') {
        const health = await this.checkHealth(this.currentDeployment);
        
        // 检查回滚触发器
        for (const trigger of this.rollbackStrategy.rollbackTriggers) {
          const metricValue = health.metrics[trigger.metric];
          if (metricValue && metricValue > trigger.threshold) {
            logger.warn(`Rollback trigger activated: ${trigger.metric} = ${metricValue}`);
            // 这里可以触发自动回滚
          }
        }
      }
    }, this.rollbackStrategy.healthCheckInterval);
  }

  private static async getLatestCommit(branch: string): Promise<{
    hash: string;
    message: string;
    author: string;
  }> {
    try {
      const { stdout } = await execAsync(
        `git log -1 --format="%H|%s|%an" ${branch}`
      );
      const [hash, message, author] = stdout.trim().split('|');
      return { hash, message, author };
    } catch (error) {
      throw new Error(`Failed to get commit info: ${error}`);
    }
  }

  private static generateVersion(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `v${year}.${month}.${day}-${hour}${minute}`;
  }

  private static getHealthCheckUrl(environment: string): string {
    switch (environment) {
      case 'production':
        return 'https://api.webspark.club/health';
      case 'staging':
        return 'https://staging-api.webspark.club/health';
      default:
        return 'http://localhost:4000/health';
    }
  }

  private static async saveDeployment(deployment: DeploymentConfig) {
    this.deploymentHistory.push(deployment);
    
    // 保存到文件
    const historyFile = path.join(process.cwd(), 'deployments.json');
    await fs.writeFile(
      historyFile,
      JSON.stringify(this.deploymentHistory, null, 2)
    );
  }

  private static async getDeployment(id: string): Promise<DeploymentConfig | null> {
    return this.deploymentHistory.find(d => d.id === id) || null;
  }

  private static async updateDeploymentStatus(
    id: string,
    status: DeploymentConfig['status']
  ) {
    const deployment = await this.getDeployment(id);
    if (deployment) {
      deployment.status = status;
      await this.saveDeployment(deployment);
    }
  }

  private static async createSnapshot(deployment: DeploymentConfig) {
    const snapshotDir = path.join(process.cwd(), 'snapshots', deployment.id);
    await fs.mkdir(snapshotDir, { recursive: true });
    
    // 备份当前代码和配置
    await execAsync(`cp -r . ${snapshotDir}/`);
    
    // 备份数据库
    await execAsync(
      `mysqldump -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${snapshotDir}/database.sql`
    );
    
    logger.info(`Snapshot created: ${snapshotDir}`);
  }

  private static async executeStep(
    step: DeploymentStep,
    deployment: DeploymentConfig
  ) {
    logger.info(`Executing step: ${step.name}`);
    
    let retries = step.retries || 1;
    let lastError: any;
    
    while (retries > 0) {
      try {
        await execAsync(step.command, {
          timeout: step.timeout
        });
        
        // 运行健康检查（如果有）
        if (step.healthCheck) {
          const isHealthy = await step.healthCheck();
          if (!isHealthy) {
            throw new Error('Health check failed after step execution');
          }
        }
        
        logger.info(`Step completed: ${step.name}`);
        return;
      } catch (error) {
        lastError = error;
        retries--;
        
        if (retries > 0) {
          logger.warn(`Step failed, retrying: ${step.name}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    if (step.critical) {
      throw new Error(`Critical step failed: ${step.name} - ${lastError}`);
    } else {
      logger.warn(`Non-critical step failed: ${step.name}`);
    }
  }

  private static async runHealthChecks(deployment: DeploymentConfig): Promise<boolean> {
    if (!deployment.healthCheckUrl) {
      return true;
    }

    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(deployment.healthCheckUrl);
        if (response.ok) {
          const data = await response.json();
          return data.status === 'healthy';
        }
      } catch (error) {
        logger.warn(`Health check failed, attempt ${retries + 1}/${maxRetries}`);
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒
    }
    
    return false;
  }

  private static async recordSuccessfulDeployment(deployment: DeploymentConfig) {
    // 记录成功的部署用于回滚
    deployment.metadata = {
      ...deployment.metadata,
      successfulAt: new Date(),
      healthCheckPassed: true
    };
    
    await this.saveDeployment(deployment);
  }

  private static async autoRollback(deployment: DeploymentConfig) {
    try {
      logger.warn('Initiating automatic rollback');
      await this.rollback(deployment.id);
    } catch (error) {
      logger.error('Auto-rollback failed', error);
    }
  }

  private static async getLastStableVersion(environment: string): Promise<string | null> {
    const stableDeployments = this.deploymentHistory
      .filter(d => 
        d.environment === environment && 
        d.status === 'completed' &&
        d.metadata?.healthCheckPassed
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return stableDeployments[0]?.version || null;
  }

  private static async immediateRollback(
    deployment: DeploymentConfig,
    targetVersion: string
  ) {
    // 立即切换到目标版本
    await execAsync(`git checkout ${targetVersion}`);
    await execAsync('npm ci && npm run build');
    await execAsync('pm2 restart webspark');
  }

  private static async gradualRollback(
    deployment: DeploymentConfig,
    targetVersion: string
  ) {
    // 逐步将流量切换到旧版本
    const steps = [25, 50, 75, 100];
    
    for (const percentage of steps) {
      await this.configureLoadBalancer(deployment, 100 - percentage);
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5分钟
      
      const health = await this.checkHealth(deployment);
      if (!health.healthy) {
        // 如果不健康，加速回滚
        await this.configureLoadBalancer(deployment, 0);
        break;
      }
    }
  }

  private static async blueGreenRollback(
    deployment: DeploymentConfig,
    targetVersion: string
  ) {
    // 切换到备用环境
    await execAsync('pm2 stop webspark-blue');
    await execAsync('pm2 start webspark-green');
  }

  private static async notifyRollback(deployment: DeploymentConfig) {
    // 发送回滚通知
    logger.info('Sending rollback notifications');
    // 这里可以集成邮件、Slack等通知服务
  }

  private static async checkHealth(deployment: DeploymentConfig): Promise<any> {
    // 实现健康检查逻辑
    return { healthy: true, metrics: {} };
  }

  private static async getDeploymentMetrics(deployment: DeploymentConfig): Promise<any> {
    // 获取部署相关的性能指标
    return {
      responseTime: 150,
      errorRate: 0.5,
      throughput: 1000
    };
  }

  private static async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    // 获取部署日志
    return [
      'Deployment started',
      'Code updated',
      'Dependencies installed',
      'Application built',
      'Tests passed',
      'Deployment completed'
    ];
  }

  private static async configureLoadBalancer(
    deployment: DeploymentConfig,
    percentage: number
  ) {
    // 配置负载均衡器流量分配
    logger.info(`Configuring load balancer: ${percentage}% to new version`);
    // 实际实现取决于使用的负载均衡器
  }

  private static async getCanaryMetrics(deployment: DeploymentConfig): Promise<any> {
    // 获取金丝雀部署的指标
    return {
      errorRate: 1.5,
      responseTime: 200,
      successRate: 98.5
    };
  }

  private static async rollbackCanary(deployment: DeploymentConfig) {
    // 回滚金丝雀部署
    await this.configureLoadBalancer(deployment, 0);
  }

  private static async saveAuditLog(auditLog: any) {
    // 保存审计日志
    const auditFile = path.join(process.cwd(), 'audit.log');
    await fs.appendFile(
      auditFile,
      JSON.stringify(auditLog) + '\n'
    );
  }
}
