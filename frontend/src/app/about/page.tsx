export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              关于 WebSpark.club
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              为Web开发者社群创建充满活力的作品展示、灵感碰撞和交流互动的俱乐部
            </p>
          </div>

          {/* 主要内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">🚀 我们的使命</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                WebSpark.club 致力于成为全球Web开发者展示创意作品、分享技术灵感的首选平台。
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                我们相信每一个Web项目都有其独特的价值，无论是实验性的原型还是成熟的产品，
                都值得被看见、被欣赏、被学习。
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">💡 平台特色</h2>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  精心策划的作品展示
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  活跃的开发者社区
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  技术趋势洞察
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  创意灵感分享
                </li>
              </ul>
            </div>
          </div>

          {/* 团队介绍 */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg mb-16">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">👥 核心团队</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">P</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">产品负责人</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">负责产品规划与用户体验</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">D</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">技术负责人</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">负责技术架构与开发</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">C</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">社区负责人</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">负责社区运营与内容</p>
              </div>
            </div>
          </div>

          {/* 技术栈 */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">🛠️ 技术栈</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⚛️</div>
                <div className="font-semibold text-slate-800 dark:text-white">React</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">前端框架</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">▲</div>
                <div className="font-semibold text-slate-800 dark:text-white">Next.js</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">全栈框架</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="font-semibold text-slate-800 dark:text-white">Tailwind</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">样式框架</div>
              </div>
                              <div className="text-center">
                  <div className="text-3xl mb-2">🗄️</div>
                  <div className="font-semibold text-slate-800 dark:text-white">Node.js + Express</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">后端API服务</div>
                </div>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="text-center mt-16">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">📫 联系我们</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              有任何问题或建议？我们很乐意听到您的声音！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@webspark.club"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📧 邮箱联系
              </a>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                💬 在线留言
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 