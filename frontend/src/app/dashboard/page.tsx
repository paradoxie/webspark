'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface UserStats {
  totalWorks: number;
  totalLikes: number;
  totalViews: number;
  totalBookmarks: number;
  monthlyViews: number;
  weeklyLikes: number;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  url: string;
  screenshot?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  likeCount: number;
  viewCount: number;
  createdAt: string;
  tags: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userWorks, setUserWorks] = useState<Website[]>([]);
  const [bookmarkedWorks, setBookmarkedWorks] = useState<Website[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 如果用户未登录，重定向到登录页面
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用加载用户数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟用户统计数据
      setUserStats({
        totalWorks: 8,
        totalLikes: 324,
        totalViews: 12567,
        totalBookmarks: 156,
        monthlyViews: 2456,
        weeklyLikes: 89
      });

      // 模拟用户作品数据
      setUserWorks([
        {
          id: 1,
          title: 'React 任务管理应用',
          slug: 'react-task-manager',
          shortDescription: '一个现代化的任务管理工具，支持拖拽、分类和团队协作',
          url: 'https://react-tasks.demo.com',
          screenshot: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
          status: 'APPROVED',
          likeCount: 89,
          viewCount: 1234,
          createdAt: '2024-01-15',
          tags: [
            { id: 1, name: 'React', color: 'blue' },
            { id: 2, name: 'TypeScript', color: 'blue' },
            { id: 3, name: 'Productivity', color: 'green' }
          ]
        },
        {
          id: 2,
          title: 'Vue.js 电商平台',
          slug: 'vue-ecommerce',
          shortDescription: '功能完整的电商解决方案，包含购物车、支付和用户管理',
          url: 'https://vue-shop.demo.com',
          screenshot: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
          status: 'PENDING',
          likeCount: 156,
          viewCount: 2341,
          createdAt: '2024-01-10',
          tags: [
            { id: 4, name: 'Vue.js', color: 'green' },
            { id: 5, name: 'E-commerce', color: 'purple' },
            { id: 6, name: 'Nuxt.js', color: 'green' }
          ]
        },
        {
          id: 3,
          title: 'Next.js 博客系统',
          slug: 'nextjs-blog',
          shortDescription: '基于Next.js和MDX的现代博客平台，支持深色模式',
          url: 'https://nextjs-blog.demo.com',
          status: 'REJECTED',
          likeCount: 78,
          viewCount: 987,
          createdAt: '2024-01-05',
          tags: [
            { id: 7, name: 'Next.js', color: 'black' },
            { id: 8, name: 'MDX', color: 'orange' },
            { id: 9, name: 'Blog', color: 'gray' }
          ]
        }
      ]);

      // 模拟收藏的作品
      setBookmarkedWorks([
        {
          id: 101,
          title: 'AI 聊天机器人',
          slug: 'ai-chatbot',
          shortDescription: '基于GPT的智能对话系统',
          url: 'https://ai-chat.demo.com',
          screenshot: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          status: 'APPROVED',
          likeCount: 456,
          viewCount: 8901,
          createdAt: '2024-01-12',
          tags: [
            { id: 10, name: 'AI', color: 'purple' },
            { id: 11, name: 'ChatGPT', color: 'green' }
          ]
        }
      ]);

      // 模拟成就数据
      setAchievements([
        {
          id: 'first_submission',
          title: '初来乍到',
          description: '提交你的第一个作品',
          icon: '🚀',
          unlocked: true,
          unlockedAt: '2024-01-05'
        },
        {
          id: 'popular_creator',
          title: '人气创作者',
          description: '获得100个点赞',
          icon: '⭐',
          unlocked: true,
          unlockedAt: '2024-01-15'
        },
        {
          id: 'prolific_creator',
          title: '多产创作者',
          description: '提交10个作品',
          icon: '🏆',
          unlocked: false,
          progress: 8,
          target: 10
        },
        {
          id: 'viral_hit',
          title: '病毒式传播',
          description: '单个作品获得1000个浏览',
          icon: '🔥',
          unlocked: false,
          progress: 1234,
          target: 1000
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: { 
        label: '审核中', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      APPROVED: { 
        label: '已通过', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      REJECTED: { 
        label: '未通过', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      }
    };
    
    const config = configs[status as keyof typeof configs];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTagStyle = (color?: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200',
      black: 'bg-gray-100 text-gray-900 border-gray-300'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <img
                src={session?.user?.image || '/placeholder-avatar.png'}
                alt={session?.user?.name || 'User'}
                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  欢迎回来，{session?.user?.name}! 👋
                </h1>
                <p className="text-slate-600">管理你的作品和跟踪你的创作历程</p>
              </div>
            </div>
            <Link
              href="/submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              + 提交新作品
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 导航标签 */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'overview', label: '概览', icon: '📊' },
              { id: 'works', label: '我的作品', icon: '🎨' },
              { id: 'bookmarks', label: '我的收藏', icon: '🔖' },
              { id: 'achievements', label: '成就', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: '总作品数', 
                  value: userStats?.totalWorks || 0, 
                  icon: '🎨',
                  color: 'from-blue-500 to-blue-600',
                  change: '+2 本月'
                },
                { 
                  title: '总点赞数', 
                  value: userStats?.totalLikes || 0, 
                  icon: '❤️',
                  color: 'from-red-500 to-red-600',
                  change: `+${userStats?.weeklyLikes || 0} 本周`
                },
                { 
                  title: '总浏览量', 
                  value: userStats?.totalViews || 0, 
                  icon: '👁️',
                  color: 'from-green-500 to-green-600',
                  change: `+${userStats?.monthlyViews || 0} 本月`
                },
                { 
                  title: '收藏数', 
                  value: userStats?.totalBookmarks || 0, 
                  icon: '🔖',
                  color: 'from-purple-500 to-purple-600',
                  change: '+12 本月'
                }
              ].map((stat, index) => (
                <div 
                  key={stat.title}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                      {stat.icon}
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {stat.change}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 最近活动 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 最新作品 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">🎨 最新作品</h3>
                  <Link 
                    href="#" 
                    onClick={() => setActiveTab('works')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    查看全部
                  </Link>
                </div>
                <div className="space-y-4">
                  {userWorks.slice(0, 3).map((work) => (
                    <div key={work.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                      <img
                        src={work.screenshot}
                        alt={work.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{work.title}</p>
                        <p className="text-sm text-slate-600">{formatDate(work.createdAt)}</p>
                      </div>
                      {getStatusBadge(work.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* 成就进度 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">🏆 成就进度</h3>
                  <Link 
                    href="#" 
                    onClick={() => setActiveTab('achievements')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    查看全部
                  </Link>
                </div>
                <div className="space-y-4">
                  {achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-4 p-3 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${achievement.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                          {achievement.title}
                        </p>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                        {!achievement.unlocked && achievement.progress && achievement.target && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>{achievement.progress}</span>
                              <span>{achievement.target}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 我的作品页面 */}
        {activeTab === 'works' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">我的作品</h2>
              <div className="flex space-x-2">
                <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>全部状态</option>
                  <option>审核中</option>
                  <option>已通过</option>
                  <option>未通过</option>
                </select>
                <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>最新优先</option>
                  <option>最热优先</option>
                  <option>浏览最多</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userWorks.map((work, index) => (
                <div 
                  key={work.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                    {work.screenshot ? (
                      <img
                        src={work.screenshot}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(work.status)}
                    </div>
                    <div className="absolute top-4 right-4">
                      <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200">
                        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1">
                      {work.title}
                    </h3>

                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {work.shortDescription}
                    </p>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{work.likeCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{work.viewCount}</span>
                      </span>
                      <span>{formatDate(work.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {work.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTagStyle(tag.color)}`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Link
                        href={`/sites/${work.slug}`}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl text-center hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                      >
                        查看详情
                      </Link>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors duration-200">
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我的收藏页面 */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">我的收藏</h2>
              <p className="text-slate-600">{bookmarkedWorks.length} 个收藏作品</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedWorks.map((work, index) => (
                <div 
                  key={work.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                    <img
                      src={work.screenshot}
                      alt={work.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1">
                      {work.title}
                    </h3>

                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {work.shortDescription}
                    </p>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{work.likeCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{work.viewCount}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {work.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTagStyle(tag.color)}`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/sites/${work.slug}`}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl text-center hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 成就页面 */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">🏆 我的成就</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                解锁成就，展示你的创作历程和技能成长。每个里程碑都代表着你在WebSpark社区的贡献！
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 animate-fade-in-up ${
                    achievement.unlocked
                      ? 'border-yellow-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-white'
                      : 'border-slate-200 shadow-md hover:shadow-lg'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {achievement.unlocked && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  <div className="text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg scale-110'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {achievement.icon}
                    </div>

                    <div className="space-y-2">
                      <h3 className={`text-xl font-bold ${
                        achievement.unlocked ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                        {achievement.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>

                    {achievement.unlocked ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          ✅ 已解锁
                        </div>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-slate-500">
                            解锁时间：{formatDate(achievement.unlockedAt)}
                          </p>
                        )}
                      </div>
                    ) : achievement.progress && achievement.target ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-slate-600">
                            <span>进度</span>
                            <span>{achievement.progress} / {achievement.target}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center text-slate-500">
                            {Math.round((achievement.progress / achievement.target) * 100)}% 完成
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-sm">
                        🔒 未解锁
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 