import type {
  Category,
  CategoryType,
  LoginResponse,
  PagedResponse,
  Post,
  PostFilters,
  PostSummary,
  PostType,
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
