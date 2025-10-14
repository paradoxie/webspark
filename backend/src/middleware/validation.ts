import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../utils/monitoring';

// 通用验证中间件
export function validate(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', {
        path: req.path,
        errors,
        body: req.body
      });

      return res.status(422).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // 清理HTML内容
    req.body = sanitizeObject(value);
    next();
  };
}

// 递归清理对象中的HTML
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { 
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// 验证规则
export const schemas = {
  // 网站提交
  websiteCreate: Joi.object({
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required()
      .messages({
        'string.uri': '请输入有效的网址',
        'any.required': '网址不能为空'
      }),
    title: Joi.string().min(5).max(50).required()
      .messages({
        'string.min': '标题至少需要5个字符',
        'string.max': '标题不能超过50个字符',
        'any.required': '标题不能为空'
      }),
    shortDescription: Joi.string().min(20).max(160).required()
      .messages({
        'string.min': '简短描述至少需要20个字符',
        'string.max': '简短描述不能超过160个字符',
        'any.required': '简短描述不能为空'
      }),
    description: Joi.string().min(100).max(5000).required()
      .messages({
        'string.min': '详细描述至少需要100个字符',
        'string.max': '详细描述不能超过5000个字符',
        'any.required': '详细描述不能为空'
      }),
    tags: Joi.array().items(Joi.string().max(20)).min(1).max(5).required()
      .messages({
        'array.min': '至少选择1个标签',
        'array.max': '最多选择5个标签',
        'any.required': '标签不能为空'
      }),
    sourceUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow('').optional(),
    screenshots: Joi.array().items(
      Joi.string().uri({ scheme: ['http', 'https'] })
    ).max(5).optional(),
    categoryId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': '请选择有效的分类',
        'any.required': '分类不能为空'
      }),
    isHiring: Joi.boolean().optional()
  }),

  // 网站更新
  websiteUpdate: Joi.object({
    title: Joi.string().min(5).max(50).optional(),
    shortDescription: Joi.string().min(20).max(160).optional(),
    description: Joi.string().min(100).max(5000).optional(),
    tags: Joi.array().items(Joi.string().max(20)).min(1).max(5).optional(),
    sourceUrl: Joi.string().uri({ scheme: ['http', 'https'] }).allow('').optional(),
    screenshots: Joi.array().items(
      Joi.string().uri({ scheme: ['http', 'https'] })
    ).max(5).optional(),
    categoryId: Joi.number().integer().positive().optional(),
    isHiring: Joi.boolean().optional()
  }).min(1), // 至少需要一个字段

  // 评论
  commentCreate: Joi.object({
    content: Joi.string().min(10).max(1000).required()
      .messages({
        'string.min': '评论至少需要10个字符',
        'string.max': '评论不能超过1000个字符',
        'any.required': '评论内容不能为空'
      }),
    parentId: Joi.number().integer().positive().optional()
  }),

  // 举报
  reportCreate: Joi.object({
    reason: Joi.string().valid('SPAM', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_INFRINGEMENT', 'BROKEN_LINK', 'OTHER').required()
      .messages({
        'any.only': '请选择有效的举报原因',
        'any.required': '举报原因不能为空'
      }),
    details: Joi.string().max(500).when('reason', {
      is: 'OTHER',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'any.required': '请说明具体原因'
    })
  }),

  // 用户资料更新
  userUpdate: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(300).allow('').optional(),
    website: Joi.string().uri({ scheme: ['http', 'https'] }).allow('').optional(),
    location: Joi.string().max(100).allow('').optional(),
    isHiring: Joi.boolean().optional()
  }).min(1),

  // 搜索参数
  searchParams: Joi.object({
    q: Joi.string().max(100).optional(),
    category: Joi.string().optional(),
    tags: Joi.string().optional(),
    author: Joi.string().optional(),
    dateRange: Joi.string().valid('all', '24h', '7d', '30d', '90d').optional(),
    sortBy: Joi.string().valid('newest', 'popular', 'featured').optional(),
    featured: Joi.boolean().optional(),
    hasSource: Joi.boolean().optional(),
    isHiring: Joi.boolean().optional(),
    minLikes: Joi.number().integer().min(0).optional(),
    minViews: Joi.number().integer().min(0).optional(),
    page: Joi.number().integer().positive().optional(),
    pageSize: Joi.number().integer().min(1).max(50).optional()
  })
};

// SQL注入防护
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const dangerousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\/\*|\*\/|;|'|")/g
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkValue(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => checkObject(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).some(value => checkObject(value));
    }
    
    return false;
  };

  // 检查请求参数
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    logger.error('Potential SQL injection attempt', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    });

    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }

  next();
}

// 文件上传验证
export function validateFileUpload(allowedTypes: string[], maxSize: number = 5 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      // 检查文件类型
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: '不支持的文件类型',
          code: 'INVALID_FILE_TYPE',
          allowedTypes
        });
      }

      // 检查文件大小
      if (file.size > maxSize) {
        return res.status(400).json({
          error: '文件大小超过限制',
          code: 'FILE_TOO_LARGE',
          maxSize: `${maxSize / 1024 / 1024}MB`
        });
      }

      // 检查文件名
      const safeFilename = /^[\w\-. ]+$/;
      if (!safeFilename.test(file.originalname)) {
        return res.status(400).json({
          error: '文件名包含非法字符',
          code: 'INVALID_FILENAME'
        });
      }
    }

    next();
  };
}
