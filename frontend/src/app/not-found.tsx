import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404插图 */}
        <div className="relative mb-8 animate-fade-in-up">
          <div className="relative">
            <svg
              className="mx-auto w-64 h-64 text-blue-200"
              fill="none"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 背景圆 */}
              <circle cx="200" cy="200" r="160" fill="currentColor" className="opacity-20" />
              
              {/* 404数字 */}
              <text
                x="200"
                y="220"
                fontSize="80"
                fontWeight="bold"
                textAnchor="middle"
                className="fill-blue-600/40"
              >
                404
              </text>
              
              {/* 装饰元素 */}
              <circle cx="120" cy="120" r="8" fill="currentColor" className="animate-pulse" />
              <circle cx="280" cy="140" r="6" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              <circle cx="320" cy="280" r="10" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1s' }} />
              <circle cx="80" cy="300" r="7" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
            </svg>
            
            {/* 浮动装饰 */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-float"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            页面未找到
          </h1>
          
          <p className="text-xl text-slate-600 max-w-lg mx-auto leading-relaxed">
            抱歉，您访问的页面不存在或已被移除
          </p>
          
          <p className="text-slate-500">
            可能的原因：链接错误、页面已删除或您没有访问权限
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0h3m0 0h3m0 0a1 1 0 001-1V10M9 21h6" />
            </svg>
            <span>返回首页</span>
          </Link>
          
          <Link
            href="/sites"
            className="px-8 py-4 glass-card text-slate-700 font-semibold rounded-2xl hover:bg-white/60 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>浏览作品</span>
          </Link>
        </div>

        {/* 搜索建议 */}
        <div className="mt-12 p-6 glass-card rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            💡 您可能在寻找
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/sites"
              className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              🚀 作品展示
            </Link>
            <Link
              href="/submit"
              className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              ✨ 提交作品
            </Link>
            <Link
              href="/tags"
              className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              🏷️ 技术标签
            </Link>
            <Link
              href="/search"
              className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              🔍 高级搜索
            </Link>
          </div>
        </div>

        {/* 联系信息 */}
        <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-slate-500 text-sm">
            如果您认为这是一个错误，请{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
              联系我们
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 