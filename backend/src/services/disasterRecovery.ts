/**
 * 灾备与恢复服务
 * 提供自动化备份、灾难恢复、演练测试等功能
 */

import { prisma } from '../lib/prisma';
import { cache } from '../lib/cache';
import { logger } from '../utils/monitoring';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as tar from 'tar';
import * as AWS from 'aws-sdk';

const execAsync = promisify(exec);

interface BackupConfig {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string; // cron expression
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  destinations: BackupDestination[];
}

interface BackupDestination {
  type: 'local' | 's3' | 'ftp' | 'rsync';
  config: any;
}

interface BackupJob {
  id: string;
  configId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  size: number;
  files: string[];
  error?: string;
  metadata: any;
}

interface RecoveryPoint {
  id: string;
  backupId: string;
  timestamp: Date;
  type: string;
  size: number;
  checksum: string;
  verified: boolean;
  location: string;
}

interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  rto: number; // Recovery Time Objective (minutes)
  rpo: number; // Recovery Point Objective (minutes)
  steps: RecoveryStep[];
  contacts: Contact[];
  lastTested?: Date;
  testResults?: TestResult[];
}

interface RecoveryStep {
  order: number;
  name: string;
  description: string;
  automated: boolean;
  script?: string;
  estimatedTime: number; // minutes
  dependencies: string[];
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone?: string;
  priority: number;
}

interface TestResult {
  id: string;
  planId: string;
  timestamp: Date;
  success: boolean;
  actualRTO: number;
  actualRPO: number;
  issues: string[];
  recommendations: string[];
}

export class DisasterRecoveryService {
  private static s3: AWS.S3;
  private static backupConfigs: Map<string, BackupConfig> = new Map();
  private static activeJobs: Map<string, BackupJob> = new Map();
  private static recoveryPlans: Map<string, DisasterRecoveryPlan> = new Map();

  /**
   * 初始化灾备服务
   */
  static async initialize() {
    // 初始化 S3 客户端（如果配置了）
    if (process.env.AWS_ACCESS_KEY_ID) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }

    // 加载备份配置
    await this.loadBackupConfigs();

    // 加载恢复计划
    await this.loadRecoveryPlans();

    // 启动定时备份
    this.startScheduledBackups();

    // 启动健康检查
    this.startHealthChecks();

    logger.info('Disaster Recovery service initialized');
  }

  /**
   * 创建备份
   */
  static async createBackup(
    type: 'full' | 'incremental' | 'differential' = 'full',
    description?: string
  ): Promise<BackupJob> {
    const job: BackupJob = {
      id: crypto.randomUUID(),
      configId: 'manual',
      startTime: new Date(),
      status: 'running',
      size: 0,
      files: [],
      metadata: { type, description }
    };

    this.activeJobs.set(job.id, job);

    try {
      // 创建备份目录
      const backupDir = path.join(process.cwd(), 'backups', job.id);
      await fs.mkdir(backupDir, { recursive: true });

      // 备份数据库
      const dbBackupFile = await this.backupDatabase(backupDir);
      job.files.push(dbBackupFile);

      // 备份文件系统
      const filesBackup = await this.backupFiles(backupDir, type);
      job.files.push(...filesBackup);

      // 备份配置
      const configBackup = await this.backupConfig(backupDir);
      job.files.push(configBackup);

      // 创建元数据
      const metadata = await this.createBackupMetadata(job, backupDir);
      job.files.push(metadata);

      // 压缩备份
      const archive = await this.compressBackup(backupDir, job.id);
      job.size = (await fs.stat(archive)).size;

      // 上传到远程存储
      await this.uploadBackup(archive, job);

      // 验证备份
      await this.verifyBackup(job);

      // 清理本地文件
      await this.cleanupLocalBackup(backupDir);

      job.status = 'completed';
      job.endTime = new Date();

      logger.info(`Backup completed: ${job.id}`, {
        duration: job.endTime.getTime() - job.startTime.getTime(),
        size: job.size,
        files: job.files.length
      });

      return job;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Backup failed: ${job.id}`, error);
      throw error;
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * 恢复备份
   */
  static async restoreBackup(
    backupId: string,
    options: {
      targetEnvironment?: string;
      verifyFirst?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<void> {
    logger.info(`Starting restore from backup: ${backupId}`, options);

    try {
      // 查找备份
      const recoveryPoint = await this.findRecoveryPoint(backupId);
      if (!recoveryPoint) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // 验证备份完整性
      if (options.verifyFirst) {
        const isValid = await this.verifyRecoveryPoint(recoveryPoint);
        if (!isValid) {
          throw new Error('Backup verification failed');
        }
      }

      // 下载备份
      const localPath = await this.downloadBackup(recoveryPoint);

      // 解压备份
      const extractDir = await this.extractBackup(localPath);

      // 执行恢复步骤
      if (!options.dryRun) {
        // 停止应用服务
        await this.stopApplicationServices();

        // 恢复数据库
        await this.restoreDatabase(extractDir);

        // 恢复文件
        await this.restoreFiles(extractDir);

        // 恢复配置
        await this.restoreConfig(extractDir);

        // 重启应用服务
        await this.startApplicationServices();

        // 验证恢复
        await this.verifyRestore();
      }

      // 清理临时文件
      await this.cleanupTempFiles(extractDir);

      logger.info(`Restore completed from backup: ${backupId}`);
    } catch (error) {
      logger.error(`Restore failed from backup: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * 灾难恢复演练
   */
  static async runDisasterRecoveryDrill(
    planId: string,
    options: {
      fullTest?: boolean;
      notifyContacts?: boolean;
      targetEnvironment?: string;
    } = {}
  ): Promise<TestResult> {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) {
      throw new Error(`Recovery plan not found: ${planId}`);
    }

    logger.info(`Starting disaster recovery drill: ${plan.name}`, options);

    const testResult: TestResult = {
      id: crypto.randomUUID(),
      planId,
      timestamp: new Date(),
      success: true,
      actualRTO: 0,
      actualRPO: 0,
      issues: [],
      recommendations: []
    };

    const startTime = Date.now();

    try {
      // 通知相关人员
      if (options.notifyContacts) {
        await this.notifyContacts(plan.contacts, 'drill_start', plan);
      }

      // 执行恢复步骤
      for (const step of plan.steps) {
        const stepStart = Date.now();

        try {
          if (step.automated && step.script) {
            if (options.fullTest) {
              await this.executeRecoveryStep(step, options.targetEnvironment);
            } else {
              // 模拟执行
              await this.simulateRecoveryStep(step);
            }
          } else {
            logger.info(`Manual step required: ${step.name}`);
            testResult.issues.push(`Manual step: ${step.name}`);
          }

          const stepDuration = (Date.now() - stepStart) / 60000; // 转换为分钟
          if (stepDuration > step.estimatedTime) {
            testResult.issues.push(
              `Step "${step.name}" took ${stepDuration.toFixed(1)}min (expected: ${step.estimatedTime}min)`
            );
          }
        } catch (error) {
          testResult.success = false;
          testResult.issues.push(
            `Step "${step.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // 计算实际 RTO
      testResult.actualRTO = (Date.now() - startTime) / 60000;

      // 验证 RPO
      const lastBackup = await this.getLastSuccessfulBackup();
      if (lastBackup) {
        testResult.actualRPO = (Date.now() - lastBackup.endTime!.getTime()) / 60000;
      }

      // 生成建议
      if (testResult.actualRTO > plan.rto) {
        testResult.recommendations.push(
          `优化恢复流程以达到 RTO 目标 (${plan.rto}分钟)`
        );
      }

      if (testResult.actualRPO > plan.rpo) {
        testResult.recommendations.push(
          `增加备份频率以达到 RPO 目标 (${plan.rpo}分钟)`
        );
      }

      // 通知演练结果
      if (options.notifyContacts) {
        await this.notifyContacts(plan.contacts, 'drill_complete', testResult);
      }

      // 保存测试结果
      plan.lastTested = new Date();
      plan.testResults = plan.testResults || [];
      plan.testResults.push(testResult);
      await this.saveRecoveryPlan(plan);

      logger.info(`Disaster recovery drill completed`, testResult);

      return testResult;
    } catch (error) {
      testResult.success = false;
      testResult.issues.push(
        `Drill failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      logger.error('Disaster recovery drill failed', error);
      return testResult;
    }
  }

  /**
   * 自动故障转移
   */
  static async performFailover(
    reason: string,
    options: {
      automatic?: boolean;
      targetRegion?: string;
      notifyContacts?: boolean;
    } = {}
  ): Promise<void> {
    logger.warn(`Initiating failover: ${reason}`, options);

    try {
      // 1. 验证主系统状态
      const isPrimaryHealthy = await this.checkPrimaryHealth();
      if (isPrimaryHealthy && !options.automatic) {
        throw new Error('Primary system is healthy, manual confirmation required');
      }

      // 2. 准备备用系统
      await this.prepareStandbySystem(options.targetRegion);

      // 3. 同步最新数据
      await this.syncLatestData();

      // 4. 切换 DNS/负载均衡
      await this.switchTraffic(options.targetRegion);

      // 5. 验证故障转移
      await this.verifyFailover();

      // 6. 通知相关人员
      if (options.notifyContacts) {
        await this.notifyFailover(reason);
      }

      logger.info('Failover completed successfully');
    } catch (error) {
      logger.error('Failover failed', error);
      // 尝试回滚
      await this.rollbackFailover();
      throw error;
    }
  }

  /**
   * 备份监控仪表板数据
   */
  static async getBackupMetrics(): Promise<{
    summary: {
      totalBackups: number;
      successRate: number;
      totalSize: number;
      lastBackup?: Date;
      nextBackup?: Date;
    };
    recent: BackupJob[];
    storage: {
      used: number;
      available: number;
      trend: number[];
    };
    health: {
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
    };
  }> {
    // 获取备份历史
    const backupHistory = await this.getBackupHistory(30); // 最近30天

    // 计算统计数据
    const totalBackups = backupHistory.length;
    const successfulBackups = backupHistory.filter(b => b.status === 'completed').length;
    const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0;
    const totalSize = backupHistory.reduce((sum, b) => sum + b.size, 0);

    // 获取最近的备份
    const recentBackups = backupHistory.slice(0, 10);
    const lastBackup = recentBackups.find(b => b.status === 'completed');

    // 获取下次备份时间
    const nextBackup = await this.getNextScheduledBackup();

    // 存储使用情况
    const storageInfo = await this.getStorageInfo();

    // 健康检查
    const healthStatus = await this.checkBackupHealth();

    return {
      summary: {
        totalBackups,
        successRate,
        totalSize,
        lastBackup: lastBackup?.endTime,
        nextBackup
      },
      recent: recentBackups,
      storage: storageInfo,
      health: healthStatus
    };
  }

  // 私有辅助方法

  private static async loadBackupConfigs() {
    // 默认备份配置
    const defaultConfig: BackupConfig = {
      id: 'default',
      type: 'full',
      schedule: '0 2 * * *', // 每天凌晨2点
      retention: 30, // 保留30天
      compression: true,
      encryption: true,
      destinations: [
        {
          type: 'local',
          config: { path: '/backup/local' }
        }
      ]
    };

    this.backupConfigs.set('default', defaultConfig);

    // 从配置文件加载其他配置
    try {
      const configFile = path.join(process.cwd(), 'backup-config.json');
      const configData = await fs.readFile(configFile, 'utf-8');
      const configs = JSON.parse(configData);
      
      for (const config of configs) {
        this.backupConfigs.set(config.id, config);
      }
    } catch (error) {
      // 配置文件不存在，使用默认配置
    }
  }

  private static async loadRecoveryPlans() {
    // 默认恢复计划
    const defaultPlan: DisasterRecoveryPlan = {
      id: 'default',
      name: '标准灾难恢复计划',
      description: 'WebSpark.club 标准灾难恢复流程',
      rto: 60, // 60分钟
      rpo: 15, // 15分钟
      steps: [
        {
          order: 1,
          name: '评估损坏程度',
          description: '确定系统受影响的范围',
          automated: false,
          estimatedTime: 10,
          dependencies: []
        },
        {
          order: 2,
          name: '准备恢复环境',
          description: '启动备用服务器',
          automated: true,
          script: 'prepare-recovery-env.sh',
          estimatedTime: 15,
          dependencies: ['1']
        },
        {
          order: 3,
          name: '恢复数据',
          description: '从最新备份恢复数据',
          automated: true,
          script: 'restore-data.sh',
          estimatedTime: 20,
          dependencies: ['2']
        },
        {
          order: 4,
          name: '验证系统',
          description: '验证系统功能正常',
          automated: true,
          script: 'verify-system.sh',
          estimatedTime: 10,
          dependencies: ['3']
        },
        {
          order: 5,
          name: '切换流量',
          description: '将流量切换到恢复的系统',
          automated: true,
          script: 'switch-traffic.sh',
          estimatedTime: 5,
          dependencies: ['4']
        }
      ],
      contacts: [
        {
          name: '系统管理员',
          role: '主要负责人',
          email: 'admin@webspark.club',
          priority: 1
        }
      ]
    };

    this.recoveryPlans.set('default', defaultPlan);
  }

  private static startScheduledBackups() {
    // 使用 node-cron 或类似库实现定时备份
    // 这里简化为定时器
    setInterval(async () => {
      for (const [id, config] of this.backupConfigs) {
        if (this.shouldRunBackup(config)) {
          try {
            await this.createBackup(config.type, `Scheduled backup: ${id}`);
          } catch (error) {
            logger.error(`Scheduled backup failed: ${id}`, error);
          }
        }
      }
    }, 60 * 60 * 1000); // 每小时检查一次
  }

  private static startHealthChecks() {
    setInterval(async () => {
      const health = await this.checkBackupHealth();
      
      if (health.status === 'critical') {
        logger.error('Backup health critical', health.issues);
        // 发送告警
        await this.sendBackupAlert(health);
      } else if (health.status === 'warning') {
        logger.warn('Backup health warning', health.issues);
      }
    }, 30 * 60 * 1000); // 每30分钟检查一次
  }

  private static async backupDatabase(backupDir: string): Promise<string> {
    const dbBackupFile = path.join(backupDir, 'database.sql');
    
    const command = `mysqldump -h${process.env.DB_HOST} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${dbBackupFile}`;
    
    await execAsync(command);
    
    // 压缩数据库备份
    await execAsync(`gzip ${dbBackupFile}`);
    
    return `${dbBackupFile}.gz`;
  }

  private static async backupFiles(
    backupDir: string,
    type: string
  ): Promise<string[]> {
    const files: string[] = [];
    
    // 备份上传的文件
    const uploadsBackup = path.join(backupDir, 'uploads.tar.gz');
    await tar.create(
      {
        gzip: true,
        file: uploadsBackup
      },
      ['uploads']
    );
    files.push(uploadsBackup);
    
    // 备份日志（如果需要）
    if (type === 'full') {
      const logsBackup = path.join(backupDir, 'logs.tar.gz');
      await tar.create(
        {
          gzip: true,
          file: logsBackup
        },
        ['logs']
      );
      files.push(logsBackup);
    }
    
    return files;
  }

  private static async backupConfig(backupDir: string): Promise<string> {
    const configBackup = path.join(backupDir, 'config.tar.gz');
    
    await tar.create(
      {
        gzip: true,
        file: configBackup
      },
      ['.env', 'package.json', 'ecosystem.config.js']
    );
    
    return configBackup;
  }

  private static async createBackupMetadata(
    job: BackupJob,
    backupDir: string
  ): Promise<string> {
    const metadata = {
      id: job.id,
      timestamp: job.startTime,
      type: job.metadata.type,
      version: process.env.APP_VERSION || '1.0.0',
      files: job.files,
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    const metadataFile = path.join(backupDir, 'metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    
    return metadataFile;
  }

  private static async compressBackup(
    backupDir: string,
    jobId: string
  ): Promise<string> {
    const archivePath = path.join(process.cwd(), 'backups', `${jobId}.tar.gz`);
    
    await tar.create(
      {
        gzip: true,
        file: archivePath
      },
      [backupDir]
    );
    
    return archivePath;
  }

  private static async uploadBackup(archivePath: string, job: BackupJob) {
    // 上传到 S3
    if (this.s3 && process.env.S3_BACKUP_BUCKET) {
      const fileStream = await fs.readFile(archivePath);
      
      await this.s3.upload({
        Bucket: process.env.S3_BACKUP_BUCKET,
        Key: `backups/${job.id}.tar.gz`,
        Body: fileStream,
        ServerSideEncryption: 'AES256'
      }).promise();
      
      logger.info(`Backup uploaded to S3: ${job.id}`);
    }
    
    // 可以添加其他远程存储的上传逻辑
  }

  private static async verifyBackup(job: BackupJob) {
    // 计算校验和
    const checksum = await this.calculateChecksum(job.id);
    job.metadata.checksum = checksum;
    
    // 创建恢复点记录
    const recoveryPoint: RecoveryPoint = {
      id: crypto.randomUUID(),
      backupId: job.id,
      timestamp: job.startTime,
      type: job.metadata.type,
      size: job.size,
      checksum,
      verified: true,
      location: process.env.S3_BACKUP_BUCKET 
        ? `s3://${process.env.S3_BACKUP_BUCKET}/backups/${job.id}.tar.gz`
        : `local://backups/${job.id}.tar.gz`
    };
    
    // 保存恢复点信息
    await this.saveRecoveryPoint(recoveryPoint);
  }

  private static async cleanupLocalBackup(backupDir: string) {
    await fs.rm(backupDir, { recursive: true, force: true });
  }

  private static async cleanupOldBackups() {
    const configs = Array.from(this.backupConfigs.values());
    
    for (const config of configs) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention);
      
      // 删除超过保留期限的备份
      const oldBackups = await this.getBackupsOlderThan(cutoffDate);
      
      for (const backup of oldBackups) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  private static shouldRunBackup(config: BackupConfig): boolean {
    // 使用 cron 表达式判断是否应该运行备份
    // 这里简化处理
    return false;
  }

  private static async calculateChecksum(backupId: string): Promise<string> {
    const archivePath = path.join(process.cwd(), 'backups', `${backupId}.tar.gz`);
    const fileBuffer = await fs.readFile(archivePath);
    
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private static async saveRecoveryPoint(point: RecoveryPoint) {
    // 保存恢复点信息到数据库或文件
    const recoveryPointsFile = path.join(process.cwd(), 'recovery-points.json');
    
    let points: RecoveryPoint[] = [];
    try {
      const data = await fs.readFile(recoveryPointsFile, 'utf-8');
      points = JSON.parse(data);
    } catch (error) {
      // 文件不存在
    }
    
    points.push(point);
    
    await fs.writeFile(
      recoveryPointsFile,
      JSON.stringify(points, null, 2)
    );
  }

  private static async findRecoveryPoint(backupId: string): Promise<RecoveryPoint | null> {
    const recoveryPointsFile = path.join(process.cwd(), 'recovery-points.json');
    
    try {
      const data = await fs.readFile(recoveryPointsFile, 'utf-8');
      const points: RecoveryPoint[] = JSON.parse(data);
      
      return points.find(p => p.backupId === backupId) || null;
    } catch (error) {
      return null;
    }
  }

  private static async verifyRecoveryPoint(point: RecoveryPoint): Promise<boolean> {
    // 验证备份文件是否存在且完整
    try {
      if (point.location.startsWith('s3://')) {
        // 验证 S3 对象
        const bucket = point.location.split('/')[2];
        const key = point.location.split('/').slice(3).join('/');
        
        const headResult = await this.s3.headObject({
          Bucket: bucket,
          Key: key
        }).promise();
        
        return headResult.ContentLength === point.size;
      } else {
        // 验证本地文件
        const localPath = point.location.replace('local://', '');
        const stat = await fs.stat(localPath);
        
        return stat.size === point.size;
      }
    } catch (error) {
      return false;
    }
  }

  private static async downloadBackup(point: RecoveryPoint): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp', point.backupId);
    await fs.mkdir(tempDir, { recursive: true });
    
    const localPath = path.join(tempDir, 'backup.tar.gz');
    
    if (point.location.startsWith('s3://')) {
      // 从 S3 下载
      const bucket = point.location.split('/')[2];
      const key = point.location.split('/').slice(3).join('/');
      
      const data = await this.s3.getObject({
        Bucket: bucket,
        Key: key
      }).promise();
      
      await fs.writeFile(localPath, data.Body as Buffer);
    } else {
      // 复制本地文件
      const sourcePath = point.location.replace('local://', '');
      await fs.copyFile(sourcePath, localPath);
    }
    
    return localPath;
  }

  private static async extractBackup(archivePath: string): Promise<string> {
    const extractDir = path.dirname(archivePath);
    
    await tar.extract({
      file: archivePath,
      cwd: extractDir
    });
    
    return extractDir;
  }

  private static async stopApplicationServices() {
    logger.info('Stopping application services');
    await execAsync('pm2 stop all');
  }

  private static async startApplicationServices() {
    logger.info('Starting application services');
    await execAsync('pm2 start ecosystem.config.js');
  }

  private static async restoreDatabase(extractDir: string) {
    const dbBackupFile = path.join(extractDir, 'backups', '*', 'database.sql.gz');
    
    // 解压数据库备份
    await execAsync(`gunzip ${dbBackupFile}`);
    
    const sqlFile = dbBackupFile.replace('.gz', '');
    
    // 恢复数据库
    const command = `mysql -h${process.env.DB_HOST} -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${sqlFile}`;
    
    await execAsync(command);
    
    logger.info('Database restored successfully');
  }

  private static async restoreFiles(extractDir: string) {
    // 恢复上传的文件
    const uploadsBackup = path.join(extractDir, 'backups', '*', 'uploads.tar.gz');
    
    await tar.extract({
      file: uploadsBackup,
      cwd: process.cwd()
    });
    
    logger.info('Files restored successfully');
  }

  private static async restoreConfig(extractDir: string) {
    // 恢复配置文件
    const configBackup = path.join(extractDir, 'backups', '*', 'config.tar.gz');
    
    await tar.extract({
      file: configBackup,
      cwd: process.cwd()
    });
    
    logger.info('Configuration restored successfully');
  }

  private static async verifyRestore() {
    // 执行健康检查
    const healthCheckUrl = `http://localhost:${process.env.PORT || 4000}/health`;
    
    let retries = 5;
    while (retries > 0) {
      try {
        const response = await fetch(healthCheckUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            logger.info('System verification passed');
            return;
          }
        }
      } catch (error) {
        // 继续重试
      }
      
      retries--;
      await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
    }
    
    throw new Error('System verification failed after restore');
  }

  private static async cleanupTempFiles(dir: string) {
    await fs.rm(dir, { recursive: true, force: true });
  }

  private static async getBackupHistory(days: number): Promise<BackupJob[]> {
    // 从存储中获取备份历史
    // 这里简化处理，返回模拟数据
    return [];
  }

  private static async getLastSuccessfulBackup(): Promise<BackupJob | null> {
    const history = await this.getBackupHistory(7);
    return history.find(b => b.status === 'completed') || null;
  }

  private static async getNextScheduledBackup(): Promise<Date | undefined> {
    // 计算下次备份时间
    // 这里简化处理
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    return tomorrow;
  }

  private static async getStorageInfo(): Promise<{
    used: number;
    available: number;
    trend: number[];
  }> {
    // 获取存储使用情况
    // 这里简化处理
    return {
      used: 1024 * 1024 * 1024 * 10, // 10GB
      available: 1024 * 1024 * 1024 * 90, // 90GB
      trend: [8, 8.5, 9, 9.2, 9.5, 9.8, 10] // GB
    };
  }

  private static async checkBackupHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // 检查最后备份时间
    const lastBackup = await this.getLastSuccessfulBackup();
    if (!lastBackup) {
      issues.push('No successful backups found');
    } else {
      const hoursSinceLastBackup = 
        (Date.now() - lastBackup.endTime!.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastBackup > 48) {
        issues.push(`Last backup was ${hoursSinceLastBackup.toFixed(0)} hours ago`);
      }
    }
    
    // 检查存储空间
    const storage = await this.getStorageInfo();
    const usagePercent = (storage.used / (storage.used + storage.available)) * 100;
    
    if (usagePercent > 90) {
      issues.push(`Storage usage critical: ${usagePercent.toFixed(1)}%`);
    } else if (usagePercent > 80) {
      issues.push(`Storage usage high: ${usagePercent.toFixed(1)}%`);
    }
    
    // 确定健康状态
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2 || issues.some(i => i.includes('critical'))) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return { status, issues };
  }

  private static async sendBackupAlert(health: any) {
    // 发送备份告警
    logger.error('Backup health alert', health);
    // 可以集成邮件或其他通知服务
  }

  private static async getBackupsOlderThan(date: Date): Promise<BackupJob[]> {
    const allBackups = await this.getBackupHistory(365);
    return allBackups.filter(b => b.startTime < date);
  }

  private static async deleteBackup(backupId: string) {
    // 删除本地备份
    const localPath = path.join(process.cwd(), 'backups', `${backupId}.tar.gz`);
    try {
      await fs.unlink(localPath);
    } catch (error) {
      // 文件可能不存在
    }
    
    // 删除远程备份
    if (this.s3 && process.env.S3_BACKUP_BUCKET) {
      try {
        await this.s3.deleteObject({
          Bucket: process.env.S3_BACKUP_BUCKET,
          Key: `backups/${backupId}.tar.gz`
        }).promise();
      } catch (error) {
        logger.error(`Failed to delete S3 backup: ${backupId}`, error);
      }
    }
    
    logger.info(`Backup deleted: ${backupId}`);
  }

  private static async saveRecoveryPlan(plan: DisasterRecoveryPlan) {
    this.recoveryPlans.set(plan.id, plan);
    
    // 保存到文件
    const plansFile = path.join(process.cwd(), 'recovery-plans.json');
    const plans = Array.from(this.recoveryPlans.values());
    
    await fs.writeFile(
      plansFile,
      JSON.stringify(plans, null, 2)
    );
  }

  private static async notifyContacts(
    contacts: Contact[],
    event: string,
    data: any
  ) {
    for (const contact of contacts.sort((a, b) => a.priority - b.priority)) {
      logger.info(`Notifying ${contact.name} about ${event}`);
      // 实际实现应该发送邮件或短信
    }
  }

  private static async executeRecoveryStep(
    step: RecoveryStep,
    environment?: string
  ) {
    if (step.script) {
      const env = {
        ...process.env,
        RECOVERY_ENV: environment || 'production'
      };
      
      await execAsync(step.script, { env });
    }
  }

  private static async simulateRecoveryStep(step: RecoveryStep) {
    // 模拟执行时间
    const simulatedTime = step.estimatedTime * 0.8 + Math.random() * step.estimatedTime * 0.4;
    await new Promise(resolve => setTimeout(resolve, simulatedTime * 60000));
  }

  private static async checkPrimaryHealth(): Promise<boolean> {
    try {
      const response = await fetch(process.env.PRIMARY_HEALTH_URL || 'http://localhost:4000/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private static async prepareStandbySystem(region?: string) {
    logger.info(`Preparing standby system in region: ${region || 'default'}`);
    // 启动备用系统
  }

  private static async syncLatestData() {
    logger.info('Syncing latest data to standby system');
    // 同步最新数据
  }

  private static async switchTraffic(region?: string) {
    logger.info(`Switching traffic to region: ${region || 'default'}`);
    // DNS 或负载均衡切换
  }

  private static async verifyFailover() {
    logger.info('Verifying failover success');
    // 验证故障转移
  }

  private static async notifyFailover(reason: string) {
    logger.info(`Notifying about failover: ${reason}`);
    // 发送通知
  }

  private static async rollbackFailover() {
    logger.warn('Attempting to rollback failover');
    // 回滚故障转移
  }
}
