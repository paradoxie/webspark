import { Router, Request, Response } from 'express';
import slugify from 'slugify';
import Joi from 'joi';
import { prisma } from '../db';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationService } from '../services/notificationService';
import { writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// 辅助函数：批量获取用户对网站的交互状态
async function getUserWebsiteInteractions(userId: number, websiteIds: number[]) {
  if (websiteIds.length === 0) {
    return {
      likedIds: new Set<number>(),
      bookmarkedIds: new Set<number>()
    };
  }

  const [likes, bookmarks] = await Promise.all([
    prisma.websiteLike.findMany({
      where: {
        userId,
        websiteId: { in: websiteIds }
      },
      select: { websiteId: true }
    }),
    prisma.bookmark.findMany({
      where: {
        userId,
        websiteId: { in: websiteIds }
      },
      select: { websiteId: true }
    })
  ]);

  return {
    likedIds: new Set(likes.map(l => l.websiteId)),
    bookmarkedIds: new Set(bookmarks.map(b => b.websiteId))
  };
}

// 验证schemas
const createWebsiteSchema = Joi.object({
  title: Joi.string().min(5).max(50).required(),
  url: Joi.string().uri().required(),
  shortDescription: Joi.string().min(20).max(160).required(),
  description: Joi.string().min(100).required(),
  sourceUrl: Joi.string().uri().optional().allow(''),
  screenshots: Joi.array().items(Joi.string().uri()).max(5).optional(),
  tagIds: Joi.array().items(Joi.number()).min(1).max(5).required(),
  isHiring: Joi.boolean().optional()
});

// 获取网站列表（支持过滤和排序）
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 12, sort = 'newest', tag, search } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 构建查询条件
  const where: any = {
    status: 'APPROVED',
    deletedAt: null
  };

  // 标签过滤
  if (tag) {
    where.tags = {
      some: {
        slug: tag as string
      }
    };
  }

  // 搜索过滤
  if (search) {
    const searchTerm = search as string;
    where.OR = [
      { title: { contains: searchTerm } },
      { shortDescription: { contains: searchTerm } },
      { description: { contains: searchTerm } },
      { tags: { some: { name: { contains: searchTerm } } } },
      { author: { name: { contains: searchTerm } } }
    ];
  }

  // 排序方式
  let orderBy: any;
  switch (sort) {
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
    default:
      orderBy = { createdAt: 'desc' };
  }

  // 获取当前用户（如果已登录）
  const userId = (req as AuthenticatedRequest).user?.id;

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
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
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
        _count: {
          select: {
            likedBy: true,
            bookmarkedBy: true
          }
        }
      },
      orderBy,
      skip,
      take
    }),
    prisma.website.count({ where })
  ]);

  // 添加用户交互信息
  let websitesWithUserData = websites;

  if (userId) {
    // 一次性查询用户的所有点赞和收藏，避免N+1查询问题
    const websiteIds = websites.map(w => w.id);
    const { likedIds, bookmarkedIds } = await getUserWebsiteInteractions(userId, websiteIds);

    websitesWithUserData = websites.map(website => {
      // 计算分数 (热度)
      const score = (website.likeCount * 5) + (new Date(website.createdAt).getTime() / 10000);

      return {
        ...website,
        score,
        isLiked: likedIds.has(website.id),
        isBookmarked: bookmarkedIds.has(website.id)
      };
    });
  } else {
    // 未登录用户，直接添加score但不添加用户交互信息
    websitesWithUserData = websites.map(website => {
      const score = (website.likeCount * 5) + (new Date(website.createdAt).getTime() / 10000);
      return {
        ...website,
        score,
        isLiked: false,
        isBookmarked: false
      };
    });
  }

  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount: Math.ceil(total / Number(pageSize)),
        total
      }
    }
  });
}));

// 获取热门排序的网站列表
router.get('/sorted-list', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const skip = (page - 1) * pageSize;

  // 获取总数
  const total = await prisma.website.count({
    where: {
      status: 'APPROVED',
      deletedAt: null
    }
  });

  // 使用原生SQL计算热度分数
  const websites = await prisma.$queryRaw`
    SELECT
      w.id,
      w.title,
      w.slug,
      w.url,
      w.shortDescription,
      w.likeCount,
      w.viewCount,
      w.createdAt,
      (w.likeCount * 5 + UNIX_TIMESTAMP(w.createdAt) / 10000) as score
    FROM websites w
    WHERE w.status = 'APPROVED'
      AND w.deletedAt IS NULL
    ORDER BY score DESC
    LIMIT ${pageSize} OFFSET ${skip}
  ` as any[];

  // 获取完整的网站信息
  const websiteIds = websites.map(w => w.id);
  const fullWebsites = await prisma.website.findMany({
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

  // 合并数据并保持排序
  let result = websiteIds.map(id => {
    const website = fullWebsites.find(w => w.id === id);
    const scoreData = websites.find(w => w.id === id);
    return {
      ...website,
      score: scoreData?.score,
      isLiked: false,
      isBookmarked: false
    };
  });

  // 如果用户已登录，添加交互状态
  if (req.user) {
    const { likedIds, bookmarkedIds } = await getUserWebsiteInteractions(req.user.id, websiteIds);
    result = result.map(website => ({
      ...website,
      isLiked: likedIds.has(website.id),
      isBookmarked: bookmarkedIds.has(website.id)
    }));
  }

  const pageCount = Math.ceil(total / pageSize);

  res.json({
    data: result,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount,
        total
      }
    }
  });
}));

// 获取网站统计数据 - 必须在动态路由之前定义
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [
    totalWebsites,
    totalUsers,
    totalTags,
    totalCountries
  ] = await Promise.all([
    prisma.website.count({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
    }),
    prisma.user.count(),
    prisma.tag.count(),
    // 暂时使用固定值，后续可以从用户位置数据计算
    Promise.resolve(80),
  ]);

  res.json({
    data: {
      websites: totalWebsites,
      users: totalUsers,
      tags: totalTags,
      countries: totalCountries,
    },
  });
}));

// 获取单个网站详情
router.get('/:identifier', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { identifier } = req.params;

  // 判断identifier是ID还是slug
  const isId = /^\d+$/.test(identifier);

  const website = await prisma.website.findFirst({
    where: {
      AND: [
        isId ? { id: parseInt(identifier) } : { slug: identifier },
        { deletedAt: null },
        { status: 'APPROVED' }
      ]
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          website: true
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

  if (!website) {
    return res.status(404).json({
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  // 增加浏览次数
  await prisma.website.update({
    where: { id: website.id },
    data: { viewCount: { increment: 1 } }
  });

  // 添加用户交互状态
  let isLiked = false;
  let isBookmarked = false;
  if (req.user) {
    const { likedIds, bookmarkedIds } = await getUserWebsiteInteractions(req.user.id, [website.id]);
    isLiked = likedIds.has(website.id);
    isBookmarked = bookmarkedIds.has(website.id);
  }

  const result = {
    ...website,
    isLiked,
    isBookmarked
  };

  res.json({ data: result });
}));

// 提交新网站（添加速率限制）
router.post('/', writeLimiter, authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const submitSchema = Joi.object({
    url: Joi.string().uri().required(),
    title: Joi.string().min(5).max(50).required(),
    shortDescription: Joi.string().min(20).max(160).required(),
    description: Joi.string().min(100).required(),
    tags: Joi.array().items(Joi.string()).min(1).max(5).required(),
    sourceUrl: Joi.string().uri().optional().allow(''),
    screenshots: Joi.array().items(Joi.string().uri()).max(5).optional(),
    categoryId: Joi.number().required().min(1),
    isHiring: Joi.boolean().optional()
  });

  const { error, value } = submitSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { url, title, shortDescription, description, tags, sourceUrl, screenshots, categoryId, isHiring } = value;

  // 验证分类是否存在
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    return res.status(400).json({
      error: 'Invalid category',
      code: 'INVALID_CATEGORY'
    });
  }

  // 检查URL是否已存在
  const existingWebsite = await prisma.website.findFirst({
    where: {
      url,
      deletedAt: null
    }
  });

  if (existingWebsite) {
    return res.status(409).json({
      error: 'This URL has already been submitted',
      code: 'URL_ALREADY_EXISTS'
    });
  }

  // 生成唯一slug
  const baseSlug = generateSlug(title);
  const slug = `${baseSlug}-${Date.now()}`;

  // 处理标签 - 获取或创建标签ID
  const tagIds: number[] = [];
  for (const tagName of tags) {
    let tag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName,
          slug: generateSlug(tagName) + '-' + Date.now()
        }
      });
    }
    tagIds.push(tag.id);
  }

  // 创建网站记录
  const website = await prisma.website.create({
    data: {
      title,
      slug,
      url,
      shortDescription,
      description,
      sourceUrl: sourceUrl || null,
      screenshots: screenshots || [],
      authorId: req.user!.id,
      categoryId,
      status: 'PENDING',
      isHiring: isHiring || false,
      tags: {
        connect: tagIds.map(id => ({ id }))
      }
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true, username: true }
      },
      category: {
        select: { id: true, name: true, slug: true, icon: true, color: true }
      },
      tags: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  res.status(201).json({
    data: website,
    message: 'Website submitted successfully. It will be reviewed before going live.'
  });
}));

// 辅助函数：生成slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为短横线
    .replace(/^-+|-+$/g, '') // 移除首尾的短横线
    + '-' + Date.now(); // 添加时间戳确保唯一性
}

// 点赞/取消点赞
router.put('/:id/like', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const websiteId = parseInt(req.params.id);
  const userId = req.user!.id;

  if (isNaN(websiteId)) {
    return res.status(400).json({
      error: 'Invalid website ID',
      code: 'INVALID_WEBSITE_ID'
    });
  }

  const website = await prisma.website.findUnique({
    where: {
      id: websiteId,
      deletedAt: null,
      status: 'APPROVED'
    },
    select: {
      id: true,
      authorId: true,
      likeCount: true
    }
  });

  if (!website) {
    return res.status(404).json({
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  const existingLike = await prisma.websiteLike.findUnique({
    where: {
      websiteId_userId: {
        websiteId,
        userId
      }
    }
  });

  if (existingLike) {
    await prisma.$transaction([
      prisma.websiteLike.delete({
        where: {
          websiteId_userId: {
            websiteId,
            userId
          }
        }
      }),
      prisma.website.update({
        where: { id: websiteId },
        data: { likeCount: { decrement: 1 } }
      })
    ]);

    res.json({
      message: 'Like removed successfully',
      action: 'unlike',
      likeCount: Math.max(0, website.likeCount - 1),
      isLiked: false
    });
  } else {
    await prisma.$transaction([
      prisma.websiteLike.create({
        data: {
          websiteId,
          userId
        }
      }),
      prisma.website.update({
        where: { id: websiteId },
        data: { likeCount: { increment: 1 } }
      })
    ]);

    try {
      if (website.authorId !== userId) {
        const user = req.user!;
        const likerName = user.name || user.username;
        await NotificationService.notifyWebsiteLiked(websiteId, likerName);
      }
    } catch (notificationError) {
      console.error('Failed to send like notification:', notificationError);
    }

    res.json({
      message: 'Like added successfully',
      action: 'like',
      likeCount: website.likeCount + 1,
      isLiked: true
    });
  }
}));

// 收藏/取消收藏
router.put('/:id/bookmark', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const websiteId = parseInt(req.params.id);
  const userId = req.user!.id;

  if (isNaN(websiteId)) {
    return res.status(400).json({
      error: 'Invalid website ID',
      code: 'INVALID_WEBSITE_ID'
    });
  }

  const website = await prisma.website.findUnique({
    where: {
      id: websiteId,
      deletedAt: null,
      status: 'APPROVED'
    },
    select: {
      id: true
    }
  });

  if (!website) {
    return res.status(404).json({
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  const existingBookmark = await prisma.bookmark.findUnique({
    where: {
      websiteId_userId: {
        websiteId,
        userId
      }
    }
  });

  if (existingBookmark) {
    await prisma.bookmark.delete({
      where: {
        websiteId_userId: {
          websiteId,
          userId
        }
      }
    });

    res.json({
      message: 'Bookmark removed successfully',
      action: 'unbookmark',
      isBookmarked: false
    });
  } else {
    await prisma.bookmark.create({
      data: {
        websiteId,
        userId
      }
    });

    res.json({
      message: 'Bookmark added successfully',
      action: 'bookmark',
      isBookmarked: true
    });
  }
}));

// 高级搜索端点
router.get('/search', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    q,
    tags,
    author,
    dateRange = 'all',
    sortBy = 'relevance',
    featured,
    page = 1,
    pageSize = 12
  } = req.query;

  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 构建查询条件
  const where: any = {
    status: 'APPROVED',
    deletedAt: null
  };

  // 标签过滤条件
  const tagConditions = [];
  if (tags) {
    const tagArray = (tags as string).split(',').filter(Boolean);
    if (tagArray.length > 0) {
      tagConditions.push({
        tags: {
          some: {
            slug: { in: tagArray }
          }
        }
      });
    }
  }

  // 关键词搜索
  if (q) {
    const searchTerm = q as string;
    const searchConditions = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } },
      { author: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { author: { username: { contains: searchTerm, mode: 'insensitive' } } }
    ];

    // 如果有标签过滤，将其合并到搜索条件中
    if (tagConditions.length > 0) {
      where.AND = [
        { OR: searchConditions },
        ...tagConditions
      ];
    } else {
      where.OR = searchConditions;
    }
  } else if (tagConditions.length > 0) {
    // 只有标签过滤，没有关键词搜索
    where.AND = tagConditions;
  }

  // 作者过滤
  if (author) {
    const authorTerm = author as string;
    where.author = {
      OR: [
        { username: { contains: authorTerm, mode: 'insensitive' } },
        { name: { contains: authorTerm, mode: 'insensitive' } }
      ]
    };
  }

  // 精选过滤
  if (featured === 'true') {
    where.featured = true;
  }

  // 时间范围过滤
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    where.createdAt = {
      gte: startDate
    };
  }

  // 排序条件
  let orderBy: any = {};
  switch (sortBy) {
    case 'latest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'popular':
      orderBy = { likeCount: 'desc' };
      break;
    case 'views':
      orderBy = { viewCount: 'desc' };
      break;
    default: // relevance
      orderBy = { createdAt: 'desc' }; // 暂时按时间排序
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
      take
    }),
    prisma.website.count({ where })
  ]);

  // 添加用户交互状态
  let websitesWithUserData = websites.map(website => ({
    ...website,
    isLiked: false,
    isBookmarked: false
  }));

  if (req.user) {
    const websiteIds = websites.map(w => w.id);
    const { likedIds, bookmarkedIds } = await getUserWebsiteInteractions(req.user.id, websiteIds);
    websitesWithUserData = websites.map(website => ({
      ...website,
      isLiked: likedIds.has(website.id),
      isBookmarked: bookmarkedIds.has(website.id)
    }));
  }

  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount: Math.ceil(total / Number(pageSize)),
        total
      }
    }
  });
}));

// 获取精选网站
router.get('/featured', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // 获取当前用户（如果已登录）
  const userId = (req as AuthenticatedRequest).user?.id;

  // 获取精选网站
  const websites = await prisma.website.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      featured: true
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true
        }
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true
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
      _count: {
        select: {
          likedBy: true,
          bookmarkedBy: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  // 添加用户交互信息
  let websitesWithUserData;

  if (userId) {
    // 批量查询用户交互以避免N+1问题
    const websiteIds = websites.map(w => w.id);
    const { likedIds, bookmarkedIds } = await getUserWebsiteInteractions(userId, websiteIds);

    websitesWithUserData = websites.map((website) => {
      // 计算分数 (热度)
      const score = (website.likeCount * 5) + (new Date(website.createdAt).getTime() / 10000);

      return {
        ...website,
        score,
        isLiked: likedIds.has(website.id),
        isBookmarked: bookmarkedIds.has(website.id)
      };
    });
  } else {
    websitesWithUserData = websites.map((website) => {
      // 计算分数 (热度)
      const score = (website.likeCount * 5) + (new Date(website.createdAt).getTime() / 10000);

      return {
        ...website,
        score,
        isLiked: false,
        isBookmarked: false
      };
    });
  }

  res.json({
    data: websitesWithUserData
  });
}));

export default router;
