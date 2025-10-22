import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

interface ErrorNotification {
  type: 'CRITICAL' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
  stack?: string;
  userId?: number;
  url?: string;
  method?: string;
}

class ErrorNotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean = false;
  private notificationEmail: string | null = null;
  private lastNotificationTime: Map<string, number> = new Map();
  private notificationThrottle = 300000; // 5分钟内相同错误只发送一次

  constructor() {
    this.initialize();
  }

  private initialize() {
    // 检查是否配置了邮件通知
    this.notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || null;
    
    if (!this.notificationEmail) {
      console.log('📧 Error notification disabled (no ADMIN_NOTIFICATION_EMAIL configured)');
      return;
    }

    // 使用简单的 SMTP 配置
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      });

      this.isEnabled = true;
      console.log('📧 Error notification enabled');
    } else if (process.env.SENDGRID_API_KEY) {
      // 支持 SendGrid
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isEnabled = true;
      console.log('📧 Error notification enabled (SendGrid)');
    }
  }

  // 发送错误通知
  async notifyError(error: ErrorNotification): Promise<void> {
    if (!this.isEnabled || !this.notificationEmail) {
      return;
    }

    // 检查是否需要节流
    const errorKey = `${error.type}-${error.message}`;
    const lastTime = this.lastNotificationTime.get(errorKey);
    const now = Date.now();

    if (lastTime && (now - lastTime) < this.notificationThrottle) {
      return; // 跳过重复通知
    }

    this.lastNotificationTime.set(errorKey, now);

    try {
      const subject = `[WebSpark] ${error.type}: ${error.message.substring(0, 50)}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: ${this.getColorByType(error.type)};">
            ${error.type} Alert
          </h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            ${error.url ? `<p><strong>URL:</strong> ${error.url}</p>` : ''}
            ${error.method ? `<p><strong>Method:</strong> ${error.method}</p>` : ''}
            ${error.userId ? `<p><strong>User ID:</strong> ${error.userId}</p>` : ''}
          </div>
          
          ${error.details ? `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Details:</h3>
              <pre style="white-space: pre-wrap;">${JSON.stringify(error.details, null, 2)}</pre>
            </div>
          ` : ''}
          
          ${error.stack ? `
            <div style="background: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Stack Trace:</h3>
              <pre style="white-space: pre-wrap; font-size: 12px;">${error.stack}</pre>
            </div>
          ` : ''}
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from WebSpark.club.
            To disable these notifications, remove ADMIN_NOTIFICATION_EMAIL from environment variables.
          </p>
        </div>
      `;

      if (this.transporter) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@webspark.club',
          to: this.notificationEmail,
          subject,
          html
        });
      } else if (process.env.SENDGRID_API_KEY) {
        const sgMail = require('@sendgrid/mail');
        await sgMail.send({
          from: process.env.SENDGRID_FROM || 'noreply@webspark.club',
          to: this.notificationEmail,
          subject,
          html
        });
      }

      console.log(`📧 Error notification sent: ${subject}`);
    } catch (err) {
      console.error('Failed to send error notification:', err);
      // 不要抛出错误，避免影响主流程
    }
  }

  // 记录关键错误到数据库（可选）
  async logCriticalError(error: ErrorNotification): Promise<void> {
    try {
      // 这里可以记录到一个错误日志表
      // 目前先简单记录到控制台
      console.error('🚨 Critical Error:', {
        type: error.type,
        message: error.message,
        timestamp: new Date().toISOString(),
        details: error.details
      });

      // 发送邮件通知
      if (error.type === 'CRITICAL') {
        await this.notifyError(error);
      }
    } catch (err) {
      console.error('Failed to log critical error:', err);
    }
  }

  // 每日错误汇总报告（可选功能）
  async sendDailySummary(): Promise<void> {
    if (!this.isEnabled || !this.notificationEmail) {
      return;
    }

    try {
      // 获取今日的统计数据
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        newUsers,
        newWebsites,
        totalErrors
      ] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.website.count({
          where: { createdAt: { gte: today } }
        }),
        // 这里可以从错误日志表获取
        Promise.resolve(0)
      ]);

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>📊 WebSpark Daily Summary</h2>
          <p>Date: ${today.toDateString()}</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Today's Statistics:</h3>
            <ul>
              <li>New Users: ${newUsers}</li>
              <li>New Websites: ${newWebsites}</li>
              <li>Errors: ${totalErrors}</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This is an automated daily summary from WebSpark.club.
          </p>
        </div>
      `;

      if (this.transporter) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@webspark.club',
          to: this.notificationEmail,
          subject: `[WebSpark] Daily Summary - ${today.toDateString()}`,
          html
        });
      }

      console.log('📧 Daily summary sent');
    } catch (err) {
      console.error('Failed to send daily summary:', err);
    }
  }

  private getColorByType(type: string): string {
    switch (type) {
      case 'CRITICAL': return '#d32f2f';
      case 'ERROR': return '#f57c00';
      case 'WARNING': return '#fbc02d';
      default: return '#757575';
    }
  }

  // 便捷方法
  async notifyCritical(message: string, details?: any): Promise<void> {
    await this.notifyError({
      type: 'CRITICAL',
      message,
      details
    });
  }

  async notifyErrorMessage(message: string, details?: any): Promise<void> {
    await this.notifyError({
      type: 'ERROR',
      message,
      details
    });
  }

  async notifyWarning(message: string, details?: any): Promise<void> {
    await this.notifyError({
      type: 'WARNING',
      message,
      details
    });
  }
}

// 创建单例
export const errorNotifier = new ErrorNotificationService();

// Express 错误处理中间件集成
export function errorNotificationMiddleware(err: any, req: any, res: any, next: any) {
  // 只通知服务器错误
  if (err.statusCode >= 500 || !err.statusCode) {
    errorNotifier.notifyError({
      type: err.statusCode === 500 ? 'CRITICAL' : 'ERROR',
      message: err.message || 'Unknown error',
      details: {
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    }).catch(console.error);
  }

  next(err);
}
