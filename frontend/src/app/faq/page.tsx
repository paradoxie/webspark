import { Metadata } from 'next'
import Breadcrumb from '@/components/common/Breadcrumb'

export const metadata: Metadata = {
  title: '常见问题 - WebSpark.club',
  description: '关于WebSpark.club平台使用、作品提交、账户管理等常见问题的解答',
  keywords: '常见问题,FAQ,帮助,作品提交,平台使用,WebSpark.club',
  openGraph: {
    title: '常见问题 - WebSpark.club',
    description: '关于WebSpark.club平台使用、作品提交、账户管理等常见问题的解答',
    type: 'website',
    url: 'https://webspark.club/faq',
  },
  twitter: {
    card: 'summary_large_image',
    title: '常见问题 - WebSpark.club',
    description: '关于WebSpark.club平台使用、作品提交、账户管理等常见问题的解答',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://webspark.club/faq',
  },
}

const faqData = [
  {
    question: "什么是WebSpark.club？",
    answer: "WebSpark.club是一个专为Web开发者打造的作品展示和交流平台。开发者可以在这里分享自己的项目、获得社区反馈、发现优秀的开发作品，并与其他开发者建立联系。"
  },
  {
    question: "如何提交我的作品？",
    answer: "首先需要使用GitHub账号登录，然后点击导航栏的\"提交作品\"按钮。填写项目基本信息，包括标题、描述、链接、技术标签等。提交后作品将进入审核队列，通过审核后会在平台上展示。"
  },
  {
    question: "作品审核需要多长时间？",
    answer: "通常作品审核会在1-3个工作日内完成。我们会检查作品链接的有效性、内容质量和描述准确性。如果作品被拒绝，您会收到具体的反馈信息。"
  },
  {
    question: "支持哪些类型的项目？",
    answer: "我们欢迎所有类型的Web项目，包括但不限于：网站应用、Web工具、前端组件、开源库、API服务、小程序等。项目可以使用任何技术栈，如React、Vue、Angular、Node.js、Python等。"
  },
  {
    question: "如何提高作品的曝光度？",
    answer: "您可以：1) 写出清晰详细的项目描述；2) 添加准确的技术标签；3) 确保项目链接可访问；4) 上传项目截图；5) 在社交媒体分享您的作品链接。优质的作品会被推荐到首页。"
  },
  {
    question: "可以修改已提交的作品信息吗？",
    answer: "目前还不支持直接编辑已发布的作品。如需修改，请联系管理员或重新提交作品。我们正在开发作品编辑功能，预计很快上线。"
  },
  {
    question: "如何举报不当内容？",
    answer: "如果发现违规内容、抄袭作品或其他不当行为，可以点击作品页面的\"举报\"按钮，选择举报原因并提供详细信息。我们会在24小时内处理举报。"
  },
  {
    question: "WebSpark.club是免费的吗？",
    answer: "是的，WebSpark.club对所有开发者完全免费。您可以免费提交作品、浏览项目、与其他开发者互动。我们致力于为开发者社区提供一个开放、免费的交流平台。"
  },
  {
    question: "如何联系客服或技术支持？",
    answer: "您可以通过以下方式联系我们：1) 发送邮件至support@webspark.club；2) 在GitHub仓库提交Issue；3) 通过平台的反馈功能。我们会尽快回复您的问题。"
  },
  {
    question: "支持哪些浏览器？",
    answer: "WebSpark.club支持所有现代浏览器，包括Chrome、Firefox、Safari、Edge等。建议使用最新版本的浏览器以获得最佳体验。我们的网站采用响应式设计，完美支持移动设备。"
  }
]

export default function FAQPage() {
  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: '常见问题', url: '/faq' },
  ]

  // FAQ结构化数据
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      {/* FAQ结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* 页面标题 */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              常见问题
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              关于WebSpark.club平台使用的常见问题解答，帮助您更好地了解和使用我们的服务
            </p>
          </header>

          {/* FAQ内容 */}
          <div className="space-y-8">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h2 
                  className="text-xl font-semibold text-slate-900 mb-4 flex items-start"
                  itemProp="name"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
                    {index + 1}
                  </span>
                  {faq.question}
                </h2>
                <div 
                  className="text-slate-600 leading-relaxed ml-11"
                  itemProp="acceptedAnswer"
                  itemScope
                  itemType="https://schema.org/Answer"
                >
                  <div itemProp="text">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部联系信息 */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              还有其他问题？
            </h2>
            <p className="text-slate-600 mb-6">
              如果您的问题没有在上述列表中找到答案，欢迎随时联系我们
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@webspark.club"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                发送邮件
              </a>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                在线咨询
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}