/**
 * 搜索增强服务测试
 */

import { SearchService } from '../../services/searchEnhancement';
import { prisma } from '../../lib/prisma';
import { cache } from '../../lib/cache';
import { createTestUser, createTestWebsite } from '../setup';

describe('SearchService', () => {
  let testUser: any;
  let testWebsites: any[] = [];

  beforeEach(async () => {
    // 创建测试数据
    testUser = await createTestUser();
    
    // 创建多个测试网站
    testWebsites = await Promise.all([
      createTestWebsite(testUser.id, {
        title: 'React Tutorial Website',
        slug: 'react-tutorial',
        shortDescription: 'Learn React step by step',
        description: 'A comprehensive guide to learning React framework',
        viewCount: 100,
        likeCount: 10
      }),
      createTestWebsite(testUser.id, {
        title: 'Vue.js Documentation',
        slug: 'vuejs-docs',
        shortDescription: 'Official Vue.js documentation',
        description: 'Everything you need to know about Vue.js',
        viewCount: 80,
        likeCount: 8
      }),
      createTestWebsite(testUser.id, {
        title: 'JavaScript Best Practices',
        slug: 'js-best-practices',
        shortDescription: 'Modern JavaScript development tips',
        description: 'Best practices for writing clean JavaScript code',
        viewCount: 120,
        likeCount: 15
      })
    ]);

    // 创建标签
    await prisma.tag.createMany({
      data: [
        { name: 'React', slug: 'react' },
        { name: 'Vue', slug: 'vue' },
        { name: 'JavaScript', slug: 'javascript' }
      ]
    });
  });

  describe('search', () => {
    it('应该搜索到相关内容', async () => {
      const results = await SearchService.search('React', {});

      expect(results.websites).toHaveLength(1);
      expect(results.websites[0].title).toBe('React Tutorial Website');
      expect(results.total).toBe(1);
    });

    it('应该支持模糊搜索', async () => {
      const results = await SearchService.search('javascrip', {}); // 故意拼错

      expect(results.websites).toHaveLength(1);
      expect(results.websites[0].title).toBe('JavaScript Best Practices');
    });

    it('应该搜索多个字段', async () => {
      const results = await SearchService.search('documentation', {});

      expect(results.websites).toHaveLength(1);
      expect(results.websites[0].title).toBe('Vue.js Documentation');
    });

    it('应该按相关性排序', async () => {
      // 创建一个标题和描述都包含关键词的网站
      await createTestWebsite(testUser.id, {
        title: 'React React React', // 标题中出现3次
        slug: 'react-x3',
        shortDescription: 'React everywhere',
        description: 'React React React React' // 描述中出现4次
      });

      const results = await SearchService.search('React', {});

      // 相关性最高的应该排在前面
      expect(results.websites[0].title).toBe('React React React');
      expect(results.websites[0].relevanceScore).toBeGreaterThan(
        results.websites[1].relevanceScore
      );
    });

    it('应该支持分页', async () => {
      // 创建更多数据
      for (let i = 0; i < 20; i++) {
        await createTestWebsite(testUser.id, {
          title: `JavaScript Project ${i}`,
          slug: `js-project-${i}`,
          shortDescription: `JavaScript project number ${i}`
        });
      }

      const page1 = await SearchService.search('JavaScript', { 
        page: 1, 
        limit: 10 
      });
      const page2 = await SearchService.search('JavaScript', { 
        page: 2, 
        limit: 10 
      });

      expect(page1.websites).toHaveLength(10);
      expect(page2.websites).toHaveLength(10);
      expect(page1.websites[0].id).not.toBe(page2.websites[0].id);
    });

    it('应该缓存搜索结果', async () => {
      const query = 'React';
      const cacheKey = `search:${query}:{}`;

      // 第一次搜索
      await SearchService.search(query, {});
      
      // 检查缓存
      const cached = await cache.get('search', cacheKey);
      expect(cached).toBeTruthy();

      // 第二次搜索应该从缓存获取
      const spy = jest.spyOn(prisma.website, 'findMany');
      await SearchService.search(query, {});
      
      // 不应该查询数据库
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('应该记录搜索历史（已登录用户）', async () => {
      await SearchService.search('React', { userId: testUser.id });

      const history = await prisma.searchHistory.findFirst({
        where: {
          userId: testUser.id,
          query: 'React'
        }
      });

      expect(history).toBeTruthy();
      expect(history?.count).toBe(1);
    });

    it('应该更新现有搜索历史的计数', async () => {
      // 第一次搜索
      await SearchService.search('React', { userId: testUser.id });
      
      // 第二次搜索相同内容
      await SearchService.search('React', { userId: testUser.id });

      const history = await prisma.searchHistory.findFirst({
        where: {
          userId: testUser.id,
          query: 'React'
        }
      });

      expect(history?.count).toBe(2);
    });
  });

  describe('getSearchSuggestions', () => {
    beforeEach(async () => {
      // 创建搜索历史
      await prisma.searchHistory.createMany({
        data: [
          { userId: testUser.id, query: 'React hooks', count: 10 },
          { userId: testUser.id, query: 'React router', count: 8 },
          { userId: testUser.id, query: 'Vue composition', count: 5 },
          { userId: testUser.id, query: 'JavaScript async', count: 15 }
        ]
      });
    });

    it('应该返回搜索建议', async () => {
      const suggestions = await SearchService.getSearchSuggestions('React');

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].query).toBe('React hooks');
      expect(suggestions[1].query).toBe('React router');
    });

    it('应该按流行度排序', async () => {
      const suggestions = await SearchService.getSearchSuggestions('');

      expect(suggestions[0].query).toBe('JavaScript async'); // count: 15
      expect(suggestions[1].query).toBe('React hooks'); // count: 10
    });

    it('应该限制返回数量', async () => {
      // 创建更多历史
      for (let i = 0; i < 20; i++) {
        await prisma.searchHistory.create({
          data: {
            userId: testUser.id,
            query: `Test query ${i}`,
            count: i
          }
        });
      }

      const suggestions = await SearchService.getSearchSuggestions('Test');
      expect(suggestions).toHaveLength(10); // 默认限制
    });

    it('应该缓存建议结果', async () => {
      const prefix = 'React';
      const cacheKey = `suggestions:${prefix}`;

      await SearchService.getSearchSuggestions(prefix);
      
      const cached = await cache.get('search', cacheKey);
      expect(cached).toBeTruthy();
    });
  });

  describe('getPopularSearches', () => {
    beforeEach(async () => {
      // 创建全局搜索历史
      const users = await Promise.all([
        createTestUser({ email: 'user1@test.com', username: 'user1' }),
        createTestUser({ email: 'user2@test.com', username: 'user2' }),
        createTestUser({ email: 'user3@test.com', username: 'user3' })
      ]);

      await prisma.searchHistory.createMany({
        data: [
          { userId: users[0].id, query: 'React', count: 20 },
          { userId: users[1].id, query: 'React', count: 15 },
          { userId: users[2].id, query: 'React', count: 10 },
          { userId: users[0].id, query: 'Vue', count: 12 },
          { userId: users[1].id, query: 'Vue', count: 8 },
          { userId: users[0].id, query: 'Angular', count: 5 }
        ]
      });
    });

    it('应该返回热门搜索', async () => {
      const popular = await SearchService.getPopularSearches();

      expect(popular[0].query).toBe('React'); // 总计: 45
      expect(popular[0].totalCount).toBe(45);
      expect(popular[1].query).toBe('Vue'); // 总计: 20
      expect(popular[1].totalCount).toBe(20);
    });

    it('应该按时间范围筛选', async () => {
      // 创建旧数据
      await prisma.searchHistory.create({
        data: {
          userId: testUser.id,
          query: 'Old Search',
          count: 100,
          lastSearchedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40天前
        }
      });

      const popular = await SearchService.getPopularSearches(10, 30); // 最近30天

      // 不应该包含旧搜索
      expect(popular.find(p => p.query === 'Old Search')).toBeUndefined();
    });

    it('应该缓存热门搜索', async () => {
      const cacheKey = 'popular:10:7';

      await SearchService.getPopularSearches(10, 7);
      
      const cached = await cache.get('search', cacheKey);
      expect(cached).toBeTruthy();
    });
  });

  describe('getPersonalizedResults', () => {
    let otherUser: any;
    let reactWebsite: any;
    let vueWebsite: any;

    beforeEach(async () => {
      otherUser = await createTestUser({
        email: 'other@test.com',
        username: 'otheruser'
      });

      // 创建特定技术的网站
      reactWebsite = testWebsites[0]; // React Tutorial
      vueWebsite = testWebsites[1]; // Vue.js Documentation

      // 创建用户交互历史
      await prisma.websiteLike.create({
        data: {
          userId: testUser.id,
          websiteId: reactWebsite.id
        }
      });

      await prisma.websiteView.createMany({
        data: [
          { userId: testUser.id, websiteId: reactWebsite.id },
          { userId: testUser.id, websiteId: reactWebsite.id },
          { userId: testUser.id, websiteId: reactWebsite.id }
        ]
      });

      // 其他用户喜欢Vue
      await prisma.websiteLike.create({
        data: {
          userId: otherUser.id,
          websiteId: vueWebsite.id
        }
      });
    });

    it('应该基于用户历史个性化结果', async () => {
      // 创建更多React相关内容
      const newReactSite = await createTestWebsite(testUser.id, {
        title: 'Advanced React Patterns',
        slug: 'advanced-react',
        shortDescription: 'Advanced React development patterns'
      });

      const results = await SearchService.getPersonalizedResults(
        'advanced',
        testUser.id
      );

      // 应该优先推荐React相关内容
      expect(results[0].id).toBe(newReactSite.id);
    });

    it('应该为新用户返回默认结果', async () => {
      const newUser = await createTestUser({
        email: 'newuser@test.com',
        username: 'newuser'
      });

      const results = await SearchService.getPersonalizedResults(
        'JavaScript',
        newUser.id
      );

      // 应该返回基于流行度的结果
      expect(results[0].title).toBe('JavaScript Best Practices');
    });

    it('应该考虑用户的搜索历史', async () => {
      // 用户经常搜索Vue
      await prisma.searchHistory.create({
        data: {
          userId: testUser.id,
          query: 'Vue',
          count: 20
        }
      });

      // 创建Vue相关内容
      const newVueSite = await createTestWebsite(testUser.id, {
        title: 'Vue 3 Guide',
        slug: 'vue3-guide',
        shortDescription: 'Complete guide to Vue 3'
      });

      const results = await SearchService.getPersonalizedResults(
        'guide',
        testUser.id
      );

      // 应该推荐Vue内容
      expect(results.find(r => r.id === newVueSite.id)).toBeTruthy();
    });
  });

  describe('智能搜索功能', () => {
    it('应该处理拼写错误', async () => {
      const results = await SearchService.search('Recat', {}); // React拼错

      expect(results.websites).toHaveLength(1);
      expect(results.websites[0].title).toContain('React');
    });

    it('应该理解同义词', async () => {
      await createTestWebsite(testUser.id, {
        title: 'JS Tutorial',
        slug: 'js-tutorial',
        shortDescription: 'JavaScript tutorial for beginners'
      });

      const results = await SearchService.search('JavaScript', {});

      // 应该同时找到 JavaScript 和 JS
      const titles = results.websites.map(w => w.title);
      expect(titles).toContain('JavaScript Best Practices');
      expect(titles).toContain('JS Tutorial');
    });

    it('应该支持搜索操作符', async () => {
      // 搜索同时包含React和Tutorial的
      const results = await SearchService.search('React AND Tutorial', {});

      expect(results.websites).toHaveLength(1);
      expect(results.websites[0].title).toBe('React Tutorial Website');
    });

    it('应该高亮搜索结果', async () => {
      const results = await SearchService.search('React', {
        highlight: true
      });

      expect(results.websites[0].highlights).toBeDefined();
      expect(results.websites[0].highlights.title).toContain('<mark>React</mark>');
    });
  });
});

