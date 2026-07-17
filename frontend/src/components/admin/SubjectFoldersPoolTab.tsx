import React, { useState } from "react";
import { FolderOpen, Folder, ChevronRight, PlusCircle, FileText, X, Save, HelpCircle, Edit3, Trash2, CheckCircle2, UploadCloud } from "lucide-react";
import { QuestionSet, Question } from "../../types";
import RichTextEditor from "../RichTextEditor";

interface SubjectFoldersPoolTabProps {
  independentQuestions: Question[];
  onSaveIndependentQuestions: (questions: Question[]) => void;
  allSets: QuestionSet[];
  setMessage: (msg: string) => void;
  handleOpenCSVEditorForSubject: (sub: string) => void;
  dbSubjects?: any[];
  dbTopics?: any[];
}

// Helper to parse CSV
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: string[] = [];
    let insideQuote = false;
    let entry = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());

    // Skip header row if it contains keywords
    if (i === 0 && row.some(col => {
      const lower = col.toLowerCase();
      return lower.includes("question") || lower.includes("explanation") || lower.includes("option") || lower.includes("correct");
    })) {
      continue;
    }

    result.push(row);
  }
  return result;
}

const extractQuestionsFromCSV = (text: string): Question[] => {
  const rows = parseCSV(text);
  return rows.map((row, index) => {
    const isTenColumn = row.length >= 9;
    
    const id = isTenColumn ? (row[0] || "").trim() : `parsed-q-${Date.now()}-${index}`;
    const questionText = isTenColumn ? (row[1] || "") : (row[0] || `MCQ Question ${index + 1}`);
    const optA = isTenColumn ? (row[2] || "") : (row[1] || "");
    const optB = isTenColumn ? (row[3] || "") : (row[2] || "");
    const optC = isTenColumn ? (row[4] || "") : (row[3] || "");
    const optD = isTenColumn ? (row[5] || "") : (row[4] || "");
    
    const correctStr = (isTenColumn ? (row[6] || "0") : (row[5] || "0")).trim().toLowerCase();
    let correctOptionIndex = 0;
    if (correctStr === "a" || correctStr === "0" || correctStr.includes("option a") || correctStr.includes("option 1")) {
      correctOptionIndex = 0;
    } else if (correctStr === "b" || correctStr === "1" || correctStr.includes("option b") || correctStr.includes("option 2")) {
      correctOptionIndex = 1;
    } else if (correctStr === "c" || correctStr === "2" || correctStr.includes("option c") || correctStr.includes("option 3")) {
      correctOptionIndex = 2;
    } else if (correctStr === "d" || correctStr === "3" || correctStr.includes("option d") || correctStr.includes("option 4")) {
      correctOptionIndex = 3;
    } else {
      const num = parseInt(correctStr);
      if (!isNaN(num) && num >= 0 && num < 4) {
        correctOptionIndex = num;
      }
    }

    const explanation = isTenColumn ? (row[7] || "No explanation provided.") : (row[6] || "No explanation provided.");
    const subject = isTenColumn ? (row[8] ? row[8].trim() : "") : (row[7] ? row[7].trim() : "");
    const topic = isTenColumn ? (row[9] ? row[9].trim() : "") : (row[8] ? row[8].trim() : "");

    return {
      id: id || `parsed-q-${Date.now()}-${index}`,
      questionText,
      options: [optA, optB, optC, optD],
      correctOptionIndex,
      explanation,
      subject,
      topic
    };
  });
};

export const SubjectFoldersPoolTab: React.FC<SubjectFoldersPoolTabProps> = ({
  independentQuestions,
  onSaveIndependentQuestions,
  allSets,
  setMessage,
  handleOpenCSVEditorForSubject,
  dbSubjects = [],
  dbTopics = []
}) => {
  // Folder Pool Navigation
  const [selectedSubjectFolder, setSelectedSubjectFolder] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [adminTargetExam, setAdminTargetExam] = useState<"mec-ug" | "other">("mec-ug");

  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentSubjectObj = dbSubjects.find(
    (s) => s.name.toLowerCase() === selectedSubjectFolder?.toLowerCase()
  );
  const currentTopics = dbTopics.filter(
    (t) => t.subject_id === currentSubjectObj?.uuid
  );

  const fetchQuestions = async (page = 1, topicId: number | null = null) => {
    if (!selectedSubjectFolder) return;

    const currentSubjectObj = dbSubjects.find(
      (s) => s.name.toLowerCase() === selectedSubjectFolder.toLowerCase()
    );
    if (!currentSubjectObj) return;

    setIsLoading(true);
    try {
      let url = `/api/questions?subject_id=${currentSubjectObj.uuid}&page=${page}`;
      if (topicId) {
        url += `&topic_id=${topicId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.status) {
        // Map database question models to frontend Question structure
        const mapped = data.questions.data.map((dbQ: any) => {
          const correctIndex = dbQ.options.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
          return {
            id: String(dbQ.id),
            questionText: dbQ.question_text,
            options: dbQ.options.sort((a: any, b: any) => a.option_index - b.option_index).map((o: any) => o.option_text),
            correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
            explanation: dbQ.explanation,
            subject: selectedSubjectFolder,
            topic: dbQ.topic ? dbQ.topic.name : "General"
          };
        });

        setDbQuestions(mapped);
        setCurrentPage(data.questions.current_page);
        setTotalPages(data.questions.last_page);
        setTotalQuestions(data.questions.total);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedSubjectFolder) {
      fetchQuestions(1, selectedTopicId);
    } else {
      setDbQuestions([]);
    }
  }, [selectedSubjectFolder, selectedTopicId]);

  // Creation Modals & Forms
  const [showCreateIndependentForm, setShowCreateIndependentForm] = useState(false);
  const [creationMode, setCreationMode] = useState<"interactive" | "bulk">("interactive");
  const [activeEditIndependentId, setActiveEditIndependentId] = useState<string | null>(null);

  // New MCQ Form Fields
  const [newIndQuestionText, setNewIndQuestionText] = useState("");
  const [newIndOptions, setNewIndOptions] = useState<string[]>(["", "", "", ""]);
  const [newIndCorrectIdx, setNewIndCorrectIdx] = useState(0);
  const [newIndExplanation, setNewIndExplanation] = useState("");
  const [newIndTopic, setNewIndTopic] = useState("");

  // Edit MCQ Form Fields
  const [editIndQuestionText, setEditIndQuestionText] = useState("");
  const [editIndOptions, setEditIndOptions] = useState<string[]>(["", "", "", ""]);
  const [editIndCorrectIdx, setEditIndCorrectIdx] = useState(0);
  const [editIndExplanation, setEditIndExplanation] = useState("");
  const [editIndTopic, setEditIndTopic] = useState("");

  // Bulk Upload
  const [adminBulkParsedQuestions, setAdminBulkParsedQuestions] = useState<Question[]>([]);
  const [adminBulkFileError, setAdminBulkFileError] = useState("");
  const [adminBulkTopic, setAdminBulkTopic] = useState("");

  const handleStartEditIndependentQuestion = (q: Question) => {
    setActiveEditIndependentId(q.id);
    setEditIndQuestionText(q.questionText);
    setEditIndOptions([...q.options]);
    setEditIndCorrectIdx(q.correctOptionIndex);
    setEditIndExplanation(q.explanation || "");
    setEditIndTopic(q.topic || "");
  };

  const handleSaveEditIndependentQuestion = async () => {
    if (!activeEditIndependentId || !selectedSubjectFolder) return;

    try {
      const response = await fetch(`/api/questions/${activeEditIndependentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editIndQuestionText,
          explanation: editIndExplanation,
          topic: editIndTopic,
          options: editIndOptions.map((opt, idx) => ({
            optionText: opt || `Option ${idx + 1}`,
            isCorrect: idx === editIndCorrectIdx,
            optionIndex: idx
          }))
        })
      });

      const data = await response.json();
      if (response.ok && data.status) {
        setMessage(`Successfully updated MCQ Question #${activeEditIndependentId}`);
        fetchQuestions(currentPage, selectedTopicId);
        setActiveEditIndependentId(null);
      } else {
        alert(data.message || "Failed to update question.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving question changes.");
    }
  };

  const handleDeleteIndependentQuestion = async (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Question #${id}?`)) {
      try {
        const response = await fetch(`/api/questions/${id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          setMessage(`Successfully deleted MCQ Question #${id}`);
          fetchQuestions(currentPage, selectedTopicId);
        } else {
          alert("Failed to delete question.");
        }
      } catch (e) {
        console.error(e);
        alert("Error connecting to backend API.");
      }
    }
  };

  const handleAddIndependentQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndQuestionText.trim() || !selectedSubjectFolder) return;

    const currentSubjectObj = dbSubjects.find(
      (s) => s.name.toLowerCase() === selectedSubjectFolder.toLowerCase()
    );

    if (!currentSubjectObj) {
      alert(`Subject '${selectedSubjectFolder}' not found in database.`);
      return;
    }

    const payload = {
      subject_id: currentSubjectObj.uuid,
      questions: [
        {
          questionText: newIndQuestionText,
          explanation: newIndExplanation,
          topicName: newIndTopic || "General",
          topic_id: null,
          options: newIndOptions.map((opt, idx) => ({
            optionText: opt || `Option ${idx + 1}`,
            isCorrect: idx === newIndCorrectIdx,
            optionIndex: idx
          }))
        }
      ]
    };

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok && responseData.status) {
        setNewIndQuestionText("");
        setNewIndOptions(["", "", "", ""]);
        setNewIndExplanation("");
        setShowCreateIndependentForm(false);
        setMessage(`Successfully added live MCQ to ${selectedSubjectFolder} Folder Pool!`);
        fetchQuestions(1, selectedTopicId);
      } else {
        alert(responseData.message || "Failed to add question.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend API.");
    }
  };

  // Derive topics from DB (filter by current selected subject)
  const currentSubjectDbObj = dbSubjects.find(
    (s) => s.name?.toLowerCase() === selectedSubjectFolder?.toLowerCase()
  );
  const currentSubjectTopics = dbTopics.filter(
    (t) => t.subject_id === currentSubjectDbObj?.uuid || t.subject_id === currentSubjectDbObj?.id
  );
  const hasTopics = currentSubjectTopics.length > 0;

  const handleAdminBulkCSVSubmit = async () => {
    if (adminBulkParsedQuestions.length === 0 || !selectedSubjectFolder) return;

    const currentSubjectObj = dbSubjects.find(
      (s) => s.name.toLowerCase() === selectedSubjectFolder?.toLowerCase()
    );

    if (!currentSubjectObj) {
      alert(`Subject '${selectedSubjectFolder}' not found in database.`);
      return;
    }

    const topicValue = hasTopics ? adminBulkTopic : "General";

    const payload = {
      subject_id: currentSubjectObj.uuid,
      questions: adminBulkParsedQuestions.map((q) => ({
        questionText: q.questionText,
        explanation: q.explanation,
        topicName: topicValue,
        topic_id: null,
        options: q.options.map((opt, idx) => ({
          optionText: opt || `Option ${idx + 1}`,
          isCorrect: idx === q.correctOptionIndex,
          optionIndex: idx
        }))
      }))
    };

    try {
      setMessage("⏳ Saving questions to pool database...");

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok && responseData.status) {
        const importedQuestions = responseData.questions.map((dbQ: any) => {
          const correctIndex = dbQ.options.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
          return {
            id: String(dbQ.id),
            questionText: dbQ.question_text,
            options: dbQ.options.sort((a: any, b: any) => a.option_index - b.option_index).map((o: any) => o.option_text),
            correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
            explanation: dbQ.explanation,
            subject: selectedSubjectFolder,
            topic: topicValue
          };
        });

        onSaveIndependentQuestions([...independentQuestions, ...importedQuestions]);
        setAdminBulkParsedQuestions([]);
        setAdminBulkFileError("");
        setShowCreateIndependentForm(false);
        setMessage(`🚀 Successfully bulk uploaded and saved ${importedQuestions.length} MCQs into database pool under ${selectedSubjectFolder}!`);
      } else {
        setMessage("");
        const errorMsg = responseData.message || "Failed to save questions.";
        const details = responseData.errors ? "\n\nDetails:\n" + responseData.errors.join("\n") : "";
        alert(`${errorMsg}${details}`);
      }
    } catch (e) {
      setMessage("");
      alert("Error connecting to backend API.");
      console.error(e);
    }
  };

  const handleAdminBulkCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdminBulkFileError("");
    setAdminBulkParsedQuestions([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          setAdminBulkFileError("Uploaded file is empty.");
          return;
        }

        const parsed = extractQuestionsFromCSV(text);
        if (parsed.length === 0) {
          setAdminBulkFileError("No data rows found in the CSV file.");
          return;
        }

        setAdminBulkParsedQuestions(parsed);
      } catch (err) {
        setAdminBulkFileError("Failed to parse file. Make sure it's a valid CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 font-sans">
      {selectedSubjectFolder === null ? (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <span>Independent MCQ Folder Directories</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a syllabus folder to manage, search, and edit independent medical exam questions chronologically.
              </p>
            </div>
            {/* Target Exam Focus Selector */}
           
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(() => {
              // Filter DB subjects by selected exam mode
              const mecUgExam = dbSubjects.length > 0
                ? (() => {
                    // Find the mec-ug exam id from the subjects' connected exams
                    // We filter dbSubjects based on the adminTargetExam
                    if (adminTargetExam === "mec-ug") {
                      // Show subjects whose linked exam slug is "mec-ug"
                      return dbSubjects.filter(s => {
                        if (!s.exam_id) return false;
                        const linkedExam = (window as any).__dbExams?.find?.((e: any) => e.id === s.exam_id);
                        return linkedExam ? (linkedExam.slug === "mec-ug" || linkedExam.code === "mec-ug") : false;
                      });
                    } else {
                      // Show subjects whose linked exam is NOT mec-ug
                      return dbSubjects.filter(s => {
                        if (!s.exam_id) return true;
                        const linkedExam = (window as any).__dbExams?.find?.((e: any) => e.id === s.exam_id);
                        return linkedExam ? !(linkedExam.slug === "mec-ug" || linkedExam.code === "mec-ug") : true;
                      });
                    }
                  })()
                : [];

              const subjectsToShow = mecUgExam.length > 0 ? mecUgExam : dbSubjects;

              return subjectsToShow.map((subObj) => {
                const sub = subObj.name;
                const qCount = totalQuestions > 0 && selectedSubjectFolder === sub ? totalQuestions : 0;
                return (
                  <button
                    type="button"
                    key={subObj.uuid || subObj.id || sub}
                    onClick={() => {
                      setSelectedSubjectFolder(sub);
                      setCreationMode("interactive");
                      setAdminBulkParsedQuestions([]);
                      setAdminBulkFileError("");
                      // Set default topic from DB topics for this subject
                      const subTopics = dbTopics.filter(
                        (t) => t.subject_id === subObj.uuid || t.subject_id === subObj.id
                      );
                      if (subTopics.length > 0) {
                        setNewIndTopic(subTopics[0].name);
                        setAdminBulkTopic(subTopics[0].name);
                      } else {
                        setNewIndTopic("");
                        setAdminBulkTopic("");
                      }
                    }}
                    className="text-left bg-slate-900 hover:bg-slate-855 border border-slate-800 hover:border-violet-500/50 p-5 rounded-2xl transition-all cursor-pointer group flex items-start gap-4 shadow-md"
                  >
                    <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-violet-500/10 text-amber-400 group-hover:text-violet-400 transition-colors shrink-0">
                      <Folder className="w-6 h-6 fill-amber-400/10 group-hover:fill-violet-400/10" />
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                        {sub} Folder
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {qCount} {qCount === 1 ? "MCQ" : "MCQs"} cataloged
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 self-center transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                );
              });
            })()}
            {dbSubjects.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-500">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No subjects found in database.</p>
                <p className="text-xs mt-1">Add subjects from the Subjects tab first.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folder Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubjectFolder(null);
                  setShowCreateIndependentForm(false);
                  setActiveEditIndependentId(null);
                }}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 mb-2 cursor-pointer transition-colors"
              >
                ← Back to Folder Directories
              </button>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <span>{selectedSubjectFolder} Folder Pool</span>
                <span className="bg-slate-850 border border-slate-755 text-slate-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {independentQuestions.filter(q => q.subject === selectedSubjectFolder).length} Questions
                </span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenCSVEditorForSubject(selectedSubjectFolder)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Edit Folder as CSV</span>
              </button>
              {!showCreateIndependentForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateIndependentForm(true);
                    setCreationMode("interactive");
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/10 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create / Bulk Upload MCQ</span>
                </button>
              )}
            </div>
          </div>

          {/* Show Create / Bulk Form */}
          {showCreateIndependentForm && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
                <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-855 select-none">
                  <button
                    type="button"
                    onClick={() => setCreationMode("interactive")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      creationMode === "interactive"
                        ? "bg-violet-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ✍️ Write Interactively
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode("bulk")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      creationMode === "bulk"
                        ? "bg-violet-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📥 Bulk CSV Upload
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateIndependentForm(false)}
                  className="text-slate-400 hover:text-white self-end sm:self-auto p-1 bg-slate-955 rounded-lg hover:bg-slate-850 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {creationMode === "interactive" ? (
                <form onSubmit={handleAddIndependentQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        MCQ Question Text (Visual Formatting & Tables supported)
                      </label>
                      <RichTextEditor
                        value={newIndQuestionText}
                        onChange={setNewIndQuestionText}
                        placeholder="Type your question stem here..."
                      />
                    </div>

                    {hasTopics ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Syllabus Topic Tag
                        </label>
                        <select
                          value={newIndTopic}
                          onChange={(e) => setNewIndTopic(e.target.value)}
                          className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                        >
                          <option value="">— Select Topic —</option>
                          {currentSubjectTopics.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Correct Option (Correct Answer Key)
                      </label>
                      <select
                        value={newIndCorrectIdx}
                        onChange={(e) => setNewIndCorrectIdx(parseInt(e.target.value))}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                      >
                        <option value={0}>Option A is Correct</option>
                        <option value={1}>Option B is Correct</option>
                        <option value={2}>Option C is Correct</option>
                        <option value={3}>Option D is Correct</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Four Answer Choices (A, B, C, D)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {newIndOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 bg-slate-955 border border-slate-850 p-2.5 rounded-xl">
                          <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center select-none">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newIndOptions];
                              copy[oIdx] = e.target.value;
                              setNewIndOptions(copy);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="bg-transparent flex-1 focus:outline-none text-xs text-white placeholder-slate-600 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Detailed Explanation, Rationale & Study References
                    </label>
                    <RichTextEditor
                      value={newIndExplanation}
                      onChange={setNewIndExplanation}
                      placeholder="Detail the explanation for the correct choice."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateIndependentForm(false);
                        setNewIndQuestionText("");
                        setNewIndOptions(["", "", "", ""]);
                        setNewIndExplanation("");
                      }}
                      className="bg-slate-800 hover:bg-slate-755 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Add to Pool Directory</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {hasTopics && (
                    <div className="max-w-xs">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Select Topic Tag for Bulk Upload
                      </label>
                      <select
                        value={adminBulkTopic}
                        onChange={(e) => setAdminBulkTopic(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                      >
                        <option value="">— Select Topic —</option>
                        {currentSubjectTopics.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-8 text-center transition-colors relative">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleAdminBulkCSVUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-xs font-bold text-white mb-1">Upload CSV spreadsheet of MCQs</p>
                    <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                      CSV format: Question Stem, Option A, Option B, Option C, Option D, Correct Key (0-3), Explanation text.
                    </p>
                  </div>

                  {adminBulkFileError && (
                    <p className="text-xs font-bold text-red-400">{adminBulkFileError}</p>
                  )}

                  {adminBulkParsedQuestions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-955 px-4 py-2.5 rounded-xl border border-slate-850">
                        <span className="text-[11px] font-extrabold text-violet-400 font-mono">
                          Parsed {adminBulkParsedQuestions.length} Questions
                        </span>
                        <button
                          type="button"
                          onClick={handleAdminBulkCSVSubmit}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] px-4 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publish All parsed MCQs</span>
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800 bg-slate-950 border border-slate-850 rounded-xl p-3">
                        {adminBulkParsedQuestions.map((q, idx) => (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                            <p className="font-bold text-white">Q{idx + 1}: {q.questionText}</p>
                            <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-400 text-[10px]">
                              <span>A: {q.options[0]}</span>
                              <span>B: {q.options[1]}</span>
                              <span>C: {q.options[2]}</span>
                              <span>D: {q.options[3]}</span>
                            </div>
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">
                              Correct: {String.fromCharCode(65 + q.correctOptionIndex)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Topic Filter Bar */}
          {currentTopics.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 shrink-0">Filter by Topic:</span>
                <select
                  value={selectedTopicId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTopicId(val ? Number(val) : null);
                  }}
                  className="bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-bold w-full sm:w-auto min-w-[200px]"
                >
                  <option value="">All Topics</option>
                  {currentTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isLoading ? "Loading questions..." : `Found ${totalQuestions} cataloged MCQs`}
              </div>
            </div>
          )}

          {/* Subject MCQs Chronological List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                    <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-10 bg-slate-800 rounded"></div>
                      <div className="h-10 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dbQuestions.length === 0 ? (
              <div className="text-center py-12 bg-slate-955 border border-slate-850 rounded-2xl">
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-white text-sm font-bold">No Questions in this Topic/Folder</p>
                <p className="text-slate-400 text-xs mt-1">
                  Click the create button above to add your first high-yield MCQ to {selectedSubjectFolder}!
                </p>
              </div>
            ) : (
              dbQuestions.map((q) => {
                const isEditing = activeEditIndependentId === q.id;
                return (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md animate-in fade-in duration-200">
                    {isEditing ? (
                      <div className="p-6 space-y-4 bg-slate-900">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <h4 className="text-xs font-bold text-violet-400 font-mono">
                            ✏️ EDITING MCQ QUESTION: {q.id}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setActiveEditIndependentId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Question Text</label>
                            <RichTextEditor value={editIndQuestionText} onChange={setEditIndQuestionText} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hasTopics ? (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 font-mono">Topic Tag</label>
                                <select
                                  value={editIndTopic}
                                  onChange={(e) => setEditIndTopic(e.target.value)}
                                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                                >
                                  <option value="">— Select Topic —</option>
                                  {currentSubjectTopics.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Correct Option Index</label>
                              <select
                                value={editIndCorrectIdx}
                                onChange={(e) => setEditIndCorrectIdx(parseInt(e.target.value))}
                                className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none font-bold"
                              >
                                <option value={0}>Option A is Correct</option>
                                <option value={1}>Option B is Correct</option>
                                <option value={2}>Option C is Correct</option>
                                <option value={3}>Option D is Correct</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">MCQ Options</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {editIndOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2 bg-slate-955 border border-slate-800 p-2 rounded-xl">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 flex items-center justify-center select-none">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const copy = [...editIndOptions];
                                      copy[oIdx] = e.target.value;
                                      setEditIndOptions(copy);
                                    }}
                                    className="bg-transparent flex-1 focus:outline-none text-xs text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detailed Explanation & Rationale</label>
                            <RichTextEditor value={editIndExplanation} onChange={setEditIndExplanation} />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveEditIndependentId(null)}
                              className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditIndependentQuestion}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Question Changes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 sm:p-6 space-y-4">
                        {/* Metadata Badge */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                              QID: {q.id}
                            </span>
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                              🏷️ {q.topic || "General"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditIndependentQuestion(q)}
                              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Edit Question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteIndependentQuestion(q.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-650 hover:text-white text-red-400 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Question STEM */}
                        <div className="space-y-3">
                          <div 
                            className="text-white text-sm leading-relaxed prose prose-invert font-sans"
                            dangerouslySetInnerHTML={{ __html: q.questionText }}
                          />

                          {/* MCQ Choices Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctOptionIndex === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                                    isCorrect
                                      ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                                      : "bg-slate-955 border-slate-850 text-slate-400"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    isCorrect
                                      ? "bg-emerald-500 text-slate-950"
                                      : "bg-slate-900 border border-slate-800 text-slate-500"
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="text-xs leading-normal font-medium">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="bg-slate-955 border border-slate-850 rounded-2xl p-4.5 mt-3 space-y-2">
                            <h5 className="text-[10px] font-black tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Official Explanation & Study Rationales</span>
                            </h5>
                            <div 
                              className="text-xs text-slate-300 leading-relaxed font-sans"
                              dangerouslySetInnerHTML={{ __html: q.explanation }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 select-none">
              <button
                type="button"
                disabled={currentPage === 1 || isLoading}
                onClick={() => fetchQuestions(currentPage - 1, selectedTopicId)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-850 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:bg-slate-900 text-xs text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Previous
              </button>
              
              <span className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-955 border border-slate-850 rounded-xl">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => fetchQuestions(currentPage + 1, selectedTopicId)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-850 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:bg-slate-900 text-xs text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    );
  };
