import type {
  Category,
  CategoryType,
  CenterTip,
  Comment,
  EnrollmentRequest,
  ExamCenterDetail,
  ExamCenterSummary,
  LoginResponse,
  PagedResponse,
  PaymentConfig,
  Post,
  PostFilters,
  PostSummary,
  PostType,
  PrepCategory,
  PrepCategoryDetail,
  PrepContent,
  PrepTopic,
  PrepTopicDetail,
  TipCategory,
  UserProfile,
  UserSavedJob,
  SavedJobStatus,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://api.jobradarbd.com';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} → ${res.status}`);
  return res.json();
}

async function authGet<T>(path: string, token: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} → ${res.status}`);
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

export const getPosts = ({ categoryId, categoryTypeId, postTypeId, status, q, page = 0, size = 12 }: PostFilters = {}) =>
  get<PagedResponse<PostSummary>>('/api/posts', { categoryId, categoryTypeId, postTypeId, status, q, page, size });

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

export const adminGetAnalytics = (token: string) =>
  authGet<{
    totalPublished: number;
    totalDraft: number;
    totalUsers: number;
    totalViews: number;
    postsByDay: { date: string; count: number }[];
    topPosts: { id: number; slug: string; title: string; views: number }[];
  }>('/api/admin/analytics', token);

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

// ── Info Store ────────────────────────────────────────────────────────────────

export async function getInfoStore(token: string): Promise<string> {
  const res = await fetch(`${BASE}/api/user/info-store`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return '{}';
  const json = await res.json();
  return (json as { data: string }).data ?? '{}';
}

export async function saveInfoStore(token: string, data: object): Promise<void> {
  await fetch(`${BASE}/api/user/info-store`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// ── Admin exam center photo ───────────────────────────────────────────────────

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

// ── Device / Push notification registration ───────────────────────────────

export interface DeviceRegistrationPayload {
  deviceToken: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  deviceName?: string;
  appVersion?: string;
}

export const registerDevice = (token: string, payload: DeviceRegistrationPayload) =>
  fetch(`${BASE}/api/user/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

export const unregisterDevice = (token: string, deviceToken: string) =>
  fetch(`${BASE}/api/user/devices/${encodeURIComponent(deviceToken)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Job Preparation ───────────────────────────────────────────────────────────

export const getPrepCategories = (token?: string) =>
  token ? authGet<PrepCategory[]>('/api/prep/categories', token) : get<PrepCategory[]>('/api/prep/categories');

export const getPrepCategory = (slug: string, token?: string) =>
  token ? authGet<PrepCategoryDetail>(`/api/prep/categories/${slug}`, token) : get<PrepCategoryDetail>(`/api/prep/categories/${slug}`);

export const getPrepTopic = (slug: string, token?: string) =>
  token ? authGet<PrepTopicDetail>(`/api/prep/topics/${slug}`, token) : get<PrepTopicDetail>(`/api/prep/topics/${slug}`);

export const getPrepContent = (id: number, token?: string) =>
  token ? authGet<PrepContent>(`/api/prep/content/${id}`, token) : get<PrepContent>(`/api/prep/content/${id}`);

// Admin prep
export const adminCreatePrepCategory = (token: string, body: unknown) =>
  authPost<PrepCategory>('/api/admin/prep/categories', body, token);

export const adminUpdatePrepCategory = (token: string, id: number, body: unknown) =>
  authPut<PrepCategory>(`/api/admin/prep/categories/${id}`, body, token);

export const adminDeletePrepCategory = (token: string, id: number) =>
  authDelete(`/api/admin/prep/categories/${id}`, token);

export const adminEnrollUser = (token: string, categoryId: number, userId: number) =>
  authPost<void>(`/api/admin/prep/categories/${categoryId}/enrollments/${userId}`, {}, token);

export const adminUnenrollUser = (token: string, categoryId: number, userId: number) =>
  authDelete(`/api/admin/prep/categories/${categoryId}/enrollments/${userId}`, token);

export const adminCreatePrepTopic = (token: string, body: unknown) =>
  authPost<PrepTopic>('/api/admin/prep/topics', body, token);

export const adminUpdatePrepTopic = (token: string, id: number, body: unknown) =>
  authPut<PrepTopic>(`/api/admin/prep/topics/${id}`, body, token);

export const adminDeletePrepTopic = (token: string, id: number) =>
  authDelete(`/api/admin/prep/topics/${id}`, token);

export const adminCreatePrepContent = (token: string, body: unknown) =>
  authPost<PrepContent>('/api/admin/prep/content', body, token);

export const adminUpdatePrepContent = (token: string, id: number, body: unknown) =>
  authPut<PrepContent>(`/api/admin/prep/content/${id}`, body, token);

export const adminDeletePrepContent = (token: string, id: number) =>
  authDelete(`/api/admin/prep/content/${id}`, token);

// ── Public Exam ───────────────────────────────────────────────────────────────

export const getExamSets = (topicId: number) =>
  get<import('./types').ExamSet[]>(`/api/exam/topics/${topicId}/sets`);

export const getExamQuestions = (examSetId: number) =>
  get<import('./types').ExamQuestionPublic[]>(`/api/exam/sets/${examSetId}/questions`);

export const submitExamAttempt = (examSetId: number, answers: { questionId: number; selectedOption: string | null }[], token: string) =>
  authPost<import('./types').ExamResult>(`/api/exam/sets/${examSetId}/attempt`, { answers }, token);

// ── Admin Exam ────────────────────────────────────────────────────────────────

export const adminGetExamSets = (token: string, topicId: number) =>
  authGet<import('./types').ExamSet[]>(`/api/admin/exam/topics/${topicId}/sets`, token);

export const adminCreateExamSet = (token: string, body: unknown) =>
  authPost<import('./types').ExamSet>('/api/admin/exam/sets', body, token);

export const adminUpdateExamSet = (token: string, id: number, body: unknown) =>
  authPut<import('./types').ExamSet>(`/api/admin/exam/sets/${id}`, body, token);

export const adminDeleteExamSet = (token: string, id: number) =>
  authDelete(`/api/admin/exam/sets/${id}`, token);

export const adminGetQuestions = (token: string, examSetId: number) =>
  authGet<import('./types').ExamQuestion[]>(`/api/admin/exam/sets/${examSetId}/questions`, token);

export const adminCreateQuestion = (token: string, examSetId: number, body: unknown) =>
  authPost<import('./types').ExamQuestion>(`/api/admin/exam/sets/${examSetId}/questions`, body, token);

export const adminUpdateQuestion = (token: string, id: number, body: unknown) =>
  authPut<import('./types').ExamQuestion>(`/api/admin/exam/questions/${id}`, body, token);

export const adminDeleteQuestion = (token: string, id: number) =>
  authDelete(`/api/admin/exam/questions/${id}`, token);

// ── Comments ──────────────────────────────────────────────────────────────────
export const getComments = (slug: string) =>
  get<Comment[]>(`/api/posts/${slug}/comments`);

export const addComment = (slug: string, token: string, body: string) =>
  authPost<Comment>(`/api/posts/${slug}/comments`, { body }, token);

export const addReply = (slug: string, commentId: number, token: string, body: string) =>
  authPost<Comment>(`/api/posts/${slug}/comments/${commentId}/replies`, { body }, token);

export const deleteComment = (commentId: number, token: string) =>
  authDelete(`/api/user/comments/${commentId}`, token);

export const adminUploadImage = async (token: string, file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${BASE}/api/admin/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!r.ok) throw new Error('Upload failed');
  const data = await r.json() as { url: string };
  return data.url;
};

// ── Payment config ────────────────────────────────────────────────────────────

export const getPaymentConfig = () =>
  get<PaymentConfig>('/api/payment-config');

export const adminUpdatePaymentConfig = (token: string, bkashNumber: string, rocketNumber: string) =>
  authPut<PaymentConfig>('/api/admin/prep/payment-config', { bkashNumber, rocketNumber }, token);

// ── Enrollment requests ───────────────────────────────────────────────────────

export const submitEnrollmentRequest = (token: string, categoryId: number, paymentMethod: string, transactionId: string) =>
  authPost<EnrollmentRequest>('/api/user/prep/enrollment-requests', { categoryId, paymentMethod, transactionId }, token);

export const getMyEnrollmentRequest = async (token: string, categoryId: number): Promise<EnrollmentRequest | null> => {
  const res = await fetch(`${BASE}/api/user/prep/enrollment-requests/category/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new ApiError(res.status, `GET enrollment-request → ${res.status}`);
  return res.json();
};

export const adminGetEnrollmentRequests = (token: string, status?: string) =>
  authGet<EnrollmentRequest[]>(`/api/admin/prep/enrollment-requests${status ? `?status=${status}` : ''}`, token);

export const adminApproveEnrollmentRequest = (token: string, id: number) =>
  authPost<EnrollmentRequest>(`/api/admin/prep/enrollment-requests/${id}/approve`, {}, token);

export const adminRejectEnrollmentRequest = (token: string, id: number, adminNote?: string) =>
  authPost<EnrollmentRequest>(`/api/admin/prep/enrollment-requests/${id}/reject`, { adminNote: adminNote ?? null }, token);
