export type PostStatus = 'UPCOMING' | 'ONGOING' | 'CLOSED' | 'EXPIRED';
export type Lang = 'bn' | 'en';

export interface CategoryType {
  id: number;
  nameBn: string;
  nameEn: string | null;
  slug: string;
  createdAt: string;
}

export interface Category {
  id: number;
  nameBn: string;
  nameEn: string | null;
  slug: string;
  categoryTypeId: number;
  createdAt: string;
}

export interface PostType {
  id: number;
  nameBn: string;
  nameEn: string | null;
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
  categoryNameBn: string;
  categoryNameEn: string | null;
  postTypeNameBn: string | null;
  postTypeNameEn: string | null;
  viewCount: number;
  vacancyCount: number | null;
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
  viewCount: number;
  vacancyCount: number | null;
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
  categoryTypeId?: number;
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

export type TipCategory = 'TRANSPORT' | 'MOBILE' | 'TIMING' | 'FOOD' | 'ACCOMMODATION' | 'GENERAL';

export interface MobileVoteStats {
  allowed: number;
  notAllowed: number;
  userVote: boolean | null;
}

export interface ExamCenterSummary {
  id: number;
  nameBn: string;
  nameEn: string;
  area: string;
  address: string;
  mapsUrl: string | null;
  photoUrl: string | null;
  tipCount: number;
  mobileAllowed: number;
  mobileNotAllowed: number;
}

export interface ExamCenterDetail {
  id: number;
  nameBn: string;
  nameEn: string;
  area: string;
  address: string;
  mapsUrl: string | null;
  photoUrl: string | null;
  mobileVote: MobileVoteStats;
}

export interface CenterTip {
  id: number;
  category: TipCategory;
  body: string;
  upvoteCount: number;
  userUpvoted: boolean;
  authorName: string;
  authorId: number;
  createdAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentConfig {
  bkashNumber: string | null;
  rocketNumber: string | null;
}

export type PaymentMethod = 'BKASH' | 'ROCKET';
export type EnrollmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface EnrollmentRequest {
  id: number;
  categoryId: number;
  categoryNameBn: string;
  userId: number;
  userName: string;
  userEmail: string;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amount: number | null;
  status: EnrollmentRequestStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

// ── Job Preparation ───────────────────────────────────────────────────────────

export type ContentType = 'VIDEO' | 'POST' | 'PDF' | 'QUIZ';

export type EnrollmentType = 'FREE' | 'PAID';

export interface PrepCategory {
  id: number;
  nameBn: string;
  nameEn: string | null;
  slug: string;
  icon: string | null;
  colorHex: string | null;
  displayOrder: number;
  enrollmentType: EnrollmentType;
  price: number | null;
  currency: string;
  isEnrolled: boolean;
  description: string | null;
  contactPhone: string | null;
}

export interface PrepTopic {
  id: number;
  categoryId: number;
  nameBn: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  displayOrder: number;
  contentCount: number;
}

export interface PrepCategoryDetail extends PrepCategory {
  topics: PrepTopic[];
  totalContents: number;
}

export interface PrepContent {
  id: number;
  topicId: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  thumbnailUrl: string | null;
  body: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  published?: boolean;
  updatedAt: string;
}

export interface PrepTopicDetail extends PrepTopic {
  contents: PrepContent[];
}

// ── Exam system ───────────────────────────────────────────────────────────────

export interface ExamSet {
  id: number;
  topicId: number;
  topicNameBn: string;
  titleBn: string;
  descriptionBn: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  published: boolean;
  questionCount: number;
  totalAttempts: number;
  userAttemptCount: number;
}

export interface ExamQuestion {
  id: number;
  examSetId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanationText: string | null;
  explanationImageUrl: string | null;
  displayOrder: number;
}

// Public question (no correctOption)
export interface ExamQuestionPublic {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  displayOrder: number;
}

export interface QuestionResult {
  questionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  selectedOption: string | null;
  correct: boolean;
  explanationText: string | null;
  explanationImageUrl: string | null;
}

export interface ExamResult {
  attemptId: number;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  questions: QuestionResult[];
}

export interface Comment {
  id: number;
  body: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  replies: Comment[];
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

// ── Info Store documents (photo / signature / certificates) ───────────────────

export interface InfoStoreDocument {
  id: string;
  label: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}
