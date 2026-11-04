import React, { useState } from "react";
import { 
  ChevronRight, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Copy, 
  Clipboard, 
  Layout, 
  Compass, 
  ListOrdered, 
  Lock, 
  Check, 
  HelpCircle,
  FileText,
  Zap,
  Tag,
  RefreshCcw,
  Users,
  CreditCard,
  MessageSquare,
  BookOpen,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";

interface CmsControlPanelProps {
  cmsBrandName: string;
  setCmsBrandName: (v: string) => void;
  cmsLoginLabels: any;
  setCmsLoginLabels: (v: any) => void;
  cmsAboutTitle: string;
  setCmsAboutTitle: (v: string) => void;
  cmsAboutSubtitle: string;
  setCmsAboutSubtitle: (v: string) => void;
  cmsAboutBody: string;
  setCmsAboutBody: (v: string) => void;
  cmsSidebarItems: any[];
  setCmsSidebarItems: (v: any[]) => void;
  cmsLeaderboardConfig: any;
  setCmsLeaderboardConfig: (v: any) => void;
  cmsMecUgClassification: any[];
  setCmsMecUgClassification: (v: any[]) => void;
  cmsMecPgClassification: any[];
  setCmsMecPgClassification: (v: any[]) => void;
  cmsEditorialTeam: any[];
  setCmsEditorialTeam: (v: any[]) => void;
  cmsDashboardConfig: any;
  setCmsDashboardConfig: (v: any) => void;
  cmsSavedQuestionsConfig: any;
  setCmsSavedQuestionsConfig: (v: any) => void;
  cmsMyReportConfig: any;
  setCmsMyReportConfig: (v: any) => void;
  cmsDiscussionForumConfig: any;
  setCmsDiscussionForumConfig: (v: any) => void;
  cmsSupportConfig: any;
  setCmsSupportConfig: (v: any) => void;
  cmsPricingConfig: any[];
  setCmsPricingConfig: (v: any[]) => void;
  cmsButtonStyles: any[];
  setCmsButtonStyles: (v: any[]) => void;
  cmsTargetExams: any[];
  setCmsTargetExams: (v: any[]) => void;
  cmsSubscriptionConfig: any;
  setCmsSubscriptionConfig: (v: any) => void;
  cmsReferEarnConfig: any;
  setCmsReferEarnConfig: (v: any) => void;
  handleSaveCMS: () => void;
  isSavingCms: boolean;
}

export const CmsControlPanel: React.FC<CmsControlPanelProps> = ({
  cmsBrandName,
  setCmsBrandName,
  cmsLoginLabels,
  setCmsLoginLabels,
  cmsAboutTitle,
  setCmsAboutTitle,
  cmsAboutSubtitle,
  setCmsAboutSubtitle,
  cmsAboutBody,
  setCmsAboutBody,
  cmsSidebarItems,
  setCmsSidebarItems,
  cmsLeaderboardConfig,
  setCmsLeaderboardConfig,
  cmsMecUgClassification,
  setCmsMecUgClassification,
  cmsMecPgClassification,
  setCmsMecPgClassification,
  cmsEditorialTeam,
  setCmsEditorialTeam,
  cmsDashboardConfig,
  setCmsDashboardConfig,
  cmsSavedQuestionsConfig,
  setCmsSavedQuestionsConfig,
  cmsMyReportConfig,
  setCmsMyReportConfig,
  cmsDiscussionForumConfig,
  setCmsDiscussionForumConfig,
  cmsSupportConfig,
  setCmsSupportConfig,
  cmsPricingConfig,
  setCmsPricingConfig,
  cmsButtonStyles,
  setCmsButtonStyles,
  cmsTargetExams,
  setCmsTargetExams,
  cmsSubscriptionConfig,
  setCmsSubscriptionConfig,
  cmsReferEarnConfig,
  setCmsReferEarnConfig,
  handleSaveCMS,
  isSavingCms,
}) => {
  // Global Active Section
  const [activeMasterSection, setActiveMasterSection] = useState<
    "login" | "target-exams" | "sidebar" | "specific-exam" | "subscription" | "refer-earn" |
    "dashboard" | "saved-report" | "discussion" | "leaderboard-about" | "support-admin" | "button-styles"
  >("login");

  // Specific Exam selection state for Section 4
  const [selectedExamId, setSelectedExamId] = useState<string>(cmsTargetExams[0]?.id || "mec-ug");

  // Non-collapsible subtab selection inside Section 4 Specific Exam
  const [examSubTab, setExamSubTab] = useState<"general" | "set-practice" | "subject-practice" | "announcements" | "pricing" | "support">("general");

  // Clipboards for copy-paste operations inside Specific Exam customizer
  const [copiedSubcategory, setCopiedSubcategory] = useState<any | null>(null);
  const [copiedSet, setCopiedSet] = useState<any | null>(null);
  const [copiedComponent, setCopiedComponent] = useState<any | null>(null);

  // Status message feedback
  const [feedback, setFeedback] = useState("");

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  // Custom dialog state to prevent iframe sandbox blockage of prompt/confirm
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "confirm" | "prompt";
    title: string;
    message: string;
    placeholder: string;
    inputValue: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    placeholder: "",
    inputValue: "",
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      placeholder: "",
      inputValue: "",
      onConfirm: () => {
        onConfirm();
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const openPrompt = (title: string, message: string, placeholder: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setDialogState({
      isOpen: true,
      type: "prompt",
      title,
      message,
      placeholder,
      inputValue: defaultValue,
      onConfirm: (val: string) => {
        onConfirm(val);
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Safe fetch of selected exam
  const currentExam = cmsTargetExams.find(e => e.id === selectedExamId) || cmsTargetExams[0];

  // Helper to deep copy structures
  const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

  // --- Login Screen label updater ---
  const handleUpdateLoginLabel = (key: string, val: string) => {
    setCmsLoginLabels({
      ...cmsLoginLabels,
      [key]: val
    });
  };

  // --- Duplicate Target Exam helper ---
  const handleDuplicateExam = (examToDuplicate: any) => {
    const originalName = examToDuplicate.name;
    openPrompt(
      "Duplicate Target Exam",
      `Enter descriptive name for "${originalName}" clone:`,
      "e.g. MEC-UG Special Edition",
      `${originalName} Copy`,
      (newName) => {
        if (!newName.trim()) return;
        const newId = newName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        
        // Check for collision
        if (cmsTargetExams.some(e => e.id === newId)) {
          triggerFeedback("⚠️ Error: A target exam with this identifier already exists.");
          return;
        }

        const duplicated = deepCopy(examToDuplicate);
        duplicated.id = newId;
        duplicated.name = newName;
        duplicated.code = newId;
        duplicated.description = `${newName} duplicated board exam prep package.`;

        // Detect and explicitly set exam style to prevent downstream fallback issues
        const examStyle = examToDuplicate.style || (examToDuplicate.id === "mec-ug" || examToDuplicate.id?.includes("ug") || examToDuplicate.id?.toLowerCase().includes("undergrad") ? "mec-ug" : "mec-pg");
        duplicated.style = examStyle;

        // Ensure all internal sets & subcategories have unique new IDs to prevent collisions
        if (duplicated.subcategories) {
          duplicated.subcategories.forEach((sub: any, subIdx: number) => {
            sub.id = `sub-${newId}-${subIdx}-${Date.now()}`;
            if (sub.sets) {
              sub.sets.forEach((set: any, setIdx: number) => {
                set.id = `custom-${newId}-${sub.id}-${setIdx}-${Date.now()}`;
              });
            }
          });
        }

        // Copy matching subjects for the syllabus customizer
        if (examStyle === "mec-ug") {
          const originalSubjects = cmsMecUgClassification.filter(sub => sub.targetExam === examToDuplicate.id || (!sub.targetExam && examToDuplicate.id === "mec-ug"));
          const copiedSubjects = originalSubjects.map((sub: any) => ({
            ...deepCopy(sub),
            targetExam: newId
          }));
          setCmsMecUgClassification([...cmsMecUgClassification, ...copiedSubjects]);
        } else {
          const originalSubjects = cmsMecPgClassification.filter(sub => sub.targetExam === examToDuplicate.id || (!sub.targetExam && examToDuplicate.id === "mec-pg"));
          const copiedSubjects = originalSubjects.map((sub: any) => ({
            ...deepCopy(sub),
            targetExam: newId
          }));
          setCmsMecPgClassification([...cmsMecPgClassification, ...copiedSubjects]);
        }

        setCmsTargetExams([...cmsTargetExams, duplicated]);
        setSelectedExamId(newId);
        triggerFeedback(`📋 Successfully duplicated "${originalName}" as "${newName}" with custom syllabus!`);
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-200">
      
      {/* HEADER CONTROL CONTROL PANEL BAR */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">⚙️</span>
            <span>Nepalmed CMS Master Control Room</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live client-side CMS with unified synchronization. Control authentication views, target exam lists, dynamic navigation pathways, and micro-customize exam sets in real time.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          {feedback && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-pulse">
              {feedback}
            </span>
          )}
          <button
            onClick={handleSaveCMS}
            disabled={isSavingCms}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {isSavingCms ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synchronizing App...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All CMS Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MULTI-MODULE SECTION NAVIGATION TABS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-950/40 p-2 rounded-2xl border border-slate-850">
        {[
          { id: "login", label: "🔐 1. Login & Auth", desc: "Labels & parameters" },
          { id: "target-exams", label: "🎓 2. Target Arenas", desc: "Manage main exam entries" },
          { id: "sidebar", label: "🗂️ 3. Sidebar Rail", desc: "Dynamic item mapping" },
          { id: "specific-exam", label: "🛠️ 4. Exam Content", desc: "Sets & subject structures" },
          { id: "subscription", label: "💎 5. Premium Plans", desc: "Plans, benefits & gateway" },
          { id: "refer-earn", label: "🎁 6. Refer & Earn", desc: "Rewards, invite & steps" },
          { id: "dashboard", label: "📊 7. Dashboard Labels", desc: "Dashboard welcome text" },
          { id: "saved-report", label: "💾 8. Saved Qs & Reports", desc: "Revision list & analytics" },
          { id: "discussion", label: "💬 9. Discussion Forum", desc: "Categories & forum tags" },
          { id: "leaderboard-about", label: "🏆 10. Leader & About", desc: "Leaderboard & directors" },
          { id: "support-admin", label: "💁 11. Support Center", desc: "Contact office & helpline" },
          { id: "button-styles", label: "🎨 12. Button Styles", desc: "Colors & button display text" }
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveMasterSection(sec.id as any);
              if (sec.id === "specific-exam" && !selectedExamId && cmsTargetExams[0]) {
                setSelectedExamId(cmsTargetExams[0].id);
              }
            }}
            className={`text-left p-3.5 rounded-xl cursor-pointer transition-all flex flex-col ${
              activeMasterSection === sec.id
                ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/10 border border-violet-500/30"
                : "bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-850/60 border border-transparent"
            }`}
          >
            <span className="text-xs font-black tracking-tight">{sec.label}</span>
            <span className={`text-[10px] mt-0.5 ${activeMasterSection === sec.id ? "text-violet-200" : "text-slate-500"}`}>{sec.desc}</span>
          </button>
        ))}
      </div>

      {/* MAIN CONTAINER FOR ACTIVE MASTER SECTION */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl">
        
        {/* =======================================================
            SECTION 1: LOGIN/SIGN UP CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "login" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🔐</span> Login & Sign up Authentication Customizer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize visual brand banners, authorization labels, agreement prompts and button triggers below.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form inputs */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <span className="text-[10px] font-extrabold uppercase text-violet-400 tracking-wider">Authentication Component Texts</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Brand Name Label</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.brandName || ""}
                      onChange={(e) => handleUpdateLoginLabel("brandName", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Divider Text</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.dividerText || ""}
                      onChange={(e) => handleUpdateLoginLabel("dividerText", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Brand Subtitle / Slogan</label>
                  <input
                    type="text"
                    value={cmsLoginLabels?.brandSubtitle || ""}
                    onChange={(e) => handleUpdateLoginLabel("brandSubtitle", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Sign-In Button Label</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.loginButton || ""}
                      onChange={(e) => handleUpdateLoginLabel("loginButton", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Register Button Label</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.registerButton || ""}
                      onChange={(e) => handleUpdateLoginLabel("registerButton", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Google Sign-In Button</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.signinGoogleButton || ""}
                      onChange={(e) => handleUpdateLoginLabel("signinGoogleButton", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Google Sign-Up Button</label>
                    <input
                      type="text"
                      value={cmsLoginLabels?.signupGoogleButton || ""}
                      onChange={(e) => handleUpdateLoginLabel("signupGoogleButton", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Terms Agreement Consent Label</label>
                  <input
                    type="text"
                    value={cmsLoginLabels?.termsAcceptedLabel || ""}
                    onChange={(e) => handleUpdateLoginLabel("termsAcceptedLabel", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Right Column: High Fidelity Mockup Simulation */}
              <div className="flex flex-col justify-center items-center bg-slate-950 p-6 rounded-2xl border border-slate-850">
                <span className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Client Portal Mockup (Pre-visualization)</span>
                
                <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl relative">
                  <div className="text-center space-y-2 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <span className="text-sm">🏥</span>
                    </div>
                    <h4 className="text-sm font-black text-white tracking-widest uppercase">
                      {cmsLoginLabels?.brandName || "NepMed"}
                    </h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      {cmsLoginLabels?.brandSubtitle || "Nepal's Premier Medical MCQ Prep"}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <input
                      type="text"
                      disabled
                      placeholder="Doctor Email ID (e.g. name@iom.edu.np)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-400 focus:outline-none"
                    />
                    <input
                      type="password"
                      disabled
                      placeholder="Secure Password Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-400 focus:outline-none"
                    />
                    
                    <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black py-2 rounded-lg mt-2 cursor-not-allowed">
                      {cmsLoginLabels?.loginButton || "Access Prep Dashboard"}
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        {cmsLoginLabels?.dividerText || "or continue with"}
                      </span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-200 text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                      <span>🔵</span>
                      <span>{cmsLoginLabels?.signinGoogleButton || "Sign In with Google"}</span>
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-[9px] text-slate-500 underline cursor-pointer">
                      Create new candidate account
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 2: TARGET EXAMS MANAGER
            ======================================================= */}
        {activeMasterSection === "target-exams" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎓</span> Medical Target Board Exams manager
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Edit, clone, duplicate, delete and configure all available target examinations from here.</p>
              </div>
              <button
                onClick={() => {
                  openPrompt(
                    "Add Target Exam",
                    "Enter the name of the new target medical examination:",
                    "e.g. IOM Entrance Exam",
                    "",
                    (name) => {
                      if (!name.trim()) return;
                      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
                      
                      // Check duplicate
                      if (cmsTargetExams.some(e => e.id === id)) {
                        triggerFeedback("⚠️ Error: A target exam with this identifier already exists.");
                        return;
                      }

                      const newExam = {
                        id,
                        name,
                        code: id,
                        description: `${name} high-yield licensing and preparatory modules.`,
                        subcategories: [
                          {
                            id: `sub-${id}-mock`,
                            name: "Mock Tests Arena",
                            description: "Simulated practice environments",
                            sets: [],
                            components: []
                          }
                        ]
                      };
                      setCmsTargetExams([...cmsTargetExams, newExam]);
                      setSelectedExamId(id);
                      triggerFeedback(`🎓 Added new target exam "${name}" successfully!`);
                    }
                  );
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target Exam</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cmsTargetExams.map((exam, idx) => (
                <div key={exam.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between relative space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {exam.id}
                      </span>
                      <div className="flex gap-2">
                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicateExam(exam)}
                          title="Duplicate/Clone this target exam"
                          className="p-1.5 hover:bg-slate-900 rounded text-amber-400 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            openConfirm(
                              "Delete Target Exam",
                              `Are you absolutely sure you want to remove "${exam.name}"? This deletes all associated custom sets and categories.`,
                              () => {
                                const remaining = cmsTargetExams.filter((_, i) => i !== idx);
                                setCmsTargetExams(remaining);
                                if (selectedExamId === exam.id) {
                                  setSelectedExamId(remaining[0]?.id || "");
                                }
                                triggerFeedback(`❌ Removed target exam "${exam.name}"`);
                              }
                            );
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={exam.name}
                        onChange={(e) => {
                          const list = [...cmsTargetExams];
                          list[idx].name = e.target.value;
                          setCmsTargetExams(list);
                        }}
                        className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-violet-600 focus:outline-none text-sm font-bold text-white w-full transition-colors"
                        title="Click to rename"
                      />
                      <p className="text-[10px] text-slate-500 font-medium">
                        Contains {(exam.subcategories || []).length} category boxes & {
                          (exam.subcategories || []).reduce((acc: number, sub: any) => acc + (sub.sets?.length || 0), 0)
                        } customizable sets
                      </p>
                    </div>

                    <textarea
                      value={exam.description || ""}
                      onChange={(e) => {
                        const list = [...cmsTargetExams];
                        list[idx].description = e.target.value;
                        setCmsTargetExams(list);
                      }}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-[11px] text-slate-400 focus:outline-none"
                      placeholder="Brief descriptive notes"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setActiveMasterSection("specific-exam");
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Customize Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 3: SIDEBAR NAVIGATION CUSTOMIZER
            ======================================================= */}
        {activeMasterSection === "sidebar" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🗂️</span> Sidebar Navigation Customizer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize main dashboard sidebars, order tabs, rename display tags, or create secondary menu links.</p>
              </div>
              <button
                onClick={() => {
                  openPrompt(
                    "Add Sidebar Navigation Item",
                    "Enter Sidebar Navigation Label (e.g. Rapid Fire MCQ):",
                    "e.g. Rapid Fire MCQ",
                    "",
                    (label) => {
                      if (!label.trim()) return;
                      const id = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
                      
                      // Check duplicate
                      if (cmsSidebarItems.some(i => i.id === id)) {
                        triggerFeedback("⚠️ Error: A navigation pathway with this ID already exists.");
                        return;
                      }

                      const newItem = {
                        id,
                        label,
                        enabled: true,
                        order: cmsSidebarItems.length + 1
                      };
                      setCmsSidebarItems([...cmsSidebarItems, newItem]);
                      triggerFeedback(`🗂️ Added sidebar navigation "${label}"!`);
                    }
                  );
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sidebar Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-3 px-3 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider">
                <span className="col-span-3">System Key Identifier</span>
                <span className="col-span-4">Display Label Name (Editable)</span>
                <span className="col-span-2 text-center">Order Index</span>
                <span className="col-span-2 text-center">State Status</span>
                <span className="col-span-1 text-right">Delete</span>
              </div>

              {cmsSidebarItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors">
                  <div className="col-span-3 font-mono font-bold text-xs text-violet-400 truncate uppercase">
                    {item.id}
                  </div>
                  
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const list = [...cmsSidebarItems];
                      list[idx].label = e.target.value;
                      setCmsSidebarItems(list);
                    }}
                    className="col-span-4 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-600"
                  />

                  <input
                    type="number"
                    value={item.order}
                    onChange={(e) => {
                      const list = [...cmsSidebarItems];
                      list[idx].order = parseInt(e.target.value) || 0;
                      setCmsSidebarItems(list);
                    }}
                    className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-center text-white focus:outline-none focus:border-violet-600 font-mono"
                  />

                  <div className="col-span-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...cmsSidebarItems];
                        list[idx].enabled = !list[idx].enabled;
                        setCmsSidebarItems(list);
                        triggerFeedback(`Sidebar tab "${item.label}" state changed!`);
                      }}
                      className={`text-[9px] font-black px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                        item.enabled 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-slate-900 text-slate-500 border-slate-800/80"
                      }`}
                    >
                      {item.enabled ? "SHOWN" : "HIDDEN"}
                    </button>
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => {
                        openConfirm(
                          "Delete Sidebar Navigation Item",
                          `Are you sure you want to delete the sidebar item "${item.label}"?`,
                          () => {
                            setCmsSidebarItems(cmsSidebarItems.filter((_, i) => i !== idx));
                            triggerFeedback(`Removed sidebar item "${item.label}"`);
                          }
                        );
                      }}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 4: SPECIFIC EXAM DEEP CUSTOMIZER
            ======================================================= */}
        {activeMasterSection === "specific-exam" && (
          <div className="space-y-6">
            
            {/* Top dropdown and selector heading */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Active Exam Selector</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="bg-transparent text-base font-black text-white border-b-2 border-violet-600 focus:outline-none cursor-pointer pr-4 font-sans"
                  >
                    {cmsTargetExams.map((exam) => (
                      <option key={exam.id} value={exam.id} className="bg-slate-900 text-white">
                        {exam.name} Target Arena
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clipboards State Bar */}
              <div className="flex gap-3 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-500 uppercase tracking-wide">Clipboard:</span>
                <span className={copiedSet ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  📋 Set: {copiedSet ? copiedSet.title : "Empty"}
                </span>
                <span className="text-slate-700">|</span>
                <span className={copiedSubcategory ? "text-violet-400 font-bold" : "text-slate-600"}>
                  🗂️ Subcategory: {copiedSubcategory ? copiedSubcategory.name : "Empty"}
                </span>
              </div>
            </div>

            {/* Non-collapsible layout: left sidebar, right workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* NON-COLLAPSIBLE INTERNAL SIDEBAR */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 h-fit space-y-1 shrink-0">
                <p className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider px-2 mb-2">Exam Customizer Views</p>
                {[
                  { id: "general", label: "ℹ️ General Settings" },
                  { id: "set-practice", label: "📁 Set-wise Practice" },
                  { id: "subject-practice", label: "🧬 Subject-wise Syllabus" },
                  { id: "announcements", label: "📢 Notice & Alerts" },
                  { id: "pricing", label: "💳 Pricing Packages" },
                  { id: "support", label: "📞 Support Triggers" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setExamSubTab(tab.id as any)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      examSubTab === tab.id
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-850/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                  </button>
                ))}
              </div>

              {/* RIGHT WORKSPACE WINDOW */}
              <div className="lg:col-span-3 bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-5">
                
                {/* 1. GENERAL SETTINGS */}
                {examSubTab === "general" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                      ℹ️ General Information & Branding for {currentExam?.name}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Target Exam Name</label>
                        <input
                          type="text"
                          value={currentExam?.name || ""}
                          onChange={(e) => {
                            const list = [...cmsTargetExams];
                            const idx = list.findIndex(ex => ex.id === currentExam.id);
                            if (idx !== -1) {
                              list[idx].name = e.target.value;
                              setCmsTargetExams(list);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Board System Identifier Code</label>
                        <input
                          type="text"
                          value={currentExam?.id || ""}
                          disabled
                          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                          title="Board keys cannot be modified to prevent catalog breakages."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Target Description Paragraph</label>
                      <textarea
                        value={currentExam?.description || ""}
                        onChange={(e) => {
                          const list = [...cmsTargetExams];
                          const idx = list.findIndex(ex => ex.id === currentExam.id);
                          if (idx !== -1) {
                            list[idx].description = e.target.value;
                            setCmsTargetExams(list);
                          }
                        }}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. SET-WISE PRACTICE CUSTOMIZER */}
                {examSubTab === "set-practice" && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🎯</span> Set-wise Practice Arena Page Info
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Arena Heading / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. MECEE-BL Target Arena"
                            value={currentExam?.setwiseHeading || ""}
                            onChange={(e) => {
                              const list = [...cmsTargetExams];
                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                              if (idx !== -1) {
                                list[idx].setwiseHeading = e.target.value;
                                setCmsTargetExams(list);
                              }
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Arena Subheading / Subtitle</label>
                          <input
                            type="text"
                            placeholder="e.g. Select any of the curated question papers below to begin..."
                            value={currentExam?.setwiseSubheading || ""}
                            onChange={(e) => {
                              const list = [...cmsTargetExams];
                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                              if (idx !== -1) {
                                list[idx].setwiseSubheading = e.target.value;
                                setCmsTargetExams(list);
                              }
                            }}
                            className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          📁 Set-wise Practice Subcategories & Customizable Sets
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Define mock test subfolders and add custom question sheets that load directly in the client.</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Paste Subcategory Button */}
                        <button
                          onClick={() => {
                            if (copiedSubcategory) {
                              const list = [...cmsTargetExams];
                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                              if (idx !== -1) {
                                const subCopy = deepCopy(copiedSubcategory);
                                subCopy.id = `sub-pasted-${Date.now()}`;
                                if (!list[idx].subcategories) list[idx].subcategories = [];
                                list[idx].subcategories.push(subCopy);
                                setCmsTargetExams(list);
                                triggerFeedback(`📋 Pasted subcategory "${subCopy.name}"!`);
                              }
                            }
                          }}
                          disabled={!copiedSubcategory}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Clipboard className="w-3 h-3" />
                          <span>Paste Sub</span>
                        </button>

                        {/* Add New Subcategory */}
                        <button
                          onClick={() => {
                            openPrompt(
                              "Add Folder Category",
                              "Enter subcategory directory folder name (e.g., Premium Past Papers):",
                              "Premium Past Papers",
                              "",
                              (name) => {
                                if (!name.trim()) return;
                                const list = [...cmsTargetExams];
                                const idx = list.findIndex(ex => ex.id === currentExam.id);
                                if (idx !== -1) {
                                  if (!list[idx].subcategories) list[idx].subcategories = [];
                                  list[idx].subcategories.push({
                                    id: `sub-${currentExam.id}-${Date.now()}`,
                                    name,
                                    description: "Custom dynamic folders active.",
                                    sets: [],
                                    components: []
                                  });
                                  setCmsTargetExams(list);
                                  triggerFeedback(`📁 Created directory "${name}"!`);
                                }
                              }
                            );
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Category</span>
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Loop */}
                    <div className="space-y-4">
                      {(!currentExam.subcategories || currentExam.subcategories.length === 0) ? (
                        <div className="text-center p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 text-xs">
                          No subcategories added yet. Click "+ Add Category" to structure your sets.
                        </div>
                      ) : (
                        currentExam.subcategories.map((sub: any, sIdx: number) => (
                          <div key={sub.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5 relative">
                            
                            {/* Subcategory Header */}
                            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                              <div className="flex-grow flex items-center gap-2">
                                <span className="text-xs">📁</span>
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const list = [...cmsTargetExams];
                                    const idx = list.findIndex(ex => ex.id === currentExam.id);
                                    if (idx !== -1) {
                                      list[idx].subcategories[sIdx].name = e.target.value;
                                      setCmsTargetExams(list);
                                    }
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-violet-600 text-xs font-bold text-white focus:outline-none w-52"
                                  placeholder="Category Name"
                                />
                              </div>

                              <div className="flex gap-2 text-[9px] font-bold">
                                {/* Copy Sub */}
                                <button
                                  onClick={() => {
                                    setCopiedSubcategory(sub);
                                    triggerFeedback(`📋 Copied category "${sub.name}"!`);
                                  }}
                                  className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copy</span>
                                </button>

                                {/* Paste Set into this subcategory */}
                                <button
                                  onClick={() => {
                                    if (copiedSet) {
                                      const list = [...cmsTargetExams];
                                      const idx = list.findIndex(ex => ex.id === currentExam.id);
                                      if (idx !== -1) {
                                        const setCopy = deepCopy(copiedSet);
                                        setCopy.id = `custom-pasted-${Date.now()}`;
                                        if (!list[idx].subcategories[sIdx].sets) list[idx].subcategories[sIdx].sets = [];
                                        list[idx].subcategories[sIdx].sets.push(setCopy);
                                        setCmsTargetExams(list);
                                        triggerFeedback(`📋 Pasted set "${setCopy.title}" here!`);
                                      }
                                    }
                                  }}
                                  disabled={!copiedSet}
                                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-30 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Clipboard className="w-2.5 h-2.5" />
                                  <span>Paste Set</span>
                                </button>

                                {/* Add New Set */}
                                <button
                                  onClick={() => {
                                    openPrompt(
                                      "Add Practice Set",
                                      "Enter Custom Practice Set Title:",
                                      "e.g. MEC-UG 2026 Model Set A",
                                      "",
                                      (title) => {
                                        if (!title.trim()) return;
                                        const list = [...cmsTargetExams];
                                        const idx = list.findIndex(ex => ex.id === currentExam.id);
                                        if (idx !== -1) {
                                          if (!list[idx].subcategories[sIdx].sets) list[idx].subcategories[sIdx].sets = [];
                                          list[idx].subcategories[sIdx].sets.push({
                                            id: `custom-${currentExam.id}-${Date.now()}`,
                                            title,
                                            price: 25,
                                            durationMinutes: 60,
                                            isFree: false,
                                            type: "mock-test",
                                            yearOrDate: "2026",
                                            province: "all"
                                          });
                                          setCmsTargetExams(list);
                                          triggerFeedback(`✅ Added customizable set "${title}"!`);
                                        }
                                      }
                                    );
                                  }}
                                  className="text-violet-400 hover:text-violet-300 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>Add Set</span>
                                </button>

                                {/* Remove Category */}
                                <button
                                  onClick={() => {
                                    openConfirm(
                                      "Remove Folder Category",
                                      `Are you absolutely sure you want to remove the entire subcategory folder "${sub.name}"? This deletes all practice sets within it.`,
                                      () => {
                                        const list = [...cmsTargetExams];
                                        const idx = list.findIndex(ex => ex.id === currentExam.id);
                                        if (idx !== -1) {
                                          list[idx].subcategories = list[idx].subcategories.filter((_: any, i: number) => i !== sIdx);
                                          setCmsTargetExams(list);
                                          triggerFeedback(`Removed folder category.`);
                                        }
                                      }
                                    );
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Delete Category
                                </button>
                              </div>
                            </div>

                            {/* Customizable Sets Loop */}
                            <div className="pl-3 border-l-2 border-slate-800 space-y-2">
                              <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase block">Customizable Sets Pool</span>
                              
                              {(!sub.sets || sub.sets.length === 0) ? (
                                <p className="text-[10px] text-slate-500 italic pl-1">No sets mapped under this folder. Mapped sets will sync automatically to the student views.</p>
                              ) : (
                                sub.sets.map((set: any, setIdx: number) => (
                                  <div key={set.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center text-xs">
                                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono text-violet-400 bg-violet-900/10 px-1.5 py-0.5 rounded border border-violet-500/10 uppercase">
                                          {set.id}
                                        </span>
                                        <input
                                          type="text"
                                          value={set.title}
                                          onChange={(e) => {
                                            const list = [...cmsTargetExams];
                                            const idx = list.findIndex(ex => ex.id === currentExam.id);
                                            if (idx !== -1) {
                                              list[idx].subcategories[sIdx].sets[setIdx].title = e.target.value;
                                              setCmsTargetExams(list);
                                            }
                                          }}
                                          className="bg-transparent border-b border-slate-800 hover:border-slate-700 text-xs font-bold text-white focus:outline-none w-full"
                                        />
                                      </div>

                                      {/* Set properties editing row */}
                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
                                        <div>
                                          <span className="text-[9px] text-slate-500 block">Type</span>
                                          <select
                                            value={set.type}
                                            onChange={(e) => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                list[idx].subcategories[sIdx].sets[setIdx].type = e.target.value;
                                                setCmsTargetExams(list);
                                              }
                                            }}
                                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded p-1 w-full"
                                          >
                                            <option value="mock-test">Mock Test</option>
                                            <option value="past-year">Past Board Paper</option>
                                          </select>
                                        </div>

                                        <div>
                                          <span className="text-[9px] text-slate-500 block">NPR Price</span>
                                          <input
                                            type="number"
                                            value={set.price}
                                            onChange={(e) => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                list[idx].subcategories[sIdx].sets[setIdx].price = parseInt(e.target.value) || 0;
                                                setCmsTargetExams(list);
                                              }
                                            }}
                                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded p-1 w-full"
                                          />
                                        </div>

                                        <div>
                                          <span className="text-[9px] text-slate-500 block">Duration (Min)</span>
                                          <input
                                            type="number"
                                            value={set.durationMinutes}
                                            onChange={(e) => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                list[idx].subcategories[sIdx].sets[setIdx].durationMinutes = parseInt(e.target.value) || 0;
                                                setCmsTargetExams(list);
                                              }
                                            }}
                                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded p-1 w-full font-mono"
                                          />
                                        </div>

                                        <div>
                                          <span className="text-[9px] text-slate-500 block">Year/Date</span>
                                          <input
                                            type="text"
                                            value={set.yearOrDate || ""}
                                            onChange={(e) => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                list[idx].subcategories[sIdx].sets[setIdx].yearOrDate = e.target.value;
                                                setCmsTargetExams(list);
                                              }
                                            }}
                                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded p-1 w-full"
                                            placeholder="2026"
                                          />
                                        </div>

                                        <div>
                                          <span className="text-[9px] text-slate-500 block">Access Plan</span>
                                          <button
                                            onClick={() => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                const sObj = list[idx].subcategories[sIdx].sets[setIdx];
                                                sObj.isFree = !sObj.isFree;
                                                if (sObj.isFree) sObj.price = 0;
                                                setCmsTargetExams(list);
                                              }
                                            }}
                                            className={`text-[9px] font-bold p-1 w-full rounded border text-center transition-colors ${
                                              set.isFree 
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                                : "bg-slate-900 border-slate-800 text-slate-400"
                                            }`}
                                          >
                                            {set.isFree ? "🔓 FREE" : "🔒 PAID"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex md:flex-col gap-2 shrink-0">
                                      {/* Copy Set */}
                                      <button
                                        onClick={() => {
                                          setCopiedSet(set);
                                          triggerFeedback(`📋 Copied set "${set.title}" to clipboard!`);
                                        }}
                                        className="px-2 py-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </button>
                                      
                                      {/* Duplicate Set */}
                                      <button
                                        onClick={() => {
                                          const list = [...cmsTargetExams];
                                          const idx = list.findIndex(ex => ex.id === currentExam.id);
                                          if (idx !== -1) {
                                            const setDupe = deepCopy(set);
                                            setDupe.id = `custom-${currentExam.id}-dupe-${Date.now()}`;
                                            setDupe.title = `${set.title} (Copy)`;
                                            list[idx].subcategories[sIdx].sets.push(setDupe);
                                            setCmsTargetExams(list);
                                            triggerFeedback(`📋 Duplicated set "${set.title}"!`);
                                          }
                                        }}
                                        className="px-2 py-1 hover:bg-slate-900 text-amber-400 hover:text-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Layers className="w-3 h-3" />
                                        <span>Duplicate</span>
                                      </button>

                                      {/* Remove Set */}
                                      <button
                                        onClick={() => {
                                          openConfirm(
                                            "Delete Practice Set",
                                            `Are you sure you want to remove the practice set "${set.title}"?`,
                                            () => {
                                              const list = [...cmsTargetExams];
                                              const idx = list.findIndex(ex => ex.id === currentExam.id);
                                              if (idx !== -1) {
                                                list[idx].subcategories[sIdx].sets = list[idx].subcategories[sIdx].sets.filter((_: any, i: number) => i !== setIdx);
                                                setCmsTargetExams(list);
                                                triggerFeedback(`Removed set.`);
                                              }
                                            }
                                          );
                                        }}
                                        className="px-2 py-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. SUBJECT-WISE PRACTICE SYLLABUS CUSTOMIZER */}
                {examSubTab === "subject-practice" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                      🧬 Subject Classifications & Marks Distribution for {currentExam?.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Configure dynamic syllabus chapters, weights, and categories for the Subject-Wise Practice Dashboard page.
                    </p>

                    {(() => {
                      const currentExamStyle = currentExam?.style || (currentExam?.id === "mec-ug" || currentExam?.id?.includes("ug") || currentExam?.id?.toLowerCase().includes("undergrad") ? "mec-ug" : "mec-pg");

                      if (currentExamStyle === "mec-ug") {
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center mb-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-violet-400">Syllabus Subject Weightage Matrix ({currentExam?.name})</span>
                              
                              {/* Add Subject Select Dropdown */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Add Subject:</span>
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    if (val === "CUSTOM_UG") {
                                      openPrompt(
                                        "Add Custom UG Subject",
                                        "Enter name of custom undergraduate subject:",
                                        "e.g. Applied Botany",
                                        "",
                                        (name) => {
                                          if (!name.trim()) return;
                                          const newItem = {
                                            subject: name,
                                            icon: "🧬",
                                            weight: 20,
                                            targetExam: selectedExamId,
                                            enabled: true,
                                            topics: []
                                          };
                                          setCmsMecUgClassification([...cmsMecUgClassification, newItem]);
                                          triggerFeedback(`✅ Added "${name}" subject!`);
                                        }
                                      );
                                    } else {
                                      const template = [
                                        { name: "Physics", icon: "⚡", weight: 50 },
                                        { name: "Chemistry", icon: "🧪", weight: 50 },
                                        { name: "Botany", icon: "🌿", weight: 40 },
                                        { name: "Zoology", icon: "🦁", weight: 40 },
                                        { name: "MAT", icon: "🧠", weight: 20 }
                                      ].find(t => t.name === val);
                                      if (template) {
                                        const newItem = {
                                          subject: template.name,
                                          icon: template.icon,
                                          weight: template.weight,
                                          targetExam: selectedExamId,
                                          enabled: true,
                                          topics: []
                                        };
                                        setCmsMecUgClassification([...cmsMecUgClassification, newItem]);
                                        triggerFeedback(`✅ Added "${template.name}" subject!`);
                                      }
                                    }
                                    e.target.value = "";
                                  }}
                                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500 max-w-[200px]"
                                >
                                  <option value="">-- Choose subject --</option>
                                  {[
                                    { name: "Physics", icon: "⚡", weight: 50 },
                                    { name: "Chemistry", icon: "🧪", weight: 50 },
                                    { name: "Botany", icon: "🌿", weight: 40 },
                                    { name: "Zoology", icon: "🦁", weight: 40 },
                                    { name: "MAT", icon: "🧠", weight: 20 }
                                  ]
                                    .filter(t => !cmsMecUgClassification.some(sub => (sub.targetExam === selectedExamId || (!sub.targetExam && selectedExamId === "mec-ug")) && sub.subject === t.name))
                                    .map(t => (
                                      <option key={t.name} value={t.name}>{t.icon} {t.name} ({t.weight} Marks)</option>
                                    ))
                                  }
                                  <option value="CUSTOM_UG">➕ Custom Subject...</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {cmsMecUgClassification.map((sub, sIdx) => {
                                const isMatch = sub.targetExam === selectedExamId || (!sub.targetExam && selectedExamId === "mec-ug");
                                if (!isMatch) return null;

                                return (
                                  <div key={sIdx} className="flex gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                    <span className="text-xs shrink-0">{sub.icon || "🧬"}</span>
                                    <input
                                      type="text"
                                      value={sub.subject}
                                      onChange={(e) => {
                                        const list = [...cmsMecUgClassification];
                                        list[sIdx].subject = e.target.value;
                                        setCmsMecUgClassification(list);
                                      }}
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-medium"
                                    />
                                    <input
                                      type="number"
                                      value={sub.weight}
                                      onChange={(e) => {
                                        const list = [...cmsMecUgClassification];
                                        list[sIdx].weight = parseInt(e.target.value) || 0;
                                        setCmsMecUgClassification(list);
                                      }}
                                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-center text-white font-mono"
                                    />
                                    <span className="text-[10px] text-slate-500 mr-2">Marks</span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        openConfirm(
                                          "Delete Subject",
                                          `Are you sure you want to remove "${sub.subject}" from the ${currentExam?.name} syllabus?`,
                                          () => {
                                            const list = cmsMecUgClassification.filter((_, i) => i !== sIdx);
                                            setCmsMecUgClassification(list);
                                            triggerFeedback(`❌ Removed subject "${sub.subject}"`);
                                          }
                                        );
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                      title="Remove Subject"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center mb-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-amber-400">Board Subject Weightage Matrix ({currentExam?.name})</span>
                              
                              {/* Add Subject Select Dropdown */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Add Subject:</span>
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    if (val === "CUSTOM_PG") {
                                      openPrompt(
                                        "Add Custom Subject",
                                        "Enter name of custom board subject:",
                                        "e.g. Cardiothoracic Surgery",
                                        "",
                                        (name) => {
                                          if (!name.trim()) return;
                                          const newItem = {
                                            category: "preclinical",
                                            subject: name,
                                            icon: "🔬",
                                            weight: 10,
                                            targetExam: selectedExamId,
                                            enabled: true
                                          };
                                          setCmsMecPgClassification([...cmsMecPgClassification, newItem]);
                                          triggerFeedback(`✅ Added custom subject "${name}"!`);
                                        }
                                      );
                                    } else {
                                      const template = [
                                        { name: "Anatomy", icon: "💀", weight: 10, category: "preclinical" },
                                        { name: "Physiology", icon: "🫁", weight: 10, category: "preclinical" },
                                        { name: "Biochemistry", icon: "🧪", weight: 10, category: "preclinical" },
                                        { name: "Pathology", icon: "🔬", weight: 10, category: "preclinical" },
                                        { name: "Microbiology", icon: "🦠", weight: 10, category: "preclinical" },
                                        { name: "Pharmacology", icon: "💊", weight: 10, category: "preclinical" },
                                        { name: "Community Medicine", icon: "🌍", weight: 12, category: "preclinical" },
                                        { name: "Medicine", icon: "🏥", weight: 20, category: "clinical" },
                                        { name: "Surgery", icon: "🔪", weight: 20, category: "clinical" },
                                        { name: "Obstetrics & Gynecology", icon: "🤰", weight: 20, category: "clinical" },
                                        { name: "Pediatrics", icon: "👶", weight: 15, category: "clinical" },
                                        { name: "ENT", icon: "👂", weight: 8, category: "short" },
                                        { name: "Ophthalmology", icon: "👁️", weight: 8, category: "short" },
                                        { name: "Forensic Medicine", icon: "🔍", weight: 5, category: "short" },
                                        { name: "Orthopedics", icon: "🦴", weight: 8, category: "short" },
                                        { name: "Psychiatry", icon: "🧠", weight: 5, category: "short" },
                                        { name: "Dermatology", icon: "🧴", weight: 5, category: "short" },
                                        { name: "Radiology", icon: "🩻", weight: 5, category: "short" },
                                        { name: "Anesthesiology", icon: "💤", weight: 4, category: "short" }
                                      ].find(t => t.name === val);
                                      if (template) {
                                        const newItem = {
                                          category: template.category,
                                          subject: template.name,
                                          icon: template.icon,
                                          weight: template.weight,
                                          targetExam: selectedExamId,
                                          enabled: true
                                        };
                                        setCmsMecPgClassification([...cmsMecPgClassification, newItem]);
                                        triggerFeedback(`✅ Added "${template.name}" subject!`);
                                      }
                                    }
                                    e.target.value = "";
                                  }}
                                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 max-w-[200px]"
                                >
                                  <option value="">-- Choose subject --</option>
                                  {[
                                    { name: "Anatomy", icon: "💀", weight: 10 },
                                    { name: "Physiology", icon: "🫁", weight: 10 },
                                    { name: "Biochemistry", icon: "🧪", weight: 10 },
                                    { name: "Pathology", icon: "🔬", weight: 10 },
                                    { name: "Microbiology", icon: "🦠", weight: 10 },
                                    { name: "Pharmacology", icon: "💊", weight: 10 },
                                    { name: "Community Medicine", icon: "🌍", weight: 12 },
                                    { name: "Medicine", icon: "🏥", weight: 20 },
                                    { name: "Surgery", icon: "🔪", weight: 20 },
                                    { name: "Obstetrics & Gynecology", icon: "🤰", weight: 20 },
                                    { name: "Pediatrics", icon: "👶", weight: 15 },
                                    { name: "ENT", icon: "👂", weight: 8 },
                                    { name: "Ophthalmology", icon: "👁️", weight: 8 },
                                    { name: "Forensic Medicine", icon: "🔍", weight: 5 },
                                    { name: "Orthopedics", icon: "🦴", weight: 8 },
                                    { name: "Psychiatry", icon: "🧠", weight: 5 },
                                    { name: "Dermatology", icon: "🧴", weight: 5 },
                                    { name: "Radiology", icon: "🩻", weight: 5 },
                                    { name: "Anesthesiology", icon: "💤", weight: 4 }
                                  ]
                                    .filter(t => !cmsMecPgClassification.some(sub => (sub.targetExam === selectedExamId || (!sub.targetExam && selectedExamId === "mec-pg")) && sub.subject === t.name))
                                    .map(t => (
                                      <option key={t.name} value={t.name}>{t.icon} {t.name} ({t.weight} Marks)</option>
                                    ))
                                  }
                                  <option value="CUSTOM_PG">➕ Custom Subject...</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {cmsMecPgClassification.map((sub, sIdx) => {
                                const isMatch = sub.targetExam === selectedExamId || (!sub.targetExam && selectedExamId === "mec-pg");
                                if (!isMatch) return null;

                                return (
                                  <div key={sIdx} className="flex gap-2 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                    <span className="text-xs shrink-0">{sub.icon || "🔬"}</span>
                                    <input
                                      type="text"
                                      value={sub.subject}
                                      onChange={(e) => {
                                        const list = [...cmsMecPgClassification];
                                        list[sIdx].subject = e.target.value;
                                        setCmsMecPgClassification(list);
                                      }}
                                      className="flex-grow bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-medium"
                                    />

                                    <select
                                      value={sub.category || "preclinical"}
                                      onChange={(e) => {
                                        const list = [...cmsMecPgClassification];
                                        list[sIdx].category = e.target.value;
                                        setCmsMecPgClassification(list);
                                      }}
                                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                    >
                                      <option value="preclinical">Preclinical</option>
                                      <option value="clinical">Clinical</option>
                                      <option value="short">Short</option>
                                    </select>

                                    <input
                                      type="number"
                                      value={sub.weight || 0}
                                      onChange={(e) => {
                                        const list = [...cmsMecPgClassification];
                                        list[sIdx].weight = parseInt(e.target.value) || 0;
                                        setCmsMecPgClassification(list);
                                      }}
                                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-center text-white font-mono"
                                    />
                                    <span className="text-[10px] text-slate-500 mr-2">Marks</span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        openConfirm(
                                          "Delete Subject",
                                          `Are you sure you want to remove "${sub.subject}" from the ${currentExam?.name} syllabus?`,
                                          () => {
                                            const list = cmsMecPgClassification.filter((_, i) => i !== sIdx);
                                            setCmsMecPgClassification(list);
                                            triggerFeedback(`❌ Removed subject "${sub.subject}"`);
                                          }
                                        );
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                      title="Remove Subject"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* 4. NOTICE AND ALERTS BANNER */}
                {examSubTab === "announcements" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                      📢 Announcements Board News Bulletins
                    </h4>
                    
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400">Dynamic Announcement Notice Board</span>
                        <button
                          onClick={() => {
                            const list = [...(cmsDashboardConfig.news || [])];
                            list.push({
                              id: `news-${Date.now()}`,
                              title: "High-yield NMC Prep alert",
                              date: new Date().toISOString().split("T")[0],
                              summary: "Critical syllabus revision sets have been appended.",
                              category: currentExam?.name || "Notification",
                              enabled: true
                            });
                            setCmsDashboardConfig({
                              ...cmsDashboardConfig,
                              news: list
                            });
                            triggerFeedback("Added new notice bulletin!");
                          }}
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-bold"
                        >
                          + Add Notice Bulletin
                        </button>
                      </div>

                      <div className="space-y-3">
                        {cmsDashboardConfig.news?.map((notice: any, idx: number) => (
                          <div key={notice.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={notice.title}
                                onChange={(e) => {
                                  const list = [...cmsDashboardConfig.news];
                                  list[idx].title = e.target.value;
                                  setCmsDashboardConfig({ ...cmsDashboardConfig, news: list });
                                }}
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-bold"
                              />
                              <input
                                type="text"
                                value={notice.category}
                                onChange={(e) => {
                                  const list = [...cmsDashboardConfig.news];
                                  list[idx].category = e.target.value;
                                  setCmsDashboardConfig({ ...cmsDashboardConfig, news: list });
                                }}
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-violet-400"
                              />
                            </div>
                            <textarea
                              value={notice.summary}
                              onChange={(e) => {
                                const list = [...cmsDashboardConfig.news];
                                list[idx].summary = e.target.value;
                                setCmsDashboardConfig({ ...cmsDashboardConfig, news: list });
                              }}
                              rows={1}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                            />
                            <div className="flex justify-between text-[10px]">
                              <input
                                type="date"
                                value={notice.date}
                                onChange={(e) => {
                                  const list = [...cmsDashboardConfig.news];
                                  list[idx].date = e.target.value;
                                  setCmsDashboardConfig({ ...cmsDashboardConfig, news: list });
                                }}
                                className="bg-slate-900 border border-slate-800 text-slate-400 rounded p-1 font-mono"
                              />
                              <button
                                onClick={() => {
                                  const list = cmsDashboardConfig.news.filter((_: any, i: number) => i !== idx);
                                  setCmsDashboardConfig({ ...cmsDashboardConfig, news: list });
                                  triggerFeedback("Removed notice bulletin");
                                }}
                                className="text-red-400 hover:text-red-300 font-bold"
                              >
                                Remove Notice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. PRICING PLANS */}
                {examSubTab === "pricing" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h4 className="text-sm font-bold text-white">
                        💳 Dynamic subscription Pricing Packages
                      </h4>
                      <button
                        onClick={() => {
                          setCmsPricingConfig([...cmsPricingConfig, {
                            id: Date.now().toString(),
                            days: 30,
                            tag: "Most Popular",
                            title: `30 Days Unlimited ${currentExam?.name || "Pass"}`,
                            description: "Complete unlock of premium questions & answers.",
                            price: 500
                          }]);
                          triggerFeedback("Added plan!");
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                      >
                        + Add Plan Package
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cmsPricingConfig.map((plan, idx) => (
                        <div key={plan.id || idx} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 text-xs relative">
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              value={plan.title}
                              onChange={(e) => {
                                const list = [...cmsPricingConfig];
                                list[idx].title = e.target.value;
                                setCmsPricingConfig(list);
                              }}
                              className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-2 py-1 font-bold w-48"
                            />
                            <button
                              onClick={() => {
                                setCmsPricingConfig(cmsPricingConfig.filter((_, i) => i !== idx));
                                triggerFeedback("Removed pricing plan");
                              }}
                              className="text-red-400 hover:bg-red-500/10 rounded p-1 transition-all"
                            >
                              ×
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-500 block">NPR Price (Rs)</span>
                              <input
                                type="number"
                                value={plan.price}
                                onChange={(e) => {
                                  const list = [...cmsPricingConfig];
                                  list[idx].price = parseInt(e.target.value) || 0;
                                  setCmsPricingConfig(list);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">Duration (Days)</span>
                              <input
                                type="number"
                                value={plan.days}
                                onChange={(e) => {
                                  const list = [...cmsPricingConfig];
                                  list[idx].days = parseInt(e.target.value) || 0;
                                  setCmsPricingConfig(list);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-500 block">Promotional Badge Tag</span>
                            <input
                              type="text"
                              value={plan.tag}
                              onChange={(e) => {
                                const list = [...cmsPricingConfig];
                                list[idx].tag = e.target.value;
                                setCmsPricingConfig(list);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                              placeholder="Super Saver"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. SUPPORT TRIGGERS */}
                {examSubTab === "support" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h4 className="text-sm font-bold text-white">
                        📞 Support Desk & Auto-Reply Keywords
                      </h4>
                      <button
                        onClick={() => {
                          openPrompt(
                            "Add Support Trigger Keyword",
                            "Enter trigger word (e.g. payment, nmcle):",
                            "payment",
                            "",
                            (triggerWord) => {
                              if (!triggerWord.trim()) return;
                              const list = [...(cmsSupportConfig.autoResponses || [])];
                              list.push({
                                keyword: triggerWord.toLowerCase(),
                                response: "Thank you for contacting billing. If you used eSewa or Khalti, please allow up to 10 minutes for automated license sync."
                              });
                              setCmsSupportConfig({
                                ...cmsSupportConfig,
                                autoResponses: list
                              });
                              triggerFeedback("Added bot response trigger!");
                            }
                          );
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                      >
                        + Add Bot Keyword
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cmsSupportConfig.autoResponses?.map((bot: any, idx: number) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-violet-400 uppercase font-black tracking-wider">
                              keyword: "{bot.keyword}"
                            </span>
                            <button
                              onClick={() => {
                                const list = cmsSupportConfig.autoResponses.filter((_: any, i: number) => i !== idx);
                                setCmsSupportConfig({ ...cmsSupportConfig, autoResponses: list });
                                triggerFeedback("Removed trigger");
                              }}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              × Remove
                            </button>
                          </div>
                          <textarea
                            value={bot.response}
                            onChange={(e) => {
                              const list = [...cmsSupportConfig.autoResponses];
                              list[idx].response = e.target.value;
                              setCmsSupportConfig({ ...cmsSupportConfig, autoResponses: list });
                            }}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* =======================================================
            SECTION 5: PREMIUM SUBSCRIPTION CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "subscription" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">💎 5. Premium Packages & Gateway Config</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize the billing hero copy, promo badge, benefits checklist, and available gateways.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Form: General Text & Promos */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>📝</span> Copywriting & Header Text
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Screen Title</label>
                    <input
                      type="text"
                      value={cmsSubscriptionConfig?.title || ""}
                      onChange={(e) => setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Screen Subtitle</label>
                    <textarea
                      value={cmsSubscriptionConfig?.subtitle || ""}
                      onChange={(e) => setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, subtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Promo Banner Message</label>
                    <input
                      type="text"
                      value={cmsSubscriptionConfig?.promoBanner || ""}
                      onChange={(e) => setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, promoBanner: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Gateways customizer */}
                <div className="space-y-3 pt-3 border-t border-slate-900">
                  <h4 className="text-xs font-bold text-slate-300">🏪 Active Payment Gateways</h4>
                  
                  {(cmsSubscriptionConfig?.paymentMethods || []).map((gateway: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={gateway.logo}
                            onChange={(e) => {
                              const list = [...cmsSubscriptionConfig.paymentMethods];
                              list[idx].logo = e.target.value;
                              setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, paymentMethods: list });
                            }}
                            className="w-12 bg-slate-950 border border-slate-800 text-center rounded px-2 py-1 text-xs text-white font-bold"
                            placeholder="Logo"
                          />
                          <input
                            type="text"
                            value={gateway.name}
                            onChange={(e) => {
                              const list = [...cmsSubscriptionConfig.paymentMethods];
                              list[idx].name = e.target.value;
                              setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, paymentMethods: list });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-bold"
                            placeholder="Gateway Name"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={gateway.description}
                        onChange={(e) => {
                          const list = [...cmsSubscriptionConfig.paymentMethods];
                          list[idx].description = e.target.value;
                          setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, paymentMethods: list });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400"
                        placeholder="Short instruction details"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Form: Benefits Checklist */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>🚀</span> Premium Access Benefits Checklist
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(cmsSubscriptionConfig?.benefits || [])];
                      list.push("New custom medical benefit access standard");
                      setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, benefits: list });
                      triggerFeedback("Benefit item added!");
                    }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Benefit
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {(cmsSubscriptionConfig?.benefits || []).map((benefit: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => {
                          const list = [...cmsSubscriptionConfig.benefits];
                          list[idx] = e.target.value;
                          setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, benefits: list });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...cmsSubscriptionConfig.benefits];
                          list.splice(idx, 1);
                          setCmsSubscriptionConfig({ ...cmsSubscriptionConfig, benefits: list });
                          triggerFeedback("Benefit removed");
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 6: REFER & EARN CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "refer-earn" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">🎁 6. Refer & Earn Rewards Program</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize referral reward points, copy template, instructions, and milestone program rules.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Form: Points Values and Texts */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>💰</span> Points Settings & Copywriting
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Referral Screen Title</label>
                    <input
                      type="text"
                      value={cmsReferEarnConfig?.title || ""}
                      onChange={(e) => setCmsReferEarnConfig({ ...cmsReferEarnConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Referral Subtitle / Body Copy</label>
                    <textarea
                      value={cmsReferEarnConfig?.subtitle || ""}
                      onChange={(e) => setCmsReferEarnConfig({ ...cmsReferEarnConfig, subtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pts per Registration</label>
                      <input
                        type="number"
                        value={cmsReferEarnConfig?.pointsPerReg || 50}
                        onChange={(e) => setCmsReferEarnConfig({ ...cmsReferEarnConfig, pointsPerReg: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pts per Paid Upgrade</label>
                      <input
                        type="number"
                        value={cmsReferEarnConfig?.pointsPerSub || 500}
                        onChange={(e) => setCmsReferEarnConfig({ ...cmsReferEarnConfig, pointsPerSub: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Promo Invite Social Text Template</label>
                    <textarea
                      value={cmsReferEarnConfig?.promoMessage || ""}
                      onChange={(e) => setCmsReferEarnConfig({ ...cmsReferEarnConfig, promoMessage: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Form: Milestone Rules */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>📋</span> Step-by-Step Program Rules
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(cmsReferEarnConfig?.rules || [])];
                      list.push("Invite new friend with bonus points unlocked");
                      setCmsReferEarnConfig({ ...cmsReferEarnConfig, rules: list });
                      triggerFeedback("Milestone rule step added!");
                    }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step Rule
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {(cmsReferEarnConfig?.rules || []).map((rule: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">Step {idx + 1}</span>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => {
                          const list = [...cmsReferEarnConfig.rules];
                          list[idx] = e.target.value;
                          setCmsReferEarnConfig({ ...cmsReferEarnConfig, rules: list });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...cmsReferEarnConfig.rules];
                          list.splice(idx, 1);
                          setCmsReferEarnConfig({ ...cmsReferEarnConfig, rules: list });
                          triggerFeedback("Rule step removed");
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 7: DASHBOARD CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "dashboard" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">📊 7. Dashboard Labels & Copywriting</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize welcoming texts, preparing for labels, and direct paper practice descriptions on the main screen.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preparing For Tagline</label>
                  <input
                    type="text"
                    value={cmsDashboardConfig?.preparingFor || ""}
                    onChange={(e) => setCmsDashboardConfig({ ...cmsDashboardConfig, preparingFor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    placeholder="Currently Preparing For"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Papers Available Subtext</label>
                  <input
                    type="text"
                    value={cmsDashboardConfig?.papersAvailable || ""}
                    onChange={(e) => setCmsDashboardConfig({ ...cmsDashboardConfig, papersAvailable: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    placeholder="sets of previous board papers and new mock modules available."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Papers Grid Title</label>
                  <input
                    type="text"
                    value={cmsDashboardConfig?.arenaTitle || ""}
                    onChange={(e) => setCmsDashboardConfig({ ...cmsDashboardConfig, arenaTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    placeholder="Practice MCQ Arena"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Papers Grid Subtitle</label>
                  <input
                    type="text"
                    value={cmsDashboardConfig?.arenaSubtitle || ""}
                    onChange={(e) => setCmsDashboardConfig({ ...cmsDashboardConfig, arenaSubtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    placeholder="Select any of the curated question papers below to begin..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loksewa Province Selector Subtitle</label>
                <input
                  type="text"
                  value={cmsDashboardConfig?.arenaSelectSubtitle || ""}
                  onChange={(e) => setCmsDashboardConfig({ ...cmsDashboardConfig, arenaSelectSubtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="Choose a specific Nepalese province or central public service commission..."
                />
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 8: SAVED QUESTIONS & MY REPORT CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "saved-report" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">💾 8. Bookmarked Questions & Performance Reports</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize title tags, descriptions, and metric labels for the student revision list and analytics dashboards.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Saved Questions Config */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>📌</span> Saved Questions Revision Section
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Revision Section Title</label>
                    <input
                      type="text"
                      value={cmsSavedQuestionsConfig?.title || ""}
                      onChange={(e) => setCmsSavedQuestionsConfig({ ...cmsSavedQuestionsConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="Saved Questions Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Revision Section Subtitle</label>
                    <textarea
                      value={cmsSavedQuestionsConfig?.subtitle || ""}
                      onChange={(e) => setCmsSavedQuestionsConfig({ ...cmsSavedQuestionsConfig, subtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="View and solve difficult clinical medical questions bookmarked during practice sessions."
                    />
                  </div>
                </div>
              </div>

              {/* My Report Config */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>📈</span> Performance & Analytics Reporting
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Report Dashboard Title</label>
                    <input
                      type="text"
                      value={cmsMyReportConfig?.title || ""}
                      onChange={(e) => setCmsMyReportConfig({ ...cmsMyReportConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="Personalized Analytics Portfolio"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Report Dashboard Subtitle</label>
                    <textarea
                      value={cmsMyReportConfig?.subtitle || ""}
                      onChange={(e) => setCmsMyReportConfig({ ...cmsMyReportConfig, subtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="Track your simulated board completion logs, accuracies, and test records below."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 9: DISCUSSION FORUM CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "discussion" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">💬 9. Discussion Forum Configurations</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize category filters, labels, and thread submission headlines for the community discussion area.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300">📝 Forum Branding & Texts</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forum Title</label>
                    <input
                      type="text"
                      value={cmsDiscussionForumConfig?.title || ""}
                      onChange={(e) => setCmsDiscussionForumConfig({ ...cmsDiscussionForumConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="Medical Student Forum"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forum Subtitle</label>
                    <textarea
                      value={cmsDiscussionForumConfig?.subtitle || ""}
                      onChange={(e) => setCmsDiscussionForumConfig({ ...cmsDiscussionForumConfig, subtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      placeholder="Ask doubts, share clinical explanations, and discuss answers with peers."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300">🏷️ Discussion Categories</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(cmsDiscussionForumConfig?.categories || [])];
                      list.push("New Category Topic");
                      setCmsDiscussionForumConfig({ ...cmsDiscussionForumConfig, categories: list });
                      triggerFeedback("Category added!");
                    }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tag
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(cmsDiscussionForumConfig?.categories || []).map((cat: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => {
                          const list = [...cmsDiscussionForumConfig.categories];
                          list[idx] = e.target.value;
                          setCmsDiscussionForumConfig({ ...cmsDiscussionForumConfig, categories: list });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...cmsDiscussionForumConfig.categories];
                          list.splice(idx, 1);
                          setCmsDiscussionForumConfig({ ...cmsDiscussionForumConfig, categories: list });
                          triggerFeedback("Category removed");
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 10: LEADERBOARD & ABOUT US CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "leaderboard-about" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">🏆 10. National Leaderboards & About Us Board</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Edit leaderboard rankings, customizable top candidates, and expand about us board member details.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard Config */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300">🏆 Leaderboard Copy & Mock Candidates</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Leaderboard Title</label>
                    <input
                      type="text"
                      value={cmsLeaderboardConfig?.title || ""}
                      onChange={(e) => setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Leaderboard Subtitle</label>
                    <textarea
                      value={cmsLeaderboardConfig?.subtitle || ""}
                      onChange={(e) => setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, subtitle: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Top Candidates</span>
                    <button
                      onClick={() => {
                        const list = [...(cmsLeaderboardConfig?.competitors || [])];
                        list.push({
                          name: "Dr. New Candidate",
                          avatarUrl: "https://ui-avatars.com/api/?name=New+Candidate&background=10b981&color=fff&bold=true&size=128",
                          totalCorrect: 120,
                          testsCompleted: 5,
                          accuracy: 80,
                          city: "Kathmandu"
                        });
                        setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                        triggerFeedback("Candidate added to board standings!");
                      }}
                      className="text-[9px] text-violet-400 font-bold"
                    >
                      + Add Candidate
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(cmsLeaderboardConfig?.competitors || []).map((cand: any, idx: number) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-xl border border-slate-850 flex items-center gap-2 text-[10px]">
                        <input
                          type="text"
                          value={cand.name}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[idx].name = e.target.value;
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-white"
                          placeholder="Name"
                        />
                        <input
                          type="number"
                          value={cand.totalCorrect}
                          onChange={(e) => {
                            const list = [...cmsLeaderboardConfig.competitors];
                            list[idx].totalCorrect = Number(e.target.value);
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                          }}
                          className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-1 text-white text-center font-mono"
                          placeholder="Score"
                        />
                        <button
                          onClick={() => {
                            const list = cmsLeaderboardConfig.competitors.filter((_: any, i: number) => i !== idx);
                            setCmsLeaderboardConfig({ ...cmsLeaderboardConfig, competitors: list });
                            triggerFeedback("Candidate removed");
                          }}
                          className="text-red-400 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* About Us & Editorial board */}
              <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-bold text-slate-300">📖 About Us Hero & Editorial Board</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">About Title</label>
                    <input
                      type="text"
                      value={cmsAboutTitle || ""}
                      onChange={(e) => setCmsAboutTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">About Body Copy</label>
                    <textarea
                      value={cmsAboutBody || ""}
                      onChange={(e) => setCmsAboutBody(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Eminent Editorial Board Members</span>
                    <button
                      onClick={() => {
                        const list = [...cmsEditorialTeam];
                        list.push({
                          name: "Prof. Dr. New Board Director",
                          role: "Consultant Medical Director",
                          institution: "IOM / Teaching Hospital, Kathmandu",
                          avatar: "https://ui-avatars.com/api/?name=New+Doctor&background=7c3aed&color=fff&bold=true&size=128",
                          specialty: "Clinical Medicine, Licensure Exams Specialist",
                          enabled: true
                        });
                        setCmsEditorialTeam(list);
                        triggerFeedback("Editorial team profile card added!");
                      }}
                      className="text-[9px] text-violet-400 font-bold"
                    >
                      + Add Director
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cmsEditorialTeam.map((member: any, idx: number) => (
                      <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-2">
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              const list = [...cmsEditorialTeam];
                              list[idx].name = e.target.value;
                              setCmsEditorialTeam(list);
                            }}
                            className="bg-transparent border-b border-slate-800 text-xs font-bold text-white focus:outline-none w-1/2"
                            placeholder="Name"
                          />
                          <button
                            onClick={() => {
                              const list = cmsEditorialTeam.filter((_, i) => i !== idx);
                              setCmsEditorialTeam(list);
                              triggerFeedback("Director profile removed");
                            }}
                            className="text-xs text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const list = [...cmsEditorialTeam];
                              list[idx].role = e.target.value;
                              setCmsEditorialTeam(list);
                            }}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300"
                            placeholder="Role"
                          />
                          <input
                            type="text"
                            value={member.specialty}
                            onChange={(e) => {
                              const list = [...cmsEditorialTeam];
                              list[idx].specialty = e.target.value;
                              setCmsEditorialTeam(list);
                            }}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300"
                            placeholder="Specialty"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 11: SUPPORT & ADMIN CONFIGS 
            ======================================================= */}
        {activeMasterSection === "support-admin" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">💁 11. Support Center Contact & Admin Parameters</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Configure institutional helpline numbers, contact office address details, and verify question drafting rules.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold text-slate-300">📞 Support Desk Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Office Physical Address</label>
                  <textarea
                    value={cmsSupportConfig?.officeText || ""}
                    onChange={(e) => setCmsSupportConfig({ ...cmsSupportConfig, officeText: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Support Phone & Hours</label>
                  <textarea
                    value={cmsSupportConfig?.phoneText || ""}
                    onChange={(e) => setCmsSupportConfig({ ...cmsSupportConfig, phoneText: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Support Email Addresses Text</label>
                <input
                  type="text"
                  value={cmsSupportConfig?.emailText || ""}
                  onChange={(e) => setCmsSupportConfig({ ...cmsSupportConfig, emailText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            SECTION 12: BUTTON STYLES CUSTOMIZER 
            ======================================================= */}
        {activeMasterSection === "button-styles" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">🎨 12. Active Buttons Visual Styles</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Customize tailwind background classes, display text, and text colors for key transactional pathways.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCMS}
                disabled={isSavingCms}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="space-y-4">
              {(!cmsButtonStyles || cmsButtonStyles.length === 0) ? (
                <div className="text-center p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 text-xs">
                  No custom buttons styles defined yet. Using standard system aesthetic definitions.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cmsButtonStyles.map((style: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-violet-400 uppercase font-black tracking-widest">{style.category} Action</span>
                        <span 
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-lg ${
                            style.bgColor && !style.bgColor.startsWith("#") ? style.bgColor : (!style.bgColor ? "bg-violet-600" : "")
                          } ${
                            style.textColor && !style.textColor.startsWith("#") ? style.textColor : (!style.textColor ? "text-white" : "")
                          }`}
                          style={{
                            backgroundColor: style.bgColor && style.bgColor.startsWith("#") ? style.bgColor : undefined,
                            color: style.textColor && style.textColor.startsWith("#") ? style.textColor : undefined,
                          }}
                        >
                          {style.editableText || style.label || "Action"}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Button Display Text</label>
                          <input
                            type="text"
                            value={style.editableText || style.label || ""}
                            onChange={(e) => {
                              const list = [...cmsButtonStyles];
                              list[idx].editableText = e.target.value;
                              setCmsButtonStyles(list);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-medium focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Bg Tailwind Class</label>
                            <input
                              type="text"
                              value={style.bgColor || ""}
                              onChange={(e) => {
                                const list = [...cmsButtonStyles];
                                list[idx].bgColor = e.target.value;
                                setCmsButtonStyles(list);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-mono focus:outline-none focus:border-violet-500"
                              placeholder="bg-violet-600 hover:bg-violet-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Text Tailwind Class</label>
                            <input
                              type="text"
                              value={style.textColor || ""}
                              onChange={(e) => {
                                const list = [...cmsButtonStyles];
                                list[idx].textColor = e.target.value;
                                setCmsButtonStyles(list);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px] font-mono focus:outline-none focus:border-violet-500"
                              placeholder="text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Dialog Modal for Sandboxed/iFrame Environment */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-200 font-sans">
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-white leading-tight flex items-center gap-2">
                <span className="p-1 bg-violet-600/10 text-violet-400 rounded">💡</span>
                <span>{dialogState.title}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {dialogState.message}
              </p>
            </div>

            {dialogState.type === "prompt" && (
              <div>
                <input
                  type="text"
                  autoFocus
                  placeholder={dialogState.placeholder}
                  value={dialogState.inputValue}
                  onChange={(e) => setDialogState(prev => ({ ...prev, inputValue: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      dialogState.onConfirm(dialogState.inputValue);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => dialogState.onConfirm(dialogState.inputValue)}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {dialogState.type === "prompt" ? "Submit" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
