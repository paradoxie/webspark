import WebsiteCard from './WebsiteCard';

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

interface WebsiteGridProps {
  websites: Website[];
  className?: string;
  showActions?: boolean;
  onLike?: (websiteId: number) => void;
  onBookmark?: (websiteId: number) => void;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}

export default function WebsiteGrid({
  websites,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  showActions = true,
  onLike,
  onBookmark,
  emptyStateMessage = "暂无作品",
  emptyStateDescription = "还没有作品发布，快来分享你的作品吧！"
}: WebsiteGridProps) {
  if (websites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-6xl mb-4">📝</div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">{emptyStateMessage}</h3>
        <p className="text-slate-600">{emptyStateDescription}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {websites.map((website) => (
        <WebsiteCard
          key={website.id}
          website={website}
          showActions={showActions}
          onLike={onLike}
          onBookmark={onBookmark}
        />
      ))}
    </div>
  );
}