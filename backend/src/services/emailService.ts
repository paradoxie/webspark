import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationEmailData {
  recipientName: string;
  recipientEmail: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 发送基础邮件
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"WebSpark.club" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // 生成通知邮件HTML模板
  private generateNotificationHTML(data: NotificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            text-decoration: none;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 16px;
          }
          .message {
            color: #475569;
            margin-bottom: 30px;
          }
          .action-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-bottom: 30px;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="https://webspark.club" class="logo">WebSpark.club</a>
          </div>
          
          <div class="content">
            <h2 class="title">${data.title}</h2>
            <div class="message">
              <p>你好 ${data.recipientName}，</p>
              <p>${data.message}</p>
            </div>
            
            ${data.actionUrl && data.actionText ? `
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="action-button">${data.actionText}</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>
              这是一封来自 <a href="https://webspark.club">WebSpark.club</a> 的通知邮件。<br>
              如果你不希望收到此类邮件，可以在 <a href="https://webspark.club/settings">账户设置</a> 中关闭邮件通知。
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 发送作品审核通过通知
  async sendWebsiteApprovedNotification(
    recipientEmail: string,
    recipientName: string,
    websiteTitle: string,
    websiteSlug: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '🎉 作品审核通过',
      message: `恭喜！你提交的作品《${websiteTitle}》已通过审核并成功发布到 WebSpark.club 平台。现在其他用户可以浏览和点赞你的作品了。`,
      actionUrl: `https://webspark.club/sites/${websiteSlug}`,
      actionText: '查看我的作品',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `🎉 作品《${websiteTitle}》审核通过 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送作品审核拒绝通知
  async sendWebsiteRejectedNotification(
    recipientEmail: string,
    recipientName: string,
    websiteTitle: string,
    reason?: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '❌ 作品审核未通过',
      message: `很抱歉，你提交的作品《${websiteTitle}》未通过审核。${reason ? `原因：${reason}` : '请检查作品内容是否符合平台规范。'}你可以修改后重新提交。`,
      actionUrl: 'https://webspark.club/submit',
      actionText: '重新提交作品',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `❌ 作品《${websiteTitle}》审核未通过 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送作品获得点赞通知
  async sendWebsiteLikedNotification(
    recipientEmail: string,
    recipientName: string,
    websiteTitle: string,
    websiteSlug: string,
    likerName: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '👍 有人点赞了你的作品',
      message: `${likerName} 点赞了你的作品《${websiteTitle}》。感谢你为社区贡献优质内容！`,
      actionUrl: `https://webspark.club/sites/${websiteSlug}`,
      actionText: '查看作品',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `👍 ${likerName} 点赞了你的作品 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送评论通知
  async sendCommentNotification(
    recipientEmail: string,
    recipientName: string,
    websiteTitle: string,
    websiteSlug: string,
    commenterName: string,
    commentContent: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '💬 有人评论了你的作品',
      message: `${commenterName} 评论了你的作品《${websiteTitle}》：<br><br>"${commentContent}"`,
      actionUrl: `https://webspark.club/sites/${websiteSlug}#comments`,
      actionText: '查看评论',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `💬 ${commenterName} 评论了你的作品 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送回复通知
  async sendReplyNotification(
    recipientEmail: string,
    recipientName: string,
    websiteTitle: string,
    websiteSlug: string,
    replierName: string,
    replyContent: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '💬 有人回复了你的评论',
      message: `${replierName} 回复了你在《${websiteTitle}》中的评论：<br><br>"${replyContent}"`,
      actionUrl: `https://webspark.club/sites/${websiteSlug}#comments`,
      actionText: '查看回复',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `💬 ${replierName} 回复了你的评论 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送评论点赞通知
  async sendCommentLikedNotification(
    recipientEmail: string,
    recipientName: string,
    likerName: string,
    websiteTitle: string,
    commentContent: string,
    websiteSlug: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '👍 有人点赞了你的评论',
      message: `${likerName} 点赞了你在《${websiteTitle}》中的评论：<br><br>"${commentContent}"`,
      actionUrl: `https://webspark.club/sites/${websiteSlug}#comments`,
      actionText: '查看评论',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `👍 ${likerName} 点赞了你的评论 - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送系统通知
  async sendSystemNotification(
    recipientEmail: string,
    recipientName: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title,
      message,
      actionUrl,
      actionText,
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: `${title} - WebSpark.club`,
      html: this.generateNotificationHTML(data),
    });
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string
  ): Promise<void> {
    const data: NotificationEmailData = {
      recipientName,
      recipientEmail,
      title: '🎉 欢迎加入 WebSpark.club',
      message: `欢迎加入 WebSpark.club 开发者社区！这里是一个展示和发现优秀 Web 开发作品的平台。你可以：<br><br>
        • 提交你的优秀作品<br>
        • 浏览和点赞他人的作品<br>
        • 与开发者交流和讨论<br>
        • 发现最新的技术趋势`,
      actionUrl: 'https://webspark.club/submit',
      actionText: '提交第一个作品',
    };

    await this.sendEmail({
      to: recipientEmail,
      subject: '🎉 欢迎加入 WebSpark.club',
      html: this.generateNotificationHTML(data),
    });
  }

  // 测试邮件连接
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();