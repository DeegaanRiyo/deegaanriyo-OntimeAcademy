// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = "owner" | "admin" | "manager" | "receptionist" | "teacher" | "social_media" | "student" | "member";

// ─── Profile ──────────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

// ─── Co-Working Member ────────────────────────────────────────────────────────
export type Member = {
  id: string;
  profession: string | null;
  bio: string | null;
  portfolio_url: string | null;
  is_public: boolean;
  slug: string;
  subscription_start: string | null;
  subscription_end: string | null;
  is_active: boolean;
};

// ─── Space ────────────────────────────────────────────────────────────────────
export type Space = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hourly_rate: number;
  is_available: boolean;
  photos: string[];
  created_at?: string;
};

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus = "pending" | "confirmed" | "rejected";

export type Booking = {
  id: string;
  space_id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string;
  booking_date: string;
  start_time: string;
  hours: number;
  estimated_cost: number | null;
  status: BookingStatus;
  created_at: string;
};

// ─── Course ───────────────────────────────────────────────────────────────────
export type Course = {
  id: string;
  teacher_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_published: boolean;
  created_at: string;
};

// ─── Lesson ───────────────────────────────────────────────────────────────────
export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  vimeo_url: string;
  order_index: number;
  created_at: string;
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export type Quiz = {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_index: number;
};

// ─── Enrolment ────────────────────────────────────────────────────────────────
export type Enrolment = {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  last_accessed_at: string | null;
};

// ─── Lesson Progress ──────────────────────────────────────────────────────────
export type LessonProgress = {
  id: string;
  enrolment_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentType = "course" | "membership";
export type PaymentMethod = "mpesa" | "card";
export type PaymentStatus = "pending" | "success" | "failed";

export type Payment = {
  id: string;
  payer_id: string;
  type: PaymentType;
  reference_id: string;
  amount: number;
  method: PaymentMethod;
  mpesa_receipt: string | null;
  status: PaymentStatus;
  created_at: string;
};

// ─── Receptionist / Walk-in ───────────────────────────────────────────────────
export type PhysicalStudentType = "new" | "returning" | "online";
export type PhysicalStudentPayMethod = "cash" | "mpesa" | "both";
