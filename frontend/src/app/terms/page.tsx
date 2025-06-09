export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">服务条款</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              最后更新日期：2024年1月15日
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. 服务介绍</h2>
              <p className="text-slate-700 leading-relaxed">
                WebSpark.club（以下简称"本平台"）是一个专为Web开发者打造的作品展示和交流社区。
                我们致力于为开发者提供一个展示创意、分享技术、获得反馈的平台。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. 用户注册与账户</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>用户必须通过GitHub账户进行注册和登录。</li>
                <li>用户应确保提供的信息真实、准确、完整。</li>
                <li>用户有责任维护账户安全，不得与他人共享账户信息。</li>
                <li>禁止一人注册多个账户或使用虚假身份注册。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. 内容提交规范</h2>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">3.1 允许的内容</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>原创的Web开发作品和项目。</li>
                <li>技术教程、工具分享等有价值的开发资源。</li>
                <li>开源项目和代码库。</li>
                <li>设计作品、UI/UX项目等相关创意内容。</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-900 mb-3">3.2 禁止的内容</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>侵犯他人知识产权的内容。</li>
                <li>包含恶意代码、病毒或其他有害软件的项目。</li>
                <li>违法、暴力、色情或其他不当内容。</li>
                <li>垃圾信息、广告推广或无关内容。</li>
                <li>抄袭他人作品或冒充他人身份的内容。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. 知识产权</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>用户保留其提交内容的所有权和知识产权。</li>
                <li>用户授权本平台展示、分发和推广其提交的内容。</li>
                <li>用户承诺其提交的内容不侵犯任何第三方的知识产权。</li>
                <li>如发现侵权内容，本平台有权立即删除并封禁相关账户。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. 用户行为规范</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>用户应遵守社区准则，保持文明友善的交流氛围。</li>
                <li>禁止发布恶意评论、人身攻击或骚扰他人。</li>
                <li>禁止利用平台进行商业推广或垃圾信息传播。</li>
                <li>禁止恶意刷赞、刷评论或其他破坏平台秩序的行为。</li>
                <li>鼓励用户提供建设性的反馈和建议。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. 内容审核</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>所有提交的内容将经过人工审核。</li>
                <li>我们保留拒绝、删除或修改任何内容的权利。</li>
                <li>审核标准包括但不限于内容质量、原创性和合规性。</li>
                <li>用户可以对审核结果提出申诉。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. 隐私保护</h2>
              <p className="text-slate-700 leading-relaxed">
                我们重视用户隐私保护。具体的数据收集、使用和保护措施请参考我们的
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">《隐私政策》</a>。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. 服务变更与终止</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>我们保留随时修改或终止服务的权利。</li>
                <li>重大变更将提前通知用户。</li>
                <li>用户可以随时停止使用服务并删除账户。</li>
                <li>违反服务条款的用户可能面临账户封禁。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. 免责声明</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>本平台提供的服务按"现状"提供，不做任何明示或暗示的保证。</li>
                <li>我们不对用户提交的内容质量或准确性负责。</li>
                <li>我们不对因使用服务而造成的任何损失承担责任。</li>
                <li>外部链接的安全性和内容由链接目标网站负责。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. 争议解决</h2>
              <p className="text-slate-700 leading-relaxed">
                本服务条款的解释和争议解决均适用中华人民共和国法律。
                如发生争议，双方应友好协商解决；协商不成的，可向有管辖权的人民法院提起诉讼。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. 联系我们</h2>
              <p className="text-slate-700 leading-relaxed">
                如果您对本服务条款有任何疑问或建议，请通过以下方式联系我们：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-4">
                <li>邮箱：legal@webspark.club</li>
                <li>GitHub Issues：<a href="https://github.com/webspark-club/platform" className="text-blue-600 hover:text-blue-800 underline">提交问题</a></li>
              </ul>
            </section>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
              <p className="text-sm text-slate-600">
                <strong>重要提醒：</strong>使用本平台即表示您同意遵守上述服务条款。
                我们建议您定期查看本页面以了解最新的服务条款更新。
                继续使用服务将被视为接受更新后的条款。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 