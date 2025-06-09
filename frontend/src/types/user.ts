export interface User {
  id: number;
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // GitHub相关字段
  githubId?: string;
  githubUsername?: string;
  avatar?: string;
  
  // 个人资料
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  twitter?: string;
  linkedin?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  githubUsername?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  twitter?: string;
  linkedin?: string;
  createdAt: string;
  
  // 统计信息
  websitesCount?: number;
  totalLikes?: number;
  totalViews?: number;
} 