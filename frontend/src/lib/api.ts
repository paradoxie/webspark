import { StrapiResponse, StrapiError } from '@/types/api';
import { Website, WebsiteFormData } from '@/types/website';
import { Tag } from '@/types/tag';
import { Report, ReportFormData } from '@/types/report';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

// API错误类
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// API请求封装
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = data as StrapiError;
      throw new ApiError(
        error.error?.message || '请求失败',
        response.status,
        error.error?.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('网络请求失败', 0);
  }
}

// 带认证的API请求
async function authenticatedRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// 网站相关API
export const websiteApi = {
  // 获取排序后的网站列表
  async getSortedList(page = 1, pageSize = 12): Promise<StrapiResponse<Website[]>> {
    return apiRequest(`/websites/sorted-list?page=${page}&pageSize=${pageSize}`);
  },

  // 获取单个网站
  async getById(id: number): Promise<StrapiResponse<Website>> {
    return apiRequest(`/websites/${id}?populate=*`);
  },

  // 根据slug获取网站
  async getBySlug(slug: string): Promise<StrapiResponse<Website[]>> {
    return apiRequest(`/websites?filters[slug][$eq]=${slug}&populate=*`);
  },

  // 创建网站
  async create(data: WebsiteFormData, token: string): Promise<StrapiResponse<Website>> {
    return authenticatedRequest('/websites', token, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  // 更新网站
  async update(id: number, data: Partial<WebsiteFormData>, token: string): Promise<StrapiResponse<Website>> {
    return authenticatedRequest(`/websites/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  },

  // 删除网站
  async delete(id: number, token: string): Promise<StrapiResponse<Website>> {
    return authenticatedRequest(`/websites/${id}`, token, {
      method: 'DELETE',
    });
  },

  // 点赞/取消点赞
  async toggleLike(id: number, token: string): Promise<{ message: string; action: string; likeCount: number }> {
    return authenticatedRequest(`/websites/${id}/toggle-like`, token, {
      method: 'PUT',
    });
  },

  // 收藏/取消收藏
  async toggleBookmark(id: number, token: string): Promise<{ message: string; action: string }> {
    return authenticatedRequest(`/websites/${id}/toggle-bookmark`, token, {
      method: 'PUT',
    });
  },

  // 搜索网站
  async search(query: string, page = 1, pageSize = 12): Promise<StrapiResponse<Website[]>> {
    const searchQuery = encodeURIComponent(query);
    return apiRequest(`/websites?filters[$or][0][title][$containsi]=${searchQuery}&filters[$or][1][shortDescription][$containsi]=${searchQuery}&populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
  },

  // 按标签筛选
  async getByTag(tagSlug: string, page = 1, pageSize = 12): Promise<StrapiResponse<Website[]>> {
    return apiRequest(`/websites?filters[tags][slug][$eq]=${tagSlug}&populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
  },
};

// 标签相关API
export const tagApi = {
  // 获取所有标签
  async getAll(): Promise<StrapiResponse<Tag[]>> {
    return apiRequest('/tags?sort=name:asc');
  },

  // 获取热门标签
  async getPopular(limit = 10): Promise<StrapiResponse<Tag[]>> {
    return apiRequest(`/tags?populate=websites&pagination[pageSize]=${limit}&sort=websites:desc`);
  },

  // 根据slug获取标签
  async getBySlug(slug: string): Promise<StrapiResponse<Tag[]>> {
    return apiRequest(`/tags?filters[slug][$eq]=${slug}`);
  },
};

// 举报相关API
export const reportApi = {
  // 创建举报
  async create(data: ReportFormData, token?: string): Promise<StrapiResponse<Report>> {
    const options: RequestInit = {
      method: 'POST',
      body: JSON.stringify({ data }),
    };

    if (token) {
      return authenticatedRequest('/reports', token, options);
    } else {
      return apiRequest('/reports', options);
    }
  },
};

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  async getProfile(token: string): Promise<any> {
    return authenticatedRequest('/users/me', token);
  },

  // 更新用户信息
  async updateProfile(data: any, token: string): Promise<any> {
    return authenticatedRequest('/users/me', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 获取用户的网站列表
  async getUserWebsites(userId: number, token: string): Promise<StrapiResponse<Website[]>> {
    return authenticatedRequest(`/websites?filters[author][id][$eq]=${userId}&populate=*`, token);
  },

  // 获取用户收藏的网站
  async getUserBookmarks(token: string): Promise<StrapiResponse<Website[]>> {
    return authenticatedRequest('/websites?filters[bookmarks][id][$eq]=$user&populate=*', token);
  },
}; 