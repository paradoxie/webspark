/**
 * 数据一致性保障中间件
 * 确保事务完整性、缓存同步、并发控制
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS } from '../lib/cache';
import { Prisma } from '@prisma/client';

/**
 * 分布式锁实现
 */
export class DistributedLock {
  private static locks = new Map<string, { 
    owner: string; 
    expiresAt: number; 
    waitQueue: Array<() => void> 
  }>();
  
  /**
   * 获取锁
   */
  static async acquire(
    key: string,
    owner: string,
    ttl: number = 5000,
    timeout: number = 10000
  ): Promise<boolean> {
    const now = Date.now();
    const expiresAt = now + ttl;
    const timeoutAt = now + timeout;
    
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const lock = this.locks.get(key);
        
        // 检查锁是否过期
        if (lock && lock.expiresAt < Date.now()) {
          this.release(key, lock.owner);
        }
        
        // 尝试获取锁
        if (!this.locks.has(key)) {
          this.locks.set(key, {
            owner,
            expiresAt,
            waitQueue: []
          });
          resolve(true);
          return true;
        }
        
        // 检查是否超时
        if (Date.now() > timeoutAt) {
          resolve(false);
          return false;
        }
        
        // 加入等待队列
        const currentLock = this.locks.get(key)!;
        currentLock.waitQueue.push(tryAcquire);
        return false;
      };
      
      tryAcquire();
    });
  }
  
  /**
   * 释放锁
   */
  static release(key: string, owner: string): boolean {
    const lock = this.locks.get(key);
    
    if (!lock || lock.owner !== owner) {
      return false;
    }
    
    this.locks.delete(key);
    
    // 通知等待队列中的第一个
    if (lock.waitQueue.length > 0) {
      const next = lock.waitQueue.shift();
      if (next) {
        setImmediate(next);
      }
    }
    
    return true;
  }
  
  /**
   * 使用锁执行操作
   */
  static async withLock<T>(
    key: string,
    owner: string,
    operation: () => Promise<T>,
    options?: { ttl?: number; timeout?: number }
  ): Promise<T> {
    const acquired = await this.acquire(key, owner, options?.ttl, options?.timeout);
    
    if (!acquired) {
      throw new Error(`Failed to acquire lock for ${key}`);
    }
    
    try {
      return await operation();
    } finally {
      this.release(key, owner);
    }
  }
}

/**
 * 事务管理器
 */
export class TransactionManager {
  /**
   * 执行事务操作
   */
  static async executeTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    return await prisma.$transaction(
      operation,
      {
        maxWait: options?.maxWait || 5000,
        timeout: options?.timeout || 10000,
        isolationLevel: options?.isolationLevel || Prisma.TransactionIsolationLevel.ReadCommitted
      }
    );
  }
  
  /**
   * 带重试的事务执行
   */
  static async executeWithRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 100
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.executeTransaction(operation);
      } catch (error: any) {
        lastError = error;
        
        // 检查是否是可重试的错误
        if (this.isRetryableError(error)) {
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }
  
  /**
   * 判断是否是可重试的错误
   */
  private static isRetryableError(error: any): boolean {
    // Prisma错误码
    const retryableCodes = [
      'P2034', // 事务冲突
      'P2024', // 连接池超时
      'P1001', // 无法连接到数据库
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message?.includes('deadlock') ||
           error.message?.includes('timeout');
  }
}

/**
 * 缓存一致性管理器
 */
export class CacheConsistencyManager {
  private static invalidationQueue: Array<{
    pattern: string;
    timestamp: number;
  }> = [];
  
  /**
   * 使缓存失效
   */
  static async invalidate(patterns: string | string[]): Promise<void> {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const pattern of patternsArray) {
      this.invalidationQueue.push({
        pattern,
        timestamp: Date.now()
      });
      
      // 立即执行失效
      await cache.deletePattern(pattern);
    }
    
    // 记录失效操作
    console.log(`🔄 Cache invalidated: ${patternsArray.join(', ')}`);
  }
  
  /**
   * 事务后失效缓存
   */
  static async invalidateAfterTransaction(
    tx: Prisma.TransactionClient,
    patterns: string[]
  ): Promise<void> {
    // 注册事务完成后的回调
    (tx as any).$on('commit', async () => {
      await this.invalidate(patterns);
    });
  }
  
  /**
   * 获取失效历史
   */
  static getInvalidationHistory(since?: number): Array<{ pattern: string; timestamp: number }> {
    if (since) {
      return this.invalidationQueue.filter(item => item.timestamp > since);
    }
    return [...this.invalidationQueue];
  }
  
  /**
   * 清理过期的失效记录
   */
  static cleanupHistory(maxAge: number = 3600000): void {
    const cutoff = Date.now() - maxAge;
    this.invalidationQueue = this.invalidationQueue.filter(
      item => item.timestamp > cutoff
    );
  }
}

/**
 * 乐观锁实现
 */
export class OptimisticLock {
  /**
   * 使用版本号进行更新
   */
  static async updateWithVersion<T>(
    model: any,
    id: number,
    currentVersion: number,
    updateData: any
  ): Promise<T | null> {
    const result = await model.updateMany({
      where: {
        id,
        version: currentVersion
      },
      data: {
        ...updateData,
        version: { increment: 1 }
      }
    });
    
    if (result.count === 0) {
      return null; // 版本冲突
    }
    
    return await model.findUnique({ where: { id } });
  }
  
  /**
   * 带重试的乐观锁更新
   */
  static async updateWithRetry<T>(
    model: any,
    id: number,
    updateFn: (current: T) => any,
    maxRetries: number = 3
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      // 获取当前数据
      const current = await model.findUnique({ where: { id } });
      if (!current) {
        throw new Error(`Record with id ${id} not found`);
      }
      
      // 应用更新
      const updateData = updateFn(current);
      
      // 尝试更新
      const updated = await this.updateWithVersion(
        model,
        id,
        current.version || 0,
        updateData
      );
      
      if (updated) {
        return updated;
      }
      
      // 版本冲突，重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    
    throw new Error(`Failed to update after ${maxRetries} retries due to version conflicts`);
  }
}

/**
 * 数据验证器
 */
export class DataValidator {
  /**
   * 验证数据完整性
   */
  static async validateIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // 检查孤立的记录
      const orphanedComments = await prisma.comment.count({
        where: {
          website: {
            is: null
          }
        }
      });
      
      if (orphanedComments > 0) {
        issues.push(`Found ${orphanedComments} orphaned comments`);
      }
      
      // 检查计数器一致性
      const websites = await prisma.website.findMany({
        include: {
          _count: {
            select: {
              likedBy: true,
              bookmarkedBy: true
            }
          }
        }
      });
      
      for (const website of websites) {
        const actualLikes = await prisma.websiteLike.count({
          where: { websiteId: website.id }
        });
        
        if (website.likeCount !== actualLikes) {
          issues.push(`Website ${website.id} like count mismatch: ${website.likeCount} vs ${actualLikes}`);
        }
      }
      
      // 检查缓存一致性
      const cacheStats = await cache.getStats();
      if (!cacheStats?.connected) {
        issues.push('Cache is not connected');
      }
    } catch (error) {
      issues.push(`Validation error: ${error}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * 修复数据不一致
   */
  static async repairInconsistencies(): Promise<{
    fixed: number;
    errors: string[];
  }> {
    let fixed = 0;
    const errors: string[] = [];
    
    try {
      // 修复点赞计数
      const websites = await prisma.website.findMany();
      
      for (const website of websites) {
        const actualLikes = await prisma.websiteLike.count({
          where: { websiteId: website.id }
        });
        
        if (website.likeCount !== actualLikes) {
          await prisma.website.update({
            where: { id: website.id },
            data: { likeCount: actualLikes }
          });
          fixed++;
        }
      }
      
      // 清理孤立记录
      const deletedOrphans = await prisma.comment.deleteMany({
        where: {
          website: {
            is: null
          }
        }
      });
      
      fixed += deletedOrphans.count;
    } catch (error) {
      errors.push(`Repair error: ${error}`);
    }
    
    return { fixed, errors };
  }
}

/**
 * 数据一致性中间件
 */
export function ensureDataConsistency(req: Request, res: Response, next: NextFunction) {
  // 添加事务助手到请求对象
  (req as any).transaction = TransactionManager.executeTransaction.bind(TransactionManager);
  (req as any).withLock = DistributedLock.withLock.bind(DistributedLock);
  (req as any).invalidateCache = CacheConsistencyManager.invalidate.bind(CacheConsistencyManager);
  
  next();
}

// 定期清理任务
setInterval(() => {
  CacheConsistencyManager.cleanupHistory();
}, 3600000); // 每小时清理一次
