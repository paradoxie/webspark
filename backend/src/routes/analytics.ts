import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取网站流量统计
router.get('/traffic/:websiteId', asyncHandler(async (req: Request, res: Response) => {
  const { websiteId } = req.params;
  const { period = '7d' } = req.query;
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case '24h':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  // 获取点击统计数据
  const clickStats = await prisma.websiteClick.groupBy({
    by: ['createdAt'],
    where: {
      websiteId: Number(websiteId),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
  });

  // 按日期分组统计
  const dailyStats = clickStats.reduce((acc, click) => {
    const date = click.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + click._count.id;
    return acc;
  }, {} as Record<string, number>);

  // 生成完整的日期范围数据
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dates.push({
      date: dateStr,
      clicks: dailyStats[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 总体统计
  const totalClicks = await prisma.websiteClick.count({
    where: {
      websiteId: Number(websiteId),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const uniqueUsers = await prisma.websiteClick.groupBy({
    by: ['userAgent', 'ipAddress'],
    where: {
      websiteId: Number(websiteId),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
  });

  res.json({
    data: {
      period,
      totalClicks,
      uniqueUsers: uniqueUsers.length,
      averageClicksPerDay: Math.round(totalClicks / dates.length),
      dailyStats: dates,
    },
  });
}));

// 获取用户行为统计
router.get('/user-behavior/:websiteId', asyncHandler(async (req: Request, res: Response) => {
  const { websiteId } = req.params;
  const { period = '30d' } = req.query;
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // 获取时间段内的用户行为数据
  const [likes, bookmarks, comments, clicks] = await Promise.all([
    prisma.websiteLike.count({
      where: {
        websiteId: Number(websiteId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.bookmark.count({
      where: {
        websiteId: Number(websiteId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.comment.count({
      where: {
        websiteId: Number(websiteId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.websiteClick.count({
      where: {
        websiteId: Number(websiteId),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  // 计算参与度指标
  const engagementScore = likes * 3 + bookmarks * 2 + comments * 5 + clicks * 1;
  
  res.json({
    data: {
      period,
      likes,
      bookmarks,
      comments,
      clicks,
      engagementScore,
      engagementBreakdown: {
        likes: { count: likes, weight: 3, score: likes * 3 },
        bookmarks: { count: bookmarks, weight: 2, score: bookmarks * 2 },
        comments: { count: comments, weight: 5, score: comments * 5 },
        clicks: { count: clicks, weight: 1, score: clicks * 1 },
      },
    },
  });
}));

// 获取平台整体统计
router.get('/platform/overview', asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const [
    totalUsers,
    newUsers,
    totalWebsites,
    newWebsites,
    totalInteractions,
    topCategories,
    topTags,
    userGrowth,
    websiteGrowth
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.website.count({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
    }),
    prisma.website.count({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    // 计算总互动数（点赞+收藏+评论+点击）
    prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM WebsiteLike WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}) +
        (SELECT COUNT(*) FROM Bookmark WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}) +
        (SELECT COUNT(*) FROM Comment WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}) +
        (SELECT COUNT(*) FROM WebsiteClick WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}) as total
    `,
    // 热门分类
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            websites: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        websites: {
          _count: 'desc',
        },
      },
      take: 10,
    }),
    // 热门标签
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            websites: {
              where: {
                status: 'APPROVED',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        websites: {
          _count: 'desc',
        },
      },
      take: 10,
    }),
    // 用户增长数据（按天）
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
    // 网站增长数据（按天）
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Website
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
        AND status = 'APPROVED'
        AND deletedAt IS NULL
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
  ]);

  const totalInteractionsCount = Array.isArray(totalInteractions) 
    ? (totalInteractions[0] as any)?.total || 0
    : 0;

  res.json({
    data: {
      period,
      summary: {
        totalUsers,
        newUsers,
        totalWebsites,
        newWebsites,
        totalInteractions: totalInteractionsCount,
        userGrowthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0.00',
        websiteGrowthRate: totalWebsites > 0 ? ((newWebsites / totalWebsites) * 100).toFixed(2) : '0.00',
      },
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        websiteCount: cat._count.websites,
      })),
      topTags: topTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        websiteCount: tag._count.websites,
      })),
      growth: {
        users: userGrowth,
        websites: websiteGrowth,
      },
    },
  });
}));

// 获取用户活跃度统计
router.get('/user-activity', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { period = '30d' } = req.query;
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // 获取活跃用户数据
  const [
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    userActivities
  ] = await Promise.all([
    // 日活跃用户
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    // 周活跃用户
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    // 月活跃用户
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    // 用户活动分布
    prisma.$queryRaw`
      SELECT 
        u.id,
        u.username,
        COUNT(DISTINCT w.id) as websitesSubmitted,
        COUNT(DISTINCT l.id) as likesGiven,
        COUNT(DISTINCT b.id) as bookmarksCreated,
        COUNT(DISTINCT c.id) as commentsPosted
      FROM User u
      LEFT JOIN Website w ON u.id = w.authorId 
        AND w.createdAt >= ${startDate} 
        AND w.createdAt <= ${endDate}
        AND w.deletedAt IS NULL
      LEFT JOIN WebsiteLike l ON u.id = l.userId 
        AND l.createdAt >= ${startDate} 
        AND l.createdAt <= ${endDate}
      LEFT JOIN Bookmark b ON u.id = b.userId 
        AND b.createdAt >= ${startDate} 
        AND b.createdAt <= ${endDate}
      LEFT JOIN Comment c ON u.id = c.authorId 
        AND c.createdAt >= ${startDate} 
        AND c.createdAt <= ${endDate}
      GROUP BY u.id, u.username
      HAVING COUNT(DISTINCT w.id) > 0 
        OR COUNT(DISTINCT l.id) > 0 
        OR COUNT(DISTINCT b.id) > 0 
        OR COUNT(DISTINCT c.id) > 0
      ORDER BY (COUNT(DISTINCT w.id) + COUNT(DISTINCT l.id) + COUNT(DISTINCT b.id) + COUNT(DISTINCT c.id)) DESC
      LIMIT 20
    `,
  ]);

  res.json({
    data: {
      period,
      activeUsers: {
        daily: dailyActiveUsers,
        weekly: weeklyActiveUsers,
        monthly: monthlyActiveUsers,
      },
      topActiveUsers: userActivities,
    },
  });
}));

// 获取网站排行榜
router.get('/website-rankings', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = '30d', sortBy = 'engagement' } = req.query;
  
  // 验证输入参数
  const validPeriods = ['7d', '30d', '90d'];
  const validSortBy = ['likes', 'bookmarks', 'comments', 'clicks', 'engagement'];
  
  if (!validPeriods.includes(period as string)) {
    return res.status(400).json({ error: 'Invalid period parameter' });
  }
  
  if (!validSortBy.includes(sortBy as string)) {
    return res.status(400).json({ error: 'Invalid sortBy parameter' });
  }
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // 使用安全的参数化查询
  let rankings;

  switch (sortBy) {
    case 'likes':
      rankings = await prisma.$queryRaw`
        SELECT 
          w.id,
          w.title,
          w.slug,
          w.url,
          w.shortDescription,
          w.featured,
          u.username as authorName,
          COUNT(DISTINCT l.id) as score,
          'likes' as metric
        FROM Website w
        LEFT JOIN WebsiteLike l ON w.id = l.websiteId 
          AND l.createdAt >= ${startDate} AND l.createdAt <= ${endDate}
        LEFT JOIN User u ON w.authorId = u.id
        WHERE w.status = 'APPROVED' AND w.deletedAt IS NULL
        GROUP BY w.id, w.title, w.slug, w.url, w.shortDescription, w.featured, u.username
        ORDER BY score DESC
        LIMIT 20
      `;
      break;
    case 'bookmarks':
      rankings = await prisma.$queryRaw`
        SELECT 
          w.id,
          w.title,
          w.slug,
          w.url,
          w.shortDescription,
          w.featured,
          u.username as authorName,
          COUNT(DISTINCT b.id) as score,
          'bookmarks' as metric
        FROM Website w
        LEFT JOIN Bookmark b ON w.id = b.websiteId 
          AND b.createdAt >= ${startDate} AND b.createdAt <= ${endDate}
        LEFT JOIN User u ON w.authorId = u.id
        WHERE w.status = 'APPROVED' AND w.deletedAt IS NULL
        GROUP BY w.id, w.title, w.slug, w.url, w.shortDescription, w.featured, u.username
        ORDER BY score DESC
        LIMIT 20
      `;
      break;
    case 'comments':
      rankings = await prisma.$queryRaw`
        SELECT 
          w.id,
          w.title,
          w.slug,
          w.url,
          w.shortDescription,
          w.featured,
          u.username as authorName,
          COUNT(DISTINCT c.id) as score,
          'comments' as metric
        FROM Website w
        LEFT JOIN Comment c ON w.id = c.websiteId 
          AND c.createdAt >= ${startDate} AND c.createdAt <= ${endDate}
        LEFT JOIN User u ON w.authorId = u.id
        WHERE w.status = 'APPROVED' AND w.deletedAt IS NULL
        GROUP BY w.id, w.title, w.slug, w.url, w.shortDescription, w.featured, u.username
        ORDER BY score DESC
        LIMIT 20
      `;
      break;
    case 'clicks':
      rankings = await prisma.$queryRaw`
        SELECT 
          w.id,
          w.title,
          w.slug,
          w.url,
          w.shortDescription,
          w.featured,
          u.username as authorName,
          COUNT(DISTINCT wc.id) as score,
          'clicks' as metric
        FROM Website w
        LEFT JOIN WebsiteClick wc ON w.id = wc.websiteId 
          AND wc.createdAt >= ${startDate} AND wc.createdAt <= ${endDate}
        LEFT JOIN User u ON w.authorId = u.id
        WHERE w.status = 'APPROVED' AND w.deletedAt IS NULL
        GROUP BY w.id, w.title, w.slug, w.url, w.shortDescription, w.featured, u.username
        ORDER BY score DESC
        LIMIT 20
      `;
      break;
    default: // engagement
      rankings = await prisma.$queryRaw`
        SELECT 
          w.id,
          w.title,
          w.slug,
          w.url,
          w.shortDescription,
          w.featured,
          u.username as authorName,
          (COUNT(DISTINCT l.id) * 3 + COUNT(DISTINCT b.id) * 2 + COUNT(DISTINCT c.id) * 5 + COUNT(DISTINCT wc.id) * 1) as score,
          'engagement' as metric
        FROM Website w
        LEFT JOIN WebsiteLike l ON w.id = l.websiteId 
          AND l.createdAt >= ${startDate} AND l.createdAt <= ${endDate}
        LEFT JOIN Bookmark b ON w.id = b.websiteId 
          AND b.createdAt >= ${startDate} AND b.createdAt <= ${endDate}
        LEFT JOIN Comment c ON w.id = c.websiteId 
          AND c.createdAt >= ${startDate} AND c.createdAt <= ${endDate}
        LEFT JOIN WebsiteClick wc ON w.id = wc.websiteId 
          AND wc.createdAt >= ${startDate} AND wc.createdAt <= ${endDate}
        LEFT JOIN User u ON w.authorId = u.id
        WHERE w.status = 'APPROVED' AND w.deletedAt IS NULL
        GROUP BY w.id, w.title, w.slug, w.url, w.shortDescription, w.featured, u.username
        ORDER BY score DESC
        LIMIT 20
      `;
  }

  res.json({
    data: {
      period,
      sortBy,
      rankings,
    },
  });
}));

export default router;