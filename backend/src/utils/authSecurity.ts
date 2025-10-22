import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import crypto from 'crypto';

// Token黑名单管理
class TokenBlacklist {
  private blacklist: Set<string> = new Set();
  private expiryMap: Map<string, number> = new Map();

  add(token: string, expiresAt: number) {
    this.blacklist.add(token);
    this.expiryMap.set(token, expiresAt);
    
    // 定期清理过期的token
    setTimeout(() => {
      this.blacklist.delete(token);
      this.expiryMap.delete(token);
    }, (expiresAt - Date.now()) + 1000);
  }

  has(token: string): boolean {
    const expiry = this.expiryMap.get(token);
    if (expiry && expiry < Date.now()) {
      this.blacklist.delete(token);
      this.expiryMap.delete(token);
      return false;
    }
    return this.blacklist.has(token);
  }

  clear() {
    this.blacklist.clear();
    this.expiryMap.clear();
  }
}

export const tokenBlacklist = new TokenBlacklist();

// 登录尝试限制
interface LoginAttempt {
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// 认证安全配置
export const authConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7天
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30天
  passwordMinLength: 8,
  passwordMaxLength: 128,
  sessionTimeout: 30 * 60 * 1000, // 30分钟
  requireStrongPassword: true
};

// 密码强度验证
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < authConfig.passwordMinLength) {
    errors.push(`密码至少需要${authConfig.passwordMinLength}个字符`);
  }

  if (password.length > authConfig.passwordMaxLength) {
    errors.push(`密码不能超过${authConfig.passwordMaxLength}个字符`);
  }

  if (authConfig.requireStrongPassword) {
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }
  }

  // 检查常见弱密码
  const weakPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('密码过于简单，请使用更复杂的密码');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 记录登录尝试
export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  req: Request
): Promise<boolean> {
  const key = `login_${identifier}_${req.ip}`;
  const attempt = loginAttempts.get(key) || {
    attempts: 0,
    lastAttempt: new Date()
  };

  // Check if currently blocked
  if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
    console.log('Login blocked for user:', identifier, 'until:', attempt.blockedUntil);
    return false;
  }

  if (success) {
    // Successful login, clear record
    loginAttempts.delete(key);
    console.log('Successful login for:', identifier);
    return true;
  } else {
    // Failed login, increment counter
    attempt.attempts++;
    attempt.lastAttempt = new Date();

    if (attempt.attempts >= authConfig.maxLoginAttempts) {
      // Lock account
      attempt.blockedUntil = new Date(Date.now() + authConfig.lockoutDuration);
      console.log('Account locked for:', identifier, 'attempts:', attempt.attempts);
    } else {
      console.log('Login failed for:', identifier, 'attempts:', attempt.attempts);
    }

    loginAttempts.set(key, attempt);
    return false;
  }
}

// 生成安全的Token
export function generateSecureToken(payload: any, secret: string): string {
  const jwtPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + authConfig.tokenExpiry) / 1000),
    jti: crypto.randomBytes(16).toString('hex') // unique identifier
  };

  return jwt.sign(jwtPayload, secret, {
    algorithm: 'HS256'
  });
}

// 验证Token
export async function verifySecureToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    // Check blacklist
    if (tokenBlacklist.has(token)) {
      return { valid: false, error: 'Token has been revoked' };
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as any;

    // Check if token has expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload: decoded };
  } catch (error) {
    console.warn('Token verification failed:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token'
    };
  }
}

// 会话管理
export class SessionManager {
  private static sessions = new Map<string, {
    userId: number;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
  }>();

  static createSession(sessionId: string, userId: number, req: Request) {
    this.sessions.set(sessionId, {
      userId,
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  }

  static updateActivity(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  static isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    
    if (now - lastActivity > authConfig.sessionTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }

    return true;
  }

  static destroySession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  static destroyUserSessions(userId: number) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  static cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > authConfig.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// 定期清理过期会话
setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 双因素认证支持
export class TwoFactorAuth {
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(8).toString('hex'));
    }
    return codes;
  }

  static async verifyCode(secret: string, code: string): Promise<boolean> {
    // Here should use actual TOTP verification library
    // Simplified example
    return true;
  }
}

// 设备信任管理
export class DeviceTrustManager {
  static async trustDevice(userId: number, req: Request): Promise<string> {
    const deviceId = crypto.randomBytes(32).toString('hex');
    const deviceFingerprint = this.generateDeviceFingerprint(req);

    await prisma.trustedDevice.create({
      data: {
        userId,
        deviceHash: deviceFingerprint,
        name: req.headers['user-agent']?.substring(0, 100) || 'Unknown Device',
        lastUsedAt: new Date()
      }
    });

    return deviceId;
  }

  static async isDeviceTrusted(userId: number, deviceId: string, req: Request): Promise<boolean> {
    const deviceFingerprint = this.generateDeviceFingerprint(req);

    const device = await prisma.trustedDevice.findFirst({
      where: {
        userId,
        deviceHash: deviceFingerprint
      }
    });

    if (!device) return false;

    // Update last used time
    await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() }
    });

    return true;
  }

  private static generateDeviceFingerprint(req: Request): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.ip || ''
    ];

    return crypto.createHash('sha256').update(components.join('|')).digest('hex');
  }
}
