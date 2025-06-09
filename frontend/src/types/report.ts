import { User } from './user';
import { Website } from './website';

export type ReportReason = 
  | 'SPAM' 
  | 'INAPPROPRIATE_CONTENT' 
  | 'COPYRIGHT_INFRINGEMENT' 
  | 'BROKEN_LINK' 
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'CLOSED';

export interface Report {
  id: number;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  
  // 关联关系
  website: Website;
  reporter?: User;
}

export interface ReportFormData {
  websiteId: number;
  reason: ReportReason;
  details?: string;
} 