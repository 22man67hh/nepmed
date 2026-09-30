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
  dbExams?: any[];
}

export default function DashboardView({
  targetExam,
  progressList,
  allSets,
  onSelectExamPage,
  onSelectSet,
  cmsContent,
  onSelectSubjectPractice,
  dbExams = []
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

  // Formatting target exam labels dynamically from DB if available
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
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm space-y-6">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
          <div>
            <span className="text-emerald-500 font-semibold text-xs tracking-wider uppercase block mb-1">
              {cmsContent.dashboardLabels.preparingFor}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {examLabels[targetExam] || targetExam.toUpperCase()}
            </h2>
            <p className="text-slate-300 text-sm mt-1">
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
          className="relative overflow-hidden bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
              <Clock className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white transition-colors">
                Set-wise Practice
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Practice Past year questions sets. Self assessment with meticulously prepared mock exam sets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 group-hover:text-emerald-400 font-semibold mt-6 transition-colors self-start">
            <span>Explore Board Sets</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Subject-wise Practice Card */}
        <div 
          onClick={onSelectSubjectPractice}
          className="relative overflow-hidden bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm hover:border-violet-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600 group-hover:border-violet-500/30 group-hover:bg-violet-500/10 transition-colors">
              <Trophy className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white transition-colors">
                Subject-wise Practice
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Perfect for boosting score by covering all areas of syllabus and mastering concepts chapter by chapter.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 group-hover:text-violet-400 font-semibold mt-6 transition-colors self-start">
            <span>Enter Subject Rooms</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Available MCQ Papers Direct Practice Grid */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-4 shadow-sm">
        <div>
          <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            {cmsContent.dashboardLabels.arenaTitle}
          </h4>
          <p className="text-xs text-slate-300">{cmsContent.dashboardLabels.arenaSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examSets.length > 0 ? (
            examSets.map((set) => (
              <div 
                key={set.id}
                onClick={() => onSelectSet(set.id)}
                className="p-5 bg-slate-900/50 rounded-xl hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-extrabold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
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
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                    {set.durationMinutes} Minutes allocation • Nepalese Boards level structure
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                  <span className="text-slate-400 font-mono font-bold">
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
