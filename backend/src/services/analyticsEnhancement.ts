/**
 * 增强的数据分析服务
 * 提供实时分析、可视化数据、智能报表等功能
 */

import { prisma } from '../db';

interface AnalyticsMetrics {
  // 核心指标
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalWebsites: number;
  approvedWebsites: number;
  totalInteractions: number;
  
  // 增长指标
  userGrowthRate: number;
  contentGrowthRate: number;
  interactionGrowthRate: number;
  
  // 质量指标
  averageEngagementRate: number;
  contentApprovalRate: number;
  userRetentionRate: number;
  
  // 时间序列数据
  timeSeries: TimeSeriesData[];
  
  // 分布数据
  distributions: DistributionData;
}

interface TimeSeriesData {
  date: string;
  users: number;
  websites: number;
  interactions: number;
  revenue?: number;
}

interface DistributionData {
  usersByCountry: Array<{ country: string; count: number; percentage: number }>;
  websitesByCategory: Array<{ category: string; count: number; percentage: number }>;
  usersByDevice: Array<{ device: string; count: number; percentage: number }>;
  trafficSources: Array<{ source: string; count: number; percentage: number }>;
}

interface UserAnalytics {
  userId: number;
  profile: UserProfile;
  behavior: UserBehavior;
  performance: UserPerformance;
  predictions: UserPredictions;
}

interface UserProfile {
  registrationDate: Date;
  lastActiveDate: Date;
  totalWebsites: number;
  totalLikesReceived: number;
  totalViewsReceived: number;
  followerCount: number;
  followingCount: number;
  engagementScore: number;
}

interface UserBehavior {
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  mostActiveHours: number[];
  preferredCategories: string[];
  interactionPatterns: Array<{
    action: string;
    frequency: number;
    lastOccurrence: Date;
  }>;
}

interface UserPerformance {
  contentQualityScore: number;
  communityContribution: number;
  growthTrend: 'rising' | 'stable' | 'declining';
  topPerformingContent: Array<{
    id: number;
    title: string;
    performance: number;
  }>;
}

interface UserPredictions {
  churnProbability: number;
  nextActionPrediction: string;
  lifetimeValue: number;
  recommendedActions: string[];
}

export class AnalyticsService {
  /**
   * 获取实时仪表板数据
   */
  static async getDashboardMetrics(): Promise<AnalyticsMetrics> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all metrics in parallel
    const [
      totalUsers,
      activeUsersDay,
      activeUsersWeek,
      newUsersToday,
      totalWebsites,
      approvedWebsites,
      interactions,
      previousWeekData,
      timeSeries,
      distributions
    ] = await Promise.all([
      prisma.user.count(),
      this.getActiveUsers(dayAgo),
      this.getActiveUsers(weekAgo),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.website.count(),
      prisma.website.count({ where: { status: 'APPROVED' } }),
      this.getTotalInteractions(),
      this.getPreviousWeekData(),
      this.getTimeSeriesData(30),
      this.getDistributionData()
    ]);

    // Calculate growth rates
    const userGrowthRate = this.calculateGrowthRate(
      totalUsers - newUsersToday,
      totalUsers
    );

    const contentGrowthRate = this.calculateGrowthRate(
      previousWeekData.websites,
      approvedWebsites
    );

    const interactionGrowthRate = this.calculateGrowthRate(
      previousWeekData.interactions,
      interactions
    );

    // Calculate quality metrics
    const averageEngagementRate = await this.calculateEngagementRate();
    const contentApprovalRate = (approvedWebsites / totalWebsites) * 100;
    const userRetentionRate = await this.calculateRetentionRate(monthAgo);

    const metrics: AnalyticsMetrics = {
      totalUsers,
      activeUsers: activeUsersWeek,
      newUsers: newUsersToday,
      totalWebsites,
      approvedWebsites,
      totalInteractions: interactions,
      userGrowthRate,
      contentGrowthRate,
      interactionGrowthRate,
      averageEngagementRate,
      contentApprovalRate,
      userRetentionRate,
      timeSeries,
      distributions
    };

    return metrics;
  }

  /**
   * 获取用户分析数据
   */
  static async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        websites: {
          select: {
            id: true,
            title: true,
            likeCount: true,
            viewCount: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            websites: true,
            followers: true,
            following: true,
            websiteLikes: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Build user profile
    const profile = await this.buildUserProfile(user);
    const behavior = await this.analyzeUserBehavior(userId);
    const performance = await this.evaluateUserPerformance(user);
    const predictions = await this.predictUserActions(userId, behavior, performance);

    return {
      userId,
      profile,
      behavior,
      performance,
      predictions
    };
  }

  /**
   * 获取留存分析
   */
  static async getRetentionAnalysis(
    cohortStart: Date,
    cohortEnd: Date,
    periods: number = 7
  ): Promise<{
    cohort: string;
    size: number;
    retention: Array<{
      period: number;
      retained: number;
      percentage: number;
    }>;
  }[]> {
    const cohorts = [];
    
    // 获取队列用户
    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: cohortStart,
          lte: cohortEnd
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    const cohortSize = cohortUsers.length;
    const userIds = cohortUsers.map(u => u.id);

    // 分析每个时期的留存
    const retentionData = [];
    
    for (let period = 0; period <= periods; period++) {
      const periodStart = new Date(cohortEnd.getTime() + period * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
      
      const activeUsers = await prisma.activity.findMany({
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        distinct: ['userId']
      });

      retentionData.push({
        period,
        retained: activeUsers.length,
        percentage: (activeUsers.length / cohortSize) * 100
      });
    }

    return [{
      cohort: `${cohortStart.toISOString().split('T')[0]} - ${cohortEnd.toISOString().split('T')[0]}`,
      size: cohortSize,
      retention: retentionData
    }];
  }

  /**
   * 获取漏斗分析
   */
  static async getFunnelAnalysis(
    steps: Array<{ name: string; event: string }>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    funnel: Array<{
      step: string;
      users: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
    totalConversion: number;
  }> {
    const funnelData = [];
    let previousStepUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // 获取完成该步骤的用户数
      const users = await prisma.activity.count({
        where: {
          type: step.event,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        distinct: ['userId']
      });

      const conversionRate = i === 0 ? 100 : (users / previousStepUsers) * 100;
      const dropoffRate = i === 0 ? 0 : 100 - conversionRate;

      funnelData.push({
        step: step.name,
        users,
        conversionRate,
        dropoffRate
      });

      previousStepUsers = users;
    }

    const totalConversion = funnelData.length > 0
      ? (funnelData[funnelData.length - 1].users / funnelData[0].users) * 100
      : 0;

    return {
      funnel: funnelData,
      totalConversion
    };
  }

  /**
   * 获取实时活动流
   */
  static async getActivityStream(limit: number = 50): Promise<Array<{
    id: string;
    type: string;
    user: string;
    target: string;
    timestamp: Date;
    details: any;
  }>> {
    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id.toString(),
      type: activity.type,
      user: activity.user.name || activity.user.username,
      target: activity.metadata?.target || 'Unknown',
      timestamp: activity.createdAt,
      details: activity.metadata
    }));
  }

  /**
   * 生成自动报表
   */
  static async generateReport(
    type: 'daily' | 'weekly' | 'monthly',
    recipients?: string[]
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    data: any;
    sent: boolean;
  }> {
    const reportId = `report_${type}_${Date.now()}`;
    const now = new Date();
    
    let startDate: Date;
    switch (type) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // 收集报表数据
    const [
      metrics,
      topContent,
      topUsers,
      issues
    ] = await Promise.all([
      this.getDashboardMetrics(),
      this.getTopContent(startDate, now, 10),
      this.getTopUsers(startDate, now, 10),
      this.getSystemIssues(startDate, now)
    ]);

    const reportData = {
      period: { start: startDate, end: now },
      summary: {
        newUsers: metrics.newUsers,
        totalInteractions: metrics.totalInteractions,
        contentGrowth: metrics.contentGrowthRate,
        avgEngagement: metrics.averageEngagementRate
      },
      highlights: {
        topContent,
        topUsers,
        achievements: await this.getAchievements(startDate, now)
      },
      issues,
      recommendations: await this.generateRecommendations(metrics)
    };

    // 发送报表
    let sent = false;
    if (recipients && recipients.length > 0) {
      sent = await this.sendReport(reportId, reportData, recipients);
    }

    // 保存报表
    await this.saveReport(reportId, type, reportData);

    return {
      reportId,
      generatedAt: now,
      data: reportData,
      sent
    };
  }

  // 私有辅助方法

  private static async getActiveUsers(since: Date): Promise<number> {
    return await prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { gte: since } },
          { activities: { some: { createdAt: { gte: since } } } }
        ]
      }
    });
  }

  private static async getTotalInteractions(): Promise<number> {
    const [likes, comments, follows] = await Promise.all([
      prisma.websiteLike.count(),
      prisma.comment.count(),
      prisma.follow.count()
    ]);
    
    return likes + comments + follows;
  }

  private static calculateGrowthRate(previous: number, current: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  private static async calculateEngagementRate(): Promise<number> {
    const totalUsers = await prisma.user.count();
    const activeUsers = await this.getActiveUsers(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    return (activeUsers / totalUsers) * 100;
  }

  private static async calculateRetentionRate(since: Date): Promise<number> {
    const cohortUsers = await prisma.user.count({
      where: { createdAt: { lte: since } }
    });
    
    const retainedUsers = await prisma.user.count({
      where: {
        createdAt: { lte: since },
        lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });
    
    return (retainedUsers / cohortUsers) * 100;
  }

  private static async getTimeSeriesData(days: number): Promise<TimeSeriesData[]> {
    const data: TimeSeriesData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [users, websites, interactions] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: date, lt: nextDate } }
        }),
        prisma.website.count({
          where: { createdAt: { gte: date, lt: nextDate } }
        }),
        this.getInteractionsForPeriod(date, nextDate)
      ]);
      
      data.push({
        date: date.toISOString().split('T')[0],
        users,
        websites,
        interactions
      });
    }
    
    return data;
  }

  private static async getInteractionsForPeriod(
    start: Date,
    end: Date
  ): Promise<number> {
    const [likes, comments] = await Promise.all([
      prisma.websiteLike.count({
        where: { createdAt: { gte: start, lt: end } }
      }),
      prisma.comment.count({
        where: { createdAt: { gte: start, lt: end } }
      })
    ]);
    
    return likes + comments;
  }

  private static async getDistributionData(): Promise<DistributionData> {
    // 获取网站分类分布
    const websitesByCategory = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { websites: true }
        }
      }
    });
    
    const totalWebsites = websitesByCategory.reduce(
      (sum, cat) => sum + cat._count.websites,
      0
    );
    
    return {
      usersByCountry: [], // 需要额外的地理位置数据
      websitesByCategory: websitesByCategory.map(cat => ({
        category: cat.name,
        count: cat._count.websites,
        percentage: (cat._count.websites / totalWebsites) * 100
      })),
      usersByDevice: [], // 需要用户代理解析
      trafficSources: [] // 需要引荐来源追踪
    };
  }

  private static async getPreviousWeekData(): Promise<{
    users: number;
    websites: number;
    interactions: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const [users, websites, interactions] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } }
      }),
      prisma.website.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } }
      }),
      this.getInteractionsForPeriod(twoWeeksAgo, weekAgo)
    ]);
    
    return { users, websites, interactions };
  }

  private static async buildUserProfile(user: any): Promise<UserProfile> {
    const totalLikesReceived = user.websites.reduce(
      (sum: number, w: any) => sum + w.likeCount,
      0
    );

    const totalViewsReceived = user.websites.reduce(
      (sum: number, w: any) => sum + w.viewCount,
      0
    );

    const engagementScore = this.calculateUserEngagementScore(
      totalLikesReceived,
      totalViewsReceived,
      user._count.comments
    );

    return {
      registrationDate: user.createdAt,
      lastActiveDate: user.lastLoginAt || user.updatedAt,
      totalWebsites: user.websites.length,
      totalLikesReceived,
      totalViewsReceived,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      engagementScore
    };
  }

  private static calculateUserEngagementScore(
    likes: number,
    views: number,
    comments: number
  ): number {
    // 加权计算参与度分数
    return Math.min(100, (likes * 5 + views * 0.1 + comments * 3) / 10);
  }

  private static async analyzeUserBehavior(userId: number): Promise<UserBehavior> {
    // 获取用户活动数据
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    // 分析活动模式
    const hourCounts = new Array(24).fill(0);
    const actionCounts = new Map<string, number>();
    
    activities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      hourCounts[hour]++;
      
      const count = actionCounts.get(activity.type) || 0;
      actionCounts.set(activity.type, count + 1);
    });
    
    // 找出最活跃的时间
    const maxCount = Math.max(...hourCounts);
    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count >= maxCount * 0.8)
      .map(h => h.hour);
    
    // 构建交互模式
    const interactionPatterns = Array.from(actionCounts.entries()).map(([action, frequency]) => ({
      action,
      frequency,
      lastOccurrence: activities.find(a => a.type === action)?.createdAt || new Date()
    }));
    
    return {
      averageSessionDuration: 15, // 分钟，需要会话追踪
      pagesPerSession: 5, // 需要页面访问追踪
      bounceRate: 20, // 百分比，需要会话追踪
      mostActiveHours,
      preferredCategories: [], // 需要分析用户浏览历史
      interactionPatterns
    };
  }

  private static async evaluateUserPerformance(user: any): Promise<UserPerformance> {
    const websites = user.websites;

    // Calculate content quality score
    const contentQualityScore = websites.length > 0
      ? websites.reduce((sum: number, w: any) => {
          const score = (w.likeCount * 5 + w.viewCount * 0.1) / websites.length;
          return sum + score;
        }, 0) / websites.length
      : 0;

    // Calculate community contribution
    const communityContribution = user._count.comments + user._count.websiteLikes;

    // Determine growth trend
    const recentWebsites = websites.filter((w: any) =>
      new Date(w.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const growthTrend = recentWebsites.length > websites.length * 0.3
      ? 'rising'
      : recentWebsites.length > 0
      ? 'stable'
      : 'declining';

    // Get top performing content
    const topPerformingContent = websites
      .map((w: any) => ({
        id: w.id,
        title: w.title,
        performance: w.likeCount * 5 + w.viewCount * 0.1
      }))
      .sort((a: any, b: any) => b.performance - a.performance)
      .slice(0, 5);

    return {
      contentQualityScore,
      communityContribution,
      growthTrend,
      topPerformingContent
    };
  }

  private static async predictUserActions(
    userId: number,
    behavior: UserBehavior,
    performance: UserPerformance
  ): Promise<UserPredictions> {
    // 计算流失概率
    const lastActivity = behavior.interactionPatterns[0]?.lastOccurrence;
    const daysSinceLastActivity = lastActivity
      ? (Date.now() - new Date(lastActivity).getTime()) / (24 * 60 * 60 * 1000)
      : 999;
    
    const churnProbability = Math.min(100, daysSinceLastActivity * 10);
    
    // 预测下一个动作
    const mostFrequentAction = behavior.interactionPatterns
      .sort((a, b) => b.frequency - a.frequency)[0];
    const nextActionPrediction = mostFrequentAction?.action || 'browse';
    
    // 计算生命周期价值
    const lifetimeValue = performance.contentQualityScore * 100 + 
                          performance.communityContribution * 10;
    
    // 推荐行动
    const recommendedActions = [];
    if (churnProbability > 50) {
      recommendedActions.push('发送重新激活邮件');
    }
    if (performance.growthTrend === 'declining') {
      recommendedActions.push('提供内容创作指导');
    }
    if (behavior.bounceRate > 50) {
      recommendedActions.push('改善首页体验');
    }
    
    return {
      churnProbability,
      nextActionPrediction,
      lifetimeValue,
      recommendedActions
    };
  }

  private static async getTopContent(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<any[]> {
    return await prisma.website.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'APPROVED'
      },
      orderBy: { likeCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        likeCount: true,
        viewCount: true,
        author: {
          select: { name: true, username: true }
        }
      }
    });
  }

  private static async getTopUsers(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<any[]> {
    // 获取期间内最活跃的用户
    const topUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.username,
        COUNT(DISTINCT w.id) as websiteCount,
        COUNT(DISTINCT c.id) as commentCount,
        COUNT(DISTINCT wl.websiteId) as likeCount
      FROM users u
      LEFT JOIN websites w ON u.id = w.authorId AND w.createdAt >= ${startDate} AND w.createdAt <= ${endDate}
      LEFT JOIN comments c ON u.id = c.authorId AND c.createdAt >= ${startDate} AND c.createdAt <= ${endDate}
      LEFT JOIN website_likes wl ON u.id = wl.userId AND wl.createdAt >= ${startDate} AND wl.createdAt <= ${endDate}
      GROUP BY u.id
      ORDER BY (websiteCount * 10 + commentCount * 3 + likeCount) DESC
      LIMIT ${limit}
    `;
    
    return topUsers;
  }

  private static async getSystemIssues(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // 获取系统问题和异常
    // 这里简化处理，实际应该从错误日志中获取
    return [];
  }

  private static async getAchievements(
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const achievements = [];
    
    // 检查各种成就
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    
    if (newUsers > 100) {
      achievements.push(`🎉 突破 ${newUsers} 个新用户注册`);
    }
    
    const topWebsite = await prisma.website.findFirst({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { likeCount: 'desc' }
    });
    
    if (topWebsite && topWebsite.likeCount > 100) {
      achievements.push(`🔥 "${topWebsite.title}" 获得超过 ${topWebsite.likeCount} 个赞`);
    }
    
    return achievements;
  }

  private static async generateRecommendations(metrics: AnalyticsMetrics): Promise<string[]> {
    const recommendations = [];
    
    if (metrics.userRetentionRate < 50) {
      recommendations.push('用户留存率偏低，建议优化新用户引导流程');
    }
    
    if (metrics.contentApprovalRate < 70) {
      recommendations.push('内容审核通过率偏低，建议提供更清晰的内容指南');
    }
    
    if (metrics.averageEngagementRate < 30) {
      recommendations.push('用户参与度不高，建议增加互动功能和激励机制');
    }
    
    if (metrics.userGrowthRate < 0) {
      recommendations.push('用户增长停滞，建议加强推广和SEO优化');
    }
    
    return recommendations;
  }

  private static async sendReport(
    reportId: string,
    data: any,
    recipients: string[]
  ): Promise<boolean> {
    // 实际应该通过邮件服务发送
    console.log(`Sending report ${reportId} to ${recipients.join(', ')}`);
    return true;
  }

  private static async saveReport(
    reportId: string,
    type: string,
    data: any
  ): Promise<void> {
    // Save report to database or file system
    console.log(`Report ${reportId} of type ${type} saved with data:`, Object.keys(data));
  }
}

