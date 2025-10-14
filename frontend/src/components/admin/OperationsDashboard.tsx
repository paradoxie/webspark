'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Users, FileText, Heart, Eye, 
  AlertCircle, Activity, Cpu, HardDrive, Wifi, Database,
  CheckCircle, XCircle, Clock, BarChart3, Calendar, Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface DashboardData {
  metrics: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    totalWebsites: number
    approvedWebsites: number
    totalInteractions: number
    userGrowthRate: number
    contentGrowthRate: number
    interactionGrowthRate: number
    averageEngagementRate: number
    contentApprovalRate: number
    userRetentionRate: number
  }
  timeSeries: Array<{
    date: string
    users: number
    websites: number
    interactions: number
  }>
  distributions: {
    websitesByCategory: Array<{
      category: string
      count: number
      percentage: number
    }>
  }
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: {
      cpu: number
      memory: number
      disk: number
      responseTime: number
    }
  }
  activityStream: Array<{
    id: string
    type: string
    user: string
    target: string
    timestamp: Date
  }>
  alerts: Array<{
    id: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: Date
    resolved: boolean
  }>
}

export default function OperationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [refreshInterval, setRefreshInterval] = useState(60000) // 1分钟
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    const interval = setInterval(() => {
      loadDashboardData()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [timeRange, refreshInterval])

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`)
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const { metrics, timeSeries, distributions, systemHealth, activityStream, alerts } = data

  // 图表颜色
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="p-6 space-y-6">
      {/* 系统健康状态 */}
      <SystemHealthBar health={systemHealth} />

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          title="总用户数"
          value={metrics.totalUsers}
          change={metrics.userGrowthRate}
          onClick={() => setSelectedMetric('users')}
        />
        <MetricCard
          icon={<FileText className="w-5 h-5" />}
          title="作品总数"
          value={metrics.approvedWebsites}
          change={metrics.contentGrowthRate}
          onClick={() => setSelectedMetric('websites')}
        />
        <MetricCard
          icon={<Heart className="w-5 h-5" />}
          title="总互动数"
          value={metrics.totalInteractions}
          change={metrics.interactionGrowthRate}
          onClick={() => setSelectedMetric('interactions')}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          title="活跃率"
          value={`${metrics.averageEngagementRate.toFixed(1)}%`}
          subtitle="7日平均"
          onClick={() => setSelectedMetric('engagement')}
        />
      </div>

      {/* 时间范围选择 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
        
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
        >
          <option value={30000}>30秒刷新</option>
          <option value={60000}>1分钟刷新</option>
          <option value={300000}>5分钟刷新</option>
          <option value={0}>不自动刷新</option>
        </select>
      </div>

      {/* 主要图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 趋势图 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">增长趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="新用户"
              />
              <Line 
                type="monotone" 
                dataKey="websites" 
                stroke="#10b981" 
                strokeWidth={2}
                name="新作品"
              />
              <Line 
                type="monotone" 
                dataKey="interactions" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="互动数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 分类分布 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">作品分类分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributions.websitesByCategory}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              >
                {distributions.websitesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 留存分析 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">用户留存分析</h3>
          <RetentionChart retentionRate={metrics.userRetentionRate} />
        </div>

        {/* 系统性能 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">系统性能</h3>
          <SystemMetrics metrics={systemHealth.metrics} />
        </div>
      </div>

      {/* 实时活动流和告警 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 实时活动 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">实时活动</h3>
          <ActivityStream activities={activityStream} />
        </div>

        {/* 系统告警 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">系统告警</h3>
          <AlertsList alerts={alerts} />
        </div>
      </div>

      {/* 详细指标面板 */}
      {selectedMetric && (
        <MetricDetailPanel
          metric={selectedMetric}
          data={data}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  )
}

// 系统健康状态条
function SystemHealthBar({ health }: { health: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`p-4 rounded-lg text-white ${getStatusColor(health.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {health.status === 'healthy' ? (
            <CheckCircle className="w-6 h-6" />
          ) : health.status === 'degraded' ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          <span className="text-lg font-semibold">
            系统状态: {health.status === 'healthy' ? '健康' : 
                     health.status === 'degraded' ? '降级' : '异常'}
          </span>
        </div>
        
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>CPU: {health.metrics.cpu}%</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span>内存: {health.metrics.memory}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>磁盘: {health.metrics.disk}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span>响应: {health.metrics.responseTime}ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 指标卡片
function MetricCard({ icon, title, value, change, subtitle, onClick }: any) {
  const isPositive = change > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </motion.div>
  )
}

// 留存图表
function RetentionChart({ retentionRate }: { retentionRate: number }) {
  const data = [
    { day: 'D1', rate: 100 },
    { day: 'D7', rate: retentionRate },
    { day: 'D14', rate: retentionRate * 0.8 },
    { day: 'D30', rate: retentionRate * 0.6 }
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
        <Area 
          type="monotone" 
          dataKey="rate" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// 系统指标
function SystemMetrics({ metrics }: { metrics: any }) {
  const data = [
    { name: 'CPU', value: metrics.cpu, max: 100 },
    { name: '内存', value: metrics.memory, max: 100 },
    { name: '磁盘', value: metrics.disk, max: 100 },
    { name: '响应时间', value: Math.min(metrics.responseTime / 10, 100), max: 100 }
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar 
          name="当前值" 
          dataKey="value" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.6} 
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// 活动流
function ActivityStream({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.map(activity => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-semibold">{activity.user}</span>
              {' '}
              {activity.type}
              {' '}
              <span className="font-semibold">{activity.target}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// 告警列表
function AlertsList({ alerts }: { alerts: any[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'error': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    }
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
          <p>当前没有活跃告警</p>
        </div>
      ) : (
        alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${alert.resolved ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {alert.resolved && (
                <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  已解决
                </span>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}

// 指标详情面板
function MetricDetailPanel({ metric, data, onClose }: any) {
  // 这里可以根据选中的指标显示更详细的分析
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">
          {metric === 'users' ? '用户分析' :
           metric === 'websites' ? '内容分析' :
           metric === 'interactions' ? '互动分析' : '参与度分析'}
        </h2>
        
        {/* 这里添加更详细的图表和分析 */}
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300">
            详细的 {metric} 分析内容...
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          关闭
        </button>
      </div>
    </motion.div>
  )
}

// 骨架屏
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-80 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
