/**
 * 增强的搜索服务
 * 提供智能搜索、搜索建议、热门搜索等功能
 */

import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { Prisma } from '@prisma/client';

interface SearchOptions {
  query: string;
  type?: 'all' | 'websites' | 'users' | 'tags' | 'categories';
  filters?: {
    category?: number;
    tags?: string[];
    author?: string;
    dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
    featured?: boolean;
    hasSource?: boolean;
    minLikes?: number;
    minViews?: number;
  };
  sort?: 'relevance' | 'newest' | 'oldest' | 'popular' | 'trending';
  page?: number;
  pageSize?: number;
  userId?: number; // 用于个性化搜索
}

interface SearchResult {
  websites?: any[];
  users?: any[];
  tags?: any[];
  categories?: any[];
  total: number;
  suggestions?: string[];
  relatedSearches?: string[];
  facets?: SearchFacets;
}

interface SearchFacets {
  categories: Array<{ id: number; name: string; count: number }>;
  tags: Array<{ id: number; name: string; count: number }>;
  dateRanges: Array<{ range: string; count: number }>;
}

export class SearchService {
  /**
   * 执行智能搜索
   */
  static async search(options: SearchOptions): Promise<SearchResult> {
    const {
      query,
      type = 'all',
      filters = {},
      sort = 'relevance',
      page = 1,
      pageSize = 12,
      userId
    } = options;

    // 记录搜索历史
    if (userId && query) {
      await this.recordSearchHistory(userId, query);
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(options);
    const cached = await cache.get('search', cacheKey);
    if (cached) {
      return cached as SearchResult;
    }

    let result: SearchResult = {
      total: 0
    };

    // 根据搜索类型执行不同的搜索策略
    switch (type) {
      case 'websites':
        result = await this.searchWebsites(query, filters, sort, page, pageSize, userId);
        break;
      case 'users':
        result = await this.searchUsers(query, page, pageSize);
        break;
      case 'tags':
        result = await this.searchTags(query, page, pageSize);
        break;
      case 'categories':
        result = await this.searchCategories(query, page, pageSize);
        break;
      case 'all':
      default:
        result = await this.searchAll(query, filters, sort, page, pageSize, userId);
        break;
    }

    // 添加搜索建议和相关搜索
    if (query) {
      result.suggestions = await this.getSearchSuggestions(query);
      result.relatedSearches = await this.getRelatedSearches(query);
    }

    // 添加搜索面板（facets）
    if (type === 'websites' || type === 'all') {
      result.facets = await this.getSearchFacets(query, filters);
    }

    // 缓存结果
    await cache.set('search', cacheKey, result, { ttl: CACHE_TTL.SHORT });

    return result;
  }

  /**
   * 搜索网站
   */
  private static async searchWebsites(
    query: string,
    filters: any,
    sort: string,
    page: number,
    pageSize: number,
    userId?: number
  ): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Prisma.WebsiteWhereInput = {
      status: 'APPROVED',
      deletedAt: null
    };

    // 文本搜索
    if (query) {
      // 计算搜索相关性分数
      const searchTerms = this.tokenizeQuery(query);
      
      where.OR = [
        // 标题完全匹配（最高权重）
        { title: { equals: query, mode: 'insensitive' } },
        // 标题包含所有词（高权重）
        ...searchTerms.map(term => ({
          title: { contains: term, mode: 'insensitive' as const }
        })),
        // 简短描述匹配（中权重）
        { shortDescription: { contains: query, mode: 'insensitive' } },
        // 详细描述匹配（低权重）
        { description: { contains: query, mode: 'insensitive' } },
        // 标签匹配
        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
        // 作者匹配
        { author: { name: { contains: query, mode: 'insensitive' } } }
      ];
    }

    // 应用过滤器
    this.applyFilters(where, filters);

    // 获取总数
    const total = await prisma.website.count({ where });

    // 执行查询
    let websites: any[];
    
    if (sort === 'relevance' && query) {
      // 使用原生SQL进行相关性排序
      websites = await this.searchWithRelevanceScore(query, where, skip, pageSize);
    } else {
      // 使用Prisma查询
      const orderBy = this.getOrderBy(sort);
      
      websites = await prisma.website.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          },
          tags: true,
          category: true,
          _count: {
            select: {
              comments: true,
              likedBy: true,
              bookmarkedBy: true
            }
          }
        }
      });
    }

    // 个性化排序调整
    if (userId) {
      websites = await this.personalizeResults(websites, userId);
    }

    return {
      websites,
      total
    };
  }

  /**
   * 搜索用户
   */
  private static async searchUsers(
    query: string,
    page: number,
    pageSize: number
  ): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              websites: true,
              followers: true,
              following: true
            }
          }
        },
        orderBy: {
          websites: {
            _count: 'desc'
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total
    };
  }

  /**
   * 搜索标签
   */
  private static async searchTags(
    query: string,
    page: number,
    pageSize: number
  ): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.TagWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } }
      ]
    };

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              websites: true
            }
          }
        },
        orderBy: {
          websites: {
            _count: 'desc'
          }
        }
      }),
      prisma.tag.count({ where })
    ]);

    return {
      tags,
      total
    };
  }

  /**
   * 搜索分类
   */
  private static async searchCategories(
    query: string,
    page: number,
    pageSize: number
  ): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.CategoryWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              websites: true
            }
          }
        },
        orderBy: {
          sortOrder: 'asc'
        }
      }),
      prisma.category.count({ where })
    ]);

    return {
      categories,
      total
    };
  }

  /**
   * 全局搜索
   */
  private static async searchAll(
    query: string,
    filters: any,
    sort: string,
    page: number,
    pageSize: number,
    userId?: number
  ): Promise<SearchResult> {
    // 并行搜索所有类型，每种类型取前5个结果
    const [websites, users, tags, categories] = await Promise.all([
      this.searchWebsites(query, filters, sort, 1, 5, userId),
      this.searchUsers(query, 1, 5),
      this.searchTags(query, 1, 5),
      this.searchCategories(query, 1, 5)
    ]);

    return {
      websites: websites.websites,
      users: users.users,
      tags: tags.tags,
      categories: categories.categories,
      total: (websites.total || 0) + (users.total || 0) + 
             (tags.total || 0) + (categories.total || 0)
    };
  }

  /**
   * 获取搜索建议
   */
  static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // 从搜索历史中获取建议
    const suggestions = await prisma.$queryRaw<Array<{ query: string }>>`
      SELECT DISTINCT query
      FROM search_history
      WHERE query LIKE ${query + '%'}
      GROUP BY query
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;

    return suggestions.map(s => s.query);
  }

  /**
   * 获取相关搜索
   */
  static async getRelatedSearches(query: string): Promise<string[]> {
    // 获取搜索过该词的用户还搜索了什么
    const related = await prisma.$queryRaw<Array<{ query: string }>>`
      SELECT sh2.query, COUNT(*) as count
      FROM search_history sh1
      JOIN search_history sh2 ON sh1.userId = sh2.userId
      WHERE sh1.query = ${query}
        AND sh2.query != ${query}
        AND sh2.createdAt > sh1.createdAt
      GROUP BY sh2.query
      ORDER BY count DESC
      LIMIT 5
    `;

    return related.map(r => r.query);
  }

  /**
   * 获取热门搜索
   */
  static async getTrendingSearches(limit: number = 10): Promise<string[]> {
    const cached = await cache.get('search', 'trending');
    if (cached) {
      return cached as string[];
    }

    const trending = await prisma.$queryRaw<Array<{ query: string }>>`
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const results = trending.map(t => t.query);
    
    await cache.set('search', 'trending', results, { ttl: CACHE_TTL.MEDIUM });
    
    return results;
  }

  /**
   * 获取搜索面板数据
   */
  private static async getSearchFacets(
    query: string,
    filters: any
  ): Promise<SearchFacets> {
    const baseWhere: Prisma.WebsiteWhereInput = {
      status: 'APPROVED',
      deletedAt: null
    };

    if (query) {
      baseWhere.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // 获取分类分布
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            websites: {
              where: baseWhere
            }
          }
        }
      }
    });

    // 获取标签分布
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            websites: {
              where: baseWhere
            }
          }
        }
      },
      orderBy: {
        websites: {
          _count: 'desc'
        }
      },
      take: 20
    });

    // 获取时间分布
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.website.count({ where: { ...baseWhere, createdAt: { gte: dayAgo } } }),
      prisma.website.count({ where: { ...baseWhere, createdAt: { gte: weekAgo } } }),
      prisma.website.count({ where: { ...baseWhere, createdAt: { gte: monthAgo } } }),
      prisma.website.count({ where: baseWhere })
    ]);

    return {
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        count: c._count.websites
      })),
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        count: t._count.websites
      })),
      dateRanges: [
        { range: 'day', count: dayCount },
        { range: 'week', count: weekCount },
        { range: 'month', count: monthCount },
        { range: 'all', count: totalCount }
      ]
    };
  }

  /**
   * 记录搜索历史
   */
  private static async recordSearchHistory(userId: number, query: string): Promise<void> {
    try {
      await prisma.searchHistory.create({
        data: {
          userId,
          query,
          searchCount: 1
        }
      });
    } catch (error) {
      // 如果已存在，更新计数
      await prisma.searchHistory.updateMany({
        where: {
          userId,
          query
        },
        data: {
          searchCount: { increment: 1 },
          createdAt: new Date()
        }
      });
    }
  }

  /**
   * 个性化搜索结果
   */
  private static async personalizeResults(
    websites: any[],
    userId: number
  ): Promise<any[]> {
    // 获取用户偏好
    const userPreferences = await this.getUserPreferences(userId);
    
    // 根据用户偏好调整排序
    return websites.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // 偏好的标签
      if (userPreferences.preferredTags) {
        scoreA += a.tags.filter((t: any) => 
          userPreferences.preferredTags.includes(t.id)
        ).length * 10;
        scoreB += b.tags.filter((t: any) => 
          userPreferences.preferredTags.includes(t.id)
        ).length * 10;
      }
      
      // 关注的作者
      if (userPreferences.followedAuthors) {
        if (userPreferences.followedAuthors.includes(a.authorId)) scoreA += 20;
        if (userPreferences.followedAuthors.includes(b.authorId)) scoreB += 20;
      }
      
      return scoreB - scoreA;
    });
  }

  /**
   * 获取用户偏好
   */
  private static async getUserPreferences(userId: number): Promise<any> {
    // 获取用户的历史行为数据
    const [likedTags, followedAuthors] = await Promise.all([
      // 用户点赞最多的标签
      prisma.$queryRaw<Array<{ tagId: number }>>`
        SELECT t.id as tagId, COUNT(*) as count
        FROM website_likes wl
        JOIN websites w ON wl.websiteId = w.id
        JOIN _WebsiteTags wt ON w.id = wt.A
        JOIN tags t ON wt.B = t.id
        WHERE wl.userId = ${userId}
        GROUP BY t.id
        ORDER BY count DESC
        LIMIT 10
      `,
      
      // 用户关注的作者
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })
    ]);

    return {
      preferredTags: likedTags.map(t => t.tagId),
      followedAuthors: followedAuthors.map(f => f.followingId)
    };
  }

  // 工具方法

  private static tokenizeQuery(query: string): string[] {
    return query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  }

  private static generateCacheKey(options: SearchOptions): string {
    return `search_${JSON.stringify(options)}`;
  }

  private static applyFilters(where: any, filters: any): void {
    if (filters.category) {
      where.categoryId = filters.category;
    }
    
    if (filters.tags?.length) {
      where.tags = {
        some: {
          slug: { in: filters.tags }
        }
      };
    }
    
    if (filters.author) {
      where.author = {
        OR: [
          { username: { contains: filters.author, mode: 'insensitive' } },
          { name: { contains: filters.author, mode: 'insensitive' } }
        ]
      };
    }
    
    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }
    
    if (filters.hasSource !== undefined) {
      where.sourceUrl = filters.hasSource ? { not: null } : null;
    }
    
    if (filters.minLikes) {
      where.likeCount = { gte: filters.minLikes };
    }
    
    if (filters.minViews) {
      where.viewCount = { gte: filters.minViews };
    }
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      where.createdAt = { gte: startDate };
    }
  }

  private static getOrderBy(sort: string): any {
    switch (sort) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'oldest':
        return { createdAt: 'asc' };
      case 'popular':
        return { likeCount: 'desc' };
      case 'trending':
        return [
          { viewCount: 'desc' },
          { likeCount: 'desc' }
        ];
      default:
        return { createdAt: 'desc' };
    }
  }

  private static async searchWithRelevanceScore(
    query: string,
    where: any,
    skip: number,
    take: number
  ): Promise<any[]> {
    // 使用原生SQL计算相关性分数
    // 这里简化处理，实际可以使用全文搜索引擎如Elasticsearch
    const whereConditions = this.buildWhereClause(where);
    
    const results = await prisma.$queryRaw`
      SELECT 
        w.*,
        (
          CASE WHEN LOWER(w.title) = LOWER(${query}) THEN 100
               WHEN LOWER(w.title) LIKE LOWER(${`%${query}%`}) THEN 50
               ELSE 0 END +
          CASE WHEN LOWER(w.shortDescription) LIKE LOWER(${`%${query}%`}) THEN 20
               ELSE 0 END +
          CASE WHEN LOWER(w.description) LIKE LOWER(${`%${query}%`}) THEN 10
               ELSE 0 END
        ) as relevance_score
      FROM websites w
      WHERE ${Prisma.sql([whereConditions])}
      ORDER BY relevance_score DESC, w.likeCount DESC
      LIMIT ${take} OFFSET ${skip}
    `;
    
    return results;
  }

  private static buildWhereClause(where: any): string {
    // 简化的WHERE子句构建
    const conditions = ['status = "APPROVED"', 'deletedAt IS NULL'];
    
    // 这里应该根据where对象构建完整的SQL条件
    // 为了简化，这里只处理基本条件
    
    return conditions.join(' AND ');
  }
}
