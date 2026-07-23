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
  refreshToken: string;
  expiresIn: number; // access-token lifetime, in seconds
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

// ── Job Experience Share ────────────────────────────────────────────────────────

export type JobExperienceOutcome = 'SELECTED' | 'REJECTED' | 'WAITING';
export type JobExperienceStage = 'WRITTEN' | 'VIVA' | 'FINAL';
export type JobExperienceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Public view of an approved job experience post. */
export interface JobExperience {
  id: number;
  organizationName: string;
  positionTitle: string | null;
  outcome: JobExperienceOutcome;
  stageReached: JobExperienceStage;
  title: string;
  body: string;
  authorName: string | null; // null when isAnonymous
  isAnonymous: boolean;
  viewCount: number;
  createdAt: string;
}

/** A logged-in user's own submission, including moderation status. */
export interface MyJobExperience {
  id: number;
  organizationName: string;
  positionTitle: string | null;
  outcome: JobExperienceOutcome;
  stageReached: JobExperienceStage;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: JobExperienceStatus;
  adminNote: string | null;
  viewCount: number;
  createdAt: string;
}

/** Admin moderation view — always shows the real author. */
export interface AdminJobExperience {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  organizationName: string;
  positionTitle: string | null;
  outcome: JobExperienceOutcome;
  stageReached: JobExperienceStage;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: JobExperienceStatus;
  adminNote: string | null;
  viewCount: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface JobExperienceSubmission {
  organizationName: string;
  positionTitle?: string;
  outcome: JobExperienceOutcome;
  stageReached: JobExperienceStage;
  title: string;
  body: string;
  isAnonymous: boolean;
}

// ── Institute Reviews ────────────────────────────────────────────────────────────

export type InstituteReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Public view of an approved institute review. */
export interface InstituteReview {
  id: number;
  instituteName: string;
  rating: number;
  title: string;
  body: string;
  authorName: string | null; // null when isAnonymous
  isAnonymous: boolean;
  viewCount: number;
  createdAt: string;
}

/** A logged-in user's own review, including moderation status. */
export interface MyInstituteReview {
  id: number;
  instituteName: string;
  rating: number;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: InstituteReviewStatus;
  adminNote: string | null;
  viewCount: number;
  createdAt: string;
}

/** Admin moderation view — always shows the real author. */
export interface AdminInstituteReview {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  instituteName: string;
  rating: number;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: InstituteReviewStatus;
  adminNote: string | null;
  viewCount: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface InstituteReviewSubmission {
  instituteName: string;
  rating: number;
  title: string;
  body: string;
  isAnonymous: boolean;
}

// ── Recommended Books (admin-curated catalog) ─────────────────────────────────────

export interface RecommendedBook {
  id: number;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  coverImageUrl: string | null;
  purchaseLink: string | null;
  createdAt: string;
}

export interface RecommendedBookRequest {
  title: string;
  author?: string;
  category?: string;
  description?: string;
  purchaseLink?: string;
}

// ── Book Marketplace ──────────────────────────────────────────────────────────────

export type BookCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type BookListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Public list-view of an APPROVED listing — no seller contact info. */
export interface BookListing {
  id: number;
  title: string;
  author: string | null;
  condition: BookCondition;
  price: number;
  description: string | null;
  photoUrl: string | null;
  sold: boolean;
  createdAt: string;
}

/** Public detail-view — seller contact fields are null unless the viewer is logged in. */
export interface BookListingDetail extends BookListing {
  sellerName: string | null;
  sellerEmail: string | null;
  sellerPhone: string | null;
}

/** A seller's view of their own listing. */
export interface MyBookListing {
  id: number;
  title: string;
  author: string | null;
  condition: BookCondition;
  price: number;
  description: string | null;
  photoUrl: string | null;
  status: BookListingStatus;
  sold: boolean;
  adminNote: string | null;
  createdAt: string;
}

/** Admin moderation view — always shows the real seller. */
export interface AdminBookListing {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  title: string;
  author: string | null;
  condition: BookCondition;
  price: number;
  description: string | null;
  photoUrl: string | null;
  status: BookListingStatus;
  sold: boolean;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface BookListingSubmission {
  title: string;
  author?: string;
  condition: BookCondition;
  price: number;
  description?: string;
}

export type BookOrderStatus = 'PENDING' | 'CANCELLED' | 'CLOSED';

/** A buyer's view of an order they placed. */
export interface BookOrder {
  id: number;
  listingId: number;
  listingTitle: string;
  listingPhotoUrl: string | null;
  listingPrice: number;
  listingSold: boolean;
  status: BookOrderStatus;
  createdAt: string;
}

/** A seller's view of an order received on their own listing — reveals buyer contact. */
export interface BookOrderBuyerInfo {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  status: BookOrderStatus;
  createdAt: string;
}
