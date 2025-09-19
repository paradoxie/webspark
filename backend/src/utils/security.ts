import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// HTML内容清理配置
const HTML_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'strike', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a'
  ],
  ALLOWED_ATTR: {
    'a': ['href', 'target', 'rel'],
    'code': ['class'],
    'pre': ['class']
  },
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  DOMPurifyConfig: {
    ADD_ATTR: ['target']
  }
};

export class SecurityValidator {
  
  /**
   * 清理HTML内容，防止XSS攻击
   */
  static sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    
    return DOMPurify.sanitize(html, {
      ...HTML_PURIFY_CONFIG,
      // 确保外部链接安全
      HOOK_BEFORE_CLEAN: (node: any) => {
        const links = node.querySelectorAll('a[href]');
        links.forEach((link: any) => {
          const href = link.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        });
      }
    });
  }

  /**
   * 清理普通文本内容
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    // 移除HTML标签
    const withoutHtml = text.replace(/<[^>]*>/g, '');
    
    // 转义特殊字符
    return validator.escape(withoutHtml);
  }

  /**
   * 验证URL安全性
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // 只允许HTTP和HTTPS协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // 检查是否为有效URL格式
      if (!validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_host: true,
        require_valid_protocol: true,
        allow_underscores: false,
        host_whitelist: false,
        host_blacklist: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
        disallow_auth: true
      })) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证邮箱地址
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email, {
      allow_utf8_local_part: false,
      require_tld: true,
      allow_ip_domain: false,
      domain_specific_validation: true
    });
  }

  /**
   * 验证用户名安全性
   */
  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: '用户名不能为空' };
    }
    
    // 长度检查
    if (username.length < 3 || username.length > 30) {
      return { valid: false, error: '用户名长度必须在3-30个字符之间' };
    }
    
    // 格式检查：只允许字母、数字、下划线、连字符
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, error: '用户名只能包含字母、数字、下划线和连字符' };
    }
    
    // 不能以特殊字符开头或结尾
    if (/^[-_]|[-_]$/.test(username)) {
      return { valid: false, error: '用户名不能以特殊字符开头或结尾' };
    }
    
    // 敏感词检查
    const sensitiveWords = ['admin', 'root', 'system', 'null', 'undefined', 'api', 'www'];
    if (sensitiveWords.some(word => username.toLowerCase().includes(word))) {
      return { valid: false, error: '用户名包含敏感词' };
    }
    
    return { valid: true };
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): { valid: boolean; score: number; error?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, score: 0, error: '密码不能为空' };
    }
    
    // 长度检查
    if (password.length < 8) {
      return { valid: false, score: 0, error: '密码长度至少8个字符' };
    }
    
    if (password.length > 128) {
      return { valid: false, score: 0, error: '密码长度不能超过128个字符' };
    }
    
    let score = 0;
    const checks = {
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      isLongEnough: password.length >= 12
    };
    
    // 评分计算
    Object.values(checks).forEach(check => {
      if (check) score += 1;
    });
    
    // 基本安全要求：至少包含字母和数字
    if (!checks.hasLower && !checks.hasUpper) {
      return { valid: false, score, error: '密码必须包含字母' };
    }
    
    if (!checks.hasNumber) {
      return { valid: false, score, error: '密码必须包含数字' };
    }
    
    return { valid: true, score };
  }

  /**
   * 清理文件名
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';
    
    // 移除路径分隔符和特殊字符
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .substring(0, 255)
      .trim();
  }

  /**
   * 验证文件类型
   */
  static validateFileType(filename: string, allowedTypes: string[]): boolean {
    if (!filename || typeof filename !== 'string') return false;
    
    const extension = filename.toLowerCase().split('.').pop();
    if (!extension) return false;
    
    return allowedTypes.includes(extension);
  }

  /**
   * 验证JSON输入
   */
  static validateJson(jsonString: string): { valid: boolean; data?: any; error?: string } {
    if (!jsonString || typeof jsonString !== 'string') {
      return { valid: false, error: 'JSON字符串不能为空' };
    }
    
    try {
      const data = JSON.parse(jsonString);
      
      // 检查JSON深度，防止嵌套过深导致的性能问题
      const getDepth = (obj: any, depth = 0): number => {
        if (depth > 10) return depth; // 最大深度限制
        if (obj && typeof obj === 'object') {
          return Math.max(...Object.values(obj).map(v => getDepth(v, depth + 1)));
        }
        return depth;
      };
      
      if (getDepth(data) > 10) {
        return { valid: false, error: 'JSON嵌套层级过深' };
      }
      
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'JSON格式无效' };
    }
  }

  /**
   * SQL注入检测
   */
  static detectSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /([\'\"](\s*;\s*|\s*(OR|AND)\s+)[\'\"])/i,
      /(-{2}|\/\*|\*\/)/,
      /(\bxp_cmdshell\b|\bsp_executesql\b)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * XSS检测
   */
  static detectXss(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<form\b[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /livescript:/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 检查输入长度
   */
  static validateLength(input: string, min: number, max: number): { valid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: '输入不能为空' };
    }
    
    if (input.length < min) {
      return { valid: false, error: `输入长度不能少于${min}个字符` };
    }
    
    if (input.length > max) {
      return { valid: false, error: `输入长度不能超过${max}个字符` };
    }
    
    return { valid: true };
  }

  /**
   * 综合安全检查
   */
  static comprehensiveCheck(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    checkSql?: boolean;
    checkXss?: boolean;
  } = {}): { valid: boolean; cleaned?: string; errors: string[] } {
    const {
      maxLength = 1000,
      allowHtml = false,
      checkSql = true,
      checkXss = true
    } = options;
    
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('输入不能为空');
      return { valid: false, errors };
    }
    
    // 长度检查
    if (input.length > maxLength) {
      errors.push(`输入长度不能超过${maxLength}个字符`);
    }
    
    // SQL注入检查
    if (checkSql && this.detectSqlInjection(input)) {
      errors.push('检测到潜在的SQL注入攻击');
    }
    
    // XSS检查
    if (checkXss && this.detectXss(input)) {
      errors.push('检测到潜在的XSS攻击');
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // 清理输入
    const cleaned = allowHtml ? this.sanitizeHtml(input) : this.sanitizeText(input);
    
    return { valid: true, cleaned, errors: [] };
  }
}