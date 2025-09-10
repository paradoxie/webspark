import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 类型定义
interface CreateWebsiteRequest {
  url: string;
  title: string;
  shortDescription: string;
  description: string;
  tags: string[];
  sourceUrl?: string;
}

interface CreateReportRequest {
  websiteId: number;
  reason: string;
  details?: string;
}

export const apiClient = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // 添加认证头
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if ((session as any)?.testToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${(session as any).testToken}`,
        };
      }
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // 网站相关API
  websites: {
    getSortedList: (params?: { page?: number; pageSize?: number }) =>
      apiClient.request(`/api/websites/sorted-list?${new URLSearchParams(params as any)}`),
    
    getBySlug: (slug: string) =>
      apiClient.request(`/api/websites/${slug}`),
    
    create: (data: CreateWebsiteRequest) =>
      apiClient.request('/api/websites', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    toggleLike: (id: number) =>
      apiClient.request(`/api/websites/${id}/like`, { method: 'PUT' }),
    
    toggleBookmark: (id: number) =>
      apiClient.request(`/api/websites/${id}/bookmark`, { method: 'PUT' }),
  },

  // 标签API
  tags: {
    getAll: () => apiClient.request('/api/tags'),
  },

  // 举报API
  reports: {
    create: (data: CreateReportRequest) =>
      apiClient.request('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}; 