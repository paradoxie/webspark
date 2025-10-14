import { Router, Request, Response } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { logAnalyzer } from '../utils/structuredLogger';
import structuredLogger from '../utils/structuredLogger';

const router = Router();

// 获取日志分析报告
router.get('/analysis', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type = 'all', hours = 24 } = req.query;
    
    let result;
    
    switch (type) {
      case 'errors':
        result = await logAnalyzer.analyzeErrors(Number(hours));
        break;
      case 'performance':
        result = await logAnalyzer.analyzePerformance(req.query.operation as string);
        break;
      case 'report':
        result = await logAnalyzer.generateReport();
        break;
      default:
        result = {
          errors: await logAnalyzer.analyzeErrors(Number(hours)),
          performance: await logAnalyzer.analyzePerformance()
        };
    }
    
    structuredLogger.logUserAction('view_log_analysis', { type, hours });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    structuredLogger.logError(error, { context: 'log_analysis' });
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: '日志分析失败'
      }
    });
  }
});

// 记录自定义事件
router.post('/events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '事件名称不能为空'
        }
      });
    }
    
    structuredLogger.logEvent(event, {
      ...data,
      userId: (req as any).user.id,
      source: 'api'
    });
    
    res.json({
      success: true,
      data: {
        message: '事件已记录'
      }
    });
  } catch (error: any) {
    structuredLogger.logError(error, { context: 'log_event' });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOG_ERROR',
        message: '记录事件失败'
      }
    });
  }
});

// 获取实时日志流（WebSocket would be better）
router.get('/stream', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 发送初始消息
  res.write('data: {"type":"connected","message":"日志流已连接"}\n\n');
  
  // 每5秒发送一次心跳
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 5000);
  
  // 清理
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

export default router;

