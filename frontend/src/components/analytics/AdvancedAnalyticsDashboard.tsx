'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import InteractiveChart, { chartColors, chartConfigs } from './InteractiveChart';
import toast from 'react-hot-toast';

interface AnalyticsData {
  websiteStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  trafficTrends: {
    labels: string[];
    views: number[];
    clicks: number[];
  };
  topCategories: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  userGrowth: {
    labels: string[];
    users: number[];
    websites: number[];
  };
  topTags: Array<{
    name: string;
    count: number;
  }>;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function MetricCard({ title, value, change, changeType, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const changeColorClasses = {
    increase: 'text-green-600 bg-green-100',
    decrease: 'text-red-600 bg-red-100',
    neutral: 'text-slate-600 bg-slate-100'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${changeColorClasses[changeType || 'neutral']}`}>
                {changeType === 'increase' && '↗'}
                {changeType === 'decrease' && '↘'}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-slate-500 ml-2">vs 上月</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdvancedAnalyticsDashboard() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'clicks' | 'users'>('views');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // 并行获取多个数据源
      const [statsResponse, trafficResponse, categoriesResponse, growthResponse, tagsResponse] = await Promise.all([
        fetch('/api/analytics/stats'),
        fetch(`/api/analytics/traffic?period=${timeRange}`),
        fetch('/api/analytics/categories/top'),
        fetch(`/api/analytics/growth?period=${timeRange}`),
        fetch('/api/analytics/tags/popular')
      ]);

      const [stats, traffic, categories, growth, tags] = await Promise.all([
        statsResponse.json(),
        trafficResponse.json(),
        categoriesResponse.json(),
        growthResponse.json(),
        tagsResponse.json()
      ]);

      setAnalyticsData({
        websiteStats: stats.data,
        trafficTrends: traffic.data,
        topCategories: categories.data,
        userGrowth: growth.data,
        topTags: tags.data
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDataPointClick = (dataPoint: any, chartType: string) => {
    toast.success(`点击了${chartType}中的数据点: ${dataPoint.label} - ${dataPoint.value}`);
    // 这里可以添加更多交互逻辑，比如跳转到详细页面
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-slate-900">暂无数据</h3>
          <p className="text-slate-600">请稍后重试</p>
        </div>
      </div>
    );
  }

  // 准备图表数据
  const trafficChartData = {
    labels: analyticsData.trafficTrends.labels,
    datasets: [
      {
        label: '页面浏览量',
        data: analyticsData.trafficTrends.views,
        borderColor: chartColors.primary.border,
        backgroundColor: chartColors.primary.background,
        fill: true,
        tension: 0.4
      },
      {
        label: '点击量',
        data: analyticsData.trafficTrends.clicks,
        borderColor: chartColors.success.border,
        backgroundColor: chartColors.success.background,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const categoriesChartData = {
    labels: analyticsData.topCategories.map(cat => cat.name),
    datasets: [{
      data: analyticsData.topCategories.map(cat => cat.count),
      backgroundColor: [
        chartColors.primary.background,
        chartColors.success.background,
        chartColors.warning.background,
        chartColors.danger.background,
        chartColors.purple.background
      ],
      borderColor: [
        chartColors.primary.border,
        chartColors.success.border,
        chartColors.warning.border,
        chartColors.danger.border,
        chartColors.purple.border
      ],
      borderWidth: 2
    }]
  };

  const growthChartData = {
    labels: analyticsData.userGrowth.labels,
    datasets: [
      {
        label: '新用户',
        data: analyticsData.userGrowth.users,
        backgroundColor: chartColors.primary.background,
        borderColor: chartColors.primary.border,
        borderWidth: 2
      },
      {
        label: '新作品',
        data: analyticsData.userGrowth.websites,
        backgroundColor: chartColors.success.background,
        borderColor: chartColors.success.border,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和时间选择器 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">高级数据分析</h1>
            <p className="text-slate-600 mt-1">深入了解平台使用情况和趋势</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">时间范围:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
              </select>
            </div>
          </div>
        </div>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="总作品数"
            value={analyticsData.websiteStats.total}
            change={12}
            changeType="increase"
            icon="🎨"
            color="blue"
          />
          <MetricCard
            title="已通过作品"
            value={analyticsData.websiteStats.approved}
            change={8}
            changeType="increase"
            icon="✅"
            color="green"
          />
          <MetricCard
            title="待审核作品"
            value={analyticsData.websiteStats.pending}
            change={-5}
            changeType="decrease"
            icon="⏳"
            color="yellow"
          />
          <MetricCard
            title="热门标签数"
            value={analyticsData.topTags.length}
            change={3}
            changeType="increase"
            icon="🏷️"
            color="purple"
          />
        </div>

        {/* 图表网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 流量趋势图 */}
          <InteractiveChart
            type="line"
            data={trafficChartData}
            title="流量趋势分析"
            height={350}
            interactive={true}
            onDataPointClick={(dataPoint) => handleDataPointClick(dataPoint, '流量趋势')}
            options={chartConfigs.trendLine.options}
          />

          {/* 分类分布图 */}
          <InteractiveChart
            type="doughnut"
            data={categoriesChartData}
            title="作品分类分布"
            height={350}
            interactive={true}
            onDataPointClick={(dataPoint) => handleDataPointClick(dataPoint, '分类分布')}
            options={chartConfigs.doughnutChart.options}
          />
        </div>

        {/* 用户增长图 */}
        <div className="mb-8">
          <InteractiveChart
            type="bar"
            data={growthChartData}
            title="用户和作品增长趋势"
            height={400}
            interactive={true}
            onDataPointClick={(dataPoint) => handleDataPointClick(dataPoint, '增长趋势')}
            options={chartConfigs.barChart.options}
          />
        </div>

        {/* 热门标签列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🔥 热门标签</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {analyticsData.topTags.map((tag, index) => (
              <div
                key={tag.name}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => toast.info(`标签: ${tag.name} (${tag.count} 个作品)`)}
              >
                <span className="font-medium text-slate-900">{tag.name}</span>
                <span className="text-sm text-slate-600">{tag.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 交互提示 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="text-blue-600 text-xl mr-3">💡</div>
            <div>
              <h4 className="font-medium text-blue-900">交互式分析</h4>
              <p className="text-blue-700 text-sm">
                点击图表中的数据点获取详细信息，或点击标签查看相关统计
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}