'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useSession } from 'next-auth/react';

interface UserAnalytics {
  period: string;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  topActiveUsers: Array<{
    id: number;
    username: string;
    websitesSubmitted: number;
    likesGiven: number;
    bookmarksCreated: number;
    commentsPosted: number;
  }>;
}

interface WebsiteTraffic {
  period: string;
  totalClicks: number;
  uniqueUsers: number;
  averageClicksPerDay: number;
  dailyStats: Array<{
    date: string;
    clicks: number;
  }>;
}

interface WebsiteBehavior {
  period: string;
  likes: number;
  bookmarks: number;
  comments: number;
  clicks: number;
  engagementScore: number;
  engagementBreakdown: {
    likes: { count: number; weight: number; score: number };
    bookmarks: { count: number; weight: number; score: number };
    comments: { count: number; weight: number; score: number };
    clicks: { count: number; weight: number; score: number };
  };
}

interface UserAnalyticsProps {
  websiteId?: string;
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ websiteId }) => {
  const { data: session } = useSession();
  const [userActivityData, setUserActivityData] = useState<UserAnalytics | null>(null);
  const [websiteTrafficData, setWebsiteTrafficData] = useState<WebsiteTraffic | null>(null);
  const [websiteBehaviorData, setWebsiteBehaviorData] = useState<WebsiteBehavior | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(websiteId ? 'website' : 'activity');

  useEffect(() => {
    if (session?.user) {
      fetchUserAnalytics();
    }
  }, [session, selectedPeriod, websiteId]);

  const fetchUserAnalytics = async () => {
    setLoading(true);
    try {
      const promises = [];

      // Fetch user activity data
      promises.push(
        fetch(`/api/analytics/user-activity?period=${selectedPeriod}`)
          .then(res => res.ok ? res.json() : null)
          .then(result => result?.data)
      );

      // If websiteId is provided, fetch website-specific data
      if (websiteId) {
        promises.push(
          fetch(`/api/analytics/traffic/${websiteId}?period=${selectedPeriod}`)
            .then(res => res.ok ? res.json() : null)
            .then(result => result?.data)
        );

        promises.push(
          fetch(`/api/analytics/user-behavior/${websiteId}?period=${selectedPeriod}`)
            .then(res => res.ok ? res.json() : null)
            .then(result => result?.data)
        );
      }

      const [userActivity, websiteTraffic, websiteBehavior] = await Promise.all(promises);

      setUserActivityData(userActivity);
      if (websiteTraffic) setWebsiteTrafficData(websiteTraffic);
      if (websiteBehavior) setWebsiteBehaviorData(websiteBehavior);
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-slate-400">请登录查看分析数据</p>
      </div>
    );
  }

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

  // Chart data for website traffic
  const trafficChartData = websiteTrafficData ? {
    labels: websiteTrafficData.dailyStats.map(stat => stat.date),
    datasets: [
      {
        label: '每日点击量',
        data: websiteTrafficData.dailyStats.map(stat => stat.clicks),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  // Chart data for engagement breakdown
  const engagementChartData = websiteBehaviorData ? {
    labels: ['点赞', '收藏', '评论', '点击'],
    datasets: [
      {
        label: '互动数量',
        data: [
          websiteBehaviorData.engagementBreakdown.likes.count,
          websiteBehaviorData.engagementBreakdown.bookmarks.count,
          websiteBehaviorData.engagementBreakdown.comments.count,
          websiteBehaviorData.engagementBreakdown.clicks.count,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  } : null;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {websiteId ? '网站分析' : '我的数据'}
            </h1>
            <p className="text-gray-600 dark:text-slate-300 mt-1">
              {websiteId ? '深入了解您网站的表现' : '查看您的活动统计和参与度'}
            </p>
          </div>
          
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

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'activity', name: '用户活动', show: true },
              { id: 'website', name: '网站分析', show: websiteId },
              { id: 'engagement', name: '互动分析', show: websiteId },
            ].filter(tab => tab.show).map((tab) => (
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
          {/* User Activity Tab */}
          {activeTab === 'activity' && userActivityData && (
            <div className="space-y-6">
              {/* Active Users Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userActivityData.activeUsers.daily}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">日活跃用户</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userActivityData.activeUsers.weekly}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">周活跃用户</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {userActivityData.activeUsers.monthly}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">月活跃用户</div>
                </div>
              </div>

              {/* Top Active Users */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">活跃用户排行</h3>
                <div className="space-y-3">
                  {userActivityData.topActiveUsers.slice(0, 10).map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{user.username}</h4>
                          <div className="text-sm text-gray-600 dark:text-slate-400">
                            提交 {user.websitesSubmitted} 个网站 • {user.likesGiven} 个赞 • {user.bookmarksCreated} 个收藏 • {user.commentsPosted} 条评论
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Website Analytics Tab */}
          {activeTab === 'website' && websiteTrafficData && trafficChartData && (
            <div className="space-y-6">
              {/* Traffic Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {websiteTrafficData.totalClicks}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">总点击量</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {websiteTrafficData.uniqueUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">独立访客</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {websiteTrafficData.averageClicksPerDay}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">日均点击</div>
                </div>
              </div>

              {/* Traffic Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">流量趋势</h3>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                  <Line data={trafficChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Engagement Analytics Tab */}
          {activeTab === 'engagement' && websiteBehaviorData && engagementChartData && (
            <div className="space-y-6">
              {/* Engagement Score */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg text-center">
                <div className="text-3xl font-bold">{websiteBehaviorData.engagementScore}</div>
                <div className="text-lg">综合互动得分</div>
                <div className="text-sm opacity-80 mt-2">
                  基于点赞、收藏、评论和点击的加权计算
                </div>
              </div>

              {/* Engagement Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">互动分布</h3>
                  <Bar data={engagementChartData} options={chartOptions} />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">详细统计</h3>
                  {[
                    { 
                      name: '点赞', 
                      count: websiteBehaviorData.engagementBreakdown.likes.count,
                      score: websiteBehaviorData.engagementBreakdown.likes.score,
                      color: 'blue' 
                    },
                    { 
                      name: '收藏', 
                      count: websiteBehaviorData.engagementBreakdown.bookmarks.count,
                      score: websiteBehaviorData.engagementBreakdown.bookmarks.score,
                      color: 'green' 
                    },
                    { 
                      name: '评论', 
                      count: websiteBehaviorData.engagementBreakdown.comments.count,
                      score: websiteBehaviorData.engagementBreakdown.comments.score,
                      color: 'yellow' 
                    },
                    { 
                      name: '点击', 
                      count: websiteBehaviorData.engagementBreakdown.clicks.count,
                      score: websiteBehaviorData.engagementBreakdown.clicks.score,
                      color: 'red' 
                    },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={`p-4 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        <div className="text-right">
                          <div className={`text-lg font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                            {item.count}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400">
                            得分: {item.score}
                          </div>
                        </div>
                      </div>
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

export default UserAnalytics;