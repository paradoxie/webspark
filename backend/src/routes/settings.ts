import { Router, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取用户设置
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      emailNotifications: true,
      // 可以添加更多设置字段
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    data: {
      emailNotifications: user.emailNotifications,
    }
  });
}));

// 更新用户设置
router.put('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const schema = Joi.object({
    emailNotifications: Joi.boolean().optional(),
    // 可以添加更多设置字段
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: value,
    select: {
      emailNotifications: true,
    }
  });

  res.json({
    data: updatedUser,
    message: 'Settings updated successfully'
  });
}));

// 测试邮件发送
router.post('/test-email', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      name: true,
      username: true,
      email: true,
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  try {
    const { emailService } = await import('../services/emailService');
    
    await emailService.sendSystemNotification(
      user.email,
      user.name || user.username,
      '📧 邮件通知测试',
      '这是一封测试邮件，用于验证你的邮件通知设置是否正常工作。如果你收到了这封邮件，说明邮件通知功能已正常启用。',
      'https://webspark.club/settings',
      '管理通知设置'
    );

    res.json({
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      code: 'EMAIL_SEND_ERROR'
    });
  }
}));

export default router;