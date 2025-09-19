import { prisma } from '../lib/prisma';
import { emailService } from './emailService';

export type NotificationType =
  | 'WEBSITE_APPROVED'
  | 'WEBSITE_REJECTED'
  | 'WEBSITE_LIKED'
  | 'WEBSITE_COMMENTED'
  | 'COMMENT_REPLIED'
  | 'COMMENT_LIKED'
  | 'SYSTEM';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  websiteId?: number;
  commentId?: number;
}

export class NotificationService {
  // 创建通知
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          websiteId: params.websiteId,
          commentId: params.commentId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          website: params.websiteId ? {
            select: {
              id: true,
              title: true,
              slug: true
            }
          } : false,
          comment: params.commentId ? {
            select: {
              id: true,
              content: true
            }
          } : false
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // 网站审核通过通知
  static async notifyWebsiteApproved(websiteId: number, userId: number) {
    const [website, user] = await Promise.all([
      prisma.website.findUnique({
        where: { id: websiteId },
        select: { title: true, slug: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true, email: true, emailNotifications: true }
      })
    ]);

    if (!website || !user) return;

    // 创建站内通知
    const notification = await this.createNotification({
      userId,
      type: 'WEBSITE_APPROVED',
      title: '作品审核通过',
      message: `你的作品《${website.title}》已通过审核并发布`,
      websiteId
    });

    // 发送邮件通知（如果用户开启了邮件通知）
    if (user.emailNotifications !== false) {
      try {
        await emailService.sendWebsiteApprovedNotification(
          user.email,
          user.name || user.username,
          website.title,
          website.slug
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    return notification;
  }

  // 网站审核拒绝通知
  static async notifyWebsiteRejected(websiteId: number, userId: number, reason?: string) {
    const [website, user] = await Promise.all([
      prisma.website.findUnique({
        where: { id: websiteId },
        select: { title: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true, email: true, emailNotifications: true }
      })
    ]);

    if (!website || !user) return;

    const message = reason 
      ? `你的作品《${website.title}》未通过审核：${reason}`
      : `你的作品《${website.title}》未通过审核`;

    // 创建站内通知
    const notification = await this.createNotification({
      userId,
      type: 'WEBSITE_REJECTED',
      title: '作品审核未通过',
      message,
      websiteId
    });

    // 发送邮件通知（如果用户开启了邮件通知）
    if (user.emailNotifications !== false) {
      try {
        await emailService.sendWebsiteRejectedNotification(
          user.email,
          user.name || user.username,
          website.title,
          reason
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    return notification;
  }

  // 网站被点赞通知
  static async notifyWebsiteLiked(websiteId: number, likerUsername: string) {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      select: { 
        title: true, 
        authorId: true,
        author: {
          select: { id: true }
        }
      }
    });

    if (!website) return;

    return this.createNotification({
      userId: website.authorId,
      type: 'WEBSITE_LIKED',
      title: '作品获得点赞',
      message: `${likerUsername} 点赞了你的作品《${website.title}》`,
      websiteId
    });
  }

  // 网站被评论通知
  static async notifyWebsiteCommented(websiteId: number, commenterUsername: string) {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      select: { 
        title: true, 
        authorId: true
      }
    });

    if (!website) return;

    return this.createNotification({
      userId: website.authorId,
      type: 'WEBSITE_COMMENTED',
      title: '作品收到新评论',
      message: `${commenterUsername} 评论了你的作品《${website.title}》`,
      websiteId
    });
  }

  // 评论被回复通知
  static async notifyCommentReplied(commentId: number, replierUsername: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { id: true }
        },
        website: {
          select: { title: true }
        }
      }
    });

    if (!comment) return;

    return this.createNotification({
      userId: comment.author.id,
      type: 'COMMENT_REPLIED',
      title: '评论收到回复',
      message: `${replierUsername} 回复了你在《${comment.website.title}》中的评论`,
      websiteId: comment.websiteId,
      commentId
    });
  }

  // 系统通知
  static async notifySystem(userId: number, title: string, message: string) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message
    });
  }

  // 批量系统通知（发送给所有活跃用户）
  static async notifyAllUsers(title: string, message: string) {
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    const notifications = await Promise.all(
      activeUsers.map(user => 
        this.createNotification({
          userId: user.id,
          type: 'SYSTEM',
          title,
          message
        })
      )
    );

    return notifications;
  }

  // 评论点赞通知
  static async notifyCommentLiked(commentId: number, likerName: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            emailNotifications: true
          }
        },
        website: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    if (!comment) return;

    const user = comment.author;

    // 创建站内通知
    await this.createNotification({
      userId: user.id,
      type: 'COMMENT_LIKED',
      title: '评论被点赞',
      message: `${likerName} 点赞了你在《${comment.website.title}》下的评论`,
      websiteId: comment.website.id,
      commentId
    });

    // 发送邮件通知（如果用户开启了邮件通知）
    if (user.emailNotifications !== false) {
      try {
        await emailService.sendCommentLikedNotification(
          user.email,
          user.name || user.username,
          likerName,
          comment.website.title,
          comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
          comment.website.slug
        );
      } catch (error) {
        console.error('Failed to send comment liked email notification:', error);
      }
    }
  }
}