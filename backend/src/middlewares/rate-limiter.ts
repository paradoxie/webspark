/**
 * API速率限制中间件
 * 防止恶意请求和爬虫攻击
 */

const rateLimitStore = new Map();

interface RateLimit {
  count: number;
  resetTime: number;
}

export default (config, { strapi }) => {
  const {
    max = 100, // 每个窗口期最大请求数
    windowMs = 15 * 60 * 1000, // 窗口期（默认15分钟）
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (ctx, next) => {
    const ip = ctx.request.ip;
    const now = Date.now();
    const key = `rate_limit:${ip}`;
    
    // 跳过管理后台和健康检查请求
    if (ctx.request.url.startsWith('/admin') || 
        ctx.request.url.startsWith('/_health') ||
        ctx.request.url.includes('vite') ||
        ctx.request.url.includes('.js') ||
        ctx.request.url.includes('.css')) {
      await next();
      return;
    }
    
    // 获取当前IP的限制信息
    let limit = rateLimitStore.get(key) as RateLimit;
    
    // 如果没有记录或者已过期，重置计数
    if (!limit || now > limit.resetTime) {
      limit = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    // 增加请求计数
    limit.count++;
    rateLimitStore.set(key, limit);
    
    // 设置响应头
    ctx.set('X-RateLimit-Limit', max.toString());
    ctx.set('X-RateLimit-Remaining', Math.max(0, max - limit.count).toString());
    ctx.set('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());
    
    // 检查是否超过限制
    if (limit.count > max) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message,
          details: {
            limit: max,
            windowMs,
            retryAfter: Math.ceil((limit.resetTime - now) / 1000),
          },
        },
      };
      return;
    }
    
    await next();
    
    // 根据配置决定是否计入成功/失败请求
    if ((skipSuccessfulRequests && ctx.status < 400) || 
        (skipFailedRequests && ctx.status >= 400)) {
      limit.count--;
      rateLimitStore.set(key, limit);
    }
  };
}; 