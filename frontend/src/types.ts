
export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject?: string;
  topic?: string;
  referenceYear?: string;
  correctPercentage?: number;
  tags?: string[];
}

export interface QuestionSet {
  id: string;
  exam_id?: number;
  title: string;
  examType: string;
  type: "past-year" | "mock-test";
  difficulty?: string;
  description?: string;
  yearOrDate?: string;
  subcategory?: string;
  questions: Question[];
  isFree: boolean;
  price: number; // in NPR, e.g., 20 or 30
  durationMinutes: number; // e.g. 60
  province?: string; // e.g. "central" or province names like "koshi"
  correctMarks?: number; // Added: mark for a correct question
  incorrectMarks?: number; // Added: coefficient subtracted for an incorrect question
}

export interface UserProgress {
  setId: string;
  completedAt: string; // ISO Date
  timeSpentSeconds: number;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  leftAnswersCount: number;
  answers: { [questionId: string]: number }; // questionId -> selectedOptionIndex (-1 for left)
  mode: "timed" | "tutor";
}

export interface BookmarkedQuestion {
  questionId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  setId: string;
  setName: string;
  examType: string;
  bookmarkedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatar?: string;
  joinDate?: string;
  subscription?: {
    examType: string;
    expiresAt: string;
  };
  activePackages?: any[];
  bookmarkedQuestionIds?: string[];
  avatarUrl?: string;
  age?: number | string;
  sex?: string;
  role?: string;
  purchasedSetIds: string[]; // specific sets unlocked
  rewardPoints?: number;
  referralCode?: string;
  referLog?: {
    friendEmail: string;
    pointsEarned: number;
    type: "registration" | "subscription";
    date: string;
  }[];
}

export interface CMSContent {

  brandName: string;
  sidebarLabels: {
    dashboard: string;
    set_practice?: string;
    practice: string;
    bookmarks: string;
    history: string;
    leaderboard: string;
    forum: string;
    subscription?: string;
    refer_earn?: string;
    about: string;
    admin: string;
  };
  dashboardLabels: {
    preparingFor: string;
    papersAvailable: string;
    browseButton: string;
    arenaTitle: string;
    arenaSubtitle: string;
    allPapersButton: string;
    arenaSelectSubtitle: string;
  };
  examDescriptions: {
    [examKey: string]: string;
  };
  aboutUsLabels: {
    heroTitle: string;
    heroDescription: string;
    teamTitle: string;
    contactTitle: string;
    contactDescription: string;
    officeTitle: string;
    officeText: string;
    emailTitle: string;
    emailText: string;
    phoneTitle: string;
    phoneText: string;
  };
  editorialTeam: {
    name: string;
    role: string;
    institution: string;
    avatar?: string;
    specialty: string;
    enabled?: boolean;
    badge?: string;
    bio?: string;
    isFounder?: boolean;
    tags?: string[];
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      email?: string;
    };
  }[];
  subscriptionPlans?: {
    id: string;
    days: number;
    tag: string;
    title: string;
    description: string;
    price: number;
  }[];
  loginLabels: {
    brandName: string;
    brandSubtitle: string;
    signupGoogleButton: string;
    signinGoogleButton: string;
    termsAcceptedLabel: string;
    registerButton: string;
    loginButton: string;
    dividerText: string;
  };
  sidebarItems?: {
    id: string;
    label: string;
    enabled: boolean;
    order: number;
  }[];
  mecUgClassification?: {
    subject: string;
    icon: string;
    weight: number;
    enabled?: boolean;
    targetExam?: string;
    topics: { name: string; icon: string; weight: number; enabled?: boolean }[];
  }[];
  mecPgClassification?: {
    category: "preclinical" | "clinical" | "short";
    subject: string;
    icon: string;
    weight: number;
    enabled?: boolean;
    targetExam?: string;
  }[];
  leaderboardConfig?: {
    title: string;
    subtitle: string;
    subTitleTag: string;
    competitors: {
      name: string;
      avatarUrl: string;
      totalCorrect: number;
      testsCompleted: number;
      accuracy: number;
      city: string;
      enabled?: boolean;
    }[];
  };
  targetExams?: any[];
  subscriptionConfig?: {
    title: string;
    subtitle: string;
    benefits: string[];
    promoBanner: string;
    paymentMethods: { name: string; logo: string; description: string }[];
  };
  referEarnConfig?: {
    title: string;
    subtitle: string;
    pointsPerReg: number;
    pointsPerSub: number;
    referredPointsPerReg?: number;
    promoMessage: string;
    rules: string[];
    rewards?: { label: string; points: number }[];
  };
  // Landing page extended fields
  heroTitle?: string;
  heroDescription?: string;
  featuresTitle?: string;
  featuresSubtitle?: string;
  featuresList?: { icon?: string; title: string; description: string }[];
  testimonials?: { id: string; name: string; roleOrExam: string; text: string; avatarUrl?: string }[];
  faqs?: { id: string; question: string; answer: string }[];
  contactTitle?: string;
  contactDescription?: string;
  emailTitle?: string;
  emailText?: string;
  phoneTitle?: string;
  phoneText?: string;
  officeText?: string;
  supportConfig?: { email?: string; phone?: string; address?: string; officeText?: string; emailText?: string; EmailText?: string; phoneText?: string; PhoneText?: string; OfficeText?: string };
}

export type NodeType = 'concept' | 'task' | 'question' | 'quote' | 'code';
export type NodeColor = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  title: string;
  content: string;
  type: NodeType;
  color: NodeColor;
  tags: string[];
  connections: string[];
}

export interface PremiumPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
  is_free: boolean;
  is_popular: boolean;
  exams?: any[];
  questionSets?: any[];
  created_at?: string;
  updated_at?: string;
}
