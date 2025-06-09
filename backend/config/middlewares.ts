export default [
  // 自定义中间件
  {
    name: 'global::logger',
    config: {},
  },
  {
    name: 'global::rate-limiter',
    config: {
      max: 1000, // 增加到每15分钟1000个请求
      windowMs: 15 * 60 * 1000,
      message: 'Too many requests from this IP, please try again later.',
      // 排除管理后台路径
      skip: (request) => {
        return request.url.startsWith('/admin') || request.url.startsWith('/_health');
      },
    },
  },
  
  // Strapi内置中间件
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      origin: ['http://localhost:3000', 'https://webspark.club'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
