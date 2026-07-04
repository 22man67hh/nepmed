/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Clock, 
  Tag, 
  HelpCircle, 
  CheckCircle, 
  UploadCloud,
  ArrowRight,
  Sparkles,
  Info,
  ChevronLeft,
  X,
  FileText,
  Flag,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit3,
  Maximize2,
  Minimize2,
  AlertCircle,
  Download
} from "lucide-react";
import { QuestionSet, Question } from "../types";
import { ALL_STANDARD_SUBJECTS, MEC_UG_CLASSIFICATION, generateQuestionIdForSubject, retagAllQuestions } from "../subjectsData";
import RichTextEditor from "./RichTextEditor";
import { CmsControlPanel } from "./CmsControlPanel";

interface AdminPanelProps {
  allSets: QuestionSet[];
  onSaveSets: (sets: QuestionSet[]) => void;
  independentQuestions?: Question[];
  onSaveIndependentQuestions?: (questions: Question[]) => void;
  userDraftQuestions?: Question[];
  onSaveUserDraftQuestions?: (questions: Question[]) => void;
  targetExam?: string;
  cmsContent?: any;
  onSaveCMSContent?: (newContent: any) => Promise<boolean>;
}

// Global Helper to parse CSV
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: string[] = [];
    let insideQuote = false;
    let entry = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());

    // Skip header row if it contains keywords
    if (i === 0 && row.some(col => {
      const lower = col.toLowerCase();
      return lower.includes("question") || lower.includes("explanation") || lower.includes("option") || lower.includes("correct");
    })) {
      continue;
    }

    result.push(row);
  }
  return result;
}

const extractQuestionsFromCSV = (text: string): Question[] => {
  const rows = parseCSV(text);
  return rows.map((row, index) => {
    const isTenColumn = row.length >= 9;
    
    const id = isTenColumn ? (row[0] || "").trim() : `parsed-q-${Date.now()}-${index}`;
    const questionText = isTenColumn ? (row[1] || "") : (row[0] || `MCQ Question ${index + 1}`);
    const optA = isTenColumn ? (row[2] || "") : (row[1] || "");
    const optB = isTenColumn ? (row[3] || "") : (row[2] || "");
    const optC = isTenColumn ? (row[4] || "") : (row[3] || "");
    const optD = isTenColumn ? (row[5] || "") : (row[4] || "");
    
    const correctStr = (isTenColumn ? (row[6] || "0") : (row[5] || "0")).trim().toLowerCase();
    let correctOptionIndex = 0;
    if (correctStr === "a" || correctStr === "0" || correctStr.includes("option a") || correctStr.includes("option 1")) {
      correctOptionIndex = 0;
    } else if (correctStr === "b" || correctStr === "1" || correctStr.includes("option b") || correctStr.includes("option 2")) {
      correctOptionIndex = 1;
    } else if (correctStr === "c" || correctStr === "2" || correctStr.includes("option c") || correctStr.includes("option 3")) {
      correctOptionIndex = 2;
    } else if (correctStr === "d" || correctStr === "3" || correctStr.includes("option d") || correctStr.includes("option 4")) {
      correctOptionIndex = 3;
    } else {
      const num = parseInt(correctStr);
      if (!isNaN(num) && num >= 0 && num < 4) {
        correctOptionIndex = num;
      }
    }

    const explanation = isTenColumn ? (row[7] || "No explanation provided.") : (row[6] || "No explanation provided.");
    const subject = isTenColumn ? (row[8] ? row[8].trim() : "") : (row[7] ? row[7].trim() : "");
    const topic = isTenColumn ? (row[9] ? row[9].trim() : "") : (row[8] ? row[8].trim() : "");

    return {
      id: id || `parsed-q-${Date.now()}-${index}`,
      questionText,
      options: [optA, optB, optC, optD],
      correctOptionIndex,
      explanation,
      subject,
      topic
    };
  });
};

function serializeQuestionsToCSV(questions: Question[]): string {
  const escapeCSVField = (val: string) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = ["ID", "Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Option Index (0-3)", "Explanation", "Subject", "Topic"];
  const rows = [header.join(",")];

  questions.forEach(q => {
    const row = [
      escapeCSVField(q.id),
      escapeCSVField(q.questionText),
      escapeCSVField(q.options[0] || ""),
      escapeCSVField(q.options[1] || ""),
      escapeCSVField(q.options[2] || ""),
      escapeCSVField(q.options[3] || ""),
      escapeCSVField(q.correctOptionIndex.toString()),
      escapeCSVField(q.explanation || ""),
      escapeCSVField(q.subject || ""),
      escapeCSVField(q.topic || "")
    ];
    rows.push(row.join(","));
  });

  return rows.join("\n");
}

function parseCSVToQuestions(csvText: string, defaultSubject: string, defaultTopic: string, targetExamType: string, existingPool: Question[]): Question[] {
  const parsedQuestions: Question[] = [];
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  let startIndex = 0;
  if (rows.length > 0) {
    const firstRowJoined = rows[0].join(" ").toLowerCase();
    if (firstRowJoined.includes("question") || firstRowJoined.includes("explanation") || firstRowJoined.includes("option") || firstRowJoined.includes("correct") || firstRowJoined.includes("id")) {
      startIndex = 1;
    }
  }

  let tempIndependent = [...existingPool];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;
    
    let id = row[0] ? row[0].trim() : "";
    const questionText = row[1] || "";
    if (!questionText.trim()) continue;
    
    const optA = row[2] || "";
    const optB = row[3] || "";
    const optC = row[4] || "";
    const optD = row[5] || "";
    
    const correctStr = (row[6] || "0").trim().toLowerCase();
    let correctOptionIndex = 0;
    if (correctStr === "a" || correctStr === "0" || correctStr.includes("option a") || correctStr.includes("option 1")) {
      correctOptionIndex = 0;
    } else if (correctStr === "b" || correctStr === "1" || correctStr.includes("option b") || correctStr.includes("option 2")) {
      correctOptionIndex = 1;
    } else if (correctStr === "c" || correctStr === "2" || correctStr.includes("option c") || correctStr.includes("option 3")) {
      correctOptionIndex = 2;
    } else if (correctStr === "d" || correctStr === "3" || correctStr.includes("option d") || correctStr.includes("option 4")) {
      correctOptionIndex = 3;
    } else {
      const num = parseInt(correctStr);
      if (!isNaN(num) && num >= 0 && num < 4) {
        correctOptionIndex = num;
      }
    }
    
    const explanation = row[7] || "No explanation provided.";
    const subject = row[8] ? row[8].trim() : defaultSubject;
    const topic = row[9] ? row[9].trim() : defaultTopic;

    if (!id || id.toLowerCase().startsWith("new-") || id.toLowerCase().startsWith("edit-") || id.toLowerCase().startsWith("parsed-") || id.toLowerCase().startsWith("draft-")) {
      id = generateQuestionIdForSubject(
        subject,
        topic,
        tempIndependent,
        []
      );
    }

    const q: Question = {
      id,
      questionText,
      options: [optA, optB, optC, optD],
      correctOptionIndex,
      explanation,
      subject,
      topic
    };

    parsedQuestions.push(q);
    tempIndependent.push(q);
  }

  return parsedQuestions;
}

export default function AdminPanel({ 
  allSets, 
  onSaveSets,
  independentQuestions = [],
  onSaveIndependentQuestions = () => {},
  userDraftQuestions = [],
  onSaveUserDraftQuestions = () => {},
  targetExam = "mec-ug",
  cmsContent,
  onSaveCMSContent
}: AdminPanelProps) {
  // Detailed set editor screen
  const [activeEditSet, setActiveEditSet] = useState<QuestionSet | null>(null);

  // New set builder states
  const [newTitle, setNewTitle] = useState("");
  const [newExamType, setNewExamType] = useState<string>("mec-ug");
  const [newType, setNewType] = useState<"past-year" | "mock-test">("mock-test");
  const [newYearOrDate, setNewYearOrDate] = useState("2026-06-30");
  const [newDuration, setNewDuration] = useState(45);
  const [newPrice, setNewPrice] = useState(25);
  const [newIsFree, setNewIsFree] = useState(false);
  const [newProvince, setNewProvince] = useState<string>("none");
  const [newCorrectMarks, setNewCorrectMarks] = useState(1);
  const [newIncorrectMarks, setNewIncorrectMarks] = useState(0.25);

  useEffect(() => {
    if (newExamType === "loksewa") {
      setNewCorrectMarks(2);
      setNewIncorrectMarks(0.4);
    } else if (newExamType === "mec-ug" || newExamType === "mec-pg") {
      setNewCorrectMarks(1);
      setNewIncorrectMarks(0.25);
    } else {
      setNewCorrectMarks(1);
      setNewIncorrectMarks(0);
    }
  }, [newExamType]);

  useEffect(() => {
    setAdminTargetExam(targetExam);
  }, [targetExam]);
  
  // Questions builder states for new set
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "new-q1",
      questionText: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: ""
    }
  ]);

  const [message, setMessage] = useState("");

  // Question Correction / Bug Report States
  const [adminTab, setAdminTab] = useState<"papers" | "reports" | "questions" | "review" | "cms">("papers");

  // CMS state bindings
  const [cmsBrandName, setCmsBrandName] = useState("");
  const [cmsLoginLabels, setCmsLoginLabels] = useState<any>({
    brandName: "nepmedmcq",
    brandSubtitle: "Nepal's Premier Medical MCQs & License Prep Engine",
    signupGoogleButton: "Sign Up with Google",
    signinGoogleButton: "Sign In with Google",
    termsAcceptedLabel: "I accept the Terms & Conditions and Privacy Policy",
    registerButton: "Register Account",
    loginButton: "Access Prep Dashboard",
    dividerText: "or continue with"
  });
  const [cmsAboutTitle, setCmsAboutTitle] = useState("");
  const [cmsAboutSubtitle, setCmsAboutSubtitle] = useState("");
  const [cmsAboutBody, setCmsAboutBody] = useState("");
  const [cmsSidebarLabels, setCmsSidebarLabels] = useState<any>({});
  const [cmsSidebarItems, setCmsSidebarItems] = useState<any[]>([]);
  const [cmsLeaderboardConfig, setCmsLeaderboardConfig] = useState<any>({ title: "", subtitle: "", subTitleTag: "", competitors: [] });
  const [cmsMecUgClassification, setCmsMecUgClassification] = useState<any[]>([]);
  const [cmsMecPgClassification, setCmsMecPgClassification] = useState<any[]>([]);
  const [cmsEditorialTeam, setCmsEditorialTeam] = useState<any[]>([]);
  const [adminPgFilterExam, setAdminPgFilterExam] = useState<string>("mec-pg");

  // Category filter state for papers panel
  const [selectedPaperExamFilter, setSelectedPaperExamFilter] = useState<string>("all");

  // Visual CMS internal subtab selection
  const [cmsSubTab, setCmsSubTab] = useState<"general" | "dashboard" | "saved" | "report" | "forum" | "exams" | "buttons" | "pricing" | "subjects" | "leaderboard" | "about" | "support">("general");

  // Expanded CMS state bindings
  const [cmsDashboardConfig, setCmsDashboardConfig] = useState<any>({
    announcement: { enabled: true, text: "🔥 High-yield MEC-UG and PG booster packages are now live!", bgColor: "#ef4444", textColor: "#ffffff" },
    heroBanner: { title: "Unlock Your Medical Potential", subtitle: "Practice with high-yield license simulation exams", imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80", buttonLabel: "Start Solving Now" },
    quickStats: [
      { id: "1", label: "Solved Questions", value: "24,500+", icon: "✅", color: "emerald" },
      { id: "2", label: "Accuracy Rating", value: "88%", icon: "🎯", color: "indigo" },
      { id: "3", label: "Daily Active Users", value: "1,200+", icon: "👥", color: "amber" }
    ],
    news: [
      { id: "1", title: "MEC exam dates announced for postgraduate modules", date: "2026-07-02", summary: "Official dates published by the Medical Education Commission.", category: "MEC Updates", enabled: true }
    ]
  });

  const [cmsSavedQuestionsConfig, setCmsSavedQuestionsConfig] = useState<any>({
    title: "Saved Questions Box",
    description: "Access and review your bookmarked high-yield questions.",
    maxSaveLimit: 150,
    tags: ["High-Yield", "Anatomy", "Surgical Clinicals", "Pathology Mnemonics"]
  });

  const [cmsMyReportConfig, setCmsMyReportConfig] = useState<any>({
    widgets: [
      { id: "accuracy", label: "Accuracy Rating Tracker", enabled: true },
      { id: "speed", label: "Syllabus Timing Pace", enabled: true },
      { id: "completion", label: "Syllabus Coverage Block", enabled: true }
    ],
    milestones: [
      { id: "1", targetScore: 100, badgeName: "Bronze Solver", description: "Correctly answered 100 questions." },
      { id: "2", targetScore: 250, badgeName: "Gold Scholar", description: "Correctly answered 250 questions with >85% accuracy." }
    ]
  });

  const [cmsDiscussionForumConfig, setCmsDiscussionForumConfig] = useState<any>({
    rules: [
      "Maintain professional academic respect in all discussion comments.",
      "Do not post copyrighted or leaked medical exam questions.",
      "Use descriptive titles for clinical questions."
    ],
    categories: [
      { id: "clinical", name: "Clinical Case Discussion", description: "Discuss medical cases, guidelines, and diagnostic challenges.", active: true },
      { id: "preclinical", name: "Preclinical & Mnemonics", description: "Anatomy, Physiology, Biochemistry, and active recall memory aids.", active: true }
    ],
    pinnedThread: {
      title: "Welcome to Nepal's Premier Medical Forum - Please read guidelines",
      content: "Welcome to our discussion platform. Let's make this the best collaborative medical archive.",
      author: "Chief Editorial Director",
      date: "2026-07-01",
      link: "#"
    }
  });

  const [cmsSupportConfig, setCmsSupportConfig] = useState<any>({
    supportEmail: "support@nepmedmcq.edu.np",
    phone: "+977-1-4412345",
    hours: "Sun - Fri, 9:00 AM - 5:00 PM (NST)",
    categories: [
      { label: "Payment Verification Issue", placeholder: "Explain your subscription transaction ID", enabled: true },
      { label: "Question Content Clarification", placeholder: "Specify the Question ID and reference paper", enabled: true },
      { label: "App Bug & Layout Feedback", placeholder: "Describe the issue and your device type", enabled: true }
    ],
    autoResponses: [
      { keyword: "payment", response: "Thank you for contacting billing. If you used eSewa or Khalti, please allow up to 10 minutes for automated license sync." },
      { keyword: "nmcle", response: "Our NMCLE mock tests are updated weekly. All answers are verified against standard textbooks." }
    ]
  });

  const [cmsSubscriptionConfig, setCmsSubscriptionConfig] = useState<any>({
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
  });

  const [cmsReferEarnConfig, setCmsReferEarnConfig] = useState<any>({
    title: "Refer Friends, Earn Cash & Points!",
    subtitle: "Invite other medical students/doctors to NepMedMCQ. Get rewarded instantly upon registration and subscription purchase.",
    pointsPerReg: 50,
    pointsPerSub: 500,
    promoMessage: "Hey! Check out NepMedMCQ, Nepal's best app for MECEE and Licensing MCQs. Use my code to register and get bonus access!",
    rules: [
      "Share your unique custom referral link or code with friends.",
      "Get 50 points as soon as they register their verified account.",
      "Get 500 premium points if they upgrade to any of the unlimited board preparation packages.",
      "Redeem points directly to unlock individual premium exam sets or extend your current pass!"
    ]
  });

  const [cmsPricingConfig, setCmsPricingConfig] = useState<any[]>([]);

  const [cmsButtonStyles, setCmsButtonStyles] = useState<any[]>([
    { id: "primary", label: "Primary Button (e.g. Save, Submit)", text: "Submit Answer", bgColor: "#6366f1", textColor: "#ffffff", borderRadius: "rounded-xl" },
    { id: "secondary", label: "Secondary Button (e.g. Back, Cancel)", text: "Back to Dashboard", bgColor: "#1e293b", textColor: "#cbd5e1", borderRadius: "rounded-xl" },
    { id: "start-test", label: "Action Button (e.g. Start simulating)", text: "Simulate Test Mode", bgColor: "#10b981", textColor: "#0f172a", borderRadius: "rounded-xl" }
  ]);

  const [cmsTargetExams, setCmsTargetExams] = useState<any[]>([
    {
      id: "mec-ug",
      name: "MEC-UG",
      code: "mec-ug",
      description: "Medical Education Commission - Undergraduate",
      subcategories: [
        {
          id: "mock",
          name: "Mock Tests Arena",
          description: "Simulated exam modules with active timers",
          components: [
            { id: "c1", type: "text_banner", title: "MEC-UG Mock Notice", content: "High-yield full syllabus mock papers.", isActive: true }
          ]
        },
        {
          id: "past-years",
          name: "Past Board Papers",
          description: "MEC-UG official past papers",
          components: [
            { id: "c2", type: "info_card", title: "Past Board Papers Booster", content: "Meticulous explanations for years 2021 to 2024.", isActive: true }
          ]
        }
      ]
    },
    {
      id: "mec-pg",
      name: "MEC-PG",
      code: "mec-pg",
      description: "Medical Education Commission - Postgraduate",
      subcategories: [
        {
          id: "mock",
          name: "Mock Tests Arena",
          description: "Simulated postgraduate exam modules with active timers",
          components: [
            { id: "c3", type: "text_banner", title: "MEC-PG Mock Notice", content: "Advanced clinical case-based mock sets.", isActive: true }
          ]
        }
      ]
    },
    {
      id: "nmcle",
      name: "NMCLE",
      code: "nmcle",
      description: "Nepal Medical Council Licensing Exam booster packs",
      subcategories: []
    },
    {
      id: "ku-mcq",
      name: "KU-MCQ",
      code: "ku-mcq",
      description: "Kathmandu University undergraduate entrance & licensing question bank",
      subcategories: []
    },
    {
      id: "loksewa",
      name: "Loksewa",
      code: "loksewa",
      description: "General Medical Officer and Healthcare Services exams",
      subcategories: []
    }
  ]);

  // Copy-paste clipboards
  const [componentClipboard, setComponentClipboard] = useState<any>(null);
  const [subcategoryClipboard, setSubcategoryClipboard] = useState<any>(null);

  useEffect(() => {
    if (cmsContent) {
      setCmsBrandName(cmsContent.brandName || "");
      if (cmsContent.loginLabels) {
        setCmsLoginLabels(cmsContent.loginLabels);
      }
      setCmsAboutTitle(cmsContent.aboutUsLabels?.title || "");
      setCmsAboutSubtitle(cmsContent.aboutUsLabels?.subTitle || "");
      setCmsAboutBody(cmsContent.aboutUsLabels?.bodyText || "");
      setCmsSidebarLabels(cmsContent.sidebarLabels || {});
      setCmsSidebarItems(cmsContent.sidebarItems || [
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
      ]);
      setCmsLeaderboardConfig(cmsContent.leaderboardConfig || {
        title: "Prep Leaderboard",
        subtitle: "See how your total correct MCQ counts stack up against Nepal's top licensing and entrance candidates.",
        subTitleTag: "National Medical Exam Standings",
        competitors: []
      });
      setCmsMecUgClassification(cmsContent.mecUgClassification || []);
      setCmsMecPgClassification(cmsContent.mecPgClassification || []);
      setCmsEditorialTeam(cmsContent.editorialTeam || []);

      // Expanded visual CMS loadings
      if (cmsContent.dashboardConfig) setCmsDashboardConfig(cmsContent.dashboardConfig);
      if (cmsContent.savedQuestionsConfig) setCmsSavedQuestionsConfig(cmsContent.savedQuestionsConfig);
      if (cmsContent.myReportConfig) setCmsMyReportConfig(cmsContent.myReportConfig);
      if (cmsContent.discussionForumConfig) setCmsDiscussionForumConfig(cmsContent.discussionForumConfig);
      if (cmsContent.supportConfig) setCmsSupportConfig(cmsContent.supportConfig);
      if (cmsContent.subscriptionPlans) setCmsPricingConfig(cmsContent.subscriptionPlans);
      else if (cmsContent.pricingConfig) setCmsPricingConfig(cmsContent.pricingConfig);
      if (cmsContent.buttonStyles) setCmsButtonStyles(cmsContent.buttonStyles);
      if (cmsContent.targetExams) setCmsTargetExams(cmsContent.targetExams);
      if (cmsContent.subscriptionConfig) setCmsSubscriptionConfig(cmsContent.subscriptionConfig);
      if (cmsContent.referEarnConfig) setCmsReferEarnConfig(cmsContent.referEarnConfig);
    }
  }, [cmsContent]);

  const [isSavingCms, setIsSavingCms] = useState(false);
  const handleSaveCMS = async () => {
    if (!onSaveCMSContent) return;
    setIsSavingCms(true);
    
    // Auto-update mapping labels in sidebarLabels
    const updatedLabels = {
      ...cmsSidebarLabels,
      dashboard: cmsSidebarItems.find(i => i.id === "dashboard")?.label || cmsSidebarLabels.dashboard || "Dashboard",
      set_practice: cmsSidebarItems.find(i => i.id === "set_practice")?.label || cmsSidebarLabels.set_practice || "Set wise Practice",
      practice: cmsSidebarItems.find(i => i.id === "practice")?.label || cmsSidebarLabels.practice || "Subject Wise Practice",
      bookmarks: cmsSidebarItems.find(i => i.id === "bookmarks")?.label || cmsSidebarLabels.bookmarks || "Saved Questions",
      history: cmsSidebarItems.find(i => i.id === "history")?.label || cmsSidebarLabels.history || "My Report",
      leaderboard: cmsSidebarItems.find(i => i.id === "leaderboard")?.label || cmsSidebarLabels.leaderboard || "Leaderboard",
      forum: cmsSidebarItems.find(i => i.id === "forum")?.label || cmsSidebarLabels.forum || "Discussion Forum",
      subscription: cmsSidebarItems.find(i => i.id === "subscription")?.label || cmsSidebarLabels.subscription || "Premium Subscription",
      refer_earn: cmsSidebarItems.find(i => i.id === "refer_earn")?.label || cmsSidebarLabels.refer_earn || "Refer & Earn",
      about: cmsSidebarItems.find(i => i.id === "about")?.label || cmsSidebarLabels.about || "About Us & Support",
      admin: cmsSidebarItems.find(i => i.id === "admin")?.label || cmsSidebarLabels.admin || "Question Upload & Pricing",
    };

    const updatedContent = {
      ...cmsContent,
      brandName: cmsBrandName,
      aboutUsLabels: {
        ...cmsContent?.aboutUsLabels,
        title: cmsAboutTitle,
        subTitle: cmsAboutSubtitle,
        bodyText: cmsAboutBody
      },
      sidebarLabels: updatedLabels,
      sidebarItems: cmsSidebarItems,
      leaderboardConfig: cmsLeaderboardConfig,
      mecUgClassification: cmsMecUgClassification,
      mecPgClassification: cmsMecPgClassification,
      editorialTeam: cmsEditorialTeam,
      // Serialization of expanded configs
      dashboardConfig: cmsDashboardConfig,
      savedQuestionsConfig: cmsSavedQuestionsConfig,
      myReportConfig: cmsMyReportConfig,
      discussionForumConfig: cmsDiscussionForumConfig,
      supportConfig: cmsSupportConfig,
      subscriptionPlans: cmsPricingConfig,
      buttonStyles: cmsButtonStyles,
      targetExams: cmsTargetExams,
      loginLabels: cmsLoginLabels,
      subscriptionConfig: cmsSubscriptionConfig,
      referEarnConfig: cmsReferEarnConfig
    };

    const success = await onSaveCMSContent(updatedContent);
    setIsSavingCms(false);
    if (success) {
      setMessage("✅ App-wide CMS modifications updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } else {
      setMessage("❌ Failed to update CMS content.");
      setTimeout(() => setMessage(""), 4000);
    }
  };
  
  // Requirement 2: Subject Folders Pool States
  const [adminTargetExam, setAdminTargetExam] = useState<string>(targetExam);
  const [selectedSubjectFolder, setSelectedSubjectFolder] = useState<string | null>(null);
  const [showCreateIndependentForm, setShowCreateIndependentForm] = useState(false);
  const [creationMode, setCreationMode] = useState<"interactive" | "bulk">("interactive");
  const [adminBulkTopic, setAdminBulkTopic] = useState("");
  const [adminBulkParsedQuestions, setAdminBulkParsedQuestions] = useState<Question[]>([]);
  const [adminBulkFileError, setAdminBulkFileError] = useState("");
  
  const [newIndQuestionText, setNewIndQuestionText] = useState("");
  const [newIndOptions, setNewIndOptions] = useState<string[]>(["", "", "", ""]);
  const [newIndCorrectIdx, setNewIndCorrectIdx] = useState(0);
  const [newIndExplanation, setNewIndExplanation] = useState("");
  const [newIndTopic, setNewIndTopic] = useState("");

  const [activeEditIndependentId, setActiveEditIndependentId] = useState<string | null>(null);
  const [editIndQuestionText, setEditIndQuestionText] = useState("");
  const [editIndOptions, setEditIndOptions] = useState<string[]>(["", "", "", ""]);
  const [editIndCorrectIdx, setEditIndCorrectIdx] = useState(0);
  const [editIndExplanation, setEditIndExplanation] = useState("");
  const [editIndTopic, setEditIndTopic] = useState("");

  // Requirement 3: User Proposed Review States
  const [activeReviewDraftId, setActiveReviewDraftId] = useState<string | null>(null);
  const [reviewQuestionText, setReviewQuestionText] = useState("");
  const [reviewOptions, setReviewOptions] = useState<string[]>(["", "", "", ""]);
  const [reviewCorrectIdx, setReviewCorrectIdx] = useState(0);
  const [reviewExplanation, setReviewExplanation] = useState("");
  const [reviewSubject, setReviewSubject] = useState("Physics");
  const [reviewTopic, setReviewTopic] = useState("Mechanics");
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Custom Confirmation Modal State to bypass iframe sandbox limits
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const askConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel
    });
  };

  // CSV Editor Modal States
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvModalText, setCsvModalText] = useState("");
  const [csvModalTarget, setCsvModalTarget] = useState<{ type: "set", setId: string } | { type: "subject", subjectName: string } | null>(null);
  const [csvModalError, setCsvModalError] = useState<string | null>(null);
  const [isCsvFullscreen, setIsCsvFullscreen] = useState(false);
  const [csvTab, setCsvTab] = useState<"spreadsheet" | "raw">("spreadsheet");
  const [gridRows, setGridRows] = useState<string[][]>([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedExcelText, setPastedExcelText] = useState("");

  // Spreadsheet State extensions for Subject & Topic dropdowns and Rich Editor
  const [customTopicRows, setCustomTopicRows] = useState<Record<number, boolean>>({});
  const [customSubjectRows, setCustomSubjectRows] = useState<Record<number, boolean>>({});
  const [richCellEdit, setRichCellEdit] = useState<{
    rIdx: number;
    cIdx: number;
    value: string;
  } | null>(null);

  const getModalExamType = () => {
    if (csvModalTarget?.type === "set") {
      return activeEditSet?.examType || "mec-ug";
    } else if (csvModalTarget?.type === "subject") {
      const isUg = ["Physics", "Chemistry", "Botany", "Zoology", "MAT"].includes(csvModalTarget.subjectName);
      return isUg ? "mec-ug" : "mec-pg";
    }
    return "mec-ug";
  };

  const getModalSubjects = () => {
    const examType = getModalExamType();
    if (examType === "mec-ug") {
      return ["Physics", "Chemistry", "Botany", "Zoology", "MAT"];
    } else {
      return ALL_STANDARD_SUBJECTS;
    }
  };

  const getTopicsForSubject = (subjectName: string, examType: "mec-ug" | "mec-pg") => {
    if (examType === "mec-ug") {
      const category = MEC_UG_CLASSIFICATION.find(c => c.subject.toLowerCase() === subjectName.toLowerCase());
      return category ? category.topics.map(t => t.name) : [];
    } else {
      // Collect unique topics from allSets and independentQuestions for this subject
      const topicsSet = new Set<string>();
      topicsSet.add("General");
      if (independentQuestions) {
        independentQuestions.forEach(q => {
          if (q.subject?.toLowerCase() === subjectName.toLowerCase() && q.topic) {
            topicsSet.add(q.topic);
          }
        });
      }
      allSets.forEach(s => {
        s.questions.forEach(q => {
          if (q.subject?.toLowerCase() === subjectName.toLowerCase() && q.topic) {
            topicsSet.add(q.topic);
          }
        });
      });
      return Array.from(topicsSet);
    }
  };

  // Parse raw CSV text to 2D string grid
  const parseCSVToGrid = (text: string): string[][] => {
    // Detect delimiter: tab, semicolon, or comma
    let delimiter = ',';
    const firstLine = text.split(/\r?\n/)[0] || "";
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';';
    }

    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields: string[] = [];
      let currentField = "";
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === delimiter && !insideQuotes) {
          fields.push(currentField);
          currentField = "";
        } else {
          currentField += char;
        }
      }
      fields.push(currentField);
      rows.push(fields);
    }

    // Remove header row if it exists
    let dataRows = rows;
    if (rows.length > 0) {
      const firstRowJoined = rows[0].join(" ").toLowerCase();
      if (firstRowJoined.includes("question") || firstRowJoined.includes("explanation") || firstRowJoined.includes("option") || firstRowJoined.includes("correct") || firstRowJoined.includes("id")) {
        dataRows = rows.slice(1);
      }
    }

    // Normalize keys and subjects for spreadsheet dropdown alignment
    return dataRows.map(row => {
      const paddedRow = [...row];
      while (paddedRow.length < 10) {
        paddedRow.push("");
      }

      // Normalize Correct Option (index 6) to "0"-"3"
      const correctStr = (paddedRow[6] || "0").trim().toLowerCase();
      let normalizedCorrect = "0";
      if (correctStr === "a" || correctStr === "0" || correctStr.includes("option a") || correctStr.includes("option 1")) {
        normalizedCorrect = "0";
      } else if (correctStr === "b" || correctStr === "1" || correctStr.includes("option b") || correctStr.includes("option 2")) {
        normalizedCorrect = "1";
      } else if (correctStr === "c" || correctStr === "2" || correctStr.includes("option c") || correctStr.includes("option 3")) {
        normalizedCorrect = "2";
      } else if (correctStr === "d" || correctStr === "3" || correctStr.includes("option d") || correctStr.includes("option 4")) {
        normalizedCorrect = "3";
      } else {
        const num = parseInt(correctStr);
        if (!isNaN(num) && num >= 0 && num < 4) {
          normalizedCorrect = num.toString();
        }
      }
      paddedRow[6] = normalizedCorrect;

      // Normalize Subject (index 8) to match standard list case-insensitively if possible
      const rawSubject = (paddedRow[8] || "").trim();
      if (rawSubject) {
        const lowerSub = rawSubject.toLowerCase();
        const matchedSub = ALL_STANDARD_SUBJECTS.find(s => s.toLowerCase() === lowerSub);
        if (matchedSub) {
          paddedRow[8] = matchedSub;
        } else {
          // preserve exact custom subject casing
          paddedRow[8] = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
        }
      } else {
        paddedRow[8] = "";
      }

      return paddedRow;
    });
  };

  // Serialize 2D string grid back to raw CSV text
  const serializeGridToCSV = (grid: string[][]): string => {
    const escapeField = (val: string) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = ["ID", "Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Option Index (0-3)", "Explanation", "Subject", "Topic"];
    const rows = [header.join(",")];

    grid.forEach(row => {
      const paddedRow = Array(10).fill("");
      for (let i = 0; i < 10; i++) {
        paddedRow[i] = row[i] || "";
      }
      const escapedRow = paddedRow.map(escapeField);
      rows.push(escapedRow.join(","));
    });

    return rows.join("\n");
  };

  const handlePasteExcelRows = (pastedText: string) => {
    if (!pastedText.trim()) return;
    const lines = pastedText.split(/\r?\n/);
    const newRows: string[][] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      // Excel/Sheets copy-paste is tab-delimited
      const cols = line.split("\t");
      const paddedRow = [...cols];
      while (paddedRow.length < 10) {
        paddedRow.push("");
      }
      // If correct option index is given as A, B, C, D instead of 0, 1, 2, 3, normalize it
      const keyVal = paddedRow[6].trim().toUpperCase();
      if (keyVal === "A" || keyVal === "0") paddedRow[6] = "0";
      else if (keyVal === "B" || keyVal === "1") paddedRow[6] = "1";
      else if (keyVal === "C" || keyVal === "2") paddedRow[6] = "2";
      else if (keyVal === "D" || keyVal === "3") paddedRow[6] = "3";
      else paddedRow[6] = "0"; // fallback default
      
      newRows.push(paddedRow);
    }
    if (newRows.length > 0) {
      setGridRows([...gridRows, ...newRows]);
      setMessage(`📋 Successfully pasted and appended ${newRows.length} rows from Excel!`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleImportSpreadsheetFile = (fileText: string) => {
    const parsed = parseCSVToGrid(fileText);
    if (parsed.length > 0) {
      // Check if we currently have a single empty placeholder row
      const isSingleEmptyRow = gridRows.length === 1 && gridRows[0].every(cell => cell.trim() === "" || cell === "0");
      const cleanExistingRows = isSingleEmptyRow ? [] : gridRows;

      // Filter out completely empty parsed rows from the imported file
      const cleanParsed = parsed.filter(row => row.some(cell => cell.trim() !== ""));

      if (cleanParsed.length === 0) {
        setMessage("⚠️ No valid non-empty rows could be parsed from the spreadsheet file.");
        setTimeout(() => setMessage(""), 4000);
        return;
      }

      const mergedRows = [...cleanExistingRows, ...cleanParsed];
      setGridRows(mergedRows);
      
      // Keep csvModalText in sync with the updated gridRows to prevent state updates from reverting the imported data
      const serialized = serializeGridToCSV(mergedRows);
      setCsvModalText(serialized);
      
      if (cleanExistingRows.length > 0) {
        setMessage(`📥 Added ${cleanParsed.length} questions below the existing sheet and expanded the question pool to ${mergedRows.length} total rows!`);
        triggerNotification(`Appended ${cleanParsed.length} imported questions below the existing sheet and expanded question pool.`);
      } else {
        setMessage(`📥 Successfully imported and loaded ${cleanParsed.length} rows to the sheet!`);
        triggerNotification(`Imported ${cleanParsed.length} questions to the spreadsheet.`);
      }
      setTimeout(() => setMessage(""), 5000);
    } else {
      setMessage("⚠️ No rows could be parsed from the spreadsheet file.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = csvTab === "spreadsheet" ? serializeGridToCSV(gridRows) : csvModalText;
      if (!csvContent || csvContent.trim() === "") {
        setCsvModalError("Spreadsheet is empty. Nothing to export.");
        return;
      }
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      let filename = "spreadsheet_mcqs.csv";
      if (csvModalTarget) {
        if (csvModalTarget.type === "set") {
          filename = `set_${csvModalTarget.setId}_mcqs.csv`;
        } else if (csvModalTarget.type === "subject") {
          const sanitizedSubject = csvModalTarget.subjectName.toLowerCase().replace(/[^a-z0-9]/g, "_");
          filename = `subject_${sanitizedSubject}_mcqs.csv`;
        }
      }
      
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCsvModalError(null);
      triggerNotification(`Successfully exported and downloaded "${filename}"!`);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      setCsvModalError("Failed to export CSV. Please check the console.");
    }
  };

  useEffect(() => {
    if (isCSVModalOpen) {
      const parsed = parseCSVToGrid(csvModalText);
      setGridRows(parsed);
      setCsvTab("spreadsheet");
      setIsCsvFullscreen(false);

      const initialCustomSubjects: Record<number, boolean> = {};
      const initialCustomTopics: Record<number, boolean> = {};
      const examType = getModalExamType();
      const subjectsList = getModalSubjects();

      parsed.forEach((row, rIdx) => {
        const subVal = row[8] || "";
        if (subVal && !subjectsList.includes(subVal)) {
          initialCustomSubjects[rIdx] = true;
        }

        const topicVal = row[9] || "";
        const topicsList = getTopicsForSubject(subVal, examType);
        if (topicVal && !topicsList.includes(topicVal)) {
          initialCustomTopics[rIdx] = true;
        }
      });

      setCustomSubjectRows(initialCustomSubjects);
      setCustomTopicRows(initialCustomTopics);
    }
  }, [isCSVModalOpen, csvModalText]);

  const handleOpenCSVEditorForSet = () => {
    if (!activeEditSet) return;
    const csvContent = serializeQuestionsToCSV(activeEditSet.questions);
    setCsvModalText(csvContent);
    setCsvModalTarget({ type: "set", setId: activeEditSet.id });
    setCsvModalError(null);
    setIsCSVModalOpen(true);
  };

  const handleOpenCSVEditorForSubject = (subjectName: string) => {
    const questionsOfSubject = independentQuestions.filter(q => q.subject === subjectName);
    const csvContent = serializeQuestionsToCSV(questionsOfSubject);
    setCsvModalText(csvContent);
    setCsvModalTarget({ type: "subject", subjectName });
    setCsvModalError(null);
    setIsCSVModalOpen(true);
  };

  const handleSaveCSVModal = () => {
    if (!csvModalTarget) return;

    try {
      const defaultSubject = csvModalTarget.type === "subject" ? csvModalTarget.subjectName : (activeEditSet?.subject || "Physics");
      const defaultTopic = "General";
      const targetExamType = activeEditSet?.examType || "mec-ug";

      // If in spreadsheet mode, serialize the current spreadsheet grid back into CSV text first
      const activeCSVText = csvTab === "spreadsheet" ? serializeGridToCSV(gridRows) : csvModalText;

      const parsed = parseCSVToQuestions(
        activeCSVText,
        defaultSubject,
        defaultTopic,
        targetExamType,
        independentQuestions
      );

      if (parsed.length === 0) {
        setCsvModalError("Parsed 0 questions. Please provide at least 1 valid MCQ with question text.");
        return;
      }

      if (csvModalTarget.type === "set") {
        if (activeEditSet && activeEditSet.id === csvModalTarget.setId) {
          const updatedSet = {
            ...activeEditSet,
            questions: parsed
          };
          setActiveEditSet(updatedSet);
          
          const updatedSets = allSets.map(s => s.id === updatedSet.id ? updatedSet : s);
          onSaveSets(updatedSets);
          
          triggerNotification(`Successfully updated & synchronized ${parsed.length} questions in set "${activeEditSet.title}"!`);
        }
      } else if (csvModalTarget.type === "subject") {
        const subjectName = csvModalTarget.subjectName;
        const otherIndependent = independentQuestions.filter(q => q.subject !== subjectName);
        const updatedIndependent = [...otherIndependent, ...parsed];
        onSaveIndependentQuestions(updatedIndependent);
        
        triggerNotification(`Successfully updated & synchronized ${parsed.length} independent questions in subject folder "${subjectName}"!`);
      }

      setIsCSVModalOpen(false);
      setCsvModalTarget(null);
      setCsvModalError(null);
    } catch (err: any) {
      console.error(err);
      setCsvModalError(`Failed to parse and save CSV. Error: ${err.message || err}`);
    }
  };



  // Add question tagged to Subject/Topic without other details
  const handleAddIndependentQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndQuestionText.trim()) {
      setMessage("⚠️ Question text cannot be empty!");
      return;
    }
    if (newIndOptions.some(opt => !opt.trim())) {
      setMessage("⚠️ All four answer options must be filled!");
      return;
    }
    if (!selectedSubjectFolder) {
      setMessage("⚠️ No subject folder is active!");
      return;
    }

    const nextId = generateQuestionIdForSubject(
      selectedSubjectFolder,
      newIndTopic.trim() || "General",
      independentQuestions,
      allSets.flatMap(set => set.questions)
    );
    const newQuestion: Question = {
      id: nextId,
      questionText: newIndQuestionText,
      options: [...newIndOptions],
      correctOptionIndex: newIndCorrectIdx,
      explanation: newIndExplanation || "No explanation provided.",
      subject: selectedSubjectFolder,
      topic: newIndTopic.trim() || "General"
    };

    const updated = [...independentQuestions, newQuestion];
    onSaveIndependentQuestions(updated);
    
    // Reset form
    setNewIndQuestionText("");
    setNewIndOptions(["", "", "", ""]);
    setNewIndCorrectIdx(0);
    setNewIndExplanation("");
    setNewIndTopic("");
    setShowCreateIndependentForm(false);
    setMessage(`✅ Successfully created Question ${nextId} in ${selectedSubjectFolder}!`);
  };

  // Start Edit Independent MCQ
  const handleStartEditIndependentQuestion = (q: Question) => {
    setActiveEditIndependentId(q.id);
    setEditIndQuestionText(q.questionText);
    setEditIndOptions([...q.options]);
    setEditIndCorrectIdx(q.correctOptionIndex);
    setEditIndExplanation(q.explanation || "");
    setEditIndTopic(q.topic || "");
  };

  // Save Edit Independent MCQ
  const handleSaveEditIndependentQuestion = () => {
    if (!editIndQuestionText.trim()) {
      setMessage("⚠️ Question text cannot be empty!");
      return;
    }
    if (editIndOptions.some(opt => !opt.trim())) {
      setMessage("⚠️ All four options must be filled!");
      return;
    }

    const updated = independentQuestions.map(q => {
      if (q.id === activeEditIndependentId) {
        return {
          ...q,
          questionText: editIndQuestionText,
          options: [...editIndOptions],
          correctOptionIndex: editIndCorrectIdx,
          explanation: editIndExplanation,
          topic: editIndTopic || "General"
        };
      }
      return q;
    });

    onSaveIndependentQuestions(updated);
    setActiveEditIndependentId(null);
    setMessage(`✅ Successfully updated independent MCQ ${activeEditIndependentId}!`);
  };

  // Delete Independent MCQ
  const handleDeleteIndependentQuestion = (id: string) => {
    askConfirmation(
      "Delete Question",
      `Are you sure you want to delete question ${id}? This action is irreversible.`,
      () => {
        const updated = independentQuestions.filter(q => q.id !== id);
        onSaveIndependentQuestions(updated);
        setMessage(`🗑️ Deleted independent MCQ ${id} successfully.`);
      }
    );
  };

  // Start Reviewing a Draft Question
  const handleStartReviewDraft = (draft: Question) => {
    setActiveReviewDraftId(draft.id);
    setReviewQuestionText(draft.questionText);
    setReviewOptions([...draft.options]);
    setReviewCorrectIdx(draft.correctOptionIndex);
    setReviewExplanation(draft.explanation || "");
    setReviewSubject(draft.subject || "Physics");
    setReviewTopic(draft.topic || "Mechanics");
  };

  // Approve & Publish Draft Question to system
  const handlePublishDraft = () => {
    if (!reviewQuestionText.trim()) {
      setMessage("⚠️ Question text cannot be empty!");
      return;
    }
    if (reviewOptions.some(opt => !opt.trim())) {
      setMessage("⚠️ All four options must be filled!");
      return;
    }

    const nextId = generateQuestionIdForSubject(
      reviewSubject,
      reviewTopic || "General",
      independentQuestions,
      allSets.flatMap(set => set.questions)
    );
    const approvedQuestion: Question = {
      id: nextId,
      questionText: reviewQuestionText,
      options: [...reviewOptions],
      correctOptionIndex: reviewCorrectIdx,
      explanation: reviewExplanation || "No explanation provided.",
      subject: reviewSubject,
      topic: reviewTopic || "General"
    };

    // 1. Add to independent questions
    const updatedIndependent = [...independentQuestions, approvedQuestion];
    onSaveIndependentQuestions(updatedIndependent);

    // 2. Remove from draft queue
    const updatedDrafts = userDraftQuestions.filter(q => q.id !== activeReviewDraftId);
    onSaveUserDraftQuestions(updatedDrafts);

    setActiveReviewDraftId(null);
    setMessage(`🚀 Approved and Published User MCQ as ${nextId} under ${reviewSubject}!`);
  };

  // Reject / Delete Draft Question
  const handleRejectDraft = (draftId: string) => {
    askConfirmation(
      "Reject Proposed MCQ",
      "Are you sure you want to reject and delete this user draft question? This action cannot be undone.",
      () => {
        const updatedDrafts = userDraftQuestions.filter(q => q.id !== draftId);
        onSaveUserDraftQuestions(updatedDrafts);
        if (activeReviewDraftId === draftId) {
          setActiveReviewDraftId(null);
        }
        setMessage("❌ Rejected user draft question submission.");
      }
    );
  };

  const handleBulkAcceptDrafts = () => {
    if (userDraftQuestions.length === 0) return;
    
    askConfirmation(
      "Bulk Accept All Proposed MCQs",
      `Are you sure you want to approve and publish all ${userDraftQuestions.length} pending candidate questions at once?`,
      () => {
        let tempIndependent = [...independentQuestions];
        const allSetsQuestions = allSets.flatMap(s => s.questions);

        const approvedQuestions: Question[] = userDraftQuestions.map(draft => {
          const generatedId = generateQuestionIdForSubject(
            draft.subject || "Anatomy",
            draft.topic,
            tempIndependent,
            allSetsQuestions
          );
          const newQ: Question = {
            ...draft,
            id: generatedId,
            explanation: draft.explanation || "No explanation provided.",
            subject: draft.subject || "Anatomy",
            topic: draft.topic || "General"
          };
          tempIndependent.push(newQ);
          return newQ;
        });

        onSaveIndependentQuestions(tempIndependent);
        onSaveUserDraftQuestions([]);
        setMessage(`🚀 Successfully bulk approved & published ${approvedQuestions.length} MCQs! All have been formatted and assigned unique IDs.`);
      }
    );
  };

  const handleAcceptDraftDirect = (draft: Question) => {
    askConfirmation(
      "Accept Proposed MCQ",
      `Are you sure you want to approve and publish proposed MCQ "${draft.id}" directly?`,
      () => {
        const nextId = generateQuestionIdForSubject(
          draft.subject || "Anatomy",
          draft.topic || "General",
          independentQuestions,
          allSets.flatMap(set => set.questions)
        );
        const approvedQuestion: Question = {
          ...draft,
          id: nextId,
          explanation: draft.explanation || "No explanation provided.",
          subject: draft.subject || "Anatomy",
          topic: draft.topic || "General"
        };

        // 1. Add to independent questions
        const updatedIndependent = [...independentQuestions, approvedQuestion];
        onSaveIndependentQuestions(updatedIndependent);

        // 2. Remove from draft queue
        const updatedDrafts = userDraftQuestions.filter(q => q.id !== draft.id);
        onSaveUserDraftQuestions(updatedDrafts);

        if (activeReviewDraftId === draft.id) {
          setActiveReviewDraftId(null);
        }
        setMessage(`🚀 Successfully approved and published proposed MCQ directly as ${nextId}!`);
      }
    );
  };

  const handleBulkRejectDrafts = () => {
    if (userDraftQuestions.length === 0) return;
    askConfirmation(
      "Bulk Reject All Proposed MCQs",
      `Are you sure you want to reject and delete all ${userDraftQuestions.length} pending candidate questions at once? This action is final.`,
      () => {
        onSaveUserDraftQuestions([]);
        setActiveReviewDraftId(null);
        setMessage(`❌ Successfully bulk rejected and trashed all ${userDraftQuestions.length} proposed candidate questions.`);
      }
    );
  };

  const handleRetagDatabase = () => {
    askConfirmation(
      "Retag & Re-serialize Database",
      "Are you sure you want to retag all existing MCQ questions across all sets and subject folders with the new structured serial ID format (e.g. 1-X-Y-Z-N / 2-X-Y-N)? This will fully standardize all questions in local storage.",
      () => {
        const { sets: updatedSets, independent: updatedIndependent } = retagAllQuestions(allSets, independentQuestions);
        onSaveSets(updatedSets);
        onSaveIndependentQuestions(updatedIndependent);
        setMessage("🚀 Successfully retagged and re-serialized all database questions with the new ID system!");
      }
    );
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (e) {
      console.error("Error loading user reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (adminTab === "reports") {
      fetchReports();
    }
  }, [adminTab]);

  const handleDeleteReport = async (reportId: string) => {
    askConfirmation(
      "Dismiss/Resolve Report",
      "Are you sure you want to dismiss or resolve this report? This will remove it from the reports queue.",
      async () => {
        try {
          const response = await fetch(`/api/reports/${reportId}`, {
            method: "DELETE"
          });
          if (response.ok) {
            setReports(prev => prev.filter(r => r.id !== reportId));
            triggerNotification("Resolved reported issue successfully!");
          }
        } catch (err) {
          console.error("Failed to delete report:", err);
        }
      }
    );
  };

  const handleEditClick = (set: QuestionSet) => {
    // Make a deep copy to prevent mutating direct state before saving
    setActiveEditSet(JSON.parse(JSON.stringify(set)));
  };

  const handleUpdateEditSetField = (field: keyof QuestionSet, value: any) => {
    if (!activeEditSet) return;
    setActiveEditSet({
      ...activeEditSet,
      [field]: value
    });
  };

  const handleUpdateEditQuestionField = (qIdx: number, field: keyof Question, value: any) => {
    if (!activeEditSet) return;
    const updatedQs = [...activeEditSet.questions];
    updatedQs[qIdx] = { ...updatedQs[qIdx], [field]: value };
    setActiveEditSet({ ...activeEditSet, questions: updatedQs });
  };

  const handleUpdateEditOptionField = (qIdx: number, optIdx: number, value: string) => {
    if (!activeEditSet) return;
    const updatedQs = [...activeEditSet.questions];
    const updatedOpts = [...updatedQs[qIdx].options];
    updatedOpts[optIdx] = value;
    updatedQs[qIdx].options = updatedOpts;
    setActiveEditSet({ ...activeEditSet, questions: updatedQs });
  };

  const handleAddEditQuestionRow = () => {
    if (!activeEditSet) return;
    setActiveEditSet({
      ...activeEditSet,
      questions: [
        ...activeEditSet.questions,
        {
          id: `edit-q-${Date.now()}-${activeEditSet.questions.length + 1}`,
          questionText: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          explanation: ""
        }
      ]
    });
  };

  const handleRemoveEditQuestionRow = (qIdx: number) => {
    if (!activeEditSet) return;
    askConfirmation(
      "Remove Question from Set",
      "Are you sure you want to remove this question from the set?",
      () => {
        setActiveEditSet({
          ...activeEditSet,
          questions: activeEditSet.questions.filter((_, idx) => idx !== qIdx)
        });
      }
    );
  };

  const handleEditMcqFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeEditSet) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const parsedQuestions = extractQuestionsFromCSV(text);
        if (parsedQuestions.length === 0) {
          alert("The file appears to be empty or in an invalid format.");
          return;
        }

        askConfirmation(
          "Replace Existing MCQs?",
          `Successfully parsed ${parsedQuestions.length} questions. Do you want to REPLACE the existing questions of this set with these new ones? (Selecting "Cancel" will APPEND the new questions to the end of the set instead)`,
          () => {
            setActiveEditSet({ ...activeEditSet, questions: parsedQuestions });
            triggerNotification(`Loaded ${parsedQuestions.length} MCQs to set successfully (Replaced existing)!`);
          },
          () => {
            setActiveEditSet({ ...activeEditSet, questions: [...activeEditSet.questions, ...parsedQuestions] });
            triggerNotification(`Loaded ${parsedQuestions.length} MCQs to set successfully (Appended to set)!`);
          }
        );
      } catch (err) {
        alert("Error parsing CSV. Format order should be: question text, option a, b, c, d, correct, explanation");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveActiveEditSet = () => {
    if (!activeEditSet) return;
    if (!activeEditSet.title) {
      alert("Please provide a set title.");
      return;
    }
    if (activeEditSet.questions.length === 0) {
      alert("The set must contain at least 1 question.");
      return;
    }

    const updatedSets = allSets.map(s => s.id === activeEditSet.id ? activeEditSet : s);
    onSaveSets(updatedSets);
    setActiveEditSet(null);
    triggerNotification("Saved all configurations & question bank changes!");
  };

  const handleDeleteClick = (setId: string) => {
    askConfirmation(
      "Delete Question Set",
      "Are you sure you want to delete this question set? This will permanently erase the set and its questions.",
      () => {
        const updatedSets = allSets.filter(s => s.id !== setId);
        onSaveSets(updatedSets);
        triggerNotification("Set deleted successfully.");
      }
    );
  };

  const handleAddQuestionRow = () => {
    setQuestions([
      ...questions,
      {
        id: `new-q-${Date.now()}-${questions.length + 1}`,
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: ""
      }
    ]);
  };

  const handleUpdateQuestionField = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateOptionField = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleNewSetMcqFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const parsedQuestions = extractQuestionsFromCSV(text);
        if (parsedQuestions.length === 0) {
          alert("The file is empty or formatted incorrectly.");
          return;
        }

        setQuestions(parsedQuestions);
        triggerNotification(`Extracted ${parsedQuestions.length} MCQs successfully!`);
      } catch (err) {
        alert("Error parsing CSV. Please check the columns order.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNewSet = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle) {
      alert("Please fill in a set title.");
      return;
    }

    const invalidQuestion = questions.some(q => !q.questionText || q.options.some(opt => !opt));
    if (invalidQuestion) {
      alert("Please fill in all questions and options fully.");
      return;
    }

    const newSet: QuestionSet = {
      id: `set-custom-${Date.now()}`,
      title: newTitle,
      examType: newExamType,
      type: newType,
      yearOrDate: newYearOrDate,
      durationMinutes: newDuration,
      isFree: newIsFree,
      price: newIsFree ? 0 : newPrice,
      questions: questions,
      province: newExamType === "loksewa" && newProvince !== "none" ? newProvince : undefined,
      correctMarks: newCorrectMarks,
      incorrectMarks: newIncorrectMarks
    };

    onSaveSets([...allSets, newSet]);
    
    // Reset forms
    setNewTitle("");
    setQuestions([
      {
        id: `new-q-${Date.now()}`,
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: ""
      }
    ]);
    triggerNotification("Successfully uploaded & published custom MCQ set!");
  };

  const handleTabChange = (newTab: "spreadsheet" | "raw") => {
    if (newTab === "raw" && csvTab === "spreadsheet") {
      const serialized = serializeGridToCSV(gridRows);
      setCsvModalText(serialized);
    } else if (newTab === "spreadsheet" && csvTab === "raw") {
      const parsed = parseCSVToGrid(csvModalText);
      setGridRows(parsed);
    }
    setCsvTab(newTab);
  };

  const renderCSVModal = () => {
    if (!isCSVModalOpen) return null;

    const modalWrapperClass = isCsvFullscreen
      ? "fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen w-screen p-0 max-w-none rounded-none"
      : "fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans";

    const modalContentClass = isCsvFullscreen
      ? "bg-slate-900 w-full h-full flex flex-col"
      : "bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]";

    return (
      <div className={modalWrapperClass}>
        <div className={modalContentClass}>
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Spreadsheet Editor & Synchronizer (Excel Mode)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Editing: {csvModalTarget?.type === "set" ? `Question Set (ID: ${csvModalTarget.setId})` : `Subject Folder "${csvModalTarget?.subjectName}"`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsCsvFullscreen(!isCsvFullscreen)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                {isCsvFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Full Screen Mode</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsCSVModalOpen(false);
                  setCsvModalTarget(null);
                  setCsvModalError(null);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader / Tabs & Tools */}
          <div className="bg-slate-950 border-b border-slate-850 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleTabChange("spreadsheet")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  csvTab === "spreadsheet"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📊 Spreadsheet Grid
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("raw")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  csvTab === "raw"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📝 Raw CSV Text
              </button>
            </div>
            
            {csvTab === "spreadsheet" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newRow = ["", "", "", "", "", "", "0", "", "", ""];
                    setGridRows([...gridRows, newRow]);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-violet-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Row</span>
                </button>
                
                {/* Excel Paste Button */}
                <button
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                    showPasteArea 
                      ? "bg-amber-600/20 border-amber-500 text-amber-300" 
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                  title="Paste clipboard rows copied from Microsoft Excel or Google Sheets"
                >
                  <span>📋 Paste Excel Rows</span>
                </button>

                {/* File Import Button */}
                <label className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all">
                  <span>📥 Import CSV / Sheet</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const text = evt.target?.result as string;
                          if (text) {
                            handleImportSpreadsheetFile(text);
                          }
                        };
                        reader.readAsText(file);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/15"
                  title="Export the spreadsheet contents as a .csv file"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    askConfirmation(
                      "Clear All Rows",
                      "Are you sure you want to clear all spreadsheet rows? This will empty the grid.",
                      () => {
                        setGridRows([]);
                      }
                    );
                  }}
                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Paste Excel Area Panel */}
          {showPasteArea && csvTab === "spreadsheet" && (
            <div className="bg-slate-900/90 border-b border-slate-800/80 p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  📋 Paste Rows Copied from Excel or Google Sheets
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  Columns: ID | Question | OptA | OptB | OptC | OptD | Key (0-3 / A-D) | Explanation | Subject | Topic
                </span>
              </div>
              <textarea
                value={pastedExcelText}
                onChange={(e) => setPastedExcelText(e.target.value)}
                placeholder="Paste your copied Excel rows directly here (with columns separated by tabs)..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handlePasteExcelRows(pastedExcelText);
                    setPastedExcelText("");
                    setShowPasteArea(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Parse & Append Rows
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasteArea(false);
                    setPastedExcelText("");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {csvModalError && (
            <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-6 py-3 text-xs font-semibold">
              ⚠️ {csvModalError}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-slate-950/25">
            {csvTab === "raw" ? (
              <div className="flex flex-col flex-1 gap-4">
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs space-y-2 text-slate-300">
                  <p className="font-bold text-violet-400 uppercase tracking-wider text-[10px]">💡 Instructions & CSV Columns Format:</p>
                  <p className="leading-relaxed">
                    The columns must follow this exact order: <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">ID, Question Text, Option A, Option B, Option C, Option D, Correct Option Index (0-3), Explanation, Subject, Topic</code>
                  </p>
                  <p className="leading-relaxed">
                    • <span className="font-bold text-white">ID:</span> Existing questions have unique serial codes. For new questions, leave this field empty or write <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">""</code> – <span className="text-violet-400 font-semibold">a unique chronological serial ID will be automatically generated</span> upon saving!
                  </p>
                  <p className="leading-relaxed">
                    • <span className="font-bold text-white">Correct Option Index:</span> Must be a number between <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">0</code> (for A) and <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">3</code> (for D).
                  </p>
                  <p className="leading-relaxed">
                    • <span className="font-bold text-white">Double Quotes:</span> Fields containing commas, newlines, or double quotes should be enclosed in double quotes (e.g., <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">"This is a, question"</code>). Escape literal double quotes by doubling them (<code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">""</code>).
                  </p>
                </div>

                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between">
                    <span>Spreadsheet Raw CSV Text</span>
                    <span className="text-slate-500">Edit directly in the editor below</span>
                  </label>
                  <textarea
                    value={csvModalText}
                    onChange={(e) => setCsvModalText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 resize-none flex-1 min-h-[300px]"
                    placeholder="ID,Question Text,Option A,Option B,Option C,Option D,Correct Option Index (0-3),Explanation,Subject,Topic"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {gridRows.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 my-auto">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Your spreadsheet is currently empty.</p>
                    <p className="text-xs text-slate-500 mt-1">Add a new row or switch to Raw CSV Text to import.</p>
                    <button
                      type="button"
                      onClick={() => setGridRows([["", "", "", "", "", "", "0", "", "", ""]])}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Create First Row
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner flex-1 min-h-0">
                      <table className="min-w-full divide-y divide-slate-800 border-collapse text-left relative">
                        <thead className="bg-slate-950 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider sticky top-0 z-30 border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-3 text-center w-12 bg-slate-950 border-r border-slate-800 sticky left-0 z-40">Row</th>
                            <th className="px-3 py-3 w-28 border-r border-slate-850">ID</th>
                            <th className="px-4 py-3 min-w-[320px] border-r border-slate-850">Question Text</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Option A</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Option B</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Option C</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Option D</th>
                            <th className="px-3 py-3 min-w-[150px] border-r border-slate-850">Correct Option</th>
                            <th className="px-4 py-3 min-w-[280px] border-r border-slate-850">Explanation</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Subject</th>
                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-850">Topic</th>
                            <th className="px-3 py-3 text-center w-12 bg-slate-950 sticky right-0 z-40 border-l border-slate-800">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-900/40 font-mono text-xs">
                          {gridRows.map((row, rIdx) => {
                            const cellVal = (cIdx: number) => row[cIdx] || "";
                            const updateCell = (cIdx: number, val: string) => {
                              const copy = [...gridRows];
                              const padded = [...(copy[rIdx] || Array(10).fill(""))];
                              padded[cIdx] = val;
                              copy[rIdx] = padded;
                              setGridRows(copy);
                            };
                            
                            const examType = getModalExamType();
                            const subjectsList = getModalSubjects();
                            const subjectVal = cellVal(8);
                            const topicsList = getTopicsForSubject(subjectVal, examType);
                            
                            return (
                              <tr key={rIdx} className="hover:bg-slate-850/50 transition-colors group">
                                {/* Row Number column */}
                                <td className="px-3 py-2 bg-slate-950 text-center text-[10px] text-slate-500 font-sans font-bold border-r border-slate-850 sticky left-0 z-20 group-hover:bg-slate-900">
                                  {rIdx + 1}
                                </td>
                                {/* ID cell */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(0)}
                                    onChange={(e) => updateCell(0, e.target.value)}
                                    placeholder="Leave for auto-id"
                                    className="w-full bg-transparent border-0 p-1 text-slate-400 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded font-mono placeholder:text-slate-700 focus:outline-none"
                                  />
                                </td>
                                {/* Question Text cell */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <div className="flex flex-col gap-1">
                                    <textarea
                                      value={cellVal(1)}
                                      onChange={(e) => updateCell(1, e.target.value)}
                                      className="w-full min-h-[44px] max-h-[140px] bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded font-sans focus:outline-none resize-y"
                                      rows={1}
                                      placeholder="Type MCQ question text..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setRichCellEdit({ rIdx, cIdx: 1, value: cellVal(1) })}
                                      className="text-[9px] text-emerald-400 hover:text-emerald-300 self-end font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 whitespace-nowrap"
                                    >
                                      <span>🖊️ Rich Editor (+Pic/Table/Chart)</span>
                                    </button>
                                  </div>
                                </td>
                                {/* Option A */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(2)}
                                    onChange={(e) => updateCell(2, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="A"
                                  />
                                </td>
                                {/* Option B */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(3)}
                                    onChange={(e) => updateCell(3, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="B"
                                  />
                                </td>
                                {/* Option C */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(4)}
                                    onChange={(e) => updateCell(4, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="C"
                                  />
                                </td>
                                {/* Option D */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(5)}
                                    onChange={(e) => updateCell(5, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="D"
                                  />
                                </td>
                                {/* Correct Option dropdown */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <select
                                    value={cellVal(6)}
                                    onChange={(e) => updateCell(6, e.target.value)}
                                    className="w-full bg-slate-950 text-emerald-400 border border-slate-800 rounded px-2 py-1 text-xs font-sans font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                  >
                                    <option value="0">0 (Option A)</option>
                                    <option value="1">1 (Option B)</option>
                                    <option value="2">2 (Option C)</option>
                                    <option value="3">3 (Option D)</option>
                                  </select>
                                </td>
                                {/* Explanation cell */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <div className="flex flex-col gap-1">
                                    <textarea
                                      value={cellVal(7)}
                                      onChange={(e) => updateCell(7, e.target.value)}
                                      className="w-full min-h-[44px] max-h-[140px] bg-transparent border-0 p-1 text-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded font-sans focus:outline-none resize-y"
                                      rows={1}
                                      placeholder="Enter reasoning..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setRichCellEdit({ rIdx, cIdx: 7, value: cellVal(7) })}
                                      className="text-[9px] text-emerald-400 hover:text-emerald-300 self-end font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 whitespace-nowrap"
                                    >
                                      <span>🖊️ Rich Editor (+Pic/Table/Chart)</span>
                                    </button>
                                  </div>
                                </td>
                                {/* Subject dropdown */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <div className="flex flex-col gap-1.5">
                                    {!customSubjectRows[rIdx] ? (
                                      <select
                                        value={cellVal(8)}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          updateCell(8, newVal);
                                          const topics = getTopicsForSubject(newVal, examType);
                                          if (topics.length > 0) {
                                            updateCell(9, topics[0]);
                                          } else {
                                            updateCell(9, "General");
                                          }
                                        }}
                                        className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded px-2 py-1 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                      >
                                        <option value="">-- Select Subject --</option>
                                        {subjectsList.map((sub) => (
                                          <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={cellVal(8)}
                                        onChange={(e) => updateCell(8, e.target.value)}
                                        className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded px-2 py-1 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Enter subject"
                                      />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setCustomSubjectRows({
                                        ...customSubjectRows,
                                        [rIdx]: !customSubjectRows[rIdx]
                                      })}
                                      className="text-[9px] text-violet-400 hover:text-violet-300 self-end font-sans font-bold transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      {customSubjectRows[rIdx] ? "Use List Dropdown" : "Write Custom Subject"}
                                    </button>
                                  </div>
                                </td>
                                {/* Topic dropdown */}
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <div className="flex flex-col gap-1.5">
                                    {topicsList.length > 0 && !customTopicRows[rIdx] ? (
                                      <select
                                        value={cellVal(9)}
                                        onChange={(e) => updateCell(9, e.target.value)}
                                        className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded px-2 py-1 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                      >
                                        <option value="">-- Select Topic --</option>
                                        {topicsList.map((t) => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={cellVal(9)}
                                        onChange={(e) => updateCell(9, e.target.value)}
                                        className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded px-2 py-1 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Enter topic"
                                      />
                                    )}
                                    {topicsList.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setCustomTopicRows({
                                          ...customTopicRows,
                                          [rIdx]: !customTopicRows[rIdx]
                                        })}
                                        className="text-[9px] text-violet-400 hover:text-violet-300 self-end font-sans font-bold transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        {customTopicRows[rIdx] ? "Use List Dropdown" : "Write Custom Topic"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                {/* Delete action column */}
                                <td className="px-2 py-2 text-center sticky right-0 z-20 bg-slate-950 group-hover:bg-slate-900 border-l border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = gridRows.filter((_, idx) => idx !== rIdx);
                                      setGridRows(copy);
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 cursor-pointer transition-all"
                                    title="Delete Row"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1 font-sans">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Spreadsheet Sync is Online</span>
                      </span>
                      <span>Total Count: <strong className="text-white text-xs">{gridRows.length}</strong> questions</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCSVModalOpen(false);
                setCsvModalTarget(null);
                setCsvModalError(null);
              }}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCSVModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Changes</span>
            </button>
          </div>

          {/* Rich Content Cell Editor overlay popup modal */}
          {richCellEdit && (
            <div className="fixed inset-0 z-[160] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Rich Content Editor for Cell (Row {richCellEdit.rIdx + 1}, {richCellEdit.cIdx === 1 ? "Question Text" : "Explanation"})
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Insert formatted tables, custom structured flowcharts, and high-quality illustrations/pictures from storage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRichCellEdit(null)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Editor Area */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
                  <RichTextEditor
                    value={richCellEdit.value}
                    onChange={(val) => setRichCellEdit({ ...richCellEdit, value: val })}
                    placeholder="Compose question or explanation content with rich media..."
                  />
                </div>

                {/* Footer */}
                <div className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRichCellEdit(null)}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...gridRows];
                      const padded = [...(copy[richCellEdit.rIdx] || Array(10).fill(""))];
                      padded[richCellEdit.cIdx] = richCellEdit.value;
                      copy[richCellEdit.rIdx] = padded;
                      setGridRows(copy);
                      setRichCellEdit(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/15 cursor-pointer"
                  >
                    Apply to Cell
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const triggerNotification = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  };

  // 1. Detailed FULL SCREEN EDITOR for Selected Set
  if (activeEditSet) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
        
        {/* Editor Title Banner */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveEditSet(null)}
              className="text-slate-400 hover:text-white p-2 bg-slate-950/60 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-violet-400 font-bold text-xs tracking-wider uppercase block mb-0.5">
                DATABASE CONFIGURATION PANEL
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Edit className="w-5.5 h-5.5 text-violet-400" />
                Edit: {activeEditSet.title}
              </h2>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveEditSet(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveActiveEditSet}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Save Configuration Changes
            </button>
          </div>
        </div>

        {/* Set Configuration Options */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            1. Core Metadata Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Paper Title
              </label>
              <input
                type="text"
                value={activeEditSet.title}
                onChange={(e) => handleUpdateEditSetField("title", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target Board Exam
              </label>
              <select
                value={activeEditSet.examType}
                onChange={(e) => handleUpdateEditSetField("examType", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="mec-ug">MEC-UG Undergraduate</option>
                <option value="mec-pg">MEC-PG Postgraduate</option>
                <option value="nmcle">NMCLE Licensing</option>
                <option value="ku-mcq">KU MCQ</option>
                <option value="loksewa">Loksewa Medical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={activeEditSet.type}
                onChange={(e) => handleUpdateEditSetField("type", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="mock-test">Mock Test</option>
                <option value="past-year">Past Year paper</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Timer Duration (mins)
              </label>
              <input
                type="number"
                value={activeEditSet.durationMinutes}
                onChange={(e) => handleUpdateEditSetField("durationMinutes", parseInt(e.target.value) || 5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Price (NPR)
              </label>
              <input
                type="number"
                disabled={activeEditSet.isFree}
                value={activeEditSet.price}
                onChange={(e) => handleUpdateEditSetField("price", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Chronological Date / Year Label
              </label>
              <input
                type="text"
                value={activeEditSet.yearOrDate || ""}
                onChange={(e) => handleUpdateEditSetField("yearOrDate", e.target.value)}
                placeholder="e.g. 2023 or 2024-05"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Correct Marks (+ value)
              </label>
              <input
                type="number"
                step="0.1"
                value={activeEditSet.correctMarks !== undefined ? activeEditSet.correctMarks : 1}
                onChange={(e) => handleUpdateEditSetField("correctMarks", parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                Incorrect Penalty (- coefficient)
              </label>
              <input
                type="number"
                step="0.05"
                value={activeEditSet.incorrectMarks !== undefined ? activeEditSet.incorrectMarks : 0}
                onChange={(e) => handleUpdateEditSetField("incorrectMarks", parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Province Assignment (For Loksewa sets)
              </label>
              <select
                value={activeEditSet.province || "none"}
                onChange={(e) => handleUpdateEditSetField("province", e.target.value === "none" ? undefined : e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="none">None / Not Applicable</option>
                <option value="central">Central Loksewa</option>
                <option value="koshi">Koshi Province</option>
                <option value="bagmati">Bagmati Province</option>
                <option value="madesh">Madhesh Province</option>
                <option value="gandaki">Gandaki Province</option>
                <option value="lumbini">Lumbini Province</option>
                <option value="karnali">Karnali Province</option>
                <option value="sudurpaschim">Sudurpaschim Province</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="edit-is-free"
                checked={activeEditSet.isFree}
                onChange={(e) => {
                  const free = e.target.checked;
                  setActiveEditSet({
                    ...activeEditSet,
                    isFree: free,
                    price: free ? 0 : activeEditSet.price
                  });
                }}
                className="bg-slate-950 border border-slate-800 text-emerald-400 rounded focus:ring-0 w-4 h-4"
              />
              <label htmlFor="edit-is-free" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Mark as Completely Free Set
              </label>
            </div>
          </div>
        </div>

        {/* Edit / Replace MCQ Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. MCQ Bank Configurations ({activeEditSet.questions.length} items)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Upload a CSV file to replace or append questions, or use the interactive editor below.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCSVEditorForSet}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Edit Set as CSV</span>
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="edit-file-uploader"
                  onChange={handleEditMcqFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="edit-file-uploader"
                  className="bg-violet-600/20 hover:bg-violet-600 hover:text-white border border-violet-500/20 text-violet-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload/Replace MCQ file (CSV)
                </label>
              </div>

              <button
                type="button"
                onClick={handleAddEditQuestionRow}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-all"
              >
                + Add Single MCQ Row
              </button>
            </div>
          </div>

          {/* Interactive Question Fields List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-800/60">
            {activeEditSet.questions.map((q, qIdx) => (
              <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-violet-400 uppercase tracking-widest font-mono">Question #{qIdx + 1}</span>
                  {activeEditSet.questions.length > 1 && (
                    <button
                      onClick={() => handleRemoveEditQuestionRow(qIdx)}
                      className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Question Description</label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleUpdateEditQuestionField(qIdx, "questionText", e.target.value)}
                    placeholder="Enter question text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateEditOptionField(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Correct Option Key</label>
                    <select
                      value={q.correctOptionIndex}
                      onChange={(e) => handleUpdateEditQuestionField(qIdx, "correctOptionIndex", parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none"
                    >
                      <option value={0}>A (Option 1)</option>
                      <option value={1}>B (Option 2)</option>
                      <option value={2}>C (Option 3)</option>
                      <option value={3}>D (Option 4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Medical Explanation / Pathophysiology</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleUpdateEditQuestionField(qIdx, "explanation", e.target.value)}
                      placeholder="Add high-yield concept explanation..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-violet-400 uppercase mb-1">Subject Tag</label>
                    <select
                      value={q.subject || ""}
                      onChange={(e) => handleUpdateEditQuestionField(qIdx, "subject", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- No Subject --</option>
                      {ALL_STANDARD_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions block */}
        <div className="flex justify-end gap-3.5 pt-2">
          <button
            onClick={() => setActiveEditSet(null)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            Discard All Changes
          </button>
          <button
            onClick={handleSaveActiveEditSet}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-7 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Save Set Config & MCQs
          </button>
        </div>

        {renderCSVModal()}

      </div>
    );
  }

  // 2. MAIN ADMIN VIEW
  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-violet-400" />
            Admin Control Room
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Instantly upload medical MCQ files, replace question bank keys, tweak set pricing models, configure test timers, or specify province boundaries for Loksewa.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetagDatabase}
          className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] uppercase tracking-wider px-4.5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-2 relative z-10"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Retag All Questions</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 font-semibold text-xs rounded-xl animate-pulse">
          {message}
        </div>
      )}

      {/* Admin Tab Selectors */}
      <div className="flex border-b border-slate-800 flex-wrap">
        <button
          onClick={() => setAdminTab("papers")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            adminTab === "papers"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          📁 MCQ Papers Editor
        </button>
        <button
          onClick={() => setAdminTab("questions")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            adminTab === "questions"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          📂 Subject Folders Pool ({independentQuestions.length})
        </button>
        <button
          onClick={() => setAdminTab("review")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            adminTab === "review"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          🚀 Review Proposed MCQs Queue ({userDraftQuestions.length})
        </button>
        <button
          onClick={() => setAdminTab("reports")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            adminTab === "reports"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Flag className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>User Flagged Issues ({reports.length})</span>
        </button>
        <button
          onClick={() => setAdminTab("cms")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            adminTab === "cms"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <span>🛠️ Visual CMS Control Room</span>
        </button>
      </div>

      {adminTab === "papers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section: Existing sets manager with Dropdown and Subcategories */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Available Question Papers ({allSets.length})
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Filter, categorize and subcategorize available MCQ sets.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam:</span>
              <select
                value={selectedPaperExamFilter}
                onChange={(e) => setSelectedPaperExamFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">🌐 All Target Exams</option>
                {cmsTargetExams.map(exam => (
                  <option key={exam.id} value={exam.id}>🎯 {exam.name} ({exam.id.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {cmsTargetExams
              .filter(exam => selectedPaperExamFilter === "all" || exam.id === selectedPaperExamFilter)
              .map(exam => {
                const examSets = allSets.filter(s => s.examType.toLowerCase() === exam.id.toLowerCase());
                
                if (examSets.length === 0 && selectedPaperExamFilter !== "all") {
                  return (
                    <div key={exam.id} className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-xl text-center">
                      <p className="text-slate-400 text-xs font-semibold">No papers available for <strong>{exam.name}</strong> yet.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Use the custom builder on the right to upload or write questions.</p>
                    </div>
                  );
                }
                if (examSets.length === 0) return null;

                const mockSets = examSets.filter(s => s.type === "mock-test");
                const pastSets = examSets.filter(s => s.type === "past-year");

                return (
                  <div key={exam.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>🎓</span>
                        <span>{exam.name}</span>
                      </h4>
                      <span className="text-[9px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full font-bold">
                        {examSets.length} Sets total
                      </span>
                    </div>

                    {/* Subcategories inside this Target Exam */}
                    <div className="space-y-4">
                      {/* Subcategory 1: Mock Tests */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                            ⚔️ Mock Tests
                          </span>
                          <span className="text-[9px] text-slate-500">({mockSets.length} sets available)</span>
                        </div>
                        {mockSets.length === 0 ? (
                          <p className="text-[10px] text-slate-600 italic pl-3">No active mock test sets in this subcategory.</p>
                        ) : (
                          <div className="space-y-2.5 pl-2">
                            {mockSets.map(set => (
                              <div 
                                key={set.id}
                                className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">{set.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                    <span className="uppercase text-violet-400 font-bold">{set.examType}</span>
                                    <span>•</span>
                                    <span className="text-slate-400">{set.questions.length} Questions</span>
                                    {set.province && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-400 font-bold uppercase">{set.province}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex gap-3 mt-2 text-[10px]">
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" /> {set.durationMinutes} mins
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-emerald-400" /> {set.isFree ? "Free Access" : `Rs. ${set.price}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 w-full md:w-auto justify-end">
                                  <button
                                    onClick={() => handleEditClick(set)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                                  >
                                    <Edit className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(set.id)}
                                    className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-semibold p-2 rounded-lg text-[10px] cursor-pointer transition-colors border border-red-500/5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Subcategory 2: Past Year Papers */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 pt-1">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded">
                            📜 Past Board Papers
                          </span>
                          <span className="text-[9px] text-slate-500">({pastSets.length} sets available)</span>
                        </div>
                        {pastSets.length === 0 ? (
                          <p className="text-[10px] text-slate-600 italic pl-3">No official past paper sets in this subcategory.</p>
                        ) : (
                          <div className="space-y-2.5 pl-2">
                            {pastSets.map(set => (
                              <div 
                                key={set.id}
                                className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">{set.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                    <span className="uppercase text-violet-400 font-bold">{set.examType}</span>
                                    <span>•</span>
                                    <span className="text-slate-400">{set.questions.length} Questions</span>
                                    {set.province && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-400 font-bold uppercase">{set.province}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex gap-3 mt-2 text-[10px]">
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" /> {set.durationMinutes} mins
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-emerald-400" /> {set.isFree ? "Free Access" : `Rs. ${set.price}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 w-full md:w-auto justify-end">
                                  <button
                                    onClick={() => handleEditClick(set)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                                  >
                                    <Edit className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(set.id)}
                                    className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-semibold p-2 rounded-lg text-[10px] cursor-pointer transition-colors border border-red-500/5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Section: Add custom paper set */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Create Custom Set
            </h3>
            <p className="text-xs text-slate-400 mt-1">Upload a CSV sheet or construct MCQs interactively to publish a new paper.</p>
          </div>

          <form onSubmit={handleCreateNewSet} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Paper Title / Description
              </label>
              <input
                type="text"
                placeholder="e.g., MEC-UG Parasitology Booster"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Exam Type
                </label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {cmsContent?.targetExams && cmsContent.targetExams.length > 0 ? (
                    cmsContent.targetExams.map((exam: any) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name || exam.code || exam.id}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="mec-ug">MEC-UG</option>
                      <option value="mec-pg">MEC-PG</option>
                      <option value="nmcle">NMCLE</option>
                      <option value="ku-mcq">KU MCQ</option>
                      <option value="loksewa">Loksewa</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic Category
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="mock-test">Mock Test</option>
                  <option value="past-year">Past Year paper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Price in Rs.
                </label>
                <input
                  type="number"
                  disabled={newIsFree}
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs disabled:opacity-40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Correct Marks (+ value)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newCorrectMarks}
                  onChange={(e) => setNewCorrectMarks(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                  Incorrect Penalty (- coefficient)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={newIncorrectMarks}
                  onChange={(e) => setNewIncorrectMarks(parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            {newExamType === "loksewa" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Province Assignment
                </label>
                <select
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="none">None / Not Applicable</option>
                  <option value="central">Central Loksewa</option>
                  <option value="koshi">Koshi Province</option>
                  <option value="bagmati">Bagmati Province</option>
                  <option value="madesh">Madhesh Province</option>
                  <option value="gandaki">Gandaki Province</option>
                  <option value="lumbini">Lumbini Province</option>
                  <option value="karnali">Karnali Province</option>
                  <option value="sudurpaschim">Sudurpaschim Province</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-is-free"
                checked={newIsFree}
                onChange={(e) => setNewIsFree(e.target.checked)}
                className="bg-slate-950 border border-slate-800 text-emerald-400 rounded focus:ring-0 w-4 h-4"
              />
              <label htmlFor="new-is-free" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Offer this set as Free
              </label>
            </div>

            {/* MCQ Upload/Build Row */}
            <div className="border-t border-slate-800/80 pt-4 space-y-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5">
                <UploadCloud className="w-6 h-6 text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300">File Auto-Extraction</span>
                <p className="text-[9px] text-slate-500">Order: question, opt_a, opt_b, opt_c, opt_d, key, explanation</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="new-set-file-uploader"
                  onChange={handleNewSetMcqFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="new-set-file-uploader"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-emerald-500/20 cursor-pointer transition-all mt-1 inline-block"
                >
                  Upload MCQ Sheet (.csv)
                </label>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Questions ({questions.length})</p>
                <button
                  type="button"
                  onClick={handleAddQuestionRow}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold bg-slate-950/60 border border-slate-800 px-2 py-1 rounded cursor-pointer"
                >
                  + Add Single MCQ
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-violet-400">MCQ #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            askConfirmation(
                              "Remove Question",
                              "Are you sure you want to remove this question from the set?",
                              () => {
                                setQuestions(questions.filter((_, idx) => idx !== qIdx));
                              }
                            );
                          }}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Question Description"
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestionField(qIdx, "questionText", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-500">{String.fromCharCode(65 + optIdx)}</span>
                          <input
                            type="text"
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => handleUpdateOptionField(qIdx, optIdx, e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white text-[11px]"
                          />
                        </div>
                      ))}
                    </div>

                     <div className="grid grid-cols-3 gap-2 text-xs">
                      <select
                        value={q.correctOptionIndex}
                        onChange={(e) => handleUpdateQuestionField(qIdx, "correctOptionIndex", parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                      >
                        <option value={0}>Key: A</option>
                        <option value={1}>Key: B</option>
                        <option value={2}>Key: C</option>
                        <option value={3}>Key: D</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Explanation..."
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestionField(qIdx, "explanation", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                      />

                      <select
                        value={q.subject || ""}
                        onChange={(e) => handleUpdateQuestionField(qIdx, "subject", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                      >
                        <option value="">-- No Subject --</option>
                        {ALL_STANDARD_SUBJECTS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-violet-600/10"
            >
              <UploadCloud className="w-4 h-4" /> Save & Publish Custom MCQ Set
            </button>
          </form>
        </div>

      </div>
      )}

      {/* CONDITIONAL ADMIN VIEWS */}

      {/* 2. SUBJECT FOLDERS POOL VIEW */}
      {adminTab === "questions" && (
        <div className="space-y-6">
          {selectedSubjectFolder === null ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                    <span>Independent MCQ Folder Directories</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click a syllabus folder to manage, search, and edit independent medical exam questions chronologically.
                  </p>
                </div>
                {/* Target Exam Focus Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 select-none">Focus Exam:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminTargetExam("mec-ug");
                      setSelectedSubjectFolder(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      adminTargetExam === "mec-ug"
                        ? "bg-violet-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    MEC-UG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminTargetExam("mec-pg");
                      setSelectedSubjectFolder(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      adminTargetExam !== "mec-ug"
                        ? "bg-violet-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Others (PG & Licensing)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(adminTargetExam === "mec-ug"
                  ? ["Physics", "Chemistry", "Botany", "Zoology", "MAT"]
                  : ALL_STANDARD_SUBJECTS
                ).map((sub) => {
                  const qCount = independentQuestions.filter(q => q.subject === sub).length;
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => {
                        setSelectedSubjectFolder(sub);
                        setCreationMode("interactive");
                        setAdminBulkParsedQuestions([]);
                        setAdminBulkFileError("");
                        // Set default topic if it is a UG subject folder
                        const ugCat = MEC_UG_CLASSIFICATION.find(c => c.subject === sub);
                        if (ugCat && ugCat.topics.length > 0) {
                          setNewIndTopic(ugCat.topics[0].name);
                          setAdminBulkTopic(ugCat.topics[0].name);
                        } else {
                          setNewIndTopic("");
                          setAdminBulkTopic("");
                        }
                      }}
                      className="text-left bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-violet-500/50 p-5 rounded-2xl transition-all cursor-pointer group flex items-start gap-4 shadow-md"
                    >
                      <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-violet-500/10 text-amber-400 group-hover:text-violet-400 transition-colors shrink-0">
                        <Folder className="w-6 h-6 fill-amber-400/10 group-hover:fill-violet-400/10" />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                          {sub} Folder
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {qCount} {qCount === 1 ? "MCQ" : "MCQs"} cataloged
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 self-center transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            (() => {
              const isUgSubject = ["Physics", "Chemistry", "Botany", "Zoology", "MAT"].includes(selectedSubjectFolder || "");
              const matchingUgCategory = MEC_UG_CLASSIFICATION.find(cat => cat.subject === selectedSubjectFolder);
              const ugTopics = matchingUgCategory ? matchingUgCategory.topics.map(t => t.name) : [];

              const handleAdminBulkCSVSubmit = () => {
                if (adminBulkParsedQuestions.length === 0) return;

                const topicValue = isUgSubject ? adminBulkTopic : "General";

                let tempIndependent = [...independentQuestions];
                const allSetsQuestions = allSets.flatMap(s => s.questions);

                const finalQuestions = adminBulkParsedQuestions.map((q) => {
                  const newId = generateQuestionIdForSubject(
                    selectedSubjectFolder!,
                    topicValue,
                    tempIndependent,
                    allSetsQuestions
                  );
                  const newQ = {
                    ...q,
                    id: newId,
                    subject: selectedSubjectFolder!,
                    topic: topicValue
                  };
                  tempIndependent.push(newQ);
                  return newQ;
                });

                const updated = tempIndependent;
                onSaveIndependentQuestions(updated);

                setAdminBulkParsedQuestions([]);
                setAdminBulkFileError("");
                setShowCreateIndependentForm(false);
                setMessage(`🚀 Successfully bulk uploaded and published ${finalQuestions.length} MCQs into ${selectedSubjectFolder} Folder Pool!`);
              };

              const handleAdminBulkCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAdminBulkFileError("");
                setAdminBulkParsedQuestions([]);

                const reader = new FileReader();
                reader.onload = (evt) => {
                  try {
                    const text = evt.target?.result as string;
                    if (!text) {
                      setAdminBulkFileError("Uploaded file is empty.");
                      return;
                    }

                    const parsed = extractQuestionsFromCSV(text);
                    if (parsed.length === 0) {
                      setAdminBulkFileError("No data rows found in the CSV file.");
                      return;
                    }

                    setAdminBulkParsedQuestions(parsed);
                    triggerNotification(`Extracted ${parsed.length} MCQs successfully!`);
                  } catch (err) {
                    setAdminBulkFileError("Failed to parse file. Make sure it's a valid CSV file.");
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              };

              return (
                <div className="space-y-6">
                  {/* Folder Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubjectFolder(null);
                          setShowCreateIndependentForm(false);
                          setActiveEditIndependentId(null);
                        }}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 mb-2 cursor-pointer transition-colors"
                      >
                        ← Back to Folder Directories
                      </button>
                      <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-amber-400" />
                        <span>{selectedSubjectFolder} Folder Pool</span>
                        <span className="bg-slate-850 border border-slate-750 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                          {independentQuestions.filter(q => q.subject === selectedSubjectFolder).length} Questions
                        </span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {selectedSubjectFolder && (
                        <button
                          type="button"
                          onClick={() => handleOpenCSVEditorForSubject(selectedSubjectFolder)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Edit Folder as CSV</span>
                        </button>
                      )}
                      {!showCreateIndependentForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateIndependentForm(true);
                            setCreationMode("interactive");
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/10 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Create / Bulk Upload MCQ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Show Create / Bulk Form */}
                  {showCreateIndependentForm && (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
                        <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850 select-none">
                          <button
                            type="button"
                            onClick={() => setCreationMode("interactive")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              creationMode === "interactive"
                                ? "bg-violet-600 text-white shadow"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            ✍️ Write Interactively
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreationMode("bulk")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              creationMode === "bulk"
                                ? "bg-violet-600 text-white shadow"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            📥 Bulk CSV Upload
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowCreateIndependentForm(false)}
                          className="text-slate-400 hover:text-white self-end sm:self-auto p-1 bg-slate-950 rounded-lg hover:bg-slate-850 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {creationMode === "interactive" ? (
                        <form onSubmit={handleAddIndependentQuestion} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                MCQ Question Text (Visual Formatting & Tables supported)
                              </label>
                              <RichTextEditor
                                value={newIndQuestionText}
                                onChange={setNewIndQuestionText}
                                placeholder="Type your question stem here... Drag diagrams or insert flowcharts."
                              />
                            </div>

                            {isUgSubject ? (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                  Syllabus Topic Tag
                                </label>
                                <select
                                  value={newIndTopic}
                                  onChange={(e) => setNewIndTopic(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                                >
                                  {ugTopics.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            ) : null}

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Correct Option (Correct Answer Key)
                              </label>
                              <select
                                value={newIndCorrectIdx}
                                onChange={(e) => setNewIndCorrectIdx(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                              >
                                <option value={0}>Option A is Correct</option>
                                <option value={1}>Option B is Correct</option>
                                <option value={2}>Option C is Correct</option>
                                <option value={3}>Option D is Correct</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Four Answer Choices (A, B, C, D)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {newIndOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center select-none">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const copy = [...newIndOptions];
                                      copy[oIdx] = e.target.value;
                                      setNewIndOptions(copy);
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                    className="bg-transparent flex-1 focus:outline-none text-xs text-white placeholder-slate-600 font-medium"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Detailed Explanation, Rationale & Study References
                            </label>
                            <RichTextEditor
                              value={newIndExplanation}
                              onChange={setNewIndExplanation}
                              placeholder="Detail the clinical explanation for the correct choice and explain why distractors are incorrect."
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateIndependentForm(false);
                                setNewIndQuestionText("");
                                setNewIndOptions(["", "", "", ""]);
                                setNewIndExplanation("");
                              }}
                              className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Discard
                            </button>
                            <button
                              type="submit"
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save & Add to Pool Directory</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          {isUgSubject && (
                            <div className="max-w-xs">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Select Topic Tag for Bulk Upload
                              </label>
                              <select
                                value={adminBulkTopic}
                                onChange={(e) => setAdminBulkTopic(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                              >
                                {ugTopics.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-8 text-center transition-colors relative">
                            <input
                              type="file"
                              accept=".csv,.txt"
                              onChange={handleAdminBulkCSVUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            <p className="text-xs font-bold text-white mb-1">Upload CSV spreadsheet of MCQs</p>
                            <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                              CSV format requirements: Question Stem, Option A, Option B, Option C, Option D, Correct Key (A/B/C/D or 0/1/2/3), Explanation text.
                            </p>
                          </div>

                          {adminBulkFileError && (
                            <p className="text-xs font-bold text-red-400">{adminBulkFileError}</p>
                          )}

                          {adminBulkParsedQuestions.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-850">
                                <span className="text-[11px] font-extrabold text-violet-400 font-mono">
                                  Parsed {adminBulkParsedQuestions.length} Questions
                                </span>
                                <button
                                  type="button"
                                  onClick={handleAdminBulkCSVSubmit}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] px-4 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Publish All parsed MCQs</span>
                                </button>
                              </div>

                              <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800 bg-slate-950 border border-slate-850 rounded-xl p-3">
                                {adminBulkParsedQuestions.map((q, idx) => (
                                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                                    <p className="font-bold text-white">Q{idx + 1}: {q.questionText}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-400 text-[10px]">
                                      <span>A: {q.options[0]}</span>
                                      <span>B: {q.options[1]}</span>
                                      <span>C: {q.options[2]}</span>
                                      <span>D: {q.options[3]}</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                                      Correct: {String.fromCharCode(65 + q.correctOptionIndex)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subject MCQs Chronological List */}
                  <div className="space-y-4">
                    {independentQuestions.filter(q => q.subject === selectedSubjectFolder).length === 0 ? (
                      <div className="text-center py-12 bg-slate-950/40 border border-slate-850 rounded-2xl">
                        <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-white text-sm font-bold">No Questions in this Folder</p>
                        <p className="text-slate-400 text-xs mt-1">
                          Click the create button above to add your first high-yield MCQ to {selectedSubjectFolder}!
                        </p>
                      </div>
                    ) : (
                      independentQuestions
                        .filter(q => q.subject === selectedSubjectFolder)
                        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }))
                        .map((q) => {
                          const isEditing = activeEditIndependentId === q.id;
                          return (
                            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                              {isEditing ? (
                                <div className="p-6 space-y-4 bg-slate-900">
                                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                    <h4 className="text-xs font-bold text-violet-400 font-mono">
                                      ✏️ EDITING MCQ QUESTION: {q.id}
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => setActiveEditIndependentId(null)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Question Text</label>
                                      <RichTextEditor value={editIndQuestionText} onChange={setEditIndQuestionText} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {isUgSubject ? (
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 font-mono">Topic Tag</label>
                                          <select
                                            value={editIndTopic}
                                            onChange={(e) => setEditIndTopic(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                                          >
                                            {ugTopics.map(t => (
                                              <option key={t} value={t}>{t}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : null}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Correct Option Index</label>
                                        <select
                                          value={editIndCorrectIdx}
                                          onChange={(e) => setEditIndCorrectIdx(parseInt(e.target.value))}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none font-bold"
                                        >
                                          <option value={0}>Option A is Correct</option>
                                          <option value={1}>Option B is Correct</option>
                                          <option value={2}>Option C is Correct</option>
                                          <option value={3}>Option D is Correct</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase">MCQ Options</label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {editIndOptions.map((opt, oIdx) => (
                                          <div key={oIdx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                                            <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 flex items-center justify-center select-none">
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <input
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                const copy = [...editIndOptions];
                                                copy[oIdx] = e.target.value;
                                                setEditIndOptions(copy);
                                              }}
                                              className="bg-transparent flex-1 focus:outline-none text-xs text-white"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detailed Explanation & Rationale</label>
                                      <RichTextEditor value={editIndExplanation} onChange={setEditIndExplanation} />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => setActiveEditIndependentId(null)}
                                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSaveEditIndependentQuestion}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                                      >
                                        <Save className="w-4 h-4" />
                                        <span>Save Question Changes</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-5 sm:p-6 space-y-4">
                                  {/* Metadata Badge */}
                                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                                        QID: {q.id}
                                      </span>
                                      <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                                        🏷️ {q.topic || "General"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleStartEditIndependentQuestion(q)}
                                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                        title="Edit Question"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteIndependentQuestion(q.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                        title="Delete Question"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Question STEM */}
                                  <div className="space-y-3">
                                    <div 
                                      className="text-white text-sm leading-relaxed prose prose-invert font-sans"
                                      dangerouslySetInnerHTML={{ __html: q.questionText }}
                                    />

                                    {/* MCQ Choices Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                      {q.options.map((opt, oIdx) => {
                                        const isCorrect = q.correctOptionIndex === oIdx;
                                        return (
                                          <div
                                            key={oIdx}
                                            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                                              isCorrect
                                                ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                                                : "bg-slate-950 border-slate-850 text-slate-400"
                                            }`}
                                          >
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                              isCorrect
                                                ? "bg-emerald-500 text-slate-950"
                                                : "bg-slate-900 border border-slate-800 text-slate-500"
                                            }`}>
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span className="text-xs leading-normal font-medium">{opt}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Explanation */}
                                  {q.explanation && (
                                    <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 mt-3 space-y-2">
                                      <h5 className="text-[10px] font-black tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Official Explanation & Study Rationales</span>
                                      </h5>
                                      <div 
                                        className="text-xs text-slate-300 leading-relaxed prose prose-invert font-sans"
                                        dangerouslySetInnerHTML={{ __html: q.explanation }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 3. USER PROPOSED DRAFTS REVIEW QUEUE */}
      {adminTab === "review" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-400" />
                <span>Student Proposed MCQs Queue</span>
                <span className="bg-slate-850 border border-slate-750 text-slate-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {userDraftQuestions.length} Pending
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Proofread, review formatting, edit option rationales, and officially publish candidate submissions. Approved questions will automatically be assigned a chronological QID.
              </p>
            </div>
            {userDraftQuestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleBulkRejectDrafts}
                  className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Bulk Reject All ({userDraftQuestions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkAcceptDrafts}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Bulk Accept All ({userDraftQuestions.length})</span>
                </button>
              </div>
            )}
          </div>

          {activeReviewDraftId && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-violet-400 animate-pulse" />
                  <span>Review and Format Proposed Question ({activeReviewDraftId})</span>
                </h4>
                <button
                  onClick={() => setActiveReviewDraftId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Syllabus Subject</label>
                    <select
                      value={reviewSubject}
                      onChange={(e) => setReviewSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    >
                      {ALL_STANDARD_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Topic Tag</label>
                    <input
                      type="text"
                      value={reviewTopic}
                      onChange={(e) => setReviewTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Question Text</label>
                  <RichTextEditor value={reviewQuestionText} onChange={setReviewQuestionText} />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">MCQ Answers (Select correct option with radio/dropdown)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reviewOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center select-none">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...reviewOptions];
                            copy[oIdx] = e.target.value;
                            setReviewOptions(copy);
                          }}
                          className="bg-transparent flex-1 focus:outline-none text-xs text-white"
                        />
                        <input
                          type="radio"
                          name="reviewCorrectRadio"
                          checked={reviewCorrectIdx === oIdx}
                          onChange={() => setReviewCorrectIdx(oIdx)}
                          className="accent-violet-500 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detailed Explanation & Study Notes</label>
                  <RichTextEditor value={reviewExplanation} onChange={setReviewExplanation} />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setActiveReviewDraftId(null)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectDraft(activeReviewDraftId)}
                    className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Reject & Trash Draft
                  </button>
                  <button
                    onClick={handlePublishDraft}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center gap-1.5 animate-pulse"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Publish to System</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {userDraftQuestions.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 border border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3.5" />
                <p className="text-white text-base font-extrabold">Queue Clean and Balanced!</p>
                <p className="text-slate-400 text-xs mt-1">
                  There are currently no proposed student submissions waiting for editor proofing.
                </p>
              </div>
            ) : (
              userDraftQuestions.map((draft) => (
                <div key={draft.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-750 transition-all space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-md">
                        {draft.id}
                      </span>
                      <span className="bg-violet-500/10 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {draft.subject}
                      </span>
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {draft.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptDraftDirect(draft)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartReviewDraft(draft)}
                        className="bg-violet-600/20 hover:bg-violet-600 hover:text-white border border-violet-500/25 text-violet-400 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Review & Format</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectDraft(draft.id)}
                        className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div 
                      className="text-white text-sm leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: draft.questionText }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {draft.options.map((opt, oIdx) => {
                        const isCorrect = draft.correctOptionIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                              isCorrect 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                : "bg-slate-950 border-slate-850 text-slate-400"
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect 
                                ? "bg-emerald-500 text-slate-950" 
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-xs">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {draft.explanation && (
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Submitted Explanation</p>
                        <div 
                          className="text-xs text-slate-300 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: draft.explanation }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. REPORTS DASHBOARD VIEW */}
      {adminTab === "reports" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-4.5 h-4.5 text-red-500" />
                <span>User Correction Reports Dashboard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                A summary of candidate-submitted errata, spelling fixes, or option correction reports.
              </p>
            </div>
            <button 
              onClick={fetchReports}
              disabled={loadingReports}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl px-4 py-2 text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? "animate-spin" : ""}`} />
              <span>Refresh Reports Database</span>
            </button>
          </div>

          {loadingReports && reports.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs italic animate-pulse">
              Loading errata reports registry...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-white text-sm font-bold">Clean Database Slate!</p>
              <p className="text-slate-400 text-xs mt-1">No candidate correction flags are currently pending review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-all space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      <span>Report #{report.id.substring(report.id.length - 6)}</span>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Flagged MCQ Question text</p>
                      <p className="text-xs text-white leading-normal font-medium mt-1">"{report.questionText}"</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">QID: {report.questionId}</p>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                      <p className="text-[9px] text-red-400 uppercase font-bold tracking-wider">Candidate Feedback Detail</p>
                      <p className="text-xs text-slate-200 mt-1 font-sans leading-relaxed whitespace-pre-wrap">{report.issueText}</p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-850 flex justify-end">
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Mark Resolved / Dismiss Errata
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. VISUAL CMS CONTROL ROOM */}
      {adminTab === "cms" && (
        <CmsControlPanel
          cmsBrandName={cmsBrandName}
          setCmsBrandName={setCmsBrandName}
          cmsLoginLabels={cmsLoginLabels}
          setCmsLoginLabels={setCmsLoginLabels}
          cmsAboutTitle={cmsAboutTitle}
          setCmsAboutTitle={setCmsAboutTitle}
          cmsAboutSubtitle={cmsAboutSubtitle}
          setCmsAboutSubtitle={setCmsAboutSubtitle}
          cmsAboutBody={cmsAboutBody}
          setCmsAboutBody={setCmsAboutBody}
          cmsSidebarItems={cmsSidebarItems}
          setCmsSidebarItems={setCmsSidebarItems}
          cmsLeaderboardConfig={cmsLeaderboardConfig}
          setCmsLeaderboardConfig={setCmsLeaderboardConfig}
          cmsMecUgClassification={cmsMecUgClassification}
          setCmsMecUgClassification={setCmsMecUgClassification}
          cmsMecPgClassification={cmsMecPgClassification}
          setCmsMecPgClassification={setCmsMecPgClassification}
          cmsEditorialTeam={cmsEditorialTeam}
          setCmsEditorialTeam={setCmsEditorialTeam}
          cmsDashboardConfig={cmsDashboardConfig}
          setCmsDashboardConfig={setCmsDashboardConfig}
          cmsSavedQuestionsConfig={cmsSavedQuestionsConfig}
          setCmsSavedQuestionsConfig={setCmsSavedQuestionsConfig}
          cmsMyReportConfig={cmsMyReportConfig}
          setCmsMyReportConfig={setCmsMyReportConfig}
          cmsDiscussionForumConfig={cmsDiscussionForumConfig}
          setCmsDiscussionForumConfig={setCmsDiscussionForumConfig}
          cmsSupportConfig={cmsSupportConfig}
          setCmsSupportConfig={setCmsSupportConfig}
          cmsPricingConfig={cmsPricingConfig}
          setCmsPricingConfig={setCmsPricingConfig}
          cmsButtonStyles={cmsButtonStyles}
          setCmsButtonStyles={setCmsButtonStyles}
          cmsTargetExams={cmsTargetExams}
          setCmsTargetExams={setCmsTargetExams}
          cmsSubscriptionConfig={cmsSubscriptionConfig}
          setCmsSubscriptionConfig={setCmsSubscriptionConfig}
          cmsReferEarnConfig={cmsReferEarnConfig}
          setCmsReferEarnConfig={setCmsReferEarnConfig}
          handleSaveCMS={handleSaveCMS}
          isSavingCms={isSavingCms}
        />
      )}

      {false && adminTab === "cms" && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Header Actions */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>🛠️</span>
                <span>App-wide Dynamic Content CMS Control Room</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize brand names, sidebars, active exam subjects, topic weights, leaderboard standing candidates, and about support profiles. No code required.
              </p>
            </div>
            <button
              onClick={handleSaveCMS}
              disabled={isSavingCms}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
            >
              {isSavingCms ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Server...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save CMS Modifications</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Global Settings */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <span>🌐</span>
              <span>1. Application Branding Settings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">App Brand Name</label>
                <input
                  type="text"
                  value={cmsBrandName}
                  onChange={(e) => setCmsBrandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. NepalMed Premium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sidebar Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📑</span>
                <span>2. Sidebar Navigation Items & Labels (Tabs Editor)</span>
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <div className="col-span-2">Tab Key</div>
                <div className="col-span-5">Navigation Menu Label</div>
                <div className="col-span-3">Ordering Priority</div>
                <div className="col-span-2 text-right">Visible Tab</div>
              </div>

              {cmsSidebarItems.map((item, idx) => {
                return (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="col-span-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono font-bold text-violet-400">
                        {item.id}
                      </span>
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const list = [...cmsSidebarItems];
                          list[idx].label = e.target.value;
                          setCmsSidebarItems(list);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.order}
                        onChange={(e) => {
                          const list = [...cmsSidebarItems];
                          list[idx].order = parseInt(e.target.value) || 0;
                          setCmsSidebarItems(list);
                        }}
                        className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white text-center focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...cmsSidebarItems];
                          list[idx].enabled = !list[idx].enabled;
                          setCmsSidebarItems(list);
                        }}
                        className={`text-xs font-black px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          item.enabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}
                      >
                        {item.enabled ? "ACTIVE" : "HIDDEN"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: MEC-UG Syllabus */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📐</span>
                <span>3. MEC-UG Subject Categories & Target Marks Weightage</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCmsMecUgClassification([
                    ...cmsMecUgClassification,
                    { subject: "New Subject", icon: "🧬", weight: 20, topics: [] }
                  ]);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add UG Subject</span>
              </button>
            </div>

            <div className="space-y-6">
              {cmsMecUgClassification.map((sub, sIdx) => {
                return (
                  <div key={sIdx} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={sub.icon}
                          onChange={(e) => {
                            const list = [...cmsMecUgClassification];
                            list[sIdx].icon = e.target.value;
                            setCmsMecUgClassification(list);
                          }}
                          className="w-12 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-violet-500"
                          placeholder="Icon"
                        />
                        <input
                          type="text"
                          value={sub.subject}
                          onChange={(e) => {
                            const list = [...cmsMecUgClassification];
                            list[sIdx].subject = e.target.value;
                            setCmsMecUgClassification(list);
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...cmsMecUgClassification];
                            list[sIdx].enabled = list[sIdx].enabled === false ? true : false;
                            setCmsMecUgClassification(list);
                          }}
                          className={`text-[10px] font-black px-2 py-1 rounded transition-colors cursor-pointer ${
                            sub.enabled !== false
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}
                        >
                          {sub.enabled !== false ? "VISIBLE" : "HIDDEN"}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black text-slate-400">Weightage</span>
                          <input
                            type="number"
                            value={sub.weight}
                            onChange={(e) => {
                              const list = [...cmsMecUgClassification];
                              list[sIdx].weight = parseInt(e.target.value) || 0;
                              setCmsMecUgClassification(list);
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-white focus:outline-none focus:border-violet-500"
                          />
                          <span className="text-[10px] font-mono text-slate-500">Marks</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const list = cmsMecUgClassification.filter((_, i) => i !== sIdx);
                            setCmsMecUgClassification(list);
                          }}
                          className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Topics Sub-Grid */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Syllabus Topics ({sub.topics?.length || 0})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...cmsMecUgClassification];
                            if (!list[sIdx].topics) list[sIdx].topics = [];
                            list[sIdx].topics.push({ name: "New Topic", icon: "⭐", weight: 2, enabled: true });
                            setCmsMecUgClassification(list);
                          }}
                          className="text-[10px] font-extrabold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Topic</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(sub.topics || []).map((topic: any, tIdx: number) => {
                          return (
                            <div key={tIdx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2.5 hover:border-slate-750 transition-colors">
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={topic.icon}
                                  onChange={(e) => {
                                    const list = [...cmsMecUgClassification];
                                    list[sIdx].topics[tIdx].icon = e.target.value;
                                    setCmsMecUgClassification(list);
                                  }}
                                  className="w-9 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-xs text-center text-white focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={topic.name}
                                  onChange={(e) => {
                                    const list = [...cmsMecUgClassification];
                                    list[sIdx].topics[tIdx].name = e.target.value;
                                    setCmsMecUgClassification(list);
                                  }}
                                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white flex-1 focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...cmsMecUgClassification];
                                    list[sIdx].topics[tIdx].enabled = list[sIdx].topics[tIdx].enabled === false ? true : false;
                                    setCmsMecUgClassification(list);
                                  }}
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                    topic.enabled !== false
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-slate-900 text-slate-500 border border-slate-800"
                                  }`}
                                  title="Toggle Topic Visibility"
                                >
                                  {topic.enabled !== false ? "ACTIVE" : "HIDDEN"}
                                </button>
                                <input
                                  type="number"
                                  value={topic.weight}
                                  onChange={(e) => {
                                    const list = [...cmsMecUgClassification];
                                    list[sIdx].topics[tIdx].weight = parseInt(e.target.value) || 0;
                                    setCmsMecUgClassification(list);
                                  }}
                                  className="w-12 bg-slate-900 border border-slate-800 rounded-lg px-1 py-1 text-xs text-center text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...cmsMecUgClassification];
                                    list[sIdx].topics = list[sIdx].topics.filter((_: any, i: number) => i !== tIdx);
                                    setCmsMecUgClassification(list);
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: MEC-PG Subjects */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span>🩺</span>
                <h3 className="text-sm font-bold text-white">4. MEC-PG / Licensing Subject Categories, Icons & Weights</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Edit Exam:</span>
                  <select
                    value={adminPgFilterExam}
                    onChange={(e) => setAdminPgFilterExam(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500 font-bold font-sans cursor-pointer"
                  >
                    <option value="mec-pg">🩺 MEC-PG (MD/MS)</option>
                    <option value="nmcle">🇳🇵 NMCLE (Medical)</option>
                    <option value="ku-mcq">🎓 KU Undergraduate</option>
                    <option value="loksewa">🏛️ Loksewa Healthcare</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCmsMecPgClassification([
                      ...cmsMecPgClassification,
                      { 
                        category: "preclinical", 
                        subject: "New Subject", 
                        icon: "🧬", 
                        weight: 10, 
                        targetExam: adminPgFilterExam,
                        enabled: true 
                      }
                    ]);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <div className="col-span-3">Classification</div>
                <div className="col-span-1 text-center font-bold">Icon</div>
                <div className="col-span-4">Subject Name</div>
                <div className="col-span-2 text-center font-bold">Weight</div>
                <div className="col-span-1 text-center font-bold">Visible</div>
                <div className="col-span-1 text-right font-bold">Delete</div>
              </div>

              {cmsMecPgClassification.map((item, idx) => {
                // Determine if this subject belongs to the current selected exam
                const itemExam = item.targetExam || "mec-pg";
                if (itemExam !== adminPgFilterExam) return null;

                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 hover:border-slate-800 transition-all">
                    <div className="col-span-3">
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const list = [...cmsMecPgClassification];
                          list[idx].category = e.target.value as any;
                          setCmsMecPgClassification(list);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="preclinical">Preclinical</option>
                        <option value="clinical">Clinical</option>
                        <option value="short">Short</option>
                      </select>
                    </div>

                    <div className="col-span-1 text-center">
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => {
                          const list = [...cmsMecPgClassification];
                          list[idx].icon = e.target.value;
                          setCmsMecPgClassification(list);
                        }}
                        className="w-12 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.subject}
                        onChange={(e) => {
                          const list = [...cmsMecPgClassification];
                          list[idx].subject = e.target.value;
                          setCmsMecPgClassification(list);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => {
                          const list = [...cmsMecPgClassification];
                          list[idx].weight = parseInt(e.target.value) || 0;
                          setCmsMecPgClassification(list);
                        }}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...cmsMecPgClassification];
                          list[idx].enabled = list[idx].enabled === false ? true : false;
                          setCmsMecPgClassification(list);
                        }}
                        className={`text-[9px] font-black px-2 py-1.5 rounded-lg transition-colors cursor-pointer w-full text-center ${
                          item.enabled !== false
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}
                      >
                        {item.enabled !== false ? "ACTIVE" : "HIDDEN"}
                      </button>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const list = cmsMecPgClassification.filter((_, i) => i !== idx);
                          setCmsMecPgClassification(list);
                        }}
                        className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Leaderboard Config */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🏆</span>
                <span>5. Dynamic Leaderboard Headers & Active Simulated Competitors</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Sub-Title Tag</label>
                <input
                  type="text"
                  value={cmsLeaderboardConfig.subTitleTag || ""}
                  onChange={(e) => {
                    setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, subTitleTag: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Leaderboard Main Title</label>
                <input
                  type="text"
                  value={cmsLeaderboardConfig.title || ""}
                  onChange={(e) => {
                    setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, title: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Leaderboard Description</label>
                <input
                  type="text"
                  value={cmsLeaderboardConfig.subtitle || ""}
                  onChange={(e) => {
                    setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, subtitle: e.target.value });
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Simulated Competitors Profiles ({cmsLeaderboardConfig.competitors?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => {
                    const comps = cmsLeaderboardConfig.competitors || [];
                    setCmsLeaderboardConfig({
                      ...cmsLeaderboardConfig,
                      competitors: [
                        ...comps,
                        { name: "New Candidate", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=New", totalCorrect: 120, testsCompleted: 6, accuracy: 80, city: "Nepal" }
                      ]
                    });
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Competitor Profile</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(cmsLeaderboardConfig.competitors || []).map((comp: any, cIdx: number) => {
                  return (
                    <div key={cIdx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:border-slate-800 transition-all">
                      <div className="md:col-span-3">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Competitor Full Name</label>
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].name = e.target.value;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">District / City</label>
                        <input
                          type="text"
                          value={comp.city}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].city = e.target.value;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Total Correct</label>
                        <input
                          type="number"
                          value={comp.totalCorrect}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].totalCorrect = parseInt(e.target.value) || 0;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Tests Run</label>
                        <input
                          type="number"
                          value={comp.testsCompleted}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].testsCompleted = parseInt(e.target.value) || 0;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Accuracy %</label>
                        <input
                          type="number"
                          value={comp.accuracy}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].accuracy = parseInt(e.target.value) || 0;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[8px] font-extrabold uppercase text-slate-500 mb-0.5">Avatar URL / Seed</label>
                        <input
                          type="text"
                          value={comp.avatarUrl}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].avatarUrl = e.target.value;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white"
                        />
                      </div>

                      <div className="md:col-span-2 text-right self-end pb-1 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[cIdx].enabled = list[cIdx].enabled === false ? true : false;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className={`text-[9px] font-black px-2 py-1.5 rounded transition-colors cursor-pointer ${
                            comp.enabled !== false
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}
                        >
                          {comp.enabled !== false ? "ACTIVE" : "HIDDEN"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const list = cmsLeaderboardConfig.competitors.filter((_: any, i: number) => i !== cIdx);
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 6: About Us & Editorial Team */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>👥</span>
                <span>6. Support / About Us Headers & Student Creators Profiles</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">About Section Title</label>
                <input
                  type="text"
                  value={cmsAboutTitle}
                  onChange={(e) => setCmsAboutTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">About Section Sub-title</label>
                <input
                  type="text"
                  value={cmsAboutSubtitle}
                  onChange={(e) => setCmsAboutSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Descriptive Body Text</label>
                <textarea
                  value={cmsAboutBody}
                  onChange={(e) => setCmsAboutBody(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Co-founders / Student Creators Portfolio ({cmsEditorialTeam.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setCmsEditorialTeam([
                      ...cmsEditorialTeam,
                      { name: "New Creator", role: "Co-Founder", bio: "Medical enthusiast and lead app designer.", avatar: "⭐" }
                    ]);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Creator Member</span>
                </button>
              </div>

              <div className="space-y-3">
                {cmsEditorialTeam.map((member, idx) => {
                  return (
                    <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row gap-4 hover:border-slate-800 transition-all">
                      <div className="flex items-center gap-3 sm:w-1/4">
                        <div className="flex flex-col space-y-1 w-full">
                          <label className="block text-[8px] font-extrabold uppercase text-slate-500">Icon / Img URL</label>
                          <input
                            type="text"
                            value={member.avatar || ""}
                            onChange={(e) => {
                              const list = [...cmsEditorialTeam];
                              list[idx].avatar = e.target.value;
                              setCmsEditorialTeam(list);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                            placeholder="e.g. 🎓 or https://"
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col space-y-1">
                            <label className="block text-[8px] font-extrabold uppercase text-slate-500">Creator Name</label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                const list = [...cmsEditorialTeam];
                                list[idx].name = e.target.value;
                                setCmsEditorialTeam(list);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-bold"
                            />
                          </div>

                          <div className="flex flex-col space-y-1">
                            <label className="block text-[8px] font-extrabold uppercase text-slate-500">Role / Designation</label>
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) => {
                                const list = [...cmsEditorialTeam];
                                list[idx].role = e.target.value;
                                setCmsEditorialTeam(list);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                          <label className="block text-[8px] font-extrabold uppercase text-slate-500">Bio Statement</label>
                          <textarea
                            value={member.bio}
                            onChange={(e) => {
                              const list = [...cmsEditorialTeam];
                              list[idx].bio = e.target.value;
                              setCmsEditorialTeam(list);
                            }}
                            rows={1}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="self-end pb-1 text-right flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...cmsEditorialTeam];
                            list[idx].enabled = list[idx].enabled === false ? true : false;
                            setCmsEditorialTeam(list);
                          }}
                          className={`text-[9px] font-black px-2 py-1 rounded transition-colors cursor-pointer ${
                            member.enabled !== false
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}
                        >
                          {member.enabled !== false ? "ACTIVE" : "HIDDEN"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const list = cmsEditorialTeam.filter((_, i) => i !== idx);
                            setCmsEditorialTeam(list);
                          }}
                          className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {renderCSVModal()}

      {/* Custom Confirmation Modal to ensure absolute reliability in iframe sandbox */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm font-sans animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 pb-2 border-b border-slate-800">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 animate-bounce">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  Action Required
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const onCancelAction = confirmModal.onCancel;
                  setConfirmModal(null);
                  if (onCancelAction) onCancelAction();
                }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const onConfirmAction = confirmModal.onConfirm;
                  setConfirmModal(null);
                  onConfirmAction();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
              >
                Confirm Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
