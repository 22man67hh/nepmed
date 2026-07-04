/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  Flame, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Award,
  Zap,
  MapPin
} from "lucide-react";
import { UserProgress, QuestionSet, CMSContent } from "../types";

interface DashboardViewProps {
  targetExam: string;
  progressList: UserProgress[];
  allSets: QuestionSet[];
  onSelectExamPage: () => void;
  onSelectSet: (setId: string) => void;
  cmsContent: CMSContent;
  onSelectSubjectPractice?: () => void;
}

export default function DashboardView({
  targetExam,
  progressList,
  allSets,
  onSelectExamPage,
  onSelectSet,
  cmsContent,
  onSelectSubjectPractice
}: DashboardViewProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>("central");

  // Filter progress and sets for the selected target exam and province if applicable
  const examSets = allSets.filter(s => {
    if (s.examType !== targetExam) return false;
    if (targetExam === "loksewa") {
      return s.province === selectedProvince;
    }
    return true;
  });

  const examProgress = progressList.filter(p => {
    const set = allSets.find(s => s.id === p.setId);
    return set && set.examType === targetExam && (targetExam !== "loksewa" || set.province === selectedProvince);
  });

  // Calculate Metrics
  const totalAttempts = examProgress.length;
  
  const averageCorrectPct = totalAttempts > 0 
    ? Math.round(
        (examProgress.reduce((sum, p) => sum + (p.correctAnswersCount / p.totalQuestions), 0) / totalAttempts) * 100
      )
    : 0;

  const totalTimeSpentMinutes = Math.round(
    progressList.reduce((sum, p) => sum + p.timeSpentSeconds, 0) / 60
  );

  const bestScore = examProgress.length > 0
    ? Math.max(...examProgress.map(p => p.score))
    : 0;

  // Formatting target exam labels
  const examLabels: { [key: string]: string } = {
    "mec-ug": "MEC-UG Undergraduate",
    "mec-pg": "MEC-PG Postgraduate",
    "nmcle": "NMCLE Licensing Board",
    "ku-mcq": "Kathmandu University Entrance",
    "loksewa": "Loksewa Medical Officer"
  };

  // Setup sample data for a beautiful premium custom SVG performance line chart
  const performanceHistory = examProgress.slice(-6).map((p, idx) => {
    const set = allSets.find(s => s.id === p.setId);
    return {
      label: set ? set.title.replace("Questions", "").replace("Practice", "").substring(0, 15) + "..." : `Test ${idx+1}`,
      score: p.score,
      pct: Math.round((p.correctAnswersCount / p.totalQuestions) * 100)
    };
  });

  // Default values if no progress yet
  const dummyHistory = [
    { label: "Intro Mock", score: 40, pct: 50 },
    { label: "Diagnostics", score: 60, pct: 65 },
    { label: "Quick Check", score: 55, pct: 60 },
    { label: "Topic Practice", score: 75, pct: 80 }
  ];

  const activeChartData = performanceHistory.length > 1 ? performanceHistory : dummyHistory;

  // SVG parameters
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  const points = activeChartData.map((d, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (activeChartData.length - 1);
    const y = chartHeight - padding - (d.pct * (chartHeight - padding * 2)) / 100;
    return { x, y, label: d.label, pct: d.pct };
  });

  // Polyline points string
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Target Exam Greeting Header */}
      {targetExam === "loksewa" ? (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase block mb-1">
                Loksewa Medical Exam Prep
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Select Province / Arena
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {cmsContent.dashboardLabels.arenaSelectSubtitle}
              </p>
            </div>
          </div>

          {/* Province Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {[
              { id: "central", label: "Central Loksewa" },
              { id: "koshi", label: "Koshi Province" },
              { id: "bagmati", label: "Bagmati Province" },
              { id: "madesh", label: "Madhesh Province" },
              { id: "gandaki", label: "Gandaki Province" },
              { id: "lumbini", label: "Lumbini Province" },
              { id: "karnali", label: "Karnali Province" },
              { id: "sudurpaschim", label: "Sudurpaschim Province" }
            ].map((prov) => {
              const isSelected = selectedProvince === prov.id;
              return (
                <button
                  key={prov.id}
                  onClick={() => setSelectedProvince(prov.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                      : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {prov.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase block mb-1">
              {cmsContent.dashboardLabels.preparingFor}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {examLabels[targetExam] || targetExam.toUpperCase()}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {examSets.length} {cmsContent.dashboardLabels.papersAvailable}
            </p>
          </div>
        </div>
      )}

      {/* Practice Method Choice Rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Set-wise Practice Card */}
        <div 
          onClick={onSelectExamPage}
          className="relative overflow-hidden bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Clock className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Set-wise Practice
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Practice Past year questions sets. Self assessment with meticulously prepared mock exam sets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-5 group-hover:translate-x-1 transition-transform self-start">
            <span>Explore Board Sets</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Subject-wise Practice Card */}
        <div 
          onClick={onSelectSubjectPractice}
          className="relative overflow-hidden bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl hover:border-violet-500/40 hover:shadow-violet-500/5 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 shadow-inner">
              <Trophy className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                Subject-wise Practice
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Perfect for boosting score by covering all areas of syllabus and mastering concepts chapter by chapter.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold mt-5 group-hover:translate-x-1 transition-transform self-start">
            <span>Enter Subject Rooms</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Available MCQ Papers Direct Practice Grid */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div>
          <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            {cmsContent.dashboardLabels.arenaTitle}
          </h4>
          <p className="text-xs text-slate-400">{cmsContent.dashboardLabels.arenaSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examSets.length > 0 ? (
            examSets.map((set) => (
              <div 
                key={set.id}
                onClick={() => onSelectSet(set.id)}
                className="p-5 bg-slate-950/40 rounded-xl hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-extrabold uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      {set.type === "past-year" ? "🏆 Board Past Paper" : "🔬 Premium Mock"}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      set.isFree ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {set.isFree ? "FREE" : `Rs ${set.price}`}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-2.5 leading-snug">
                    {set.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {set.durationMinutes} Minutes allocation • Nepalese Boards level structure
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-500 font-mono font-bold">
                    {set.questions.length} Medical Questions
                  </span>
                  <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                    Launch Paper <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-950/10 rounded-xl border border-dashed border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">No question papers found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">There are no practice papers available for the selected target exam or province at this moment.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
