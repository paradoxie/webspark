import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

// 检查管理员权限的中间件
const requireAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 这里可以添加更复杂的管理员权限检查
  // 暂时简单地检查用户ID是否为1（第一个用户为管理员）
  // 在实际项目中，应该有专门的role字段
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
});

// 获取待审核的网站列表
router.get('/websites', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/websites/:id/approve', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/websites/:id/reject', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/websites/:id/toggle-featured', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

// 获取用户列表
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/users/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const [
    totalUsers,
    totalWebsites,
    pendingWebsites,
    approvedWebsites,
    rejectedWebsites,
    totalReports,
    openReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.website.count({ where: { deletedAt: null } }),
    prisma.website.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.website.count({ where: { status: 'APPROVED', deletedAt: null } }),
    prisma.website.count({ where: { status: 'REJECTED', deletedAt: null } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
  ]);

  res.json({
    data: {
      users: {
        total: totalUsers,
      },
      websites: {
        total: totalWebsites,
        pending: pendingWebsites,
        approved: approvedWebsites,
        rejected: rejectedWebsites,
      },
      reports: {
        total: totalReports,
        open: openReports,
      },
    },
  });
}));

// 获取举报列表
router.get('/reports', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status = 'OPEN', page = 1, pageSize = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: {
        status: status as any,
      },
      include: {
        website: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(pageSize),
    }),
    prisma.report.count({
      where: {
        status: status as any,
      },
    }),
  ]);

  res.json({
    data: reports,
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

// 处理举报
router.post('/reports/:id/close', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const report = await prisma.report.update({
    where: { id: Number(id) },
    data: { status: 'CLOSED' },
    include: {
      website: true,
      reporter: true,
    },
  });

  res.json({
    message: 'Report closed successfully',
    data: report,
  });
}));

// === 分类管理 API ===

// 获取所有分类
router.get('/categories', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/categories', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.put('/categories/:id', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.delete('/categories/:id', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/categories/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

export default router; 