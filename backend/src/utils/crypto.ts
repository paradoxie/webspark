import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class CryptoUtils {
  
  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 密码哈希
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成安全的Token
   */
  static generateSecureToken(payload: object, expiresIn: string = '24h'): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.sign(payload, secret, { 
      expiresIn: expiresIn
    } as jwt.SignOptions);
  }

  /**
   * 验证Token
   */
  static verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return { valid: false, error: 'JWT_SECRET not configured' };
    }

    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'webspark.club',
        audience: 'webspark.club'
      });
      return { valid: true, payload };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      } else {
        return { valid: false, error: 'Token verification failed' };
      }
    }
  }

  /**
   * 生成CSRF Token
   */
  static generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * AES加密
   */
  static encrypt(text: string, key?: string): { encrypted: string; iv: string } {
    const secretKey = key || process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, secretKey);
    cipher.setAAD(Buffer.from('webspark.club', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * AES解密
   */
  static decrypt(encryptedData: string, iv: string, key?: string): string | null {
    try {
      const secretKey = key || process.env.ENCRYPTION_KEY;
      if (!secretKey) {
        throw new Error('Encryption key not available');
      }

      const algorithm = 'aes-256-gcm';
      const [encrypted, authTagHex] = encryptedData.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, secretKey);
      decipher.setAAD(Buffer.from('webspark.club', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * 生成哈希值
   */
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * 生成HMAC
   */
  static generateHmac(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * 验证HMAC
   */
  static verifyHmac(data: string, secret: string, hash: string, algorithm: string = 'sha256'): boolean {
    const expectedHash = this.generateHmac(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  }

  /**
   * 生成API密钥
   */
  static generateApiKey(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    return `wsk_${timestamp}_${random}`;
  }

  /**
   * 对敏感数据进行脱敏
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 4);
    }
    
    const visible = data.slice(0, visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return visible + masked;
  }

  /**
   * 生成数字验证码
   */
  static generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      result += digits[randomIndex];
    }
    
    return result;
  }

  /**
   * 生成字母数字验证码
   */
  static generateAlphanumericCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      result += chars[randomIndex];
    }
    
    return result;
  }

  /**
   * 计算文件哈希
   */
  static calculateFileHash(buffer: Buffer, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /**
   * 生成签名
   */
  static generateSignature(data: object, secret: string): string {
    const sortedKeys = Object.keys(data).sort();
    const sortedData = sortedKeys.reduce((result, key) => {
      result[key] = (data as any)[key];
      return result;
    }, {} as any);
    
    const dataString = JSON.stringify(sortedData);
    return this.generateHmac(dataString, secret);
  }

  /**
   * 验证签名
   */
  static verifySignature(data: object, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return this.verifyHmac(JSON.stringify(data), secret, signature);
  }

  /**
   * 时间安全的字符串比较
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * 生成一次性密码 (TOTP)
   */
  static generateTOTP(secret: string, timeStep: number = 30, digits: number = 6): string {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(time, 4);
    
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const code = (hash.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, digits);
    
    return code.toString().padStart(digits, '0');
  }

  /**
   * 验证一次性密码
   */
  static verifyTOTP(token: string, secret: string, window: number = 1, timeStep: number = 30): boolean {
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);
    
    for (let i = -window; i <= window; i++) {
      const testTime = currentTime + i;
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(testTime, 4);
      
      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0x0f;
      const code = (hash.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, 6);
      const expectedToken = code.toString().padStart(6, '0');
      
      if (this.timingSafeEqual(token, expectedToken)) {
        return true;
      }
    }
    
    return false;
  }
}