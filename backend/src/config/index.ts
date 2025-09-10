import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // NextAuth.js JWT 验证
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  
  // 数据库
  databaseUrl: process.env.DATABASE_URL || '',
  
  // 文件上传
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB
  }
};

// 验证必需的环境变量
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
} 