/**
 * 增强的安全服务
 * 提供全面的安全防护措施
 */

import crypto from 'crypto';
import { Request } from 'express';
import { prisma } from '../lib/prisma';
import { SecurityAuditLogger } from '../utils/securityAudit';

/**
 * 安全配置
 */
const SECURITY_CONFIG = {
  // 密码策略
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    HISTORY_COUNT: 5,
    MAX_AGE_DAYS: 90
  },
  
  // 登录策略
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
    CAPTCHA_THRESHOLD: 3,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24小时
  },
  
  // API限流
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_REQUESTS: 100,
    MAX_REQUESTS_PER_IP: 50,
    SKIP_SUCCESSFUL_REQUESTS: false
  },
  
  // 内容安全策略
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    STYLE_SRC: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    IMG_SRC: ["'self'", 'data:', 'https:'],
    FONT_SRC: ["'self'", 'https://fonts.gstatic.com'],
    CONNECT_SRC: ["'self'"],
    FRAME_SRC: ["'none'"],
    OBJECT_SRC: ["'none'"]
  }
};

/**
 * 增强的安全验证器
 */
export class EnhancedSecurityValidator {
  /**
   * 验证密码强度
   */
  static validatePassword(password: string): {
    valid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;
    
    // 长度检查
    if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
      issues.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters`);
    } else {
      score += 25;
    }
    
    // 大写字母
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    } else {
      score += 25;
    }
    
    // 小写字母
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    } else {
      score += 25;
    }
    
    // 数字
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    } else {
      score += 15;
    }
    
    // 特殊字符
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    } else {
      score += 10;
    }
    
    // 检查常见弱密码
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
      issues.push('Password is too common or weak');
      score = Math.max(0, score - 50);
    }
    
    return {
      valid: issues.length === 0,
      score: Math.min(100, score),
      issues
    };
  }
  
  /**
   * 验证邮箱安全性
   */
  static validateEmail(email: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // 基本格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push('Invalid email format');
    }
    
    // 检查一次性邮箱域名
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', '10minutemail.com',
      'guerrillamail.com', 'mailinator.com'
    ];
    
    const domain = email.split('@')[1];
    if (domain && disposableDomains.includes(domain)) {
      issues.push('Disposable email addresses are not allowed');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * 检测SQL注入
   */
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
      /(--|\||;|\/\*|\*\/)/g,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
      /('|")\s*OR\s*('|")\s*=\s*('|")/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * 检测XSS攻击
   */
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<embed[^>]*>/gi,
      /<object[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
}

/**
 * 登录尝试管理器
 */
export class LoginAttemptManager {
  private static attempts = new Map<string, {
    count: number;
    firstAttempt: number;
    lastAttempt: number;
    lockedUntil?: number;
  }>();
  
  /**
   * 记录登录尝试
   */
  static async recordAttempt(
    identifier: string,
    success: boolean,
    req: Request
  ): Promise<void> {
    const key = `${identifier}_${req.ip}`;
    const now = Date.now();
    
    if (success) {
      // 成功登录，清除记录
      this.attempts.delete(key);
      
      // 记录成功登录
      await SecurityAuditLogger.logFromRequest(
        req,
        'LOGIN_SUCCESS',
        'LOW',
        { identifier }
      );
    } else {
      // 失败登录
      let attempt = this.attempts.get(key) || {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      };
      
      attempt.count++;
      attempt.lastAttempt = now;
      
      // 检查是否需要锁定
      if (attempt.count >= SECURITY_CONFIG.LOGIN.MAX_ATTEMPTS) {
        attempt.lockedUntil = now + SECURITY_CONFIG.LOGIN.LOCKOUT_DURATION;
        
        // 记录账户锁定
        await SecurityAuditLogger.logFromRequest(
          req,
          'ACCOUNT_LOCKED',
          'HIGH',
          { identifier, attempts: attempt.count }
        );
      }
      
      this.attempts.set(key, attempt);
      
      // 记录失败登录
      await SecurityAuditLogger.logFromRequest(
        req,
        'LOGIN_FAILURE',
        attempt.count >= 3 ? 'MEDIUM' : 'LOW',
        { identifier, attempts: attempt.count }
      );
    }
  }
  
  /**
   * 检查是否被锁定
   */
  static isLocked(identifier: string, ip: string): {
    locked: boolean;
    remainingTime?: number;
    requireCaptcha: boolean;
  } {
    const key = `${identifier}_${ip}`;
    const attempt = this.attempts.get(key);
    
    if (!attempt) {
      return { locked: false, requireCaptcha: false };
    }
    
    const now = Date.now();
    
    // 检查锁定状态
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      return {
        locked: true,
        remainingTime: Math.ceil((attempt.lockedUntil - now) / 1000),
        requireCaptcha: true
      };
    }
    
    // 检查是否需要验证码
    const requireCaptcha = attempt.count >= SECURITY_CONFIG.LOGIN.CAPTCHA_THRESHOLD;
    
    return {
      locked: false,
      requireCaptcha
    };
  }
  
  /**
   * 清理过期记录
   */
  static cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [key, attempt] of this.attempts) {
      if (now - attempt.lastAttempt > maxAge) {
        this.attempts.delete(key);
      }
    }
  }
}

/**
 * 内容安全策略生成器
 */
export class ContentSecurityPolicy {
  /**
   * 生成CSP头
   */
  static generateHeader(): string {
    const directives: string[] = [];
    
    for (const [directive, sources] of Object.entries(SECURITY_CONFIG.CSP)) {
      const directiveName = directive.toLowerCase().replace(/_/g, '-');
      const sourceList = (sources as string[]).join(' ');
      directives.push(`${directiveName} ${sourceList}`);
    }
    
    // 添加额外的安全指令
    directives.push('upgrade-insecure-requests');
    directives.push('block-all-mixed-content');
    directives.push("frame-ancestors 'none'");
    
    return directives.join('; ');
  }
  
  /**
   * 生成nonce
   */
  static generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }
}

/**
 * API密钥管理器
 */
export class APIKeyManager {
  /**
   * 生成API密钥
   */
  static generateKey(): {
    key: string;
    hash: string;
  } {
    const key = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    return { key, hash };
  }
  
  /**
   * 验证API密钥
   */
  static async validateKey(key: string): Promise<{
    valid: boolean;
    userId?: number;
    permissions?: string[];
  }> {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    // 查找密钥
    const apiKey = await prisma.apiKey.findUnique({
      where: { hash },
      include: {
        user: true,
        permissions: true
      }
    });
    
    if (!apiKey || !apiKey.isActive) {
      return { valid: false };
    }
    
    // 检查过期时间
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false };
    }
    
    // 更新最后使用时间
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });
    
    return {
      valid: true,
      userId: apiKey.userId,
      permissions: apiKey.permissions.map(p => p.name)
    };
  }
}

/**
 * 数据加密服务
 */
export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'default-key',
    'salt',
    32
  );
  
  /**
   * 加密数据
   */
  static encrypt(text: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  /**
   * 解密数据
   */
  static decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * 哈希敏感数据
   */
  static hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + (process.env.HASH_SALT || 'salt'))
      .digest('hex');
  }
}

// 定期清理登录尝试记录
setInterval(() => {
  LoginAttemptManager.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次
