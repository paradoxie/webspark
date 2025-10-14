import { prisma } from '../lib/prisma';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/cache';

interface RecommendationScore {
  websiteId: number;
  score: number;
  reasons: string[];
  confidence?: number; // 添加推荐置信度
  diversity?: number;   // 添加多样性指标
}

interface UserPreferences {
  favoriteCategories: number[];
  favoriteTags: string[];
  interactionPattern: {
    likesWeight: number;
    viewsWeight: number;
    bookmarksWeight: number;
    commentsWeight: number;
  };
  timePreference: 'recent' | 'popular' | 'mixed';
  activityLevel: 'low' | 'medium' | 'high'; // 添加活跃度指标
}

interface RecommendationConfig {
  minScore?: number;
  maxCandidates?: number;
  diversityThreshold?: number;
  authorDiversityLimit?: number;
}

export class RecommendationService {
  
  // 默认配置
  private static readonly DEFAULT_CONFIG: RecommendationConfig = {
    minScore: 5,
    maxCandidates: 500,
    diversityThreshold: 0.3,
    authorDiversityLimit: 2
  };
  
  // 获取用户个性化推荐
  static async getUserRecommendations(
    userId: number, 
    limit: number = 10,
    excludeAuthored: boolean = true,
    config: RecommendationConfig = {}
  ): Promise<RecommendationScore[]> {
    // 参数验证
    if (!userId || userId <= 0) {
      throw new Error('Invalid userId provided');
    }
    
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const cacheKey = `user_recommendations_${userId}_${limit}_${excludeAuthored}_${JSON.stringify(finalConfig)}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(CACHE_KEYS.USER_PROFILE, cacheKey);
    if (cached) {
      return cached as RecommendationScore[];
    }

    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true }
      });
      
      if (!user || !user.isActive) {
        console.warn(`User ${userId} not found or inactive`);
        return [];
      }

      // 分析用户偏好
      const userPreferences = await this.analyzeUserPreferences(userId);
      
      // 如果用户没有任何交互历史，返回热门推荐
      if (userPreferences.activityLevel === 'low') {
        return await this.getTrendingRecommendations(userId, limit, 'week');
      }
      
      // 获取候选网站
      const candidates = await this.getCandidateWebsites(userId, excludeAuthored, finalConfig);
      
      if (candidates.length === 0) {
        console.warn(`No candidates found for user ${userId}`);
        return await this.getTrendingRecommendations(userId, limit, 'week');
      }
      
      // 计算推荐分数
      const recommendations = await this.calculateRecommendationScores(
        candidates, 
        userPreferences, 
        userId,
        finalConfig
      );
      
      // 应用多样性过滤
      const diverseRecommendations = this.applyDiversityFilter(
        recommendations, 
        finalConfig.diversityThreshold!,
        finalConfig.authorDiversityLimit!
      );
      
      // 过滤低分推荐
      const filteredRecommendations = diverseRecommendations
        .filter(rec => rec.score >= finalConfig.minScore!)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // 如果推荐数量不足，补充趋势推荐
      if (filteredRecommendations.length < limit) {
        const trendingRecs = await this.getTrendingRecommendations(
          userId, 
          limit - filteredRecommendations.length, 
          'week'
        );
        
        // 确保不重复
        const existingIds = new Set(filteredRecommendations.map(r => r.websiteId));
        const uniqueTrending = trendingRecs.filter(r => !existingIds.has(r.websiteId));
        
        filteredRecommendations.push(...uniqueTrending);
      }

      // 缓存结果
      await cache.set(
        CACHE_KEYS.USER_PROFILE, 
        cacheKey, 
        filteredRecommendations, 
        { ttl: CACHE_TTL.MEDIUM }
      );

      return filteredRecommendations;
    } catch (error) {
      console.error('Recommendation service error:', error);
      // 降级策略：返回热门推荐
      return await this.getTrendingRecommendations(userId, limit, 'week');
    }
  }

  // 分析用户偏好 - 增强版本
  private static async analyzeUserPreferences(userId: number): Promise<UserPreferences> {
    const [userLikes, userBookmarks, userComments, userViews] = await Promise.all([
      // 用户点赞的网站
      prisma.websiteLike.findMany({
        where: { 
          userId,
          website: {
            status: 'APPROVED',
            deletedAt: null
          }
        },
        include: {
          website: {
            include: {
              category: true,
              tags: true
            }
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      
      // 用户收藏的网站
      prisma.bookmark.findMany({
        where: { 
          userId,
          website: {
            status: 'APPROVED',
            deletedAt: null
          }
        },
        include: {
          website: {
            include: {
              category: true,
              tags: true
            }
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      
      // 用户评论的网站
      prisma.comment.findMany({
        where: { 
          authorId: userId,
          website: {
            status: 'APPROVED',
            deletedAt: null
          }
        },
        include: {
          website: {
            include: {
              category: true,
              tags: true
            }
          }
        },
        take: 30,
        orderBy: { createdAt: 'desc' }
      }),
      
      // 用户浏览记录
      prisma.websiteClick.findMany({
        where: { 
          userId, 
          clickType: 'view',
          // 只考虑最近3个月的浏览记录
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          },
          website: {
            status: 'APPROVED',
            deletedAt: null
          }
        },
        include: {
          website: {
            include: {
              category: true,
              tags: true
            }
          }
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 过滤掉null的website
    const validLikes = userLikes.filter(like => like.website);
    const validBookmarks = userBookmarks.filter(bookmark => bookmark.website);
    const validComments = userComments.filter(comment => comment.website);
    const validViews = userViews.filter(view => view.website);

    // 分析分类偏好
    const categoryScores = new Map<number, number>();
    const tagScores = new Map<string, number>();

    // 时间衰减权重设置
    const now = Date.now();
    const weights = {
      like: 5,
      bookmark: 4,
      comment: 3,
      view: 1
    };

    // 计算时间衰减因子
    const getTimeDecayFactor = (createdAt: Date): number => {
      const ageInDays = (now - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
      return Math.exp(-ageInDays / 30); // 30天半衰期
    };

    // 处理点赞数据
    validLikes.forEach(like => {
      const decayFactor = getTimeDecayFactor(like.createdAt);
      const weightedScore = weights.like * decayFactor;
      
      if (like.website.category) {
        const currentScore = categoryScores.get(like.website.category.id) || 0;
        categoryScores.set(like.website.category.id, currentScore + weightedScore);
      }
      like.website.tags.forEach(tag => {
        const currentScore = tagScores.get(tag.slug) || 0;
        tagScores.set(tag.slug, currentScore + weightedScore);
      });
    });

    // 处理收藏数据
    validBookmarks.forEach(bookmark => {
      const decayFactor = getTimeDecayFactor(bookmark.createdAt);
      const weightedScore = weights.bookmark * decayFactor;
      
      if (bookmark.website.category) {
        const currentScore = categoryScores.get(bookmark.website.category.id) || 0;
        categoryScores.set(bookmark.website.category.id, currentScore + weightedScore);
      }
      bookmark.website.tags.forEach(tag => {
        const currentScore = tagScores.get(tag.slug) || 0;
        tagScores.set(tag.slug, currentScore + weightedScore);
      });
    });

    // 处理评论数据
    validComments.forEach(comment => {
      const decayFactor = getTimeDecayFactor(comment.createdAt);
      const weightedScore = weights.comment * decayFactor;
      
      if (comment.website.category) {
        const currentScore = categoryScores.get(comment.website.category.id) || 0;
        categoryScores.set(comment.website.category.id, currentScore + weightedScore);
      }
      comment.website.tags.forEach(tag => {
        const currentScore = tagScores.get(tag.slug) || 0;
        tagScores.set(tag.slug, currentScore + weightedScore);
      });
    });

    // 处理浏览数据
    validViews.forEach(view => {
      const decayFactor = getTimeDecayFactor(view.createdAt);
      const weightedScore = weights.view * decayFactor;
      
      if (view.website.category) {
        const currentScore = categoryScores.get(view.website.category.id) || 0;
        categoryScores.set(view.website.category.id, currentScore + weightedScore);
      }
      view.website.tags.forEach(tag => {
        const currentScore = tagScores.get(tag.slug) || 0;
        tagScores.set(tag.slug, currentScore + weightedScore);
      });
    });

    // 提取偏好
    const favoriteCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryId]) => categoryId);

    const favoriteTags = Array.from(tagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tagSlug]) => tagSlug);

    // 分析交互模式
    const totalActions = validLikes.length + validBookmarks.length + validComments.length + validViews.length;
    const interactionPattern = {
      likesWeight: totalActions > 0 ? validLikes.length / totalActions : 0.3,
      viewsWeight: totalActions > 0 ? validViews.length / totalActions : 0.4,
      bookmarksWeight: totalActions > 0 ? validBookmarks.length / totalActions : 0.2,
      commentsWeight: totalActions > 0 ? validComments.length / totalActions : 0.1
    };

    // 分析时间偏好
    const recentActions = [...validLikes, ...validBookmarks, ...validComments]
      .filter(action => {
        const actionDate = new Date(action.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return actionDate > weekAgo;
      });

    const timePreference: 'recent' | 'popular' | 'mixed' = 
      recentActions.length > totalActions * 0.7 ? 'recent' :
      recentActions.length < totalActions * 0.3 ? 'popular' : 'mixed';

    // 确定活跃度级别
    const activityLevel: 'low' | 'medium' | 'high' = 
      totalActions < 5 ? 'low' :
      totalActions < 20 ? 'medium' : 'high';

    return {
      favoriteCategories,
      favoriteTags,
      interactionPattern,
      timePreference,
      activityLevel
    };
  }

  // 获取候选网站 - 增强版本
  private static async getCandidateWebsites(
    userId: number, 
    excludeAuthored: boolean,
    config: RecommendationConfig
  ) {
    const excludeConditions: any = {
      status: 'APPROVED',
      deletedAt: null
    };

    if (excludeAuthored) {
      excludeConditions.authorId = { not: userId };
    }

    // 获取用户已经交互过的网站ID
    const [likedIds, bookmarkedIds, commentedIds, viewedIds] = await Promise.all([
      prisma.websiteLike.findMany({ where: { userId }, select: { websiteId: true } }),
      prisma.bookmark.findMany({ where: { userId }, select: { websiteId: true } }),
      prisma.comment.findMany({ where: { authorId: userId }, select: { websiteId: true } }),
      prisma.websiteClick.findMany({ 
        where: { 
          userId,
          // 只排除最近点击过的，避免过度排除
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }, 
        select: { websiteId: true } 
      })
    ]);

    const interactedIds = new Set([
      ...likedIds.map(l => l.websiteId),
      ...bookmarkedIds.map(b => b.websiteId),
      ...commentedIds.map(c => c.websiteId),
      ...viewedIds.map(v => v.websiteId)
    ]);

    // 获取候选网站（排除已交互的）
    return await prisma.website.findMany({
      where: {
        ...excludeConditions,
        id: { notIn: Array.from(interactedIds) }
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
        category: true,
        tags: true,
        _count: {
          select: {
            comments: true,
            websiteLikes: true,
            bookmarks: true
          }
        }
      },
      take: config.maxCandidates || 500,
      orderBy: [
        { featured: 'desc' },
        { likeCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  // 计算推荐分数 - 增强版本
  private static async calculateRecommendationScores(
    candidates: any[],
    preferences: UserPreferences,
    userId: number,
    config: RecommendationConfig
  ): Promise<RecommendationScore[]> {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    return candidates.map(website => {
      let score = 0;
      const reasons: string[] = [];
      let confidence = 0;

      // 分类匹配分数 (30%)
      if (website.category && preferences.favoriteCategories.includes(website.category.id)) {
        const categoryIndex = preferences.favoriteCategories.indexOf(website.category.id);
        const categoryScore = (5 - categoryIndex) * 6; // 最高30分
        score += categoryScore;
        confidence += 0.3;
        reasons.push(`匹配您喜欢的分类: ${website.category.name}`);
      }

      // 标签匹配分数 (25%)
      const matchingTags = website.tags.filter((tag: any) => 
        preferences.favoriteTags.includes(tag.slug)
      );
      if (matchingTags.length > 0) {
        const tagScore = Math.min(matchingTags.length * 5, 25); // 最高25分
        score += tagScore;
        confidence += Math.min(matchingTags.length * 0.1, 0.25);
        reasons.push(`包含您感兴趣的标签: ${matchingTags.map((t: any) => t.name).join(', ')}`);
      }

      // 热度分数 (20%) - 增加防护
      const likeCount = Math.max(0, website.likeCount || 0);
      const viewCount = Math.max(0, website.viewCount || 0);
      const commentCount = Math.max(0, website._count?.comments || 0);
      
      const popularityScore = Math.min(
        (likeCount * 2 + viewCount * 0.1 + commentCount * 3) / 10,
        20
      );
      score += popularityScore;
      if (popularityScore > 15) {
        reasons.push('热门作品');
        confidence += 0.1;
      }

      // 时新性分数 (15%)
      const createdAt = website.createdAt ? new Date(website.createdAt).getTime() : now;
      const ageInDays = (now - createdAt) / dayInMs;
      let freshnessScore = 0;
      
      if (preferences.timePreference === 'recent') {
        freshnessScore = Math.max(15 - ageInDays * 0.5, 0);
      } else if (preferences.timePreference === 'mixed') {
        freshnessScore = Math.max(10 - ageInDays * 0.3, 0);
      } else {
        freshnessScore = Math.min(ageInDays * 0.1, 5); // 偏好经典作品
      }
      score += freshnessScore;
      
      if (ageInDays < 7) {
        reasons.push('最新作品');
        confidence += 0.05;
      } else if (ageInDays < 30) {
        reasons.push('近期作品');
      }

      // 质量分数 (10%)
      const qualityScore = website.featured ? 10 : 
        (likeCount > 50 ? 7 : 
         likeCount > 20 ? 5 : 
         likeCount > 10 ? 3 : 0);
      score += qualityScore;
      
      if (website.featured) {
        reasons.push('编辑精选');
        confidence += 0.2;
      } else if (likeCount > 50) {
        reasons.push('高质量作品');
        confidence += 0.1;
      }

      // 多样性分数计算
      const diversity = this.calculateDiversityScore(website, preferences);

      return {
        websiteId: website.id,
        score: Math.round(score * 10) / 10,
        reasons: reasons.length > 0 ? reasons : ['为您推荐'],
        confidence: Math.min(confidence, 1.0),
        diversity,
        authorId: website.author?.id // 用于多样性过滤
      } as RecommendationScore & { authorId?: number };
    });
  }

  // 计算多样性分数
  private static calculateDiversityScore(website: any, preferences: UserPreferences): number {
    let diversityScore = 0.5; // 基础分数

    // 分类多样性
    if (website.category && !preferences.favoriteCategories.includes(website.category.id)) {
      diversityScore += 0.2;
    }

    // 标签多样性
    const newTags = website.tags.filter((tag: any) => 
      !preferences.favoriteTags.includes(tag.slug)
    );
    if (newTags.length > 0) {
      diversityScore += Math.min(newTags.length * 0.1, 0.3);
    }

    return Math.min(diversityScore, 1.0);
  }

  // 应用多样性过滤
  private static applyDiversityFilter(
    recommendations: (RecommendationScore & { authorId?: number })[],
    diversityThreshold: number,
    authorDiversityLimit: number
  ): RecommendationScore[] {
    const authorCounts = new Map<number, number>();
    const filteredRecs: RecommendationScore[] = [];

    // 按分数排序
    const sortedRecs = recommendations.sort((a, b) => b.score - a.score);

    for (const rec of sortedRecs) {
      // 检查作者多样性
      if (rec.authorId) {
        const currentCount = authorCounts.get(rec.authorId) || 0;
        if (currentCount >= authorDiversityLimit) {
          continue; // 跳过同一作者的过多推荐
        }
        authorCounts.set(rec.authorId, currentCount + 1);
      }

      // 移除临时字段
      const { authorId, ...cleanRec } = rec;
      filteredRecs.push(cleanRec);
    }

    return filteredRecs;
  }

  // 获取相似用户推荐（协同过滤）- 增强版本
  static async getSimilarUserRecommendations(
    userId: number,
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    if (!userId || userId <= 0) {
      throw new Error('Invalid userId provided');
    }

    try {
      // 查找相似用户（基于共同点赞的网站）
      const userLikes = await prisma.websiteLike.findMany({
        where: { userId },
        select: { websiteId: true }
      });

      if (userLikes.length === 0) {
        return [];
      }

      const likedWebsiteIds = userLikes.map(l => l.websiteId);
      const minCommonLikes = Math.max(1, Math.floor(likedWebsiteIds.length * 0.1));

      // 找到也点赞了这些网站的其他用户
      const similarUsers = await prisma.websiteLike.groupBy({
        by: ['userId'],
        where: {
          websiteId: { in: likedWebsiteIds },
          userId: { not: userId }
        },
        _count: { websiteId: true },
        having: { websiteId: { _count: { gte: minCommonLikes } } },
        orderBy: { _count: { websiteId: 'desc' } },
        take: 20
      });

      if (similarUsers.length === 0) {
        return [];
      }

      // 获取相似用户喜欢但当前用户未点赞的网站
      const similarUserIds = similarUsers.map(u => u.userId);
      const recommendations = await prisma.websiteLike.findMany({
        where: {
          userId: { in: similarUserIds },
          websiteId: { notIn: likedWebsiteIds },
          website: {
            status: 'APPROVED',
            deletedAt: null
          }
        },
        include: {
          website: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true
                }
              },
              category: true,
              tags: true
            }
          }
        },
        take: limit * 3 // 获取更多以便去重和排序
      });

      // 统计每个网站被相似用户点赞的次数
      const websiteScores = new Map<number, number>();
      recommendations.forEach(rec => {
        if (rec.website) {
          const current = websiteScores.get(rec.website.id) || 0;
          websiteScores.set(rec.website.id, current + 1);
        }
      });

      // 构建推荐结果
      const uniqueWebsites = recommendations
        .filter(rec => rec.website)
        .reduce((acc, rec) => {
          if (!acc.find(w => w.website?.id === rec.website?.id)) {
            acc.push(rec);
          }
          return acc;
        }, [] as typeof recommendations);

      return uniqueWebsites
        .map(rec => {
          const score = (websiteScores.get(rec.website!.id) || 0) * 10;
          const confidence = Math.min(score / 50, 1.0); // 基于相似用户数量的置信度
          
          return {
            websiteId: rec.website!.id,
            score,
            reasons: ['相似用户喜欢的作品'],
            confidence,
            diversity: 0.7 // 协同过滤通常有较好的多样性
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Similar user recommendations error:', error);
      return [];
    }
  }

  // 获取趋势推荐 - 增强版本
  static async getTrendingRecommendations(
    userId?: number,
    limit: number = 10,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<RecommendationScore[]> {
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const cacheKey = `trending_${timeRange}_${userId || 'guest'}_${limit}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(CACHE_KEYS.POPULAR_WEBSITES, cacheKey);
    if (cached) {
      return cached as RecommendationScore[];
    }

    try {
      const now = new Date();
      const timeRanges = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };

      const startDate = timeRanges[timeRange];

      // 获取时间范围内的热门网站
      const trendingWebsites = await prisma.website.findMany({
        where: {
          status: 'APPROVED',
          deletedAt: null,
          createdAt: { gte: startDate }
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
          category: true,
          tags: true,
          _count: {
            select: {
              websiteLikes: {
                where: { createdAt: { gte: startDate } }
              },
              websiteClicks: {
                where: { createdAt: { gte: startDate } }
              },
              comments: {
                where: { createdAt: { gte: startDate } }
              }
            }
          }
        },
        take: limit * 3,
        orderBy: [
          { featured: 'desc' },
          { likeCount: 'desc' }
        ]
      });

      // 计算趋势分数
      const recommendations = trendingWebsites.map(website => {
        const likesScore = (website._count.websiteLikes || 0) * 5;
        const viewsScore = (website._count.websiteClicks || 0) * 0.5;
        const commentsScore = (website._count.comments || 0) * 3;
        const featuredBonus = website.featured ? 20 : 0;
        
        // 时间衰减因子
        const ageInHours = (now.getTime() - new Date(website.createdAt).getTime()) / (1000 * 60 * 60);
        const timeFactor = Math.exp(-ageInHours / (timeRange === 'day' ? 24 : timeRange === 'week' ? 168 : 720));
        
        const totalScore = (likesScore + viewsScore + commentsScore + featuredBonus) * timeFactor;

        const reasons = [];
        if (website._count.websiteLikes > 10) reasons.push('最近很受欢迎');
        if (website._count.comments > 5) reasons.push('讨论热烈');
        if (website.featured) reasons.push('编辑精选');
        if (website._count.websiteClicks > 100) reasons.push('浏览量很高');

        const confidence = Math.min(totalScore / 100, 1.0);

        return {
          websiteId: website.id,
          score: Math.round(totalScore * 10) / 10,
          reasons: reasons.length > 0 ? reasons : [`${timeRange === 'day' ? '今日' : timeRange === 'week' ? '本周' : '本月'}趋势`],
          confidence,
          diversity: 0.5 // 趋势推荐多样性中等
        };
      });

      const sortedRecommendations = recommendations
        .filter(rec => rec.score > 0) // 过滤零分推荐
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // 缓存结果
      await cache.set(
        CACHE_KEYS.POPULAR_WEBSITES, 
        cacheKey, 
        sortedRecommendations, 
        { ttl: CACHE_TTL.SHORT }
      );

      return sortedRecommendations;

    } catch (error) {
      console.error('Trending recommendations error:', error);
      return [];
    }
  }

  // 混合推荐策略 - 增强版本
  static async getHybridRecommendations(
    userId: number,
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    if (!userId || userId <= 0) {
      throw new Error('Invalid userId provided');
    }
    
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      // 动态调整各种推荐的比例
      const [personalizedRecs, similarUserRecs, trendingRecs] = await Promise.all([
        this.getUserRecommendations(userId, Math.ceil(limit * 0.6)), // 增加个性化比重
        this.getSimilarUserRecommendations(userId, Math.ceil(limit * 0.3)),
        this.getTrendingRecommendations(userId, Math.ceil(limit * 0.2))
      ]);

      // 合并并去重
      const allRecs = new Map<number, RecommendationScore>();
      
      // 个性化推荐权重最高
      personalizedRecs.forEach(rec => {
        allRecs.set(rec.websiteId, {
          ...rec,
          score: rec.score * 1.3, // 提高个性化推荐权重
          reasons: [`个性化推荐: ${rec.reasons.join(', ')}`],
          confidence: (rec.confidence || 0.5) * 1.2
        });
      });

      // 协同过滤推荐
      similarUserRecs.forEach(rec => {
        if (allRecs.has(rec.websiteId)) {
          const existing = allRecs.get(rec.websiteId)!;
          existing.score += rec.score * 0.8;
          existing.confidence = Math.min((existing.confidence || 0) + 0.2, 1.0);
          existing.reasons.push('相似用户喜欢');
        } else {
          allRecs.set(rec.websiteId, {
            ...rec,
            score: rec.score * 0.8,
            confidence: (rec.confidence || 0.5) * 0.8
          });
        }
      });

      // 趋势推荐
      trendingRecs.forEach(rec => {
        if (allRecs.has(rec.websiteId)) {
          const existing = allRecs.get(rec.websiteId)!;
          existing.score += rec.score * 0.6;
          existing.confidence = Math.min((existing.confidence || 0) + 0.1, 1.0);
          existing.reasons.push('当前热门');
        } else {
          allRecs.set(rec.websiteId, {
            ...rec,
            score: rec.score * 0.6,
            confidence: (rec.confidence || 0.5) * 0.6
          });
        }
      });

      // 最终排序和过滤
      const finalRecommendations = Array.from(allRecs.values())
        .filter(rec => rec.score > 5) // 过滤低分推荐
        .sort((a, b) => {
          // 综合考虑分数和置信度
          const scoreA = b.score * (b.confidence || 0.5);
          const scoreB = a.score * (a.confidence || 0.5);
          return scoreA - scoreB;
        })
        .slice(0, limit);

      // 确保推荐数量充足
      if (finalRecommendations.length < limit) {
        const additionalTrending = await this.getTrendingRecommendations(
          userId, 
          limit - finalRecommendations.length, 
          'month'
        );
        
        const existingIds = new Set(finalRecommendations.map(r => r.websiteId));
        const uniqueAdditional = additionalTrending.filter(r => !existingIds.has(r.websiteId));
        
        finalRecommendations.push(...uniqueAdditional);
      }

      return finalRecommendations;

    } catch (error) {
      console.error('Hybrid recommendations error:', error);
      // 降级策略
      return await this.getTrendingRecommendations(userId, limit, 'week');
    }
  }
} 