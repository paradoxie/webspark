'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/common/NotificationBell';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function Header() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // 监听滚动状态
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: '首页', href: '/', icon: '🏠' },
    { name: '作品', href: '/sites', icon: '🎨' },
    { name: '分类', href: '/categories', icon: '📂' },
    { name: '标签', href: '/tags', icon: '🏷️' },
    { name: '搜索', href: '/search', icon: '🔍' },
    { name: '数据分析', href: '/analytics', icon: '📊' },
  ];

  const userNavigation = [
    { name: '我的收藏', href: '/profile/bookmarks', icon: '❤️' },
    { name: '我的点赞', href: '/profile/likes', icon: '👍' },
    { name: '我的作品', href: '/profile/websites', icon: '📂' },
    { name: '关注动态', href: '/following', icon: '📰' },
    { name: '个人设置', href: '/settings', icon: '⚙️' },
    { name: '提交作品', href: '/submit', icon: '➕' },
  ];

  const isActivePath = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50'
            : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WebSpark.club
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">开发者创意社区</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 group ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                  {isActivePath(item.href) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {status === 'loading' ? (
                <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  {/* Submit Button */}
                  <Link
                    href="/submit"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>提交作品</span>
                  </Link>

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* User Menu */}
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors duration-200 group"
                    >
                      <img
                        src={session.user?.image || 'https://i.pravatar.cc/150'}
                        alt={session.user?.name || '用户头像'}
                        className="w-8 h-8 rounded-lg ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all duration-200"
                      />
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-slate-700">{session.user?.name}</p>
                        <p className="text-xs text-slate-500">@{(session.user as any)?.login || session.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                      </div>
                      <svg 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown */}
                    <div className={`absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 py-2 transition-all duration-300 origin-top-right ${
                      isUserMenuOpen 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <img
                            src={session.user?.image || 'https://i.pravatar.cc/150'}
                            alt={session.user?.name || '用户头像'}
                            className="w-12 h-12 rounded-xl"
                          />
                          <div>
                            <p className="font-semibold text-slate-800">{session.user?.name}</p>
                            <p className="text-sm text-slate-500">{session.user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-200 ${
                              isActivePath(item.href)
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        ))}
                        
                        <div className="border-t border-slate-100 mt-2 pt-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                          >
                            <span className="text-base">🚪</span>
                            <span className="font-medium">退出登录</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                    className="px-4 py-2 text-slate-700 font-medium rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    登录
                  </Link>
                  <Link
                    href="/submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    分享作品
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 mobile-menu-container"
                aria-label="打开菜单"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        
        {/* Mobile Menu Panel */}
        <div className={`absolute top-0 right-0 w-80 max-w-[90vw] h-full bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 mobile-menu-container ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6 space-y-6">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">WebSpark.club</h1>
                  <p className="text-xs text-slate-500">开发者创意社区</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info (if logged in) */}
            {session && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={session.user?.image || 'https://i.pravatar.cc/150'}
                    alt={session.user?.name || '用户头像'}
                    className="w-12 h-12 rounded-xl"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">{session.user?.name}</p>
                    <p className="text-sm text-slate-500">{session.user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">导航菜单</h3>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-xl font-medium transition-all duration-200 ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* User Actions (if logged in) */}
            {session && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">用户中心</h3>
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-xl font-medium transition-all duration-200 ${
                      isActivePath(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 p-3 rounded-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 w-full text-left"
                >
                  <span className="text-xl">🚪</span>
                  <span>退出登录</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full p-3 text-center font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors duration-200"
                  >
                    登录账户
                  </Link>
                  <Link
                    href="/submit"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full p-3 text-center font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    分享作品
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16"></div>
    </>
  );
} 