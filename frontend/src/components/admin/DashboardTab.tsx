import React from "react";
import { Sliders, GraduationCap, BookOpen, FileSpreadsheet, Sparkles, Flag, Settings, ChevronRight, CheckCircle } from "lucide-react";
import { QuestionSet, Question } from "../../types";

interface DashboardTabProps {
  allSets: QuestionSet[];
  independentQuestions: Question[];
  userDraftQuestions: Question[];
  dbExams: any[];
  setAdminTab: (tab: "dashboard" | "papers" | "reports" | "questions" | "review" | "cms" | "exams" | "subjects" | "topics") => void;
  handleRetagDatabase: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  allSets,
  independentQuestions,
  userDraftQuestions,
  dbExams,
  setAdminTab,
  handleRetagDatabase
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-sans">
      <div className="relative rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-855 border border-slate-800 p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] uppercase font-black tracking-wider text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-md">
            SYSTEM TELEMETRY
          </span>
          <h3 className="text-xl font-extrabold text-white font-sans">Welcome back to the Premium Control Room</h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Tweak test duration limits, manage exam metadata schemas, retag question pool items, or proof student drafts. First-class responsiveness, high-density analytics, and live database synchronizations.
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={handleRetagDatabase}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>Retag All Questions</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-slate-700 transition-colors shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Question Papers</span>
          <div className="text-2xl font-black text-white">{allSets.length}</div>
          <span className="text-[9px] text-violet-400 block font-semibold">Active sets configured</span>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-slate-700 transition-colors shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pool Questions</span>
          <div className="text-2xl font-black text-white">{independentQuestions.length}</div>
          <span className="text-[9px] text-violet-400 block font-semibold">Independent pool items</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-slate-700 transition-colors shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Proofing</span>
          <div className="text-2xl font-black text-white">{userDraftQuestions.length}</div>
          <span className="text-[9px] text-amber-400 block font-semibold">Proposed drafts queue</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-slate-700 transition-colors shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Board Categories</span>
          <div className="text-2xl font-black text-white">{dbExams.length}</div>
          <span className="text-[9px] text-violet-400 block font-semibold">Registered exam structures</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Quick actions console</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdminTab("papers")}
              className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-950 hover:border-violet-500 border border-slate-800 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="font-bold text-xs text-white block">MCQ Papers Editor</span>
                <span className="text-[9px] text-slate-500">Edit and build exams papers</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => setAdminTab("questions")}
              className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-950 hover:border-violet-500 border border-slate-800 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="font-bold text-xs text-white block">Subject Folders Pool</span>
                <span className="text-[9px] text-slate-500">Manage separate questions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => setAdminTab("exams")}
              className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-950 hover:border-violet-500 border border-slate-800 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="font-bold text-xs text-white block">Target Board Exams</span>
                <span className="text-[9px] text-slate-500">Add or edit board catalogs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => setAdminTab("cms")}
              className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-950 hover:border-violet-500 border border-slate-800 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="font-bold text-xs text-white block">CMS Brand Configuration</span>
                <span className="text-[9px] text-slate-500">Edit client side assets & text</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-sans">Telemetry logs</h4>
          <div className="space-y-3 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between items-start gap-2 border-b border-slate-850 pb-2">
              <span className="text-violet-400">[info]</span>
              <span className="text-right">Live database session established</span>
            </div>
            <div className="flex justify-between items-start gap-2 border-b border-slate-850 pb-2">
              <span className="text-emerald-400">[ok]</span>
              <span className="text-right">Target board exams synchronized</span>
            </div>
            <div className="flex justify-between items-start gap-2 border-b border-slate-850 pb-2">
              <span className="text-emerald-400">[ok]</span>
              <span className="text-right">Active subjects list synchronized</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-violet-400">[system]</span>
              <span className="text-right">Awaiting admin prompt commands</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
