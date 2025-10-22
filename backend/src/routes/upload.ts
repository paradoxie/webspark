import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { r2Storage } from '../services/r2Storage';

const router = Router();

// 配置multer存储（内存存储）
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 配置multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
});

// 上传头像
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  try {
    const filename = r2Storage.generateFileName(req.file.originalname).replace(/\.[^/.]+$/, '.jpg');
    const imageUrl = await r2Storage.uploadImage(req.file.buffer, filename, 'avatar');

    // 更新用户头像
    const { prisma } = await import('../db');

    // 删除旧头像（如果存在且是R2存储的）
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { avatar: true }
    });

    if (user?.avatar) {
      const oldKey = r2Storage.extractKeyFromUrl(user.avatar);
      if (oldKey) {
        try {
          await r2Storage.deleteImage(oldKey);
        } catch (error) {
          console.warn('Failed to delete old avatar:', error);
        }
      }
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: imageUrl }
    });

    res.json({
      message: 'Avatar uploaded successfully',
      data: {
        url: imageUrl,
        filename
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      error: 'Failed to process avatar',
      code: 'PROCESSING_ERROR'
    });
  }
}));

// 上传作品截图
router.post('/screenshot', authenticate, upload.single('screenshot'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  try {
    const filename = r2Storage.generateFileName(req.file.originalname).replace(/\.[^/.]+$/, '.jpg');
    const imageUrl = await r2Storage.uploadImage(req.file.buffer, filename, 'screenshot');

    res.json({
      message: 'Screenshot uploaded successfully',
      data: {
        url: imageUrl,
        filename
      }
    });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({
      error: 'Failed to process screenshot',
      code: 'PROCESSING_ERROR'
    });
  }
}));

// 批量上传（多张截图）
router.post('/screenshots', authenticate, upload.array('screenshots', 5), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({
      error: 'No files uploaded',
      code: 'NO_FILES'
    });
  }

  try {
    const uploadPromises = files.map(async (file) => {
      const filename = r2Storage.generateFileName(file.originalname).replace(/\.[^/.]+$/, '.jpg');
      const imageUrl = await r2Storage.uploadImage(file.buffer, filename, 'screenshot');
      return {
        originalName: file.originalname,
        url: imageUrl,
        filename
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      message: `${results.length} screenshots uploaded successfully`,
      data: results
    });
  } catch (error) {
    console.error('Screenshots upload error:', error);
    res.status(500).json({
      error: 'Failed to process screenshots',
      code: 'PROCESSING_ERROR'
    });
  }
}));

// 删除上传的文件
router.delete('/:type/:filename', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, filename } = req.params;

  if (!['avatars', 'screenshots'].includes(type)) {
    res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_TYPE'
    });
  }

  const key = `${type}/${filename}`;

  try {
    await r2Storage.deleteImage(key);

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      code: 'DELETION_ERROR'
    });
  }
}));

// 获取文件信息
router.get('/info/:type/:filename', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, filename } = req.params;

  if (!['avatars', 'screenshots'].includes(type)) {
    res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_TYPE'
    });
  }

  const key = `${type}/${filename}`;

  try {
    const metadata = await r2Storage.getImageMetadata(key);

    res.json({
      data: {
        filename,
        ...metadata
      }
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(404).json({
      error: 'File not found',
      code: 'FILE_NOT_FOUND'
    });
  }
}));

export default router;
