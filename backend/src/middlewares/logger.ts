/**
 * 自定义日志中间件
 * 记录API请求、响应时间和错误信息
 */

export default (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();
    const { method, url, ip } = ctx.request;
    
    strapi.log.info(`📥 ${method} ${url} from ${ip}`);
    
    try {
      await next();
      
      const ms = Date.now() - start;
      const { status } = ctx.response;
      
      // 根据响应时间和状态码选择日志级别
      if (status >= 400) {
        strapi.log.error(`🔴 ${method} ${url} - ${status} - ${ms}ms`);
      } else if (ms > 1000) {
        strapi.log.warn(`🟡 ${method} ${url} - ${status} - ${ms}ms (slow)`);
      } else {
        strapi.log.info(`✅ ${method} ${url} - ${status} - ${ms}ms`);
      }
      
      // 设置性能头部信息
      ctx.set('X-Response-Time', `${ms}ms`);
      
    } catch (error) {
      const ms = Date.now() - start;
      strapi.log.error(`💥 ${method} ${url} - ERROR - ${ms}ms`, error);
      throw error;
    }
  };
}; 