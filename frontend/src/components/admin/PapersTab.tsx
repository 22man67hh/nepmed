import React, { useState } from "react";
import { FileText, Clock, Tag, Edit, Trash2, Plus, UploadCloud } from "lucide-react";
import { QuestionSet, Question } from "../../types";
import { ALL_STANDARD_SUBJECTS } from "../../subjectsData";

interface PapersTabProps {
  allSets: QuestionSet[];
  onSaveSets: (sets: QuestionSet[]) => void;
  cmsTargetExams: any[];
  cmsContent: any;
  setMessage: (msg: string) => void;
  askConfirmation: (title: string, msg: string, onConfirm: () => void, onCancel?: () => void) => void;
  handleEditClick: (set: QuestionSet) => void;
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

export const PapersTab: React.FC<PapersTabProps> = ({
  allSets,
  onSaveSets,
  cmsTargetExams,
  cmsContent,
  setMessage,
  askConfirmation,
  handleEditClick
}) => {
  const [selectedPaperExamFilter, setSelectedPaperExamFilter] = useState("all");

  // Create Custom Set States
  const [newTitle, setNewTitle] = useState("");
  const [newExamType, setNewExamType] = useState(cmsTargetExams[0]?.id || "mec-ug");
  const [newType, setNewType] = useState<"mock-test" | "past-year">("mock-test");
  const [newDuration, setNewDuration] = useState(180);
  const [newPrice, setNewPrice] = useState(0);
  const [newIsFree, setNewIsFree] = useState(true);
  const [newProvince, setNewProvince] = useState("none");
  const [newCorrectMarks, setNewCorrectMarks] = useState(1);
  const [newIncorrectMarks, setNewIncorrectMarks] = useState(0.25);
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q-1", questionText: "", options: ["", "", "", ""], correctOptionIndex: 0, explanation: "" }
  ]);

  const handleAddQuestionRow = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length + 1}`,
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: ""
      }
    ]);
  };

  const handleUpdateQuestionField = (idx: number, field: keyof Question, val: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  const handleUpdateOptionField = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = val;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  const handleNewSetMcqFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const parsedQuestions = extractQuestionsFromCSV(text);
        if (parsedQuestions.length === 0) {
          alert("The file appears to be empty or in an invalid format.");
          return;
        }

        askConfirmation(
          "Append or Replace Questions?",
          `Successfully parsed ${parsedQuestions.length} questions. Do you want to REPLACE the draft questions list with these new ones? (Selecting "Cancel" will APPEND the parsed questions instead)`,
          () => {
            setQuestions(parsedQuestions);
            setMessage(`Loaded ${parsedQuestions.length} MCQs to draft editor!`);
          },
          () => {
            setQuestions([...questions, ...parsedQuestions]);
            setMessage(`Appended ${parsedQuestions.length} MCQs to draft editor!`);
          }
        );
      } catch (err) {
        alert("Error parsing CSV file. Schema fields: question text, option a, option b, option c, option d, key index, explanation");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleCreateNewSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("Please enter a title for the new paper set.");
      return;
    }
    if (questions.some(q => !q.questionText.trim())) {
      alert("All questions must have a question stem.");
      return;
    }

    const newSet: QuestionSet = {
      id: `set-${Date.now()}`,
      title: newTitle,
      examType: newExamType,
      type: newType,
      durationMinutes: newDuration,
      price: newIsFree ? 0 : newPrice,
      isFree: newIsFree,
      province: newProvince === "none" ? undefined : newProvince,
      correctMarks: newCorrectMarks,
      incorrectMarks: newIncorrectMarks,
      questions: questions.map((q, idx) => ({
        ...q,
        id: q.id.startsWith("q-") ? `q-${Date.now()}-${idx + 1}` : q.id
      }))
    };

    // Save to database
    try {
      const res = await fetch("/api/admin/question-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSet)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMessage("Custom set published to database successfully!");
        }
      }
    } catch (err) {
      console.error(err);
    }

    onSaveSets([...allSets, newSet]);

    // Reset Fields
    setNewTitle("");
    setNewDuration(180);
    setNewPrice(0);
    setNewIsFree(true);
    setQuestions([{ id: "q-1", questionText: "", options: ["", "", "", ""], correctOptionIndex: 0, explanation: "" }]);
    setMessage(`Successfully created & published custom MCQ set "${newSet.title}"!`);
  };

  const handleDeleteClick = (setId: string) => {
    askConfirmation(
      "Confirm Deletion",
      "Are you sure you want to permanently delete this Question Paper set? This action cannot be undone.",
      async () => {
        try {
          await fetch(`/api/admin/question-sets/${setId}`, {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
      {/* Left Section: Existing sets manager with Dropdown and Subcategories */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Available Question Papers ({allSets.length})
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Filter, categorize and subcategorize available MCQ sets.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Exam:</span>
            <select
              value={selectedPaperExamFilter}
              onChange={(e) => setSelectedPaperExamFilter(e.target.value)}
              className="bg-slate-955 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="all">🌐 All Target Exams</option>
              {cmsTargetExams.map(exam => (
                <option key={exam.id} value={exam.id}>🎯 {exam.name} ({exam.id.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {cmsTargetExams
            .filter(exam => selectedPaperExamFilter === "all" || exam.id === selectedPaperExamFilter)
            .map(exam => {
              const examSets = allSets.filter(s => s.examType.toLowerCase() === exam.id.toLowerCase());
              
              if (examSets.length === 0 && selectedPaperExamFilter !== "all") {
                return (
                  <div key={exam.id} className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-xl text-center">
                    <p className="text-slate-400 text-xs font-semibold">No papers available for <strong>{exam.name}</strong> yet.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Use the custom builder on the right to upload or write questions.</p>
                  </div>
                );
              }
              if (examSets.length === 0) return null;

              const mockSets = examSets.filter(s => s.type === "mock-test");
              const pastSets = examSets.filter(s => s.type === "past-year");

              return (
                <div key={exam.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
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
                  <div className="space-y-4">
                    {/* Subcategory 1: Mock Tests */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                          ⚔️ Mock Tests
                        </span>
                        <span className="text-[9px] text-slate-500">({mockSets.length} sets available)</span>
                      </div>
                      {mockSets.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic pl-3 font-sans">No active mock test sets in this subcategory.</p>
                      ) : (
                        <div className="space-y-2.5 pl-2">
                          {mockSets.map(set => (
                            <div 
                              key={set.id}
                              className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{set.title}</p>
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

                              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 w-full md:w-auto justify-end">
                                <button
                                  onClick={() => handleEditClick(set)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                                >
                                  <Edit className="w-3 h-3" /> Edit
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
                    <div>
                      <div className="flex items-center gap-2 mb-2 pt-1">
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded">
                          📜 Past Board Papers
                        </span>
                        <span className="text-[9px] text-slate-500">({pastSets.length} sets available)</span>
                      </div>
                      {pastSets.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic pl-3 font-sans">No official past paper sets in this subcategory.</p>
                      ) : (
                        <div className="space-y-2.5 pl-2">
                          {pastSets.map(set => (
                            <div 
                              key={set.id}
                              className="bg-slate-955 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{set.title}</p>
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

                              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 w-full md:w-auto justify-end">
                                <button
                                  onClick={() => handleEditClick(set)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                                >
                                  <Edit className="w-3 h-3" /> Edit
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
      </div>

      {/* Right Section: Add custom paper set */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5 shadow-lg h-fit">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Create Custom Set
          </h3>
          <p className="text-xs text-slate-400 mt-1">Upload a CSV sheet or construct MCQs interactively to publish a new paper.</p>
        </div>

        <form onSubmit={handleCreateNewSet} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paper Title / Description
            </label>
            <input
              type="text"
              placeholder="e.g., MEC-UG Parasitology Booster"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Exam Type
              </label>
              <select
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer font-sans"
              >
                {cmsContent?.targetExams && cmsContent.targetExams.length > 0 ? (
                  cmsContent.targetExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name || exam.code || exam.id}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="mec-ug">MEC-UG</option>
                    <option value="mec-pg">MEC-PG</option>
                    <option value="nmcle">NMCLE</option>
                    <option value="ku-mcq">KU MCQ</option>
                    <option value="loksewa">Loksewa</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Topic Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer font-sans"
              >
                <option value="mock-test">Mock Test</option>
                <option value="past-year">Past Year paper</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(parseInt(e.target.value) || 5)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Price in Rs.
              </label>
              <input
                type="number"
                disabled={newIsFree}
                value={newPrice}
                onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs disabled:opacity-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Correct Marks (+ value)
              </label>
              <input
                type="number"
                step="0.1"
                value={newCorrectMarks}
                onChange={(e) => setNewCorrectMarks(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                Incorrect Penalty (- coefficient)
              </label>
              <input
                type="number"
                step="0.05"
                value={newIncorrectMarks}
                onChange={(e) => setNewIncorrectMarks(parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {newExamType === "loksewa" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Province Assignment
              </label>
              <select
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer font-sans"
              >
                <option value="none">None / Not Applicable</option>
                <option value="central">Central Loksewa</option>
                <option value="koshi">Koshi Province</option>
                <option value="bagmati">Bagmati Province</option>
                <option value="madesh">Madhesh Province</option>
                <option value="gandaki">Gandaki Province</option>
                <option value="lumbini">Lumbini Province</option>
                <option value="karnali">Karnali Province</option>
                <option value="sudurpaschim">Sudurpaschim Province</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="new-is-free"
              checked={newIsFree}
              onChange={(e) => setNewIsFree(e.target.checked)}
              className="bg-slate-955 border border-slate-800 text-emerald-400 rounded focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="new-is-free" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
              Offer this set as Free
            </label>
          </div>

          {/* MCQ Upload/Build Row */}
          <div className="border-t border-slate-800/80 pt-4 space-y-4">
            <div className="bg-slate-955 p-3 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5">
              <UploadCloud className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-300">File Auto-Extraction</span>
              <p className="text-[9px] text-slate-500 leading-normal">Order: question, opt_a, opt_b, opt_c, opt_d, key, explanation</p>
              <input
                type="file"
                accept=".csv,.txt"
                id="new-set-file-uploader"
                onChange={handleNewSetMcqFileUpload}
                className="hidden"
              />
              <label
                htmlFor="new-set-file-uploader"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2.5 py-1.5 rounded border border-emerald-500/20 cursor-pointer transition-all mt-1 inline-block"
              >
                Upload MCQ Sheet (.csv)
              </label>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Questions ({questions.length})</p>
              <button
                type="button"
                onClick={handleAddQuestionRow}
                className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold bg-slate-955 border border-slate-800 px-2 py-1 rounded cursor-pointer"
              >
                + Add Single MCQ
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="p-3 bg-slate-955 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-violet-400">MCQ #{qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          askConfirmation(
                            "Remove Question",
                            "Are you sure you want to remove this question from the set?",
                            () => {
                              setQuestions(questions.filter((_, idx) => idx !== qIdx));
                            }
                          );
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Question Description"
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestionField(qIdx, "questionText", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-500">{String.fromCharCode(65 + optIdx)}</span>
                        <input
                          type="text"
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => handleUpdateOptionField(qIdx, optIdx, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white text-[11px]"
                        />
                      </div>
                    ))}
                  </div>

                   <div className="grid grid-cols-3 gap-2 text-xs">
                    <select
                      value={q.correctOptionIndex}
                      onChange={(e) => handleUpdateQuestionField(qIdx, "correctOptionIndex", parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px] cursor-pointer"
                    >
                      <option value={0}>Key: A</option>
                      <option value={1}>Key: B</option>
                      <option value={2}>Key: C</option>
                      <option value={3}>Key: D</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Explanation..."
                      value={q.explanation}
                      onChange={(e) => handleUpdateQuestionField(qIdx, "explanation", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                    />

                    <select
                      value={q.subject || ""}
                      onChange={(e) => handleUpdateQuestionField(qIdx, "subject", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px] cursor-pointer"
                    >
                      <option value="">-- No Subject --</option>
                      {ALL_STANDARD_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-violet-600/10"
          >
            <UploadCloud className="w-4 h-4" /> Save & Publish Custom MCQ Set
          </button>
        </form>
      </div>
    </div>
  );
};
