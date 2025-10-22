/**
 * 网站路由测试
 */

import request from 'supertest';
import express from 'express';
import { websiteRoutes } from '../../routes/websites';
import { prisma } from '../../lib/prisma';
import { createTestUser, createTestWebsite, generateAuthToken } from '../setup';
import { authMiddleware } from '../../middleware/auth';

// 设置测试应用
const app = express();
app.use(express.json());
app.use('/api/websites', websiteRoutes);

// Mock认证中间件
jest.mock('../../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer test-token-')) {
      req.user = { id: parseInt(authHeader.split('-')[2]) };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
  }),
  requireAdmin: jest.fn((req, res, next) => {
    if (req.user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
  })
}));

describe('Website Routes', () => {
  let testUser: any;
  let testWebsite: any;
  let authToken: string;

  beforeEach(async () => {
    // 创建测试数据
    testUser = await createTestUser();
    testWebsite = await createTestWebsite(testUser.id);
    authToken = generateAuthToken(testUser.id);
  });

  describe('GET /api/websites', () => {
    it('应该返回网站列表', async () => {
      const res = await request(app)
        .get('/api/websites')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('author');
    });

    it('应该支持分页', async () => {
      // 创建多个测试网站
      for (let i = 0; i < 15; i++) {
        await createTestWebsite(testUser.id, {
          title: `Test Website ${i}`,
          slug: `test-website-${i}`
        });
      }

      const res = await request(app)
        .get('/api/websites?page=2&limit=10')
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.total).toBeGreaterThan(10);
    });

    it('应该支持按状态筛选', async () => {
      await createTestWebsite(testUser.id, {
        status: 'PENDING',
        slug: 'pending-website'
      });

      const res = await request(app)
        .get('/api/websites?status=PENDING')
        .expect(200);

      expect(res.body.data.every((w: any) => w.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /api/websites/:id', () => {
    it('应该返回单个网站详情', async () => {
      const res = await request(app)
        .get(`/api/websites/${testWebsite.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testWebsite.id);
      expect(res.body.data.title).toBe(testWebsite.title);
      expect(res.body.data).toHaveProperty('author');
      expect(res.body.data).toHaveProperty('tags');
    });

    it('应该返回404当网站不存在时', async () => {
      const res = await request(app)
        .get('/api/websites/99999')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('应该记录浏览历史（已登录用户）', async () => {
      await request(app)
        .get(`/api/websites/${testWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const view = await prisma.websiteView.findFirst({
        where: {
          websiteId: testWebsite.id,
          userId: testUser.id
        }
      });

      expect(view).toBeTruthy();
    });
  });

  describe('POST /api/websites', () => {
    const newWebsiteData = {
      title: 'New Test Website',
      url: 'https://newtest.com',
      shortDescription: 'A new test website',
      description: 'Detailed description of the new test website',
      tags: ['test', 'demo']
    };

    it('应该创建新网站（需要认证）', async () => {
      const res = await request(app)
        .post('/api/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newWebsiteData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newWebsiteData.title);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.authorId).toBe(testUser.id);
    });

    it('应该拒绝未认证的请求', async () => {
      await request(app)
        .post('/api/websites')
        .send(newWebsiteData)
        .expect(401);
    });

    it('应该验证必填字段', async () => {
      const res = await request(app)
        .post('/api/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only Title' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该验证URL格式', async () => {
      const res = await request(app)
        .post('/api/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...newWebsiteData, url: 'invalid-url' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toContain('url');
    });
  });

  describe('PUT /api/websites/:id', () => {
    const updateData = {
      title: 'Updated Title',
      description: 'Updated description'
    };

    it('应该更新自己的网站', async () => {
      const res = await request(app)
        .put(`/api/websites/${testWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.description).toBe(updateData.description);
    });

    it('应该阻止更新他人的网站', async () => {
      const otherUser = await createTestUser({ 
        email: 'other@example.com',
        username: 'otheruser'
      });
      const otherWebsite = await createTestWebsite(otherUser.id);

      await request(app)
        .put(`/api/websites/${otherWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });

    it('更新后应该重置为PENDING状态', async () => {
      const res = await request(app)
        .put(`/api/websites/${testWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data.status).toBe('PENDING');
    });
  });

  describe('DELETE /api/websites/:id', () => {
    it('应该软删除自己的网站', async () => {
      const res = await request(app)
        .delete(`/api/websites/${testWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // 验证软删除
      const website = await prisma.website.findUnique({
        where: { id: testWebsite.id }
      });
      expect(website?.deletedAt).toBeTruthy();
    });

    it('应该阻止删除他人的网站', async () => {
      const otherUser = await createTestUser({ 
        email: 'other2@example.com',
        username: 'otheruser2'
      });
      const otherWebsite = await createTestWebsite(otherUser.id);

      await request(app)
        .delete(`/api/websites/${otherWebsite.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/websites/:id/like', () => {
    it('应该点赞网站', async () => {
      const res = await request(app)
        .put(`/api/websites/${testWebsite.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.liked).toBe(true);
      expect(res.body.data.likeCount).toBe(1);

      // 验证数据库
      const like = await prisma.websiteLike.findUnique({
        where: {
          userId_websiteId: {
            userId: testUser.id,
            websiteId: testWebsite.id
          }
        }
      });
      expect(like).toBeTruthy();
    });

    it('应该取消点赞', async () => {
      // 先点赞
      await prisma.websiteLike.create({
        data: {
          userId: testUser.id,
          websiteId: testWebsite.id
        }
      });
      await prisma.website.update({
        where: { id: testWebsite.id },
        data: { likeCount: 1 }
      });

      const res = await request(app)
        .put(`/api/websites/${testWebsite.id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.liked).toBe(false);
      expect(res.body.data.likeCount).toBe(0);
    });

    it('应该使用事务保证数据一致性', async () => {
      // 模拟并发点赞
      const promises = Array(5).fill(null).map(() => 
        request(app)
          .put(`/api/websites/${testWebsite.id}/like`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      await Promise.all(promises);

      // 验证最终状态
      const website = await prisma.website.findUnique({
        where: { id: testWebsite.id }
      });
      const likeCount = await prisma.websiteLike.count({
        where: { websiteId: testWebsite.id }
      });

      expect(website?.likeCount).toBe(likeCount);
    });
  });

  describe('GET /api/websites/sorted-list', () => {
    beforeEach(async () => {
      // 创建多个网站用于排序测试
      const now = Date.now();
      
      await createTestWebsite(testUser.id, {
        title: 'Popular Old',
        slug: 'popular-old',
        likeCount: 10,
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000) // 7天前
      });

      await createTestWebsite(testUser.id, {
        title: 'New Hot',
        slug: 'new-hot',
        likeCount: 5,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) // 1天前
      });

      await createTestWebsite(testUser.id, {
        title: 'Very New',
        slug: 'very-new',
        likeCount: 0,
        createdAt: new Date(now) // 现在
      });
    });

    it('应该按热度算法排序', async () => {
      const res = await request(app)
        .get('/api/websites/sorted-list')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // 验证排序（分数高的在前）
      for (let i = 1; i < res.body.data.length; i++) {
        const prevScore = res.body.data[i-1].likeCount * 5 + 
                         new Date(res.body.data[i-1].createdAt).getTime() / 10000;
        const currScore = res.body.data[i].likeCount * 5 + 
                         new Date(res.body.data[i].createdAt).getTime() / 10000;
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    });
  });

  describe('Admin Routes', () => {
    let adminUser: any;
    let adminToken: string;

    beforeEach(async () => {
      adminUser = await createTestUser({
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN'
      });
      adminToken = generateAuthToken(adminUser.id);
    });

    describe('PUT /api/websites/:id/approve', () => {
      it('管理员应该能批准网站', async () => {
        const pendingWebsite = await createTestWebsite(testUser.id, {
          status: 'PENDING',
          slug: 'pending-for-approval'
        });

        const res = await request(app)
          .put(`/api/websites/${pendingWebsite.id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('APPROVED');
      });

      it('普通用户不能批准网站', async () => {
        const pendingWebsite = await createTestWebsite(testUser.id, {
          status: 'PENDING',
          slug: 'pending-for-user'
        });

        await request(app)
          .put(`/api/websites/${pendingWebsite.id}/approve`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/websites/:id/reject', () => {
      it('管理员应该能拒绝网站', async () => {
        const pendingWebsite = await createTestWebsite(testUser.id, {
          status: 'PENDING',
          slug: 'pending-for-rejection'
        });

        const res = await request(app)
          .put(`/api/websites/${pendingWebsite.id}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Invalid content' })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('REJECTED');
      });
    });
  });
});

