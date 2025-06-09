export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  
  // 统计信息
  websitesCount?: number;
}

export interface TagWithCount extends Tag {
  websitesCount: number;
} 