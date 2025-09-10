'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: 'WEBSITE_APPROVED' | 'WEBSITE_REJECTED' | 'WEBSITE_LIKED' | 'WEBSITE_COMMENTED' | 'COMMENT_REPLIED' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  website?: {
    id: number;
    title: string;
    slug: string;
  };
  comment?: {
    id: number;
    content: string;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchNotifications();
  }, [session, status, router, filter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '50',
        unreadOnly: filter === 'unread' ? 'true' : 'false'
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.meta?.unreadCount || 0);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('通知加载失败');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
        toast.success('所有通知已标记为已读');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('操作失败，请重试');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'WEBSITE_APPROVED':
        return '✅';
      case 'WEBSITE_REJECTED':
        return '❌';
      case 'WEBSITE_LIKED':
        return '❤️';
      case 'WEBSITE_COMMENTED':
        return '💬';
      case 'COMMENT_REPLIED':
        return '↩️';
      case 'SYSTEM':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.website) {
      return `/sites/${notification.website.slug}`;
    }
    return '#';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              🔔 通知中心
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                  {unreadCount} 条未读
                </span>
              )}
            </h1>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                全部标为已读
              </button>
            )}
          </div>

          {/* 筛选器 */}
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-slate-400 text-6xl mb-4">🔕</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filter === 'unread' ? '没有未读通知' : '暂无通知'}
              </h3>
              <p className="text-slate-600">
                {filter === 'unread' 
                  ? '所有通知都已阅读' 
                  : '当有新动态时，通知会出现在这里'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <div
                    className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex space-x-4">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-slate-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-slate-600 leading-relaxed">
                              {notification.message}
                            </p>
                            {notification.website && (
                              <p className="text-sm text-blue-600 mt-2">
                                作品：{notification.website.title}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center ml-4">
                            <span className="text-sm text-slate-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return link !== '#' ? (
                  <Link key={notification.id} href={link}>
                    {NotificationContent}
                  </Link>
                ) : (
                  <div key={notification.id}>
                    {NotificationContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}