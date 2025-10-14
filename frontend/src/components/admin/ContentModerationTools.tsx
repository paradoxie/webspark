'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, XCircle, AlertCircle, Clock, Star, 
  Filter, Search, ChevronDown, Eye, Edit, Trash2,
  MessageSquare, Flag, TrendingUp, Users, BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface ModerationItem {
  id: number
  type: 'website' | 'comment' | 'report'
  title: string
  content?: string
  author: {
    id: number
    name: string
    username: string
    avatar?: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  createdAt: string
  category?: string
  tags?: string[]
  reportCount?: number
  aiScore?: number // AI审核评分
  riskFactors?: string[]
}

interface ModerationStats {
  pending: number
  approved: number
  rejected: number
  flagged: number
  todayProcessed: number
  avgResponseTime: string
}

/**
 * 内容审核工具组件
 * 提供高效的批量审核和智能辅助功能
 */
export default function ContentModerationTools() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadModerationItems()
    loadStats()
  }, [filter, currentPage])

  const loadModerationItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filter,
        page: currentPage.toString(),
        pageSize: '20',
        q: searchQuery
      })

      const response = await fetch(`/api/admin/moderation?${params}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to load moderation items')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleApprove = async (ids: number[]) => {
    try {
      const response = await fetch('/api/admin/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      if (response.ok) {
        toast.success(`${ids.length} item(s) approved`)
        setItems(items.filter(item => !ids.includes(item.id)))
        setSelectedItems([])
        loadStats()
      }
    } catch (error) {
      toast.error('Failed to approve items')
    }
  }

  const handleReject = async (ids: number[], reason?: string) => {
    try {
      const response = await fetch('/api/admin/moderation/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, reason })
      })

      if (response.ok) {
        toast.success(`${ids.length} item(s) rejected`)
        setItems(items.filter(item => !ids.includes(item.id)))
        setSelectedItems([])
        loadStats()
      }
    } catch (error) {
      toast.error('Failed to reject items')
    }
  }

  const handleFlag = async (id: number, reason: string) => {
    try {
      const response = await fetch(`/api/admin/moderation/${id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success('Item flagged for review')
        const updatedItems = items.map(item => 
          item.id === id ? { ...item, status: 'flagged' as const } : item
        )
        setItems(updatedItems)
      }
    } catch (error) {
      toast.error('Failed to flag item')
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const getRiskLevelColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-red-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getRiskLevelText = (score?: number) => {
    if (!score) return 'Unknown'
    if (score >= 80) return 'High Risk'
    if (score >= 50) return 'Medium Risk'
    return 'Low Risk'
  }

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Clock className="w-5 h-5 text-yellow-500" />}
            label="待审核"
            value={stats.pending}
            trend={stats.pending > 0 ? 'up' : 'stable'}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            label="已通过"
            value={stats.approved}
          />
          <StatCard
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            label="已拒绝"
            value={stats.rejected}
          />
          <StatCard
            icon={<Flag className="w-5 h-5 text-orange-500" />}
            label="已标记"
            value={stats.flagged}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
            label="今日处理"
            value={stats.todayProcessed}
            extra={`平均 ${stats.avgResponseTime}`}
          />
        </div>
      )}

      {/* 工具栏 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索内容、作者、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadModerationItems()}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 筛选器 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              待审核
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'flagged' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              已标记
            </button>
          </div>

          {/* 批量操作 */}
          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(selectedItems)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                批准 ({selectedItems.length})
              </button>
              <button
                onClick={() => handleReject(selectedItems)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                拒绝 ({selectedItems.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 内容列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        {/* 表头 */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedItems.length === items.length && items.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              选择全部
            </span>
          </div>
        </div>

        {/* 列表内容 */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              没有待审核的内容
            </div>
          ) : (
            items.map(item => (
              <ModerationItemRow
                key={item.id}
                item={item}
                selected={selectedItems.includes(item.id)}
                onToggleSelect={() => toggleSelectItem(item.id)}
                onApprove={() => handleApprove([item.id])}
                onReject={() => handleReject([item.id])}
                onFlag={(reason) => handleFlag(item.id, reason)}
                getRiskLevelColor={getRiskLevelColor}
                getRiskLevelText={getRiskLevelText}
              />
            ))
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 统计卡片组件
function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  extra 
}: {
  icon: React.ReactNode
  label: string
  value: number
  trend?: 'up' | 'down' | 'stable'
  extra?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {icon}
        </div>
        {trend && (
          <TrendingUp className={`w-4 h-4 ${
            trend === 'up' ? 'text-red-500' : 
            trend === 'down' ? 'text-green-500' : 
            'text-slate-400'
          }`} />
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      {extra && (
        <div className="text-xs text-slate-500 mt-1">{extra}</div>
      )}
    </div>
  )
}

// 审核项行组件
function ModerationItemRow({ 
  item, 
  selected, 
  onToggleSelect, 
  onApprove, 
  onReject, 
  onFlag,
  getRiskLevelColor,
  getRiskLevelText 
}: any) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-500 mt-1"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {item.author.name}
                </span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                {item.category && <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">{item.category}</span>}
              </div>
            </div>
            
            {/* AI风险评分 */}
            {item.aiScore !== undefined && (
              <div className="text-right">
                <div className={`font-semibold ${getRiskLevelColor(item.aiScore)}`}>
                  {getRiskLevelText(item.aiScore)}
                </div>
                <div className="text-sm text-slate-500">AI Score: {item.aiScore}%</div>
              </div>
            )}
          </div>

          {/* 内容预览 */}
          {item.content && (
            <p className="text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
              {item.content}
            </p>
          )}

          {/* 风险因素 */}
          {item.riskFactors && item.riskFactors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.riskFactors.map((factor, index) => (
                <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm">
                  {factor}
                </span>
              ))}
            </div>
          )}

          {/* 标签 */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              批准
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1 text-sm"
            >
              <XCircle className="w-4 h-4" />
              拒绝
            </button>
            <button
              onClick={() => onFlag('需要人工复核')}
              className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1 text-sm"
            >
              <Flag className="w-4 h-4" />
              标记
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
            >
              <Eye className="w-4 h-4" />
              详情
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
