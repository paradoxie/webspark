'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PlatformAnalytics {
  period: string;
  summary: {
    totalUsers: number;
    newUsers: number;
    totalWebsites: number;
    newWebsites: number;
    totalInteractions: number;
    userGrowthRate: string;
    websiteGrowthRate: string;
  };
  topCategories: Array<{
    id: number;
    name: string;
    websiteCount: number;
  }>;
  topTags: Array<{
    id: number;
    name: string;
    slug: string;
    websiteCount: number;
  }>;
  growth: {
    users: Array<{ date: string; count: number }>;
    websites: Array<{ date: string; count: number }>;
  };
}

interface WebsiteRankings {
  period: string;
  sortBy: string;
  rankings: Array<{
    id: number;
    title: string;
    slug: string;
    url: string;
    shortDescription: string;
    featured: boolean;
    authorName: string;
    score: number;
    metric: string;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [platformData, setPlatformData] = useState<PlatformAnalytics | null>(null);
  const [rankingsData, setRankingsData] = useState<WebsiteRankings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedRankingType, setSelectedRankingType] = useState('engagement');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedRankingType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [platformResponse, rankingsResponse] = await Promise.all([
        fetch(`/api/analytics/platform?period=${selectedPeriod}`),
        fetch(`/api/analytics/rankings?period=${selectedPeriod}&sortBy=${selectedRankingType}`)
      ]);

      if (platformResponse.ok) {
        const platformResult = await platformResponse.json();
        setPlatformData(platformResult.data);
      }

      if (rankingsResponse.ok) {
        const rankingsResult = await rankingsResponse.json();
        setRankingsData(rankingsResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const periodOptions = [
    { value: '7d', label: '7 天' },
    { value: '30d', label: '30 天' },
    { value: '90d', label: '90 天' },
  ];

  const rankingOptions = [
    { value: 'engagement', label: '综合互动' },
    { value: 'likes', label: '点赞数' },
    { value: 'bookmarks', label: '收藏数' },
    { value: 'comments', label: '评论数' },
    { value: 'clicks', label: '点击数' },
  ];

  // Chart configurations
  const growthChartData = {
    labels: platformData?.growth.users.map(item => item.date) || [],
    datasets: [
      {
        label: '用户增长',
        data: platformData?.growth.users.map(item => item.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: '网站增长',
        data: platformData?.growth.websites.map(item => item.count) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const categoriesChartData = {
    labels: platformData?.topCategories.map(cat => cat.name) || [],
    datasets: [
      {
        data: platformData?.topCategories.map(cat => cat.websiteCount) || [],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据分析</h1>
            <p className="text-gray-600 dark:text-slate-300 mt-1">平台统计数据和深度分析</p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: '概览' },
              { id: 'rankings', name: '排行榜' },
              { id: 'growth', name: '增长趋势' },
              { id: 'categories', name: '分类分析' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && platformData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {platformData.summary.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">总用户数</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    +{platformData.summary.newUsers} ({platformData.summary.userGrowthRate}%)
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {platformData.summary.totalWebsites}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">总网站数</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    +{platformData.summary.newWebsites} ({platformData.summary.websiteGrowthRate}%)
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {platformData.summary.totalInteractions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">总互动数</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {platformData.topCategories.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">活跃分类</div>
                </div>
              </div>

              {/* Top Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">热门标签</h3>
                <div className="flex flex-wrap gap-2">
                  {platformData.topTags.slice(0, 10).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    >
                      {tag.name}
                      <span className="ml-2 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full px-2 py-0.5">
                        {tag.websiteCount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">网站排行榜</h3>
                <select
                  value={selectedRankingType}
                  onChange={(e) => setSelectedRankingType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  {rankingOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {rankingsData && (
                <div className="space-y-3">
                  {rankingsData.rankings.map((website, index) => (
                    <div
                      key={website.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-gray-300 dark:bg-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{website.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-slate-400">{website.shortDescription}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">by {website.authorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{website.score}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-500">
                          {rankingOptions.find(opt => opt.value === website.metric)?.label || website.metric}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Growth Tab */}
          {activeTab === 'growth' && platformData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">增长趋势</h3>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                <Line data={growthChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && platformData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">分类分析</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                  <Doughnut data={categoriesChartData} options={doughnutOptions} />
                </div>
                <div className="space-y-3">
                  {platformData.topCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{
                          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] || '#6B7280'
                        }}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      </div>
                      <span className="text-gray-600 dark:text-slate-400">{category.websiteCount} 个网站</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;