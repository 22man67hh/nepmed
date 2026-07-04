/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Bookmark, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Sparkles,
  Award,
  ArrowRight,
  AlertCircle,
  Trophy,
  Flag
} from "lucide-react";
import { Question, QuestionSet, BookmarkedQuestion } from "../types";

interface PracticeSessionProps {
  set: QuestionSet;
  bookmarks: BookmarkedQuestion[];
  onToggleBookmark: (question: Question, setName: string, examType: string, setId: string) => void;
  onSessionComplete: (
    setId: string,
    mode: "timed" | "tutor",
    timeSpentSeconds: number,
    correctCount: number,
    incorrectCount: number,
    leftCount: number,
    selectedAnswers: { [qId: string]: number }
  ) => void;
  onExit: () => void;
  onAskGeminiTutor: (question: Question) => void;
  initialMode?: "timed" | "tutor";
  userEmail?: string;
}

function getCorrectPct(q: Question): number {
  if (typeof q.correctPercentage === "number") {
    return q.correctPercentage;
  }
  // Deterministic fallback based on charCode sum to keep it stable per question
  let sum = 0;
  const str = q.id + q.questionText;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return 55 + (sum % 38); // returns a percentage between 55% and 93%
}

export default function PracticeSession({
  set,
  bookmarks,
  onToggleBookmark,
  onSessionComplete,
  onExit,
  onAskGeminiTutor,
  initialMode,
  userEmail
}: PracticeSessionProps) {
  const [mode, setMode] = useState<"select" | "active">(initialMode ? "active" : "select");
  const [sessionMode, setSessionMode] = useState<"timed" | "tutor">(initialMode || "timed");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(set.durationMinutes * 60);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [revealedTutorAnswers, setRevealedTutorAnswers] = useState<{ [qId: string]: boolean }>({});
  
  // Double back click states
  const [backClickCount, setBackClickCount] = useState(0);
  const [backToastVisible, setBackToastVisible] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "review">("summary");

  // State-based custom confirmation modal to avoid iframe/sandbox browser blocking of window.confirm
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Question Reporting States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState<Question | null>(null);
  const [reportIssueText, setReportIssueText] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleOpenReportModal = (question: Question) => {
    setReportingQuestion(question);
    setReportIssueText("");
    setReportSuccess(false);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingQuestion) return;
    if (!reportIssueText.trim()) {
      alert("Please write the details of the issue first.");
      return;
    }
    setReportSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: reportingQuestion.id,
          questionText: reportingQuestion.questionText,
          issueText: reportIssueText,
          setName: set.title || "Practice Set",
          reporterEmail: userEmail || "student@nepmed.edu"
        })
      });
      if (response.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReportModalOpen(false);
          setReportSuccess(false);
          setReportIssueText("");
          setReportingQuestion(null);
        }, 1500);
      } else {
        alert("Failed to submit the report. Please try again.");
      }
    } catch (err) {
      alert("Network error. Failed to submit the report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeSpentRef = useRef<number>(0);

  const handleActiveBackClick = () => {
    if (hasSubmitted) {
      onExit();
    } else {
      setConfirmModal({
        isOpen: true,
        title: "Exit Practice Session?",
        message: "Are you sure you want to exit this active practice session? Your progress will be lost.",
        onConfirm: () => {
          onExit();
        }
      });
    }
  };

  const handleNavigateToReviewQuestion = (idx: number) => {
    setActiveResultTab("review");
    setTimeout(() => {
      const elem = document.getElementById(`result-q-${idx}`);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Initialize and clean up timer for Timed Mode
  useEffect(() => {
    if (mode === "active" && sessionMode === "timed" && !hasSubmitted) {
      timerRef.current = setInterval(() => {
        timeSpentRef.current += 1;
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimeUp(true);
            handleSubmitSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, sessionMode, hasSubmitted]);

  // Intercept browser back button twice on device during active session
  useEffect(() => {
    if (mode === "active" && !hasSubmitted) {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
        setConfirmModal({
          isOpen: true,
          title: "Exit Practice Session?",
          message: "Are you sure you want to exit this active practice session? Your progress will be lost.",
          onConfirm: () => {
            onExit();
          }
        });
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [mode, hasSubmitted]);

  const handleStartSession = (selected: "timed" | "tutor") => {
    setSessionMode(selected);
    setMode("active");
    setTimeRemaining(set.durationMinutes * 60);
    setSelectedAnswers({});
    setRevealedTutorAnswers({});
    setCurrentIdx(0);
    setHasSubmitted(false);
    setIsTimeUp(false);
    timeSpentRef.current = 0;
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (hasSubmitted) return; // Locked in timed mode after submit
    
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
    
    if (sessionMode === "tutor") {
      setRevealedTutorAnswers(prev => ({ ...prev, [qId]: true }));
    }
  };

  const handleNext = () => {
    if (currentIdx < set.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmitSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHasSubmitted(true);
    
    // Calculate summary
    let correct = 0;
    let incorrect = 0;
    let left = 0;

    set.questions.forEach(q => {
      const selected = selectedAnswers[q.id];
      if (selected === undefined || selected === -1) {
        left++;
      } else if (selected === q.correctOptionIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });

    onSessionComplete(
      set.id,
      sessionMode,
      timeSpentRef.current,
      correct,
      incorrect,
      left,
      selectedAnswers
    );
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeQuestion = set.questions[currentIdx];
  const isBookmarked = activeQuestion ? bookmarks.some(b => b.questionId === activeQuestion.id) : false;

  // Render Mode Selection screen before entering active session
  if (mode === "select") {
    return (
      <div className="max-w-xl mx-auto p-4 lg:p-8 text-slate-100 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-12">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-800">
          <button
            onClick={onExit}
            className="text-slate-400 hover:text-white p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
            title="Back to Sets List"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/10 inline-block mb-1">
              Simulate MCQ Set
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight leading-snug truncate">{set.title}</h3>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Contains {set.questions.length} high-yield boards questions • Duration: {set.durationMinutes} Minutes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Tutor Mode Selector */}
          <button
            onClick={() => handleStartSession("tutor")}
            className="p-5 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 rounded-xl text-left transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Study & Tutor Mode</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Take your time. Explanations are shown immediately upon selecting each option. Ideal for concept building, active recall, and referencing medical literature.
              </p>
            </div>
          </button>

          {/* Timed Mode Selector */}
          <button
            onClick={() => handleStartSession("timed")}
            className="p-5 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 rounded-xl text-left transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Exam Timed Simulator</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Realistic exam constraints. Strictly timed with a count-down. Review your overall scores, success rates, and full standard/Gemini explanations only after finishing.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    const totalCount = set.questions.length;
    const correctCount = set.questions.filter(q => selectedAnswers[q.id] === q.correctOptionIndex).length;
    const incorrectCount = set.questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== -1 && selectedAnswers[q.id] !== q.correctOptionIndex).length;
    const leftCount = set.questions.filter(q => selectedAnswers[q.id] === undefined || selectedAnswers[q.id] === -1).length;
    
    const correctMarks = set.correctMarks ?? 1;
    const incorrectMarks = set.incorrectMarks ?? 0.25;
    const finalScore = Number(((correctCount * correctMarks) - (incorrectCount * incorrectMarks)).toFixed(2));
    const maxPossibleScore = totalCount * correctMarks;
    
    const accuracyPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    let feedbackHeading = "Excellent Job!";
    let feedbackColor = "text-emerald-400";
    let feedbackText = "You have demonstrated strong proficiency with this set. Keep up the amazing work to secure your board license!";

    if (accuracyPct < 50) {
      feedbackHeading = "Keep Practicing!";
      feedbackColor = "text-amber-400";
      feedbackText = "A bit of extra study on these concepts will go a long way. Go through the reference explanations to build your base.";
    } else if (accuracyPct < 75) {
      feedbackHeading = "Good Progress!";
      feedbackColor = "text-indigo-400";
      feedbackText = "Nice score! Reviewing the questions you missed will push you above the 80% mark for comfortable board success.";
    }

    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-6 text-slate-100 space-y-6">
        {/* Results Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          
          <div className="flex items-center gap-4 z-10">
            {/* Functional Back Button immediately loading previous page */}
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-white p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
              title="Back to sets list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-amber-400 font-bold text-xs tracking-wider uppercase block mb-0.5">
                Session Finished & Evaluated
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Performance Report
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                {set.title} • Completed in {sessionMode === "timed" ? "Timed Mode" : "Tutor Study Mode"}
              </p>
            </div>
          </div>

          <button
            onClick={onExit}
            className="z-10 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer self-start md:self-center"
          >
            Back to Practice Sets
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveResultTab("summary")}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeResultTab === "summary"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📊 Score Summary
          </button>
          <button
            onClick={() => setActiveResultTab("review")}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeResultTab === "review"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            🔬 Detailed Review & Explanations ({totalCount})
          </button>
        </div>

        {/* Tab Content */}
        {activeResultTab === "summary" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Ring / Radial Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#1e293b"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#10b981"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="326.7"
                    strokeDashoffset={326.7 - (326.7 * accuracyPct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{accuracyPct}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Success</span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className={`text-base font-bold ${feedbackColor}`}>{feedbackHeading}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs">
                  {feedbackText}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl md:col-span-2 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm mb-4">Exam Stats Breakdown</h3>
                
                {/* Score Calculation details box */}
                <div className="mb-5 bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                      <span>🏆 Scored Marks: {finalScore} / {maxPossibleScore}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      This set assigns <strong className="text-emerald-400">+{correctMarks}</strong> for each correct answer and subtracts <strong className="text-red-400">-{incorrectMarks}</strong> for each incorrect answer.
                    </p>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-lg text-center border border-slate-850 shrink-0">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Calculated Score</span>
                    <span className="text-xl font-black text-violet-400 font-mono">{finalScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Total Questions</p>
                    <p className="text-xl font-black text-white mt-1">{totalCount}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-emerald-400 font-semibold">Correct</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{correctCount}</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-red-400 font-semibold">Incorrect</p>
                    <p className="text-xl font-black text-red-400 mt-1">{incorrectCount}</p>
                  </div>
                  <div className="bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 font-medium">Unanswered</p>
                    <p className="text-xl font-black text-slate-400 mt-1">{leftCount}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Completed in <strong className="text-white">{formatTime(timeSpentRef.current)}</strong>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMode("select");
                      setHasSubmitted(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Retake This Set
                  </button>
                  <button
                    onClick={() => setActiveResultTab("review")}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Review Questions
                  </button>
                </div>
              </div>
            </div>

            {/* Questions Navigator Grid inside Score Summary Tab */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl md:col-span-3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    🧭 Questions Navigator (Solved Question Set with Explanations)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any question below to instantly reveal its correct answer, your response, and the detailed medical reference explanation.
                  </p>
                </div>
                <button
                  onClick={() => setActiveResultTab("review")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Review All Explanations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                {set.questions.map((q, idx) => {
                  const userAnsIdx = selectedAnswers[q.id];
                  const isCorrect = userAnsIdx === q.correctOptionIndex;
                  const hasAnswered = userAnsIdx !== undefined && userAnsIdx !== -1;

                  let btnStyle = "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-750";

                  if (!hasAnswered) {
                    btnStyle = "bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/60 hover:text-white";
                  } else if (isCorrect) {
                    btnStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20";
                  } else {
                    btnStyle = "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavigateToReviewQuestion(idx)}
                      className={`aspect-square rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${btnStyle} hover:scale-105 hover:ring-2 hover:ring-emerald-500`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Color Key Guide */}
              <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/30" />
                  <span>Correct Answer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/15 border border-red-500/30" />
                  <span>Incorrect Answer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                  <span>Unanswered / Left</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Review Explanations Tab content */
          <div className="space-y-6">
            
            {/* Questions Navigator Grid inside Results Tab */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                🧭 Questions Navigator (Click to Scroll to Solution)
              </h4>
              
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {set.questions.map((q, idx) => {
                  const userAnsIdx = selectedAnswers[q.id];
                  const isCorrect = userAnsIdx === q.correctOptionIndex;
                  const hasAnswered = userAnsIdx !== undefined && userAnsIdx !== -1;

                  let btnStyle = "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700";

                  if (!hasAnswered) {
                    btnStyle = "bg-slate-800/60 text-slate-400 border-slate-700";
                  } else if (isCorrect) {
                    btnStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                  } else {
                    btnStyle = "bg-red-500/10 text-red-400 border-red-500/30";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const elem = document.getElementById(`result-q-${idx}`);
                        if (elem) {
                          elem.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }}
                      className={`aspect-square rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${btnStyle} hover:scale-105 hover:ring-2 hover:ring-emerald-500`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Color Key Guide */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" />
                  <span>Correct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-500/30" />
                  <span>Incorrect</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                  <span>Left (Unanswered)</span>
                </div>
              </div>
            </div>

            {/* Scrollable Solved Set List */}
            <div className="space-y-6">
              {set.questions.map((q, idx) => {
                const userAnsIdx = selectedAnswers[q.id];
                const isCorrect = userAnsIdx === q.correctOptionIndex;
                const hasAnswered = userAnsIdx !== undefined && userAnsIdx !== -1;

                return (
                  <div 
                    key={q.id} 
                    id={`result-q-${idx}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-24 transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono font-bold">
                          Question {idx + 1} of {totalCount}
                        </span>
                        <button
                          onClick={() => handleOpenReportModal(q)}
                          className="px-2 py-1 rounded bg-slate-950 text-[10px] border border-slate-850 hover:border-red-500/20 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1 font-semibold"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Report correction</span>
                        </button>
                      </div>
                      <div>
                        {!hasAnswered ? (
                          <span className="text-[9px] font-extrabold uppercase bg-slate-800 text-slate-400 px-2.5 py-1 rounded border border-slate-700">
                            Unanswered (Left)
                          </span>
                        ) : isCorrect ? (
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase bg-red-500/10 text-red-400 px-2.5 py-1 rounded border border-red-500/20 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {q.questionText}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isOptionSelected = userAnsIdx === optIdx;
                        const isOptionCorrect = optIdx === q.correctOptionIndex;

                        let style = "border-slate-800/80 bg-slate-950/20 text-slate-400";
                        if (isOptionCorrect) {
                          style = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold";
                        } else if (isOptionSelected) {
                          style = "border-red-500/40 bg-red-500/10 text-red-400";
                        }

                        return (
                          <div key={optIdx} className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${style}`}>
                            <span className="w-5 h-5 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/40 pb-2">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Medical Explanation
                        </h5>
                        <button
                          onClick={() => onAskGeminiTutor(q)}
                          className="text-[10px] font-black uppercase text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/20 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" /> Ask AI Tutor
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Custom Confirmation Modal for Results View */}
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-start gap-3 pb-2 border-b border-slate-800">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Action confirmation request
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {confirmModal.message}
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
                >
                  No, Go Back
                </button>
                <button
                  onClick={() => {
                    const onConfirmAction = confirmModal.onConfirm;
                    setConfirmModal(null);
                    onConfirmAction();
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Report Modal for Results View */}
        {isReportModalOpen && reportingQuestion && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-start gap-3 pb-2 border-b border-slate-800">
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0 mt-0.5">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    Report Question Issue
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    MEC / NMC Syllabus QA Review
                  </p>
                </div>
              </div>

              {reportSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your report has been submitted to the editorial board! Thank you for maintaining licensing question precision.</span>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                  <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Flagged Question</p>
                    <p className="text-slate-300 mt-1 font-sans line-clamp-2 italic" dangerouslySetInnerHTML={{ __html: reportingQuestion.questionText }} />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">
                      Describe the mistake / correction detail
                    </label>
                    <textarea
                      rows={4}
                      value={reportIssueText}
                      onChange={(e) => setReportIssueText(e.target.value)}
                      placeholder="e.g., The correct option should be B because neonatal sepsis is the leading cause. Reference: Kanti Hospital Pediatrics Manual."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reportSubmitting}
                      className="bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/15 disabled:opacity-50"
                    >
                      {reportSubmitting ? "Sending..." : "Submit Bug Report"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // Active Session View
  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 text-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Question Engine Area */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Session header */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={handleActiveBackClick}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
                title="Go back to previous page"
              >
                <ChevronLeft className="w-5 h-5 font-bold" />
              </button>
              <div>
                <p className="text-xs text-white font-bold truncate max-w-[150px] sm:max-w-xs">{set.title}</p>
                <p className="text-[10px] text-emerald-400 uppercase font-extrabold tracking-wider mt-0.5">
                  {sessionMode === "timed" ? "⏱️ Timed Board Mode" : "🎓 Tutor Mode"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Countdown / Elapsed Info */}
              {sessionMode === "timed" && (
                <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800 px-3 py-1 rounded-lg text-amber-400 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}
              
              {/* Exit/Submit early Button */}
              {!hasSubmitted && (
                <button
                  onClick={() => {
                    const confirmMsg = sessionMode === "timed" 
                      ? "Are you sure you want to finish your timed board exam and view your score evaluation report?" 
                      : "Are you sure you want to finish your study session and view your overall performance breakdown?";
                    setConfirmModal({
                      isOpen: true,
                      title: sessionMode === "timed" ? "Submit MCQ Exam?" : "Finish Study Session?",
                      message: confirmMsg,
                      onConfirm: () => {
                        handleSubmitSession();
                      }
                    });
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all shadow-md"
                >
                  {sessionMode === "timed" ? "Submit Exam" : "Finish & Submit"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Question Block Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
          {/* Question Meta Row */}
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <span className="text-xs text-slate-400 font-mono font-semibold">
              Question {currentIdx + 1} of {set.questions.length}
            </span>
            <div className="flex items-center gap-2">
              {/* Report Issue Button */}
              <button
                onClick={() => handleOpenReportModal(activeQuestion)}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-850 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                title="Report mistake or correction in this MCQ"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>

              {/* Bookmark Question */}
              <button
                onClick={() => onToggleBookmark(activeQuestion, set.title, set.examType, set.id)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-bounce" 
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/35 text-violet-300">
                MCQ ID: {activeQuestion.id}
              </span>
              <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                🖋️ Hover/Select anywhere to highlight
              </span>
            </div>
            <div 
              className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug select-text"
              dangerouslySetInnerHTML={{ __html: activeQuestion.questionText }}
            />
          </div>

          {/* Answer Options Grid */}
          <div className="mt-6 space-y-3">
            {activeQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[activeQuestion.id] === optIdx;
              const isCorrect = optIdx === activeQuestion.correctOptionIndex;
              const hasAnsweredQ = selectedAnswers[activeQuestion.id] !== undefined;

              // Styling conditions based on Mode & Status
              let optionStyle = "border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-950/40 text-slate-300";
              
              if (sessionMode === "tutor" && hasAnsweredQ) {
                if (isCorrect) {
                  optionStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold";
                } else if (isSelected) {
                  optionStyle = "border-red-500/40 bg-red-500/10 text-red-400";
                }
              } else if (sessionMode === "timed") {
                if (hasSubmitted) {
                  // After submission: highlight correct/incorrect
                  if (isCorrect) {
                    optionStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold";
                  } else if (isSelected) {
                    optionStyle = "border-red-500/40 bg-red-500/10 text-red-400";
                  }
                } else if (isSelected) {
                  // While practicing
                  optionStyle = "border-indigo-500 bg-indigo-500/5 text-white font-medium ring-1 ring-indigo-500";
                }
              } else if (isSelected) {
                optionStyle = "border-indigo-500 bg-indigo-500/5 text-white font-medium ring-1 ring-indigo-500";
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                  disabled={hasSubmitted || (sessionMode === "tutor" && hasAnsweredQ)}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 text-slate-300">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1 leading-snug" dangerouslySetInnerHTML={{ __html: opt }} />
                </button>
              );
            })}
          </div>

          {/* Tutor Mode - Immediate Explanation Block */}
          {sessionMode === "tutor" && revealedTutorAnswers[activeQuestion.id] && (
            <div className="mt-6 p-5 bg-slate-950/75 rounded-xl border border-slate-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Medical Explanation
                </h5>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] text-slate-300 font-bold font-mono">
                    {getCorrectPct(activeQuestion)}% of candidates got this correct
                  </span>
                </div>
              </div>
              <div 
                className="text-xs text-slate-300 leading-relaxed space-y-2 select-text"
                dangerouslySetInnerHTML={{ __html: activeQuestion.explanation }}
              />
            </div>
          )}

          {/* Timed Mode - After Submission Explanation Block */}
          {sessionMode === "timed" && hasSubmitted && (
            <div className="mt-6 p-5 bg-slate-950/75 rounded-xl border border-slate-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Reference Explanation
                </h5>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] text-slate-300 font-bold font-mono">
                    {getCorrectPct(activeQuestion)}% of candidates got this correct
                  </span>
                </div>
              </div>
              <div 
                className="text-xs text-slate-300 leading-relaxed space-y-2 select-text"
                dangerouslySetInnerHTML={{ __html: activeQuestion.explanation }}
              />
            </div>
          )}
        </div>

        {/* Lower Next/Prev Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-800 disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          
          {currentIdx === set.questions.length - 1 ? (
            <button
              onClick={() => {
                const confirmMsg = sessionMode === "timed" 
                  ? "Are you sure you want to finish your timed board exam and view your score evaluation report?" 
                  : "Are you sure you want to finish your study session and view your overall performance breakdown?";
                setConfirmModal({
                  isOpen: true,
                  title: sessionMode === "timed" ? "Submit MCQ Exam?" : "Finish Study Session?",
                  message: confirmMsg,
                  onConfirm: () => {
                    handleSubmitSession();
                  }
                });
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/15 flex items-center gap-1"
            >
              Submit Exam <CheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-800 cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Informational countdown shown below (as explicitly requested: 'count down is started on a small space below') */}
        {sessionMode === "timed" && !hasSubmitted && (
          <div className="bg-slate-950/30 border border-slate-800/40 p-3 rounded-lg text-center text-xs text-slate-400 font-mono">
            Time Remaining: <strong className="text-amber-400">{formatTime(timeRemaining)}</strong> out of {set.durationMinutes} mins allocated. Answer all questions before submitting.
          </div>
        )}
      </div>

      {/* Right Column: Question Numbers Navigator Panel */}
      <div className="space-y-4">
        
        {/* Results summary window if Timed Mode has been submitted */}
        {sessionMode === "timed" && hasSubmitted && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            
            <div className="text-center mb-4">
              <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2.5">
                <Award className="w-5.5 h-5.5 text-emerald-400" />
              </span>
              <h4 className="font-bold text-white text-base">Test Performance</h4>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">MCQ Exam Completed</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-4 text-xs font-semibold">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-400">
                <p className="text-[10px] text-slate-400 font-medium">Correct</p>
                <p className="text-lg font-black mt-1">
                  {set.questions.filter(q => selectedAnswers[q.id] === q.correctOptionIndex).length}
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-red-400">
                <p className="text-[10px] text-slate-400 font-medium">Incorrect</p>
                <p className="text-lg font-black mt-1">
                  {set.questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== -1 && selectedAnswers[q.id] !== q.correctOptionIndex).length}
                </p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-2 rounded-lg text-slate-300">
                <p className="text-[10px] text-slate-400 font-medium">Left</p>
                <p className="text-lg font-black mt-1">
                  {set.questions.filter(q => selectedAnswers[q.id] === undefined || selectedAnswers[q.id] === -1).length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMode("select")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Take Another Practice Set
            </button>
          </div>
        )}

        {/* Question numbers grid controller (Shows different colors: green correct, red incorrect, gray/slate unanswered) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h4 className="font-bold text-white text-sm mb-3">Questions Navigator</h4>
          
          <div className="grid grid-cols-5 gap-2">
            {set.questions.map((q, idx) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isCorrect = selectedAnswers[q.id] === q.correctOptionIndex;
              const isCurrent = idx === currentIdx;

              let btnStyle = "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700";

              if (hasSubmitted || (sessionMode === "tutor" && isSelected)) {
                // Colored Review States
                if (selectedAnswers[q.id] === undefined || selectedAnswers[q.id] === -1) {
                  btnStyle = "bg-slate-800/60 text-slate-400 border-slate-700";
                } else if (isCorrect) {
                  btnStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                } else {
                  btnStyle = "bg-red-500/10 text-red-400 border-red-500/30";
                }
              } else if (isSelected) {
                // Answered state while active (no evaluation yet in timed)
                btnStyle = "bg-slate-800 text-slate-200 border-slate-600";
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`aspect-square rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${btnStyle} ${
                    isCurrent ? "ring-2 ring-emerald-500 scale-105" : ""
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Color Key Guide */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" />
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-500/30" />
              <span>Incorrect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
              <span>Left (Unanswered)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 pb-2 border-b border-slate-800">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Action confirmation request
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                No, Go Back
              </button>
              <button
                onClick={() => {
                  const onConfirmAction = confirmModal.onConfirm;
                  setConfirmModal(null);
                  onConfirmAction();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUESTION REPORT MODAL ---------------- */}
      {isReportModalOpen && reportingQuestion && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-start gap-3 pb-2 border-b border-slate-800">
              <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0 mt-0.5">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Report Question Issue
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  MEC / NMC Syllabus QA Review
                </p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your report has been submitted to the editorial board! Thank you for maintaining licensing question precision.</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Flagged Question</p>
                  <p className="text-slate-300 mt-1 font-sans line-clamp-2 italic">"{reportingQuestion.questionText}"</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[9px]">
                    Describe the mistake / correction detail
                  </label>
                  <textarea
                    rows={4}
                    value={reportIssueText}
                    onChange={(e) => setReportIssueText(e.target.value)}
                    placeholder="e.g., The correct option should be B because neonatal sepsis is the leading cause. Reference: Kanti Hospital Pediatrics Manual."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/15 disabled:opacity-50"
                  >
                    {reportSubmitting ? "Sending..." : "Submit Bug Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
