import React, { useState, useEffect } from "react";
import { Search, Filter, ArrowLeft, ArrowRight, BookOpen, Tag, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { Question } from "../../types";
import RichTextEditor from "../RichTextEditor";

interface GlobalQuestionsTabProps {
  dbSubjects: any[];
  dbTopics: any[];
}

export const GlobalQuestionsTab: React.FC<GlobalQuestionsTabProps> = ({ dbSubjects, dbTopics }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formTagInput, setFormTagInput] = useState("");
  const [questionForm, setQuestionForm] = useState<Question>({
    id: "",
    questionText: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    explanation: "",
    subject: "",
    topic: "",
    tags: []
  });

  // Derived Topics based on selected subject
  const availableTopics = subjectId 
    ? dbTopics.filter((t) => String(t.subject_id) === String(subjectId))
    : dbTopics;

  // Reset topic and page when subject changes
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubjectId(e.target.value);
    setTopicId("");
    setCurrentPage(1);
  };

  // Reset page when topic changes
  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTopicId(e.target.value);
    setCurrentPage(1);
  };

  // Fetch Questions from Laravel
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `/api/questions?page=${currentPage}&per_page=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (subjectId) url += `&subject_id=${subjectId}`;
      if (topicId) url += `&topic_id=${topicId}`;

      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.status) {
        const paginator = data.questions;
        setTotalPages(paginator.last_page || 1);
        setTotalItems(paginator.total || 0);
        
        const mapped = paginator.data.map((dbQ: any) => {
          const correctIndex = (dbQ.options || []).findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
          return {
            id: String(dbQ.id),
            questionText: dbQ.question_text || "",
            options: (dbQ.options || []).sort((a: any, b: any) => a.option_index - b.option_index).map((o: any) => o.option_text),
            correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
            explanation: dbQ.explanation || "",
            subject: dbQ.subject?.name || "",
            topic: dbQ.topic?.name || "",
            tags: dbQ.tags ? dbQ.tags.map((t: any) => t.tag_name) : []
          };
        });
        setQuestions(mapped);
      }
    } catch (err) {
      console.error("Error fetching global questions:", err);
    }
    setLoading(false);
  };

  // Fetch whenever filters or page change
  useEffect(() => {
    // Debounce search slightly to avoid spamming the API
    const delay = setTimeout(() => {
      fetchQuestions();
    }, 400);
    return () => clearTimeout(delay);
  }, [search, subjectId, topicId, currentPage]);

  const handleOpenForm = (q?: Question) => {
    if (q) {
      setQuestionForm(q);
    } else {
      setQuestionForm({
        id: "",
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
        subject: subjectId ? dbSubjects.find(s => s.id == subjectId || s.uuid == subjectId)?.name || "" : "",
        topic: "",
        tags: []
      });
    }
    setFormTagInput("");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this question?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
        setTotalItems(prev => prev - 1);
      } else {
        alert("Failed to delete question.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        questionText: questionForm.questionText,
        explanation: questionForm.explanation,
        subjectName: questionForm.subject,
        topicName: questionForm.topic,
        tags: questionForm.tags,
        options: questionForm.options.map((opt, idx) => ({
          optionText: opt || `Option ${idx + 1}`,
          isCorrect: idx === questionForm.correctOptionIndex,
          optionIndex: idx
        }))
      };

      const isEdit = !!questionForm.id;
      const res = await fetch(isEdit ? `/api/questions/${questionForm.id}` : "/api/question-import", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status) {
        setIsFormOpen(false);
        fetchQuestions(); // Refresh list to get updated data and relations
      } else {
        alert(data.message || "Failed to save question.");
      }
    } catch (err) {
      alert("Error saving question.");
    }
    setIsSaving(false);
  };


  return (
    <div className="space-y-6 w-full text-slate-100 font-sans h-auto lg:h-[calc(100vh-140px)] flex flex-col pb-8 lg:pb-0">
      
      {/* Header and Filters */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            Global Question Database
          </h2>
          <button
            onClick={() => handleOpenForm()}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search question text..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
            />
          </div>

          <div className="relative">
            <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <select
              value={subjectId}
              onChange={handleSubjectChange}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="">All Subjects</option>
              {dbSubjects.map(sub => (
                <option key={sub.uuid || sub.id} value={sub.uuid || sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <select
              value={topicId}
              onChange={handleTopicChange}
              disabled={!subjectId}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer appearance-none disabled:opacity-50"
            >
              <option value="">{subjectId ? "All Topics" : "Select Subject First"}</option>
              {availableTopics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions Table/List Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-400">
            {loading ? "Loading..." : `Found ${totalItems} Total Questions`}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-955 px-2 py-1 rounded-lg border border-slate-800">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
             <div className="flex items-center justify-center h-full flex-col">
               <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3"></div>
               <span className="text-xs font-bold text-slate-400">Fetching Database...</span>
             </div>
          ) : questions.length === 0 ? (
             <div className="flex items-center justify-center h-full flex-col text-slate-500">
               <Filter className="w-8 h-8 mb-2 opacity-50" />
               <span className="text-xs font-bold">No questions match your filters.</span>
             </div>
          ) : (
             questions.map((q) => (
               <div key={q.id} className="bg-slate-955 border border-slate-850 p-4 rounded-xl flex flex-col gap-2 hover:border-slate-800 transition-colors">
                 <div className="flex items-start justify-between gap-4">
                   <div className="flex items-center gap-2">
                     <span className="bg-violet-500/10 text-violet-400 font-mono text-[10px] px-2 py-1 rounded border border-violet-500/20">
                       ID: {q.id}
                     </span>
                     <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                       {q.subject || "No Subject"} &gt; {q.topic || "No Topic"}
                     </span>
                   </div>
                   {q.tags && q.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                       {q.tags.map(tag => (
                         <span key={tag} className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold">
                           {tag}
                         </span>
                       ))}
                     </div>
                   )}
                   <div className="flex gap-2 ml-auto">
                     <button onClick={() => handleOpenForm(q)} className="text-slate-400 hover:text-white p-1.5 bg-slate-900 rounded-lg border border-slate-800 transition-colors" title="Edit Question">
                       <Edit2 className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => handleDelete(q.id)} className="text-rose-400 hover:text-rose-300 p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors" title="Delete Question">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 </div>
                 
                 <p className="text-sm font-semibold text-slate-100 mt-1">{q.questionText}</p>
                 
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   {q.options.map((opt, idx) => (
                     <div 
                       key={idx} 
                       className={`text-xs px-3 py-2 rounded-lg border ${idx === q.correctOptionIndex ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold" : "bg-slate-900 border-slate-800 text-slate-400"}`}
                     >
                       <span className="mr-2 opacity-60 font-black">{String.fromCharCode(65 + idx)})</span>
                       {opt}
                     </div>
                   ))}
                 </div>
               </div>
             ))
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800">
          <button
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="flex items-center gap-2 bg-slate-955 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          
          <div className="flex items-center gap-1.5">
            {/* Show a few page numbers around the current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple logic to center the pages around currentPage
              let pageNum = currentPage - 2 + i;
              if (currentPage < 3) pageNum = i + 1;
              if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                    currentPage === pageNum 
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" 
                      : "bg-slate-955 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="flex items-center gap-2 bg-slate-955 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Modal overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <form 
            onSubmit={handleSaveForm} 
            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100 font-sans max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {questionForm.id ? `✏️ Edit Question (${questionForm.id})` : "➕ Create Question"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Text</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  placeholder="Type MCQ question text..."
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-violet-500 resize-y min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {questionForm.options.map((opt, optIdx) => (
                  <div key={optIdx} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Option {String.fromCharCode(65 + optIdx)}
                    </label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updatedOpts = [...questionForm.options];
                        updatedOpts[optIdx] = e.target.value;
                        setQuestionForm({ ...questionForm, options: updatedOpts });
                      }}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correct Choice</label>
                  <select
                    value={questionForm.correctOptionIndex}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctOptionIndex: parseInt(e.target.value) })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none"
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Explanation</label>
                  <RichTextEditor
                    value={questionForm.explanation || ""}
                    onChange={(val) => setQuestionForm({ ...questionForm, explanation: val })}
                    placeholder="Enter detailed clinical rationale..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={questionForm.subject}
                    onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value, topic: "" })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none"
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {dbSubjects.map(sub => (
                      <option key={sub.uuid || sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Topic</label>
                  <select
                    value={questionForm.topic}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Topic --</option>
                    {(() => {
                      const subjectObj = dbSubjects.find(s => s.name === questionForm.subject);
                      if (!subjectObj) return null;
                      const filteredTopics = dbTopics.filter(t => t.subject_id === (subjectObj.uuid || subjectObj.id));
                      return Array.from(new Set(filteredTopics.map(t => t.name))).map(topicName => (
                        <option key={topicName} value={topicName as string}>{topicName as string}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tags (Enter to add)</label>
                  <div className="bg-slate-955 border border-slate-800 rounded-xl p-1.5 flex flex-wrap gap-1 items-center min-h-[38px]">
                    {(questionForm.tags || []).map(tag => (
                      <span key={tag} className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                        {tag}
                        <button type="button" onClick={() => setQuestionForm({ ...questionForm, tags: questionForm.tags?.filter(t => t !== tag) })} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && formTagInput.trim()) {
                          e.preventDefault();
                          const currentTags = questionForm.tags || [];
                          if (!currentTags.includes(formTagInput.trim())) {
                            setQuestionForm({ ...questionForm, tags: [...currentTags, formTagInput.trim()] });
                          }
                          setFormTagInput("");
                        }
                      }}
                      placeholder="e.g. Hard"
                      className="bg-transparent flex-1 focus:outline-none text-[10px] text-white placeholder-slate-600 min-w-[60px] py-0.5 px-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold px-4 py-2 text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 text-xs rounded-xl transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Question</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
