export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">隐私政策</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              最后更新日期：2024年1月15日
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. 隐私政策概述</h2>
              <p className="text-slate-700 leading-relaxed">
                WebSpark.club（以下简称"我们"、"本平台"）非常重视用户的隐私保护。
                本隐私政策详细说明了我们如何收集、使用、存储和保护您的个人信息。
                使用我们的服务即表示您同意本隐私政策的条款。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. 信息收集</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-3">2.1 GitHub账户信息</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                当您通过GitHub OAuth登录时，我们会收集以下信息：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>GitHub用户名</li>
                <li>头像URL</li>
                <li>公开的GitHub个人资料信息</li>
                <li>邮箱地址（如果在GitHub中设为公开）</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">2.2 用户提交的内容</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>作品标题、描述和相关链接</li>
                <li>个人简介和社交媒体链接</li>
                <li>评论、点赞等互动数据</li>
                <li>上传的图片和文件</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">2.3 自动收集的信息</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>IP地址和地理位置（大致区域）</li>
                <li>浏览器类型和版本</li>
                <li>访问时间和页面浏览记录</li>
                <li>设备信息和屏幕分辨率</li>
                <li>Cookie和本地存储数据</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. 信息使用</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                我们收集的信息仅用于以下目的：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>提供和维护平台服务</li>
                <li>验证用户身份和防止欺诈</li>
                <li>个性化用户体验和内容推荐</li>
                <li>发送重要的服务通知</li>
                <li>分析平台使用情况以改进服务</li>
                <li>遵守法律法规和处理争议</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. 信息共享</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                我们不会出售、出租或交易您的个人信息。在以下情况下，我们可能会共享您的信息：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>公开展示：</strong>您提交的作品和个人资料将在平台上公开展示</li>
                <li><strong>法律要求：</strong>应法律法规、法院命令或政府部门要求</li>
                <li><strong>安全保护：</strong>为保护平台和用户的权利、财产或安全</li>
                <li><strong>服务提供商：</strong>与可信的第三方服务提供商共享必要信息</li>
                <li><strong>业务转让：</strong>在企业重组、合并或收购的情况下</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. 数据存储和安全</h2>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-3">5.1 数据存储</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>用户数据存储在安全的云服务器上</li>
                <li>数据库采用加密存储</li>
                <li>定期进行数据备份</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">5.2 安全措施</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>使用HTTPS加密传输</li>
                <li>实施访问控制和身份验证</li>
                <li>定期进行安全审计和漏洞扫描</li>
                <li>员工接受隐私保护培训</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookie和跟踪技术</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                我们使用Cookie和类似技术来：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>维持用户登录状态</li>
                <li>记住用户偏好设置</li>
                <li>分析网站使用情况</li>
                <li>提供个性化内容</li>
              </ul>
              <p className="text-slate-700 leading-relaxed">
                您可以通过浏览器设置控制Cookie的使用，但这可能影响某些功能的正常使用。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. 用户权利</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                您对自己的个人信息享有以下权利：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>访问权：</strong>查看我们持有的您的个人信息</li>
                <li><strong>更正权：</strong>要求更正不准确的个人信息</li>
                <li><strong>删除权：</strong>要求删除您的个人信息</li>
                <li><strong>限制处理权：</strong>要求限制对您信息的处理</li>
                <li><strong>数据可移植权：</strong>要求提供您的数据副本</li>
                <li><strong>反对权：</strong>反对我们处理您的个人信息</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. 未成年人保护</h2>
              <p className="text-slate-700 leading-relaxed">
                我们的服务主要面向成年用户。如果您未满18岁，请在父母或监护人的指导下使用我们的服务。
                我们不会故意收集未满13岁儿童的个人信息。如果我们发现收集了此类信息，将立即删除。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. 国际数据传输</h2>
              <p className="text-slate-700 leading-relaxed">
                您的信息可能会被传输到您所在国家/地区以外的地方进行处理和存储。
                我们将确保此类传输符合适用的数据保护法律，并采取适当的保护措施。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. 隐私政策更新</h2>
              <p className="text-slate-700 leading-relaxed">
                我们可能会不时更新本隐私政策。更新时，我们会在平台上发布新版本，并通过邮件或站内通知告知用户。
                继续使用我们的服务将被视为接受更新后的隐私政策。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. 联系我们</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>邮箱：privacy@webspark.club</li>
                <li>地址：[公司地址]</li>
                <li>电话：[联系电话]</li>
                <li>在线表单：<a href="/contact" className="text-blue-600 hover:text-blue-800 underline">联系我们</a></li>
              </ul>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">您的隐私权利</h3>
              <p className="text-sm text-blue-800 mb-4">
                我们承诺保护您的隐私权利。如果您对我们的数据处理方式有任何疑虑，
                或希望行使您的隐私权利，请随时联系我们。
              </p>
              <div className="flex space-x-4">
                <a 
                  href="/contact" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  联系我们
                </a>
                <a 
                  href="/dashboard" 
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  管理数据
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 