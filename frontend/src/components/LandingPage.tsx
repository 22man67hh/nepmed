
import React, { useState, useMemo, useEffect } from "react";
import { 
  CMSContent, 
  QuestionSet 
} from "../types";
// Hardcoded imports removed as per DB-only requirement
import { LeadershipCards } from "./LeadershipCards";
import { 
  Stethoscope, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Users, 
  Gift, 
  ArrowRight, 
  Search, 
  Filter, 
  BookMarked, 
  BarChart3, 
  BrainCircuit, 
  Flame, 
  HelpCircle, 
  Menu, 
  X, 
  Lock, 
  ExternalLink,
  Target,
  GraduationCap,
  Layers,
  Compass,
  FileCheck,
  FileText,
  Check,
  Star,
  ChevronDown,
  UserCheck,
  Share2,
  Play,
  RotateCcw,
  XCircle,
  PenTool,
  Pencil,
  Book,
  FileEdit,
  PenLine
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  cmsContent: CMSContent;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  allSets?: QuestionSet[];
  darkMode?: boolean;
  onToggleTheme?: () => void;
  dbExams?: any[];
  dbPackages?: any[];
  dbTeams?: any[];
  dbSubjects?: any[];
  dbTopics?: any[];
}

type Tab = 'home' | 'features' | 'exams' | 'question_banks' | 'pricing' | 'refer' | 'about' | 'exam_detail';

// Curated high quality academic & professional photo assets for target exams
const EXAM_THUMBNAILS: Record<string, string> = {
  "mec-ug": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
  "mec-pg": "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
  "nmcle": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
  "nmcle-bds": "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
  "mec-mds": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
  "loksewa": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80",
  "loksewa-staff-nurse": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
  "loksewa-nursing-officer": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
  "nlen-pcl": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
  "nlen-bsc": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
  "ioe": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "ioe-entrance": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "mec-mph": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  "mph-msph": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  "loksewa-pho": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
};

// High-yield authentic sample questions for the interactive Hero simulator
const HERO_SAMPLE_QUESTIONS = [
  {
    examSlug: "nmcle",
    examBadge: "NMCLE Licensing Board",
    subject: "Emergency Medicine • Pharmacology",
    qNumber: "42 of 150",
    timeRemaining: "01:14:20",
    question: "A 24-year-old female presents with acute severe anaphylaxis following an intramuscular antibiotic. What is the immediate first-line drug and route of administration?",
    options: [
      { text: "Hydrocortisone 200 mg slow IV", correct: false, note: "Corticosteroids take 4-6 hours to act. They do not reverse acute airway edema or shock." },
      { text: "Adrenaline 1:1,000 (0.5 mg) IM in anterolateral thigh", correct: true, note: "First-line life-saving agent. Rapidly reverses vasodilation, stabilizes mast cells, and relieves laryngeal edema." },
      { text: "Chlorpheniramine 10 mg slow IV", correct: false, note: "Antihistamines are strictly second-line symptomatic relief and do not stabilize vascular collapse." },
      { text: "Nebulized Salbutamol 5 mg only", correct: false, note: "Salbutamol only addresses bronchospasm, not systemic distributive shock." }
    ],
    highYieldFact: "Adrenaline IM (vastus lateralis) is the ONLY drug that halts anaphylaxis progression. Repeat every 5-15 mins if refractory."
  },
  {
    examSlug: "mec-ug",
    examBadge: "MECEE-UG Entrance (MBBS/BDS)",
    subject: "Clinical Anatomy",
    qNumber: "18 of 200",
    timeRemaining: "02:45:10",
    question: "A displaced fracture of the surgical neck of the humerus most directly jeopardizes which nerve and vascular bundle?",
    options: [
      { text: "Radial nerve and Profunda brachii artery", correct: false, note: "These wrap around the midshaft spiral groove, vulnerable in humerus shaft fractures." },
      { text: "Axillary nerve and Posterior circumflex humeral artery", correct: true, note: "Both structures exit the quadrangular space and wind tightly around the surgical neck." },
      { text: "Median nerve and Brachial artery", correct: false, note: "At risk in pediatric supracondylar fractures of the humerus." },
      { text: "Ulnar nerve and Superior ulnar collateral artery", correct: false, note: "Passes posterior to the medial epicondyle ('funny bone' region)." }
    ],
    highYieldFact: "Axillary nerve damage leads to loss of shoulder abduction (deltoid) and sensory loss over the 'regimental badge' patch."
  },
  {
    examSlug: "mec-pg",
    examBadge: "MECEE-PG Entrance (MD/MS)",
    subject: "General Surgery & CSQ",
    qNumber: "87 of 200",
    timeRemaining: "01:30:00",
    question: "Which of the following prognostic parameters in Ranson's Criteria for acute pancreatitis is assessed AT ADMISSION (0 hours)?",
    options: [
      { text: "Serum Calcium < 8.0 mg/dL", correct: false, note: "Assessed within 48 hours to gauge saponification & third-spacing." },
      { text: "Fall in Hematocrit > 10%", correct: false, note: "Measured within 48 hours to evaluate fluid resuscitation." },
      { text: "White Blood Cell count (WBC) > 16,000/mm³", correct: true, note: "Admission parameters (GAWLE): Glucose > 200, Age > 55, WBC > 16,000, LDH > 350, AST > 250." },
      { text: "Arterial PO2 < 60 mmHg", correct: false, note: "Monitored at 48 hours to track acute lung injury / ARDS." }
    ],
    highYieldFact: "Mnemonic at Admission: GAWLE (Glucose, Age, WBC, LDH, AST). At 48 hrs: C-HOBBS (Calcium, Hct, Oxygen, BUN, Base deficit, Sequestration)."
  }
];

interface GroupedSubject {
  subjectName: string;
  totalMarks: number;
  topics: Array<{ name: string; marks: number }>;
}

/**
 * Helper to group subject weights into Subject Headings and bulleted Topics.
 * Supports keys formatted with '>' (e.g. "Physics > Modern Physics") or standalone subjects.
 */
function getGroupedSubjectWeights(subjectWeights: Record<string, number>): GroupedSubject[] {
  const map = new Map<string, GroupedSubject>();

  for (const [key, weight] of Object.entries(subjectWeights)) {
    if (key.includes(" > ")) {
      const parts = key.split(" > ");
      const subject = parts[0].trim();
      const topic = parts.slice(1).join(" > ").trim();

      if (!map.has(subject)) {
        map.set(subject, {
          subjectName: subject,
          totalMarks: 0,
          topics: []
        });
      }
      const group = map.get(subject)!;
      group.totalMarks += weight;
      group.topics.push({ name: topic, marks: weight });
    } else if (key.includes(" (CSQ)") || key.includes("(CSQ)")) {
      const subject = key.replace(/\s*\(CSQ\)/g, "").trim();
      const topicName = "Clinical Scenario-Based Questions (CSQ)";
      if (!map.has(subject)) {
        map.set(subject, {
          subjectName: subject,
          totalMarks: 0,
          topics: []
        });
      }
      const group = map.get(subject)!;
      group.totalMarks += weight;
      group.topics.push({ name: topicName, marks: weight });
    } else {
      if (!map.has(key)) {
        map.set(key, {
          subjectName: key,
          totalMarks: weight,
          topics: []
        });
      } else {
        const group = map.get(key)!;
        group.totalMarks += weight;
      }
    }
  }

  return Array.from(map.values());
}

export default function LandingPage({
  cmsContent,
  onLoginClick,
  onSignUpClick,
  allSets = [],
  darkMode: externalDarkMode,
  onToggleTheme: externalToggleTheme,
  dbExams = [],
  dbPackages = [],
  dbTeams = [],
  dbSubjects = [],
  dbTopics = []
}: LandingPageProps) {
  // Unified permanent dark theme
  const isDark = true;

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [filterExam, setFilterExam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  // Interactive Hero Demo Question States
  const [heroDemoExam, setHeroDemoExam] = useState<string>("nmcle");
  const [heroQuestionIdx, setHeroQuestionIdx] = useState<number>(0);
  const [heroSelectedOption, setHeroSelectedOption] = useState<number | null>(null);

  // Fallback Student Reviews / Testimonials
  const testimonialsList = useMemo(() => {
    if (cmsContent?.testimonials && cmsContent.testimonials.length > 0) {
      return cmsContent.testimonials;
    }
    return [
      {
        id: "rev-1",
        name: "Dr. Bikram Adhikari",
        roleOrExam: "MECEE-PG Rank 4 (MD Radiology)",
        rating: 5,
        review: "NepMed was the single most valuable tool during my MECEE-PG preparation. The high-yield explanations, pathology breakdowns by Dr. Sunil Subedi, and subject analytics helped me secure Rank 4!",
        verified: true,
        date: "2026"
      },
      {
        id: "rev-2",
        name: "Dr. Sushma Thapa",
        roleOrExam: "NMCLE Medical Licensing Cleared (First Attempt)",
        rating: 5,
        review: "The NMCLE past papers with AI Tutor rationales made revising clinical case scenarios so intuitive. I went into the examination hall feeling 100% confident!",
        verified: true,
        date: "2026"
      },
      {
        id: "rev-3",
        name: "Subash Poudel",
        roleOrExam: "IOE Engineering Entrance Rank 12 (Pulchowk)",
        rating: 5,
        review: "The Physics and Chemistry question bank with step-by-step problem solving helped me build phenomenal speed and accuracy for Pulchowk IOE entrance.",
        verified: true,
        date: "2026"
      },
      {
        id: "rev-4",
        name: "Anjali Shrestha",
        roleOrExam: "Loksewa Staff Nurse 5th Level (Rank 1)",
        rating: 5,
        review: "NepMed's provincial PSC sets for Bagmati and Koshi were identical to actual exam pattern questions. Essential for all Loksewa nurse aspirants!",
        verified: true,
        date: "2026"
      }
    ];
  }, [cmsContent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % testimonialsList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonialsList.length]);

  // Fallback FAQs
  const faqsList = useMemo(() => {
    if (cmsContent?.faqs && cmsContent.faqs.length > 0) {
      return cmsContent.faqs;
    }
    return [
      {
        id: "faq-1",
        question: "How are NepMed question banks aligned with official MEC & NMCLE syllabi?",
        answer: "All question sets, past papers, and mock exams on NepMed are meticulously audited and curated by our medical editorial team led by Founder Dr. Sunil Subedi according to the official syllabus blueprints released by the Medical Education Commission (MEC), Nepal Medical Council (NMC), and Public Service Commission (Loksewa).",
        category: "Syllabus & Coverage"
      },
      {
        id: "faq-2",
        question: "Can I practice question sets on mobile devices?",
        answer: "Yes! NepMed is fully responsive and optimized for smartphones, tablets, and laptops. You can practice timed MCQs, view high-yield notes, and read AI explanations on any browser smoothly.",
        category: "Platform Access"
      },
      {
        id: "faq-3",
        question: "How does the AI Medical Tutor assist during practice?",
        answer: "Whenever you solve a question, our AI Tutor provides instant pathophysiological breakdowns, comparative differential diagnosis tables, rate-limiting enzyme mechanics, and memory mnemonics tailored specifically to your answer choices.",
        category: "AI Tutor & Rationales"
      },
      {
        id: "faq-4",
        question: "What payment methods are supported for subscription in Nepal?",
        answer: "We support instant local digital payments via eSewa, Khalti, IME Pay, Fonepay QR, and direct Nepalese bank transfers with automated activation.",
        category: "Payments & Pricing"
      },
      {
        id: "faq-5",
        question: "Are there free trial modules or past papers available?",
        answer: "Yes! NepMed provides free past year papers and mock tests for every target exam (MECEE-PG, NMCLE, MECEE-BL, IOE, Loksewa) so candidates can test the platform before upgrading to Premium.",
        category: "Free Access"
      },
      {
        id: "faq-6",
        question: "How does the Referral Loyalty Scheme work?",
        answer: "When you invite friends using your personal referral code, you earn free days of Premium Pro access and cashback rewards whenever your referral registers or subscribes.",
        category: "Referral & Rewards"
      }
    ];
  }, [cmsContent]);

  // Comprehensive multi-disciplinary target exams from DB
  const targetExams = useMemo(() => {
    if (dbExams && Array.isArray(dbExams) && dbExams.length > 0) {
      return dbExams.map(exam => ({
        id: String(exam.id),
        name: exam.name,
        shortName: exam.name,
        category: "All",
        isLive: true,
        slug: exam.slug,
        description: exam.description
      }));
    }
    
    // Fallback if dbExams is empty
    return [
      { id: "mec-pg", name: "MECEE-PG MD/MS", shortName: "MECEE PG", category: "Medical PG", isLive: true, description: "Official syllabus blueprint.", slug: "mec-pg" }
    ];
  }, [dbExams]);

  // Derived question sets directly from DB
  const questionSetsPool = useMemo(() => {
    return allSets || [];
  }, [allSets]);

  // Filtered question sets
  const filteredSets = useMemo(() => {
    return questionSetsPool.filter(set => {
      const targetConfig = targetExams.find(e => e.id === filterExam);
      const targetSlug = targetConfig?.slug?.toLowerCase() || filterExam;
      const setExamType = String(set.examType || "").toLowerCase();
      
      const matchesExam = filterExam === 'all' || 
                          setExamType === filterExam.toLowerCase() || 
                          setExamType === targetSlug || 
                          (targetSlug === 'mec-ug' && set.id.toLowerCase().startsWith('mec-ug')) || 
                          (targetSlug === 'mec-pg' && set.id.toLowerCase().startsWith('mec-pg'));
      const matchesSearch = !searchQuery || 
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (set.subcategory && set.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (set.yearOrDate && set.yearOrDate.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesExam && matchesSearch;
    });
  }, [questionSetsPool, filterExam, searchQuery, targetExams]);

  // Robust exam config lookup
  const selectedExamConfig = useMemo(() => {
    return targetExams.find(c => c.id === selectedExamId) || targetExams[0];
  }, [selectedExamId, targetExams]);

  const selectedExamMeta = useMemo(() => {
    return targetExams.find(e => e.id === selectedExamId) || targetExams[0];
  }, [targetExams, selectedExamId]);

  const handleOpenExamDetail = (examId: string) => {
    setSelectedExamId(examId);
    setActiveTab('exam_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'exams', label: 'Exams & Syllabus' },
    { id: 'question_banks', label: 'Question Banks' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'refer', label: 'Refer & Reward' },
    { id: 'about', label: 'About Us' }
  ];

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-200 ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9]/85 to-[#ecfdf5]/30 text-slate-900'
    }`}>
      
      {/* ================= BACKGROUND ACADEMIC & NOTEBOOK TEXTURE LAYER ================= */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
        
        {/* Graph Paper / Notebook Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045]" 
          style={{
            backgroundImage: `radial-gradient(currentColor 1.2px, transparent 1.2px)`,
            backgroundSize: '28px 28px'
          }} 
        />
        
        {/* Soft Ambient Colorful Radial Glows */}
        <div className="absolute -top-40 -right-40 w-[550px] h-[550px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[140px]" />

        {/* 1. Top Right: Open Book & Fountain Pen floating behind hero */}
        <div className="absolute top-24 right-[3%] text-emerald-800/10 dark:text-emerald-400/10 transform rotate-12 transition-transform duration-700 pointer-events-none">
          <div className="relative">
            <BookOpen className="w-56 h-56 stroke-[1.1]" />
            <div className="absolute -bottom-6 -right-6 transform -rotate-45 text-emerald-700/15 dark:text-emerald-300/15">
              <PenTool className="w-28 h-28 stroke-[1.2]" />
            </div>
          </div>
        </div>

        {/* 2. Top Left: Writing Pencil & Notepad behind Header/Hero left */}
        <div className="absolute top-36 left-[2%] text-slate-700/10 dark:text-slate-300/10 transform -rotate-12 pointer-events-none">
          <div className="relative">
            <FileEdit className="w-40 h-40 stroke-[1.1]" />
            <div className="absolute -top-4 -right-4 transform rotate-45 text-emerald-600/15 dark:text-emerald-400/15">
              <Pencil className="w-20 h-20 stroke-[1.3]" />
            </div>
          </div>
        </div>

        {/* 3. Middle Left: Stethoscope & Open Study Atlas behind Exams section */}
        <div className="absolute top-[35%] left-[3%] text-emerald-800/10 dark:text-emerald-400/10 transform rotate-6 pointer-events-none">
          <div className="relative">
            <Book className="w-48 h-48 stroke-[1.1]" />
            <div className="absolute top-1/4 -right-8 transform -rotate-12 text-teal-700/15 dark:text-teal-400/15">
              <Stethoscope className="w-32 h-32 stroke-[1.2]" />
            </div>
          </div>
        </div>

        {/* 4. Middle Right: Drafting Pen & Checklist Sheet behind Question Sets */}
        <div className="absolute top-[48%] right-[2%] text-slate-700/10 dark:text-slate-300/10 transform -rotate-12 pointer-events-none">
          <div className="relative">
            <FileCheck className="w-44 h-44 stroke-[1.1]" />
            <div className="absolute -bottom-4 -left-6 transform rotate-45 text-emerald-700/15 dark:text-emerald-300/15">
              <PenLine className="w-28 h-28 stroke-[1.3]" />
            </div>
          </div>
        </div>

        {/* 5. Lower Left: Graduation Cap & Book Stack behind Reviews & FAQs */}
        <div className="absolute top-[70%] left-[2%] text-emerald-800/10 dark:text-emerald-400/10 transform -rotate-6 pointer-events-none">
          <div className="relative">
            <GraduationCap className="w-44 h-44 stroke-[1.1]" />
            <div className="absolute -bottom-4 -right-4 transform rotate-12 text-slate-700/10 dark:text-slate-400/10">
              <BookOpen className="w-36 h-36 stroke-[1.2]" />
            </div>
          </div>
        </div>

        {/* 6. Lower Right: Fountain Pen & Certificate Scroll */}
        <div className="absolute top-[82%] right-[4%] text-emerald-800/10 dark:text-emerald-400/10 transform rotate-12 pointer-events-none">
          <div className="relative">
            <BookMarked className="w-48 h-48 stroke-[1.1]" />
            <div className="absolute -top-6 -left-6 transform -rotate-45 text-teal-700/15 dark:text-teal-400/15">
              <PenTool className="w-24 h-24 stroke-[1.3]" />
            </div>
          </div>
        </div>

      </div>

      {/* 1. TOP STICKY NAVBAR */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${
        isDark 
          ? 'bg-slate-950/85 border-slate-800/80 text-white' 
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <button 
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight leading-tight">
                  <span className={isDark ? "text-white" : "text-slate-900"}>Nep</span>
                  <span className="text-emerald-500">Med</span>
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id as Tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive 
                      ? isDark 
                        ? 'bg-slate-800 text-emerald-400' 
                        : 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Log In, Sign Up */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Log In Button */}
            <button
              onClick={onLoginClick}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                isDark
                  ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 shadow-sm'
              }`}
            >
              Log In
            </button>

            {/* Sign Up CTA Button */}
            <button
              onClick={onSignUpClick}
              className="px-4 sm:px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Sign Up
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 lg:hidden rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`lg:hidden border-b px-4 py-3 space-y-1 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
              }`}
            >
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id as Tab);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    activeTab === link.id
                      ? isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
                  className={`flex-1 py-2 text-center text-sm font-bold rounded-lg border ${
                    isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onSignUpClick(); }}
                  className="flex-1 py-2 text-center text-sm font-bold rounded-lg bg-emerald-500 text-slate-950"
                >
                  Sign Up Free
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MAIN TAB CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ======================= TAB: HOME / LANDING ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-16 sm:space-y-24">
            
            {/* HERO SECTION — MODERN HIGH-CONVERTING EDTECH SPLIT LAYOUT */}
            <div className={`relative rounded-3xl overflow-hidden border transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-slate-800 shadow-2xl' 
                : 'bg-gradient-to-b from-white via-slate-50 to-emerald-50/30 border-slate-200/90 shadow-xl'
            }`}>
              {/* Subtle architectural grid pattern & ambient radial glows */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                style={{
                  backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }} 
              />
              <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-6 sm:p-10 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                  
                  {/* Left Column: Authentic Copy, Exam Switcher & Actions (6 Cols) */}
                  <div className="lg:col-span-6 space-y-6 text-left">
                    
                    {/* Live Status Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Updated 2026/2083 Syllabi: MECEE • NMCLE • Loksewa Health</span>
                    </div>

                    {/* Headline */}
                    <h1 className={`text-3xl sm:text-5xl lg:text-[2.75rem] font-black tracking-tight leading-[1.12] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Real entrance exam simulations.{' '}
                      <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        Zero guesswork.
                      </span>
                    </h1>

                    {/* Subtitle */}
                    <p className={`text-base sm:text-lg leading-relaxed max-w-xl font-normal ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {cmsContent?.heroDescription || "The dedicated preparation platform built specifically for Nepalese medical officers, MBBS/BDS entrance candidates, and licensing aspirants. Practice official past papers with realistic negative marking, timed mocks, and peer-reviewed clinical rationales."}
                    </p>

                    {/* Exam Target Quick-Switcher */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between max-w-lg">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Select Target Board to Test:
                        </span>
                        <span className="text-[11px] text-emerald-500 font-semibold hidden sm:inline">
                          Interactive demo below ⚡
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "nmcle", label: "NMCLE (Licensing)", sampleIdx: 0 },
                          { id: "mec-ug", label: "MECEE-UG (MBBS/BDS)", sampleIdx: 1 },
                          { id: "mec-pg", label: "MECEE-PG (MD/MS)", sampleIdx: 2 },
                          { id: "loksewa", label: "Loksewa Medical Officer", sampleIdx: 0 }
                        ].map(examTab => (
                          <button
                            key={examTab.id}
                            onClick={() => {
                              setHeroDemoExam(examTab.id);
                              setHeroQuestionIdx(examTab.sampleIdx);
                              setHeroSelectedOption(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              heroDemoExam === examTab.id
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : isDark
                                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                            }`}
                          >
                            {examTab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <button
                        onClick={onSignUpClick}
                        className="px-7 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <span>Start Free Diagnostic Mock</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </button>

                      <button
                        onClick={() => { setActiveTab('exams'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`px-5 py-3.5 rounded-xl font-semibold border flex items-center justify-center gap-2 text-sm sm:text-base transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200' 
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span>View Syllabi & Weightages</span>
                      </button>
                    </div>

                    {/* Key Trust Checkmarks */}
                    <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Negative marking (-0.25) simulation
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 100% MEC & NMC syllabus blueprint
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Khalti & eSewa instant digital access
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive MCQ Simulator Widget (6 Cols - Generous Width) */}
                  <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
                    {(() => {
                      const curQ = HERO_SAMPLE_QUESTIONS[heroQuestionIdx] || HERO_SAMPLE_QUESTIONS[0];
                      const hasAnswered = heroSelectedOption !== null;
                      const isSelectedCorrect = hasAnswered && curQ.options[heroSelectedOption]?.correct;

                      return (
                        <div className={`w-full max-w-[560px] xl:max-w-[620px] p-5 sm:p-7 rounded-3xl border shadow-2xl relative backdrop-blur-md transition-all duration-200 ${
                          isDark 
                            ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-emerald-950/20 ring-1 ring-slate-800/80' 
                            : 'bg-white/95 border-slate-200 text-slate-900 shadow-emerald-500/10 ring-1 ring-slate-200/80'
                        }`}>
                          {/* Card Top Ribbon */}
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {curQ.examBadge}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">Q. {curQ.qNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{curQ.timeRemaining}</span>
                            </div>
                          </div>

                          {/* Subject Pill */}
                          <div className="pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-500" />
                              {curQ.subject}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                              4-Option MCQ
                            </span>
                          </div>

                          {/* Question Stem */}
                          <div className="py-3">
                            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                              {curQ.question}
                            </p>
                          </div>

                          {/* Interactive Option List */}
                          <div className="space-y-2 pt-1">
                            {curQ.options.map((opt, oIdx) => {
                              const letter = String.fromCharCode(65 + oIdx);
                              const isSelected = heroSelectedOption === oIdx;
                              
                              let optionStyle = isDark
                                ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700';

                              if (hasAnswered) {
                                if (opt.correct) {
                                  optionStyle = 'border-emerald-500/80 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30';
                                } else if (isSelected && !opt.correct) {
                                  optionStyle = 'border-red-500/80 bg-red-500/15 text-red-600 dark:text-red-300 font-semibold ring-1 ring-red-500/30';
                                } else {
                                  optionStyle = isDark
                                    ? 'border-slate-800/60 bg-slate-900/30 text-slate-500 opacity-60'
                                    : 'border-slate-100 bg-slate-50/60 text-slate-400 opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => setHeroSelectedOption(oIdx)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <span className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                      hasAnswered && opt.correct
                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                        : hasAnswered && isSelected && !opt.correct
                                          ? 'bg-red-500 text-white font-black'
                                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {letter}
                                    </span>
                                    <span className="truncate leading-snug">{opt.text}</span>
                                  </div>

                                  {hasAnswered && opt.correct && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  )}
                                  {hasAnswered && isSelected && !opt.correct && (
                                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic Feedback or Prompt */}
                          {!hasAnswered ? (
                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                Click any option above to test yourself live
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                -0.25 Active
                              </span>
                            </div>
                          ) : (
                            <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                              {/* Score Badge */}
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  isSelectedCorrect
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {isSelectedCorrect ? '✓ +1.00 Mark Awarded' : '✕ -0.25 Negative Marking Penalty'}
                                </span>

                                <button
                                  onClick={() => {
                                    setHeroQuestionIdx((prev) => (prev + 1) % HERO_SAMPLE_QUESTIONS.length);
                                    setHeroSelectedOption(null);
                                  }}
                                  className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Next Question</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Verified Rationale Card */}
                              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                                <p className="font-bold text-emerald-500 mb-1 flex items-center gap-1">
                                  <span>⚡ Verified Medical Rationale:</span>
                                </p>
                                <p className="text-slate-300 dark:text-slate-300">
                                  {curQ.options[heroSelectedOption]?.note || curQ.options.find(o => o.correct)?.note}
                                </p>
                                <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 text-[10px] text-amber-400/90 font-medium">
                                  <span className="font-bold uppercase tracking-wider">High-Yield Takeaway: </span>
                                  {curQ.highYieldFact}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Bottom Proof Ribbon — Authentic Stats */}
                <div className={`mt-10 sm:mt-12 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  {[
                    { label: "Curated MCQs", val: "12,500+", note: "Mapped to official blueprints" },
                    { label: "Past Board Papers", val: "50+ Sets", note: "IOM, KU, BPKIHS & NMCLE" },
                    { label: "Exam Simulations", val: "Realistic", note: "Timed with -0.25 penalty" },
                    { label: "Candidate Rating", val: "4.9 / 5", note: "Over 2,500+ active aspirants" }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-0.5 text-left">
                      <div className="text-xl sm:text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
                        {stat.val}
                      </div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {stat.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {stat.note}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* TARGET EXAMS GRID (PREVIEW) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Explore Target Competitive Exams
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Select an exam below to inspect syllabus weightages, subject marks, past papers, and specialized mock sets.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('exams'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-emerald-500 hover:text-emerald-400 font-bold text-sm inline-flex items-center gap-1"
                >
                  View all {targetExams.length} exams <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {targetExams.slice(0, 6).map(exam => {
                  const thumb = EXAM_THUMBNAILS[exam.id] || EXAM_THUMBNAILS["mec-pg"];
                  return (
                    <div
                      key={exam.id}
                      onClick={() => handleOpenExamDetail(exam.id)}
                      className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                        isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-sm'
                      }`}
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                        <img 
                          src={thumb} 
                          alt={exam.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        {/* High-contrast gradient overlay ensuring crystal clear text visibility in all themes */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                          {exam.category}
                        </span>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-lg font-extrabold text-white !text-white leading-snug drop-shadow-md">
                            {exam.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {cmsContent?.examDescriptions?.[exam.id] || "Comprehensive past papers, simulated full-length mocks, and subject-wise mastery sets."}
                        </p>
                        
                        <div className="pt-2 border-t flex items-center justify-between text-xs font-bold text-emerald-500">
                          <span>View Syllabus & Question Sets</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUESTION BANK QUICK PREVIEW */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Popular Question Banks & Mock Papers
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Practice full board mocks with countdown timers, negative marking, and instant AI explanations.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('question_banks'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-emerald-500 hover:text-emerald-400 font-bold text-sm inline-flex items-center gap-1"
                >
                  Explore all question sets <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {questionSetsPool.slice(0, 6).map((set, idx) => (
                  <div
                    key={`popular-set-${set.id || idx}`}
                    onClick={onSignUpClick}
                    className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between ${
                      isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40 text-slate-100' : 'bg-white border-slate-200 hover:border-emerald-500/40 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {set.examType ? set.examType.toUpperCase() : "MOCK SET"}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          <span>High Yield</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-base leading-snug group-hover:text-emerald-500 transition-colors">
                        {set.title}
                      </h4>

                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {set.description || "Simulated test with timer constraints and full in-depth answer rationales."}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t flex items-center justify-between">
                      <div className={`flex items-center gap-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {set.questions?.length || 100} Qs
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {set.durationMinutes || 60}m
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        Unlock <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ======================= STUDENT REVIEWS SECTION ======================= */}
            <div className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9/5 Rating from 2,500+ Nepalese Candidates</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Student Reviews & Success Stories
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Read how top rank holders and licensing candidates achieved their dream ranks with NepMed.
                </p>
              </div>

              {/* Horizontal sliding testimonial container */}
              <div className="relative max-w-2xl mx-auto px-4 sm:px-12 py-2">
                <div className="overflow-hidden relative min-h-[220px] sm:min-h-[180px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {(() => {
                      const item = testimonialsList[activeTestimonialIdx];
                      if (!item) return null;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={`w-full p-6 sm:p-8 rounded-2xl border space-y-4 relative transition-all duration-200 hover:shadow-lg ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-amber-400">
                              {[...Array((item as any).rating || 5)].map((_, rIdx) => (
                                <Star key={rIdx} className="w-4 h-4 fill-amber-400" />
                              ))}
                            </div>
                          </div>

                          <p className={`text-xs sm:text-sm leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            "{(item as any).review || (item as any).text}"
                          </p>
                          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800/60">
                            <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.name}
                            </div>
                            <div className="text-xs text-emerald-500 font-medium">
                              {item.roleOrExam}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* Left Arrow Button */}
                <button
                  onClick={() => {
                    setActiveTestimonialIdx((prev) => (prev === 0 ? testimonialsList.length - 1 : prev - 1));
                  }}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 p-2 rounded-full border transition-all ${
                    isDark 
                      ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-300' 
                      : 'bg-white/80 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                  }`}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Right Arrow Button */}
                <button
                  onClick={() => {
                    setActiveTestimonialIdx((prev) => (prev + 1) % testimonialsList.length);
                  }}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 p-2 rounded-full border transition-all ${
                    isDark 
                      ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-300' 
                      : 'bg-white/80 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                  }`}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Dots Pagination */}
              <div className="flex justify-center items-center gap-2 pt-2">
                {testimonialsList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestimonialIdx(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeTestimonialIdx 
                        ? 'w-6 bg-emerald-500' 
                        : `w-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-300 hover:bg-slate-400'}`
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* ======================= FOUNDER & LEADERSHIP TEAM SECTION ======================= */}
            <div className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Meet Our Founder & Technology Team
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Empowered by veteran clinicians, medical faculty, and cutting-edge software engineers.
                </p>
              </div>

              <div className="max-w-6xl mx-auto">
                <LeadershipCards isDark={isDark} />
              </div>
            </div>

            {/* ======================= FREQUENTLY ASKED QUESTIONS (FAQS) SECTION ======================= */}
            <div className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Frequently Asked Questions (FAQs)
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Everything you need to know about NepMed question banks, syllabi coverage, AI tutor features, and digital payment methods.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-3">
                {faqsList.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base focus:outline-none"
                      >
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>{faq.question}</span>
                        <ChevronDown className={`w-5 h-5 shrink-0 text-emerald-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t ${
                          isDark ? 'text-slate-300 border-slate-800/60 bg-slate-950/40' : 'text-slate-600 border-slate-100 bg-slate-50/50'
                        }`}>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 text-center space-y-6">
              <div className="max-w-2xl mx-auto space-y-3">
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Start Elevating Your Exam Rank Today
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  Join thousands of Nepalese students and professionals preparing for Medical, Engineering, Nursing, Licensing, and Loksewa examinations. Free initial access to sample papers and revision notes.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={onSignUpClick}
                  className="px-8 py-3.5 rounded-xl font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 text-base"
                >
                  Create Free Account
                </button>
                <button
                  onClick={onLoginClick}
                  className="px-6 py-3.5 rounded-xl font-semibold border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white text-base"
                >
                  Already registered? Log In
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB: EXAMS ======================= */}
        {activeTab === 'exams' && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                All Target Competitive & Licensing Exams
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Explore official exam syllabus breakdowns, subject-wise marks distribution, duration, pass criteria, and practice question sets across Medical, Engineering, Nursing, and Loksewa streams.
              </p>
            </div>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {targetExams.map(exam => {
                const thumb = EXAM_THUMBNAILS[exam.id] || EXAM_THUMBNAILS["mec-pg"];

                return (
                  <div
                    key={exam.id}
                    onClick={() => handleOpenExamDetail(exam.id)}
                    className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                      isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-sm'
                    }`}
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img 
                        src={thumb} 
                        alt={exam.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      {/* High-contrast gradient overlay ensuring crystal clear text visibility in all themes */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                        {exam.category}
                      </span>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-extrabold text-white !text-white leading-snug drop-shadow-md">
                          {exam.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {exam.description || "Complete syllabus curriculum, high-yield practice modules, and standard board past question papers."}
                      </p>

                      <div className="pt-2 border-t flex items-center justify-between text-xs font-bold text-emerald-500">
                        <span>View Syllabus & Question Bank</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: EXAM DETAIL ======================= */}
        {activeTab === 'exam_detail' && (
          <div className="space-y-8">
            
            {/* Back Button */}
            <button
              onClick={() => setActiveTab('exams')}
              className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to all exams</span>
            </button>

            {/* Exam Hero Banner */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="relative h-64 sm:h-72 w-full bg-slate-900">
                <img 
                  src={EXAM_THUMBNAILS[selectedExamMeta.id] || EXAM_THUMBNAILS["mec-pg"]} 
                  alt={selectedExamMeta.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20" />
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                    {selectedExamMeta.category}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white !text-white leading-snug drop-shadow-md">
                    {selectedExamConfig?.name || selectedExamMeta.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-100 !text-slate-100 max-w-3xl leading-relaxed drop-shadow font-medium">
                    {cmsContent?.examDescriptions?.[selectedExamMeta.id] || selectedExamConfig?.description || "Official syllabus blueprint, marks distribution weightages, and practice questions."}
                  </p>
                </div>
              </div>
              
              {/* Clean minimal description box */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-sm leading-relaxed opacity-80">
                  {selectedExamMeta.description || "Comprehensive syllabus, curriculum, and exam specifications."}
                </p>
              </div>
            </div>

            {/* Syllabus Section */}
            {(() => {
              const examSubjects = (dbSubjects || []).filter(s => String(s.exam_id) === String(selectedExamMeta.id));
              if (examSubjects.length === 0) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight border-l-4 border-emerald-500 pl-3.5 md:pl-4 py-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Official Syllabus & Subject Weightages
                      </h3>
                      <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Distribution of marks according to the {selectedExamMeta.name} curriculum.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examSubjects.map(sub => (
                      <div key={sub.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all hover:border-emerald-500/50 hover:shadow-md ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <BookOpen className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{sub.name}</h4>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{sub.description || "Core subject module"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black text-emerald-500`}>{sub.weight}</span>
                          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Marks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Targeted Question Sets for this exam */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight border-l-4 border-emerald-500 pl-3.5 md:pl-4 py-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Practice Question Sets for {selectedExamConfig?.name || selectedExamMeta.name}
                  </h3>
                  <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Practice past board papers and custom high-yield question sets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(() => {
                  const matchingSets = questionSetsPool.filter(
                    set => {
                      const setExamType = String(set.examType || "").toLowerCase();
                      const targetId = String(selectedExamMeta.id).toLowerCase();
                      const targetSlug = String(selectedExamMeta.slug || "").toLowerCase();
                      
                      return setExamType === targetId || 
                             setExamType === targetSlug ||
                             setExamType.includes(targetId) ||
                             setExamType.includes(targetSlug) ||
                             (targetSlug === 'mec-ug' && set.id.toLowerCase().startsWith('mec-ug')) || 
                             (targetSlug === 'mec-pg' && set.id.toLowerCase().startsWith('mec-pg'));
                    }
                  );

                  if (matchingSets.length === 0) {
                    return (
                      <div className={`col-span-full py-12 text-center rounded-3xl p-8 space-y-3 border ${
                        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-4xl block">📚</span>
                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Practice Sets</h4>
                        <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Our clinical editorial board is currently preparing premium past papers and curriculum-aligned practice mocks for {selectedExamConfig?.name || selectedExamMeta.name}. Stay tuned!
                        </p>
                      </div>
                    );
                  }

                  return matchingSets.map((set, idx) => (
                    <div
                      key={`exam-detail-set-${set.id || idx}`}
                      onClick={onSignUpClick}
                      className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-slate-100' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-900 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {set.examType ? set.examType.toUpperCase() : "GENERAL MOCK"}
                          </span>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {set.questions?.length || 100} MCQs
                          </span>
                        </div>

                        <h4 className="font-bold text-base leading-snug group-hover:text-emerald-500 transition-colors">
                          {set.title}
                        </h4>

                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {set.description || "Timed examination module with full answer rationales."}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t flex items-center justify-between">
                        <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {set.durationMinutes || 60} mins
                        </span>

                        <button
                          onClick={(e) => { e.stopPropagation(); onSignUpClick(); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1" 
                              ? "bg-teal-500 text-white hover:bg-teal-400" 
                              : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          } flex items-center gap-1 shadow`}
                        >
                          {set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1" ? <Play className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1" ? "Try Free" : "Unlock Mock"}</span>
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB: QUESTION BANKS ======================= */}
        {activeTab === 'question_banks' && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Comprehensive Question Bank Arena
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Explore mock exams, previous year question papers, and custom practice sets across Medical, Engineering, Nursing, Licensing, and Loksewa.
              </p>
            </div>

            {/* Filter & Search Toolbar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  placeholder="Search question set title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Target Exam Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className={`text-xs font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Target Exam:</span>
                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  className={`flex-1 sm:w-60 px-3 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="all">All Exams ({questionSetsPool.length} sets)</option>
                  {targetExams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Sets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSets.map((set, idx) => (
                <div
                  key={`qb-grid-set-${set.id}-${idx}`}
                  onClick={onSignUpClick}
                  className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-slate-100' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {set.examType ? set.examType.toUpperCase() : "GENERAL MOCK"}
                      </span>
                      <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ID: {set.id}
                      </span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg leading-snug group-hover:text-emerald-500 transition-colors">
                      {set.title}
                    </h3>

                    <p className={`text-xs line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {set.description || "Comprehensive timed mock set with real exam difficulty, negative marking, and detailed answer explanations."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t flex items-center justify-between">
                    <div className={`flex items-center gap-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {set.questions?.length || 100} MCQs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {set.durationMinutes || 60}m
                      </span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onSignUpClick(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1"
                          ? "bg-teal-500 text-white hover:bg-teal-400"
                          : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      } flex items-center gap-1 shadow`}
                    >
                      {set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1" ? <Play className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{set.isFree === true || (set as any).is_free === true || (set as any).is_free === 1 || (set as any).is_free === "1" ? "Try Free" : "Unlock Set"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSets.length === 0 && (
              <div className={`text-center py-16 rounded-3xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Question Sets Match Your Filter</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Try clearing your search term or selecting "All Exams".</p>
                <button
                  onClick={() => { setFilterExam('all'); setSearchQuery(''); }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950"
                >
                  Reset Filters
                </button>
              </div>
            )}

          </div>
        )}

        {/* ======================= TAB: FEATURES ======================= */}
        {activeTab === 'features' && (
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {cmsContent?.featuresTitle || "Engineered for Competitive Exam Mastery"}
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {cmsContent?.featuresSubtitle || "Everything you need to turn high-yield syllabus knowledge into rapid multiple-choice precision across Medical, Engineering, Nursing, and Loksewa streams."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cmsContent?.featuresList || [
                {
                  title: "Real Board & Entrance Simulator",
                  desc: "Custom countdown timers, official negative marking, and section-by-section breakdown matching official MEC, IOE, NMCLE, and Loksewa patterns.",
                  iconName: "clock",
                  badge: "Simulation"
                },
                {
                  title: "Smart AI Explanations & Tutor",
                  desc: "Instantly ask our AI Tutor for option rationales, high-yield clinical & engineering pearls, mnemonic generators, and key formulas.",
                  iconName: "brain",
                  badge: "AI Powered"
                },
                {
                  title: "High-Yield Curriculum Notes",
                  desc: "Structured, hierarchical textbook notes covering entire syllabus subjects with flowcharts, comparative tables, and core concepts.",
                  iconName: "book",
                  badge: "Curriculum"
                },
                {
                  title: "Flashcards & Spaced Repetition",
                  desc: "Convert tricky questions and key formulas into flashcards with one click. Master difficult memory-heavy facts easily.",
                  iconName: "zap",
                  badge: "Revision"
                },
                {
                  title: "Deep Percentile & Weakness Analytics",
                  desc: "Identify your lowest scoring subjects and topics automatically. Track your speed per question and historical test improvement trajectories.",
                  iconName: "chart",
                  badge: "Analytics"
                },
                {
                  title: "Discussion Forum & Verified Mentors",
                  desc: "Discuss disputed questions with peers and verified faculty. Read expert consensus and verified solutions under every question.",
                  iconName: "users",
                  badge: "Community"
                }
              ]).map((feat: any, idx: number) => {
                let Icon = Clock;
                if (feat.iconName === 'brain') Icon = BrainCircuit;
                if (feat.iconName === 'book') Icon = BookOpen;
                if (feat.iconName === 'zap') Icon = Zap;
                if (feat.iconName === 'chart') Icon = BarChart3;
                if (feat.iconName === 'users') Icon = Users;

                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg leading-snug">
                        {feat.title}
                      </h3>

                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={onSignUpClick}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                      >
                        Try with free account <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: PRICING ======================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Simple, Transparent Subscription Plans
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Invest in your academic & professional career. Unlock unlimited mock papers, AI tutors, and complete high-yield notes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {(dbPackages && dbPackages.length > 0 ? dbPackages.map(p => ({
                id: p.id,
                title: p.name || p.title,
                priceNpr: p.price,
                billingPeriod: p.duration ? `${p.duration} Days` : (p.days ? `${p.days} Days` : "Lifetime"),
                features: Array.isArray(p.descriptions) ? p.descriptions : (p.description ? [p.description] : ["All premium features included"]),
                highlighted: p.is_popular === true || p.is_popular === "1" || p.is_popular === 1 || p.isPopular === true || p.isPopular === "1" || p.isPopular === 1,
                badge: p.tag || (p.is_popular === true || p.is_popular === "1" || p.is_popular === 1 || p.isPopular === true || p.isPopular === "1" || p.isPopular === 1 ? "Most Popular" : undefined)
              })) : [
                // {
                //   id: "free-tier",
                //   title: "Free Starter",
                //   priceNpr: 0,
                //   billingPeriod: "Forever",
                //   features: [
                //     "Access to Sample Question Papers",
                //     "Subject-wise mini practice tests",
                //     "Basic performance analytics",
                //     "Community discussion forum"
                //   ],
                //   highlighted: false,
                //   badge: undefined
                // },
                // {
                //   id: "pro-6m",
                //   title: "6-Month Exam Pro",
                //   priceNpr: 2999,
                //   billingPeriod: "6 Months",
                //   features: [
                //     "Unlimited MECEE, IOE, NMCLE & Loksewa Mocks",
                //     "Full High-Yield Notes & Formula Library",
                //     "Instant AI Tutor & Step-by-Step Rationales",
                //     "Spaced repetition flashcards",
                //     "Complete past papers with verified keys",
                //     "Priority mentor doubt resolution"
                //   ],
                //   highlighted: true,
                //   badge: "Most Popular"
                // },
                // {
                //   id: "pro-1y",
                //   title: "1-Year Complete Master",
                //   priceNpr: 4499,
                //   billingPeriod: "12 Months",
                //   features: [
                //     "All features in 6-Month Pro",
                //     "Full access to all Target Exam categories",
                //     "Offline download & export support",
                //     "Exclusive high-yield PDF summaries",
                //     "One-on-one rank guidance"
                //   ],
                //   highlighted: false,
                //   badge: undefined
                // }
              ]).map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className={`rounded-3xl p-6 sm:p-8 border flex flex-col justify-between relative transition-all duration-300 ${
                    plan.highlighted
                      ? isDark 
                        ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/60 shadow-2xl ring-2 ring-emerald-500/30'
                        : 'bg-white border-emerald-500 shadow-2xl ring-2 ring-emerald-500/30'
                      : isDark
                        ? 'bg-slate-900/70 border-slate-800 text-slate-100'
                        : 'bg-white border-slate-200 text-slate-900 shadow-md'
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                      {plan.badge || "Most Popular"}
                    </span>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.title}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-emerald-500">
                          {plan.priceNpr === 0 ? "Free" : `Rs. ${plan.priceNpr.toLocaleString()}`}
                        </span>
                        {plan.priceNpr > 0 && (
                          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            / {plan.billingPeriod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>What's included:</div>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={onSignUpClick}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-500/20'
                          : isDark
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      {plan.priceNpr === 0 ? "Get Started Free" : "Subscribe Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB: REFER & REWARD ======================= */}
        {activeTab === 'refer' && (
          <div className="space-y-12">
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Gift className="w-3.5 h-3.5" />
                <span>Referral Loyalty Scheme & Rewards</span>
              </div>
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {cmsContent?.referEarnConfig?.title || "Refer Friends, Earn Reward Points!"}
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {cmsContent?.referEarnConfig?.subtitle || "Invite fellow medical, engineering, nursing, and licensing candidates to NepMed. Get rewarded instantly upon registration and subscription purchase."}
              </p>
              
              {/* Point Highlights Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +{cmsContent?.referEarnConfig?.pointsPerReg ?? 10} Pts (Friend Signup)
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  +{cmsContent?.referEarnConfig?.pointsPerSub ?? 150} Pts (Pro Upgrade)
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  +{cmsContent?.referEarnConfig?.referredPointsPerReg ?? 5} Pts (Friend Bonus)
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  +1 Pt / Approved Creator MCQ
                </span>
              </div>
            </div>

            {/* How It Works Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Get Your Unique Link & Code",
                  desc: "Create an account or log in to generate your personalized referral code (e.g. NEP-XXXX-1234).",
                  icon: ExternalLink
                },
                {
                  step: "02",
                  title: "Share With Batchmates",
                  desc: `Share via WhatsApp, Telegram study groups, Facebook, or your college batchmates. They receive +${cmsContent?.referEarnConfig?.referredPointsPerReg ?? 5} welcome bonus points upon signing up.`,
                  icon: Users
                },
                {
                  step: "03",
                  title: "Unlock Rewards & Free Passes",
                  desc: `Earn +${cmsContent?.referEarnConfig?.pointsPerReg ?? 10} points on registration and +${cmsContent?.referEarnConfig?.pointsPerSub ?? 150} points when they upgrade. Redeem points for free Unlimited Pro Passes!`,
                  icon: Award
                }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl border relative flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="text-3xl font-black text-emerald-500/30 mb-3">{step.step}</div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Referral Rules and Sample Invite */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rules */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Referral Rules & Points Allocation</span>
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {(cmsContent?.referEarnConfig?.rules || [
                    "Share your unique custom referral link or code with friends.",
                    "Get 10 points for yourself and 5 points for your friend as soon as they register their verified account.",
                    "Get 150 premium points for yourself and 50 points for your friend if they upgrade to any of the unlimited board preparation packages.",
                    "Earn 1 point per verified authentic MCQ submitted via the Student Editorial Board Creator Hub.",
                    "Redeem accumulated points directly to unlock individual premium exam sets or extend your current pass!"
                  ]).map((rule: string, rIdx: number) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Promo Message */}
              <div className={`p-6 rounded-3xl border space-y-4 flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-teal-400" />
                    <span>Sample Invite Message</span>
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Copy and send this directly to your WhatsApp or Telegram study groups:
                  </p>
                  <div className={`p-3.5 rounded-2xl text-xs font-mono mt-3 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {cmsContent?.referEarnConfig?.promoMessage || "Hey! Check out NepMed, Nepal's best app for Medical Entrance and Licensing MCQs. Use my code to register and get bonus access!"}
                  </div>
                </div>
                <button
                  onClick={onSignUpClick}
                  className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs shadow-md transition-all"
                >
                  Create Account to Get Your Code
                </button>
              </div>
            </div>

            {/* Reward Passes Redemption Table */}
            <div className={`max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div>
                <h3 className="text-xl font-bold">Redeem Points for Free Pro Passes</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Convert your accumulated referral balance into full unlimited preparation passes with zero out-of-pocket cost.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {(cmsContent?.referEarnConfig?.rewards || [
                  { cost: 599, days: 7, title: "7 Days Premium Booster", badge: "Blitz" },
                  { cost: 799, days: 15, title: "15 Days Unlimited Pass", badge: "Rapid" },
                  { cost: 1499, days: 30, title: "30 Days Comprehensive Pass", badge: "Mastery Crown" },
                  { cost: 2999, days: 90, title: "90 Days Unlimited", badge: "Quarterly" },
                  { cost: 5999, days: 180, title: "180 Days Comprehensive Pass", badge: "Full Prep" }
                ]).map((tier: any, idx: number) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-2 text-center flex flex-col justify-between ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {tier.badge}
                      </span>
                      <div className={`font-extrabold text-sm mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tier.days} Days</div>
                      <div className={`text-[11px] font-semibold line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{tier.title}</div>
                    </div>
                    <div className="text-xs text-emerald-500 font-extrabold pt-2 border-t border-slate-800/40">
                      {tier.cost} Points
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={onSignUpClick}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  Join NepMed to Start Referring
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: ABOUT US ======================= */}
        {activeTab === 'about' && (
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                About {cmsContent?.brandName || "NepMed"}
              </h2>
              <div className={`text-sm sm:text-base space-y-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {(cmsContent?.aboutUsLabels?.heroDescription || `NepMed is a premier online learning and examination preparation platform dedicated to helping students and professionals achieve success in competitive entrance, licensing, postgraduate, and public service examinations. Built with a vision to make quality exam preparation accessible, affordable, and effective, NepMed brings together expert-curated content, high-yield question banks, mock tests, performance analytics, and structured learning resources in a single digital platform.
                Our platform serves a diverse range of aspirants preparing for Medical Entrance, Medical and Dental Postgraduate Entrance (MD/MS/MDS), Nursing Entrance and Licensing Examinations, Engineering Entrance Examinations, Loksewa Competitive Examinations, and various professional licensing assessments. Every course and question bank is designed to reflect the latest examination patterns, helping learners focus on concepts that matter most.
                At NepMed, we believe that success comes from smart preparation rather than endless studying. Our team of experienced educators, clinicians, subject experts, and technology professionals continuously work to develop evidence-based learning materials, detailed explanations, exam-focused notes, and realistic mock examinations that simulate actual test environments.
                Through innovative technology, personalized learning insights, and a commitment to academic excellence, NepMed empowers learners to identify their strengths, address weaknesses, and maximize their performance. Whether you are preparing for your first entrance examination, pursuing postgraduate specialization, obtaining professional licensure, or competing for a Loksewa position, NepMed is your trusted partner throughout the journey.`).split('\n').filter(p => p.trim()).map((para, idx) => (
                  <p key={idx} className="text-center">{para.trim()}</p>
                ))}
              </div>
            </div>

            {/* Core Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className={`p-6 rounded-3xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                <h3 className="font-bold text-lg">Official Blueprints</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Every mock exam follows the official Medical Education Commission (MEC), IOE Engineering, and Nepal Medical Council (NMC) syllabus.
                </p>
              </div>

              <div className={`p-6 rounded-3xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
                <Award className="w-8 h-8 text-teal-500 mb-2" />
                <h3 className="font-bold text-lg">Verified Faculty & Mentors</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Curated and audited by top rank holders, senior medical officers, and specialist educators across major Nepalese institutes.
                </p>
              </div>

              <div className={`p-6 rounded-3xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
                <BrainCircuit className="w-8 h-8 text-cyan-500 mb-2" />
                <h3 className="font-bold text-lg">Next-Gen AI Learning</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Instant rationale breakdown, key formula insights, comparative tables, and custom mnemonic generation.
                </p>
              </div>
            </div>

            {/* Core Leadership & Editorial Board */}
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Core Leadership & Editorial Board</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Distinguished clinicians, subject experts, and technology leaders guiding the platform.</p>
              </div>
              <LeadershipCards 
                editorialTeam={dbTeams && dbTeams.filter(t => t.type === 'core').length > 0 ? dbTeams.filter(t => t.type === 'core' && t.status !== 'inactive').map(t => ({...t, role: t.designation || t.role, avatar: t.image || t.avatarUrl, institution: t.hospital || t.institution})) : cmsContent?.editorialTeam} 
                isDark={isDark} 
              />
            </div>

            {/* Section Editors Across All Target Exams */}
            {((dbTeams && dbTeams.filter(t => t.type === 'chief_editor').length > 0) || true) && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chief Academic Editors</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Leading the medical curriculum accuracy and relevance.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {((dbTeams && dbTeams.filter(t => t.type === 'chief_editor').length > 0)
                    ? dbTeams.filter(t => t.type === 'chief_editor' && t.status !== 'inactive').map(t => ({...t, editorName: t.name, role: t.designation || t.role, avatar: t.image || t.avatarUrl, institution: t.hospital || t.institution}))
                    : [
                        { examName: "MECEE-PG (MD/MS)", editorName: "Dr. Sunil Subedi", role: "Section Editor, Senior Medical Officer", institution: "Medical Academic Board" },
                        { examName: "MECEE-BL (UG Entrance)", editorName: "Dr. Sunil Subedi", role: "Section Editor, ECFMG Certified Physician", institution: "Kathmandu Valley Medical Mentors" },
                        { examName: "NMCLE (Medical Licensing)", editorName: "Dr. Sunil Subedi", role: "Section Editor, MCQ Specialist", institution: "National Licensing Review Cell" },
                        { examName: "IOE Engineering Entrance", editorName: "Manish Acharya", role: "Section Editor & IT Expert", institution: "Pulchowk Engineering Alum / Tech Faculty" },
                        { examName: "Loksewa Medical Officer (8th Level)", editorName: "Dr. Sunil Subedi", role: "Section Editor, Senior Medical Officer", institution: "Public Health Service Board" },
                        { examName: "MECEE-PG MDS Dental", editorName: "Dr. Suman Subedi", role: "Section Editor, Consultant Orthopedics", institution: "Dental & Orthopedic Review Board" },
                        { examName: "NLEN BSc Nursing", editorName: "Sister Sushmita Rai", role: "Section Editor, Nursing Division", institution: "Nursing Education Division, IOM" },
                        { examName: "NLEN PCL Nursing", editorName: "Sister Pratima Thapa", role: "Section Editor, Senior Nursing Reviewer", institution: "PAHS / Nursing Licensing Board" }
                      ]
                  ).map((ce, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            {ce.examName || "Medical Exams"}
                          </span>
                        </div>
                        <div className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{ce.name || ce.editorName}</div>
                        <div className="text-[11px] text-teal-500 font-semibold mt-0.5">{ce.role}</div>
                      </div>
                      {(ce.hospital || ce.institution) && (
                        <div className={`text-[10px] mt-2 pt-2 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>{ce.hospital || ce.institution}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Thanks & Academic Contributors */}
            {((dbTeams && dbTeams.filter(t => t.type === 'special_thanks').length > 0) || true) && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Special Thanks & Senior Advisors</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Acknowledging the immense contributions of our mentors.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {((dbTeams && dbTeams.filter(t => t.type === 'special_thanks').length > 0)
                    ? dbTeams.filter(t => t.type === 'special_thanks' && t.status !== 'inactive').map(t => ({...t, roleOrAffiliation: t.designation || t.role, note: t.description || t.note}))
                    : [
                        { name: "Dr. Sandesh Devkota", roleOrAffiliation: "MBBS(UCMS)", note: "For clinical syllabus mapping, case simulation reviews, and question bank verification." },
                        { name: "Dr. Manish Bhandari", roleOrAffiliation: "MBBS(COMS)", note: "For high-yield clinical pearls, differential diagnosis tables, and explanation reviews." },
                        { name: "Dr. Sonu Adhikari", roleOrAffiliation: "MBBS(CMC)", note: "For diagnostic algorithms, medical question bank audits, and exam module curation." },
                        { name: "Dr. Subash Subedi", roleOrAffiliation: "MBBS(CMC)", note: "For clinical pharmacology rationales and system-wise high-yield revisions." },
                        { name: "Binit Lamsal", roleOrAffiliation: "Technical Contributor", note: "For platform performance optimization, simulation engine architecture, and user workflows." },
                        { name: "Roshan Adhikari", roleOrAffiliation: "Content Contributor", note: "For comprehensive curriculum structuring and study resource development." },
                        { name: "Aayush Ghimire", roleOrAffiliation: "Content Contributor", note: "For question bank verification, exam analytics review, and academic coordination." }
                      ]
                  ).map((st, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    >
                      <div>
                        <h4 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{st.name}</h4>
                        <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">{st.role || st.roleOrAffiliation}</p>
                      </div>
                      {(st.hospital || st.note) && (
                        <p className={`text-[11px] p-2.5 rounded-xl border leading-relaxed ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {st.hospital || st.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Support info */}
            <div className={`max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border text-center space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <h3 className="text-xl font-bold">{cmsContent?.contactTitle || "Have Questions or Need Guidance?"}</h3>
              <p className={`text-xs sm:text-sm max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {cmsContent?.contactDescription || "Our academic team is available to assist you with subscription queries, question discussions, or institutional packages."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-bold">
                <span className={`px-3.5 py-2 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
                  {cmsContent?.emailTitle || "Email"}: {cmsContent?.supportConfig?.emailText || cmsContent?.supportConfig?.EmailText || cmsContent?.emailText || "support@nepmed.com.np"}
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {cmsContent?.phoneTitle || "WhatsApp / Viber"}: {cmsContent?.supportConfig?.phoneText || cmsContent?.supportConfig?.PhoneText || cmsContent?.phoneText || "+977-9860392540"}
                </span>
                <span className={`px-3.5 py-2 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
                  {cmsContent?.supportConfig?.officeText || cmsContent?.supportConfig?.OfficeText || cmsContent?.officeText || "Kathmandu, Nepal"}
                </span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* 3. FOOTER */}
      <footer className={`border-t py-12 px-4 sm:px-6 lg:px-8 mt-20 transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Stethoscope className="w-4.5 h-4.5 text-slate-900" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                <span className={isDark ? "text-white" : "text-slate-900"}>Nep</span>
                <span className="text-emerald-500">Med</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              Nepal's leading competitive exam simulation platform for Medical, Engineering (IOE), Nursing (NLEN), Licensing (NMCLE), and Loksewa examinations.
            </p>
          </div>

          <div>
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Medical & PG Exams</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleOpenExamDetail("mec-pg")} className="hover:text-emerald-500 text-left transition-colors">MECEE-PG MD/MS</button></li>
              <li><button onClick={() => handleOpenExamDetail("mec-ug")} className="hover:text-emerald-500 text-left transition-colors">MECEE-BL (MBBS / BDS Entrance)</button></li>
              <li><button onClick={() => handleOpenExamDetail("mec-mds")} className="hover:text-emerald-500 text-left transition-colors">MECEE-PG-MDS</button></li>
              <li><button onClick={() => handleOpenExamDetail("mec-mph")} className="hover:text-emerald-500 text-left transition-colors">MECEE-MPH/MSPH</button></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Licensing & Nursing</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleOpenExamDetail("nmcle")} className="hover:text-emerald-500 text-left transition-colors">NMCLE (Medical Officer Licensing)</button></li>
              <li><button onClick={() => handleOpenExamDetail("nmcle-bds")} className="hover:text-emerald-500 text-left transition-colors">NMCLE BDS (Dental Licensing)</button></li>
              <li><button onClick={() => handleOpenExamDetail("nlen-bsc")} className="hover:text-emerald-500 text-left transition-colors">NLEN BSc Nursing Licensing</button></li>
              <li><button onClick={() => handleOpenExamDetail("nlen-pcl")} className="hover:text-emerald-500 text-left transition-colors">NLEN PCL Nursing Licensing</button></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Loksewa & Engineering</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleOpenExamDetail("loksewa")} className="hover:text-emerald-500 text-left transition-colors">Loksewa Medical Officer (8th Level)</button></li>
              <li><button onClick={() => handleOpenExamDetail("loksewa-staff-nurse")} className="hover:text-emerald-500 text-left transition-colors">Loksewa Staff Nurse (5th Level)</button></li>
              <li><button onClick={() => handleOpenExamDetail("loksewa-nursing-officer")} className="hover:text-emerald-500 text-left transition-colors">Loksewa Nursing Officer (B.Sc. Nursing)</button></li>
              <li><button onClick={() => handleOpenExamDetail("loksewa-pho")} className="hover:text-emerald-500 text-left transition-colors">Loksewa Public Health Officer</button></li>
              <li><button onClick={() => handleOpenExamDetail("ioe")} className="hover:text-emerald-500 text-left transition-colors">IOE Engineering Entrance (Pulchowk)</button></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Candidate Portal</h4>
            <div className="space-y-2">
              <button
                onClick={onLoginClick}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-sm'
                }`}
              >
                Candidate Log In
              </button>
              <button
                onClick={onSignUpClick}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Create Free Account
              </button>
            </div>
          </div>

        </div>

        <div className={`max-w-7xl mx-auto pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'border-slate-800/80' : 'border-slate-300'
        }`}>
          <div>
            © {new Date().getFullYear()} {cmsContent?.brandName || "NepMed"}. All rights reserved.
          </div>
          <div className="flex gap-4 font-medium">
            <span 
              onClick={() => setShowPrivacyModal(true)} 
              className="hover:text-emerald-500 cursor-pointer transition-colors"
            >
              Privacy Policy
            </span>
            <span 
              onClick={() => setShowTermsModal(true)} 
              className="hover:text-emerald-500 cursor-pointer transition-colors"
            >
              Terms of Service
            </span>
          </div>
        </div>
      </footer>

      {/* ---------------- TERMS & CONDITIONS MODAL ---------------- */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-slate-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Terms and Conditions</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs font-sans leading-relaxed">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Last updated: July 2026</p>
              
              <h4 className="text-white font-bold font-sans">1. Acceptance of Terms</h4>
              <p>
                By creating an account or accessing the NepMed Study Smart, you explicitly agree to bind yourself legally to these Terms and Conditions. These terms govern all uses of NepMed services, mock examinations, past papers, and AI-powered medical tutoring elements.
              </p>

              <h4 className="text-white font-bold font-sans">2. Educational Purposes and Disclaimers</h4>
              <p>
                NepMed is strictly an educational support system designed to help medical students and professionals prepare for board examinations (MECEE-BL, MECEE-PG, NMCLE, and Loksewa). All study explanations, MNEMONICS, and AI concepts are optimized for high-yield recall, but DO NOT constitute official medical diagnoses, clinical guidelines, or standard treatment advice.
              </p>

              <h4 className="text-white font-bold font-sans">3. Account Integrity & Verification</h4>
              <p>
                To maintain licensing integrity, users must register using a legitimate email address. Verification via a secure One-Time Password (OTP) is mandatory to activate account privileges and protect exam attempt metrics.
              </p>

              <h4 className="text-white font-bold font-sans">4. Intellectual Property & Fair Use</h4>
              <p>
                All original exam-style questions, Mnemonics, AI breakdown templates, and design configurations are property of NepMed. Sharing premium unlocked sets or duplicating content outside of personal study use is strictly forbidden.
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PRIVACY POLICY MODAL ---------------- */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-slate-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Privacy Policy</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs font-sans leading-relaxed">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Last updated: July 2026</p>
              
              <h4 className="text-white font-bold font-sans">1. Information We Collect</h4>
              <p>
                When registering on NepMed, we securely store your email address, full name, age, gender/sex, and preferred board exam targets. This data is explicitly used to personalize study recommendations, generate practice reports, and calculate leaderboard standouts.
              </p>

              <h4 className="text-white font-bold font-sans">2. Exam Tracking & Analytics</h4>
              <p>
                We store your study attempts, active exam answers, timing statistics, and bookmark selections in server logs and browser cookies. This allows you to retain historical report summaries, view wrong-answer lists, and track progress over time without losing progress.
              </p>

              <h4 className="text-white font-bold font-sans">3. Security and OTP Verification</h4>
              <p>
                Your security is paramount. We protect account registrations by triggering a secure OTP (One-Time Password) code to ensure email authenticity and protect from unauthorized credential use.
              </p>

              <h4 className="text-white font-bold font-sans">4. Cookies Notice</h4>
              <p>
                We use browser-based local storage and persistent cookies to record visual configuration states (such as active light/dark theme preference) and maintain safe log-in sessions. By registering, you explicitly accept this cookie storage design.
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Accept Policy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
