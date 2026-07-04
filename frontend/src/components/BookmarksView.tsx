/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Bookmark, Trash2, HelpCircle, GraduationCap, BookOpen, ChevronRight } from "lucide-react";
import { BookmarkedQuestion } from "../types";

interface BookmarksViewProps {
  bookmarks: BookmarkedQuestion[];
  onRemoveBookmark: (qId: string) => void;
  onSelectSet: (setId: string) => void;
}

export default function BookmarksView({
  bookmarks,
  onRemoveBookmark,
  onSelectSet
}: BookmarksViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const uniqueExamTypes = Array.from(new Set(bookmarks.map(b => b.examType)));

  const filteredBookmarks = bookmarks.filter(b => {
    if (activeTab === "all") return true;
    return b.examType === activeTab;
  });

  const examLabels: { [key: string]: string } = {
    "mec-ug": "MEC-UG",
    "mec-pg": "MEC-PG",
    "nmcle": "NMCLE",
    "ku-mcq": "KU MCQ",
    "loksewa": "Loksewa"
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-amber-400 fill-current" />
          Saved Medical Questions
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Your personal medical library. Revise saved clinical questions, diagnostic puzzles, and government health acts at any time.
        </p>
      </div>

      {bookmarks.length > 0 ? (
        <div className="space-y-6">
          
          {/* Exam Switcher Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === "all" 
                  ? "bg-slate-800 text-white border border-slate-700" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Bookmarks ({bookmarks.length})
            </button>
            {uniqueExamTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === type 
                    ? "bg-slate-800 text-white border border-slate-700" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {examLabels[type] || type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Bookmarks list */}
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div 
                key={bookmark.questionId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4"
              >
                {/* Meta Row */}
                <div className="flex justify-between items-center gap-4 border-b border-slate-800/60 pb-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/10 px-2 py-0.5 rounded mr-2.5">
                      {examLabels[bookmark.examType] || bookmark.examType.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium truncate" title={bookmark.setName}>
                      Origin Set: <strong className="text-slate-400 font-semibold">{bookmark.setName}</strong>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectSet(bookmark.setId)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Jump to Set <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveBookmark(bookmark.questionId)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-750 cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                  {bookmark.questionText}
                </h4>

                {/* Question Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {bookmark.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === bookmark.correctOptionIndex;
                    return (
                      <div 
                        key={optIdx}
                        className={`p-3 rounded-lg border ${
                          isCorrect 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold" 
                            : "bg-slate-950/25 border-slate-800/80 text-slate-400"
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)})</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Explanation */}
                <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <h5 className="text-[10px] font-bold text-slate-350 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Reference Explanation
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {bookmark.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
          <HelpCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300">Your Medical Vault is Empty</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            While taking mock exams or past question sets, click the bookmark icon on any challenging question to save it here for swift revision.
          </p>
        </div>
      )}

    </div>
  );
}
