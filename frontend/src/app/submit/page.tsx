'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { toast } from 'react-hot-toast';

// 表单验证Schema
const submitSchema = z.object({
  url: z.string().url('请输入有效的网站URL'),
  title: z.string()
    .min(5, '标题至少需要5个字符')
    .max(50, '标题不能超过50个字符'),
  shortDescription: z.string()
    .min(20, '简短描述至少需要20个字符')
    .max(160, '简短描述不能超过160个字符'),
  description: z.string()
    .min(100, '详细描述至少需要100个字符'),
  tags: z.array(z.string()).min(1, '至少选择1个标签').max(5, '最多选择5个标签'),
  sourceUrl: z.string().url('请输入有效的源码URL').optional().or(z.literal('')),
  isOpenToWork: z.boolean().optional(),
});

type SubmitFormData = z.infer<typeof submitSchema>;

const predefinedTags = [
  { name: 'React', color: '#61DAFB' },
  { name: 'Vue.js', color: '#4FC08D' },
  { name: 'Angular', color: '#DD0031' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'JavaScript', color: '#F7DF1E' },
  { name: 'Next.js', color: '#000000' },
  { name: 'Nuxt.js', color: '#00DC82' },
  { name: 'Svelte', color: '#FF3E00' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Express', color: '#000000' },
  { name: 'FastAPI', color: '#009688' },
  { name: 'Django', color: '#092E20' },
  { name: 'Flask', color: '#000000' },
  { name: 'Laravel', color: '#FF2D20' },
  { name: 'WordPress', color: '#21759B' },
  { name: 'Shopify', color: '#7AB55C' },
  { name: 'Tailwind CSS', color: '#06B6D4' },
  { name: 'Bootstrap', color: '#7952B3' },
  { name: 'Sass', color: '#CC6699' },
  { name: 'GraphQL', color: '#E10098' },
  { name: 'MongoDB', color: '#47A248' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'MySQL', color: '#4479A1' },
  { name: 'Redis', color: '#DC382D' },
  { name: 'Docker', color: '#2496ED' },
  { name: 'AWS', color: '#FF9900' },
  { name: 'Vercel', color: '#000000' },
  { name: 'Netlify', color: '#00C7B7' },
  { name: 'Firebase', color: '#FFCA28' },
  { name: 'Supabase', color: '#3ECF8E' },
  { name: 'AI/ML', color: '#FF6B6B' },
  { name: 'Web3', color: '#F16822' },
  { name: '电商', color: '#FF6B35' },
  { name: '博客', color: '#4ECDC4' },
  { name: '作品集', color: '#45B7D1' },
  { name: '工具', color: '#96CEB4' },
  { name: '游戏', color: '#FECA57' },
  { name: '教育', color: '#6C5CE7' },
  { name: '社交', color: '#FD79A8' },
  { name: '音乐', color: '#FDCB6E' },
  { name: '设计', color: '#E17055' },
];

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      isOpenToWork: false,
    },
  });

  const watchedUrl = watch('url');
  const watchedTitle = watch('title');
  const watchedShortDescription = watch('shortDescription');
  const watchedDescription = watch('description');

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/submit');
    }
  }, [status, router]);

  // URL预览
  useEffect(() => {
    if (watchedUrl && watchedUrl.match(/^https?:\/\/.+/)) {
      setPreviewUrl(watchedUrl);
    }
  }, [watchedUrl]);

  const filteredTags = predefinedTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  );

  const addTag = (tagName: string) => {
    if (selectedTags.length < 5 && !selectedTags.includes(tagName)) {
      const newTags = [...selectedTags, tagName];
      setSelectedTags(newTags);
      setValue('tags', newTags);
      setTagSearchTerm('');
    }
  };

  const removeTag = (tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SubmitFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['url', 'title'];
        break;
      case 2:
        fieldsToValidate = ['shortDescription', 'tags'];
        break;
      case 3:
        fieldsToValidate = ['description'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SubmitFormData) => {
    try {
      setIsSubmitting(true);
      
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('作品提交成功！等待审核中...');
      router.push('/dashboard/websites');
    } catch (error) {
      toast.error('提交失败，请重试');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTagColor = (tagName: string) => {
    const tag = predefinedTags.find(t => t.name === tagName);
    return tag?.color || '#6B7280';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // 重定向中
  }

  const steps = [
    { number: 1, title: '基本信息', description: '网站URL和标题' },
    { number: 2, title: '描述信息', description: '简介和标签' },
    { number: 3, title: '详细描述', description: 'Markdown详情' },
    { number: 4, title: '最终确认', description: '检查并提交' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            分享你的作品
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            让全世界的开发者看到你的创意和才华
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <p className={`text-sm font-semibold ${currentStep >= step.number ? 'text-blue-600' : 'text-slate-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 transition-colors duration-300 ${
                      currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 表单内容 */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                {/* Step 1: 基本信息 */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-6">基本信息</h2>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        网站URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('url')}
                        type="url"
                        placeholder="https://your-awesome-website.com"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.url ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                        }`}
                      />
                      {errors.url && (
                        <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.url.message}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        作品标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('title')}
                        type="text"
                        placeholder="给你的作品起一个吸引人的标题"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.title ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                        }`}
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.title ? (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{errors.title.message}</span>
                          </p>
                        ) : (
                          <div></div>
                        )}
                        <span className={`text-sm ${watchedTitle?.length > 40 ? 'text-red-500' : 'text-slate-500'}`}>
                          {watchedTitle?.length || 0}/50
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        源码链接 <span className="text-slate-400">(可选)</span>
                      </label>
                      <input
                        {...register('sourceUrl')}
                        type="url"
                        placeholder="https://github.com/username/repository"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.sourceUrl && (
                        <p className="mt-2 text-sm text-red-600">{errors.sourceUrl.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: 描述信息 */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-6">描述信息</h2>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        简短描述 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register('shortDescription')}
                        rows={3}
                        placeholder="用一句话概括你的作品特色和亮点..."
                        className={`w-full px-4 py-3 rounded-xl border resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.shortDescription ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                        }`}
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.shortDescription ? (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{errors.shortDescription.message}</span>
                          </p>
                        ) : (
                          <div></div>
                        )}
                        <span className={`text-sm ${watchedShortDescription?.length > 140 ? 'text-red-500' : 'text-slate-500'}`}>
                          {watchedShortDescription?.length || 0}/160
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        技术标签 <span className="text-red-500">*</span>
                      </label>
                      
                      {/* 已选标签 */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                              style={{
                                backgroundColor: `${getTagColor(tag)}15`,
                                borderColor: `${getTagColor(tag)}40`,
                                color: getTagColor(tag),
                              }}
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 text-current hover:text-red-500 transition-colors duration-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 标签搜索 */}
                      <input
                        type="text"
                        value={tagSearchTerm}
                        onChange={(e) => setTagSearchTerm(e.target.value)}
                        placeholder="搜索或选择技术标签..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />

                      {/* 标签建议 */}
                      {tagSearchTerm && filteredTags.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg">
                          {filteredTags.slice(0, 8).map((tag) => (
                            <button
                              key={tag.name}
                              type="button"
                              onClick={() => addTag(tag.name)}
                              className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors duration-200 flex items-center space-x-2"
                            >
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span>{tag.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 热门标签 */}
                      <div className="mt-4">
                        <p className="text-sm text-slate-600 mb-2">热门标签：</p>
                        <div className="flex flex-wrap gap-2">
                          {predefinedTags.slice(0, 12).filter(tag => !selectedTags.includes(tag.name)).map((tag) => (
                            <button
                              key={tag.name}
                              type="button"
                              onClick={() => addTag(tag.name)}
                              className="px-3 py-1 rounded-full text-sm font-medium border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all duration-200"
                              disabled={selectedTags.length >= 5}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {errors.tags && (
                        <p className="mt-2 text-sm text-red-600">{errors.tags.message}</p>
                      )}
                      <p className="mt-2 text-sm text-slate-500">
                        已选择 {selectedTags.length}/5 个标签
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: 详细描述 */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-6">详细描述</h2>
                      <p className="text-slate-600 mb-6">
                        使用 Markdown 详细描述你的作品，包括技术实现、设计思路、遇到的挑战等
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        项目详情 <span className="text-red-500">*</span>
                      </label>
                      <MarkdownEditor
                        value={watchedDescription || ''}
                        onChange={(value) => setValue('description', value)}
                        placeholder="# 我的作品

## 项目简介
简要介绍你的项目...

## 技术栈
- React
- TypeScript
- Tailwind CSS

## 主要功能
1. 功能一
2. 功能二
3. 功能三

## 设计思路
分享你的设计理念...

## 遇到的挑战
描述开发过程中的难点和解决方案..."
                      />
                      {errors.description && (
                        <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                      )}
                      <p className="mt-2 text-sm text-slate-500">
                        当前字数：{watchedDescription?.length || 0} (至少100字符)
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: 最终确认 */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-6">最终确认</h2>
                      <p className="text-slate-600 mb-6">
                        请检查以下信息，确认无误后提交作品
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">基本信息</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">网站URL:</span> {watchedUrl}</p>
                          <p><span className="font-medium">标题:</span> {watchedTitle}</p>
                          <p><span className="font-medium">简短描述:</span> {watchedShortDescription}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">技术标签</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-sm font-medium border"
                              style={{
                                backgroundColor: `${getTagColor(tag)}15`,
                                borderColor: `${getTagColor(tag)}40`,
                                color: getTagColor(tag),
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center space-x-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                          <input
                            {...register('isOpenToWork')}
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-semibold text-slate-800">开放工作机会</p>
                            <p className="text-sm text-slate-600">勾选此项表示你正在寻找工作或合作机会</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 导航按钮 */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 text-slate-600 font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一步
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      下一步
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>提交中...</span>
                        </div>
                      ) : (
                        '提交作品'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧预览 */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* 网站预览 */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">网站预览</h3>
                  {previewUrl ? (
                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                      <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        title="Website Preview"
                        loading="lazy"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">输入URL查看预览</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 提交指南 */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">✨ 提交指南</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>确保网站可以正常访问</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>标题要简洁明了，能准确描述项目</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>选择合适的技术标签，方便其他人发现</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>详细描述项目亮点和技术实现</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>提供源码链接更容易获得关注</span>
                    </li>
                  </ul>
                </div>

                {/* 社区规范 */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">📋 社区规范</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>• 禁止提交违法、色情或恶意内容</p>
                    <p>• 不得抄袭他人作品</p>
                    <p>• 保证网站内容的真实性</p>
                    <p>• 遵守开源协议和版权要求</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Link 
                      href="/terms" 
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看完整服务条款 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

 