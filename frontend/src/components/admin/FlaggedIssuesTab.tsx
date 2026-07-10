import React from "react";
import { Flag, RefreshCw, CheckCircle } from "lucide-react";

interface FlaggedIssuesTabProps {
  reports: any[];
  fetchReports: () => void;
  loadingReports: boolean;
  handleDeleteReport: (id: string) => void;
}

export const FlaggedIssuesTab: React.FC<FlaggedIssuesTabProps> = ({
  reports,
  fetchReports,
  loadingReports,
  handleDeleteReport
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flag className="w-4.5 h-4.5 text-red-500" />
            <span>User Correction Reports Dashboard</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            A summary of candidate-submitted errata, spelling fixes, or option correction reports.
          </p>
        </div>
        <button 
          onClick={fetchReports}
          disabled={loadingReports}
          className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl px-4 py-2 text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? "animate-spin" : ""}`} />
          <span>Refresh Reports Database</span>
        </button>
      </div>

      {loadingReports && reports.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs italic animate-pulse">
          Loading errata reports registry...
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-white text-sm font-bold">Clean Database Slate!</p>
          <p className="text-slate-400 text-xs mt-1">No candidate correction flags are currently pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-all space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  <span>Report #{report.id.substring(report.id.length - 6)}</span>
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Flagged MCQ Question text</p>
                  <p className="text-xs text-white leading-normal font-medium mt-1">"{report.questionText}"</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">QID: {report.questionId}</p>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                  <p className="text-[9px] text-red-400 uppercase font-bold tracking-wider">Candidate Feedback Detail</p>
                  <p className="text-xs text-slate-200 mt-1 font-sans leading-relaxed whitespace-pre-wrap">{report.issueText}</p>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-850 flex justify-end">
                <button
                  onClick={() => handleDeleteReport(report.id)}
                  className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Mark Resolved / Dismiss Errata
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
