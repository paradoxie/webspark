import { Router, Response, Request } from 'express';
import { prisma } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// 获取用户搜索历史
router.get('/history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const searches = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      query: true,
      createdAt: true,
      results: true
    }
  });

  res.json({
    data: searches
  });
}));

// 保存搜索历史
router.post('/history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { query, resultCount = 0 } = req.body;

  if (!query || query.trim().length < 2) {
    res.status(400).json({
      error: 'Search query is required and must be at least 2 characters',
      code: 'INVALID_QUERY'
    });
    return;
  }

  // 检查是否已存在相同的搜索（最近24小时内）
  const existingSearch = await prisma.searchHistory.findFirst({
    where: {
      userId,
      query: query.trim(),
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
      }
    }
  });

  if (existingSearch) {
    // 更新搜索时间和结果数
    const updated = await prisma.searchHistory.update({
      where: { id: existingSearch.id },
      data: {
        results: resultCount
      }
    });

    res.json({
      data: updated,
      message: 'Search history updated'
    });
    return;
  }

  // 创建新的搜索历史
  const searchHistory = await prisma.searchHistory.create({
    data: {
      userId,
      query: query.trim(),
      results: resultCount
    }
  });

  // 限制每个用户最多保存100条搜索历史
  const count = await prisma.searchHistory.count({
    where: { userId }
  });

  if (count > 100) {
    // 删除最旧的记录
    const oldestRecords = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: count - 100,
      select: { id: true }
    });

    await prisma.searchHistory.deleteMany({
      where: {
        id: {
          in: oldestRecords.map(r => r.id)
        }
      }
    });
  }

  res.json({
    data: searchHistory,
    message: 'Search saved to history'
  });
}));

// 删除单条搜索历史
router.delete('/history/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const historyId = parseInt(req.params.id);

  if (isNaN(historyId)) {
    res.status(400).json({
      error: 'Invalid history ID',
      code: 'INVALID_ID'
    });
    return;
  }

  const history = await prisma.searchHistory.findFirst({
    where: {
      id: historyId,
      userId
    }
  });

  if (!history) {
    res.status(404).json({
      error: 'Search history not found',
      code: 'NOT_FOUND'
    });
    return;
  }

  await prisma.searchHistory.delete({
    where: { id: historyId }
  });

  res.json({
    message: 'Search history deleted successfully'
  });
}));

// 清空所有搜索历史
router.delete('/history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const result = await prisma.searchHistory.deleteMany({
    where: { userId }
  });

  res.json({
    message: `Cleared ${result.count} search history items`
  });
}));

// 获取热门搜索
router.get('/trending', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const hours = parseInt(req.query.hours as string) || 24; // 默认24小时内

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // 聚合查询获取热门搜索词
  const trending = await prisma.searchHistory.groupBy({
    by: ['query'],
    where: {
      createdAt: {
        gte: since
      }
    },
    _count: {
      query: true
    },
    orderBy: {
      _count: {
        query: 'desc'
      }
    },
    take: limit
  });

  const formattedTrending = trending.map(item => ({
    query: item.query,
    count: item._count.query
  }));

  res.json({
    data: formattedTrending,
    meta: {
      hours,
      since
    }
  });
}));

export default router;
