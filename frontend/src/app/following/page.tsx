'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import WebsiteGrid from '@/components/common/WebsiteGrid';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import LoadingGrid from '@/components/common/LoadingGrid';
import SectionHeader from '@/components/common/SectionHeader';
import toast from 'react-hot-toast';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  screenshots: string[];
  likeCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
  _count: {
    comments: number;
    likedBy: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
}

interface FollowingFeedData {
  data: Website[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export default function FollowingFeedPage() {
  const { data: session } = useSession();
  const [feedData, setFeedData] = useState<FollowingFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (session?.user) {
      fetchFollowingFeed(1);
    }
  }, [session]);

  const fetchFollowingFeed = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/me/following-feed?page=${page}&pageSize=12`);

      if (response.ok) {
        const data = await response.json();
        setFeedData(data);
        setCurrentPage(page);
      } else {
        toast.error('获取关注动态失败');
      }
    } catch (error) {
      console.error('获取关注动态失败:', error);
      toast.error('获取关注动态失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchFollowingFeed(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="👋"
            title="需要登录"
            description="请先登录查看关注用户的最新作品"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="关注动态"
            description="查看你关注的用户发布的最新作品"
            icon="📰"
          />
          <LoadingGrid />
        </div>
      </div>
    );
  }

  if (!feedData || feedData.data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="关注动态"
            description="查看你关注的用户发布的最新作品"
            icon="📰"
          />
          <EmptyState
            icon="📭"
            title="暂无动态"
            description="你关注的用户还没有发布作品，或者你还没有关注任何用户"
            action={
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  发现精彩作品
                </a>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="关注动态"
          description="查看你关注的用户发布的最新作品"
          icon="📰"
        />

        {/* 统计信息 */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                最新动态
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                共 {feedData.meta.pagination.total} 个作品来自你关注的用户
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">
                第 {feedData.meta.pagination.page} 页，共 {feedData.meta.pagination.pageCount} 页
              </div>
            </div>
          </div>
        </div>

        {/* 作品网格 */}
        <WebsiteGrid websites={feedData.data} />

        {/* 分页 */}
        {feedData.meta.pagination.pageCount > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={feedData.meta.pagination.page}
              totalPages={feedData.meta.pagination.pageCount}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}