import express, { Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../db';
import Joi from 'joi';

const router = express.Router();

// 获取当前用户信息
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      github: true,
      location: true,
      isHiring: true,
      createdAt: true,
      _count: {
        select: {
          likedSites: true,
          bookmarks: true,
          websites: {
            where: {
              status: 'APPROVED',
              deletedAt: null
            }
          },
          followers: true,
          following: true
        }
      }
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

// 获取用户收藏的作品
router.get('/me/bookmarks', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const skip = (page - 1) * pageSize;
  
  const [bookmarks, total] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        bookmarks: {
          where: {
            status: 'APPROVED',
            deletedAt: null
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true
              }
            },
            likedBy: {
              where: { id: userId },
              select: { id: true }
            },
            bookmarkedBy: {
              where: { id: userId },
              select: { id: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            bookmarks: {
              where: {
                status: 'APPROVED',
                deletedAt: null
              }
            }
          }
        }
      }
    })
  ]);

  if (!bookmarks || !total) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }
  
  const websitesWithUserData = bookmarks.bookmarks.map((website: any) => ({
    ...website,
    isLiked: website.likedBy && website.likedBy.length > 0,
    isBookmarked: true // 这是收藏列表，所以默认为true
  }));

  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total._count.bookmarks / pageSize),
        total: total._count.bookmarks
      }
    }
  });
}));

// 获取用户点赞的作品
router.get('/me/likes', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const skip = (page - 1) * pageSize;
  
  const [likes, total] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        likedSites: {
          where: {
            status: 'APPROVED',
            deletedAt: null
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true
              }
            },
            likedBy: {
              where: { id: userId },
              select: { id: true }
            },
            bookmarkedBy: {
              where: { id: userId },
              select: { id: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            likedSites: {
              where: {
                status: 'APPROVED',
                deletedAt: null
              }
            }
          }
        }
      }
    })
  ]);

  if (!likes || !total) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }
  
  const websitesWithUserData = likes.likedSites.map((website: any) => ({
    ...website,
    isLiked: true, // 这是点赞列表，所以默认为true
    isBookmarked: website.bookmarkedBy && website.bookmarkedBy.length > 0
  }));

  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total._count.likedSites / pageSize),
        total: total._count.likedSites
      }
    }
  });
}));

// 获取用户提交的作品
router.get('/me/websites', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const skip = (page - 1) * pageSize;
  const status = req.query.status as string || 'all';
  
  // 构建查询条件
  const where: any = {
    authorId: userId,
    deletedAt: null
  };
  
  // 如果指定了状态筛选
  if (status !== 'all') {
    where.status = status.toUpperCase();
  }
  
  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        likedBy: {
          where: { id: userId },
          select: { id: true }
        },
        bookmarkedBy: {
          where: { id: userId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.website.count({ where })
  ]);
  
  const websitesWithUserData = websites.map((website: any) => ({
    ...website,
    isLiked: website.likedBy && website.likedBy.length > 0,
    isBookmarked: website.bookmarkedBy && website.bookmarkedBy.length > 0
  }));
  
  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
      }
    }
  });
}));

// 获取特定用户信息及其作品
router.get('/:username', asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const skip = (page - 1) * pageSize;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      github: true,
      location: true,
      isHiring: true,
      createdAt: true,
      _count: {
        select: {
          websites: {
            where: {
              status: 'APPROVED',
              deletedAt: null
            }
          },
          followers: true,
          following: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // 获取用户已审核通过的作品
  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where: {
        authorId: user.id,
        status: 'APPROVED',
        deletedAt: null
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.website.count({
      where: {
        authorId: user.id,
        status: 'APPROVED',
        deletedAt: null
      }
    })
  ]);

  // 添加用户交互信息（如果访客已登录）
  const userId = (req as AuthenticatedRequest).user?.id;
  let websitesWithUserData = websites;
  
  if (userId) {
    websitesWithUserData = await Promise.all(
      websites.map(async (website: any) => {
        const [likeRecord, bookmarkRecord] = await Promise.all([
          prisma.user.findFirst({
            where: {
              id: userId,
              likedSites: {
                some: {
                  id: website.id
                }
              }
            }
          }),
          prisma.user.findFirst({
            where: {
              id: userId,
              bookmarks: {
                some: {
                  id: website.id
                }
              }
            }
          })
        ]);
        
        return {
          ...website,
          isLiked: !!likeRecord,
          isBookmarked: !!bookmarkRecord
        };
      })
    );
  }

  res.json({
    data: {
      user,
      websites: websitesWithUserData,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total
        }
      }
    }
  });
}));

// 更新用户个人信息
router.put('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(300).allow('').optional(),
    website: Joi.string().uri().allow('').optional(),
    location: Joi.string().max(100).allow('').optional(),
    isHiring: Joi.boolean().optional()
  });
  
  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: value,
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      website: true,
      github: true,
      location: true,
      isHiring: true
    }
  });
  
  res.json({
    data: updatedUser,
    message: '个人信息更新成功'
  });
}));

// 关注用户
router.post('/:userId/follow', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const followerId = req.user!.id;
  const targetUserId = parseInt(userId);

  if (followerId === targetUserId) {
    return res.status(400).json({
      error: '不能关注自己',
      code: 'CANNOT_FOLLOW_SELF'
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  });

  if (!targetUser) {
    return res.status(404).json({
      error: '用户不存在',
      code: 'USER_NOT_FOUND'
    });
  }

  const existingFollow = await prisma.user.findFirst({
    where: {
      id: followerId,
      following: {
        some: { id: targetUserId }
      }
    }
  });

  if (existingFollow) {
    return res.status(400).json({
      error: '已经关注该用户',
      code: 'ALREADY_FOLLOWING'
    });
  }

  // 创建关注关系
  await prisma.user.update({
    where: { id: followerId },
    data: {
      following: {
        connect: { id: targetUserId }
      }
    }
  });

  // 创建通知
  await prisma.notification.create({
    data: {
      type: 'USER_FOLLOWED',
      title: '新的关注者',
      message: `${req.user!.username} 开始关注你了`,
      userId: targetUserId
    }
  });

  res.json({
    data: { success: true },
    message: '关注成功'
  });
}));

// 取消关注用户
router.delete('/:userId/follow', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const followerId = req.user!.id;
  const targetUserId = parseInt(userId);

  if (followerId === targetUserId) {
    return res.status(400).json({
      error: '不能取消关注自己',
      code: 'CANNOT_UNFOLLOW_SELF'
    });
  }

  const existingFollow = await prisma.user.findFirst({
    where: {
      id: followerId,
      following: {
        some: { id: targetUserId }
      }
    }
  });

  if (!existingFollow) {
    return res.status(400).json({
      error: '还未关注该用户',
      code: 'NOT_FOLLOWING'
    });
  }

  // 删除关注关系
  await prisma.user.update({
    where: { id: followerId },
    data: {
      following: {
        disconnect: { id: targetUserId }
      }
    }
  });

  res.json({
    data: { success: true },
    message: '取消关注成功'
  });
}));

// 获取用户关注列表
router.get('/:userId/following', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
  const skip = (page - 1) * pageSize;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              websites: {
                where: {
                  status: 'APPROVED',
                  deletedAt: null
                }
              },
              followers: true
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          username: 'asc'
        }
      },
      _count: {
        select: {
          following: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: '用户不存在',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    data: {
      following: user.following,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(user._count.following / pageSize),
          total: user._count.following
        }
      }
    }
  });
}));

// 获取用户粉丝列表
router.get('/:userId/followers', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
  const skip = (page - 1) * pageSize;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      followers: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              websites: {
                where: {
                  status: 'APPROVED',
                  deletedAt: null
                }
              },
              followers: true
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: {
          username: 'asc'
        }
      },
      _count: {
        select: {
          followers: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: '用户不存在',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    data: {
      followers: user.followers,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(user._count.followers / pageSize),
          total: user._count.followers
        }
      }
    }
  });
}));

// 检查关注状态
router.get('/:userId/follow-status', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;
  const targetUserId = parseInt(userId);

  if (currentUserId === targetUserId) {
    return res.json({
      data: {
        isFollowing: false,
        isSelf: true
      }
    });
  }

  const followRelation = await prisma.user.findFirst({
    where: {
      id: currentUserId,
      following: {
        some: { id: targetUserId }
      }
    }
  });

  res.json({
    data: {
      isFollowing: !!followRelation,
      isSelf: false
    }
  });
}));

// 获取关注用户的最新作品动态
router.get('/me/following-feed', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);
  const skip = (page - 1) * pageSize;

  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        author: {
          followers: {
            some: { id: userId }
          }
        }
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
        likedBy: {
          where: { id: userId },
          select: { id: true }
        },
        bookmarkedBy: {
          where: { id: userId },
          select: { id: true }
        },
        _count: {
          select: {
            comments: true,
            likedBy: true
          }
        }
      },
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.website.count({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        author: {
          followers: {
            some: { id: userId }
          }
        }
      }
    })
  ]);

  const websitesWithUserData = websites.map((website: any) => ({
    ...website,
    isLiked: website.likedBy && website.likedBy.length > 0,
    isBookmarked: website.bookmarkedBy && website.bookmarkedBy.length > 0
  }));

  res.json({
    data: websitesWithUserData,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
      }
    }
  });
}));

export default router; 