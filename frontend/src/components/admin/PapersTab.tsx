import React, { useState } from "react";
import { FileText, Clock, Tag, Edit, Trash2, Plus } from "lucide-react";
import { QuestionSet } from "../../types";

interface PapersTabProps {
  allSets: QuestionSet[];
  onSaveSets: (sets: QuestionSet[]) => void;
  cmsTargetExams: any[];
  cmsContent: any;
  setMessage: (msg: string) => void;
  askConfirmation: (title: string, msg: string, onConfirm: () => void, onCancel?: () => void) => void;
  handleEditClick: (set: QuestionSet) => void;
}

export const PapersTab: React.FC<PapersTabProps> = ({
  allSets,
  onSaveSets,
  cmsTargetExams,
  setMessage,
  askConfirmation,
  handleEditClick
}) => {
  const [selectedPaperExamFilter, setSelectedPaperExamFilter] = useState("all");

  const handleOpenCreateSet = () => {
    const emptySet: QuestionSet = {
      id: `set-${Date.now()}`,
      title: "",
      examType: cmsTargetExams[0]?.id || "mec-ug",
      type: "mock-test",
      durationMinutes: 180,
      price: 0,
      isFree: true,
      questions: []
    };
    handleEditClick(emptySet);
  };

  const handleDeleteClick = (setId: string) => {
    askConfirmation(
      "Confirm Deletion",
      "Are you sure you want to permanently delete this Question Paper set? This action cannot be undone.",
      async () => {
        try {
          await fetch(`/api/question-sets/${setId}`, {
            method: "DELETE"
          });
        } catch (e) {
          console.error(e);
        }
        onSaveSets(allSets.filter(s => s.id !== setId));
        setMessage("Question Paper set deleted successfully.");
      }
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Catalog Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" /> Available Question Papers ({allSets.length})
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Filter, categorize and construct syllabus-aligned board exams.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam:</span>
            <select
              value={selectedPaperExamFilter}
              onChange={(e) => setSelectedPaperExamFilter(e.target.value)}
              className="bg-slate-955 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-sans"
            >
              <option value="all">🌐 All Target Exams</option>
              {cmsTargetExams.map(exam => (
                <option key={exam.id || exam.slug} value={exam.slug || exam.id}>
                  🎯 {exam.name} ({String(exam.slug || exam.code || exam.id || "").toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateSet}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-violet-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Set</span>
          </button>
        </div>
      </div>

      {/* Grid of Sets */}
      {allSets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 border-dashed p-12 rounded-2xl text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">No question sets published in the system.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cmsTargetExams
            .filter(exam => selectedPaperExamFilter === "all" || exam.id === selectedPaperExamFilter)
            .map(exam => {
              const examSets = allSets.filter(s => {
                const examSlug = exam.slug || exam.code || (exam.id ? String(exam.id) : "");
                return s.examType?.toLowerCase() === examSlug?.toLowerCase()
                  || s.examType?.toLowerCase() === exam.name?.toLowerCase();
              });
              
              if (examSets.length === 0 && selectedPaperExamFilter !== "all") {
                return (
                  <div key={exam.id} className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-xl text-center">
                    <p className="text-slate-400 text-xs font-semibold">No papers available for <strong>{exam.name}</strong> yet.</p>
                    <p className="text-[10px] text-slate-650 mt-1">Click "Create New Set" above to start adding questions.</p>
                  </div>
                );
              }
              if (examSets.length === 0) return null;

              const mockSets = examSets.filter(s => s.type === "mock-test");
              const pastSets = examSets.filter(s => s.type === "past-year");

              return (
                <div key={exam.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🎓</span>
                      <span>{exam.name}</span>
                    </h4>
                    <span className="text-[9px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full font-bold">
                      {examSets.length} Sets total
                    </span>
                  </div>

                  {/* Subcategories inside this Target Exam */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subcategory 1: Mock Tests */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                          ⚔️ Mock Tests
                        </span>
                        <span className="text-[9px] text-slate-500">({mockSets.length} sets available)</span>
                      </div>
                      {mockSets.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic pl-1 font-sans">No active mock test sets in this subcategory.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {mockSets.map(set => (
                            <div 
                              key={set.id}
                              className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{set.title || "Untitled Paper Set"}</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span className="uppercase text-violet-400 font-bold">{set.examType}</span>
                                  <span>•</span>
                                  <span className="text-slate-400">{set.questions.length} Questions</span>
                                  {set.province && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-400 font-bold uppercase">{set.province}</span>
                                    </>
                                  )}
                                </div>

                                <div className="flex gap-3 mt-2 text-[10px]">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" /> {set.durationMinutes} mins
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-emerald-400" /> {set.isFree ? "Free Access" : `Rs. ${set.price}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                <button
                                  onClick={() => handleEditClick(set)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700 font-sans"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(set.id)}
                                  className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-semibold p-2 rounded-lg text-[10px] cursor-pointer transition-colors border border-red-500/5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Subcategory 2: Past Year Papers */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded">
                          📜 Past Board Papers
                        </span>
                        <span className="text-[9px] text-slate-500">({pastSets.length} sets available)</span>
                      </div>
                      {pastSets.length === 0 ? (
                        <p className="text-[10px] text-slate-650 italic pl-1 font-sans">No official past paper sets in this subcategory.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {pastSets.map(set => (
                            <div 
                              key={set.id}
                              className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{set.title || "Untitled Paper Set"}</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span className="uppercase text-violet-400 font-bold">{set.examType}</span>
                                  <span>•</span>
                                  <span className="text-slate-400">{set.questions.length} Questions</span>
                                  {set.province && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-400 font-bold uppercase">{set.province}</span>
                                    </>
                                  )}
                                </div>

                                <div className="flex gap-3 mt-2 text-[10px]">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" /> {set.durationMinutes} mins
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-emerald-400" /> {set.isFree ? "Free Access" : `Rs. ${set.price}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                <button
                                  onClick={() => handleEditClick(set)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700 font-sans"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(set.id)}
                                  className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-semibold p-2 rounded-lg text-[10px] cursor-pointer transition-colors border border-red-500/5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
