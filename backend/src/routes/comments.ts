import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationService } from '../services/notificationService';

const router = Router();

// 验证schemas
const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  websiteId: Joi.number().integer().positive().required(),
  parentId: Joi.number().integer().positive().optional()
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
});

// 获取网站的评论列表
router.get('/website/:websiteId', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { websiteId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 验证网站是否存在
  const website = await prisma.website.findFirst({
    where: {
      id: parseInt(websiteId),
      status: 'APPROVED',
      deletedAt: null
    }
  });

  if (!website) {
    return res.status(404).json({
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  // 获取评论（只获取顶级评论，回复将嵌套显示）
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        websiteId: parseInt(websiteId),
        parentId: null // 只获取顶级评论
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.comment.count({
      where: {
        websiteId: parseInt(websiteId),
        parentId: null
      }
    })
  ]);

  res.json({
    data: comments,
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

// 创建评论
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 验证请求数据
  const { error, value } = createCommentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { content, websiteId, parentId } = value;
  const userId = req.user!.id;

  // 验证网站是否存在
  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      status: 'APPROVED',
      deletedAt: null
    }
  });

  if (!website) {
    return res.status(404).json({
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  // 如果是回复，验证父评论是否存在
  if (parentId) {
    const parentComment = await prisma.comment.findFirst({
      where: {
        id: parentId,
        websiteId: websiteId
      }
    });

    if (!parentComment) {
      return res.status(404).json({
        error: 'Parent comment not found',
        code: 'PARENT_COMMENT_NOT_FOUND'
      });
    }
  }

  // 创建评论
  const comment = await prisma.comment.create({
    data: {
      content,
      websiteId,
      authorId: userId,
      parentId
    },
    include: {
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

  // 发送通知
  try {
    const commenterName = req.user!.name || req.user!.username;
    
    if (parentId) {
      // 如果是回复，通知被回复的评论作者
      await NotificationService.notifyCommentReplied(parentId, commenterName);
    } else {
      // 如果是新评论，通知网站作者（但不通知自己）
      if (website.authorId !== userId) {
        await NotificationService.notifyWebsiteCommented(websiteId, commenterName);
      }
    }
  } catch (notificationError) {
    // 通知失败不影响评论创建
    console.error('Failed to send comment notification:', notificationError);
  }

  res.status(201).json({
    message: 'Comment created successfully',
    data: comment
  });
}));

// 更新评论
router.put('/:commentId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  // 验证请求数据
  const { error, value } = updateCommentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { content } = value;

  // 查找评论并验证权限
  const comment = await prisma.comment.findUnique({
    where: { id: parseInt(commentId) },
    include: {
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

  if (!comment) {
    return res.status(404).json({
      error: 'Comment not found',
      code: 'COMMENT_NOT_FOUND'
    });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({
      error: 'Permission denied',
      code: 'PERMISSION_DENIED'
    });
  }

  // 更新评论
  const updatedComment = await prisma.comment.update({
    where: { id: parseInt(commentId) },
    data: { content },
    include: {
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

  res.json({
    message: 'Comment updated successfully',
    data: updatedComment
  });
}));

// 删除评论
router.delete('/:commentId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  // 查找评论并验证权限
  const comment = await prisma.comment.findUnique({
    where: { id: parseInt(commentId) }
  });

  if (!comment) {
    return res.status(404).json({
      error: 'Comment not found',
      code: 'COMMENT_NOT_FOUND'
    });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({
      error: 'Permission denied',
      code: 'PERMISSION_DENIED'
    });
  }

  // 删除评论（这会级联删除所有回复）
  await prisma.comment.delete({
    where: { id: parseInt(commentId) }
  });

  res.json({
    message: 'Comment deleted successfully'
  });
}));

export default router;