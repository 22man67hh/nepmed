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
  GraduationCap,
  XCircle,
  PlusCircle,
  Edit3,
  Maximize2,
  Minimize2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  BookOpen,
  Settings,
  Menu,
  Sliders
} from "lucide-react";
import { QuestionSet, Question } from "../types";
import { ALL_STANDARD_SUBJECTS, MEC_UG_CLASSIFICATION, generateQuestionIdForSubject, retagAllQuestions } from "../subjectsData";
import RichTextEditor from "./RichTextEditor";
import { CmsControlPanel } from "./CmsControlPanel";

// Modular Subcomponents Imports
import { DashboardTab } from "./admin/DashboardTab";
import { ExamsTab } from "./admin/ExamsTab";
import { SubjectsTab } from "./admin/SubjectsTab";
import { TopicsTab } from "./admin/TopicsTab";
import { FlaggedIssuesTab } from "./admin/FlaggedIssuesTab";
import { ReviewQueueTab } from "./admin/ReviewQueueTab";
import { SubjectFoldersPoolTab } from "./admin/SubjectFoldersPoolTab";
import { EditSetOverlay } from "./admin/EditSetOverlay";
import { PapersTab } from "./admin/PapersTab";

interface CustomAdminPanelProps {
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

export default function CustomAdminPanel({ 
  allSets, 
  onSaveSets,
  independentQuestions = [],
  onSaveIndependentQuestions = () => {},
  userDraftQuestions = [],
  onSaveUserDraftQuestions = () => {},
  targetExam = "mec-ug",
  cmsContent,
  onSaveCMSContent
}: CustomAdminPanelProps) {
  // Detailed set editor screen
  const [activeEditSet, setActiveEditSet] = useState<QuestionSet | null>(null);

  // App message / Notification state
  const [message, setMessage] = useState("");

  // Navigation Panel State
  const [adminTab, setAdminTab] = useState<"dashboard" | "papers" | "reports" | "questions" | "review" | "cms" | "exams" | "subjects" | "topics">("dashboard");

  // Mobile responsiveness drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live Database Synchronized States
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbTopics, setDbTopics] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

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

  // Category filter state for papers panel
  const [cmsTargetExams, setCmsTargetExams] = useState<any[]>([]);

  // Expanded CMS configs
  const [cmsDashboardConfig, setCmsDashboardConfig] = useState<any>({});
  const [cmsSavedQuestionsConfig, setCmsSavedQuestionsConfig] = useState<any>({});
  const [cmsMyReportConfig, setCmsMyReportConfig] = useState<any>({});
  const [cmsDiscussionForumConfig, setCmsDiscussionForumConfig] = useState<any>({});
  const [cmsSupportConfig, setCmsSupportConfig] = useState<any>({});
  const [cmsSubscriptionConfig, setCmsSubscriptionConfig] = useState<any>({});
  const [cmsReferEarnConfig, setCmsReferEarnConfig] = useState<any>({});
  const [cmsPricingConfig, setCmsPricingConfig] = useState<any[]>([]);
  const [cmsButtonStyles, setCmsButtonStyles] = useState<any[]>([]);

  // Reports States
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Custom Confirmation Dialog States
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
  const [customTopicRows, setCustomTopicRows] = useState<Record<number, boolean>>({});
  const [customSubjectRows, setCustomSubjectRows] = useState<Record<number, boolean>>({});
  const [richCellEdit, setRichCellEdit] = useState<{ rIdx: number; cIdx: number; value: string } | null>(null);

  // Fetch live DB items on mount
  const fetchExams = async () => {
    setExamsLoading(true);
    try {
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        if (data.status && Array.isArray(data.exams)) {
          setDbExams(data.exams);
        }
      }
    } catch (e) {
      console.error("Failed to load exams:", e);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        if (data.status && Array.isArray(data.subjects)) {
          setDbSubjects(data.subjects);
        }
      }
    } catch (e) {
      console.error("Failed to load subjects:", e);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch("/api/topics");
      if (res.ok) {
        const data = await res.json();
        if (data.status && Array.isArray(data.topics)) {
          setDbTopics(data.topics);
        }
      }
    } catch (e) {
      console.error("Failed to load topics:", e);
    } finally {
      setTopicsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchTopics();
  }, []);

  // Fetch reports on demand
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

  // Load CMS bindings
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
      setCmsSidebarItems(cmsContent.sidebarItems || []);
      setCmsLeaderboardConfig(cmsContent.leaderboardConfig || { title: "", subtitle: "", subTitleTag: "", competitors: [] });
      setCmsMecUgClassification(cmsContent.mecUgClassification || []);
      setCmsMecPgClassification(cmsContent.mecPgClassification || []);
      setCmsEditorialTeam(cmsContent.editorialTeam || []);
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

  // Toast helper
  const triggerNotification = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
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

  const handleSaveCMS = async () => {
    if (!onSaveCMSContent) return;
    
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
    if (success) {
      setMessage("✅ App-wide CMS modifications updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } else {
      setMessage("❌ Failed to update CMS content.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

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

  const parseCSVToGrid = (text: string): string[][] => {
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

    let dataRows = rows;
    if (rows.length > 0) {
      const firstRowJoined = rows[0].join(" ").toLowerCase();
      if (firstRowJoined.includes("question") || firstRowJoined.includes("explanation") || firstRowJoined.includes("option") || firstRowJoined.includes("correct") || firstRowJoined.includes("id")) {
        dataRows = rows.slice(1);
      }
    }

    return dataRows.map(row => {
      const paddedRow = [...row];
      while (paddedRow.length < 10) {
        paddedRow.push("");
      }

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

      const rawSubject = (paddedRow[8] || "").trim();
      if (rawSubject) {
        const lowerSub = rawSubject.toLowerCase();
        const matchedSub = ALL_STANDARD_SUBJECTS.find(s => s.toLowerCase() === lowerSub);
        if (matchedSub) {
          paddedRow[8] = matchedSub;
        } else {
          paddedRow[8] = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
        }
      } else {
        paddedRow[8] = "";
      }

      return paddedRow;
    });
  };

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
      const cols = line.split("\t");
      const paddedRow = [...cols];
      while (paddedRow.length < 10) {
        paddedRow.push("");
      }
      const keyVal = paddedRow[6].trim().toUpperCase();
      if (keyVal === "A" || keyVal === "0") paddedRow[6] = "0";
      else if (keyVal === "B" || keyVal === "1") paddedRow[6] = "1";
      else if (keyVal === "C" || keyVal === "2") paddedRow[6] = "2";
      else if (keyVal === "D" || keyVal === "3") paddedRow[6] = "3";
      else paddedRow[6] = "0";
      
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
      const isSingleEmptyRow = gridRows.length === 1 && gridRows[0].every(cell => cell.trim() === "" || cell === "0");
      const cleanExistingRows = isSingleEmptyRow ? [] : gridRows;
      const cleanParsed = parsed.filter(row => row.some(cell => cell.trim() !== ""));

      if (cleanParsed.length === 0) {
        setMessage("⚠️ No valid non-empty rows could be parsed from the spreadsheet file.");
        setTimeout(() => setMessage(""), 4000);
        return;
      }

      const mergedRows = [...cleanExistingRows, ...cleanParsed];
      setGridRows(mergedRows);
      
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

  const handleEditClick = (set: QuestionSet) => {
    setActiveEditSet(JSON.parse(JSON.stringify(set)));
  };

  const renderCSVModal = () => {
    if (!isCSVModalOpen) return null;

    const modalWrapperClass = isCsvFullscreen
      ? "fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen w-screen p-0 max-w-none rounded-none"
      : "fixed inset-0 z-50 bg-slate-955/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans";

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
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader / Tabs & Tools */}
          <div className="bg-slate-955 border-b border-slate-850 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCsvTab("spreadsheet")}
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
                onClick={() => setCsvTab("raw")}
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
                <div className="bg-slate-955 border border-slate-850 p-4 rounded-xl text-xs space-y-2 text-slate-300">
                  <p className="font-bold text-violet-400 uppercase tracking-wider text-[10px]">💡 Instructions & CSV Columns Format:</p>
                  <p className="leading-relaxed">
                    The columns must follow this exact order: <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">ID, Question Text, Option A, Option B, Option C, Option D, Correct Option Index (0-3), Explanation, Subject, Topic</code>
                  </p>
                  <p className="leading-relaxed">
                    • <span className="font-bold text-white">ID:</span> Existing questions have unique serial codes. For new questions, leave this field empty or write <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded font-mono">""</code> – <span className="text-violet-400 font-semibold">a unique chronological serial ID will be automatically generated</span> upon saving!
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
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-4 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 resize-none flex-1 min-h-[300px]"
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
                    <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-955 shadow-inner flex-1 min-h-0">
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
                                <td className="px-3 py-2 bg-slate-955 text-center text-[10px] text-slate-500 font-sans font-bold border-r border-slate-855 sticky left-0 z-20 group-hover:bg-slate-900">
                                  {rIdx + 1}
                                </td>
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(0)}
                                    onChange={(e) => updateCell(0, e.target.value)}
                                    placeholder="Leave for auto-id"
                                    className="w-full bg-transparent border-0 p-1 text-slate-400 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded font-mono placeholder:text-slate-700 focus:outline-none"
                                  />
                                </td>
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
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(2)}
                                    onChange={(e) => updateCell(2, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="A"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(3)}
                                    onChange={(e) => updateCell(3, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="B"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(4)}
                                    onChange={(e) => updateCell(4, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="C"
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-slate-850">
                                  <input
                                    type="text"
                                    value={cellVal(5)}
                                    onChange={(e) => updateCell(5, e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 rounded focus:outline-none"
                                    placeholder="D"
                                  />
                                </td>
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
              className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
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

          {/* Rich Content Cell Editor */}
          {richCellEdit && (
            <div className="fixed inset-0 z-[160] bg-slate-955/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-slate-955 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Rich Content Editor for Cell (Row {richCellEdit.rIdx + 1}, {richCellEdit.cIdx === 1 ? "Question Text" : "Explanation"})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRichCellEdit(null)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
                  <RichTextEditor
                    value={richCellEdit.value}
                    onChange={(val) => setRichCellEdit({ ...richCellEdit, value: val })}
                    placeholder="Compose question or explanation content..."
                  />
                </div>

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

  // Detailed set editor screen overlay
  if (activeEditSet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full relative overflow-y-auto p-4 md:p-8">
        {message && (
          <div className="mb-6 p-4 bg-violet-500/15 border border-violet-500/30 text-violet-400 font-semibold text-xs rounded-xl animate-pulse flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
        <EditSetOverlay
          activeEditSet={activeEditSet}
          setActiveEditSet={setActiveEditSet}
          allSets={allSets}
          onSaveSets={onSaveSets}
          handleOpenCSVEditorForSet={handleOpenCSVEditorForSet}
          askConfirmation={askConfirmation}
          triggerNotification={triggerNotification}
        />
        {renderCSVModal()}

        {/* Custom Confirmation Modal */}
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-955/85 backdrop-blur-sm font-sans animate-in fade-in duration-200">
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
                  className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans w-full relative overflow-hidden">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-35 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🚀 SIDEBAR NAVIGATION */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="space-y-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/10 animate-pulse">
                <GraduationCap className="w-6 h-6 text-slate-950 animate-none" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white uppercase tracking-wider">{cmsBrandName || "nepmedmcq"}</h2>
                <span className="text-[10px] text-violet-400 font-semibold tracking-widest uppercase">Admin Panel</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => { setAdminTab("dashboard"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "dashboard"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Sliders className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Dashboard Home</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("exams"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "exams"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Target Board Exams</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("subjects"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "subjects"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Subjects Directory</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("topics"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "topics"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Tag className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Topics Directory</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("papers"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "papers"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-violet-400 shrink-0" />
              <span>MCQ Papers Editor</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("questions"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "questions"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Subject Folders Pool</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("review"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "review"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Review Proposed Queue</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("reports"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "reports"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Flag className="w-4 h-4 text-violet-400 shrink-0" />
              <span>User Flagged Issues</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab("cms"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                adminTab === "cms"
                  ? "bg-violet-500/15 text-violet-400 border-l-4 border-violet-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Settings className="w-4 h-4 text-violet-400 shrink-0" />
              <span>CMS Configs</span>
            </button>
          </nav>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-4">
          <p>© 2026 Premium Admin Room.</p>
          <p className="mt-0.5">Status: Standalone UI Sandbox</p>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-y-auto">
        
        {/* Floating Header */}
        <header className="h-16 border-b border-slate-800/80 px-4 md:px-8 flex justify-between items-center bg-slate-900/30 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider truncate max-w-[150px] md:max-w-none">
              {adminTab === "dashboard" && "🏠 Dashboard Overview"}
              {adminTab === "papers" && "📁 MCQ Papers Editor"}
              {adminTab === "questions" && "📂 Subject Folders Pool"}
              {adminTab === "review" && "🚀 Review Proposed Queue"}
              {adminTab === "reports" && "🚩 Flagged Issues"}
              {adminTab === "exams" && "🎓 Target Board Exams"}
              {adminTab === "subjects" && "📚 Subjects Directory"}
              {adminTab === "topics" && "🏷️ Topics Directory"}
              {adminTab === "cms" && "⚙️ Visual CMS Control Room"}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="px-2.5 py-0.5 md:px-3 md:py-1 bg-slate-800/60 border border-slate-700 text-slate-400 rounded-full font-mono text-[10px] md:text-xs">
              Target: <strong className="text-white uppercase">{targetExam}</strong>
            </span>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {message && (
            <div className="mb-6 p-4 bg-violet-500/15 border border-violet-500/30 text-violet-400 font-semibold text-xs rounded-xl animate-pulse flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Conditional Tabs Rendering */}
          {adminTab === "dashboard" && (
            <DashboardTab
              allSets={allSets}
              independentQuestions={independentQuestions}
              userDraftQuestions={userDraftQuestions}
              dbExams={dbExams}
              setAdminTab={setAdminTab}
              handleRetagDatabase={handleRetagDatabase}
            />
          )}

          {adminTab === "exams" && (
            <ExamsTab
              dbExams={dbExams}
              fetchExams={fetchExams}
              setMessage={setMessage}
            />
          )}

          {adminTab === "subjects" && (
            <SubjectsTab
              dbSubjects={dbSubjects}
              dbExams={dbExams}
              dbTopics={dbTopics}
              fetchSubjects={fetchSubjects}
              fetchTopics={fetchTopics}
              setMessage={setMessage}
            />
          )}

          {adminTab === "topics" && (
            <TopicsTab
              dbTopics={dbTopics}
              dbSubjects={dbSubjects}
              dbExams={dbExams}
              fetchTopics={fetchTopics}
              setMessage={setMessage}
            />
          )}

          {adminTab === "papers" && (
            <PapersTab
              allSets={allSets}
              onSaveSets={onSaveSets}
              cmsTargetExams={cmsTargetExams}
              cmsContent={cmsContent}
              setMessage={setMessage}
              askConfirmation={askConfirmation}
              handleEditClick={handleEditClick}
            />
          )}

          {adminTab === "questions" && (
            <SubjectFoldersPoolTab
              independentQuestions={independentQuestions}
              onSaveIndependentQuestions={onSaveIndependentQuestions}
              allSets={allSets}
              setMessage={setMessage}
              handleOpenCSVEditorForSubject={handleOpenCSVEditorForSubject}
            />
          )}

          {adminTab === "review" && (
            <ReviewQueueTab
              userDraftQuestions={userDraftQuestions}
              onSaveUserDraftQuestions={onSaveUserDraftQuestions}
              independentQuestions={independentQuestions}
              onSaveIndependentQuestions={onSaveIndependentQuestions}
              setConfirmModal={setConfirmModal}
              setMessage={setMessage}
            />
          )}

          {adminTab === "reports" && (
            <FlaggedIssuesTab
              reports={reports}
              fetchReports={fetchReports}
              loadingReports={loadingReports}
              handleDeleteReport={handleDeleteReport}
            />
          )}

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
              isSavingCms={false}
            />
          )}
        </div>
      </main>

      {renderCSVModal()}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-955/85 backdrop-blur-sm font-sans animate-in fade-in duration-200">
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
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
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
