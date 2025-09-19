'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  userId: number;
  username: string;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  username,
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (session?.user && userId) {
      checkFollowStatus();
    }
  }, [session, userId]);

  const checkFollowStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/api/users/${userId}/follow-status`);

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.data.isFollowing);

        // 如果是自己，不显示关注按钮
        if (data.data.isSelf) {
          setChecking(false);
          return;
        }
      }
    } catch (error) {
      console.error('检查关注状态失败:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (!session?.user) {
      toast.error('请先登录');
      return;
    }

    try {
      setLoading(true);

      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);

        toast.success(data.message || (newFollowState ? '关注成功' : '取消关注成功'));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '操作失败');
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      toast.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查状态或者是自己，不显示按钮
  if (checking || !session?.user || session.user.id === userId) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isFollowing
          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 focus:ring-slate-500'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {isFollowing ? '取消中...' : '关注中...'}
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <span className="mr-2">✓</span>
              已关注
            </>
          ) : (
            <>
              <span className="mr-2">+</span>
              关注
            </>
          )}
        </>
      )}
    </button>
  );
}