'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/common/ImageUpload';

interface UserProfile {
  id: number;
  username: string;
  name: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  github: string | null;
}

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    setSaving(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          website: profile.website,
          location: profile.location,
        }),
      });

      if (response.ok) {
        toast.success('个人资料更新成功！');
        // 更新会话中的用户信息
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profile.name,
            image: profile.avatar,
          },
        });
        router.push('/dashboard');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (avatarUrl: string) => {
    setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
    toast.success('头像上传成功！');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">未找到用户信息</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            返回控制台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">编辑个人资料</h1>
            <p className="text-slate-600 mt-1">更新你的个人信息和头像</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* 头像上传 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                头像
              </label>
              <ImageUpload
                type="avatar"
                currentImage={profile.avatar || undefined}
                onUpload={handleAvatarUpload}
                className="max-w-sm"
              />
            </div>

            {/* 用户名（只读） */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">用户名无法修改</p>
            </div>

            {/* 邮箱（只读） */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                邮箱
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">邮箱无法修改</p>
            </div>

            {/* 显示名称 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                显示名称
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入你的显示名称"
              />
            </div>

            {/* 个人简介 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                个人简介
              </label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="介绍一下你自己..."
              />
            </div>

            {/* 个人网站 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                个人网站
              </label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, website: e.target.value } : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://your-website.com"
              />
            </div>

            {/* 地理位置 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                地理位置
              </label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="北京, 中国"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{saving ? '保存中...' : '保存更改'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}