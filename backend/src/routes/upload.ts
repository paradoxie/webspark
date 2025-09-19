import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const screenshotDir = path.join(uploadDir, 'screenshots');

[uploadDir, avatarDir, screenshotDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置multer存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // 检查文件类型
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

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}-${timestamp}-${random}${ext}`;
};

// 处理图片（压缩和调整大小）
const processImage = async (
  buffer: Buffer,
  type: 'avatar' | 'screenshot',
  filename: string
): Promise<string> => {
  let processedBuffer: Buffer;

  if (type === 'avatar') {
    // 头像：正方形，200x200
    processedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } else {
    // 截图：保持比例，最大宽度1200px
    processedBuffer = await sharp(buffer)
      .resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  const outputPath = path.join(
    type === 'avatar' ? avatarDir : screenshotDir,
    filename
  );

  await fs.promises.writeFile(outputPath, processedBuffer);
  
  // 返回相对URL路径
  return `/uploads/${type === 'avatar' ? 'avatars' : 'screenshots'}/${filename}`;
};

// 上传头像
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  try {
    const filename = generateFileName(req.file.originalname).replace(/\.[^/.]+$/, '.jpg');
    const imagePath = await processImage(req.file.buffer, 'avatar', filename);

    // 更新用户头像
    const { prisma } = await import('../db');
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: imagePath }
    });

    res.json({
      message: 'Avatar uploaded successfully',
      data: {
        url: imagePath,
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
router.post('/screenshot', authenticate, upload.single('screenshot'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  try {
    const filename = generateFileName(req.file.originalname).replace(/\.[^/.]+$/, '.jpg');
    const imagePath = await processImage(req.file.buffer, 'screenshot', filename);

    res.json({
      message: 'Screenshot uploaded successfully',
      data: {
        url: imagePath,
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
router.post('/screenshots', authenticate, upload.array('screenshots', 5), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      error: 'No files uploaded',
      code: 'NO_FILES'
    });
  }

  try {
    const uploadPromises = files.map(async (file) => {
      const filename = generateFileName(file.originalname).replace(/\.[^/.]+$/, '.jpg');
      const imagePath = await processImage(file.buffer, 'screenshot', filename);
      return {
        originalName: file.originalname,
        url: imagePath,
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
router.delete('/:type/:filename', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type, filename } = req.params;
  
  if (!['avatars', 'screenshots'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_TYPE'
    });
  }

  const filePath = path.join(uploadDir, type, filename);

  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      code: 'DELETION_ERROR'
    });
  }
}));

// 获取文件信息
router.get('/info/:type/:filename', asyncHandler(async (req: Request, res: Response) => {
  const { type, filename } = req.params;
  
  if (!['avatars', 'screenshots'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_TYPE'
    });
  }

  const filePath = path.join(uploadDir, type, filename);

  try {
    const stats = await fs.promises.stat(filePath);
    const metadata = await sharp(filePath).metadata();

    res.json({
      data: {
        filename,
        size: stats.size,
        uploadTime: stats.birthtime,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        format: metadata.format
      }
    });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    console.error('File info error:', error);
    res.status(500).json({
      error: 'Failed to get file info',
      code: 'INFO_ERROR'
    });
  }
}));

export default router;