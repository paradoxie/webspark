import { Router, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const createReportSchema = Joi.object({
  websiteId: Joi.number().required(),
  reason: Joi.string().valid('SPAM', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_INFRINGEMENT', 'BROKEN_LINK', 'OTHER').required(),
  details: Joi.string().max(500).optional()
});

// 提交举报
router.post('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error, value } = createReportSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { websiteId, reason, details } = value;

  // 检查网站是否存在
  const website = await prisma.website.findUnique({
    where: { 
      id: websiteId,
      deletedAt: null 
    }
  });

  if (!website) {
    return res.status(404).json({ 
      error: 'Website not found',
      code: 'WEBSITE_NOT_FOUND'
    });
  }

  const report = await prisma.report.create({
    data: {
      websiteId,
      reason,
      details,
      reporterId: req.user?.id || null
    }
  });

  res.status(201).json({ 
    data: report,
    message: 'Report submitted successfully. Thank you for your feedback.'
  });
}));

export default router; 