/**
 * 增强的通知服务
 * 提供多渠道、智能化的通知功能
 */

import { prisma } from '../db';
import nodemailer from 'nodemailer';
import webpush from 'web-push';

// 通知类型定义
export enum NotificationType {
  // 作品相关
  WORK_APPROVED = 'WORK_APPROVED',
  WORK_REJECTED = 'WORK_REJECTED',
  WORK_FEATURED = 'WORK_FEATURED',
  WORK_LIKED = 'WORK_LIKED',
  WORK_COMMENTED = 'WORK_COMMENTED',
  
  // 社交相关
  USER_FOLLOWED = 'USER_FOLLOWED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  COMMENT_LIKED = 'COMMENT_LIKED',
  
  // 系统相关
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
  
  // 管理相关
  REPORT_HANDLED = 'REPORT_HANDLED',
  CONTENT_WARNING = 'CONTENT_WARNING'
}

// 通知优先级
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// 通知渠道
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS'
}

interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
}

interface UserNotificationPreferences {
  userId: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  blockedTypes: NotificationType[];
  preferredChannels: Record<NotificationType, NotificationChannel[]>;
}

export class NotificationService {
  private static emailTransporter: nodemailer.Transporter | null = null;

  /**
   * 初始化服务
   */
  static async initialize() {
    // 配置邮件服务
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      });
    }

    // 配置Web Push
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.SMTP_FROM || 'noreply@webspark.club'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  /**
   * 发送通知
   */
  static async send(payload: NotificationPayload): Promise<boolean> {
    try {
      // 获取用户偏好设置
      const preferences = await this.getUserPreferences(payload.userId);
      
      // 检查是否在静默时段
      if (this.isInQuietHours(preferences)) {
        // 延迟到静默时段结束后发送
        await this.scheduleNotification(payload, preferences);
        return true;
      }

      // 检查通知类型是否被屏蔽
      if (preferences.blockedTypes.includes(payload.type)) {
        console.log(`Notification type ${payload.type} is blocked for user ${payload.userId}`);
        return false;
      }

      // 确定发送渠道
      const channels = payload.channels || 
        preferences.preferredChannels[payload.type] || 
        [NotificationChannel.IN_APP];

      // 并行发送到各个渠道
      const results = await Promise.allSettled([
        channels.includes(NotificationChannel.IN_APP) && this.sendInAppNotification(payload),
        channels.includes(NotificationChannel.EMAIL) && preferences.emailEnabled && this.sendEmailNotification(payload),
        channels.includes(NotificationChannel.PUSH) && preferences.pushEnabled && this.sendPushNotification(payload),
        channels.includes(NotificationChannel.SMS) && preferences.smsEnabled && this.sendSMSNotification(payload)
      ]);

      // 记录发送结果
      const success = results.some(r => r.status === 'fulfilled' && r.value);
      
      if (success) {
        await this.logNotification(payload);
      }

      return success;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * 发送应用内通知
   */
  private static async sendInAppNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type as any, // Cast to match schema enum
          title: payload.title,
          message: payload.message
        }
      });

      // Send realtime notification (if available)
      await this.sendRealtimeNotification(payload.userId, notification);

      return true;
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      return false;
    }
  }

  /**
   * 发送邮件通知
   */
  private static async sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, name: true }
      });

      if (!user?.email) {
        return false;
      }

      const html = this.generateEmailTemplate(payload, user.name || 'User');

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@webspark.club',
        to: user.email,
        subject: payload.title,
        html
      });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * 发送推送通知
   */
  private static async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Get user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId: payload.userId
        }
      });

      if (subscriptions.length === 0) {
        return false;
      }

      const notification = {
        title: payload.title,
        body: payload.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          type: payload.type,
          url: payload.actionUrl,
          ...payload.data
        }
      };

      // Send to all subscribed devices in parallel
      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as any
            },
            JSON.stringify(notification)
          )
        )
      );

      // Clean up failed subscriptions
      const failedIndices: number[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedIndices.push(subscriptions[index].id);
        }
      });

      if (failedIndices.length > 0) {
        await prisma.pushSubscription.updateMany({
          where: { id: { in: failedIndices } },
          data: { failureCount: { increment: 1 } }
        });
      }

      return results.some(r => r.status === 'fulfilled');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * 发送短信通知（预留接口）
   */
  private static async sendSMSNotification(payload: NotificationPayload): Promise<boolean> {
    // TODO: 集成短信服务商API
    console.log('SMS notification not implemented yet');
    return false;
  }

  /**
   * 批量发送通知
   */
  static async sendBatch(
    userIds: number[],
    template: Omit<NotificationPayload, 'userId'>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // 分批处理，避免并发过高
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(userId => 
          this.send({ ...template, userId })
        )
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          sent++;
        } else {
          failed++;
        }
      });

      // 避免过快发送
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { sent, failed };
  }

  /**
   * 发送每周摘要
   */
  static async sendWeeklyDigest(userId: number): Promise<boolean> {
    try {
      // Get user data from this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [websites, interactions, topWebsites] = await Promise.all([
        // User's websites submitted this week
        prisma.website.findMany({
          where: {
            authorId: userId,
            createdAt: { gte: weekAgo }
          },
          select: {
            title: true,
            likeCount: true,
            viewCount: true
          }
        }),

        // User's website interactions this week
        prisma.website.aggregate({
          where: { authorId: userId },
          _sum: {
            likeCount: true,
            viewCount: true
          }
        }),

        // Top websites this week
        prisma.website.findMany({
          where: {
            status: 'APPROVED',
            createdAt: { gte: weekAgo }
          },
          orderBy: { likeCount: 'desc' },
          take: 5,
          select: {
            title: true,
            slug: true,
            author: {
              select: { name: true }
            }
          }
        })
      ]);

      const digestData = {
        userWebsites: websites,
        totalLikes: interactions._sum.likeCount || 0,
        totalViews: interactions._sum.viewCount || 0,
        totalComments: 0, // Comments count not available in current schema
        topWebsites
      };

      return await this.send({
        userId,
        type: NotificationType.WEEKLY_DIGEST,
        title: '您的每周创作摘要',
        message: `本周您的作品获得了 ${digestData.totalLikes} 个赞和 ${digestData.totalViews} 次浏览`,
        data: digestData,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
      });
    } catch (error) {
      console.error('Failed to send weekly digest:', error);
      return false;
    }
  }

  /**
   * 获取用户通知偏好
   */
  private static async getUserPreferences(userId: number): Promise<UserNotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationSettings: true
      }
    });

    const preferences: UserNotificationPreferences = {
      userId,
      emailEnabled: user?.notificationSettings?.emailEnabled ?? true,
      pushEnabled: user?.notificationSettings?.pushEnabled ?? true,
      smsEnabled: user?.notificationSettings?.smsEnabled ?? false,
      quietHoursStart: user?.notificationSettings?.quietHoursStart?.toString(),
      quietHoursEnd: user?.notificationSettings?.quietHoursEnd?.toString(),
      blockedTypes: (user?.notificationSettings?.blockedTypes as any) || [],
      preferredChannels: (user?.notificationSettings?.preferredChannels as any) || {}
    };

    return preferences;
  }

  /**
   * 检查是否在静默时段
   */
  private static isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨越午夜的情况
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * 延迟发送通知
   */
  private static async scheduleNotification(
    payload: NotificationPayload,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    // TODO: 实现延迟队列
    console.log('Notification scheduled for later delivery');
  }

  /**
   * 发送实时通知
   */
  private static async sendRealtimeNotification(userId: number, notification: any): Promise<void> {
    // TODO: 通过WebSocket发送实时通知
    console.log(`Realtime notification sent to user ${userId}`);
  }

  /**
   * 记录通知日志
   */
  private static async logNotification(payload: NotificationPayload): Promise<void> {
    // Log notification for debugging/monitoring
    console.log('Notification sent:', {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      channels: payload.channels?.join(',') || 'IN_APP',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 生成邮件模板
   */
  private static generateEmailTemplate(payload: NotificationPayload, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>WebSpark</h1>
              <h2>${payload.title}</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>${payload.message}</p>
              ${payload.actionUrl ? `
                <a href="${payload.actionUrl}" class="button">
                  ${payload.actionLabel || '查看详情'}
                </a>
              ` : ''}
            </div>
            <div class="footer">
              <p>© 2024 WebSpark.club | <a href="https://webspark.club/settings/notifications">管理通知设置</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 初始化服务
NotificationService.initialize();
