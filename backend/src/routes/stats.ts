import express, { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../db';

const router = express.Router();

// 获取公共统计数据
router.get('/public', asyncHandler(async (req: Request, res: Response) => {
  const [totalUsers, totalWebsites, totalCategories] = await Promise.all([
    prisma.user.count({
      where: {
        isActive: true
      }
    }),
    prisma.website.count({
      where: {
        status: 'APPROVED',
        deletedAt: null
      }
    }),
    prisma.category.count({
      where: {
        isActive: true
      }
    })
  ]);

  res.json({
    data: {
      totalUsers,
      totalWebsites,
      totalCategories
    }
  });
}));

export default router;