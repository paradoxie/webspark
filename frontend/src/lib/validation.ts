import { z } from 'zod';

// 网站提交表单验证
export const websiteSubmissionSchema = z.object({
  url: z.string()
    .min(1, '请输入网站URL')
    .url('请输入有效的URL'),
  
  title: z.string()
    .min(5, '标题至少需要5个字符')
    .max(50, '标题不能超过50个字符'),
  
  shortDescription: z.string()
    .min(20, '简短描述至少需要20个字符')
    .max(160, '简短描述不能超过160个字符'),
  
  description: z.string()
    .min(100, '详细描述至少需要100个字符'),
  
  sourceUrl: z.string()
    .url('请输入有效的源码URL')
    .optional()
    .or(z.literal('')),
  
  tags: z.array(z.string())
    .min(1, '至少选择1个标签')
    .max(5, '最多只能选择5个标签'),
});

// 举报表单验证
export const reportSchema = z.object({
  websiteId: z.number()
    .positive('无效的网站ID'),
  
  reason: z.enum([
    'SPAM',
    'INAPPROPRIATE_CONTENT', 
    'COPYRIGHT_INFRINGEMENT',
    'BROKEN_LINK',
    'OTHER'
  ], {
    required_error: '请选择举报原因',
  }),
  
  details: z.string()
    .max(500, '详细说明不能超过500个字符')
    .optional(),
});

// 用户个人资料验证
export const userProfileSchema = z.object({
  bio: z.string()
    .max(200, '个人简介不能超过200个字符')
    .optional(),
  
  website: z.string()
    .url('请输入有效的网站URL')
    .optional()
    .or(z.literal('')),
  
  location: z.string()
    .max(50, '地理位置不能超过50个字符')
    .optional(),
  
  company: z.string()
    .max(50, '公司名称不能超过50个字符')
    .optional(),
  
  twitter: z.string()
    .max(50, 'Twitter用户名不能超过50个字符')
    .optional(),
  
  linkedin: z.string()
    .url('请输入有效的LinkedIn URL')
    .optional()
    .or(z.literal('')),
});

// 标签创建验证
export const tagSchema = z.object({
  name: z.string()
    .min(2, '标签名称至少需要2个字符')
    .max(30, '标签名称不能超过30个字符')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/, '标签名称只能包含字母、数字、中文、连字符和下划线'),
  
  description: z.string()
    .max(200, '标签描述不能超过200个字符')
    .optional(),
  
  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, '请输入有效的颜色代码')
    .optional(),
});

// 搜索表单验证
export const searchSchema = z.object({
  query: z.string()
    .min(1, '请输入搜索关键词')
    .max(100, '搜索关键词不能超过100个字符'),
});

// 导出类型
export type WebsiteSubmissionData = z.infer<typeof websiteSubmissionSchema>;
export type ReportData = z.infer<typeof reportSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type TagData = z.infer<typeof tagSchema>;
export type SearchData = z.infer<typeof searchSchema>; 