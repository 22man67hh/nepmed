import React from 'react';
import { ChevronRight, CheckCircle, Database, FileText, Layers, Folder } from 'lucide-react';

interface DashboardTabProps {
  allSets: any[];
  independentQuestions: any[];
  userDraftQuestions: any[];
  dbExams: any[];
  setAdminTab: (tab: string) => void;
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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-100">Admin Dashboard</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Manage your question banks, verify draft submissions, configure exams, and maintain the platform's core content. Everything you need is accessible from this control panel.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetagDatabase}
          className="shrink-0 bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Question Papers</p>
            <p className="text-2xl font-bold text-slate-100">{allSets.length}</p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Pool Questions</p>
            <p className="text-2xl font-bold text-slate-100">{independentQuestions.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Pending Proofing</p>
            <p className="text-2xl font-bold text-slate-100">{userDraftQuestions.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Board Exams</p>
            <p className="text-2xl font-bold text-slate-100">{dbExams.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'papers', label: 'MCQ Papers Editor', desc: 'Build and edit full-length exams' },
              { id: 'questions', label: 'Subject Question Pool', desc: 'Manage standalone MCQs' },
              { id: 'exams', label: 'Target Board Exams', desc: 'Configure board exam schemas' },
              { id: 'pages', label: 'Pages Config', desc: 'Manage landing page and site assets' }
            ].map(action => (
              <button
                key={action.id}
                onClick={() => setAdminTab(action.id)}
                className="flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800/60 rounded-lg transition-colors text-left group"
              >
                <div>
                  <span className="font-medium text-sm text-slate-200 block mb-0.5">{action.label}</span>
                  <span className="text-xs text-slate-500">{action.desc}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">System Logs</h3>
          </div>
          <div className="p-6 space-y-4 font-mono text-xs text-slate-300 flex-1">
            <div className="flex justify-between items-start gap-2 border-b border-slate-800 pb-3">
              <span className="text-blue-400 shrink-0">[info]</span>
              <span className="text-right text-slate-400">Database session established</span>
            </div>
            <div className="flex justify-between items-start gap-2 border-b border-slate-800 pb-3">
              <span className="text-emerald-400 shrink-0">[ok]</span>
              <span className="text-right text-slate-400">Target exams synchronized</span>
            </div>
            <div className="flex justify-between items-start gap-2 border-b border-slate-800 pb-3">
              <span className="text-emerald-400 shrink-0">[ok]</span>
              <span className="text-right text-slate-400">Active subjects validated</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 shrink-0">[sys]</span>
              <span className="text-right text-slate-500">Awaiting commands...</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
