import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// 批量加载用户交互数据
export async function batchLoadUserInteractions(
  websiteIds: number[],
  userId?: number
) {
  if (!userId || websiteIds.length === 0) {
    return new Map();
  }

  // 使用事务批量获取所有交互数据
  const [likes, bookmarks] = await prisma.$transaction([
    prisma.websiteLike.findMany({
      where: {
        websiteId: { in: websiteIds },
        userId
      },
      select: { websiteId: true }
    }),
    prisma.bookmark.findMany({
      where: {
        websiteId: { in: websiteIds },
        userId
      },
      select: { websiteId: true }
    })
  ]);

  // 构建映射
  const interactionMap = new Map<number, { isLiked: boolean; isBookmarked: boolean }>();
  
  const likedWebsiteIds = new Set(likes.map(l => l.websiteId));
  const bookmarkedWebsiteIds = new Set(bookmarks.map(b => b.websiteId));

  websiteIds.forEach(websiteId => {
    interactionMap.set(websiteId, {
      isLiked: likedWebsiteIds.has(websiteId),
      isBookmarked: bookmarkedWebsiteIds.has(websiteId)
    });
  });

  return interactionMap;
}

// 优化的网站查询，避免N+1问题
export async function optimizedWebsiteQuery(
  where: Prisma.WebsiteWhereInput,
  options: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.WebsiteOrderByWithRelationInput | Prisma.WebsiteOrderByWithRelationInput[];
    userId?: number;
  } = {}
) {
  const { skip = 0, take = 20, orderBy, userId } = options;

  // 执行主查询
  const websites = await prisma.website.findMany({
    where,
    skip,
    take,
    orderBy,
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
      },
      _count: {
        select: {
          likedBy: true,
          bookmarkedBy: true,
          comments: {
            where: {
              status: 'APPROVED',
              deletedAt: null
            }
          }
        }
      }
    }
  });

  // 批量加载用户交互数据
  const websiteIds = websites.map(w => w.id);
  const userInteractions = await batchLoadUserInteractions(websiteIds, userId);

  // 组合数据
  const websitesWithInteractions = websites.map(website => ({
    ...website,
    isLiked: userInteractions.get(website.id)?.isLiked || false,
    isBookmarked: userInteractions.get(website.id)?.isBookmarked || false
  }));

  return websitesWithInteractions;
}

// 预加载相关数据以避免延迟加载
export async function preloadRelatedData<T extends { id: number }[]>(
  items: T,
  relations: {
    likes?: { userId: number };
    bookmarks?: { userId: number };
    comments?: boolean;
  }
) {
  const itemIds = items.map(item => item.id);
  const results: any = {};

  const queries = [];

  if (relations.likes) {
    queries.push(
      prisma.websiteLike.findMany({
        where: {
          websiteId: { in: itemIds },
          userId: relations.likes.userId
        },
        select: { websiteId: true }
      }).then(likes => {
        results.likes = new Set(likes.map(l => l.websiteId));
      })
    );
  }

  if (relations.bookmarks) {
    queries.push(
      prisma.bookmark.findMany({
        where: {
          websiteId: { in: itemIds },
          userId: relations.bookmarks.userId
        },
        select: { websiteId: true }
      }).then(bookmarks => {
        results.bookmarks = new Set(bookmarks.map(b => b.websiteId));
      })
    );
  }

  if (relations.comments) {
    queries.push(
      prisma.comment.groupBy({
        by: ['websiteId'],
        where: {
          websiteId: { in: itemIds },
          status: 'APPROVED',
          deletedAt: null
        },
        _count: true
      }).then(counts => {
        results.commentCounts = new Map(
          counts.map(c => [c.websiteId, c._count])
        );
      })
    );
  }

  await Promise.all(queries);

  return results;
}

// 使用数据库级别的计算优化排序
export async function getWebsitesWithScore(
  page: number = 1,
  pageSize: number = 20,
  where: Prisma.WebsiteWhereInput = {}
) {
  const skip = (page - 1) * pageSize;

  // 使用数据库计算分数并排序
  const result = await prisma.$queryRaw<any[]>`
    SELECT 
      w.*,
      (w.likeCount * 5 + UNIX_TIMESTAMP(w.createdAt) / 10000) as score,
      u.username as authorUsername,
      u.name as authorName,
      u.avatar as authorAvatar,
      c.name as categoryName,
      c.slug as categorySlug,
      c.icon as categoryIcon,
      c.color as categoryColor
    FROM websites w
    LEFT JOIN users u ON w.authorId = u.id
    LEFT JOIN categories c ON w.categoryId = c.id
    WHERE w.status = 'APPROVED' 
      AND w.deletedAt IS NULL
      ${where.categoryId ? `AND w.categoryId = ${where.categoryId}` : ''}
      ${where.authorId ? `AND w.authorId = ${where.authorId}` : ''}
    ORDER BY score DESC
    LIMIT ${pageSize} OFFSET ${skip}
  `;

  // 获取标签数据
  const websiteIds = result.map(w => w.id);
  const tags = await prisma.tag.findMany({
    where: {
      websites: {
        some: {
          id: { in: websiteIds }
        }
      }
    },
    include: {
      websites: {
        where: {
          id: { in: websiteIds }
        },
        select: { id: true }
      }
    }
  });

  // 构建标签映射
  const tagMap = new Map();
  tags.forEach(tag => {
    tag.websites.forEach(website => {
      if (!tagMap.has(website.id)) {
        tagMap.set(website.id, []);
      }
      tagMap.get(website.id).push({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color
      });
    });
  });

  // 组合数据
  const websites = result.map(w => ({
    id: w.id,
    title: w.title,
    slug: w.slug,
    url: w.url,
    shortDescription: w.shortDescription,
    description: w.description,
    sourceUrl: w.sourceUrl,
    screenshots: w.screenshots,
    likeCount: w.likeCount,
    viewCount: w.viewCount,
    featured: w.featured,
    isHiring: w.isHiring,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    score: w.score,
    author: {
      id: w.authorId,
      username: w.authorUsername,
      name: w.authorName,
      avatar: w.authorAvatar
    },
    category: w.categoryId ? {
      id: w.categoryId,
      name: w.categoryName,
      slug: w.categorySlug,
      icon: w.categoryIcon,
      color: w.categoryColor
    } : null,
    tags: tagMap.get(w.id) || []
  }));

  return websites;
}

// 缓存预热
export async function warmUpCache() {
  console.log('🔥 Starting cache warm-up...');
  
  try {
    // 预热热门网站
    await getWebsitesWithScore(1, 50);
    
    // 预热各分类的前20个
    const categories = await prisma.category.findMany({
      where: { isActive: true }
    });
    
    for (const category of categories) {
      await getWebsitesWithScore(1, 20, { categoryId: category.id });
    }
    
    // 预热热门标签
    const popularTags = await prisma.tag.findMany({
      orderBy: {
        websites: {
          _count: 'desc'
        }
      },
      take: 10
    });
    
    console.log('✅ Cache warm-up completed');
  } catch (error) {
    console.error('❌ Cache warm-up failed:', error);
  }
}
