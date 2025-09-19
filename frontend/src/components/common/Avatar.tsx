import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
  onClick?: () => void;
  showRing?: boolean;
  status?: 'online' | 'offline' | 'away';
}

export default function Avatar({
  src,
  alt,
  size = 'md',
  className,
  fallback,
  onClick,
  showRing = false,
  status
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const ringSizes = {
    xs: 'ring-1',
    sm: 'ring-1',
    md: 'ring-2',
    lg: 'ring-2',
    xl: 'ring-4'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-slate-400',
    away: 'bg-yellow-400'
  };

  const avatarClasses = cn(
    'rounded-full object-cover',
    sizes[size],
    showRing && `${ringSizes[size]} ring-slate-200`,
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  // 生成fallback文字（取名字首字母）
  const getFallbackText = () => {
    if (fallback) return fallback;
    return alt.charAt(0).toUpperCase();
  };

  const avatarSrc = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=e2e8f0&color=475569&size=128`;

  return (
    <div className="relative inline-block">
      <Image
        src={avatarSrc}
        alt={alt}
        width={128}
        height={128}
        className={avatarClasses}
        onClick={onClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=e2e8f0&color=475569&size=128`;
        }}
      />
      
      {/* 状态指示器 */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}