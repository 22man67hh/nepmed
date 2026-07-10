import React from "react";
import { ChevronLeft, Edit, Clock, Tag, Plus, Trash2, UploadCloud, CheckCircle } from "lucide-react";
import { QuestionSet, Question } from "../../types";
import { ALL_STANDARD_SUBJECTS } from "../../subjectsData";

interface EditSetOverlayProps {
  activeEditSet: QuestionSet;
  setActiveEditSet: (set: QuestionSet | null) => void;
  allSets: QuestionSet[];
  onSaveSets: (sets: QuestionSet[]) => void;
  handleOpenCSVEditorForSet: () => void;
  askConfirmation: (title: string, msg: string, onConfirm: () => void, onCancel?: () => void) => void;
  triggerNotification: (msg: string) => void;
}

// Global Helper to parse CSV
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

export const EditSetOverlay: React.FC<EditSetOverlayProps> = ({
  activeEditSet,
  setActiveEditSet,
  allSets,
  onSaveSets,
  handleOpenCSVEditorForSet,
  askConfirmation,
  triggerNotification
}) => {
  const handleUpdateEditSetField = (field: keyof QuestionSet, value: any) => {
    setActiveEditSet({
      ...activeEditSet,
      [field]: value
    });
  };

  const handleUpdateEditQuestionField = (qIdx: number, field: keyof Question, value: any) => {
    const updatedQs = [...activeEditSet.questions];
    updatedQs[qIdx] = { ...updatedQs[qIdx], [field]: value };
    setActiveEditSet({ ...activeEditSet, questions: updatedQs });
  };

  const handleUpdateEditOptionField = (qIdx: number, optIdx: number, value: string) => {
    const updatedQs = [...activeEditSet.questions];
    const updatedOpts = [...updatedQs[qIdx].options];
    updatedOpts[optIdx] = value;
    updatedQs[qIdx].options = updatedOpts;
    setActiveEditSet({ ...activeEditSet, questions: updatedQs });
  };

  const handleAddEditQuestionRow = () => {
    setActiveEditSet({
      ...activeEditSet,
      questions: [
        ...activeEditSet.questions,
        {
          id: `edit-q-${Date.now()}-${activeEditSet.questions.length + 1}`,
          questionText: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          explanation: ""
        }
      ]
    });
  };

  const handleRemoveEditQuestionRow = (qIdx: number) => {
    askConfirmation(
      "Remove Question from Set",
      "Are you sure you want to remove this question from the set?",
      () => {
        setActiveEditSet({
          ...activeEditSet,
          questions: activeEditSet.questions.filter((_, idx) => idx !== qIdx)
        });
      }
    );
  };

  const handleEditMcqFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          "Replace Existing MCQs?",
          `Successfully parsed ${parsedQuestions.length} questions. Do you want to REPLACE the existing questions of this set with these new ones? (Selecting "Cancel" will APPEND the new questions to the end of the set instead)`,
          () => {
            setActiveEditSet({ ...activeEditSet, questions: parsedQuestions });
            triggerNotification(`Loaded ${parsedQuestions.length} MCQs to set successfully (Replaced existing)!`);
          },
          () => {
            setActiveEditSet({ ...activeEditSet, questions: [...activeEditSet.questions, ...parsedQuestions] });
            triggerNotification(`Loaded ${parsedQuestions.length} MCQs to set successfully (Appended to set)!`);
          }
        );
      } catch (err) {
        alert("Error parsing CSV. Format order should be: question text, option a, b, c, d, correct, explanation");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveActiveEditSet = () => {
    if (!activeEditSet.title) {
      alert("Please provide a set title.");
      return;
    }
    if (activeEditSet.questions.length === 0) {
      alert("The set must contain at least 1 question.");
      return;
    }

    const updatedSets = allSets.map(s => s.id === activeEditSet.id ? activeEditSet : s);
    onSaveSets(updatedSets);
    setActiveEditSet(null);
    triggerNotification("Saved all configurations & question bank changes!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100 font-sans">
      {/* Editor Title Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveEditSet(null)}
            className="text-slate-400 hover:text-white p-2 bg-slate-955 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-violet-400 font-bold text-xs tracking-wider uppercase block mb-0.5">
              DATABASE CONFIGURATION PANEL
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Edit className="w-5.5 h-5.5 text-violet-400" />
              Edit: {activeEditSet.title}
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveEditSet(null)}
            className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveActiveEditSet}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            Save Configuration Changes
          </button>
        </div>
      </div>

      {/* Set Configuration Options */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          1. Core Metadata Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paper Title
            </label>
            <input
              type="text"
              value={activeEditSet.title}
              onChange={(e) => handleUpdateEditSetField("title", e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Target Board Exam
            </label>
            <select
              value={activeEditSet.examType}
              onChange={(e) => handleUpdateEditSetField("examType", e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="mec-ug">MEC-UG Undergraduate</option>
              <option value="mec-pg">MEC-PG Postgraduate</option>
              <option value="nmcle">NMCLE Licensing</option>
              <option value="ku-mcq">KU MCQ</option>
              <option value="loksewa">Loksewa Medical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={activeEditSet.type}
              onChange={(e) => handleUpdateEditSetField("type", e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="mock-test">Mock Test</option>
              <option value="past-year">Past Year paper</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Timer Duration (mins)
            </label>
            <input
              type="number"
              value={activeEditSet.durationMinutes}
              onChange={(e) => handleUpdateEditSetField("durationMinutes", parseInt(e.target.value) || 5)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Price (NPR)
            </label>
            <input
              type="number"
              disabled={activeEditSet.isFree}
              value={activeEditSet.price}
              onChange={(e) => handleUpdateEditSetField("price", parseInt(e.target.value) || 0)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Chronological Date / Year Label
            </label>
            <input
              type="text"
              value={activeEditSet.yearOrDate || ""}
              onChange={(e) => handleUpdateEditSetField("yearOrDate", e.target.value)}
              placeholder="e.g. 2023 or 2024-05"
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              Correct Marks (+ value)
            </label>
            <input
              type="number"
              step="0.1"
              value={activeEditSet.correctMarks !== undefined ? activeEditSet.correctMarks : 1}
              onChange={(e) => handleUpdateEditSetField("correctMarks", parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
              Incorrect Penalty (- coefficient)
            </label>
            <input
              type="number"
              step="0.05"
              value={activeEditSet.incorrectMarks !== undefined ? activeEditSet.incorrectMarks : 0}
              onChange={(e) => handleUpdateEditSetField("incorrectMarks", parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Province Assignment (For Loksewa sets)
            </label>
            <select
              value={activeEditSet.province || "none"}
              onChange={(e) => handleUpdateEditSetField("province", e.target.value === "none" ? undefined : e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2.5 px-2.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
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

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="edit-is-free"
              checked={activeEditSet.isFree}
              onChange={(e) => {
                const free = e.target.checked;
                setActiveEditSet({
                  ...activeEditSet,
                  isFree: free,
                  price: free ? 0 : activeEditSet.price
                });
              }}
              className="bg-slate-955 border border-slate-800 text-emerald-400 rounded focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="edit-is-free" className="text-xs font-semibold text-slate-300 cursor-pointer">
              Mark as Completely Free Set
            </label>
          </div>
        </div>
      </div>

      {/* Edit / Replace MCQ Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. MCQ Bank Configurations ({activeEditSet.questions.length} items)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Upload a CSV file to replace or append questions, or use the interactive editor below.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCSVEditorForSet}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Edit Set as CSV</span>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".csv,.txt"
                id="edit-file-uploader"
                onChange={handleEditMcqFileUpload}
                className="hidden"
              />
              <label
                htmlFor="edit-file-uploader"
                className="bg-violet-600/20 hover:bg-violet-600 hover:text-white border border-violet-500/20 text-violet-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                Upload/Replace MCQ file (CSV)
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddEditQuestionRow}
              className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-all"
            >
              + Add Single MCQ Row
            </button>
          </div>
        </div>

        {/* Interactive Question Fields List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-800/60">
          {activeEditSet.questions.map((q, qIdx) => (
            <div key={q.id} className="pt-4 first:pt-0 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-violet-400 uppercase tracking-widest font-mono">Question #{qIdx + 1}</span>
                {activeEditSet.questions.length > 1 && (
                  <button
                    onClick={() => handleRemoveEditQuestionRow(qIdx)}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Question Description</label>
                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => handleUpdateEditQuestionField(qIdx, "questionText", e.target.value)}
                  placeholder="Enter question text"
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-955 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdateEditOptionField(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 bg-slate-955 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Correct Option Key</label>
                  <select
                    value={q.correctOptionIndex}
                    onChange={(e) => handleUpdateEditQuestionField(qIdx, "correctOptionIndex", parseInt(e.target.value))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value={0}>A (Option 1)</option>
                    <option value={1}>B (Option 2)</option>
                    <option value={2}>C (Option 3)</option>
                    <option value={3}>D (Option 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Medical Explanation / Pathophysiology</label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleUpdateEditQuestionField(qIdx, "explanation", e.target.value)}
                    placeholder="Add high-yield concept explanation..."
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-violet-400 uppercase mb-1">Subject Tag</label>
                  <select
                    value={q.subject || ""}
                    onChange={(e) => handleUpdateEditQuestionField(qIdx, "subject", e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="">-- No Subject --</option>
                    {ALL_STANDARD_SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions block */}
      <div className="flex justify-end gap-3.5 pt-2">
        <button
          onClick={() => setActiveEditSet(null)}
          className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition-all border border-slate-700 cursor-pointer"
        >
          Discard All Changes
        </button>
        <button
          onClick={handleSaveActiveEditSet}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-7 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          Save Set Config & MCQs
        </button>
      </div>
    </div>
  );
};
