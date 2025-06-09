/**
 * 缓存服务
 * 用于缓存热门查询结果，提升性能
 */

class CacheService {
  private cache = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

  // 生成缓存键
  private generateKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  // 设置缓存
  set(key: string, value: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.TTL);
    this.cache.set(key, { value, expiry });
  }

  // 获取缓存
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // 删除缓存
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 缓存网站列表
  async cacheWebsiteList(params: any, fetcher: () => Promise<any>): Promise<any> {
    const key = this.generateKey('websites:sorted', params);
    const cached = this.get(key);
    
    if (cached) {
      return cached;
    }

    const result = await fetcher();
    this.set(key, result);
    return result;
  }

  // 使网站相关缓存失效
  invalidateWebsiteCache(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('websites:')) {
        this.cache.delete(key);
      }
    }
  }
}

export default new CacheService();

// 定期清理过期缓存
setInterval(() => {
  const cacheService = require('./cache').default;
  cacheService.cleanup();
}, 60 * 1000); // 每分钟清理一次 