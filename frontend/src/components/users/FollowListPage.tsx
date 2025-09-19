'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import UserCard from '@/components/common/UserCard';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import SectionHeader from '@/components/common/SectionHeader';
import toast from 'react-hot-toast';

interface UserData {
  id: number;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  _count: {
    websites: number;
    followers: number;
  };
}

interface FollowListData {
  data: {
    following?: UserData[];
    followers?: UserData[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  };
}

interface FollowListPageProps {
  type: 'following' | 'followers';
}

export default function FollowListPage({ type }: FollowListPageProps) {
  const params = useParams();
  const userId = params?.userId as string;

  const [listData, setListData] = useState<FollowListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (userId) {
      fetchFollowList(1);
    }
  }, [userId, type]);

  const fetchFollowList = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/${type}?page=${page}&pageSize=20`);

      if (response.ok) {
        const data = await response.json();
        setListData(data);
        setCurrentPage(page);
      } else {
        toast.error(`获取${type === 'following' ? '关注' : '粉丝'}列表失败`);
      }
    } catch (error) {
      console.error(`获取${type}列表失败:`, error);
      toast.error(`获取${type === 'following' ? '关注' : '粉丝'}列表失败`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchFollowList(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFollowChange = (targetUserId: number, isFollowing: boolean) => {
    // 更新本地状态（可选）
    // 这里可以实现更复杂的状态更新逻辑
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/6 mb-3"></div>
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listData || !listData.data) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="⚠️"
            title="加载失败"
            description="无法获取用户信息，请稍后重试"
          />
        </div>
      </div>
    );
  }

  const users = type === 'following' ? listData.data.following : listData.data.followers;
  const title = type === 'following' ? '关注列表' : '粉丝列表';
  const icon = type === 'following' ? '👥' : '💫';
  const emptyMessage = type === 'following' ? '还没有关注任何用户' : '还没有粉丝';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={title}
          description={`共 ${listData.data.meta.pagination.total} 个用户`}
          icon={icon}
        />

        {!users || users.length === 0 ? (
          <EmptyState
            icon="👤"
            title={emptyMessage}
            description="快去发现更多有趣的用户吧"
            action={
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  发现用户
                </a>
              </div>
            }
          />
        ) : (
          <>
            {/* 用户列表 */}
            <div className="space-y-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  showFollowButton={true}
                  onFollowChange={handleFollowChange}
                />
              ))}
            </div>

            {/* 分页 */}
            {listData.data.meta.pagination.pageCount > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={listData.data.meta.pagination.page}
                  totalPages={listData.data.meta.pagination.pageCount}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}