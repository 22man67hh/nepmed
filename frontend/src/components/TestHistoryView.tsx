/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  History, 
  Calendar, 
  Trophy, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  HelpCircle,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { UserProgress, QuestionSet } from "../types";

interface TestHistoryViewProps {
  progressList: UserProgress[];
  allSets: QuestionSet[];
  onSelectSet: (setId: string) => void;
  onNavigateToDashboard: () => void;
}

export default function TestHistoryView({
  progressList,
  allSets,
  onSelectSet,
  onNavigateToDashboard
}: TestHistoryViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "timed" | "tutor">("all");

  const filteredHistory = progressList.filter(p => {
    if (filterMode !== "all" && p.mode !== filterMode) return false;
    return true;
  });

  // Global metrics
  const totalCompleted = progressList.length;
  const timedCompleted = progressList.filter(p => p.mode === "timed").length;
  const tutorCompleted = progressList.filter(p => p.mode === "tutor").length;

  const avgCorrectPct = totalCompleted > 0
    ? Math.round(
        (progressList.reduce((sum, p) => sum + (p.correctAnswersCount / p.totalQuestions), 0) / totalCompleted) * 100
      )
    : 0;

  const totalTimeSec = progressList.reduce((sum, p) => sum + p.timeSpentSeconds, 0);
  const totalTimeMin = Math.round(totalTimeSec / 60);

  const getSetTitle = (setId: string) => {
    if (setId.startsWith("subject-practice-")) {
      return `Subject Wise Practice (${setId.replace("subject-practice-", "")})`;
    }
    const set = allSets.find(s => s.id === setId);
    return set ? set.title : "Deleted/Unknown Practice Set";
  };

  const getExamLabel = (setId: string) => {
    if (setId.startsWith("subject-practice-")) {
      return "General Practice";
    }
    const set = allSets.find(s => s.id === setId);
    if (!set) return "Medical Set";
    const labels: { [key: string]: string } = {
      "mec-ug": "MEC-UG",
      "mec-pg": "MEC-PG",
      "nmcle": "NMCLE",
      "ku-mcq": "KU MCQ",
      "loksewa": "Loksewa"
    };
    return labels[set.examType] || set.examType.toUpperCase();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-400" />
            My Test Practice History
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Review detailed reports, scores, answer keys, and diagnostic insights of your mock simulations.
          </p>
        </div>
        <button
          onClick={onNavigateToDashboard}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </button>
      </div>

      {/* History Scorecard Summary */}
      {totalCompleted > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Average Success</p>
              <h3 className="text-xl font-black text-white mt-1">{avgCorrectPct}%</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Overall accuracy rate</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Completed Sets</p>
              <h3 className="text-xl font-black text-white mt-1">{totalCompleted}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {timedCompleted} Timed | {tutorCompleted} Tutor
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Time Spent</p>
              <h3 className="text-xl font-black text-white mt-1">
                {totalTimeMin} <span className="text-xs text-slate-400 font-normal">mins</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Active simulation minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* Main List Area */}
      <div className="space-y-4">
        
        {/* Filter controls */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Modes ({totalCompleted})
          </button>
          <button
            onClick={() => setFilterMode("timed")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === "timed" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Timed Mode ({timedCompleted})
          </button>
          <button
            onClick={() => setFilterMode("tutor")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === "tutor" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Tutor Mode ({tutorCompleted})
          </button>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredHistory.map((run, idx) => {
              const scorePct = Math.round((run.correctAnswersCount / run.totalQuestions) * 100);
              const formattedDate = new Date(run.completedAt).toLocaleString("en-NP", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div 
                  key={idx} 
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    {/* Tags line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded">
                        {getExamLabel(run.setId)}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        run.mode === "timed" 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                      }`}>
                        {run.mode === "timed" ? "Timed Exam" : "Tutor Practice"}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>

                    {/* Paper Title */}
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {getSetTitle(run.setId)}
                    </h3>

                    {/* Meta stats */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> {run.correctAnswersCount} Correct
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> {run.incorrectAnswersCount} Incorrect
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <HelpCircle className="w-3.5 h-3.5" /> {run.leftAnswersCount} Unanswered
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> {Math.floor(run.timeSpentSeconds / 60)}m {run.timeSpentSeconds % 60}s
                      </span>
                    </div>
                  </div>

                  {/* Actions & Big Score Percentage */}
                  <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <span className={`text-2xl font-black ${
                        scorePct >= 80 
                          ? "text-emerald-400" 
                          : scorePct >= 50 
                            ? "text-amber-400" 
                            : "text-red-400"
                      }`}>
                        {scorePct}%
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Accuracy</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectSet(run.setId)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Review questions and explanations"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-500">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-300">No test runs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterMode === "all" 
                ? "You haven't completed any practice runs yet. Select a mock set or past question block to begin." 
                : `You don't have any results in ${filterMode} mode yet.`}
            </p>
            <button
              onClick={onNavigateToDashboard}
              className="mt-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Start Practicing Now
            </button>
          </div>
        )}

      </div>
      
    </div>
  );
}
