'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/common/ImageUpload';

interface SubmitFormData {
  url: string;
  title: string;
  shortDescription: string;
  description: string;
  tags: string[];
  sourceUrl: string;
  isHiring: boolean;
  categoryId: number | null;
  screenshots: string[];
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<SubmitFormData>({
    url: '',
    title: '',
    shortDescription: '',
    description: '',
    tags: [],
    sourceUrl: '',
    isHiring: false,
    categoryId: null,
    screenshots: []
  });

  // 获取可用标签和分类
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/categories')
        ]);

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setAvailableTags(tagsData.data);
        } else {
          toast.error('加载标签失败');
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setAvailableCategories(categoriesData.data);
        } else {
          toast.error('加载分类失败');
        }
      } catch (error) {
        toast.error('网络错误，请重试');
      } finally {
        setLoadingTags(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, []);

  // 重定向未登录用户
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/submit');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.url) {
      newErrors.url = 'URL是必填项';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = '请输入有效的URL（包含http://或https://）';
    }

    if (!formData.title) {
      newErrors.title = '标题是必填项';
    } else if (formData.title.length < 5 || formData.title.length > 50) {
      newErrors.title = '标题长度必须在5-50个字符之间';
    }

    if (!formData.shortDescription) {
      newErrors.shortDescription = '简短描述是必填项';
    } else if (formData.shortDescription.length < 20 || formData.shortDescription.length > 160) {
      newErrors.shortDescription = '简短描述长度必须在20-160个字符之间';
    }

    if (!formData.description) {
      newErrors.description = '详细描述是必填项';
    } else if (formData.description.length < 100) {
      newErrors.description = '详细描述至少需要100个字符';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = '至少选择一个标签';
    } else if (formData.tags.length > 5) {
      newErrors.tags = '最多只能选择5个标签';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '请选择一个分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('请修正表单错误');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success('作品提交成功！等待审核中...');

        // 如果返回了作品数据，跳转到作品详情页；否则跳转到dashboard
        if (responseData.data && responseData.data.slug) {
          router.push(`/sites/${responseData.data.slug}`);
        } else {
          router.push('/dashboard?tab=works');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '提交失败，请重试');
      }
    } catch (error) {
      toast.error('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tag)
      }));
    } else if (formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">提交作品</h1>
            <p className="text-slate-600 mt-2">分享你的创意，让更多人看到你的作品</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                作品链接 *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.url ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="https://example.com"
              />
              {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                作品标题 * ({formData.title.length}/50)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="给你的作品起个吸引人的名字"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                作品分类 *
              </label>
              {loadingCategories ? (
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  <span className="text-sm">加载分类中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, categoryId: category.id }))}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        formData.categoryId === category.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-sm font-medium">{category.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
            </div>

            {/* 简短描述 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                简短描述 * ({formData.shortDescription.length}/160)
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.shortDescription ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="用简洁的语言描述你的作品特色"
              />
              {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>}
            </div>

            {/* 详细描述 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                详细描述 * (支持Markdown，{formData.description.length}字符)
              </label>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-slate-50 border-b px-3 py-2 flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`px-3 py-1 rounded text-sm ${
                      !previewMode ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 rounded text-sm ${
                      previewMode ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    预览
                  </button>
                </div>
                
                {!previewMode ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border-0 focus:outline-none resize-none"
                    placeholder="详细介绍你的作品：技术栈、设计理念、解决的问题等..."
                  />
                ) : (
                  <div className="px-3 py-2 min-h-[200px] prose prose-sm max-w-none">
                    {formData.description ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: formData.description.replace(/\n/g, '<br>') 
                      }} />
                    ) : (
                      <p className="text-slate-400">预览将在这里显示...</p>
                    )}
                  </div>
                )}
              </div>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* 标签选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                技术标签 * (已选择: {formData.tags.length}/5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {loadingTags ? (
                <div className="flex items-center space-x-2 text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  <span className="text-sm">加载标签中...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.filter(tag => !formData.tags.includes(tag.name)).map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      disabled={formData.tags.length >= 5}
                      className="px-3 py-1 rounded-full text-sm border border-slate-300 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
            </div>

            {/* 作品截图 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                作品截图 (可选)
              </label>
              <ImageUpload
                type="screenshot"
                multiple={true}
                maxFiles={5}
                onUploadMultiple={(urls) => setFormData(prev => ({ 
                  ...prev, 
                  screenshots: [...prev.screenshots, ...urls] 
                }))}
                className="w-full"
              />
              
              {/* 已上传的截图预览 */}
              {formData.screenshots.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">已上传的截图：</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.screenshots.map((screenshot, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={screenshot}
                          alt={`截图 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            screenshots: prev.screenshots.filter((_, i) => i !== index)
                          }))}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 源码链接 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                源码链接 (可选)
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/username/project"
              />
            </div>

            {/* 求职状态 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHiring"
                checked={formData.isHiring}
                onChange={(e) => setFormData(prev => ({ ...prev, isHiring: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="isHiring" className="ml-2 block text-sm text-slate-700">
                我正在寻找工作机会
              </label>
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmitting ? '提交中...' : '提交作品'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

 