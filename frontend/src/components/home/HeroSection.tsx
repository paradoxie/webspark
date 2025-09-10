'use client';

import { useState, useEffect } from 'react';

interface Stats {
  websites: number;
  users: number;
  tags: number;
  countries: number;
}

export default function HeroSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/websites/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // 使用默认值
      setStats({
        websites: 10,
        users: 4,
        tags: 26,
        countries: 80,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPgo8L3N2Zz4=')] opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          {/* 主标题 */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            一起构建开发者社区
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-purple-200 mb-12 max-w-3xl mx-auto">
            打造航海圈友的Web作品展示平台
          </p>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl mb-2">👨‍💻</div>
              <div className="text-3xl font-bold mb-1">
                {loading ? '...' : stats?.users.toLocaleString() + '+'}
              </div>
              <div className="text-purple-200">活跃开发者</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">🎨</div>
              <div className="text-3xl font-bold mb-1">
                {loading ? '...' : stats?.websites.toLocaleString() + '+'}
              </div>
              <div className="text-purple-200">精彩作品</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">🧭</div>
              <div className="text-3xl font-bold mb-1">
                {loading ? '...' : stats?.tags + '+'}
              </div>
              <div className="text-purple-200">分类</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">🌍</div>
              <div className="text-3xl font-bold mb-1">
                {loading ? '...' : stats?.countries + '+'}
              </div>
              <div className="text-purple-200">国家地区</div>
            </div>
          </div>

          {/* CTA按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#featured"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              探索作品
            </a>
            <a
              href="/submit"
              className="inline-flex items-center px-6 py-3 rounded-lg border-2 border-white text-white hover:bg-white hover:text-slate-900 font-semibold transition-colors"
            >
              提交作品
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 