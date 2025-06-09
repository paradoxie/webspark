import { MediaFile } from './api';
import { User } from './user';
import { Tag } from './tag';

export interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  description: string;
  screenshot?: MediaFile;
  sourceUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  featured: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // 关联关系
  author: User;
  tags: Tag[];
  likes?: User[];
  bookmarks?: User[];
  
  // 计算字段
  score?: number;
}

export interface WebsiteFormData {
  title: string;
  url: string;
  shortDescription: string;
  description: string;
  sourceUrl?: string;
  tags: string[];
  screenshot?: File;
}

export interface WebsiteFilters {
  search?: string;
  tags?: string[];
  featured?: boolean;
  author?: number;
  status?: Website['status'];
} 