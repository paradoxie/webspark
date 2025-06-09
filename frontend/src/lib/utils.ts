import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并Tailwind CSS类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// 格式化相对时间
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}天前`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}周前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前`;
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

// 验证URL
export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// 生成slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}

// 格式化数字（添加千分位分隔符）
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

// 获取图片URL（处理Strapi的相对路径）
export function getImageUrl(url?: string): string {
  if (!url) return '/placeholder-image.jpg';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${url}`;
}

// 提取域名
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

// 生成随机颜色（用于标签）
export function generateRandomColor(): string {
  const colors = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#84cc16', // lime-500
    '#f59e0b', // amber-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 