import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// 获取所有激活的分类
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      color: true,
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
      sortOrder: 'asc',
    },
  });

  res.json({
    data: categories,
  });
}));

// 按分类获取网站
router.get('/:slug/websites', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { page = 1, pageSize = 12 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  
  const category = await prisma.category.findUnique({
    where: { slug: slug as string },
  });

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where: {
        categoryId: category.id,
        status: 'APPROVED',
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            likedBy: true,
            bookmarkedBy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(pageSize),
    }),
    prisma.website.count({
      where: {
        categoryId: category.id,
        status: 'APPROVED',
        deletedAt: null,
      },
    }),
  ]);

  // 添加分数计算
  const websitesWithMetadata = websites.map(website => ({
    ...website,
    score: (website.likeCount * 5) + (website.createdAt.getTime() / 10000),
    isLiked: false, // TODO: 实现用户点赞状态检查
    isBookmarked: false, // TODO: 实现用户收藏状态检查
  }));

  res.json({
    data: websitesWithMetadata,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
    },
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount: Math.ceil(total / Number(pageSize)),
        total,
      },
    },
  });
}));

// 获取作品数最多的前N个分类
router.get('/top/:count', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.params.count) || 3;
    
    // 获取所有分类，并计算每个分类下的作品数量
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            websites: {
              where: {
                status: 'APPROVED',
                deletedAt: null
              }
            }
          }
        },
        websites: {
          where: {
            status: 'APPROVED',
            deletedAt: null
          },
          take: 5,
          orderBy: {
            createdAt: 'desc'
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
            _count: {
              select: {
                likedBy: true,
                bookmarkedBy: true
              }
            }
          }
        }
      }
    });
    
    // 按作品数量排序
    const sortedCategories = categories
      .map(category => ({
        ...category,
        websiteCount: category._count.websites
      }))
      .sort((a, b) => b.websiteCount - a.websiteCount)
      .slice(0, count);
    
    return res.json({
      data: sortedCategories
    });
  } catch (error) {
    console.error('Error fetching top categories:', error);
    return res.status(500).json({
      error: 'Failed to fetch top categories'
    });
  }
});

export default router; 