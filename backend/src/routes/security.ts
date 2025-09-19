import express from 'express';
import { SecurityAuditLogger } from '../utils/securityAudit';
import { validateApiKey } from '../middleware/security';

const router = express.Router();

// 获取安全事件统计
router.get('/stats', validateApiKey, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await SecurityAuditLogger.getSecurityStats(days);
    
    res.json({
      success: true,
      data: stats,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error getting security stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security statistics'
    });
  }
});

// 获取安全事件列表
router.get('/events', validateApiKey, async (req, res) => {
  try {
    const { startDate, endDate, type, severity, limit } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    
    let events = await SecurityAuditLogger.getSecurityEvents(
      start,
      end,
      type as any,
      severity as any
    );
    
    // 限制返回的事件数量
    if (limit) {
      const limitNum = parseInt(limit as string);
      events = events.slice(0, limitNum);
    }
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security events'
    });
  }
});

// 手动记录安全事件（用于测试或手动报告）
router.post('/events', validateApiKey, async (req, res) => {
  try {
    const { type, severity, details } = req.body;
    
    if (!type || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Type and severity are required'
      });
    }
    
    await SecurityAuditLogger.logFromRequest(
      req,
      type,
      severity,
      details || {}
    );
    
    res.json({
      success: true,
      message: 'Security event logged successfully'
    });
  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log security event'
    });
  }
});

// 获取安全配置状态
router.get('/config', validateApiKey, async (req, res) => {
  try {
    const config = {
      csrfProtection: true,
      inputValidation: true,
      auditLogging: true,
      securityHeaders: true,
      apiKeyValidation: !!process.env.VALID_API_KEYS,
      encryptionEnabled: !!process.env.ENCRYPTION_KEY,
      jwtConfigured: !!process.env.JWT_SECRET,
      securityAlertsEmail: !!process.env.SECURITY_ALERT_EMAIL
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting security config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security configuration'
    });
  }
});

export default router;