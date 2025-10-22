import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { ActivityType } from '@prisma/client';

const router = Router();

// 记录用户活动
export async function recordActivity(
  userId: number,
  type: ActivityType,
  metadata: Record<string, any> = {}
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
}

// 获取当前用户的活动历史
router.get('/my-activity', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const skip = (page - 1) * pageSize;
  const type = req.query.type as string;

  const where: any = { userId };
  if (type && Object.values(ActivityType).includes(type as ActivityType)) {
    where.type = type;
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    prisma.activity.count({ where })
  ]);

  // 丰富活动数据
  const enrichedActivities = await Promise.all(
    activities.map(async (activity) => {
      const metadata = activity.metadata as any;
      let enrichedData: any = {
        ...activity,
        relatedData: {}
      };

      // 根据活动类型加载相关数据
      switch (activity.type) {
        case ActivityType.WEBSITE_CREATED:
        case ActivityType.WEBSITE_LIKED:
        case ActivityType.WEBSITE_BOOKMARKED:
        case ActivityType.WEBSITE_VIEWED:
          if (metadata.websiteId) {
            const website = await prisma.website.findUnique({
              where: { id: metadata.websiteId },
              select: {
                id: true,
                title: true,
                slug: true,
                shortDescription: true,
                author: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            });
            enrichedData.relatedData.website = website;
          }
          break;

        case ActivityType.COMMENT_POSTED:
          if (metadata.commentId) {
            const comment = await prisma.comment.findUnique({
              where: { id: metadata.commentId },
              select: {
                id: true,
                content: true,
                website: {
                  select: {
                    id: true,
                    title: true,
                    slug: true
                  }
                }
              }
            });
            enrichedData.relatedData.comment = comment;
          }
          break;

        case ActivityType.USER_FOLLOWED:
          if (metadata.targetUserId) {
            const targetUser = await prisma.user.findUnique({
              where: { id: metadata.targetUserId },
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            });
            enrichedData.relatedData.targetUser = targetUser;
          }
          break;
      }

      return enrichedData;
    })
  );

  res.json({
    data: enrichedActivities,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
      }
    }
  });
}));

// 获取活动统计
router.get('/my-stats', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const period = req.query.period as string || '30d';

  let startDate: Date;
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
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // 获取活动统计
  const activityStats = await prisma.activity.groupBy({
    by: ['type'],
    where: {
      userId,
      createdAt: {
        gte: startDate
      }
    },
    _count: {
      type: true
    }
  });

  // 获取其他统计数据
  const [websiteStats, interactionStats] = await Promise.all([
    // 作品统计
    prisma.website.aggregate({
      where: {
        authorId: userId,
        createdAt: {
          gte: startDate
        }
      },
      _count: true,
      _sum: {
        viewCount: true,
        likeCount: true
      }
    }),
    // 互动统计
    Promise.all([
      prisma.websiteLike.count({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.bookmark.count({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.comment.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: startDate
          }
        }
      })
    ])
  ]);

  // 计算每日活跃度
  const dailyActivity = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as activityCount
    FROM Activity
    WHERE userId = ${userId}
      AND createdAt >= ${startDate}
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
    LIMIT 30
  `;

  // 格式化统计数据
  const formattedStats = {
    period,
    activities: activityStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.type;
      return acc;
    }, {} as Record<string, number>),
    websites: {
      created: websiteStats._count,
      totalViews: websiteStats._sum.viewCount || 0,
      totalLikes: websiteStats._sum.likeCount || 0
    },
    interactions: {
      likesGiven: interactionStats[0],
      bookmarksCreated: interactionStats[1],
      commentsPosted: interactionStats[2]
    },
    dailyActivity: dailyActivity.map(day => ({
      date: day.date,
      count: Number(day.activityCount)
    }))
  };

  res.json({
    data: formattedStats
  });
}));

// 获取特定用户的公开活动
router.get('/user/:userId', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetUserId = parseInt(req.params.userId);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const skip = (page - 1) * pageSize;

  // 只显示公开活动
  const publicActivityTypes = [
    ActivityType.WEBSITE_CREATED,
    ActivityType.COMMENT_POSTED,
    ActivityType.USER_FOLLOWED
  ];

  const where = {
    userId: targetUserId,
    type: {
      in: publicActivityTypes
    }
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        type: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    prisma.activity.count({ where })
  ]);

  res.json({
    data: activities,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
      }
    }
  });
}));

// 清除活动历史（隐私功能）
router.delete('/clear', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { type, before } = req.body;

  const where: any = { userId };

  if (type && Object.values(ActivityType).includes(type)) {
    where.type = type;
  }

  if (before) {
    where.createdAt = {
      lt: new Date(before)
    };
  }

  const result = await prisma.activity.deleteMany({ where });

  res.json({
    message: `清除了 ${result.count} 条活动记录`
  });
}));

export default router;
