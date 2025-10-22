import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

// 获取待审核的网站列表
router.get('/websites', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status = 'PENDING', page = 1, pageSize = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  
  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where: {
        status: status as any,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(pageSize),
    }),
    prisma.website.count({
      where: {
        status: status as any,
        deletedAt: null,
      },
    }),
  ]);

  res.json({
    data: websites,
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

// 审核通过网站
router.post('/websites/:id/approve', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const website = await prisma.website.update({
    where: { id: Number(id) },
    data: { status: 'APPROVED' },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  // 发送审核通过通知
  try {
    await NotificationService.notifyWebsiteApproved(Number(id), website.author.id);
  } catch (notificationError) {
    console.error('Failed to send approval notification:', notificationError);
  }

  res.json({
    message: 'Website approved successfully',
    data: website,
  });
}));

// 拒绝网站
router.post('/websites/:id/reject', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const website = await prisma.website.update({
    where: { id: Number(id) },
    data: { 
      status: 'REJECTED',
      // 这里可以添加拒绝理由字段到数据库
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  // 发送审核拒绝通知
  try {
    await NotificationService.notifyWebsiteRejected(Number(id), website.author.id, reason);
  } catch (notificationError) {
    console.error('Failed to send rejection notification:', notificationError);
  }

  res.json({
    message: 'Website rejected successfully',
    data: website,
    reason,
  });
}));

// 设置/取消精选
router.post('/websites/:id/toggle-featured', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const currentWebsite = await prisma.website.findUnique({
    where: { id: Number(id) },
    select: { featured: true },
  });

  if (!currentWebsite) {
    return res.status(404).json({ error: 'Website not found' });
  }

  const website = await prisma.website.update({
    where: { id: Number(id) },
    data: { featured: !currentWebsite.featured },
  });

  res.json({
    message: `Website ${website.featured ? 'featured' : 'unfeatured'} successfully`,
    data: website,
  });
}));

// 批量审核网站
router.post('/websites/batch', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { action, websiteIds, reason } = req.body;
  
  if (!action || !websiteIds || !Array.isArray(websiteIds)) {
    return res.status(400).json({ 
      error: 'Invalid request data',
      code: 'INVALID_REQUEST'
    });
  }

  const validActions = ['approve', 'reject', 'feature', 'unfeature', 'delete'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action',
      code: 'INVALID_ACTION'
    });
  }

  const results = [];
  const errors = [];

  for (const websiteId of websiteIds) {
    try {
      let result;
      
      switch (action) {
        case 'approve':
          result = await prisma.website.update({
            where: { id: parseInt(websiteId) },
            data: { status: 'APPROVED' },
            include: {
              author: {
                select: { id: true, email: true, name: true }
              }
            }
          });
          
          // 发送通知
          await NotificationService.createNotification({
            userId: result.authorId,
            type: 'WEBSITE_APPROVED',
            title: '作品审核通过',
            message: `您的作品"${result.title}"已通过审核！`,
            websiteId: result.id
          });
          break;
          
        case 'reject':
          result = await prisma.website.update({
            where: { id: parseInt(websiteId) },
            data: { status: 'REJECTED' },
            include: {
              author: {
                select: { id: true, email: true, name: true }
              }
            }
          });
          
          // 发送通知
          await NotificationService.createNotification({
            userId: result.authorId,
            type: 'WEBSITE_REJECTED',
            title: '作品审核未通过',
            message: `您的作品"${result.title}"未通过审核。${reason ? `原因：${reason}` : ''}`,
            websiteId: result.id
          });
          break;
          
        case 'feature':
          result = await prisma.website.update({
            where: { id: parseInt(websiteId) },
            data: { featured: true }
          });
          break;
          
        case 'unfeature':
          result = await prisma.website.update({
            where: { id: parseInt(websiteId) },
            data: { featured: false }
          });
          break;
          
        case 'delete':
          result = await prisma.website.update({
            where: { id: parseInt(websiteId) },
            data: { deletedAt: new Date() }
          });
          break;
      }
      
      results.push({ websiteId, success: true, data: result });
    } catch (error) {
      console.error(`Batch operation failed for website ${websiteId}:`, error);
      errors.push({ websiteId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  res.json({
    message: `Batch ${action} operation completed`,
    results,
    errors,
    summary: {
      total: websiteIds.length,
      successful: results.length,
      failed: errors.length
    }
  });
}));

// 批量标签编辑
router.post('/websites/batch-tags', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { websiteIds, addTags, removeTags } = req.body;
  
  if (!websiteIds || !Array.isArray(websiteIds)) {
    return res.status(400).json({ 
      error: 'Invalid website IDs',
      code: 'INVALID_REQUEST'
    });
  }

  const results = [];
  const errors = [];

  for (const websiteId of websiteIds) {
    try {
      const website = await prisma.website.findUnique({
        where: { id: parseInt(websiteId) },
        include: { tags: true }
      });

      if (!website) {
        errors.push({ websiteId, error: 'Website not found' });
        continue;
      }

      // 准备更新操作
      const updateData: any = {};

      if (addTags && addTags.length > 0) {
        // 添加标签
        const tagsToAdd = await prisma.tag.findMany({
          where: { id: { in: addTags.map((id: any) => parseInt(id)) } }
        });
        
        updateData.tags = {
          connect: tagsToAdd.map(tag => ({ id: tag.id }))
        };
      }

      if (removeTags && removeTags.length > 0) {
        // 移除标签
        updateData.tags = {
          ...updateData.tags,
          disconnect: removeTags.map((id: any) => ({ id: parseInt(id) }))
        };
      }

      const result = await prisma.website.update({
        where: { id: parseInt(websiteId) },
        data: updateData,
        include: { tags: true }
      });

      results.push({ websiteId, success: true, data: result });
    } catch (error) {
      console.error(`Batch tag operation failed for website ${websiteId}:`, error);
      errors.push({ websiteId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  res.json({
    message: 'Batch tag operation completed',
    results,
    errors,
    summary: {
      total: websiteIds.length,
      successful: results.length,
      failed: errors.length
    }
  });
}));

// 获取用户列表
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20, search } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  
  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { username: { contains: search as string } },
      { email: { contains: search as string } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            websites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(pageSize),
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  res.json({
    data: users,
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

// 启用/禁用用户
router.post('/users/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const currentUser = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { isActive: true },
  });

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { isActive: !currentUser.isActive },
  });

  res.json({
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
}));

// 获取管理统计数据
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalWebsites,
    pendingWebsites,
    approvedWebsites,
    rejectedWebsites,
    totalReports,
    openReports,
    recentActivity,
    topCategories,
    platformGrowth
  ] = await Promise.all([
    prisma.user.count(),
    prisma.website.count({ where: { deletedAt: null } }),
    prisma.website.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.website.count({ where: { status: 'APPROVED', deletedAt: null } }),
    prisma.website.count({ where: { status: 'REJECTED', deletedAt: null } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
    // 最近7天的活动统计
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as websites,
        (SELECT COUNT(*) FROM User WHERE DATE(createdAt) = DATE(w.createdAt)) as users,
        (SELECT COUNT(*) FROM Comment WHERE DATE(createdAt) = DATE(w.createdAt)) as comments
      FROM Website w
      WHERE w.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND w.deletedAt IS NULL
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `,
    // 分类统计
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
      take: 5,
    }),
    // 平台增长数据（月度）
    prisma.$queryRaw`
      SELECT 
        YEAR(createdAt) as year,
        MONTH(createdAt) as month,
        COUNT(*) as count,
        'users' as type
      FROM User
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      UNION ALL
      SELECT 
        YEAR(createdAt) as year,
        MONTH(createdAt) as month,
        COUNT(*) as count,
        'websites' as type
      FROM Website
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status = 'APPROVED'
        AND deletedAt IS NULL
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY year DESC, month DESC
    `,
  ]);

  res.json({
    data: {
      overview: {
        users: {
          total: totalUsers,
        },
        websites: {
          total: totalWebsites,
          pending: pendingWebsites,
          approved: approvedWebsites,
          rejected: rejectedWebsites,
          approvalRate: totalWebsites > 0 ? ((approvedWebsites / totalWebsites) * 100).toFixed(1) : '0.0',
        },
        reports: {
          total: totalReports,
          open: openReports,
          resolutionRate: totalReports > 0 ? (((totalReports - openReports) / totalReports) * 100).toFixed(1) : '0.0',
        },
      },
      recentActivity,
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        websiteCount: cat._count.websites,
      })),
      growth: platformGrowth,
    },
  });
}));


// === 分类管理 API ===

// 获取所有分类
router.get('/categories', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      color: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
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

// 创建分类
router.post('/categories', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, description, icon, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  // 检查名称是否已存在
  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    return res.status(409).json({ error: 'Category name already exists' });
  }

  // 生成slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // 获取最大的sortOrder
  const lastCategory = await prisma.category.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name,
      slug: slug + '-' + Date.now(),
      description,
      icon,
      color,
      sortOrder: (lastCategory?.sortOrder || 0) + 1,
    },
  });

  res.status(201).json({
    data: category,
    message: 'Category created successfully',
  });
}));

// 更新分类
router.put('/categories/:id', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, icon, color, sortOrder, isActive } = req.body;

  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: {
      name,
      description,
      icon,
      color,
      sortOrder,
      isActive,
    },
  });

  res.json({
    data: category,
    message: 'Category updated successfully',
  });
}));

// 删除分类
router.delete('/categories/:id', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // 检查是否有关联的网站
  const websiteCount = await prisma.website.count({
    where: {
      categoryId: Number(id),
      deletedAt: null,
    },
  });

  if (websiteCount > 0) {
    return res.status(400).json({
      error: `Cannot delete category with ${websiteCount} associated websites`,
    });
  }

  await prisma.category.delete({
    where: { id: Number(id) },
  });

  res.json({
    message: 'Category deleted successfully',
  });
}));

// 切换分类状态
router.post('/categories/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const currentCategory = await prisma.category.findUnique({
    where: { id: Number(id) },
    select: { isActive: true },
  });

  if (!currentCategory) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: { isActive: !currentCategory.isActive },
  });

  res.json({
    message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
    data: category,
  });
}));

// 获取举报列表
router.get('/reports', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, reason, page = 1, pageSize = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(pageSize);

  // 构建查询条件
  const where: any = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  if (reason && reason !== 'all') {
    where.reason = reason;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        website: {
          select: {
            id: true,
            title: true,
            slug: true,
            url: true,
            author: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        reporter: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(pageSize)
    }),
    prisma.report.count({ where })
  ]);

  res.json({
    data: reports,
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

// 处理举报（关闭）
router.put('/reports/:id/close', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({
    where: { id: Number(id) }
  });

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (report.status === 'CLOSED') {
    return res.status(400).json({ error: 'Report already closed' });
  }

  const updatedReport = await prisma.report.update({
    where: { id: Number(id) },
    data: { status: 'CLOSED' }
  });

  res.json({
    message: 'Report closed successfully',
    data: updatedReport
  });
}));

// 忽略举报（关闭但不采取行动）
router.put('/reports/:id/dismiss', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const report = await prisma.report.findUnique({
    where: { id: Number(id) }
  });

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (report.status === 'CLOSED') {
    return res.status(400).json({ error: 'Report already closed' });
  }

  const updatedReport = await prisma.report.update({
    where: { id: Number(id) },
    data: { status: 'CLOSED' }
  });

  res.json({
    message: 'Report dismissed successfully',
    data: updatedReport
  });
}));

export default router; 