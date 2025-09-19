'use client';

import Link from 'next/link';
import Image from 'next/image';
import FollowButton from './FollowButton';

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

interface UserCardProps {
  user: UserData;
  showFollowButton?: boolean;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
}

export default function UserCard({
  user,
  showFollowButton = true,
  onFollowChange
}: UserCardProps) {
  const handleFollowChange = (isFollowing: boolean) => {
    onFollowChange?.(user.id, isFollowing);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* 用户头像 */}
        <Link href={`/users/${user.username}`}>
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || user.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-semibold">
                {(user.name || user.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* 用户信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/users/${user.username}`}>
                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                  {user.name || user.username}
                </h3>
              </Link>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>

            {/* 关注按钮 */}
            {showFollowButton && (
              <FollowButton
                userId={user.id}
                username={user.username}
                onFollowChange={handleFollowChange}
                className="ml-4"
              />
            )}
          </div>

          {/* 用户简介 */}
          {user.bio && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* 统计信息 */}
          <div className="mt-3 flex items-center space-x-6 text-sm text-slate-500">
            <div className="flex items-center">
              <span className="text-base mr-1">🎨</span>
              <span className="font-medium text-slate-900">{user._count.websites}</span>
              <span className="ml-1">作品</span>
            </div>
            <div className="flex items-center">
              <span className="text-base mr-1">👥</span>
              <span className="font-medium text-slate-900">{user._count.followers}</span>
              <span className="ml-1">粉丝</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}