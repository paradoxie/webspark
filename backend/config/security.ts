/**
 * 安全配置
 * 配置各种安全中间件和策略
 */

export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  // 内容安全策略 (CSP)
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'connect-src': ["'self'", 'https:'],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://lh3.googleusercontent.com',
        'https://avatars.githubusercontent.com',
      ],
      'media-src': ["'self'", 'data:', 'blob:'],
      upgradeInsecureRequests: null,
    },
  },
  // CORS配置
  cors: {
    enabled: true,
    origin: env.array('CORS_ORIGIN', ['http://localhost:3000', 'https://webspark.club']),
    expose: [
      'WWW-Authenticate',
      'Server-Authorization',
      'X-Total-Count',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 31536000,
  },
  // 其他安全头
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: 'same-origin',
}); 