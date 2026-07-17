/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, 
  HelpCircle, 
  Sparkles, 
  Lock, 
  Unlock, 
  Calendar, 
  Check, 
  Bookmark, 
  CreditCard,
  X,
  Zap,
  Tag,
  ChevronLeft,
  MapPin
} from "lucide-react";
import { QuestionSet, UserProfile } from "../types";

interface ExamSpecificViewProps {
  targetExam: string;
  allSets: QuestionSet[];
  userProfile: UserProfile;
  onUnlockSet: (setId: string) => void;
  onSubscribe: (examType: string, planDays: number, price: number) => void;
  onSelectSet: (setId: string) => void;
  onBack?: () => void;
  cmsContent?: any;
  dbExams?: any[];
}

export default function ExamSpecificView({
  targetExam,
  allSets,
  userProfile,
  onUnlockSet,
  onSubscribe,
  onSelectSet,
  onBack,
  cmsContent,
  dbExams = []
}: ExamSpecificViewProps) {
  const [filterType, setFilterType] = useState<"all" | "past-year" | "mock-test" | "free">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"set" | "pass">("pass");
  const [targetPurchaseId, setTargetPurchaseId] = useState<string | null>(null);
  const [targetPurchasePrice, setTargetPurchasePrice] = useState<number>(0);
  const [targetPurchaseName, setTargetPurchaseName] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<"esewa" | "khalti" | "imepay">("esewa");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter sets for current exam
  const currentExamSets = allSets.filter(s => s.examType === targetExam);

  // Extract years for past papers dropdown
  const pastPaperYears = Array.from(
    new Set(
      currentExamSets
        .filter(s => s.type === "past-year" && s.yearOrDate)
        .map(s => s.yearOrDate!.substring(0, 4))
    )
  );

  // Check if exam is fully subscribed
  const hasActiveSub = userProfile.subscription && 
                     (userProfile.subscription.examType === targetExam || userProfile.subscription.examType === "all") &&
                     new Date(userProfile.subscription.expiresAt).getTime() > Date.now();

  // Filter sets based on tabs and provinces
  const filteredSets = currentExamSets.filter(set => {
    if (targetExam === "loksewa" && selectedProvince !== "all" && set.province !== selectedProvince) return false;
    if (filterType === "past-year" && set.type !== "past-year") return false;
    if (filterType === "mock-test" && set.type !== "mock-test") return false;
    if (filterType === "free" && !set.isFree) return false;

    // Year filter for past year questions
    if (set.type === "past-year" && selectedYear !== "all") {
      const year = set.yearOrDate?.substring(0, 4);
      if (year !== selectedYear) return false;
    }

    return true;
  });

  // Sort sets chronologically descending (newest first)
  const sortedSets = [...filteredSets].sort((a, b) => {
    const valA = a.yearOrDate || "";
    const valB = b.yearOrDate || "";
    return valB.localeCompare(valA);
  });

  const examLabels: { [key: string]: string } = {};
  if (dbExams && dbExams.length > 0) {
    dbExams.forEach(exam => {
      examLabels[exam.slug || exam.code] = exam.name;
    });
  } else {
    examLabels["mec-ug"] = "MEC-UG Undergraduate";
    examLabels["mec-pg"] = "MEC-PG Postgraduate";
    examLabels["nmcle"] = "NMCLE Licensing Board";
    examLabels["ku-mcq"] = "Kathmandu University Entrance";
    examLabels["loksewa"] = "Loksewa Medical Officer";
  }

  const examDescriptions: { [key: string]: string } = {};
  if (dbExams && dbExams.length > 0) {
    dbExams.forEach(exam => {
      examDescriptions[exam.slug || exam.code] = exam.description || `Prepare for ${exam.name} with our high-yield test series.`;
    });
  } else {
    examDescriptions["mec-ug"] = "Medical Education Commission - Undergraduate (MBBS/BDS/BSc Nursing Entrance Exam preparation modules and detailed past papers).";
    examDescriptions["mec-pg"] = "Medical Education Commission - Postgraduate (MD/MS MDGP entrance modules with advanced clinical case explanations).";
    examDescriptions["nmcle"] = "Nepal Medical Council Licensing Exam (booster question sets aligned with official syllabus blocks & past papers).";
    examDescriptions["ku-mcq"] = "Kathmandu University undergraduate entrance and licensing examination past question bank.";
    examDescriptions["loksewa"] = "Public Service Commission (Loksewa Aayog) General Medical Officer and Healthcare Services exams.";
  }

  const currentCmsExam = cmsContent?.targetExams?.find((e: any) => e.id === targetExam);
  const headingText = currentCmsExam?.setwiseHeading || currentCmsExam?.name || examLabels[targetExam] || "Target Arena";
  const subheadingText = currentCmsExam?.setwiseSubheading || currentCmsExam?.description || examDescriptions[targetExam] || "Select any of the curated question papers below to begin...";

  const handleOpenSetPurchase = (set: QuestionSet) => {
    setPurchaseType("set");
    setTargetPurchaseId(set.id);
    setTargetPurchasePrice(set.price);
    setTargetPurchaseName(set.title);
    setShowPurchaseModal(true);
  };

  const handleOpenPassPurchase = (name: string, price: number, days: number) => {
    setPurchaseType("pass");
    setTargetPurchaseId(`${days}-days`);
    setTargetPurchasePrice(price);
    setTargetPurchaseName(name);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPurchaseModal(false);
      
      if (purchaseType === "set" && targetPurchaseId) {
        onUnlockSet(targetPurchaseId);
      } else if (purchaseType === "pass" && targetPurchaseId) {
        const days = parseInt(targetPurchaseId.split("-")[0]);
        onSubscribe(targetExam, days, targetPurchasePrice);
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Exam Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="flex items-start gap-4 z-10">
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center mt-1"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-emerald-400 shrink-0" />
              {headingText}
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mt-2 leading-relaxed">
              {subheadingText}
            </p>
          </div>
        </div>

        {hasActiveSub && (
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg text-emerald-400 text-xs font-bold">
            <Unlock className="w-3.5 h-3.5" /> Full Access Pass Active (Expires {new Date(userProfile.subscription!.expiresAt).toLocaleDateString()})
          </div>
        )}
      </div>

      {/* Main Filter Tabs and Content */}
      <div className="space-y-4">
        
        {/* Navigation bar and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-2">
          
          {/* Main tabs */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setFilterType("all"); setSelectedYear("all"); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterType === "all" 
                  ? "bg-slate-800 text-white border border-slate-700" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Sets ({currentExamSets.length})
            </button>
            <button
              onClick={() => { setFilterType("past-year"); setSelectedYear("all"); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterType === "past-year" 
                  ? "bg-slate-800 text-white border border-slate-700" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Past Year Papers
            </button>
            <button
              onClick={() => { setFilterType("mock-test"); setSelectedYear("all"); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterType === "mock-test" 
                  ? "bg-slate-800 text-white border border-slate-700" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mock Tests
            </button>
            <button
              onClick={() => { setFilterType("free"); setSelectedYear("all"); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterType === "free" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Free Sets Only
            </button>
          </div>

          {targetExam === "loksewa" && (
            <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Province Filter:
              </span>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
              >
                <option value="all">All Provinces / Central</option>
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

          {/* Sub-Filters: Date/Year selector if Past Years are viewed */}
          {(filterType === "past-year" || filterType === "all") && pastPaperYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date Filter:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                {pastPaperYears.map(year => (
                  <option key={year} value={year}>{year} Sets</option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Set Cards List Grid */}
        {sortedSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedSets.map((set) => {
              const isUnlocked = set.isFree || hasActiveSub || userProfile.purchasedSetIds.includes(set.id);
              
              return (
                <div 
                  key={set.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top status headers */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                        set.type === "past-year" 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        <FileText className="w-3 h-3" />
                        {set.type === "past-year" ? "Past Year" : "Mock Test"}
                      </span>

                      {set.isFree ? (
                        <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-400" /> Free Set
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                      {set.title}
                    </h4>

                    {/* Stats */}
                    <div className="flex items-center gap-x-4 mt-2 text-xs text-slate-500">
                      <span>{set.questions.length} Questions</span>
                      <span>•</span>
                      <span>{set.durationMinutes} Minutes</span>
                      {set.yearOrDate && (
                        <>
                          <span>•</span>
                          <span>{set.yearOrDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="text-left">
                      {set.isFree ? (
                        <p className="text-sm font-black text-emerald-400">FREE</p>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 leading-none">Price</p>
                          <p className="text-sm font-black text-white mt-0.5">Rs. {set.price}</p>
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => onSelectSet(set.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-500/5"
                      >
                        <span>Start Practice</span>
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSetPurchase(set)}
                        className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-amber-500/5"
                      >
                        <span>Buy Set</span>
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300">No question sets match your filters.</p>
            <p className="text-slate-500 text-xs mt-1">Try changing your tab or selecting 'All Sets' above.</p>
          </div>
        )}

      </div>

      {/* Subscription/Access Package Grid (No unsolicited models, fully in scope) */}
      {!hasActiveSub && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">🎯 Unlimited Access Membership</h3>
            <span className="text-xs text-slate-400 font-sans">Unlock all question sets, answers, and AI explanations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Plan 1 */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-xl transition-all flex flex-col justify-between relative">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 mb-3.5 inline-block">
                  Quick Sprint
                </span>
                <h4 className="text-base font-bold text-white">2 Days Full Access</h4>
                <p className="text-xs text-slate-400 mt-1 font-sans">Excellent for a quick review before exam date.</p>
              </div>
              <div className="mt-5">
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-black text-white font-mono">Rs. 100</span>
                  <span className="text-slate-500 text-xs font-sans">/ 2 Days</span>
                </div>
                <button
                  onClick={() => handleOpenPassPurchase("2 Days Unlimited Pass", 100, 2)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Unlock 2-Day Pass
                </button>
              </div>
            </div>

            {/* Plan 2 */}
            <div className="bg-slate-900 border-2 border-emerald-500/30 p-5 rounded-xl transition-all flex flex-col justify-between relative shadow-lg shadow-emerald-500/5">
              <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-900 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 mb-3.5 inline-block">
                  Weekly booster
                </span>
                <h4 className="text-base font-bold text-white">1 Week Unlimited</h4>
                <p className="text-xs text-slate-400 mt-1 font-sans">Thoroughly solve all past questions with full AI explanations.</p>
              </div>
              <div className="mt-5">
                <div className="flex items-baseline gap-1 mb-3 font-mono">
                  <span className="text-2xl font-black text-emerald-400">Rs. 300</span>
                  <span className="text-slate-500 text-xs font-sans">/ Week</span>
                </div>
                <button
                  onClick={() => handleOpenPassPurchase("1 Week Unlimited Pass", 300, 7)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Unlock 7-Day Pass
                </button>
              </div>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-xl transition-all flex flex-col justify-between relative">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 mb-3.5 inline-block">
                  Exam Mastery
                </span>
                <h4 className="text-base font-bold text-white">30 Days Unlimited</h4>
                <p className="text-xs text-slate-400 mt-1 font-sans">Full comprehensive access with upcoming mock updates.</p>
              </div>
              <div className="mt-5">
                <div className="flex items-baseline gap-1 mb-3 font-mono">
                  <span className="text-2xl font-black text-white">Rs. 500</span>
                  <span className="text-slate-500 text-xs font-sans">/ Month</span>
                </div>
                <button
                  onClick={() => handleOpenPassPurchase("1 Month Unlimited Pass", 500, 30)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Unlock 30-Day Pass
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">Checkout Details</h3>
              <p className="text-xs text-slate-400 mt-1">Unlock Nepalese medical prep premium resources instantly</p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 mb-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Product Name</span>
                <span className="font-semibold text-white truncate max-w-[200px]" title={targetPurchaseName}>
                  {targetPurchaseName}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subject / Exam</span>
                <span className="font-semibold text-white capitalize">{examLabels[targetExam]}</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2 flex justify-between text-sm">
                <span className="font-bold text-white">Amount Due</span>
                <span className="font-black text-emerald-400">Rs. {targetPurchasePrice}</span>
              </div>
            </div>

            {/* Nepalese Gateway Selector */}
            <div className="space-y-2.5 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Nepal Payment Option</p>
              
              <div className="grid grid-cols-3 gap-2">
                
                {/* eSewa */}
                <button
                  onClick={() => setSelectedGateway("esewa")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    selectedGateway === "esewa" 
                      ? "border-emerald-500 bg-emerald-500/5 text-white" 
                      : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-slate-950 font-black text-[10px]">
                    e
                  </div>
                  <span className="text-[10px] font-bold">eSewa Pay</span>
                </button>

                {/* Khalti */}
                <button
                  onClick={() => setSelectedGateway("khalti")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    selectedGateway === "khalti" 
                      ? "border-purple-500 bg-purple-500/5 text-white" 
                      : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-slate-950 font-black text-[10px]">
                    k
                  </div>
                  <span className="text-[10px] font-bold">Khalti Wallet</span>
                </button>

                {/* IME Pay */}
                <button
                  onClick={() => setSelectedGateway("imepay")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    selectedGateway === "imepay" 
                      ? "border-red-500 bg-red-500/5 text-white" 
                      : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-slate-950 font-black text-[10px]">
                    i
                  </div>
                  <span className="text-[10px] font-bold">IME Pay</span>
                </button>

              </div>
            </div>

            <button
              onClick={handleConfirmPurchase}
              disabled={isProcessing}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Connecting to Gateway...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Proceed to Secure Pay (Rs. {targetPurchasePrice})
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
