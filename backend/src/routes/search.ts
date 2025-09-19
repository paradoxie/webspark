import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { optionalAuth, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 高级搜索验证schema
const advancedSearchSchema = Joi.object({
  query: Joi.string().max(100).optional().allow(''),
  category: Joi.number().integer().positive().optional(),
  tags: Joi.array().items(Joi.string()).max(10).optional(),
  author: Joi.string().max(50).optional().allow(''),
  dateRange: Joi.string().valid('day', 'week', 'month', 'year', 'all').optional(),
  sortBy: Joi.string().valid('newest', 'oldest', 'popular', 'views', 'hot').optional(),
  featured: Joi.boolean().optional(),
  hasSource: Joi.boolean().optional(),
  isHiring: Joi.boolean().optional(),
  minLikes: Joi.number().integer().min(0).optional(),
  minViews: Joi.number().integer().min(0).optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(50).optional(),
});

// 高级搜索
router.get('/advanced', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // 验证查询参数
  const { error, value } = advancedSearchSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      error: 'Invalid search parameters',
      details: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const {
    query = '',
    category,
    tags = [],
    author = '',
    dateRange = 'all',
    sortBy = 'newest',
    featured,
    hasSource,
    isHiring,
    minLikes = 0,
    minViews = 0,
    page = 1,
    pageSize = 12
  } = value;

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: any = {
    status: 'APPROVED',
    deletedAt: null
  };

  // 文本搜索
  if (query.trim()) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { some: { name: { contains: query, mode: 'insensitive' } } } }
    ];
  }

  // 分类筛选
  if (category) {
    where.categoryId = category;
  }

  // 标签筛选
  if (tags.length > 0) {
    where.tags = {
      some: {
        name: { in: tags }
      }
    };
  }

  // 作者筛选
  if (author.trim()) {
    where.author = {
      OR: [
        { username: { contains: author, mode: 'insensitive' } },
        { name: { contains: author, mode: 'insensitive' } }
      ]
    };
  }

  // 日期范围筛选
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
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

    where.createdAt = {
      gte: startDate
    };
  }

  // 精选状态筛选
  if (typeof featured === 'boolean') {
    where.featured = featured;
  }

  // 源码链接筛选
  if (typeof hasSource === 'boolean') {
    if (hasSource) {
      where.sourceUrl = { not: null };
    } else {
      where.sourceUrl = null;
    }
  }

  // 求职状态筛选
  if (typeof isHiring === 'boolean') {
    where.isHiring = isHiring;
  }

  // 最小点赞数筛选
  if (minLikes > 0) {
    where.likeCount = { gte: minLikes };
  }

  // 最小浏览数筛选
  if (minViews > 0) {
    where.viewCount = { gte: minViews };
  }

  // 排序方式
  let orderBy: any;
  switch (sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'popular':
      orderBy = { likeCount: 'desc' };
      break;
    case 'views':
      orderBy = { viewCount: 'desc' };
      break;
    case 'hot':
      // 热度排序需要使用原生SQL
      const hotWebsites = await prisma.$queryRaw`
        SELECT 
          w.id,
          (w.likeCount * 5 + UNIX_TIMESTAMP(w.createdAt) / 10000) as score
        FROM websites w
        WHERE w.status = 'APPROVED' 
          AND w.deletedAt IS NULL
          ${category ? Prisma.sql`AND w.categoryId = ${category}` : Prisma.sql``}
          ${minLikes > 0 ? Prisma.sql`AND w.likeCount >= ${minLikes}` : Prisma.sql``}
          ${minViews > 0 ? Prisma.sql`AND w.viewCount >= ${minViews}` : Prisma.sql``}
        ORDER BY score DESC
        LIMIT ${pageSize} OFFSET ${skip}
      ` as any[];

      const websiteIds = hotWebsites.map(w => w.id);
      
      const websites = await prisma.website.findMany({
        where: { id: { in: websiteIds } },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      });

      const total = await prisma.website.count({ where });

      return res.json({
        data: websites,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total
          },
          searchParams: value
        }
      });
    default:
      orderBy = { createdAt: 'desc' };
  }

  // 执行查询
  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        }
      },
      orderBy,
      skip,
      take: pageSize
    }),
    prisma.website.count({ where })
  ]);

  res.json({
    data: websites,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
      },
      searchParams: value
    }
  });
}));

// 搜索建议（自动完成）
router.get('/suggestions', asyncHandler(async (req: Request, res: Response) => {
  const { query, type = 'all' } = req.query;

  if (!query || (query as string).length < 2) {
    return res.json({ data: [] });
  }

  const searchTerm = query as string;
  const suggestions = [];

  try {
    if (type === 'all' || type === 'websites') {
      // 网站标题建议
      const websites = await prisma.website.findMany({
        where: {
          status: 'APPROVED',
          deletedAt: null,
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { title: true },
        take: 5
      });
      
      suggestions.push(...websites.map(w => ({
        type: 'website',
        value: w.title,
        label: w.title
      })));
    }

    if (type === 'all' || type === 'tags') {
      // 标签建议
      const tags = await prisma.tag.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true },
        take: 5
      });
      
      suggestions.push(...tags.map(t => ({
        type: 'tag',
        value: t.name,
        label: `#${t.name}`
      })));
    }

    if (type === 'all' || type === 'authors') {
      // 作者建议
      const authors = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } }
          ],
          isActive: true
        },
        select: { username: true, name: true },
        take: 5
      });
      
      suggestions.push(...authors.map(a => ({
        type: 'author',
        value: a.username,
        label: `@${a.name || a.username}`
      })));
    }

    // 去重并限制数量
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.value === item.value)
      )
      .slice(0, 10);

    res.json({
      data: uniqueSuggestions
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.json({ data: [] });
  }
}));

// 热门搜索词
router.get('/trending', asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取最近30天最受欢迎的标签
    const popularTags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: {
            websites: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      },
      orderBy: {
        websites: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // 获取最近的热门分类
    const popularCategories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: {
          select: {
            websites: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      },
      orderBy: {
        websites: {
          _count: 'desc'
        }
      },
      take: 5
    });

    res.json({
      data: {
        tags: popularTags.map(tag => ({
          name: tag.name,
          count: tag._count.websites
        })),
        categories: popularCategories.map(cat => ({
          name: cat.name,
          count: cat._count.websites
        }))
      }
    });
  } catch (error) {
    console.error('Trending search error:', error);
    res.status(500).json({
      error: 'Failed to fetch trending searches',
      code: 'TRENDING_ERROR'
    });
  }
}));

// 保存搜索条件
router.post('/saved-searches', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    query: Joi.string().max(500).allow('').required(),
    filters: Joi.object().optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  // 检查是否已存在同名搜索
  const existingSearch = await prisma.savedSearch.findFirst({
    where: {
      userId,
      name: value.name,
      isActive: true
    }
  });

  if (existingSearch) {
    return res.status(400).json({
      error: '已存在同名的保存搜索',
      code: 'DUPLICATE_NAME'
    });
  }

  // 检查用户保存搜索数量限制
  const savedSearchCount = await prisma.savedSearch.count({
    where: {
      userId,
      isActive: true
    }
  });

  if (savedSearchCount >= 10) {
    return res.status(400).json({
      error: '最多只能保存10个搜索条件',
      code: 'LIMIT_EXCEEDED'
    });
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId,
      name: value.name,
      query: value.query,
      filters: value.filters || {}
    }
  });

  res.status(201).json({
    data: savedSearch,
    message: '保存搜索成功'
  });
}));

// 获取用户的保存搜索列表
router.get('/saved-searches', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const savedSearches = await prisma.savedSearch.findMany({
    where: {
      userId,
      isActive: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  res.json({
    data: savedSearches
  });
}));

// 更新保存的搜索
router.put('/saved-searches/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const searchId = parseInt(req.params.id);

  const schema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    query: Joi.string().max(500).allow('').optional(),
    filters: Joi.object().optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  // 检查搜索是否属于当前用户
  const existingSearch = await prisma.savedSearch.findFirst({
    where: {
      id: searchId,
      userId,
      isActive: true
    }
  });

  if (!existingSearch) {
    return res.status(404).json({
      error: '保存的搜索不存在',
      code: 'NOT_FOUND'
    });
  }

  // 如果更新名称，检查是否重复
  if (value.name && value.name !== existingSearch.name) {
    const duplicateSearch = await prisma.savedSearch.findFirst({
      where: {
        userId,
        name: value.name,
        isActive: true,
        id: { not: searchId }
      }
    });

    if (duplicateSearch) {
      return res.status(400).json({
        error: '已存在同名的保存搜索',
        code: 'DUPLICATE_NAME'
      });
    }
  }

  const updatedSearch = await prisma.savedSearch.update({
    where: { id: searchId },
    data: value
  });

  res.json({
    data: updatedSearch,
    message: '更新成功'
  });
}));

// 删除保存的搜索
router.delete('/saved-searches/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const searchId = parseInt(req.params.id);

  // 检查搜索是否属于当前用户
  const existingSearch = await prisma.savedSearch.findFirst({
    where: {
      id: searchId,
      userId,
      isActive: true
    }
  });

  if (!existingSearch) {
    return res.status(404).json({
      error: '保存的搜索不存在',
      code: 'NOT_FOUND'
    });
  }

  // 软删除
  await prisma.savedSearch.update({
    where: { id: searchId },
    data: { isActive: false }
  });

  res.json({
    message: '删除成功'
  });
}));

// 记录搜索历史
router.post('/search-history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const schema = Joi.object({
    query: Joi.string().max(500).allow('').required(),
    filters: Joi.object().optional(),
    results: Joi.number().integer().min(0).optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  // 避免重复记录相同的搜索
  const recentSearch = await prisma.searchHistory.findFirst({
    where: {
      userId,
      query: value.query,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // 5分钟内
      }
    }
  });

  if (recentSearch) {
    return res.json({
      data: recentSearch,
      message: '搜索历史已存在'
    });
  }

  // 限制搜索历史数量，删除老的记录
  const historyCount = await prisma.searchHistory.count({
    where: { userId }
  });

  if (historyCount >= 50) {
    const oldestRecords = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: historyCount - 49 // 保留最新的49条记录
    });

    await prisma.searchHistory.deleteMany({
      where: {
        id: {
          in: oldestRecords.map(record => record.id)
        }
      }
    });
  }

  const searchHistory = await prisma.searchHistory.create({
    data: {
      userId,
      query: value.query,
      filters: value.filters || {},
      results: value.results || 0
    }
  });

  res.status(201).json({
    data: searchHistory
  });
}));

// 获取搜索历史
router.get('/search-history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.searchHistory.count({
      where: { userId }
    })
  ]);

  res.json({
    data: history,
    meta: {
      pagination: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit)
      }
    }
  });
}));

// 清空搜索历史
router.delete('/search-history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  await prisma.searchHistory.deleteMany({
    where: { userId }
  });

  res.json({
    message: '搜索历史已清空'
  });
}));

// 删除特定搜索历史记录
router.delete('/search-history/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const historyId = parseInt(req.params.id);

  const existingHistory = await prisma.searchHistory.findFirst({
    where: {
      id: historyId,
      userId
    }
  });

  if (!existingHistory) {
    return res.status(404).json({
      error: '搜索历史不存在',
      code: 'NOT_FOUND'
    });
  }

  await prisma.searchHistory.delete({
    where: { id: historyId }
  });

  res.json({
    message: '删除成功'
  });
}));

export default router;