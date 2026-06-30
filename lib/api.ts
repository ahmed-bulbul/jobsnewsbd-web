import type {
  Category,
  CategoryType,
  CenterTip,
  ExamCenterDetail,
  ExamCenterSummary,
  LoginResponse,
  PagedResponse,
  Post,
  PostFilters,
  PostSummary,
  PostType,
  TipCategory,
  UserProfile,
  UserSavedJob,
  SavedJobStatus,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function authPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `POST ${path} → ${res.status}`);
  }
  return res.json();
}

async function authPut<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json();
}

async function authDelete(path: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

// ── Public ─────────────────────────────────────────────────────────────────

export const getCategoryTypes = () =>
  get<CategoryType[]>('/api/category-types');

export const getCategories = (categoryTypeId?: number) =>
  get<Category[]>('/api/categories', categoryTypeId ? { categoryTypeId } : undefined);

export const getPostTypes = () =>
  get<PostType[]>('/api/post-types');

export const getPosts = ({ categoryId, postTypeId, status, q, page = 0, size = 12 }: PostFilters = {}) =>
  get<PagedResponse<PostSummary>>('/api/posts', { categoryId, postTypeId, status, q, page, size });

export const getPostBySlug = (slug: string) =>
  get<Post>(`/api/posts/${slug}`);

// ── Auth ────────────────────────────────────────────────────────────────────

export const userRegister = (name: string, email: string, phone: string, password: string) =>
  authPost<{ message: string }>('/api/auth/register', { name, email, phone, password });

export const verifyOtp = (email: string, otp: string) =>
  authPost<LoginResponse>('/api/auth/verify-otp', { email, otp });

export const resendOtp = (email: string) =>
  authPost<{ message: string }>('/api/auth/resend-otp', { email });

export const login = (email: string, password: string) =>
  authPost<LoginResponse>('/api/auth/login', { email, password });

// ── Admin ───────────────────────────────────────────────────────────────────

export const adminGetPosts = (token: string, page = 0, size = 20) =>
  fetch(`${BASE}/api/admin/posts?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json() as Promise<PagedResponse<PostSummary>>);

export const adminCreatePost = (body: unknown, token: string) =>
  authPost<Post>('/api/admin/posts', body, token);

export const adminUpdatePost = (id: number, body: unknown, token: string) =>
  authPut<Post>(`/api/admin/posts/${id}`, body, token);

export const adminDeletePost = (id: number, token: string) =>
  authDelete(`/api/admin/posts/${id}`, token);

export const adminCreateCategoryType = (body: unknown, token: string) =>
  authPost<CategoryType>('/api/admin/category-types', body, token);

export const adminCreateCategory = (body: unknown, token: string) =>
  authPost<Category>('/api/admin/categories', body, token);

export const adminCreatePostType = (body: unknown, token: string) =>
  authPost<PostType>('/api/admin/post-types', body, token);

export async function adminUploadCircularPdf(postId: number, file: File, token: string): Promise<Post> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/admin/posts/${postId}/circular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload PDF → ${res.status}`);
  return res.json();
}

export const adminDeleteCircularPdf = (postId: number, token: string) =>
  authDelete(`/api/admin/posts/${postId}/circular`, token);

// ── User profile & saved jobs ───────────────────────────────────────────────

export const getUserProfile = (token: string) =>
  fetch(`${BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => { if (!r.ok) throw new Error('Unauthorized'); return r.json() as Promise<UserProfile>; });

export const updateUserProfile = (token: string, name: string, phone: string) =>
  authPut<UserProfile>('/api/user/profile', { name, phone }, token);

export const getSavedJobs = (token: string) =>
  fetch(`${BASE}/api/user/saved-jobs`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json() as Promise<UserSavedJob[]>);

export const saveJob = (token: string, postId: number) =>
  authPost<UserSavedJob>('/api/user/saved-jobs', { postId }, token);

export const updateSavedJob = (token: string, id: number, status: SavedJobStatus, notes: string | null, appliedAt?: string | null) =>
  authPut<UserSavedJob>(`/api/user/saved-jobs/${id}`, { status, notes, appliedAt }, token);

export const removeSavedJob = (token: string, id: number) =>
  authDelete(`/api/user/saved-jobs/${id}`, token);

export const checkJobSaved = (token: string, postId: number) =>
  fetch(`${BASE}/api/user/saved-jobs/check/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json() as Promise<{ saved: boolean }>);

export async function uploadProfilePhoto(token: string, file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/user/profile/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Upload failed');
  }
  return res.json();
}

export const removeProfilePhoto = (token: string) =>
  fetch(`${BASE}/api/user/profile/photo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json() as Promise<UserProfile>);

// ── Exam Centers ─────────────────────────────────────────────────────────────

export const getExamCenters = (q?: string) =>
  fetch(`${BASE}/api/exam-centers${q ? `?q=${encodeURIComponent(q)}` : ''}`, { next: { revalidate: 300 } })
    .then((r) => r.json() as Promise<ExamCenterSummary[]>);

export const getExamCenter = (id: number, token?: string) =>
  fetch(`${BASE}/api/exam-centers/${id}`, {
    next: { revalidate: 60 },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.json() as Promise<ExamCenterDetail>);

export const getExamCenterTips = async (id: number, category?: TipCategory, token?: string): Promise<CenterTip[]> => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const qs = params.toString();
  const res = await fetch(`${BASE}/api/exam-centers/${id}/tips${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const addCenterTip = (centerId: number, token: string, category: TipCategory | undefined, body: string) =>
  authPost<CenterTip>(`/api/user/exam-centers/${centerId}/tips`, { category, body }, token);

export const deleteCenterTip = (tipId: number, token: string) =>
  authDelete(`/api/user/exam-centers/tips/${tipId}`, token);

export const toggleTipUpvote = (tipId: number, token: string) =>
  fetch(`${BASE}/api/user/exam-centers/tips/${tipId}/upvote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json() as Promise<CenterTip>);

export const castMobileVote = (centerId: number, token: string, allowed: boolean) =>
  fetch(`${BASE}/api/user/exam-centers/${centerId}/mobile-vote?allowed=${allowed}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json() as Promise<ExamCenterDetail>);

// ── Admin Exam Centers ────────────────────────────────────────────────────────

export const adminGetExamCenters = (token: string) =>
  fetch(`${BASE}/api/admin/exam-centers`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json() as Promise<ExamCenterSummary[]>);

export const adminCreateExamCenter = (token: string, body: unknown) =>
  authPost<ExamCenterDetail>('/api/admin/exam-centers', body, token);

export const adminUpdateExamCenter = (token: string, id: number, body: unknown) =>
  authPut<ExamCenterDetail>(`/api/admin/exam-centers/${id}`, body, token);

export const adminDeleteExamCenter = (token: string, id: number) =>
  authDelete(`/api/admin/exam-centers/${id}`, token);

export const adminDeleteCenterTip = (token: string, tipId: number) =>
  authDelete(`/api/admin/exam-centers/tips/${tipId}`, token);

export async function adminUploadExamCenterPhoto(token: string, id: number, file: File): Promise<ExamCenterDetail> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/admin/exam-centers/${id}/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload photo → ${res.status}`);
  return res.json();
}
