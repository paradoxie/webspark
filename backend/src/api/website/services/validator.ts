/**
 * 数据验证服务
 * 提供各种数据格式和业务规则的验证
 */

class ValidatorService {
  // 验证URL格式
  validateUrl(url: string): { isValid: boolean; message?: string } {
    if (!url) {
      return { isValid: false, message: 'URL不能为空' };
    }

    // 简单的URL验证正则
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      return { isValid: false, message: '请输入有效的URL地址' };
    }

    // 确保有协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { isValid: false, message: 'URL必须包含http://或https://协议' };
    }

    // 检查是否是被禁止的域名
    const forbiddenDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    const hostname = new URL(url).hostname;
    
    if (forbiddenDomains.some(domain => hostname.includes(domain))) {
      return { isValid: false, message: '不允许提交本地地址' };
    }

    return { isValid: true };
  }

  // 验证标题
  validateTitle(title: string): { isValid: boolean; message?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, message: '标题不能为空' };
    }

    if (title.length < 5) {
      return { isValid: false, message: '标题长度不能少于5个字符' };
    }

    if (title.length > 50) {
      return { isValid: false, message: '标题长度不能超过50个字符' };
    }

    // 检查是否包含敏感词
    const sensitiveWords = ['spam', 'hack', 'porn', '垃圾', '色情'];
    const lowerTitle = title.toLowerCase();
    
    if (sensitiveWords.some(word => lowerTitle.includes(word))) {
      return { isValid: false, message: '标题包含不当内容' };
    }

    return { isValid: true };
  }

  // 验证描述
  validateDescription(description: string, minLength = 20, maxLength = 160): { isValid: boolean; message?: string } {
    if (!description || description.trim().length === 0) {
      return { isValid: false, message: '描述不能为空' };
    }

    if (description.length < minLength) {
      return { isValid: false, message: `描述长度不能少于${minLength}个字符` };
    }

    if (description.length > maxLength) {
      return { isValid: false, message: `描述长度不能超过${maxLength}个字符` };
    }

    return { isValid: true };
  }

  // 验证标签
  validateTags(tags: string[]): { isValid: boolean; message?: string } {
    if (!Array.isArray(tags)) {
      return { isValid: false, message: '标签必须是数组格式' };
    }

    if (tags.length === 0) {
      return { isValid: false, message: '至少需要选择一个标签' };
    }

    if (tags.length > 5) {
      return { isValid: false, message: '最多只能选择5个标签' };
    }

    // 验证每个标签
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return { isValid: false, message: '标签不能为空' };
      }

      if (tag.length > 30) {
        return { isValid: false, message: '单个标签长度不能超过30个字符' };
      }
    }

    return { isValid: true };
  }

  // 验证举报理由
  validateReportReason(reason: string): { isValid: boolean; message?: string } {
    const validReasons = ['SPAM', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_INFRINGEMENT', 'BROKEN_LINK', 'OTHER'];
    
    if (!reason || !validReasons.includes(reason)) {
      return { isValid: false, message: '请选择有效的举报理由' };
    }

    return { isValid: true };
  }

  // 验证网站提交数据
  validateWebsiteSubmission(data: any): { isValid: boolean; errors: any } {
    const errors: any = {};

    // 验证URL
    const urlValidation = this.validateUrl(data.url);
    if (!urlValidation.isValid) {
      errors.url = urlValidation.message;
    }

    // 验证标题
    const titleValidation = this.validateTitle(data.title);
    if (!titleValidation.isValid) {
      errors.title = titleValidation.message;
    }

    // 验证简短描述
    const shortDescValidation = this.validateDescription(data.shortDescription, 20, 160);
    if (!shortDescValidation.isValid) {
      errors.shortDescription = shortDescValidation.message;
    }

    // 验证详细描述
    const descValidation = this.validateDescription(data.description, 100, 2000);
    if (!descValidation.isValid) {
      errors.description = descValidation.message;
    }

    // 验证标签
    const tagsValidation = this.validateTags(data.tags || []);
    if (!tagsValidation.isValid) {
      errors.tags = tagsValidation.message;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new ValidatorService(); 