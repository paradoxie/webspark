import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取所有标签
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tags = await prisma.tag.findMany({
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
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({ 
    data: tags.map(tag => ({
      ...tag,
      websiteCount: tag._count.websites
    }))
  });
}));

// 按slug获取单个标签
router.get('/:slug', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  
  const tag = await prisma.tag.findUnique({
    where: { slug },
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
      }
    }
  });

  if (!tag) {
    return res.status(404).json({
      error: 'Tag not found',
      code: 'TAG_NOT_FOUND'
    });
  }

  res.json({ 
    data: {
      ...tag,
      websiteCount: tag._count.websites
    }
  });
}));

export default router; 