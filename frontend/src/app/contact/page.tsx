'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="glass-card p-12 rounded-3xl animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">消息已发送</h1>
            <p className="text-slate-600 mb-8">
              感谢您的反馈！我们已收到您的消息，将在24小时内回复。
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  name: '',
                  email: '',
                  subject: '',
                  message: '',
                  type: 'general'
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              发送另一条消息
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            联系我们
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            有任何问题、建议或需要帮助？我们很乐意听到您的声音
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 联系方式 */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">邮箱</h3>
                  <p className="text-slate-600">contact@webspark.club</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                一般咨询和技术支持
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">响应时间</h3>
                  <p className="text-slate-600">24小时内</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                我们承诺快速回复
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">社交媒体</h3>
                  <p className="text-slate-600">@WebSparkClub</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                关注我们获取最新动态
              </p>
            </div>

            {/* 常见问题 */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 常见问题</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">如何提交作品？</p>
                  <p className="text-slate-500">登录后点击"提交作品"按钮</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">审核需要多长时间？</p>
                  <p className="text-slate-500">通常在1-3个工作日内完成</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">如何修改已提交的作品？</p>
                  <p className="text-slate-500">在个人中心可以编辑您的作品</p>
                </div>
              </div>
            </div>
          </div>

          {/* 联系表单 */}
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="glass-card p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">发送消息</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 glass-card focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                      placeholder="您的姓名"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      邮箱 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 glass-card focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
                    问题类型
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 glass-card focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  >
                    <option value="general">一般咨询</option>
                    <option value="technical">技术支持</option>
                    <option value="content">内容问题</option>
                    <option value="account">账户问题</option>
                    <option value="partnership">合作洽谈</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                    主题 *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 glass-card focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                    placeholder="简要描述您的问题"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                    详细信息 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 glass-card focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl resize-none"
                    placeholder="请详细描述您的问题或建议..."
                  />
                </div>

                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>我们重视您的隐私，不会与第三方分享您的信息</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>发送中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>发送消息</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 