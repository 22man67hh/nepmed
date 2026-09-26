/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  UserProfile, 
  QuestionSet, 
  UserProgress, 
  BookmarkedQuestion, 
  Question,
  CMSContent
} from "./types";

import { retagAllQuestions } from "./subjectsData";
import { 
  Menu, 
  Search, 
  ChevronRight, 
  User, 
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Stethoscope, 
  Sliders 
} from "lucide-react";

// Components
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import LandingPage from "./components/LandingPage";
import DashboardView from "./components/DashboardView";
import ExamSpecificView from "./components/ExamSpecificView";
import PracticeSession from "./components/PracticeSession";
import AdminPanel from "./components/AdminPanel";
import CustomAdminPanel from "./components/CustomAdminPanel";
import BookmarksView from "./components/BookmarksView";
import AITutorModal from "./components/AITutorModal";
import TestHistoryView from "./components/TestHistoryView";
import LeaderboardView from "./components/LeaderboardView";
import ForumView from "./components/ForumView";
import AboutUsView from "./components/AboutUsView";
import PracticeView from "./components/PracticeView";
import SubscriptionView from "./components/SubscriptionView";
import ReferEarnView from "./components/ReferEarnView";
import AdminLoginScreen from "./components/AdminLoginScreen";

const INITIAL_CMS_CONTENT: CMSContent = {
  brandName: "PrepzaNepal",
  sidebarLabels: {
    dashboard: "Dashboard",
    set_practice: "Set wise Practice",
    practice: "Subject Wise Practice",
    bookmarks: "Saved Questions",
    history: "My Report",
    leaderboard: "Leaderboard",
    forum: "Discussion Forum",
    subscription: "Premium Subscription",
    refer_earn: "Refer & Earn",
    about: "About Us & Support",
    admin: "Question Upload & Pricing"
  },
  dashboardLabels: {
    preparingFor: "Currently Preparing For",
    papersAvailable: "sets of previous board papers and new mock modules available.",
    browseButton: "Browse Available Papers",
    arenaTitle: "Practice MCQ Arena",
    arenaSubtitle: "Select any of the curated question papers below to begin simulating with active timer constraints.",
    allPapersButton: "View All Arena Papers",
    arenaSelectSubtitle: "Choose a specific Nepalese province or central public service commission to access localized question sets."
  },
  examDescriptions: {
    "mec-ug": "Medical Education Commission - Undergraduate (MBBS/BDS/BSc Nursing Entrance Exam preparation modules and detailed past papers).",
    "mec-pg": "Medical Education Commission - Postgraduate (MD/MS MDGP entrance modules with advanced clinical case explanations).",
    "nmcle": "Nepal Medical Council Licensing Exam (booster question sets aligned with official syllabus blocks & past papers).",
    "ku-mcq": "Kathmandu University undergraduate entrance and licensing examination past question bank.",
    "loksewa": "Public Service Commission (Loksewa Aayog) General Medical Officer and Healthcare Services exams."
  },
  aboutUsLabels: {
    heroTitle: "About PrepzaNepal Editorial Board",
    heroDescription: "PrepzaNepal is Nepal's premier full-stack interactive medical education engine. We are dedicated to providing high-yield multiple choice test questions, detailed clinical rationales, and memory mnemonics meticulously aligned with the standards of the Medical Education Commission (MEC) and the Nepal Medical Council (NMC) licensing examinations.",
    teamTitle: "Our Eminent Editorial Board",
    contactTitle: "Official Contact Details",
    contactDescription: "If you have institutional registration queries, partnership opportunities, or feedback regarding NMCLE syllabus coverage, reach us directly or visit our office.",
    officeTitle: "Our Office Address",
    officeText: "Maharajgunj Clinical Complex\nOpposite Teaching Hospital (IOM)\nKathmandu 44600, Nepal",
    emailTitle: "Email Addresses",
    emailText: "Editorial: info@PrepzaNepal.edu.np\nSupport: support@PrepzaNepal.edu.np",
    phoneTitle: "Phone & Support Hours",
    phoneText: "Landline: +977-1-4412345\nCell: +977-98510-00000\nSun - Fri, 9:00 AM - 5:00 PM (NST)"
  },
  editorialTeam: [
    {
      name: "Prof. Dr. Ramesh Koirala",
      role: "Chief Editorial Director",
      institution: "Institute of Medicine (IOM), Maharajgunj, Kathmandu",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ramesh",
      specialty: "Clinical Surgery, NMCLE Curriculum & High-Yield Case Scenarios"
    },
    {
      name: "Dr. Sunil Subedi",
      role: "Associate Professor of Pathology",
      institution: "Kathmandu University School of Medical Sciences (KUSMS)",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sunil",
      specialty: "General Pathology, Immunology & MEC-PG Exam Frameworks"
    },
    {
      name: "Dr. Anjana Adhikari",
      role: "Senior Consultant Gynecologist",
      institution: "Patan Academy of Health Sciences (PAHS), Lalitpur",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=anjana",
      specialty: "Maternal Health Policy, Obstetrics & Public Health Programs"
    }
  ],
  subscriptionPlans: [
    {
      id: "pass-2",
      days: 2,
      tag: "Quick Sprint",
      title: "2 Days Full Access",
      description: "Excellent for a quick review before exam date.",
      price: 100
    },
    {
      id: "pass-7",
      days: 7,
      tag: "Weekly booster",
      title: "1 Week Unlimited",
      description: "Thoroughly solve all past questions with full AI explanations.",
      price: 300
    },
    {
      id: "pass-30",
      days: 30,
      tag: "Exam Mastery",
      title: "30 Days Unlimited",
      description: "Full comprehensive access with upcoming mock updates.",
      price: 500
    }
  ],
  loginLabels: {
    brandName: "PrepzaNepal",
    brandSubtitle: "Nepal's Premier Medical MCQs & License Prep Engine",
    signupGoogleButton: "Sign Up with Google",
    signinGoogleButton: "Sign In with Google",
    termsAcceptedLabel: "I explicitly agree to the Terms & Conditions and Privacy Policy",
    registerButton: "Register Account",
    loginButton: "Access Prep Dashboard",
    dividerText: "or continue with"
  },
  sidebarItems: [
    { id: "dashboard", label: "Dashboard", enabled: true, order: 1 },
    { id: "set_practice", label: "Set wise Practice", enabled: true, order: 2 },
    { id: "practice", label: "Subject Wise Practice", enabled: true, order: 3 },
    { id: "bookmarks", label: "Saved Questions", enabled: true, order: 4 },
    { id: "history", label: "My Report", enabled: true, order: 5 },
    { id: "leaderboard", label: "Leaderboard", enabled: true, order: 6 },
    { id: "forum", label: "Discussion Forum", enabled: true, order: 7 },
    { id: "subscription", label: "Premium Subscription", enabled: true, order: 8 },
    { id: "refer_earn", label: "Refer & Earn", enabled: true, order: 9 },
    { id: "about", label: "About Us & Support", enabled: true, order: 10 },
    { id: "admin", label: "Question Upload & Pricing", enabled: true, order: 11 }
  ],
  subscriptionConfig: {
    title: "Upgrade to Premium Pass",
    subtitle: "Get unlimited access to high-yield clinical MCQs, past papers, and premium AI explanations.",
    benefits: [
      "Access 25,500+ syllabus-aligned medical MCQs",
      "Real-time mock boards with national-level leaderboards",
      "Meticulous textbook references & memory mnemonics",
      "Premium 24/7 Gemini Medical AI Tutor access",
      "Detailed progress graphs and exam preparation reports"
    ],
    promoBanner: "🎉 SPECIAL OFFER: 15% discount applied automatically on checkout!",
    paymentMethods: [
      { name: "eSewa Pay", logo: "🟢", description: "Instant activation via standard Nepal eSewa wallet connection." },
      { name: "Khalti Wallet", logo: "🟣", description: "Fast billing using Khalti OTP verification API." },
      { name: "Nepal Fonepay", logo: "🔴", description: "Scan-to-Pay QR code secure terminal access." }
    ]
  },
  referEarnConfig: {
    title: "Refer Friends, Earn Cash & Points!",
    subtitle: "Invite other medical students/doctors to PrepzaNepal. Get rewarded instantly upon registration and subscription purchase.",
    pointsPerReg: 50,
    pointsPerSub: 500,
    promoMessage: "Hey! Check out PrepzaNepal, Nepal's best app for MECEE and Licensing MCQs. Use my code to register and get bonus access!",
    rules: [
      "Share your unique custom referral link or code with friends.",
      "Get 50 points as soon as they register their verified account.",
      "Get 500 premium points if they upgrade to any of the unlimited board preparation packages.",
      "Redeem points directly to unlock individual premium exam sets or extend your current pass!"
    ]
  },
  mecUgClassification: [
    {
      subject: "Physics",
      icon: "⚡",
      weight: 50,
      topics: [
        { name: "Mechanics", icon: "⚙️", weight: 10 },
        { name: "Heat and thermodynamics", icon: "🔥", weight: 8 },
        { name: "Waves and optics", icon: "👓", weight: 8 },
        { name: "Current electricity and magnetism", icon: "🧲", weight: 9 },
        { name: "Electrostatics and capacitors", icon: "🔋", weight: 7 },
        { name: "Modern physics", icon: "⚛️", weight: 8 }
      ]
    },
    {
      subject: "Chemistry",
      icon: "⚗️",
      weight: 50,
      topics: [
        { name: "Physical chemistry", icon: "📈", weight: 15 },
        { name: "Inorganic chemistry", icon: "💎", weight: 10 },
        { name: "Organic chemistry", icon: "🧬", weight: 15 },
        { name: "Applied chemistry", icon: "🧪", weight: 5 },
        { name: "Analytic chemistry", icon: "📊", weight: 5 }
      ]
    },
    {
      subject: "Botany",
      icon: "🌱",
      weight: 40,
      topics: [
        { name: "Basic component of life", icon: "🔬", weight: 4 },
        { name: "Biodiversity", icon: "🌸", weight: 5 },
        { name: "Ecology and vegetation", icon: "🌲", weight: 5 },
        { name: "Cell biology", icon: "🧫", weight: 5 },
        { name: "Genetics", icon: "🧬", weight: 5 },
        { name: "Plant anatomy", icon: "🌿", weight: 4 },
        { name: "Plant physiology", icon: "🍃", weight: 5 },
        { name: "Developmental botany", icon: "🥚", weight: 4 },
        { name: "Applied botany", icon: "🌾", weight: 3 }
      ]
    },
    {
      subject: "Zoology",
      icon: "🦁",
      weight: 40,
      topics: [
        { name: "Evolutionary Biology", icon: "🦕", weight: 4 },
        { name: "Animal Diversity and Classification", icon: "🐙", weight: 5 },
        { name: "Animal Tissues and Histology", icon: "🔬", weight: 4 },
        { name: "Study of Selected Animals", icon: "🐸", weight: 5 },
        { name: "Human Biology and Physiology", icon: "🫁", weight: 12 },
        { name: "Microbial Diseases and Immunology", icon: "🦠", weight: 4 },
        { name: "Medical Technology and Applied Biology", icon: "💉", weight: 3 },
        { name: "Biota, Environment and Conservation", icon: "🌍", weight: 3 }
      ]
    },
    {
      subject: "MAT",
      icon: "🧠",
      weight: 20,
      topics: [
        { name: "Verbal reasoning", icon: "🗣️", weight: 5 },
        { name: "Numerical reasoning", icon: "🔢", weight: 5 },
        { name: "Logical sequencing", icon: "🧩", weight: 5 },
        { name: "Spatial relation / Abstract reasoning", icon: "📐", weight: 5 }
      ]
    }
  ],
  mecPgClassification: [
    { category: "preclinical", subject: "Anatomy", icon: "💀", weight: 10 },
    { category: "preclinical", subject: "Physiology", icon: "🫁", weight: 10 },
    { category: "preclinical", subject: "Biochemistry", icon: "🧪", weight: 10 },
    { category: "preclinical", subject: "Pathology", icon: "🔬", weight: 10 },
    { category: "preclinical", subject: "Microbiology", icon: "🦠", weight: 10 },
    { category: "preclinical", subject: "Pharmacology", icon: "💊", weight: 10 },
    { category: "preclinical", subject: "Community Medicine", icon: "🌍", weight: 12 },
    { category: "clinical", subject: "Medicine", icon: "🏥", weight: 20 },
    { category: "clinical", subject: "Surgery", icon: "🔪", weight: 20 },
    { category: "clinical", subject: "Obstetrics & Gynecology", icon: "🤰", weight: 20 },
    { category: "clinical", subject: "Pediatrics", icon: "👶", weight: 15 },
    { category: "short", subject: "ENT", icon: "👂", weight: 8 },
    { category: "short", subject: "Ophthalmology", icon: "👁️", weight: 8 },
    { category: "short", subject: "Forensic Medicine", icon: "🔍", weight: 5 },
    { category: "short", subject: "Orthopedics", icon: "🦴", weight: 8 },
    { category: "short", subject: "Psychiatry", icon: "🧠", weight: 5 },
    { category: "short", subject: "Dermatology", icon: "🧴", weight: 5 },
    { category: "short", subject: "Radiology", icon: "🩻", weight: 5 },
    { category: "short", subject: "Anesthesiology", icon: "💤", weight: 4 }
  ],
  leaderboardConfig: {
    title: "Prep Leaderboard",
    subtitle: "See how your total correct MCQ counts stack up against Nepal's top licensing and entrance candidates.",
    subTitleTag: "National Medical Exam Standings",
    competitors: [
      { name: "Dr. Sandeep Adhikari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sandeep", totalCorrect: 285, testsCompleted: 15, accuracy: 92, city: "Kathmandu" },
      { name: "Pooja Shrestha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja", totalCorrect: 242, testsCompleted: 13, accuracy: 88, city: "Lalitpur" },
      { name: "Sushant Thapa", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sushant", totalCorrect: 215, testsCompleted: 11, accuracy: 86, city: "Pokhara" },
      { name: "Aayushma Bhandari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aayushma", totalCorrect: 198, testsCompleted: 12, accuracy: 81, city: "Biratnagar" },
      { name: "Dr. Ramesh Kushwaha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh", totalCorrect: 184, testsCompleted: 10, accuracy: 84, city: "Janakpur" },
      { name: "Niranjan Chaudhary", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Niranjan", totalCorrect: 172, testsCompleted: 9, accuracy: 79, city: "Butwal" },
      { name: "Samikshya Devkota", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Samikshya", totalCorrect: 158, testsCompleted: 8, accuracy: 82, city: "Chitwan" }
    ]
  }
};

class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("LocalErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl m-6 font-sans text-xs space-y-3 shadow-2xl">
          <h2 className="text-sm font-extrabold uppercase text-rose-500 flex items-center gap-2">
            <span>🚨 Premium Admin Room Crash Telemetry</span>
          </h2>
          <p className="font-bold text-slate-200">{String(this.state.error?.message || this.state.error)}</p>
          <pre className="p-3 bg-slate-950 rounded overflow-x-auto text-[10px] text-slate-400 font-mono max-h-96">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cmsContent, setCmsContent] = useState<CMSContent>(INITIAL_CMS_CONTENT);

  // Fetch dynamic CMS content configuration and sets
  useEffect(() => {
    // Fetch base CMS config
    fetch("/api/cms/content")
      .then(res => res.json())
      .then(data => {
        if (data && data.brandName) {
          setCmsContent(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Failed to load base CMS content:", err));

    // Fetch dynamic database pages to override UI text (landing page, dashboard)
    fetch("/api/pages")
      .then(res => res.json())
      .then(data => {
        let pagesArr: any[] = [];
        if (Array.isArray(data)) pagesArr = data;
        else if (data && Array.isArray(data.data)) pagesArr = data.data;
        else if (data && Array.isArray(data.pages)) pagesArr = data.pages;

        if (pagesArr.length > 0) {
          setCmsContent(prev => {
            let next = { ...prev };
            const landingPage = pagesArr.find(p => p.slug === 'landing-page');
            const dashboardPage = pagesArr.find(p => p.slug === 'user-dashboard');
            
            if (landingPage && landingPage.content) {
              next = { ...next, ...landingPage.content };
            }
            if (dashboardPage && dashboardPage.content) {
              next = { ...next, ...dashboardPage.content };
            }
            return next;
          });
        }
      })
      .catch(err => console.error("Failed to load dynamic pages config:", err));

    // Fetch question sets from real DB endpoint (paginated, load all pages)
    const loadAllSets = async (examsData?: any[]) => {
      try {
        let page = 1;
        let allLoaded: QuestionSet[] = [];
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(`/api/question-sets?per_page=100&page=${page}`);
          const data = await res.json();

          if (!data.status || !data.sets) break;

          const sets: any[] = data.sets.data || data.sets;
          const mapped: QuestionSet[] = sets.map((s: any) => {
            // Map exam_id → examType slug using loaded exams
            const exams = examsData || [];
            const linkedExam = exams.find((e: any) => e.id === s.exam_id);
            const examSlug = linkedExam?.slug || linkedExam?.code || String(s.exam_id || "mec-ug");

            return {
              id: String(s.id),
              exam_id: s.exam_id,
              title: s.title || "Untitled Set",
              examType: examSlug,
              type: s.type || "mock-test",
              yearOrDate: s.year_or_date || s.yearOrDate || "",
              isFree: s.is_free === true || s.is_free === 1 || s.is_free === "1",
              price: parseFloat(s.price) || 0,
              durationMinutes: parseInt(s.duration_minutes) || 60,
              province: s.province || "all",
              correctMarks: parseFloat(s.correct_marks) || 1,
              incorrectMarks: parseFloat(s.incorrect_marks) || 0,
              questions: [] // Questions loaded lazily when set is opened for editing
            };
          });

          allLoaded = [...allLoaded, ...mapped];

          const currentPage = data.sets.current_page || page;
          const lastPage = data.sets.last_page || 1;
          hasMore = currentPage < lastPage;
          page++;
        }

        if (allLoaded.length > 0) {
          setAllSets(allLoaded);
        }
      } catch (err) {
        console.error("Failed to load question sets from DB:", err);
      }
    };


    // Fetch independent questions from backend (Global Pool)
    const loadAllQuestions = async () => {
      try {
        let page = 1;
        let allLoaded: Question[] = [];
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(`/api/questions?per_page=100&page=${page}`);
          const data = await res.json();

          if (!data.status || !data.questions) break;

          const qs: any[] = data.questions.data || data.questions;
          const mapped: Question[] = qs.map((q: any) => {
            const opts = (q.options || []).sort((a: any, b: any) => a.option_index - b.option_index);
            const correctIdx = opts.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
            return {
              id: String(q.id),
              questionText: q.question_text || q.questionText || "",
              options: opts.map((o: any) => o.option_text || ""),
              correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
              explanation: q.explanation || "",
              subject: q.subject?.name || q.subject || "",
              topic: q.topic?.name || q.topic || ""
            };
          });

          allLoaded = [...allLoaded, ...mapped];

          const currentPage = data.questions.current_page || page;
          const lastPage = data.questions.last_page || 1;
          hasMore = currentPage < lastPage;
          page++;
        }

        if (allLoaded.length > 0) {
          setIndependentQuestions(allLoaded);
        }
      } catch (err) {
        console.error("Failed to load independent questions from DB:", err);
      }
    };
    loadAllQuestions();

    // Fetch user draft questions from backend
    fetch("/api/admin/draft-questions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUserDraftQuestions(data);
        } else {
          fetch("/api/admin/draft-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userDraftQuestions)
          }).catch(err => console.error("Failed to initialize draft questions on server:", err));
        }
      })
      .catch(err => console.error("Failed to load draft questions from server:", err));

    // Fetch dynamic database categories — exams first, then use for mapping sets
    fetch("/api/exams")
      .then(res => res.json())
      .then(data => {
        if (data && data.status && Array.isArray(data.exams)) {
          setDbExams(data.exams);
          // Expose to window for SubjectFoldersPoolTab exam filtering
          (window as any).__dbExams = data.exams;
          // Now load sets using exam data for proper slug mapping
          loadAllSets(data.exams);
          // console.log(data.exams)
        } else {
          loadAllSets([]);
        }
      })
      .catch(err => {
        console.error("Failed to load exams:", err);
        loadAllSets([]);
      });


    fetch("/api/subjects")
      .then(res => res.json())
      .then(data => {
        if (data && data.status && Array.isArray(data.subjects)) {
          setDbSubjects(data.subjects);
        }
      })
      .catch(err => console.error("Failed to load subjects:", err));

    fetch("/api/topics")
      .then(res => res.json())
      .then(data => {
        if (data && data.status && data.topics) {
          if (Array.isArray(data.topics)) {
            setDbTopics(data.topics);
          } else if (Array.isArray(data.topics.data)) {
            // Note: If paginated globally, this will only load the first page for the rest of the app!
            setDbTopics(data.topics.data);
          }
        }
      })
      .catch(err => console.error("Failed to load topics:", err));

    fetch("/api/premium-packages")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbPackages(data);
        }
      })
      .catch(err => console.error("Failed to load packages:", err));

    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbTeams(data);
        }
      })
      .catch(err => console.error("Failed to load teams:", err));
  }, []);

  const handleSaveCMSContent = async (newContent: CMSContent) => {
    try {
      const response = await fetch("/api/cms/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContent)
      });
      const data = await response.json();
      if (data.success) {
        setCmsContent(newContent);

        // Sync local CMS configurations (Exams & Subjects) to SQL Database in background
        try {
          // 1. Sync Target Exams
          const examsRes = await fetch("/api/exams");
          const examsData = await examsRes.json();
          const currentDbExams = Array.isArray(examsData.exams) ? examsData.exams : [];
          const examDbIdMap: Record<string, number> = {};

          const targetExams = newContent.targetExams || [];
          for (const exam of targetExams) {
            const slug = exam.id.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const existing = currentDbExams.find((e: any) => e.slug === slug || e.name.toLowerCase() === exam.name.toLowerCase());
            
            let examDbId = null;
            const payload = {
              name: exam.name,
              description: exam.description || `${exam.name} examination preparation modules.`,
              status: "active"
            };

            if (existing) {
              examDbId = existing.id;
              await fetch(`/api/exams/${existing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
            } else {
              const createRes = await fetch("/api/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              const createData = await createRes.json();
              if (createData.status && createData.exam) {
                examDbId = createData.exam.id;
              }
            }
            if (examDbId) {
              examDbIdMap[exam.id] = examDbId;
            }
          }

          // Fetch fresh list of exams to get all database IDs mapped to slugs
          const freshExamsRes = await fetch("/api/exams");
          const freshExamsData = await freshExamsRes.json();
          const freshDbExams = Array.isArray(freshExamsData.exams) ? freshExamsData.exams : [];
          freshDbExams.forEach((e: any) => {
            examDbIdMap[e.slug] = e.id;
          });

          // 2. Sync Subjects
          const subjectsRes = await fetch("/api/subjects");
          const subjectsData = await subjectsRes.json();
          const currentDbSubjects = Array.isArray(subjectsData.subjects) ? subjectsData.subjects : [];

          const subjectsToSync: Array<{ name: string; icon: string; weight: number; examSlug: string }> = [];

          if (Array.isArray(newContent.mecUgClassification)) {
            newContent.mecUgClassification.forEach((sub: any) => {
              subjectsToSync.push({
                name: sub.subject,
                icon: sub.icon || "book",
                weight: sub.weight || 0,
                examSlug: sub.targetExam || "mec-ug"
              });
            });
          }

          if (Array.isArray(newContent.mecPgClassification)) {
            newContent.mecPgClassification.forEach((sub: any) => {
              subjectsToSync.push({
                name: sub.subject,
                icon: sub.icon || "book",
                weight: sub.weight || 0,
                examSlug: sub.targetExam || "mec-pg"
              });
            });
          }

          for (const sub of subjectsToSync) {
            const slug = sub.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const examId = examDbIdMap[sub.examSlug] || null;
            const existingSub = currentDbSubjects.find((s: any) => s.slug === slug || s.name.toLowerCase() === sub.name.toLowerCase());
            
            const payload = {
              name: sub.name,
              code: sub.name.substring(0, 10).toUpperCase().replace(/[^A-Z]/g, "S"),
              description: `${sub.name} curriculum mapping.`,
              status: "active",
              icon: sub.icon,
              weight: sub.weight,
              exam_id: examId
            };

            if (existingSub) {
              await fetch(`/api/subjects/${existingSub.uuid || existingSub.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
            } else {
              await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
            }
          }
        } catch (syncErr) {
          console.error("Failed to sync exams and subjects to Laravel database:", syncErr);
        }

        return true;
      }
    } catch (err) {
      console.error("Failed to save CMS content:", err);
    }
    return false;
  };

  // 1. Initial State from LocalStorage or default
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("nepmed_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing user profile:", e);
      }
    }
    return {
      email: "",
      name: "",
      avatarUrl: "",
      isLoggedIn: false,
      purchasedSetIds: ["mec-ug-2023", "nmcle-2023", "ku-mcq-mock-1"] // Default unlocked sets
    };
  });

  const [targetExam, setTargetExam] = useState<string>(() => {
    const saved = localStorage.getItem("nepmed_target_exam");
    return saved || "mec-ug";
  });

  const [activeScreen, setActiveScreen] = useState<"dashboard" | "bookmarks" | "admin" | "custom_admin" | "history" | "leaderboard" | "forum" | "about" | "practice" | "set_practice" | "subscription" | "refer_earn">("dashboard");
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [customWorkoutSet, setCustomWorkoutSet] = useState<QuestionSet | null>(null);
  const [customWorkoutMode, setCustomWorkoutMode] = useState<"timed" | "tutor" | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nepmed_theme") as "dark" | "light") || "dark";
  });

  // Settings & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem("nepmed_app_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      strictTimer: true,
      autoExplanations: true,
      soundOn: true
    };
  });

  const [cookieAccepted, setCookieAccepted] = useState(() => {
    return localStorage.getItem("nepmed_cookies_accepted") === "true";
  });

  const handleAcceptCookies = () => {
    localStorage.setItem("nepmed_cookies_accepted", "true");
    setCookieAccepted(true);
  };

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem("nepmed_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);



  useEffect(() => {
    localStorage.setItem("nepmed_app_settings", JSON.stringify(appSettings));
  }, [appSettings]);


  // Local profile states
  const [profileFormName, setProfileFormName] = useState("");
  const [profileFormAge, setProfileFormAge] = useState<string | number>("");
  const [profileFormSex, setProfileFormSex] = useState("Male");

  useEffect(() => {
    if (showSettingsModal) {
      setProfileFormName(userProfile.name || "");
      setProfileFormAge(userProfile.age || "");
      setProfileFormSex(userProfile.sex || "Male");
    }
  }, [showSettingsModal, userProfile]);

  // Controls nested view inside practice screen: "list" to view sets, or "practice" if playing
  const [examPageState, setExamPageState] = useState<"summary" | "browse">("summary");

  const [allSets, setAllSets] = useState<QuestionSet[]>(() => {
    // Start with empty — data is loaded from DB via API in useEffect below
    return [];
  });

  const [progressList, setProgressList] = useState<UserProgress[]>([]);

  useEffect(() => {
    const fetchUserProfileAndHistory = async () => {
      if (userProfile.isLoggedIn) {
        try {
          const token = localStorage.getItem("nepmed_auth_token");
          
          // Fetch freshest user profile (syncs activePackages)
          const meRes = await fetch("/api/me", {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.user) {
              setUserProfile(prev => {
                const updated = {
                  ...prev,
                  activePackages: meData.user.active_packages || meData.user.activePackages || []
                };
                localStorage.setItem("nepmed_user_profile", JSON.stringify(updated));
                return updated;
              });
            }
          }

          // Fetch History
          const res = await fetch("/api/my-history", {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              setProgressList(data.data);
            }
          }
        } catch (err) {
          console.error("Failed to fetch history:", err);
        }
      }
    };
    fetchUserProfileAndHistory();
  }, [userProfile.isLoggedIn]);

  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>(() => {
    const saved = localStorage.getItem("nepmed_bookmarks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing bookmarks:", e);
      }
    }
    return [];
  });

  const [independentQuestions, setIndependentQuestions] = useState<Question[]>([]);

  const [userDraftQuestions, setUserDraftQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem("nepmed_user_draft_questions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing user draft questions:", e);
      }
    }
    return [];
  });

  const [activeTutorQuestion, setActiveTutorQuestion] = useState<Question | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbTopics, setDbTopics] = useState<any[]>([]);
  const [dbPackages, setDbPackages] = useState<any[]>([]);
  const [dbTeams, setDbTeams] = useState<any[]>([]);

  // 2. Synchronize State to LocalStorage
  useEffect(() => {
    localStorage.setItem("nepmed_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("nepmed_target_exam", targetExam);
  }, [targetExam]);

  // 2b. Synchronize React Router Paths with Screen States
  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith("/admin/login")) {
      // Handled by rendering block
    } else if (path.startsWith("/admin")) {
      if (activeScreen !== "custom_admin") {
        setActiveScreen("custom_admin");
      }
    } else if (path === "/login") {
      if (userProfile.isLoggedIn) {
        navigate("/dashboard");
      }
    } else if (path === "/") {
      if (userProfile.isLoggedIn) {
        if (userProfile.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    } else {
      const screen = path.replace("/", "");
      
      if (screen === "payment-success") {
        alert("Payment Authorized Successfully! Your account has been upgraded to Premium.");
        navigate("/dashboard");
        return;
      }
      if (screen === "payment-failed") {
        alert("Payment Failed or Cancelled. Please try again.");
        navigate("/subscription");
        return;
      }

      const validScreens = [
        "dashboard", "bookmarks", "history", "leaderboard", 
        "forum", "about", "practice", "set_practice", "subscription", "refer_earn"
      ];
      if (validScreens.includes(screen)) {
        if (activeScreen !== screen) {
          setActiveScreen(screen as any);
        }
      } else {
        navigate("/dashboard");
      }
    }
  }, [location.pathname, userProfile.isLoggedIn]);

  // Sets are now DB-driven via /api/question-sets — no localStorage or /api/admin/sets sync needed


  // Sync custom sets added from the CMS target exams into allSets dynamically
  useEffect(() => {
    if (cmsContent?.targetExams) {
      setAllSets((prevSets) => {
        let changed = false;
        const updated = [...prevSets];
        
        cmsContent.targetExams.forEach((exam: any) => {
          exam.subcategories?.forEach((sub: any) => {
            sub.sets?.forEach((s: any) => {
              const existingIdx = updated.findIndex(set => set.id === s.id);
              if (existingIdx !== -1) {
                const existing = updated[existingIdx];
                if (
                  existing.title !== s.title ||
                  existing.price !== s.price ||
                  existing.durationMinutes !== s.durationMinutes ||
                  existing.isFree !== s.isFree ||
                  existing.type !== s.type ||
                  existing.yearOrDate !== s.yearOrDate ||
                  existing.province !== s.province ||
                  JSON.stringify(existing.questions) !== JSON.stringify(s.questions)
                ) {
                  updated[existingIdx] = {
                    ...existing,
                    title: s.title,
                    price: s.price,
                    durationMinutes: s.durationMinutes,
                    isFree: s.isFree,
                    type: s.type,
                    yearOrDate: s.yearOrDate,
                    province: s.province,
                    questions: s.questions && s.questions.length > 0 ? s.questions : existing.questions
                  };
                  changed = true;
                }
              } else {
                // Add new set
                updated.push({
                  id: s.id,
                  title: s.title,
                  examType: exam.id,
                  type: s.type || "mock-test",
                  isFree: s.isFree === true || s.isFree === "1" || s.isFree === 1 || (s as any).is_free === true || (s as any).is_free === "1" || (s as any).is_free === 1,
                  price: s.price || 0,
                  durationMinutes: s.durationMinutes || 60,
                  yearOrDate: s.yearOrDate || "2026",
                  province: s.province || "all",
                  questions: s.questions && s.questions.length > 0 ? s.questions : [
                    {
                      id: `q-${s.id}-1`,
                      questionText: `Sample Question from ${s.title}?`,
                      options: ["Option A", "Option B", "Option C", "Option D"],
                      correctOptionIndex: 0,
                      explanation: "Detailed clinical explanation from Nepalmed CMS.",
                      subject: "General Medicine"
                    }
                  ]
                });
                changed = true;
              }
            });
          });
        });

        // Delete custom sets that were removed in the CMS target exam subcategories
        const cmsSetIds = new Set<string>();
        cmsContent.targetExams.forEach((exam: any) => {
          exam.subcategories?.forEach((sub: any) => {
            sub.sets?.forEach((s: any) => {
              cmsSetIds.add(s.id);
            });
          });
        });

        const finalSets = updated.filter(set => {
          if (set.id.startsWith("custom-") && !cmsSetIds.has(set.id)) {
            changed = true;
            return false;
          }
          return true;
        });

        return changed ? finalSets : prevSets;
      });
    }
  }, [cmsContent]);

  useEffect(() => {
    // We no longer sync progressList to localStorage since it's fetched from backend.
  }, [progressList]);

  useEffect(() => {
    localStorage.setItem("nepmed_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    // Independent questions are managed in DB, no need to sync entire array to server here
  }, [independentQuestions]);

  useEffect(() => {
    localStorage.setItem("nepmed_user_draft_questions", JSON.stringify(userDraftQuestions));
    // Save to server
    fetch("/api/admin/draft-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userDraftQuestions)
    }).catch(err => console.error("Failed to save draft questions to server:", err));
  }, [userDraftQuestions]);

  // Run auto-migration on startup to retag all previous questions with the new ID system
  useEffect(() => {
    const isMigrated = localStorage.getItem("nepmed_id_system_migrated_v3") === "true";
    if (!isMigrated) {
      const { sets: updatedSets, independent: updatedIndependent } = retagAllQuestions(allSets, independentQuestions);
      setAllSets(updatedSets);
      setIndependentQuestions(updatedIndependent);
      localStorage.setItem("nepmed_question_sets", JSON.stringify(updatedSets));
      localStorage.setItem("nepmed_independent_questions", JSON.stringify(updatedIndependent));
      localStorage.setItem("nepmed_id_system_migrated_v3", "true");
      // console.log("������ Pre-existing database questions successfully auto-migrated & retagged!");
    }
  }, [allSets, independentQuestions]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // 3. Action Handlers
  const handleLoginSuccess = (profile: UserProfile, preferredExam?: string) => {
    setUserProfile(profile);
    if (preferredExam) {
      setTargetExam(preferredExam);
    }
    navigate("/dashboard");
    setExamPageState("browse"); // Show specific page in dashboard at first
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("nepmed_auth_token");
    if (token) {
      fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }).catch((err) => {
        console.error("Failed to sign out from backend:", err);
      });
      localStorage.removeItem("nepmed_auth_token");
    }

    setUserProfile({
      email: "",
      name: "",
      avatarUrl: "",
      role: "",
      isLoggedIn: false,
      purchasedSetIds: []
    });
    navigate("/login");
    setActiveSetId(null);
  };

  const handleToggleBookmark = (question: Question, setName: string, examType: string, setId: string) => {
    const exists = bookmarks.some(b => b.questionId === question.id);
    if (exists) {
      setBookmarks(bookmarks.filter(b => b.questionId !== question.id));
    } else {
      const newBookmark: BookmarkedQuestion = {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
        setId,
        setName,
        examType,
        bookmarkedAt: new Date().toISOString()
      };
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  const handleRemoveBookmark = (qId: string) => {
    setBookmarks(bookmarks.filter(b => b.questionId !== qId));
  };

  const handleSessionComplete = (
    setId: string,
    mode: "timed" | "tutor",
    timeSpentSeconds: number,
    correctCount: number,
    incorrectCount: number,
    leftCount: number,
    selectedAnswers: { [qId: string]: number }
  ) => {
    const activeSet = allSets.find(s => s.id === setId);
    const correctMarks = activeSet?.correctMarks ?? 1;
    const incorrectMarks = activeSet?.incorrectMarks ?? 0.25;
    const calculatedScore = Number(((correctCount * correctMarks) - (incorrectCount * incorrectMarks)).toFixed(2));

    const newProgress: UserProgress = {
      setId,
      completedAt: new Date().toISOString(),
      timeSpentSeconds,
      score: calculatedScore,
      totalQuestions: correctCount + incorrectCount + leftCount,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      leftAnswersCount: leftCount,
      answers: selectedAnswers,
      mode
    };

    setProgressList([newProgress, ...progressList]);
  };

  const handleUnlockSet = (setId: string) => {
    setUserProfile(prev => ({
      ...prev,
      purchasedSetIds: [...prev.purchasedSetIds, setId]
    }));
  };

  const handleSubscribe = (examType: string, planDays: number, price: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDays);

    setUserProfile(prev => ({
      ...prev,
      subscription: {
        examType,
        expiresAt: expiresAt.toISOString()
      }
    }));
  };

  const handleSelectSetFromBookmarks = (setId: string) => {
    const set = allSets.find(s => s.id === setId);
    if (set) {
      setTargetExam(set.examType);
      setActiveSetId(setId);
      navigate("/dashboard");
    }
  };

  // 4. Content Selector
  const renderMainContent = () => {
    if (activeScreen === "bookmarks") {
      return (
        <BookmarksView 
          bookmarks={bookmarks}
          onRemoveBookmark={handleRemoveBookmark}
          onSelectSet={handleSelectSetFromBookmarks}
        />
      );
    }

    if (activeScreen === "history") {
      return (
        <TestHistoryView 
          progressList={progressList}
          allSets={allSets}
          onSelectSet={(setId) => {
            const matchSet = allSets.find(s => s.id === setId);
            if (matchSet) {
              setTargetExam(matchSet.examType);
            }
            setActiveSetId(setId);
            navigate("/dashboard");
          }}
          onNavigateToDashboard={() => navigate("/dashboard")}
        />
      );
    }

    if (activeScreen === "leaderboard") {
      return (
        <LeaderboardView 
          userProfile={userProfile}
          progressList={progressList}
          cmsContent={cmsContent}
          onNavigateToDashboard={() => navigate("/dashboard")}
        />
      );
    }

    if (activeScreen === "admin") {
      return (
        <AdminPanel 
          allSets={allSets}
          onSaveSets={setAllSets}
          independentQuestions={independentQuestions}
          onSaveIndependentQuestions={setIndependentQuestions}
          userDraftQuestions={userDraftQuestions}
          onSaveUserDraftQuestions={setUserDraftQuestions}
          targetExam={targetExam}
          cmsContent={cmsContent}
          onSaveCMSContent={handleSaveCMSContent}
        />
      );
    }

    if (activeScreen === "custom_admin") {
      return (
        <LocalErrorBoundary>
          <CustomAdminPanel 
            allSets={allSets}
            onSaveSets={setAllSets}
            independentQuestions={independentQuestions}
            onSaveIndependentQuestions={setIndependentQuestions}
            userDraftQuestions={userDraftQuestions}
            onSaveUserDraftQuestions={setUserDraftQuestions}
            targetExam={targetExam}
            cmsContent={cmsContent}
            onSaveCMSContent={handleSaveCMSContent}
          />
        </LocalErrorBoundary>
      );
    }

    if (activeScreen === "forum") {
      return (
        <ForumView 
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === "subscription") {
      return (
        <SubscriptionView 
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          cmsContent={cmsContent}
        />
      );
    }

    if (activeScreen === "refer_earn") {
      return (
        <ReferEarnView 
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          cmsContent={cmsContent}
        />
      );
    }

    if (activeScreen === "about") {
      return (
        <AboutUsView 
          userProfile={userProfile} 
          cmsContent={cmsContent}
        />
      );
    }

    if (customWorkoutSet) {
      return (
        <PracticeSession 
          set={customWorkoutSet}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onSessionComplete={(setId, mode, timeSpentSeconds, correctCount, incorrectCount, leftCount, selectedAnswers) => {
            handleSessionComplete(setId, mode, timeSpentSeconds, correctCount, incorrectCount, leftCount, selectedAnswers);
          }}
          onExit={() => {
            setCustomWorkoutSet(null);
            setCustomWorkoutMode(null);
          }}
          onAskGeminiTutor={setActiveTutorQuestion}
          initialMode={customWorkoutMode || undefined}
          userEmail={userProfile.email}
        />
      );
    }

    if (activeScreen === "practice") {
      return (
        <PracticeView 
          allSets={allSets}
          targetExam={targetExam}
          independentQuestions={independentQuestions}
          userDraftQuestions={userDraftQuestions}
          setUserDraftQuestions={setUserDraftQuestions}
          onSaveSets={setAllSets}
          cmsContent={cmsContent}
          dbSubjects={dbSubjects}
          dbTopics={dbTopics}
          onStartCustomSession={(customSet, mode) => {
            setCustomWorkoutSet(customSet);
            setCustomWorkoutMode(mode);
          }}
        />
      );
    }

    if (activeScreen === "set_practice") {
      if (activeSetId) {
        const activeSet = allSets.find(s => s.id === activeSetId);
        if (activeSet) {
          return (
            <PracticeSession 
              set={activeSet}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              onSessionComplete={handleSessionComplete}
              onExit={() => setActiveSetId(null)}
              onAskGeminiTutor={setActiveTutorQuestion}
              userEmail={userProfile.email}
            />
          );
        }
      }

      return (
        <ExamSpecificView 
          targetExam={targetExam}
          allSets={allSets}
          userProfile={userProfile}
          onUnlockSet={handleUnlockSet}
          onSubscribe={handleSubscribe}
          onSelectSet={setActiveSetId}
          onBack={() => navigate("/dashboard")}
          cmsContent={cmsContent}
          dbExams={dbExams}
        />
      );
    }

    // Active screen is "dashboard"
    if (activeSetId) {
      const activeSet = allSets.find(s => s.id === activeSetId);
      if (activeSet) {
        return (
          <PracticeSession 
            set={activeSet}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onSessionComplete={handleSessionComplete}
            onExit={() => setActiveSetId(null)}
            onAskGeminiTutor={setActiveTutorQuestion}
            userEmail={userProfile.email}
          />
        );
      }
    }

    if (examPageState === "browse") {
      return (
        <ExamSpecificView 
          targetExam={targetExam}
          allSets={allSets}
          userProfile={userProfile}
          onUnlockSet={handleUnlockSet}
          onSubscribe={handleSubscribe}
          onSelectSet={(setId) => {
            navigate("/set_practice");
            setActiveSetId(setId);
          }}
          onBack={() => setExamPageState("summary")}
          cmsContent={cmsContent}
        />
      );
    }

    // Default dashboard layout
    return (
      <DashboardView 
        targetExam={targetExam}
        progressList={progressList}
        allSets={allSets}
        onSelectExamPage={() => {
          navigate("/set_practice");
          setExamPageState("browse");
        }}
        onSelectSet={(setId) => {
          navigate("/set_practice");
          setActiveSetId(setId);
        }}
        onSelectSubjectPractice={() => {
          navigate("/practice");
        }}
        cmsContent={cmsContent}
        dbExams={dbExams}
      />
    );
  };

  // Direct Admin Portal Gating (completely separate from student portal)
  const isLoginPage = location.pathname === "/admin/login";
  const isAdminPath = location.pathname.startsWith("/admin");

  if (isLoginPage) {
    const handleAdminLoginSuccess = (profile: UserProfile) => {
      setUserProfile(profile);
    };
    return (
      <AdminLoginScreen onLoginSuccess={handleAdminLoginSuccess} />
    );
  }

  if (isAdminPath) {
    const isAdmin = userProfile.isLoggedIn && (
      userProfile.role === "admin" || 
      userProfile.email?.toLowerCase().includes("admin") || 
      userProfile.name?.toLowerCase().includes("admin")
    );
    if (!isAdmin) {
      navigate("/admin/login");
      return (
        <div className="min-h-screen bg-slate-955 flex flex-col items-center justify-center text-xs text-slate-500 font-mono gap-2">
          <span>Redirecting to admin login portal...</span>
        </div>
      );
    }
    return (
      <CustomAdminPanel 
        allSets={allSets}
        onSaveSets={setAllSets}
        independentQuestions={independentQuestions}
        onSaveIndependentQuestions={setIndependentQuestions}
        userDraftQuestions={userDraftQuestions}
        onSaveUserDraftQuestions={setUserDraftQuestions}
        targetExam={targetExam}
        cmsContent={cmsContent}
        onSaveCMSContent={handleSaveCMSContent}
        onLogout={handleLogout}
        dbExams={dbExams}
        dbSubjects={dbSubjects}
        dbTopics={dbTopics}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // If user is not logged in, show LandingPage or LoginScreen
  if (!userProfile.isLoggedIn) {
    if (activeScreen === "login") {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} cmsContent={cmsContent} dbExams={dbExams} />;
    }
    return (
      <LandingPage 
        cmsContent={cmsContent} 
        dbExams={dbExams}
        dbPackages={dbPackages}
        dbTeams={dbTeams}
        dbSubjects={dbSubjects}
        dbTopics={dbTopics}
        allSets={allSets}
        onLoginClick={() => setActiveScreen("login")}
        onSignUpClick={() => setActiveScreen("login")}
        darkMode={theme === "dark"}
 onToggleTheme={() => {
                setTheme(prev => {
                  const next = prev === "dark" ? "light" : "dark";
                  localStorage.setItem("nepmed_theme", next);
                  return next;
                });
              }}      />

      
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 flex flex-col landscape:flex-row lg:flex-row font-sans">
      
      {/* Sidebar Layout */}
      <Sidebar 
        userProfile={userProfile}
        activeScreen={activeScreen}
        setActiveScreen={(scr) => {
          navigate("/" + scr);
          setActiveSetId(null);
          setExamPageState("summary");
        }}
        targetExam={targetExam}
        setTargetExam={(exam) => {
          setTargetExam(exam);
          setExamPageState("browse");
          setActiveSetId(null);
        }}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onEditProfile={() => setShowSettingsModal(true)}
        cmsContent={cmsContent}
        dbExams={dbExams}
      />

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-slate-950/20">
        
        {/* Unified Responsive Header */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 landscape:px-8 lg:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between gap-4 shadow-md backdrop-blur-md">
          
          {/* Left section: Sidebar Hamburger (Mobile only) + Brand/App label */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="landscape:hidden lg:hidden p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <div className="landscape:hidden lg:hidden flex items-center gap-1.5">
              <Stethoscope className="w-4.5 h-4.5 text-emerald-400" />
              <span className="font-extrabold text-white text-sm tracking-tight">{cmsContent.brandName}</span>
            </div>
            
            {/* Navigation buttons: Dash/Stats switcher (Desktop only) */}
            <div className="hidden landscape:flex lg:flex items-center gap-2.5">
              {examPageState === "browse" && !activeSetId && activeScreen === "dashboard" && (
                <button
                  onClick={() => setExamPageState("summary")}
                  className="text-slate-400 hover:text-white font-semibold text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Stats Dashboard
                </button>
              )}
              {examPageState === "summary" && !activeSetId && activeScreen === "dashboard" && (
                <button
                  onClick={() => setExamPageState("browse")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-emerald-500/20"
                >
                  Enter Practice Arena
                </button>
              )}
            </div>
          </div>

          {/* Center Section: Responsive Search Bar */}
          <div className="relative flex-1 max-w-sm sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search practice papers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full bg-slate-950/60 text-white placeholder-slate-500 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Floating Search Results */}
            {showSearchResults && searchQuery && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSearchResults(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                  {allSets.filter(s => 
                    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.examType.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 ? (
                    allSets
                      .filter(s => 
                        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.examType.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((set) => (
                        <button
                          key={set.id}
                          onClick={() => {
                            setTargetExam(set.examType);
                            setActiveSetId(set.id);
                            navigate("/dashboard");
                            setExamPageState("browse");
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-800/40 transition-colors flex justify-between items-center group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {set.title}
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 inline-block uppercase tracking-wider">
                              {set.examType.toUpperCase()} • {set.questions.length} Questions
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching question papers found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Section: Theme Toggle and Profile Menu */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>

            {/* Profile Dropdown Component */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline text-xs font-bold text-slate-300">
                  {userProfile.name || "Candidate"}
                </span>
              </button>

              {/* Profile Dropdown Local Popup */}
              {showProfileDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 divide-y divide-slate-800/50">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-white truncate">{userProfile.name || "Candidate"}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{userProfile.email || "student@nepmed.edu"}</p>
                      {(userProfile.age || userProfile.sex) && (
                        <p className="text-[9px] text-emerald-400 font-extrabold mt-1.5 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 inline-block">
                          {userProfile.sex || "Male"} • Age {userProfile.age || "N/A"}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {/* Theme Toggle Button */}
                      <button
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800/40 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                          <span>Toggle {theme === "dark" ? "Light" : "Dark"} Theme</span>
                        </span>
                        <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {theme === "dark" ? "light" : "dark"}
                        </span>
                      </button>

                      {/* Profile Settings Button */}
                      <button
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800/40 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>Profile Settings</span>
                      </button>
                    </div>

                    <div className="py-1">
                      {/* Signout Button */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Profile Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  Profile Settings
                </h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Name field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Candidate Full Name</label>
                  <input 
                    type="text" 
                    value={profileFormName} 
                    onChange={(e) => setProfileFormName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-950/60 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Age field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Age</label>
                  <input 
                    type="number" 
                    value={profileFormAge} 
                    onChange={(e) => setProfileFormAge(e.target.value)}
                    placeholder="Enter age (e.g. 24)"
                    className="w-full bg-slate-950/60 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Sex field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Gender / Sex</label>
                  <select 
                    value={profileFormSex} 
                    onChange={(e) => setProfileFormSex(e.target.value)}
                    className="w-full bg-slate-950/60 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="Male" className="bg-slate-900 text-slate-100">Male</option>
                    <option value="Female" className="bg-slate-900 text-slate-100">Female</option>
                    <option value="Other" className="bg-slate-900 text-slate-100">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 gap-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setUserProfile(prev => ({
                      ...prev,
                      name: profileFormName,
                      age: profileFormAge,
                      sex: profileFormSex
                    }));
                    setShowSettingsModal(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Section Injection */}
        <div className="pb-16 landscape:pb-8 lg:pb-8 flex flex-col justify-between min-h-[calc(100vh-80px)]">
          <div>
            {renderMainContent()}
          </div>

          {/* Elegant small copyright reserve centered footer */}
          <footer className="mt-12 pt-6 border-t border-slate-900/60 text-center pb-4">
            <p className="text-[10px] text-slate-500 font-sans tracking-wide">
              © 2026 PrepzaNepal Study Engine. All rights reserved.
            </p>
          </footer>
        </div>
      </main>

      {/* Slide-over Modal for AI Medical Tutor */}
      <AITutorModal 
        question={activeTutorQuestion}
        onClose={() => setActiveTutorQuestion(null)}
      />

      {/* Elegant Cookie Consent Banner */}
      {!cookieAccepted && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-slate-900/95 border border-slate-800 p-4 rounded-xl shadow-2xl backdrop-blur-md z-[150] flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold text-white">🍪 Cookie & Progress Acceptance</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              We use cookies and local cache storage to securely persist your progress history, bookmarks, session statistics, and account state offline.
            </p>
          </div>
          <div className="flex justify-end gap-2 text-[10px]">
            <button 
              onClick={handleAcceptCookies}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-emerald-500/10 text-[10px]"
            >
              I Accept Cookies
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
