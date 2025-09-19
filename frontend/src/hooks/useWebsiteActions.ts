'use client';

import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Website {
  id: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount: number;
}

interface UseWebsiteActionsProps<T extends Website> {
  websites: T[];
  setWebsites: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useWebsiteActions<T extends Website>({ websites, setWebsites }: UseWebsiteActionsProps<T>) {
  const { data: session } = useSession();

  const handleLike = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.action === 'like' ? '点赞成功！' : '已取消点赞');
        
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isLiked: result.action === 'like', 
                  likeCount: result.likeCount || site.likeCount + (result.action === 'like' ? 1 : -1)
                }
              : site
          )
        );
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('点赞失败，请重试');
    }
  };

  const handleBookmark = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.action === 'bookmark' ? '收藏成功！' : '已取消收藏');
        
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isBookmarked: result.action === 'bookmark'
                }
              : site
          )
        );
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      toast.error('收藏失败，请重试');
    }
  };

  return {
    handleLike,
    handleBookmark,
    isAuthenticated: !!session
  };
}