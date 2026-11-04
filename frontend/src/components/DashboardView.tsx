import React, { useState } from "react";
import { 
  Trophy, 
  Clock, 
  ChevronRight, 
  Target, 
  MapPin, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Layers, 
  Zap, 
  Award,
  AlertCircle 
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
    examLabels["mec-ug"] = "MEC-UG Undergraduate (MBBS/BDS)";
    examLabels["mec-pg"] = "MEC-PG Postgraduate (MD/MS)";
    examLabels["nmcle"] = "NMCLE Medical Licensing Board";
    examLabels["ku-mcq"] = "Kathmandu University Entrance";
    examLabels["loksewa"] = "Loksewa Medical Officer (PSC)";
  }

  // Setup data for the custom performance line chart
  const performanceHistory = examProgress.slice(-6).map((p, idx) => {
    const set = allSets.find(s => s.id === p.setId);
    return {
      label: set ? set.title.replace("Questions", "").replace("Practice", "").substring(0, 14) : `Mock ${idx + 1}`,
      score: p.score,
      pct: Math.round((p.correctAnswersCount / p.totalQuestions) * 100)
    };
  });

  const dummyHistory = [
    { label: "Intro Mock", score: 45, pct: 50 },
    { label: "Diagnostics", score: 62, pct: 68 },
    { label: "Quick Check", score: 58, pct: 64 },
    { label: "Topic Paper", score: 76, pct: 82 },
    { label: "Full Simulation", score: 84, pct: 88 }
  ];

  const activeChartData = performanceHistory.length > 1 ? performanceHistory : dummyHistory;

  // SVG parameters
  const chartHeight = 180;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;

  const points = activeChartData.map((d, idx) => {
    const x = paddingX + (idx * (chartWidth - paddingX * 2)) / (activeChartData.length - 1);
    const y = chartHeight - paddingY - (d.pct * (chartHeight - paddingY * 2)) / 100;
    return { x, y, label: d.label, pct: d.pct, score: d.score };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full px-4 sm:px-6 py-5 space-y-5">
      
      {/* 1. TOP HEADER BANNER */}
      {targetExam === "loksewa" ? (
        <div className="rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-emerald-400 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                Loksewa Health & Medical Officer Prep
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Select Province Arena
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {cmsContent.dashboardLabels.arenaSelectSubtitle || "Choose a specific Nepalese province or central commission to load localized past papers and syllabus mocks."}
              </p>
            </div>

            <button
              onClick={onSelectExamPage}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>View All Loksewa Sets</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Province Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
            {[
              { id: "central", label: "Central PSC" },
              { id: "koshi", label: "Koshi" },
              { id: "madesh", label: "Madhesh" },
              { id: "bagmati", label: "Bagmati" },
              { id: "gandaki", label: "Gandaki" },
              { id: "lumbini", label: "Lumbini" },
              { id: "karnali", label: "Karnali" },
              { id: "sudurpaschim", label: "Sudurpaschim" }
            ].map((prov) => {
              const isSelected = selectedProvince === prov.id;
              return (
                <button
                  key={prov.id}
                  onClick={() => setSelectedProvince(prov.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20 font-black"
                      : "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {prov.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{cmsContent.dashboardLabels.preparingFor || "Target Board Exam"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {examLabels[targetExam] || targetExam.toUpperCase()}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              <strong className="text-emerald-400 font-semibold">{examSets.length}</strong> official question papers and mock modules calibrated to current syllabus specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSelectExamPage}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Enter Exam Arena</span>
            </button>
            {onSelectSubjectPractice && (
              <button
                onClick={onSelectSubjectPractice}
                className="px-4 py-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Subject Mastery</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. LIVE METRICS & STUDY STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tests Completed
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {totalAttempts}
            </div>
            <span className="text-[10px] text-slate-500 truncate block">
              {totalAttempts > 0 ? "Active participant" : "No attempts yet"}
            </span>
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
            <Target className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Accuracy
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {averageCorrectPct}%
            </div>
            <span className="text-[10px] text-emerald-400 font-medium truncate block">
              {averageCorrectPct >= 70 ? "Passing trajectory" : "Goal: 75%+"}
            </span>
          </div>
        </div>

        {/* Time Spent */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Study Time
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {totalTimeSpentMinutes}m
            </div>
            <span className="text-[10px] text-slate-500 truncate block">
              Across all sessions
            </span>
          </div>
        </div>

        {/* Best Score */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Best Score
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {bestScore}
            </div>
            <span className="text-[10px] text-amber-400 font-medium truncate block">
              Personal record
            </span>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE TREND CHART */}
      <div className="rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Score Trajectory & Test History
            </h2>
            <p className="text-xs text-slate-400">
              {performanceHistory.length > 1 
                ? "Your accuracy trajectory based on your latest completed papers"
                : "Sample performance trajectory shown. Complete practice papers to populate your personal curve."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Target Passing Standard: 60%+
          </span>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="w-full overflow-x-auto pt-2">
          <div className="min-w-[500px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              {/* Guidelines */}
              {[25, 50, 75, 100].map(level => {
                const y = chartHeight - paddingY - (level * (chartHeight - paddingY * 2)) / 100;
                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      className="stroke-slate-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {level}%
                    </text>
                  </g>
                );
              })}

              {/* Area under curve */}
              <polygon
                points={`${paddingX},${chartHeight - paddingY} ${polylinePoints} ${chartWidth - paddingX},${chartHeight - paddingY}`}
                className="fill-emerald-500/15"
              />

              {/* Connected Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data Points */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    className="fill-slate-900 stroke-emerald-500 stroke-[2.5]"
                  />
                  {/* Point Percentage Tag */}
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="fill-slate-300 text-[11px] font-bold font-mono"
                  >
                    {p.pct}%
                  </text>
                  {/* X-axis Label */}
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-medium"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 4. PRACTICE METHOD CHOICE ROOMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Set-wise Practice Card */}
        <div 
          onClick={onSelectExamPage}
          className="group rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                Full-Length Simulation
              </span>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Set-wise Exam Arena
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Take comprehensive previous board papers and realistic timed mocks with strict countdown timers and negative marking (-0.25).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-bold text-emerald-400">
            <span>Explore {examSets.length} Question Sets</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Subject-wise Practice Card */}
        <div 
          onClick={onSelectSubjectPractice}
          className="group rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 transition-all cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 block mb-1">
                Chapter-by-Chapter Mastery
              </span>
              <h2 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                Subject-wise Practice
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Master individual high-yield syllabus areas (Anatomy, Physiology, Pathology, Surgery) at your own pace with instant tutor rationales.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-bold text-violet-400">
            <span>Enter Subject Rooms</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 5. AVAILABLE MCQ PAPERS DIRECT PRACTICE GRID */}
      <div className="rounded-2xl p-5 sm:p-6 border bg-slate-900 border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              {cmsContent.dashboardLabels.arenaTitle || "Practice MCQ Arena"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {cmsContent.dashboardLabels.arenaSubtitle || "Select any curated paper below to simulate under timed constraints."}
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 self-start sm:self-auto">
            {examSets.length} Papers Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examSets.length > 0 ? (
            examSets.map((set) => (
              <div 
                key={set.id}
                onClick={() => onSelectSet(set.id)}
                className="p-4 sm:p-5 rounded-xl border bg-slate-950/50 hover:bg-slate-800/60 border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      {set.type === "past-year" ? "🏆 Board Past Paper" : "🔬 Premium Mock"}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      set.isFree 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {set.isFree ? "FREE" : `Rs ${set.price}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-2.5 leading-snug">
                    {set.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {set.description || "Simulated test with timer constraints, official negative marking, and detailed clinical rationale explanations."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3 text-slate-400 font-mono font-medium">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {set.questions?.length || 0} Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {set.durationMinutes || 60}m
                    </span>
                  </div>

                  <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                    <span>Launch</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-300">No question papers found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no practice papers available for the selected target exam or province at this moment.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
