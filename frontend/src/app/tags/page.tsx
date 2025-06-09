'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  websiteCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // 这里应该从API获取标签数据
    // 暂时使用模拟数据
    setTimeout(() => {
      setTags([
        {
          id: 1,
          name: 'React',
          slug: 'react',
          description: '使用React构建的应用',
          color: '#61DAFB',
          websiteCount: 45,
        },
        {
          id: 2,
          name: 'Vue.js',
          slug: 'vuejs',
          description: '使用Vue.js构建的应用',
          color: '#4FC08D',
          websiteCount: 32,
        },
        {
          id: 3,
          name: 'Next.js',
          slug: 'nextjs',
          description: '使用Next.js构建的应用',
          color: '#000000',
          websiteCount: 28,
        },
        {
          id: 4,
          name: 'TypeScript',
          slug: 'typescript',
          description: 'TypeScript开发的项目',
          color: '#3178C6',
          websiteCount: 67,
        },
        {
          id: 5,
          name: '个人作品集',
          slug: 'portfolio',
          description: '个人展示网站和作品集',
          websiteCount: 89,
        },
        {
          id: 6,
          name: '工具应用',
          slug: 'tools',
          description: '实用的在线工具',
          websiteCount: 23,
        },
        {
          id: 7,
          name: '游戏',
          slug: 'games',
          description: 'Web游戏和娱乐应用',
          websiteCount: 15,
        },
        {
          id: 8,
          name: '数据可视化',
          slug: 'data-visualization',
          description: '图表、仪表板等可视化项目',
          websiteCount: 19,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTagStyle = (color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            分类标签
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            按技术栈、类型和主题浏览作品。点击标签查看相关的所有作品。
          </p>
        </div>

        {/* 搜索框 */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">{tags.length}</div>
              <div className="text-sm text-slate-600">总标签数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {tags.reduce((sum, tag) => sum + tag.websiteCount, 0)}
              </div>
              <div className="text-sm text-slate-600">总作品数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(tags.reduce((sum, tag) => sum + tag.websiteCount, 0) / tags.length)}
              </div>
              <div className="text-sm text-slate-600">平均作品数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {filteredTags.length}
              </div>
              <div className="text-sm text-slate-600">搜索结果</div>
            </div>
          </div>
        </div>

        {/* 标签网格 */}
        {filteredTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                    style={getTagStyle(tag.color)}
                  >
                    {tag.name}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {tag.websiteCount}
                  </span>
                </div>
                
                {tag.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {tag.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {tag.websiteCount} 个作品
                  </span>
                  <svg
                    className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-8v.01"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              没有找到相关标签
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              尝试调整搜索关键词
            </p>
          </div>
        )}

        {/* 热门标签部分 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            热门标签
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {tags
              .sort((a, b) => b.websiteCount - a.websiteCount)
              .slice(0, 10)
              .map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow border border-slate-200 hover:border-blue-300"
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  ></span>
                  <span className="text-sm font-medium text-slate-700">
                    {tag.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {tag.websiteCount}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 