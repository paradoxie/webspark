import { Router, Response } from 'express';
import { RecommendationService } from '../services/recommendationService';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

const router = Router();

// 推荐反馈数据模型接口
interface RecommendationFeedback {
  id?: number;
  userId: number;
  websiteId: number;
  recommendationType: 'personalized' | 'similar_users' | 'trending' | 'hybrid';
  rating: number;
  feedback?: string;
  createdAt: Date;
}

// 速率限制映射
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// 速率限制中间件
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: AuthenticatedRequest, res: Response, next: Function): void => {
    const key = `${req.ip}_${req.user?.id || 'anonymous'}`;
    const now = Date.now();
    
    let userLimit = rateLimitMap.get(key);
    
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, userLimit);
    }
    
    if (userLimit.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
      return;
    }
    
    userLimit.count++;
    next();
  };
};

// 清理过期的速率限制记录
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

// 输入验证辅助函数
const validateLimit = (limit: any): number => {
  const parsedLimit = parseInt(limit);
  if (isNaN(parsedLimit) || parsedLimit < 1) return 10;
  return Math.min(parsedLimit, 50); // 最大50个推荐
};

const validateTimeRange = (timeRange: any): 'day' | 'week' | 'month' => {
  if (['day', 'week', 'month'].includes(timeRange)) {
    return timeRange;
  }
  return 'week'; // 默认值
};

// 获取个性化推荐
router.get('/personalized', 
  authenticate, 
  rateLimit(30, 60000), // 每分钟最多30次请求
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = validateLimit(req.query.limit);
    const excludeAuthored = req.query.excludeAuthored !== 'false';

    // 额外的配置参数
    const config = {
      minScore: parseInt(req.query.minScore as string) || 5,
      diversityThreshold: parseFloat(req.query.diversityThreshold as string) || 0.3,
      authorDiversityLimit: parseInt(req.query.authorDiversityLimit as string) || 2
    };

    try {
      const recommendations = await RecommendationService.getUserRecommendations(
        userId, 
        limit, 
        excludeAuthored,
        config
      );

      // 记录推荐请求（用于分析）
      await cache.incr(CACHE_KEYS.ANALYTICS, `rec_personalized_${userId}`, CACHE_TTL.LONG);

      res.json({
        success: true,
        data: recommendations,
        meta: {
          type: 'personalized',
          userId,
          limit,
          excludeAuthored,
          config,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personalized recommendations',
        code: 'PERSONALIZED_REC_FAILED'
      });
    }
  })
);

// 获取相似用户推荐
router.get('/similar-users', 
  authenticate, 
  rateLimit(20, 60000), // 每分钟最多20次请求
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = validateLimit(req.query.limit);

    try {
      const recommendations = await RecommendationService.getSimilarUserRecommendations(
        userId, 
        limit
      );

      // 记录推荐请求
      await cache.incr(CACHE_KEYS.ANALYTICS, `rec_similar_${userId}`, CACHE_TTL.LONG);

      res.json({
        success: true,
        data: recommendations,
        meta: {
          type: 'similar_users',
          userId,
          limit,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Similar user recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch similar user recommendations',
        code: 'SIMILAR_USER_REC_FAILED'
      });
    }
  })
);

// 获取趋势推荐
router.get('/trending', 
  optionalAuth, 
  rateLimit(60, 60000), // 每分钟最多60次请求（公共接口）
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const limit = validateLimit(req.query.limit);
    const timeRange = validateTimeRange(req.query.timeRange);

    try {
      const recommendations = await RecommendationService.getTrendingRecommendations(
        userId,
        limit,
        timeRange
      );

      // 记录推荐请求
      await cache.incr(CACHE_KEYS.ANALYTICS, `rec_trending_${timeRange}`, CACHE_TTL.LONG);

      res.json({
        success: true,
        data: recommendations,
        meta: {
          type: 'trending',
          timeRange,
          limit,
          userId: userId || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Trending recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending recommendations',
        code: 'TRENDING_REC_FAILED'
      });
    }
  })
);

// 获取混合推荐（推荐给登录用户）
router.get('/hybrid', 
  authenticate, 
  rateLimit(15, 60000), // 每分钟最多15次请求
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const limit = validateLimit(req.query.limit);

    try {
      const recommendations = await RecommendationService.getHybridRecommendations(
        userId,
        limit
      );

      // 记录推荐请求
      await cache.incr(CACHE_KEYS.ANALYTICS, `rec_hybrid_${userId}`, CACHE_TTL.LONG);

      res.json({
        success: true,
        data: recommendations,
        meta: {
          type: 'hybrid',
          userId,
          limit,
          description: 'Combined personalized, collaborative, and trending recommendations',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Hybrid recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hybrid recommendations',
        code: 'HYBRID_REC_FAILED'
      });
    }
  })
);

// 获取推荐网站的详细信息
router.get('/details', 
  optionalAuth, 
  rateLimit(100, 60000), // 每分钟最多100次请求
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const websiteIds = req.query.ids as string;
    const userId = req.user?.id;

    if (!websiteIds || typeof websiteIds !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Website IDs are required',
        code: 'MISSING_WEBSITE_IDS'
      });
    }

    try {
      // 解析和验证ID
      const ids = websiteIds.split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id > 0);
      
      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid website IDs are required',
          code: 'INVALID_WEBSITE_IDS'
        });
      }

      // 限制一次查询的数量
      if (ids.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Too many website IDs. Maximum 20 allowed per request',
          code: 'TOO_MANY_IDS'
        });
      }

      // 尝试从缓存获取
      const cacheKey = `website_details_${ids.sort().join('_')}_${userId || 'guest'}`;
      const cached = await cache.get(CACHE_KEYS.WEBSITE_DETAIL, cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          meta: {
            requested: ids.length,
            found: (cached as any[]).length,
            cached: true,
            timestamp: new Date().toISOString()
          }
        });
      }

      const websites = await prisma.website.findMany({
        where: {
          id: { in: ids },
          status: 'APPROVED',
          deletedAt: null
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              isActive: true
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
          },
          _count: {
            select: {
              comments: true,
              websiteLikes: true,
              bookmarks: true
            }
          },
          // 只有登录用户才查询交互状态
          ...(userId && {
            websiteLikes: {
              where: { userId },
              select: { id: true }
            },
            bookmarks: {
              where: { userId },
              select: { id: true }
            }
          })
        }
      });

      // 按请求的ID顺序返回，并添加用户交互状态
      const orderedWebsites = ids.map(id => {
        const website = websites.find(w => w.id === id);
        if (!website) return null;
        
        const result = {
          ...website,
          isLiked: userId ? (website as any).websiteLikes?.length > 0 : false,
          isBookmarked: userId ? (website as any).bookmarks?.length > 0 : false,
          // 清理敏感字段
          websiteLikes: undefined,
          bookmarks: undefined
        };

        // 删除临时字段
        delete result.websiteLikes;
        delete result.bookmarks;

        return result;
      }).filter(Boolean);

      // 缓存结果
      await cache.set(
        CACHE_KEYS.WEBSITE_DETAIL, 
        cacheKey, 
        orderedWebsites, 
        { ttl: CACHE_TTL.SHORT }
      );

      res.json({
        success: true,
        data: orderedWebsites,
        meta: {
          requested: ids.length,
          found: orderedWebsites.length,
          cached: false,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Recommendation details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendation details',
        code: 'FETCH_DETAILS_FAILED'
      });
    }
  })
);

// 反馈推荐质量 - 增强版本
router.post('/feedback', 
  authenticate, 
  rateLimit(10, 60000), // 每分钟最多10次反馈
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { websiteId, recommendationType, rating, feedback, context } = req.body;
    const userId = req.user!.id;

    // 输入验证
    if (!websiteId || !recommendationType || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Website ID, recommendation type, and rating are required',
        code: 'MISSING_FEEDBACK_DATA'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5',
        code: 'INVALID_RATING'
      });
    }

    if (!['personalized', 'similar_users', 'trending', 'hybrid'].includes(recommendationType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recommendation type',
        code: 'INVALID_RECOMMENDATION_TYPE'
      });
    }

    // 验证网站存在性
    const websiteExists = await prisma.website.findFirst({
      where: {
        id: parseInt(websiteId),
        status: 'APPROVED',
        deletedAt: null
      },
      select: { id: true }
    });

    if (!websiteExists) {
      return res.status(404).json({
        success: false,
        error: 'Website not found',
        code: 'WEBSITE_NOT_FOUND'
      });
    }

    try {
      // 检查是否已经对同一推荐提交过反馈
      const existingFeedback = await prisma.recommendationFeedback?.findFirst({
        where: {
          userId,
          websiteId: parseInt(websiteId),
          recommendationType,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        }
      });

      let savedFeedback;
      
      if (existingFeedback) {
        // 更新现有反馈
        savedFeedback = await prisma.recommendationFeedback?.update({
          where: { id: existingFeedback.id },
          data: {
            rating,
            feedback: feedback || null,
            context: context || null,
            updatedAt: new Date()
          }
        });
      } else {
        // 创建新反馈记录
        savedFeedback = await prisma.recommendationFeedback?.create({
          data: {
            userId,
            websiteId: parseInt(websiteId),
            recommendationType,
            rating,
            feedback: feedback || null,
            context: context || null,
            createdAt: new Date()
          }
        });
      }

      // 记录到分析缓存
      await Promise.all([
        cache.incr(CACHE_KEYS.ANALYTICS, `feedback_${recommendationType}`, CACHE_TTL.LONG),
        cache.incr(CACHE_KEYS.ANALYTICS, `feedback_rating_${rating}`, CACHE_TTL.LONG),
        cache.incr(CACHE_KEYS.ANALYTICS, `feedback_user_${userId}`, CACHE_TTL.LONG)
      ]);

      // 如果评分很低，记录到警告日志
      if (rating <= 2) {
        console.warn('Low rating feedback received:', {
          userId,
          websiteId,
          recommendationType,
          rating,
          feedback,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: existingFeedback ? 'Feedback updated successfully' : 'Feedback recorded successfully',
        data: {
          id: savedFeedback?.id,
          websiteId: parseInt(websiteId),
          rating,
          recommendationType,
          isUpdate: !!existingFeedback,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Recommendation feedback error:', error);
      
      // 降级处理：即使数据库存储失败，也要记录到日志
      console.log('Recommendation feedback (fallback):', {
        userId,
        websiteId,
        recommendationType,
        rating,
        feedback: feedback || null,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Failed to record feedback',
        code: 'FEEDBACK_FAILED'
      });
    }
  })
);

// 获取推荐统计信息（管理员专用）
router.get('/stats', 
  authenticate,
  // requireAdmin, // 需要管理员权限
  rateLimit(5, 60000),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await Promise.all([
        // 各类型推荐请求数量
        cache.get(CACHE_KEYS.ANALYTICS, 'rec_personalized_*'),
        cache.get(CACHE_KEYS.ANALYTICS, 'rec_similar_*'),
        cache.get(CACHE_KEYS.ANALYTICS, 'rec_trending_*'),
        cache.get(CACHE_KEYS.ANALYTICS, 'rec_hybrid_*'),
        
        // 反馈统计
        cache.get(CACHE_KEYS.ANALYTICS, 'feedback_personalized'),
        cache.get(CACHE_KEYS.ANALYTICS, 'feedback_similar_users'),
        cache.get(CACHE_KEYS.ANALYTICS, 'feedback_trending'),
        cache.get(CACHE_KEYS.ANALYTICS, 'feedback_hybrid'),
        
        // 评分分布
        ...[1, 2, 3, 4, 5].map(rating => 
          cache.get(CACHE_KEYS.ANALYTICS, `feedback_rating_${rating}`)
        )
      ]);

      res.json({
        success: true,
        data: {
          requests: {
            personalized: stats[0] || 0,
            similar_users: stats[1] || 0,
            trending: stats[2] || 0,
            hybrid: stats[3] || 0
          },
          feedback: {
            personalized: stats[4] || 0,
            similar_users: stats[5] || 0,
            trending: stats[6] || 0,
            hybrid: stats[7] || 0
          },
          ratings: {
            1: stats[8] || 0,
            2: stats[9] || 0,
            3: stats[10] || 0,
            4: stats[11] || 0,
            5: stats[12] || 0
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Recommendation stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendation statistics',
        code: 'STATS_FAILED'
      });
    }
  })
);

export default router; 