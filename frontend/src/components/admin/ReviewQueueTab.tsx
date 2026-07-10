import React, { useState } from "react";
import { UserCheck, X, CheckCircle, Edit3, CheckCircle2 } from "lucide-react";
import { QuestionSet, Question } from "../../types";
import { ALL_STANDARD_SUBJECTS } from "../../subjectsData";
import RichTextEditor from "../RichTextEditor";

interface ReviewQueueTabProps {
  userDraftQuestions: Question[];
  onSaveUserDraftQuestions: (questions: Question[]) => void;
  independentQuestions: Question[];
  onSaveIndependentQuestions: (questions: Question[]) => void;
  setConfirmModal: (modal: any) => void;
  setMessage: (msg: string) => void;
}

export const ReviewQueueTab: React.FC<ReviewQueueTabProps> = ({
  userDraftQuestions,
  onSaveUserDraftQuestions,
  independentQuestions,
  onSaveIndependentQuestions,
  setConfirmModal,
  setMessage
}) => {
  // Review Mode States
  const [activeReviewDraftId, setActiveReviewDraftId] = useState<string | null>(null);
  const [reviewQuestionText, setReviewQuestionText] = useState("");
  const [reviewOptions, setReviewOptions] = useState<string[]>(["", "", "", ""]);
  const [reviewCorrectIdx, setReviewCorrectIdx] = useState(0);
  const [reviewExplanation, setReviewExplanation] = useState("");
  const [reviewSubject, setReviewSubject] = useState("");
  const [reviewTopic, setReviewTopic] = useState("");

  const handleStartReviewDraft = (draft: Question) => {
    setActiveReviewDraftId(draft.id);
    setReviewQuestionText(draft.questionText);
    setReviewOptions([...draft.options]);
    setReviewCorrectIdx(draft.correctOptionIndex);
    setReviewExplanation(draft.explanation || "");
    setReviewSubject(draft.subject || ALL_STANDARD_SUBJECTS[0]);
    setReviewTopic(draft.topic || "");
  };

  const handlePublishDraft = async () => {
    if (!activeReviewDraftId) return;
    if (!reviewQuestionText.trim()) {
      alert("Question text cannot be blank.");
      return;
    }

    const approvedQuestion: Question = {
      id: activeReviewDraftId,
      questionText: reviewQuestionText,
      options: [...reviewOptions],
      correctOptionIndex: reviewCorrectIdx,
      explanation: reviewExplanation,
      subject: reviewSubject,
      topic: reviewTopic
    };

    // Post to backend database
    try {
      const res = await fetch("/api/admin/publish-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: activeReviewDraftId,
          question: approvedQuestion
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMessage(`Draft ${activeReviewDraftId} published to database successfully!`);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Update local state
    onSaveIndependentQuestions([...independentQuestions, approvedQuestion]);
    onSaveUserDraftQuestions(userDraftQuestions.filter(q => q.id !== activeReviewDraftId));

    setActiveReviewDraftId(null);
    setMessage(`Successfully approved and published Question #${activeReviewDraftId}`);
  };

  const handleRejectDraft = (draftId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Trash Submission?",
      message: `Are you sure you want to reject and delete student draft #${draftId}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/reject-draft/${draftId}`, {
            method: "DELETE"
          });
        } catch (e) {
          console.error(e);
        }
        onSaveUserDraftQuestions(userDraftQuestions.filter(q => q.id !== draftId));
        if (activeReviewDraftId === draftId) setActiveReviewDraftId(null);
        setMessage(`Rejected and deleted student submission #${draftId}`);
      }
    });
  };

  const handleAcceptDraftDirect = async (draft: Question) => {
    try {
      const res = await fetch("/api/admin/publish-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.id,
          question: draft
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMessage(`Draft ${draft.id} published successfully!`);
        }
      }
    } catch (e) {
      console.error(e);
    }

    onSaveIndependentQuestions([...independentQuestions, draft]);
    onSaveUserDraftQuestions(userDraftQuestions.filter(q => q.id !== draft.id));
    setMessage(`Approved student submission #${draft.id} immediately!`);
  };

  const handleBulkAcceptDrafts = () => {
    setConfirmModal({
      isOpen: true,
      title: "Bulk Publish All Drafts?",
      message: `Are you sure you want to approve and publish all ${userDraftQuestions.length} pending draft submissions immediately?`,
      onConfirm: async () => {
        try {
          await fetch("/api/admin/bulk-publish-drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ drafts: userDraftQuestions })
          });
        } catch (e) {
          console.error(e);
        }
        onSaveIndependentQuestions([...independentQuestions, ...userDraftQuestions]);
        onSaveUserDraftQuestions([]);
        setMessage(`Bulk approved and published ${userDraftQuestions.length} questions.`);
      }
    });
  };

  const handleBulkRejectDrafts = () => {
    setConfirmModal({
      isOpen: true,
      title: "Bulk Reject & Trash All Drafts?",
      message: `Are you sure you want to permanently delete all ${userDraftQuestions.length} pending draft submissions?`,
      onConfirm: async () => {
        try {
          await fetch("/api/admin/bulk-reject-drafts", {
            method: "DELETE"
          });
        } catch (e) {
          console.error(e);
        }
        onSaveUserDraftQuestions([]);
        setMessage(`Bulk rejected and cleared all draft submissions.`);
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-violet-400" />
            <span>Student Proposed MCQs Queue</span>
            <span className="bg-slate-850 border border-slate-750 text-slate-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              {userDraftQuestions.length} Pending
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Proofread, review formatting, edit option rationales, and officially publish candidate submissions. Approved questions will automatically be assigned a chronological QID.
          </p>
        </div>
        {userDraftQuestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleBulkRejectDrafts}
              className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Bulk Reject All ({userDraftQuestions.length})</span>
            </button>
            <button
              type="button"
              onClick={handleBulkAcceptDrafts}
              className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Bulk Accept All ({userDraftQuestions.length})</span>
            </button>
          </div>
        )}
      </div>

      {activeReviewDraftId && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-violet-400 animate-pulse" />
              <span>Review and Format Proposed Question ({activeReviewDraftId})</span>
            </h4>
            <button
              onClick={() => setActiveReviewDraftId(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Syllabus Subject</label>
                <select
                  value={reviewSubject}
                  onChange={(e) => setReviewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                >
                  {ALL_STANDARD_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Topic Tag</label>
                <input
                  type="text"
                  value={reviewTopic}
                  onChange={(e) => setReviewTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Question Text</label>
              <RichTextEditor value={reviewQuestionText} onChange={setReviewQuestionText} />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">MCQ Answers (Select correct option with radio/dropdown)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reviewOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center select-none">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...reviewOptions];
                        copy[oIdx] = e.target.value;
                        setReviewOptions(copy);
                      }}
                      className="bg-transparent flex-1 focus:outline-none text-xs text-white"
                    />
                    <input
                      type="radio"
                      name="reviewCorrectRadio"
                      checked={reviewCorrectIdx === oIdx}
                      onChange={() => setReviewCorrectIdx(oIdx)}
                      className="accent-violet-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detailed Explanation & Study Notes</label>
              <RichTextEditor value={reviewExplanation} onChange={setReviewExplanation} />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveReviewDraftId(null)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectDraft(activeReviewDraftId)}
                className="bg-red-500/10 hover:bg-red-650 hover:text-white text-red-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-red-500/20"
              >
                Reject & Trash Draft
              </button>
              <button
                onClick={handlePublishDraft}
                className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer flex items-center gap-1.5 animate-pulse"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Publish to System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {userDraftQuestions.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/40 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3.5" />
            <p className="text-white text-base font-extrabold">Queue Clean and Balanced!</p>
            <p className="text-slate-400 text-xs mt-1">
              There are currently no proposed student submissions waiting for editor proofing.
            </p>
          </div>
        ) : (
          userDraftQuestions.map((draft) => (
            <div key={draft.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-750 transition-all space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-md">
                    {draft.id}
                  </span>
                  <span className="bg-violet-500/10 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {draft.subject}
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {draft.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptDraftDirect(draft)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartReviewDraft(draft)}
                    className="bg-violet-600/20 hover:bg-violet-600 hover:text-white border border-violet-500/25 text-violet-400 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Review & Format</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectDraft(draft.id)}
                    className="bg-red-500/10 hover:bg-red-650 hover:text-white text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="space-y-3.5">
                <div 
                  className="text-white text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: draft.questionText }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {draft.options.map((opt, oIdx) => {
                    const isCorrect = draft.correctOptionIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          isCorrect 
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                            : "bg-slate-950 border-slate-850 text-slate-400"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          isCorrect 
                            ? "bg-emerald-500 text-slate-950" 
                            : "bg-slate-900 border border-slate-800 text-slate-500"
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-xs">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {draft.explanation && (
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Submitted Explanation</p>
                    <div 
                      className="text-xs text-slate-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: draft.explanation }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
