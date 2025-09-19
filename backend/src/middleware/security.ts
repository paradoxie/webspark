import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { SecurityValidator } from '../utils/security';
import { SecurityAuditLogger } from '../utils/securityAudit';

// CSRF Token验证
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // 对于安全敏感操作，验证CSRF Token
  const sensitiveRoutes = [
    '/api/websites',
    '/api/comments',
    '/api/users',
    '/api/upload',
    '/api/admin'
  ];
  
  const isSensitiveRoute = sensitiveRoutes.some(route => req.path.startsWith(route));
  const isModifyingOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  
  if (isSensitiveRoute && isModifyingOperation) {
    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionToken = req.session?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      // 记录CSRF攻击尝试
      SecurityAuditLogger.logFromRequest(
        req,
        'CSRF_ATTACK',
        'HIGH',
        {
          providedToken: csrfToken ? 'present' : 'missing',
          sessionToken: sessionToken ? 'present' : 'missing'
        }
      ).catch(console.error);

      return res.status(403).json({
        error: 'CSRF token validation failed',
        code: 'CSRF_ERROR'
      });
    }
  }
  
  next();
}

// 输入验证中间件
export function validateInput(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];
  
  // 验证请求体
  if (req.body) {
    try {
      const bodyString = JSON.stringify(req.body);
      
      // 检查请求体大小
      if (bodyString.length > 10 * 1024 * 1024) { // 10MB限制
        errors.push('请求体过大');
      }
      
      // 递归检查所有字符串字段
      const checkFields = (obj: any, path = ''): void => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            const checkResult = SecurityValidator.comprehensiveCheck(value, {
              maxLength: 10000,
              allowHtml: ['description', 'content', 'bio'].includes(key),
              checkSql: true,
              checkXss: true
            });
            
            if (!checkResult.valid) {
              errors.push(`字段 ${currentPath}: ${checkResult.errors.join(', ')}`);
              
              // 记录安全违规
              SecurityAuditLogger.logFromRequest(
                req,
                checkResult.errors.some(e => e.includes('XSS')) ? 'XSS_ATTEMPT' : 
                checkResult.errors.some(e => e.includes('SQL')) ? 'SQL_INJECTION' : 'INVALID_INPUT',
                'MEDIUM',
                {
                  field: currentPath,
                  value: value.substring(0, 100), // 只记录前100个字符
                  errors: checkResult.errors
                }
              ).catch(console.error);
            } else if (checkResult.cleaned) {
              // 使用清理后的值替换原值
              obj[key] = checkResult.cleaned;
            }
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkFields(value, currentPath);
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'string') {
                const checkResult = SecurityValidator.comprehensiveCheck(item, {
                  maxLength: 1000,
                  allowHtml: false,
                  checkSql: true,
                  checkXss: true
                });
                
                if (!checkResult.valid) {
                  errors.push(`字段 ${currentPath}[${index}]: ${checkResult.errors.join(', ')}`);
                } else if (checkResult.cleaned) {
                  value[index] = checkResult.cleaned;
                }
              } else if (typeof item === 'object' && item !== null) {
                checkFields(item, `${currentPath}[${index}]`);
              }
            });
          }
        }
      };
      
      checkFields(req.body);
    } catch (error) {
      errors.push('请求体格式无效');
    }
  }
  
  // 验证查询参数
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        const checkResult = SecurityValidator.comprehensiveCheck(value, {
          maxLength: 1000,
          allowHtml: false,
          checkSql: true,
          checkXss: true
        });
        
        if (!checkResult.valid) {
          errors.push(`查询参数 ${key}: ${checkResult.errors.join(', ')}`);
        } else if (checkResult.cleaned) {
          req.query[key] = checkResult.cleaned;
        }
      }
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Input validation failed',
      details: errors,
      code: 'INPUT_VALIDATION_ERROR'
    });
  }
  
  next();
}

// URL验证中间件
export function validateUrls(req: Request, res: Response, next: NextFunction) {
  const urlFields = ['url', 'sourceUrl', 'website', 'homepage'];
  const errors: string[] = [];
  
  const checkUrls = (obj: any, path = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      if (urlFields.includes(key) && typeof value === 'string' && value.trim()) {
        if (!SecurityValidator.validateUrl(value)) {
          errors.push(`无效的URL: ${path ? `${path}.${key}` : key}`);
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkUrls(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  if (req.body) {
    checkUrls(req.body);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'URL validation failed',
      details: errors,
      code: 'URL_VALIDATION_ERROR'
    });
  }
  
  next();
}

// 用户名和邮箱验证中间件
export function validateUserData(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];
  
  if (req.body.username) {
    const usernameCheck = SecurityValidator.validateUsername(req.body.username);
    if (!usernameCheck.valid) {
      errors.push(usernameCheck.error || '用户名验证失败');
    }
  }
  
  if (req.body.email) {
    if (!SecurityValidator.validateEmail(req.body.email)) {
      errors.push('邮箱格式无效');
    }
  }
  
  if (req.body.password) {
    const passwordCheck = SecurityValidator.validatePassword(req.body.password);
    if (!passwordCheck.valid) {
      errors.push(passwordCheck.error || '密码验证失败');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'User data validation failed',
      details: errors,
      code: 'USER_VALIDATION_ERROR'
    });
  }
  
  next();
}

// 文件上传安全验证
export function validateFileUpload(allowedTypes: string[], maxSize: number = 5 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const errors: string[] = [];
    
    files.forEach((file: any, index: number) => {
      if (!file) return;
      
      // 检查文件大小
      if (file.size > maxSize) {
        errors.push(`文件 ${index + 1} 大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`);
      }
      
      // 检查文件类型
      const filename = file.originalname || file.name;
      if (!SecurityValidator.validateFileType(filename, allowedTypes)) {
        errors.push(`文件 ${index + 1} 类型不被允许 (${filename})`);
      }
      
      // 清理文件名
      if (filename) {
        const cleanFilename = SecurityValidator.sanitizeFilename(filename);
        if (file.originalname) file.originalname = cleanFilename;
        if (file.name) file.name = cleanFilename;
      }
      
      // 检查MIME类型
      if (file.mimetype) {
        const validMimeTypes = {
          'jpg': ['image/jpeg'],
          'jpeg': ['image/jpeg'],
          'png': ['image/png'],
          'gif': ['image/gif'],
          'webp': ['image/webp'],
          'svg': ['image/svg+xml'],
          'pdf': ['application/pdf'],
          'doc': ['application/msword'],
          'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          'txt': ['text/plain']
        };
        
        const extension = filename.toLowerCase().split('.').pop();
        const expectedMimeTypes = extension ? validMimeTypes[extension as keyof typeof validMimeTypes] : [];
        
        if (expectedMimeTypes && !expectedMimeTypes.includes(file.mimetype)) {
          errors.push(`文件 ${index + 1} MIME类型与扩展名不匹配`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'File validation failed',
        details: errors,
        code: 'FILE_VALIDATION_ERROR'
      });
    }
    
    next();
  };
}

// 增强的安全头设置
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "https:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  });
}

// IP过滤中间件
export function ipFilter(allowedIPs: string[] = [], blockedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (blockedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_BLOCKED'
      });
    }
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
}

// API密钥验证中间件
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/internal')) {
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      // 记录API密钥验证失败
      SecurityAuditLogger.logFromRequest(
        req,
        'AUTH_FAILURE',
        'HIGH',
        {
          reason: 'Invalid API key',
          hasApiKey: !!apiKey
        }
      ).catch(console.error);

      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }
  }
  
  next();
}