import Redis from 'ioredis';
import { config } from '../config';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large data
}

class CacheManager {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Redis连接配置
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      this.redis = new Redis(redisConfig);

      // 连接事件监听
      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isEnabled = true;
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.isEnabled = false;
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isEnabled = false;
      });

      // 测试连接
      await this.redis.ping();
    } catch (error) {
      console.error('Redis initialization failed:', error);
      this.isEnabled = false;
    }
  }

  // 生成缓存键
  private generateKey(prefix: string, identifier: string | number): string {
    return `webspark:${prefix}:${identifier}`;
  }

  // 设置缓存
  async set<T>(
    prefix: string, 
    key: string | number, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false;

    try {
      const cacheKey = this.generateKey(prefix, key);
      const serializedValue = JSON.stringify(value);
      const { ttl = 3600, compress = false } = options;

      // 如果数据较大且启用压缩
      let finalValue = serializedValue;
      if (compress && serializedValue.length > 1024) {
        const zlib = await import('zlib');
        finalValue = zlib.gzipSync(serializedValue).toString('base64');
      }

      if (ttl > 0) {
        await this.redis.setex(cacheKey, ttl, finalValue);
      } else {
        await this.redis.set(cacheKey, finalValue);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // 获取缓存
  async get<T>(prefix: string, key: string | number, compressed = false): Promise<T | null> {
    if (!this.isEnabled || !this.redis) return null;

    try {
      const cacheKey = this.generateKey(prefix, key);
      let value = await this.redis.get(cacheKey);

      if (!value) return null;

      // 如果数据被压缩
      if (compressed) {
        const zlib = await import('zlib');
        const buffer = Buffer.from(value, 'base64');
        value = zlib.gunzipSync(buffer).toString();
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // 删除缓存
  async delete(prefix: string, key: string | number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false;

    try {
      const cacheKey = this.generateKey(prefix, key);
      await this.redis.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // 批量删除缓存（通过模式匹配）
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isEnabled || !this.redis) return 0;

    try {
      const keys = await this.redis.keys(`webspark:${pattern}*`);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  // 设置计数器
  async incr(prefix: string, key: string | number, ttl?: number): Promise<number> {
    if (!this.isEnabled || !this.redis) return 0;

    try {
      const cacheKey = this.generateKey(prefix, key);
      const result = await this.redis.incr(cacheKey);
      
      if (ttl && result === 1) {
        await this.redis.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  // 获取多个键
  async mget<T>(prefix: string, keys: (string | number)[]): Promise<(T | null)[]> {
    if (!this.isEnabled || !this.redis || keys.length === 0) {
      return new Array(keys.length).fill(null);
    }

    try {
      const cacheKeys = keys.map(key => this.generateKey(prefix, key));
      const values = await this.redis.mget(...cacheKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  // 检查键是否存在
  async exists(prefix: string, key: string | number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false;

    try {
      const cacheKey = this.generateKey(prefix, key);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // 设置TTL
  async expire(prefix: string, key: string | number, ttl: number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false;

    try {
      const cacheKey = this.generateKey(prefix, key);
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  // 获取缓存统计信息
  async getStats(): Promise<any> {
    if (!this.isEnabled || !this.redis) return null;

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      return {
        connected: this.isEnabled,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  // 清空所有相关缓存
  async flush(): Promise<boolean> {
    if (!this.isEnabled || !this.redis) return false;

    try {
      const keys = await this.redis.keys('webspark:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // 关闭连接
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isEnabled = false;
    }
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.isEnabled;
  }
}

// 创建单例实例
export const cache = new CacheManager();

// 缓存键前缀常量
export const CACHE_KEYS = {
  WEBSITES: 'websites',
  WEBSITE_DETAIL: 'website_detail',
  USER: 'user',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  WEBSITE_LIST: 'website_list',
  POPULAR_WEBSITES: 'popular_websites',
  FEATURED_WEBSITES: 'featured_websites',
  USER_PROFILE: 'user_profile',
  SEARCH_RESULTS: 'search_results',
  STATS: 'stats',
  RATE_LIMIT: 'rate_limit',
  ANALYTICS: 'analytics',
  RECOMMENDATIONS: 'recommendations',
  RECOMMENDATION_FEEDBACK: 'rec_feedback'
};

// 缓存时间常量（秒）
export const CACHE_TTL = {
  SHORT: 300,      // 5分钟
  MEDIUM: 1800,    // 30分钟
  LONG: 3600,      // 1小时
  VERY_LONG: 86400 // 24小时
};

// 便捷的缓存装饰器函数
export function cached(
  prefix: string, 
  ttl: number = CACHE_TTL.MEDIUM,
  keyGenerator?: (...args: any[]) => string
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      // 尝试从缓存获取
      const cached = await cache.get(prefix, key);
      if (cached !== null) {
        return cached;
      }

      // 缓存未命中，执行原方法
      const result = await method.apply(this, args);
      
      // 存储到缓存
      if (result !== null && result !== undefined) {
        await cache.set(prefix, key, result, { ttl });
      }
      
      return result;
    };

    return descriptor;
  };
} 