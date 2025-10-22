/**
 * 性能优化中间件
 * 解决N+1查询、优化数据加载、实现查询缓存
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { performanceMonitor } from '../utils/monitoring';

/**
 * 查询优化器中间件
 */
export function queryOptimizer(req: Request, res: Response, next: NextFunction) {
  // 监控查询性能
  const originalQuery = prisma.$queryRaw;
  
  (prisma as any).$queryRaw = async function(...args: any[]) {
    const label = `query_${req.path}`;
    performanceMonitor.startTimer(label);
    
    try {
      const result = await originalQuery.apply(prisma, args as [query: any, ...values: any[]]);
      const duration = performanceMonitor.endTimer(label);
      
      // 记录慢查询
      if (duration > 1000) {
        console.warn(`⚠️ Slow query detected on ${req.path}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      performanceMonitor.endTimer(label);
      throw error;
    }
  };
  
  next();
}

/**
 * 数据预加载器
 * 批量加载关联数据，避免N+1查询
 */
export class DataPreloader {
  /**
   * 预加载用户交互数据
   */
  static async preloadUserInteractions(
    websiteIds: number[],
    userId?: number
  ): Promise<Map<number, { isLiked: boolean; isBookmarked: boolean }>> {
    const interactions = new Map();
    
    // 初始化所有网站的交互状态
    websiteIds.forEach(id => {
      interactions.set(id, { isLiked: false, isBookmarked: false });
    });
    
    if (!userId || websiteIds.length === 0) {
      return interactions;
    }
    
    // 批量查询点赞和收藏状态
    const [likes, bookmarks] = await Promise.all([
      prisma.websiteLike.findMany({
        where: {
          userId,
          websiteId: { in: websiteIds }
        },
        select: { websiteId: true }
      }),
      prisma.bookmark.findMany({
        where: {
          userId,
          websiteId: { in: websiteIds }
        },
        select: { websiteId: true }
      })
    ]);
    
    // 更新交互状态
    likes.forEach(like => {
      const current = interactions.get(like.websiteId);
      if (current) {
        current.isLiked = true;
      }
    });
    
    bookmarks.forEach(bookmark => {
      const current = interactions.get(bookmark.websiteId);
      if (current) {
        current.isBookmarked = true;
      }
    });
    
    return interactions;
  }
  
  /**
   * 预加载评论统计
   */
  static async preloadCommentCounts(
    websiteIds: number[]
  ): Promise<Map<number, number>> {
    const counts = new Map();
    
    if (websiteIds.length === 0) {
      return counts;
    }
    
    const results = await prisma.comment.groupBy({
      by: ['websiteId'],
      where: {
        websiteId: { in: websiteIds },
        parentId: null
      },
      _count: {
        id: true
      }
    });
    
    results.forEach(result => {
      counts.set(result.websiteId, result._count.id);
    });
    
    // 填充没有评论的网站
    websiteIds.forEach(id => {
      if (!counts.has(id)) {
        counts.set(id, 0);
      }
    });
    
    return counts;
  }
  
  /**
   * 预加载标签统计
   */
  static async preloadTagStats(
    tagIds: number[]
  ): Promise<Map<number, { websiteCount: number; popularity: number }>> {
    const stats = new Map();
    
    if (tagIds.length === 0) {
      return stats;
    }
    
    // 使用原生SQL查询以获得更好的性能
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        t.id,
        COUNT(DISTINCT wt.A) as websiteCount,
        SUM(w.likeCount) as totalLikes,
        SUM(w.viewCount) as totalViews
      FROM tags t
      LEFT JOIN _WebsiteTags wt ON t.id = wt.B
      LEFT JOIN websites w ON wt.A = w.id AND w.status = 'APPROVED' AND w.deletedAt IS NULL
      WHERE t.id IN (${tagIds.join(',')})
      GROUP BY t.id
    `;
    
    results.forEach(result => {
      const popularity = (result.totalLikes * 2 + result.totalViews) / Math.max(result.websiteCount, 1);
      stats.set(result.id, {
        websiteCount: result.websiteCount,
        popularity: Math.round(popularity)
      });
    });
    
    return stats;
  }
}

/**
 * 响应缓存中间件
 */
export function responseCache(
  keyPrefix: string,
  ttl: number = CACHE_TTL.SHORT,
  varyBy: string[] = []
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    // 生成缓存键
    const varyByValues = varyBy.map(key => {
      if (key === 'user') {
        return (req as any).user?.id || 'guest';
      }
      return req.query[key] || req.params[key] || '';
    });
    
    const cacheKey = `${req.path}_${varyByValues.join('_')}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(keyPrefix, cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', ttl.toString());
      return res.json(cached);
    }
    
    // 拦截响应以缓存
    const originalJson = res.json;
    res.json = function(data: any) {
      // 只缓存成功的响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(keyPrefix, cacheKey, data, { ttl }).catch(err => {
          console.error('Cache set error:', err);
        });
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * 数据库连接池优化
 */
export class ConnectionPoolOptimizer {
  private static poolStats = {
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalConnections: 0
  };
  
  /**
   * 监控连接池状态
   */
  static monitorPool() {
    setInterval(async () => {
      try {
        // 获取连接池统计
        const stats = await prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle
          FROM information_schema.processlist
          WHERE db = DATABASE()
        `;
        
        if (stats[0]) {
          this.poolStats = {
            totalConnections: stats[0].total,
            activeConnections: stats[0].active,
            idleConnections: stats[0].idle,
            waitingRequests: 0
          };
        }
        
        // 记录异常情况
        if (this.poolStats.activeConnections > 20) {
          console.warn('⚠️ High number of active connections:', this.poolStats.activeConnections);
        }
      } catch (error) {
        console.error('Failed to monitor connection pool:', error);
      }
    }, 30000); // 每30秒检查一次
  }
  
  /**
   * 获取连接池统计
   */
  static getStats() {
    return this.poolStats;
  }
  
  /**
   * 优化慢查询
   */
  static async optimizeSlowQueries() {
    try {
      // 获取慢查询日志
      const slowQueries = await prisma.$queryRaw<any[]>`
        SELECT 
          query,
          exec_count,
          avg_exec_time,
          max_exec_time
        FROM mysql.slow_log
        WHERE avg_exec_time > 1
        ORDER BY avg_exec_time DESC
        LIMIT 10
      `;
      
      if (slowQueries.length > 0) {
        console.log('📊 Top slow queries detected:');
        slowQueries.forEach(q => {
          console.log(`  - ${q.query.substring(0, 100)}... (avg: ${q.avg_exec_time}s)`);
        });
      }
    } catch (error) {
      // 慢查询日志可能未启用
      console.debug('Slow query log not available');
    }
  }
}

/**
 * 批量操作优化器
 */
export class BatchOperationOptimizer {
  private static batchQueue = new Map<string, any[]>();
  private static batchTimers = new Map<string, NodeJS.Timeout>();
  
  /**
   * 添加到批处理队列
   */
  static addToBatch(
    operation: string,
    data: any,
    batchSize: number = 100,
    batchDelay: number = 100
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 初始化队列
      if (!this.batchQueue.has(operation)) {
        this.batchQueue.set(operation, []);
      }
      
      const queue = this.batchQueue.get(operation)!;
      queue.push({ data, resolve, reject });
      
      // 如果达到批处理大小，立即执行
      if (queue.length >= batchSize) {
        this.executeBatch(operation);
      } else {
        // 否则设置延迟执行
        if (this.batchTimers.has(operation)) {
          clearTimeout(this.batchTimers.get(operation)!);
        }
        
        const timer = setTimeout(() => {
          this.executeBatch(operation);
        }, batchDelay);
        
        this.batchTimers.set(operation, timer);
      }
    });
  }
  
  /**
   * 执行批处理
   */
  private static async executeBatch(operation: string) {
    const queue = this.batchQueue.get(operation);
    if (!queue || queue.length === 0) {
      return;
    }
    
    // 清空队列
    this.batchQueue.set(operation, []);
    
    // 清除定时器
    if (this.batchTimers.has(operation)) {
      clearTimeout(this.batchTimers.get(operation)!);
      this.batchTimers.delete(operation);
    }
    
    try {
      // 根据操作类型执行批处理
      let results: any[] = [];
      
      switch (operation) {
        case 'incrementView':
          const websiteIds = queue.map(item => item.data.websiteId);
          await prisma.website.updateMany({
            where: { id: { in: websiteIds } },
            data: { viewCount: { increment: 1 } }
          });
          results = websiteIds.map(id => ({ websiteId: id, success: true }));
          break;
          
        case 'recordActivity':
          const activities = queue.map(item => item.data);
          const created = await prisma.activity.createMany({
            data: activities,
            skipDuplicates: true
          });
          results = activities.map(() => ({ success: true }));
          break;
          
        default:
          throw new Error(`Unknown batch operation: ${operation}`);
      }
      
      // 解析所有Promise
      queue.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // 拒绝所有Promise
      queue.forEach(item => {
        item.reject(error);
      });
    }
  }
}
