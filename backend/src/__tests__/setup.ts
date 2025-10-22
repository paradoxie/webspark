/**
 * 测试环境设置
 */

import { prisma } from '../lib/prisma';
import { cache } from '../lib/cache';
import dotenv from 'dotenv';

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 全局测试设置
beforeAll(async () => {
  // 确保使用测试数据库
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error('Not using test database! Check .env.test configuration.');
  }
  
  // 清理并迁移数据库
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
  `;
  
  for (const { TABLE_NAME } of tables) {
    if (TABLE_NAME !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
    }
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
});

// 每个测试后清理
afterEach(async () => {
  // 清理缓存
  await cache.flush();
});

// 全局清理
afterAll(async () => {
  await prisma.$disconnect();
  await cache.close();
});

// 测试助手函数
export const createTestUser = async (data?: Partial<any>) => {
  return await prisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      username: data?.username || 'testuser',
      githubId: data?.githubId || `test_github_${Date.now()}`,
      name: data?.name || 'Test User',
      role: data?.role || 'USER',
      ...data
    }
  });
};

export const createTestWebsite = async (authorId: number, data?: Partial<any>) => {
  return await prisma.website.create({
    data: {
      title: data?.title || 'Test Website',
      url: data?.url || 'https://test.com',
      slug: data?.slug || 'test-website',
      shortDescription: data?.shortDescription || 'Test description',
      description: data?.description || 'Test detailed description',
      status: data?.status || 'APPROVED',
      authorId,
      ...data
    }
  });
};

export const generateAuthToken = (userId: number) => {
  // 这里应该使用实际的JWT生成逻辑
  return `test-token-${userId}`;
};

