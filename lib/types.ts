export type PostStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED' | 'EXPIRED';
export type Lang = 'bn' | 'en';

export interface CategoryType {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  categoryTypeId: number;
  createdAt: string;
}

export interface PostType {
  id: number;
  name: string;
  slug: string;
}

export interface PostSummary {
  id: number;
  titleBn: string | null;
  titleEn: string;
  slug: string;
  organizationName: string | null;
  district: string | null;
  status: PostStatus;
  applicationStart: string | null;
  applicationEnd: string | null;
  publishedAt: string;
  categoryName: string;
  postTypeName: string | null;
}

export interface PostImage {
  id: number;
  url: string;
  createdAt: string;
}

export interface Post {
  id: number;
  titleBn: string | null;
  titleEn: string;
  slug: string;
  category: Category;
  postType: PostType | null;
  organizationName: string | null;
  qualification: string | null;
  district: string | null;
  description: string | null;
  applicationStart: string | null;
  applicationEnd: string | null;
  status: PostStatus;
  sourceUrl: string | null;
  circularPdfUrl: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  images: PostImage[];
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface PostFilters {
  categoryId?: number;
  postTypeId?: number;
  status?: PostStatus;
  q?: string;
  page?: number;
  size?: number;
}

export type SavedJobStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export interface UserSavedJob {
  id: number;
  post: PostSummary;
  status: SavedJobStatus;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  stats: {
    saved: number;
    applied: number;
    interview: number;
    offer: number;
    total: number;
  };
}
