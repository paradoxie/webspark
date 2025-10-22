// import type { Core } from '@strapi/strapi';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './db';
import { 
  securityHeaders, 
  validateInput, 
  validateUrls, 
  validateUserData,
  validateCsrfToken,
  validateApiKey 
} from './middleware/security';
import { CryptoUtils } from './utils/crypto';
import { SecurityAuditLogger } from './utils/securityAudit';
import { logger, httpLogger, systemMonitor, setupErrorMonitoring, createMonitoringRoutes } from './utils/monitoring';
import structuredLogger from './utils/structuredLogger';
import { errorNotificationMiddleware } from './services/errorNotificationService';

// 导入路由
import websiteRoutes from './routes/websites';
import tagRoutes from './routes/tags';
import categoryRoutes from './routes/categories';
import commentRoutes from './routes/comments';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
import searchRoutes from './routes/search';
import securityRoutes from './routes/security';
import analyticsRoutes from './routes/analytics';
import statsRoutes from './routes/stats';
import recommendationRoutes from './routes/recommendations';
import searchHistoryRoutes from './routes/searchHistory';
import activityRoutes from './routes/activity';
import logRoutes from './routes/logs';
import healthRoutes from './routes/health';

const app = express();

// 设置错误监控
setupErrorMonitoring();

// 基础配置
app.set('trust proxy', 1);

// HTTP请求日志
app.use(httpLogger);

// Session配置
app.use(session({
  secret: process.env.SESSION_SECRET || CryptoUtils.generateSecureRandom(64),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    sameSite: 'strict'
  },
  name: 'webspark.sid'
}));

// 增强的安全中间件
app.use(securityHeaders());

// API密钥验证
app.use(validateApiKey);

// CORS配置
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:3000', 'https://webspark.club'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析中间件
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // 验证JSON格式并检查是否包含恶意内容
    try {
      JSON.parse(buf.toString());
    } catch (error) {
      const err = new Error('Invalid JSON format') as any;
      err.status = 400;
      throw err;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 全局安全验证中间件
app.use('/api', validateInput);
app.use('/api', validateUrls);

// 用户相关路由的额外验证
app.use('/api/users', validateUserData);
app.use('/api/auth', validateUserData);

// CSRF保护
app.use('/api', validateCsrfToken);

// 设置请求上下文（结构化日志）
app.use((req, res, next) => {
  structuredLogger.setRequestContext(req);
  next();
});

// CSRF Token生成端点
app.get('/api/csrf-token', (req, res) => {
  const token = CryptoUtils.generateCsrfToken();
  if (req.session) {
    req.session.csrfToken = token;
  }
  res.json({ csrfToken: token });
});

// 健康检查路由（不需要认证）
app.use('/health', healthRoutes);

// 监控路由（需要管理员权限或特定密钥）
app.use('/monitoring', createMonitoringRoutes());

// API路由
app.use('/api/websites', websiteRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search-history', searchHistoryRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/logs', logRoutes);

// 错误通知中间件
app.use(errorNotificationMiddleware);

// 错误处理
app.use(errorHandler);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = config.port;

// 初始化安全审计日志
SecurityAuditLogger.init().then(() => {
  console.log('🔒 Security audit logger initialized');
}).catch((error) => {
  console.error('Failed to initialize security audit logger:', error);
});

app.listen(PORT, () => {
  console.log(`🚀 WebSpark Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log('🗄️  Database connected');
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Monitoring: http://localhost:${PORT}/monitoring/metrics`);
  
  // 启动系统监控
  systemMonitor.start(60000); // 每分钟收集一次系统指标
  logger.info('System monitoring started');
});

export default app;
