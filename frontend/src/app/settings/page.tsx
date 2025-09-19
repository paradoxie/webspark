'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UserSettings {
  emailNotifications: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
  });

  useEffect(() => {
    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('获取设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('设置保存成功！');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);

    try {
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('测试邮件已发送，请检查你的邮箱！');
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('发送测试邮件失败');
    } finally {
      setTestingEmail(false);
    }
  };

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">通知设置</h1>
            <p className="text-slate-600 mt-1">管理你的通知偏好设置</p>
          </div>

          <div className="space-y-6">
            {/* 邮件通知设置 */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">📧 邮件通知</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">接收邮件通知</h3>
                    <p className="text-sm text-slate-500">
                      当有作品审核、评论、点赞等活动时通过邮件通知你
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 测试邮件按钮 */}
                {settings.emailNotifications && (
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {testingEmail && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                      )}
                      {testingEmail ? '发送中...' : '发送测试邮件'}
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      发送一封测试邮件来验证邮件通知是否正常工作
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 通知类型说明 */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">📋 通知类型</h2>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">作品审核</h3>
                    <p className="text-sm text-slate-500">当你的作品通过或未通过审核时</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">互动通知</h3>
                    <p className="text-sm text-slate-500">当有人点赞、评论或回复你的内容时</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">系统通知</h3>
                    <p className="text-sm text-slate-500">重要的系统更新和公告</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 隐私说明 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-slate-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">隐私保护</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    我们只会向你发送与你在 WebSpark.club 上的活动相关的通知邮件。
                    你的邮箱地址不会被分享给第三方。你可以随时关闭邮件通知。
                  </p>
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                返回控制台
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{saving ? '保存中...' : '保存设置'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}