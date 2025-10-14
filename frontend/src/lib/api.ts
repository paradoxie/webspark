// API 响应类型定义
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ApiError {
  error: {
    status: number;
    name: string;
    message: string;
    details?: any;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 网站相关API
export const websiteApi = {
  async getSortedList(page = 1, pageSize = 12): Promise<ApiResponse<Website[]>> {
    return apiRequest(`/api/websites/sorted?page=${page}&pageSize=${pageSize}`);
  },

  async getById(id: number): Promise<ApiResponse<Website>> {
    return apiRequest(`/api/websites/${id}`);
  },

  async getBySlug(slug: string): Promise<ApiResponse<Website[]>> {
    return apiRequest(`/api/websites?slug=${slug}`);
  },

  async create(data: WebsiteFormData, token: string): Promise<ApiResponse<Website>> {
    return apiRequest('/api/websites', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<WebsiteFormData>, token: string): Promise<ApiResponse<Website>> {
    return apiRequest(`/api/websites/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async delete(id: number, token: string): Promise<ApiResponse<Website>> {
    return apiRequest(`/api/websites/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async toggleLike(id: number, token: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return apiRequest(`/api/websites/${id}/like`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async toggleBookmark(id: number, token: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return apiRequest(`/api/websites/${id}/bookmark`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async search(query: string, page = 1, pageSize = 12): Promise<ApiResponse<Website[]>> {
    const params = new URLSearchParams({ q: query, page: page.toString(), pageSize: pageSize.toString() });
    return apiRequest(`/api/websites/search?${params}`);
  },

  async getByTag(tagSlug: string, page = 1, pageSize = 12): Promise<ApiResponse<Website[]>> {
    return apiRequest(`/api/websites?tag=${tagSlug}&page=${page}&pageSize=${pageSize}`);
  },
};

// 标签相关API
export const tagApi = {
  async getAll(): Promise<ApiResponse<Tag[]>> {
    return apiRequest('/api/tags');
  },

  async getPopular(limit = 10): Promise<ApiResponse<Tag[]>> {
    return apiRequest(`/api/tags/popular?limit=${limit}`);
  },

  async getBySlug(slug: string): Promise<ApiResponse<Tag[]>> {
    return apiRequest(`/api/tags?slug=${slug}`);
  },
};

// 举报相关API
export const reportApi = {
  async create(data: ReportFormData, token?: string): Promise<ApiResponse<Report>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return apiRequest('/api/reports', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  },
};

// 类型定义
export interface Website {
  id: number;
  title: string;
  shortDescription: string;
  description: string;
  url: string;
  sourceUrl?: string;
  slug: string;
  likeCount: number;
  viewCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  author: User;
  tags: Tag[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  githubUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  websiteCount?: number;
}

export interface Report {
  id: number;
  reason: 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'COPYRIGHT_INFRINGEMENT' | 'BROKEN_LINK' | 'OTHER';
  details?: string;
  status: 'OPEN' | 'CLOSED';
  websiteId: number;
  userId?: number;
}

export interface WebsiteFormData {
  title: string;
  shortDescription: string;
  description: string;
  url: string;
  sourceUrl?: string;
  tags: string[];
}

export interface ReportFormData {
  websiteId: number;
  reason: 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'COPYRIGHT_INFRINGEMENT' | 'BROKEN_LINK' | 'OTHER';
  details?: string;
}

// 用户相关API
export const userApi = {
  async getUserWebsites(userId: number, token: string): Promise<ApiResponse<Website[]>> {
    return apiRequest(`/api/users/${userId}/websites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getUserBookmarks(token: string): Promise<ApiResponse<Website[]>> {
    return apiRequest('/api/users/me/bookmarks', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
}; 