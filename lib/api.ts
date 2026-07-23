import type {
  AdminJobExperience,
  AdminInstituteReview,
  AdminBookListing,
  BookListing,
  BookListingDetail,
  BookListingSubmission,
  BookOrder,
  BookOrderBuyerInfo,
  Category,
  CategoryType,
  CenterTip,
  Comment,
  EnrollmentRequest,
  ExamCenterDetail,
  ExamCenterSummary,
  InstituteReview,
  InstituteReviewSubmission,
  JobExperience,
  JobExperienceSubmission,
  LoginResponse,
  MyInstituteReview,
  MyJobExperience,
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
  RecommendedBook,
  RecommendedBookRequest,
  MyBookListing,
  TipCategory,
  UserProfile,
  UserSavedJob,
  SavedJobStatus,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jobradarbd.com';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Silent token refresh ─────────────────────────────────────────────────────
// Access tokens are short-lived (1h). Rather than log the user out the moment
// one expires, we keep the refresh token alongside it in localStorage and,
// on any 401 from a call using the *current* logged-in user's token, swap in
// a fresh access token and retry the request once. This deliberately does NOT
// touch the separate admin-panel token (`admin_token`) — admin sessions are
// unaffected and behave exactly as before.

const AUTH_STORAGE_KEY = 'user_auth';

interface StoredAuth {
  token: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  userId: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
}

function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function setStoredAuth(auth: StoredAuth) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new CustomEvent('auth:updated', { detail: auth }));
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('auth:logout'));
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Uses the stored refresh token to obtain a new access token, deduplicating
 * concurrent callers into a single network request. Returns the new access
 * token, or null if the refresh token is missing/expired/revoked (session is
 * genuinely over — caller should treat this as a real logout).
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const stored = getStoredAuth();
    if (!stored?.refreshToken) return null;
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      if (res.status === 401) {
        // The refresh token itself is invalid/expired/revoked — this is a
        // genuine logout, not a blip.
        clearStoredAuth();
        return null;
      }
      if (!res.ok) {
        // Transient/server error (5xx, etc.) — don't wipe the session over
        // a temporary outage. Just fail this one refresh attempt; the next
        // API call will try again.
        return null;
      }
      const data: LoginResponse = await res.json();
      setStoredAuth({
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        photoUrl: stored.photoUrl,
      });
      return data.token;
    } catch {
      // Network error (e.g. offline) — don't log the user out over it.
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Retries a 401 response by refreshing the access token, but only if the
 * token that failed belongs to the currently logged-in regular user (not an
 * admin-panel token, and not an anonymous/no-token call like login itself).
 * Returns the retried Response, or the original 401 response if refresh
 * wasn't applicable/succeeded.
 */
async function retryWithRefreshedToken(
  originalToken: string | undefined,
  originalResponse: Response,
  doFetch: (token: string) => Promise<Response>
): Promise<Response> {
  if (!originalToken) return originalResponse;
  const stored = getStoredAuth();
  if (!stored || stored.token !== originalToken) return originalResponse;

  const newToken = await refreshAccessToken();
  if (!newToken) return originalResponse;
  return doFetch(newToken);
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

/**
 * GET that attaches an Authorization header only when a token is supplied,
 * without requiring one — used for endpoints like book-listing detail where
 * the response reveals more (seller contact info) to logged-in requesters
 * but still works for anonymous browsing. Never cached, since the response
 * shape differs per requester.
 */
async function getOptionalAuth<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
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
  const doFetch = (tok: string) => fetch(url.toString(), { headers: { Authorization: `Bearer ${tok}` } });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) throw new ApiError(res.status, `GET ${path} → ${res.status}`);
  return res.json();
}

async function authPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const doFetch = (tok?: string) => fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `POST ${path} → ${res.status}`);
  }
  return res.json();
}

async function authPut<T>(path: string, body: unknown, token: string): Promise<T> {
  const doFetch = (tok: string) => fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
    body: JSON.stringify(body),
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json();
}

async function authPatch<T>(path: string, body: unknown, token: string): Promise<T> {
  const doFetch = (tok: string) => fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
    body: JSON.stringify(body),
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json();
}

async function authDelete(path: string, token: string): Promise<void> {
  const doFetch = (tok: string) => fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tok}` },
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

export const logout = (refreshToken: string) =>
  fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {}); // best-effort — client-side logout must not block on this

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
  authGet<UserProfile>('/api/user/profile', token);

export const updateUserProfile = (token: string, name: string, phone: string) =>
  authPut<UserProfile>('/api/user/profile', { name, phone }, token);

export const getSavedJobs = (token: string) =>
  authGet<UserSavedJob[]>('/api/user/saved-jobs', token);

export const saveJob = (token: string, postId: number) =>
  authPost<UserSavedJob>('/api/user/saved-jobs', { postId }, token);

export const updateSavedJob = (token: string, id: number, status: SavedJobStatus, notes: string | null, appliedAt?: string | null) =>
  authPut<UserSavedJob>(`/api/user/saved-jobs/${id}`, { status, notes, appliedAt }, token);

export const removeSavedJob = (token: string, id: number) =>
  authDelete(`/api/user/saved-jobs/${id}`, token);

export const checkJobSaved = (token: string, postId: number) =>
  authGet<{ saved: boolean }>(`/api/user/saved-jobs/check/${postId}`, token);

export async function uploadProfilePhoto(token: string, file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file);
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/profile/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: form,
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Upload failed');
  }
  return res.json();
}

export async function removeProfilePhoto(token: string): Promise<UserProfile> {
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/profile/photo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tok}` },
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) throw new Error(`DELETE profile photo → ${res.status}`);
  return res.json();
}

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
  authPost<CenterTip>(`/api/user/exam-centers/tips/${tipId}/upvote`, {}, token);

export const castMobileVote = (centerId: number, token: string, allowed: boolean) =>
  authPost<ExamCenterDetail>(`/api/user/exam-centers/${centerId}/mobile-vote?allowed=${allowed}`, {}, token);

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
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/info-store`, {
    headers: { Authorization: `Bearer ${tok}` },
    cache: 'no-store',
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) return '{}';
  const json = await res.json();
  return (json as { data: string }).data ?? '{}';
}

export async function saveInfoStore(token: string, data: object): Promise<void> {
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/info-store`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
    body: JSON.stringify(data),
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
}

export async function uploadInfoStoreDocument(
  token: string,
  file: File
): Promise<Omit<import('./types').InfoStoreDocument, 'id' | 'label'>> {
  const form = new FormData();
  form.append('file', file);
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/info-store/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: form,
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Upload document → ${res.status}`);
  }
  return res.json();
}

export async function deleteInfoStoreDocument(token: string, url: string): Promise<void> {
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/info-store/documents?url=${encodeURIComponent(url)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tok}` },
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
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
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/prep/enrollment-requests/category/${categoryId}`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
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

// ── Job Experience Share ──────────────────────────────────────────────────────

export const getJobExperiences = (params: { outcome?: string; q?: string; page?: number; size?: number } = {}) =>
  get<PagedResponse<JobExperience>>('/api/job-experiences', {
    outcome: params.outcome, q: params.q, page: params.page ?? 0, size: params.size ?? 10,
  });

export const getJobExperience = (id: number) =>
  get<JobExperience>(`/api/job-experiences/${id}`);

export const submitJobExperience = (token: string, body: JobExperienceSubmission) =>
  authPost<MyJobExperience>('/api/user/job-experiences', body, token);

export const getMyJobExperiences = (token: string, page = 0, size = 20) =>
  authGet<PagedResponse<MyJobExperience>>('/api/user/job-experiences/mine', token, { page, size });

export const adminGetJobExperiences = (token: string, status?: string, page = 0, size = 20) =>
  authGet<PagedResponse<AdminJobExperience>>('/api/admin/job-experiences', token, { status, page, size });

export const adminApproveJobExperience = (token: string, id: number) =>
  authPost<AdminJobExperience>(`/api/admin/job-experiences/${id}/approve`, {}, token);

export const adminRejectJobExperience = (token: string, id: number, adminNote?: string) =>
  authPost<AdminJobExperience>(`/api/admin/job-experiences/${id}/reject`, { adminNote: adminNote ?? null }, token);

export const adminDeleteJobExperience = (token: string, id: number) =>
  authDelete(`/api/admin/job-experiences/${id}`, token);

// ── Institute Reviews ────────────────────────────────────────────────────────

export const getInstituteReviews = (params: { q?: string; page?: number; size?: number } = {}) =>
  get<PagedResponse<InstituteReview>>('/api/institute-reviews', {
    q: params.q, page: params.page ?? 0, size: params.size ?? 10,
  });

export const getInstituteReview = (id: number) =>
  get<InstituteReview>(`/api/institute-reviews/${id}`);

export const submitInstituteReview = (token: string, body: InstituteReviewSubmission) =>
  authPost<MyInstituteReview>('/api/user/institute-reviews', body, token);

export const getMyInstituteReviews = (token: string, page = 0, size = 20) =>
  authGet<PagedResponse<MyInstituteReview>>('/api/user/institute-reviews/mine', token, { page, size });

export const adminGetInstituteReviews = (token: string, status?: string, page = 0, size = 20) =>
  authGet<PagedResponse<AdminInstituteReview>>('/api/admin/institute-reviews', token, { status, page, size });

export const adminApproveInstituteReview = (token: string, id: number) =>
  authPost<AdminInstituteReview>(`/api/admin/institute-reviews/${id}/approve`, {}, token);

export const adminRejectInstituteReview = (token: string, id: number, adminNote?: string) =>
  authPost<AdminInstituteReview>(`/api/admin/institute-reviews/${id}/reject`, { adminNote: adminNote ?? null }, token);

export const adminDeleteInstituteReview = (token: string, id: number) =>
  authDelete(`/api/admin/institute-reviews/${id}`, token);

// ── Recommended Books ──────────────────────────────────────────────────────────

export const getRecommendedBooks = (params: { category?: string; q?: string; page?: number; size?: number } = {}) =>
  get<PagedResponse<RecommendedBook>>('/api/recommended-books', {
    category: params.category, q: params.q, page: params.page ?? 0, size: params.size ?? 20,
  });

export const getRecommendedBook = (id: number) =>
  get<RecommendedBook>(`/api/recommended-books/${id}`);

export const adminCreateRecommendedBook = (token: string, body: RecommendedBookRequest) =>
  authPost<RecommendedBook>('/api/admin/recommended-books', body, token);

export const adminUpdateRecommendedBook = (token: string, id: number, body: RecommendedBookRequest) =>
  authPut<RecommendedBook>(`/api/admin/recommended-books/${id}`, body, token);

export const adminDeleteRecommendedBook = (token: string, id: number) =>
  authDelete(`/api/admin/recommended-books/${id}`, token);

export async function adminUploadBookCover(token: string, id: number, file: File): Promise<RecommendedBook> {
  const form = new FormData();
  form.append('file', file);
  const doFetch = (tok: string) => fetch(`${BASE}/api/admin/recommended-books/${id}/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: form,
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Upload cover → ${res.status}`);
  }
  return res.json();
}

// ── Book Marketplace ───────────────────────────────────────────────────────────

export const getBookListings = (params: { q?: string; page?: number; size?: number } = {}) =>
  get<PagedResponse<BookListing>>('/api/book-listings', {
    q: params.q, page: params.page ?? 0, size: params.size ?? 20,
  });

// Passing a token (when the viewer is logged in) reveals the seller's contact
// info in the response; omitting it still works for anonymous browsing.
export const getBookListing = (id: number, token?: string) =>
  getOptionalAuth<BookListingDetail>(`/api/book-listings/${id}`, token);

export const submitBookListing = (token: string, body: BookListingSubmission) =>
  authPost<MyBookListing>('/api/user/book-listings', body, token);

export const getMyBookListings = (token: string, page = 0, size = 20) =>
  authGet<PagedResponse<MyBookListing>>('/api/user/book-listings/mine', token, { page, size });

export const setBookListingSold = (token: string, id: number, sold: boolean) =>
  authPatch<MyBookListing>(`/api/user/book-listings/${id}/sold`, { sold }, token);

export const deleteMyBookListing = (token: string, id: number) =>
  authDelete(`/api/user/book-listings/${id}`, token);

export async function uploadBookListingPhoto(token: string, id: number, file: File): Promise<MyBookListing> {
  const form = new FormData();
  form.append('file', file);
  const doFetch = (tok: string) => fetch(`${BASE}/api/user/book-listings/${id}/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: form,
  });
  let res = await doFetch(token);
  if (res.status === 401) res = await retryWithRefreshedToken(token, res, doFetch);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Upload photo → ${res.status}`);
  }
  return res.json();
}

export const placeBookOrder = (token: string, listingId: number) =>
  authPost<BookOrder>(`/api/user/book-listings/${listingId}/order`, {}, token);

export const getBookListingOrders = (token: string, listingId: number) =>
  authGet<BookOrderBuyerInfo[]>(`/api/user/book-listings/${listingId}/orders`, token);

export const getMyBookOrders = (token: string, page = 0, size = 20) =>
  authGet<PagedResponse<BookOrder>>('/api/user/book-orders/mine', token, { page, size });

export const cancelBookOrder = (token: string, id: number) =>
  authDelete(`/api/user/book-orders/${id}`, token);

export const adminGetBookListings = (token: string, status?: string, page = 0, size = 20) =>
  authGet<PagedResponse<AdminBookListing>>('/api/admin/book-listings', token, { status, page, size });

export const adminApproveBookListing = (token: string, id: number) =>
  authPost<AdminBookListing>(`/api/admin/book-listings/${id}/approve`, {}, token);

export const adminRejectBookListing = (token: string, id: number, adminNote?: string) =>
  authPost<AdminBookListing>(`/api/admin/book-listings/${id}/reject`, { adminNote: adminNote ?? null }, token);

export const adminDeleteBookListing = (token: string, id: number) =>
  authDelete(`/api/admin/book-listings/${id}`, token);
