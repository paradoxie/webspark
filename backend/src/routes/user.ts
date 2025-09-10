import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取当前用户的网站列表
router.get('/websites', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // 获取用户的网站
  const websites = await prisma.website.findMany({
    where: {
      authorId: userId,
      deletedAt: null
    },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 计算统计数据
  const stats = {
    total: websites.length,
    approved: websites.filter(w => w.status === 'APPROVED').length,
    pending: websites.filter(w => w.status === 'PENDING').length,
    rejected: websites.filter(w => w.status === 'REJECTED').length,
    totalLikes: websites.reduce((sum, w) => sum + w.likeCount, 0),
    totalViews: websites.reduce((sum, w) => sum + w.viewCount, 0)
  };

  res.json({
    data: websites,
    meta: { stats }
  });
}));

// 获取用户收藏的网站
router.get('/bookmarks', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const bookmarkedWebsites = await prisma.website.findMany({
    where: {
      bookmarkedBy: {
        some: {
          id: userId
        }
      },
      deletedAt: null,
      status: 'APPROVED'
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    data: bookmarkedWebsites
  });
}));

// 获取用户个人信息
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({ data: user });
}));

// 更新用户个人信息
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, bio, website, location } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      bio,
      website,
      location
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true
    }
  });

  res.json({ 
    data: updatedUser,
    message: 'Profile updated successfully'
  });
}));

// 获取公开的用户个人资料（按用户名）
router.get('/profile/:username', asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // 获取用户的公开作品
  const websites = await prisma.website.findMany({
    where: {
      authorId: user.id,
      status: 'APPROVED',
      deletedAt: null
    },
    select: {
      id: true,
      title: true,
      slug: true,
      url: true,
      shortDescription: true,
      likeCount: true,
      viewCount: true,
      createdAt: true,
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 计算统计数据
  const stats = {
    totalWebsites: websites.length,
    totalLikes: websites.reduce((sum, w) => sum + w.likeCount, 0),
    totalViews: websites.reduce((sum, w) => sum + w.viewCount, 0)
  };

  res.json({
    data: {
      user,
      websites,
      stats
    }
  });
}));

export default router; 