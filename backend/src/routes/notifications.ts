import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取用户的通知列表
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, pageSize = 20, unreadOnly = 'false' } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 构建查询条件
  const where: any = { userId };
  if (unreadOnly === 'true') {
    where.isRead = false;
  }

  // 获取通知列表
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        website: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ 
      where: { 
        userId, 
        isRead: false 
      } 
    })
  ]);

  res.json({
    data: notifications,
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        pageCount: Math.ceil(total / Number(pageSize)),
        total
      },
      unreadCount
    }
  });
}));

// 获取未读通知数量
router.get('/unread-count', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const unreadCount = await prisma.notification.count({
    where: { 
      userId, 
      isRead: false 
    }
  });

  res.json({
    data: { unreadCount }
  });
}));

// 标记单个通知为已读
router.put('/:notificationId/read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user!.id;

  // 验证通知所有权
  const notification = await prisma.notification.findFirst({
    where: {
      id: parseInt(notificationId),
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      error: 'Notification not found',
      code: 'NOTIFICATION_NOT_FOUND'
    });
  }

  // 标记为已读
  await prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: { isRead: true }
  });

  res.json({
    message: 'Notification marked as read'
  });
}));

// 标记所有通知为已读
router.put('/read-all', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await prisma.notification.updateMany({
    where: { 
      userId, 
      isRead: false 
    },
    data: { isRead: true }
  });

  res.json({
    message: 'All notifications marked as read',
    count: result.count
  });
}));

// 删除单个通知
router.delete('/:notificationId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user!.id;

  // 验证通知所有权
  const notification = await prisma.notification.findFirst({
    where: {
      id: parseInt(notificationId),
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      error: 'Notification not found',
      code: 'NOTIFICATION_NOT_FOUND'
    });
  }

  // 删除通知
  await prisma.notification.delete({
    where: { id: parseInt(notificationId) }
  });

  res.json({
    message: 'Notification deleted successfully'
  });
}));

// 清空所有已读通知
router.delete('/read', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await prisma.notification.deleteMany({
    where: { 
      userId, 
      isRead: true 
    }
  });

  res.json({
    message: 'All read notifications deleted',
    count: result.count
  });
}));

export default router;