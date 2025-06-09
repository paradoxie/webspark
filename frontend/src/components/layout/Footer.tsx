'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubscribing) return;

    setIsSubscribing(true);
    
    // 模拟订阅过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubscribed(true);
    setEmail('');
    setIsSubscribing(false);
    
    // 3秒后重置状态
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  const navigation = {
    product: [
      { name: '首页', href: '/' },
      { name: '发现作品', href: '/sites' },
      { name: '标签分类', href: '/tags' },
      { name: '提交作品', href: '/submit' },
    ],
    community: [
      { name: '开发者社区', href: '/community' },
      { name: '设计师展示', href: '/designers' },
      { name: '创意灵感', href: '/inspiration' },
      { name: '技术博客', href: '/blog' },
    ],
    support: [
      { name: '帮助中心', href: '/help' },
      { name: '联系我们', href: '/contact' },
      { name: '反馈建议', href: '/feedback' },
      { name: '状态页面', href: '/status' },
    ],
    legal: [
      { name: '服务条款', href: '/terms' },
      { name: '隐私政策', href: '/privacy' },
      { name: 'Cookie政策', href: '/cookies' },
      { name: '版权声明', href: '/copyright' },
    ],
  };

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/webspark-club',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/websparkclub',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/websparkclub',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/websparkclub',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
  ];

  const stats = [
    { name: '活跃开发者', value: '12,000+', icon: '👨‍💻' },
    { name: '精彩作品', value: '3,500+', icon: '🎨' },
    { name: '技术栈', value: '150+', icon: '🔧' },
    { name: '国家地区', value: '80+', icon: '🌍' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* 网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 统计数据区域 */}
        <div className="pt-16 pb-12 border-b border-slate-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
              一起构建开发者社区
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              汇聚全球开发者的创意与才华，共同打造最具活力的Web作品展示平台
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.name} 
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* 品牌信息和订阅 */}
            <div className="lg:col-span-5 space-y-8">
              {/* Logo和品牌 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-bold text-xl">W</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      WebSpark.club
                    </h3>
                    <p className="text-slate-400 text-sm">开发者创意社区</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  发现最前沿的Web技术作品，分享你的创意项目，与全球开发者连接交流。让每一个创意都能闪闪发光！
                </p>
              </div>

              {/* 邮件订阅 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">🎯 订阅精选内容</h4>
                <p className="text-slate-400 text-sm">
                  每周获取最新的Web开发趋势、优秀作品推荐和技术分享
                </p>
                
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="输入你的邮箱地址"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      disabled={isSubscribing || isSubscribed}
                    />
                    {isSubscribed && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubscribing || isSubscribed || !email}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubscribing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>订阅中...</span>
                      </div>
                    ) : isSubscribed ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>订阅成功！</span>
                      </div>
                    ) : (
                      '立即订阅'
                    )}
                  </button>
                </form>
              </div>

              {/* 社交媒体 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">🔗 关注我们</h4>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transform hover:-translate-y-1 transition-all duration-300 group"
                      aria-label={social.name}
                    >
                      <div className="group-hover:scale-110 transition-transform duration-300">
                        {social.icon}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* 导航链接 */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">产品</h4>
                  <ul className="space-y-3">
                    {navigation.product.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-300 text-sm hover:translate-x-1 transform transition-transform duration-300 block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">社区</h4>
                  <ul className="space-y-3">
                    {navigation.community.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-300 text-sm hover:translate-x-1 transform transition-transform duration-300 block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">支持</h4>
                  <ul className="space-y-3">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-300 text-sm hover:translate-x-1 transform transition-transform duration-300 block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">法律</h4>
                  <ul className="space-y-3">
                    {navigation.legal.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-300 text-sm hover:translate-x-1 transform transition-transform duration-300 block"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="py-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-400 text-sm">
              © 2024 WebSpark.club. 保留所有权利. 
              <span className="ml-2 text-slate-500">
                Made with ❤️ by developers, for developers
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>服务正常运行</span>
              </span>
              <Link 
                href="/changelog" 
                className="hover:text-white transition-colors duration-300"
              >
                更新日志
              </Link>
              <Link 
                href="/api/status" 
                className="hover:text-white transition-colors duration-300"
              >
                API状态
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 回到顶部按钮 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 z-50 group"
        aria-label="回到顶部"
      >
        <svg 
          className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
} 