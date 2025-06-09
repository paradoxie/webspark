'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  sourceUrl?: string;
  shortDescription: string;
  description: string;
  screenshot?: string;
  likeCount: number;
  viewCount: number;
  featured: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
    bio?: string;
    website?: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
}

export default function SiteDetailPage() {
  const params = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [relatedSites, setRelatedSites] = useState<Website[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      const mockWebsite: Website = {
        id: 1,
        title: '🎨 NextDesign - 现代化设计系统',
        slug: 'next-design-system',
        url: 'https://example.com',
        sourceUrl: 'https://github.com/example/next-design',
        shortDescription: '为现代Web应用打造的完整设计系统，包含400+组件和深色模式支持',
        description: `# NextDesign 设计系统

这是一个为现代Web应用精心打造的完整设计系统。我们的目标是提供一套一致、美观且易于使用的UI组件库。

## 🌟 主要特性

- **400+ 组件**: 涵盖所有常用的UI需求
- **深色模式**: 原生支持深浅色主题切换
- **TypeScript**: 完整的类型定义支持
- **响应式设计**: 完美适配各种屏幕尺寸
- **Accessibility**: 遵循WCAG 2.1标准

## 🛠️ 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Storybook

## 📦 安装使用

\`\`\`bash
npm install @next-design/core
\`\`\`

## 🎯 设计理念

我们的设计理念是"简约而不简单"，每个组件都经过精心设计和反复测试，确保在提供强大功能的同时保持简洁的API。`,
        screenshot: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop',
        likeCount: 245,
        viewCount: 1856,
        featured: true,
        createdAt: '2024-01-15T10:00:00Z',
        author: { 
          id: 1, 
          username: 'design_master', 
          avatar: 'https://i.pravatar.cc/150?img=1',
          bio: '专注于用户体验和界面设计的前端工程师，拥有8年的设计经验',
          website: 'https://designmaster.dev'
        },
        tags: [
          { id: 1, name: 'React', slug: 'react', color: '#61DAFB' },
          { id: 2, name: '设计系统', slug: 'design-system', color: '#FF6B6B' },
          { id: 3, name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
          { id: 4, name: 'Tailwind CSS', slug: 'tailwind', color: '#06B6D4' },
        ],
      };

      const mockRelated: Website[] = [
        {
          id: 2,
          title: '⚡ FastAPI Dashboard',
          slug: 'fastapi-dashboard',
          url: 'https://example2.com',
          shortDescription: '高性能的实时数据可视化仪表板',
          description: '',
          screenshot: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          likeCount: 189,
          viewCount: 1234,
          featured: true,
          createdAt: '2024-01-14T15:30:00Z',
          author: { id: 2, username: 'data_wizard', avatar: 'https://i.pravatar.cc/150?img=2' },
          tags: [
            { id: 3, name: 'Vue.js', slug: 'vue', color: '#4FC08D' },
            { id: 4, name: '数据可视化', slug: 'data-viz', color: '#9B59B6' },
          ],
        },
        {
          id: 3,
          title: '🚀 AI代码助手',
          slug: 'ai-code-assistant',
          url: 'https://example3.com',
          shortDescription: '基于GPT-4的智能代码生成工具',
          description: '',
          screenshot: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
          likeCount: 321,
          viewCount: 2847,
          featured: true,
          createdAt: '2024-01-13T09:15:00Z',
          author: { id: 3, username: 'ai_innovator', avatar: 'https://i.pravatar.cc/150?img=3' },
          tags: [
            { id: 5, name: 'AI', slug: 'ai', color: '#E74C3C' },
            { id: 6, name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
          ],
        },
      ];

      setWebsite(mockWebsite);
      setRelatedSites(mockRelated);
      setLoading(false);
    }, 1000);
  }, [params.slug]);

  const getTagStyle = (color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      };
    }
    return {};
  };

  const handleLike = () => {
    setLiked(!liked);
    // 这里应该调用API
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    // 这里应该调用API
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.15s', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">正在加载作品详情...</p>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">作品未找到</h1>
          <Link href="/sites" className="text-blue-600 hover:text-blue-700 underline">
            返回作品列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-8 animate-fade-in-up">
          <Link href="/" className="hover:text-blue-600 transition-colors">首页</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/sites" className="hover:text-blue-600 transition-colors">作品展示</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-800 font-medium">{website.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 作品头部 */}
            <div className="glass-card p-8 rounded-3xl animate-fade-in-up">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
                    {website.title}
                  </h1>
                  <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                    {website.shortDescription}
                  </p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {website.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.slug}`}
                        className="px-3 py-1 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-105"
                        style={getTagStyle(tag.color)}
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-4">
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>访问网站</span>
                    </a>
                    
                    {website.sourceUrl && (
                      <a
                        href={website.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 glass-card text-slate-700 font-semibold rounded-xl hover:bg-white/60 transition-all duration-300 space-x-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>源代码</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 作品截图 */}
            <div className="glass-card p-4 rounded-3xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={website.screenshot}
                  alt={website.title}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white/90 backdrop-blur-sm text-slate-800 font-semibold rounded-xl hover:bg-white transition-colors"
                  >
                    在新标签页打开
                  </a>
                </div>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="glass-card p-8 rounded-3xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">项目介绍</h2>
              <div className="prose prose-slate max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                  {website.description}
                </pre>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 作者信息 */}
            <div className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">👨‍💻 作者</h3>
              <div className="flex items-start space-x-4">
                <img
                  src={website.author.avatar}
                  alt={website.author.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="text-slate-800 font-semibold">{website.author.username}</h4>
                  {website.author.bio && (
                    <p className="text-sm text-slate-600 mt-1">{website.author.bio}</p>
                  )}
                  {website.author.website && (
                    <a
                      href={website.author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                    >
                      个人网站 →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 统计</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">👀 浏览量</span>
                  <span className="font-semibold text-slate-800">{website.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">❤️ 点赞数</span>
                  <span className="font-semibold text-slate-800">{website.likeCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">📅 发布时间</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(website.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 互动按钮 */}
            <div className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💝 互动</h3>
              <div className="space-y-3">
                <button
                  onClick={handleLike}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    liked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{liked ? '已点赞' : '点赞'}</span>
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    bookmarked 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{bookmarked ? '已收藏' : '收藏'}</span>
                </button>
                
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-semibold transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>举报</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 相关作品 */}
        {relatedSites.length > 0 && (
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <h2 className="text-2xl font-bold text-slate-800 mb-8">🔗 相关作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedSites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.slug}`}
                  className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={site.screenshot}
                      alt={site.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                      {site.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {site.shortDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={site.author.avatar}
                          alt={site.author.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-slate-600 font-medium">
                          {site.author.username}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {site.likeCount} 赞
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 