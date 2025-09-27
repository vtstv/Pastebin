export interface CreatePasteRequest {
  title?: string;
  content: string;
  language?: string;
  password?: string;
  expiryHours?: number;
  isPublic?: boolean;
}

export interface PasteResponse {
  id: string;
  title?: string;
  content: string;
  language?: string;
  createdAt: Date;
  expiresAt?: Date;
  views: number;
  isPublic: boolean;
  hasPassword: boolean;
}

export interface SearchQuery {
  query?: string;
  language?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminStats {
  totalPastes: number;
  totalViews: number;
  pastesToday: number;
  expiredPastes: number;
  recentActivity: AccessLogEntry[];
}

export interface AccessLogEntry {
  id: string;
  action: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  pasteId?: string;
  metadata?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LogAction = 
  | 'CREATE_PASTE'
  | 'VIEW_PASTE' 
  | 'DELETE_PASTE'
  | 'SEARCH_PASTE'
  | 'ADMIN_LOGIN'
  | 'ADMIN_ACTION';