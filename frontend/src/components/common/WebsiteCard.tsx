'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import Tag from './Tag';
import Icon from './Icon';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  description: string;
  sourceUrl?: string;
  screenshots: string[];
  likeCount: number;
  viewCount: number;
  featured: boolean;
  isHiring: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  isLiked?: boolean;
  isBookmarked?: boolean;
  score?: number;
}

interface WebsiteCardProps {
  website: Website;
  showActions?: boolean;
  onLike?: (websiteId: number) => void;
  onBookmark?: (websiteId: number) => void;
}

export default function WebsiteCard({ 
  website, 
  showActions = true, 
  onLike, 
  onBookmark 
}: WebsiteCardProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(website.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(website.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(website.likeCount);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    if (onLike) {
      onLike(website.id);
      return;
    }

    try {
      const response = await fetch(`/api/websites/${website.id}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        setIsLiked(result.isLiked);
        setLikeCount(result.likeCount);
        toast.success(result.action === 'like' ? '点赞成功！' : '已取消点赞');
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('点赞失败，请重试');
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    if (onBookmark) {
      onBookmark(website.id);
      return;
    }

    try {
      const response = await fetch(`/api/websites/${website.id}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        setIsBookmarked(result.isBookmarked);
        toast.success(result.action === 'bookmark' ? '收藏成功！' : '已取消收藏');
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      toast.error('收藏失败，请重试');
    }
  };

  // 简单的SEO权重判断
  const getRelAttribute = (website: Website): string => {
    // 高质量内容：dofollow
    if (website.likeCount >= 50 || website.featured) {
      return 'noopener';
    }
    // 一般内容：ugc
    if (website.likeCount >= 10) {
      return 'noopener ugc';
    }
    // 新内容：nofollow
    return 'noopener nofollow ugc';
  };

  // 获取SEO徽章（用于tooltip）
  const getSEOBadge = (website: Website): string => {
    if (website.likeCount >= 50 || website.featured) {
      return ' (传递SEO权重)';
    }
    if (website.likeCount >= 10) {
      return ' (部分传递权重)';
    }
    return '';
  };

  return (
    <Link
      href={`/sites/${website.slug}`}
      className="group bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl dark:shadow-slate-900/20 dark:hover:shadow-slate-900/40 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-transparent dark:border-slate-700"
    >
      <div className="p-6">
        {/* 分类和状态标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {website.category && (
            <Tag
              name={website.category.name}
              icon={website.category.icon}
              color={website.category.color}
              href={`/categories/${website.category.slug}`}
              variant="category"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          {website.featured && (
            <Tag
              name="精选"
              icon="⭐"
              variant="status"
              className="bg-yellow-100 text-yellow-800"
              clickable={false}
            />
          )}
          
          {/* SEO价值标签 */}
          {(website.likeCount >= 50 || website.featured) && (
            <Tag
              name="SEO+"
              icon="🚀"
              variant="status"
              className="bg-green-100 text-green-800"
              clickable={false}
              title="此作品传递SEO权重"
            />
          )}
          
          {website.isHiring && (
            <Tag
              name="招聘中"
              icon="💼"
              variant="status"
              className="bg-green-100 text-green-800"
              clickable={false}
            />
          )}
        </div>
        
        {/* 标题和描述 */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {website.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">
            {website.shortDescription}
          </p>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {website.tags.slice(0, 3).map((tag) => (
            <Tag
              key={tag.id}
              name={tag.name}
              color={tag.color}
              href={`/tags/${tag.slug}`}
              onClick={(e) => e.stopPropagation()}
            />
          ))}
          {website.tags.length > 3 && (
            <Tag
              name={`+${website.tags.length - 3}`}
              className="bg-slate-100 text-slate-600"
              clickable={false}
            />
          )}
        </div>
        
        {/* 作者信息 */}
        <Link
          href={`/users/${website.author.username}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Avatar
            src={website.author.avatar}
            alt={website.author.name}
            size="sm"
            showRing={true}
          />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{website.author.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{website.author.username}</p>
          </div>
        </Link>
        
        {/* 统计和操作 */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center">
              <Icon name="eye" size="sm" className="mr-1" />
              {website.viewCount}
            </span>
            <span>{likeCount} 点赞</span>
            {website.score && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                热度: {Math.round(website.score)}
              </span>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                }`}
              >
                <Icon name="heart" className={isLiked ? "fill-current" : ""} />
              </button>
              
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked 
                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                    : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 dark:text-slate-500 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/20'
                }`}
              >
                <Icon name="bookmark" className={isBookmarked ? "fill-current" : ""} />
              </button>
              
              {/* 外部链接按钮 */}
              <a
                href={website.url}
                target="_blank"
                rel={getRelAttribute(website)}
                onClick={(e) => {
                  e.stopPropagation();
                  // 简单的点击追踪
                  fetch(`/api/websites/${website.id}/track-click`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ linkType: 'main' })
                  }).catch(() => {});
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                title={`访问网站${getSEOBadge(website)}`}
              >
                <Icon name="externalLink" />
              </a>
              
              {/* 源码链接按钮 */}
              {website.sourceUrl && (
                <a
                  href={website.sourceUrl}
                  target="_blank"
                  rel={getRelAttribute(website)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 简单的点击追踪
                    fetch(`/api/websites/${website.id}/track-click`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ linkType: 'source' })
                    }).catch(() => {});
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-gray-600 hover:bg-gray-50 dark:text-slate-500 dark:hover:text-gray-400 dark:hover:bg-gray-900/20 transition-colors"
                  title="查看源码"
                >
                  <Icon name="code" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}