'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  color?: string
  websiteCount: number
}

interface TagsSearchClientProps {
  initialTags: Tag[]
}

export default function TagsSearchClient({ initialTags }: TagsSearchClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTags = initialTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTagStyle = (color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      }
    }
    return {
      backgroundColor: '#F1F5F9',
      borderColor: '#CBD5E1',
      color: '#475569',
    }
  }

  return (
    <>
      {/* 搜索框 */}
      <div className="max-w-md mx-auto mb-12">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
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
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* 搜索结果统计 */}
      {searchTerm && (
        <div className="text-center mb-6">
          <p className="text-slate-600">
            找到 <span className="font-semibold text-slate-900">{filteredTags.length}</span> 个匹配的标签
            {searchTerm && (
              <>
                ，关键词："<span className="font-medium text-blue-600">{searchTerm}</span>"
              </>
            )}
          </p>
        </div>
      )}

      {/* 标签网格 */}
      {filteredTags.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTags.map((tag) => (
            <article key={tag.id}>
              <Link
                href={`/tags/${tag.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 group block h-full transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors group-hover:scale-105"
                    style={getTagStyle(tag.color)}
                  >
                    {tag.name}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tag.websiteCount}
                    </div>
                    <div className="text-xs text-slate-500">作品</div>
                  </div>
                </div>
                
                {tag.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {tag.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {tag.websiteCount} 个作品
                  </span>
                  <svg
                    className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1"
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
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 mb-4"
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
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? '没有找到相关标签' : '暂无标签'}
          </h3>
          <p className="text-slate-500">
            {searchTerm ? '尝试调整搜索关键词' : '标签正在准备中，敬请期待！'}
          </p>
        </div>
      )}
    </>
  )
}