'use client';

import { useState, useEffect } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import WebsiteGrid from '@/components/common/WebsiteGrid';
import LoadingGrid from '@/components/common/LoadingGrid';
import { useWebsiteActions } from '@/hooks/useWebsiteActions';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  likeCount: number;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
}

export default function FeaturedWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { handleLike, handleBookmark } = useWebsiteActions({ websites, setWebsites });

  useEffect(() => {
    const fetchFeaturedWebsites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/websites/featured');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured websites');
        }

        const data = await response.json();
        setWebsites(data.data);
      } catch (err) {
        console.error('Error fetching featured websites:', err);
        setError('加载精选作品失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedWebsites();
  }, []);


  if (loading) {
    return (
      <div className="mb-16">
        <SectionHeader 
          title="精选作品" 
          description="发现来自全球开发者的优秀作品" 
        />
        <LoadingGrid 
          count={3} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          cardClassName="bg-white rounded-xl shadow-md p-6 animate-pulse"
        />
      </div>
    );
  }

  if (error || websites.length === 0) {
    return null; // 如果加载失败或没有精选作品，不显示此部分
  }

  return (
    <div className="mb-16">
      <SectionHeader 
        title="精选作品" 
        description="发现来自全球开发者的优秀作品" 
      />
      <WebsiteGrid 
        websites={websites}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        onLike={handleLike}
        onBookmark={handleBookmark}
      />
    </div>
  );
} 