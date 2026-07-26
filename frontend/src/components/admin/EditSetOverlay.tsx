import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  Clock, 
  Tag, 
  Plus, 
  Trash2, 
  UploadCloud, 
  CheckCircle, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  PlusCircle, 
  X, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { QuestionSet, Question } from "../../types";
import RichTextEditor from "../RichTextEditor";


interface EditSetOverlayProps {
  activeEditSet: QuestionSet;
  setActiveEditSet: (set: QuestionSet | null) => void;
  allSets: QuestionSet[];
  onSaveSets: (sets: QuestionSet[]) => void;
  independentQuestions: Question[];
  onSaveIndependentQuestions: (questions: Question[]) => void;
  dbExams?: any[];
  dbSubjects?: any[];
  dbTopics?: any[];
  setMessage: (msg: string) => void;
  handleOpenCSVEditorForSet?: (set: QuestionSet) => void;
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
    
    const id = isTenColumn ? (row[0] || "").trim() : `q-csv-${Date.now()}-${index}`;
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
      id: id || `q-csv-${Date.now()}-${index}`,
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
  independentQuestions,
  onSaveIndependentQuestions,
  dbExams = [],
  dbSubjects = [],
  dbTopics = [],
  setMessage,
  askConfirmation,
  triggerNotification
}) => {
  // Collapsible metadata config section state
  const [showConfig, setShowConfig] = useState(true);

  // Pool Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");

  // Inline Question Creation / Editing Form States
  const [isEditingQuestion, setIsEditingQuestion] = useState<Question | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: "",
    questionText: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    explanation: "",
    subject: "",
    topic: ""
  });

  // Track whether we're loading questions from DB for this set
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Ensure examType is valid against dbExams to prevent publish errors
  React.useEffect(() => {
    if (dbExams && dbExams.length > 0) {
      const isValid = dbExams.some((e: any) => (e.slug || e.code || String(e.id)) === activeEditSet.examType);
      if (!isValid) {
        const firstExamValue = dbExams[0].slug || dbExams[0].id;
        setActiveEditSet({ ...activeEditSet, examType: String(firstExamValue) });
      }
    }
  }, [dbExams, activeEditSet.examType, activeEditSet.id]);

  // Lazy-load questions from DB when editing an existing set that has no questions loaded
  React.useEffect(() => {
    const isExistingSet = activeEditSet.id && !activeEditSet.id.startsWith("new-");
    const hasNoQuestions = activeEditSet.questions.length === 0;
    
    if (isExistingSet && hasNoQuestions) {
      setIsLoadingQuestions(true);
      fetch(`/api/question-sets/${activeEditSet.id}`)
        .then(res => res.json())
        .then(data => {
          const set = data.set || data.questionSet || data;
          if (set && set.questions && Array.isArray(set.questions)) {
            const mapped: Question[] = set.questions.map((q: any) => {
              const opts = (q.options || []).sort((a: any, b: any) => a.option_index - b.option_index);
              const correctIdx = opts.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
              return {
                id: String(q.id),
                questionText: q.question_text || q.questionText || "",
                options: opts.map((o: any) => o.option_text || ""),
                correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
                explanation: q.explanation || "",
                subject: q.subject?.name || q.subject || "",
                topic: q.topic?.name || q.topic || ""
              };
            });
            setActiveEditSet({ ...activeEditSet, questions: mapped });
          }
        })
        .catch(err => console.error("Failed to load questions for set:", err))
        .finally(() => setIsLoadingQuestions(false));
    }
  }, [activeEditSet.id]);


  // Calculate dynamic topics from the database based on the selected subject
  const availableTopics = useMemo(() => {
    if (!dbTopics) return [];
    if (selectedSubject === "all") {
      return Array.from(new Set(dbTopics.map(t => t.name)));
    }
    const subjectObj = dbSubjects?.find(s => s.name === selectedSubject);
    if (!subjectObj) return [];
    
    // Topics have a subject_id field (UUID) that matches the subject's id/uuid
    const filtered = dbTopics.filter(t => t.subject_id === (subjectObj.uuid || subjectObj.id));
    return Array.from(new Set(filtered.map(t => t.name)));
  }, [dbTopics, dbSubjects, selectedSubject]);

  // Filtered pool list (excluding questions already in the set, to make picking cleaner)
  const filteredPool = useMemo(() => {
    return independentQuestions.filter(q => {
      const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            q.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "all" || q.subject === selectedSubject;
      const matchesTopic = selectedTopic === "all" || q.topic === selectedTopic;
      return matchesSearch && matchesSubject && matchesTopic;
    });
  }, [independentQuestions, searchQuery, selectedSubject, selectedTopic]);

  // Metadata Updates
  const handleUpdateEditSetField = (field: keyof QuestionSet, value: any) => {
    setActiveEditSet({
      ...activeEditSet,
      [field]: value
    });
  };

  // Reordering set questions
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const questions = [...activeEditSet.questions];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    // Swap
    const temp = questions[index];
    questions[index] = questions[targetIdx];
    questions[targetIdx] = temp;

    setActiveEditSet({
      ...activeEditSet,
      questions
    });
  };

  // Set Operations: Add Question from Pool
  const handleAddQuestionToSet = (q: Question) => {
    // Check if already in the set
    if (activeEditSet.questions.some(item => item.id === q.id)) {
      triggerNotification("Question is already in this set!");
      return;
    }
    setActiveEditSet({
      ...activeEditSet,
      questions: [...activeEditSet.questions, q]
    });
  };

  // Set Operations: Remove Question connection (does not delete from global pool)
  const handleRemoveQuestionFromSet = (qId: string) => {
    setActiveEditSet({
      ...activeEditSet,
      questions: activeEditSet.questions.filter(q => q.id !== qId)
    });
  };

  // Set Operations: Clear All questions
  const handleClearAllSetQuestions = () => {
    askConfirmation(
      "Clear All Questions from Set",
      "Are you sure you want to remove all questions from this set? This will not delete the questions from the global pool.",
      () => {
        setActiveEditSet({
          ...activeEditSet,
          questions: []
        });
      }
    );
  };

  // File Uploads: Import CSV to pool
  const handleCSVImportToPool = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      try {
        const parsed = extractQuestionsFromCSV(text);
        if (parsed.length === 0) {
          alert("Parsed 0 questions. Please check the CSV format.");
          return;
        }

        setMessage(`⏳ Importing ${parsed.length} questions to database...`);
        let importedCount = 0;
        const newQs: Question[] = [];

        // Simple loop to post each question to DB
        for (const q of parsed) {
          const payload = {
            questionText: q.questionText,
            explanation: q.explanation,
            subjectName: q.subject || "General",
            topicName: q.topic || "General",
            options: q.options.map((opt, idx) => ({
              optionText: opt || `Option ${idx + 1}`,
              isCorrect: idx === q.correctOptionIndex,
              optionIndex: idx
            })),
            sourceReference: ""
          };

          const res = await fetch("/api/question-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.status) {
            importedCount++;
            const dbQ = data.question;
            const correctIndex = dbQ.options.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
            newQs.push({
              id: String(dbQ.id),
              questionText: dbQ.question_text,
              options: dbQ.options.sort((a: any, b: any) => a.option_index - b.option_index).map((o: any) => o.option_text),
              correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
              explanation: dbQ.explanation || "",
              subject: dbQ.subject?.name || "",
              topic: dbQ.topic?.name || ""
            });
          } else {
            throw new Error(data.message || "Backend API rejected the import.");
          }
        }

        onSaveIndependentQuestions([...independentQuestions, ...newQs]);
        setMessage("");
        triggerNotification(`✅ Successfully imported ${importedCount} out of ${parsed.length} questions to the global pool!`);
      } catch (err: any) {
        setMessage("");
        alert(`Failed to import questions: ${err.message || "Error parsing CSV file or saving to database."}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // File Uploads: Import CSV directly to set (both to pool and set)
  const handleCSVImportToSet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      try {
        const parsed = extractQuestionsFromCSV(text);
        if (parsed.length === 0) {
          alert("Parsed 0 questions. Please check the CSV format.");
          return;
        }

        // Map parsed frontend format to Laravel API expected format
        const payload = {
          questions: parsed.map(q => ({
            questionText: q.questionText,
            explanation: q.explanation,
            subjectName: q.subject || "General",
            topicName: q.topic || "General",
            options: q.options.map((opt, idx) => ({
              optionText: opt || `Option ${idx + 1}`,
              isCorrect: idx === q.correctOptionIndex,
              optionIndex: idx
            })),
            sourceReference: ""
          }))
        };

        setMessage("⏳ Importing questions and syncing with the database...");

        const response = await fetch(`/api/question-sets/${activeEditSet.id}/import`, {
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
              subject: dbQ.subject ? dbQ.subject.name : "",
              topic: dbQ.topic ? dbQ.topic.name : ""
            };
          });

          // 1. Add to pool if not exists
          const existingIds = new Set(independentQuestions.map(q => q.id));
          const uniqueNewQuestions = importedQuestions.filter((q: any) => !existingIds.has(q.id));
          onSaveIndependentQuestions([...independentQuestions, ...uniqueNewQuestions]);

          // 2. Add all to the current set
          const currentSetIds = new Set(activeEditSet.questions.map(q => q.id));
          const toAddToSet = importedQuestions.filter((q: any) => !currentSetIds.has(q.id));

          setActiveEditSet({
            ...activeEditSet,
            questions: [...activeEditSet.questions, ...toAddToSet]
          });

          setMessage("");
          triggerNotification(`🎉 Successfully imported ${importedQuestions.length} questions to the database!`);
        } else {
          setMessage("");
          const errorMsg = responseData.message || "Failed to import questions.";
          const details = responseData.errors ? "\n\nDetails:\n" + responseData.errors.join("\n") : "";
          alert(`${errorMsg}${details}`);
        }
      } catch (err) {
        setMessage("");
        alert("Error parsing CSV or connecting to the backend.");
        console.error("CSV Import Error:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Inline forms: Handle Save/Create Question in Pool
  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.questionText.trim()) return;

    // Resolve subject and topic IDs based on names
    const subjectName = questionForm.subject || "Physics";
    const topicName = questionForm.topic || "General";

    const payload = {
      questionText: questionForm.questionText,
      explanation: questionForm.explanation,
      subjectName,
      topicName,
      options: questionForm.options.map((opt, idx) => ({
        optionText: opt || `Option ${idx + 1}`,
        isCorrect: idx === questionForm.correctOptionIndex,
        optionIndex: idx
      })),
      sourceReference: ""
    };

    try {
      setMessage(`⏳ ${isEditingQuestion ? "Updating" : "Creating"} question...`);
      let res: Response;
      
      // If we are editing and it has a numeric ID (DB ID)
      if (isEditingQuestion && !String(questionForm.id).startsWith("q-pool-") && !String(questionForm.id).startsWith("parsed-")) {
        res = await fetch(`/api/questions/${questionForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Creating a new question
        res = await fetch("/api/question-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      
      if (res.ok && data.status) {
        const dbQ = data.question;
        const correctIndex = dbQ.options.findIndex((o: any) => o.is_correct || o.is_correct === 1 || o.is_correct === true);
        const finalQuestion: Question = {
          id: String(dbQ.id),
          questionText: dbQ.question_text,
          options: dbQ.options.sort((a: any, b: any) => a.option_index - b.option_index).map((o: any) => o.option_text),
          correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
          explanation: dbQ.explanation || "",
          subject: dbQ.subject?.name || "",
          topic: dbQ.topic?.name || ""
        };

        if (isEditingQuestion) {
          // Save changes globally in pool
          const updatedPool = independentQuestions.map(q => q.id === (questionForm.id || finalQuestion.id) ? finalQuestion : q);
          onSaveIndependentQuestions(updatedPool);

          // Also update inside the active edit set if it's currently selected
          const updatedSetQs = activeEditSet.questions.map(q => q.id === (questionForm.id || finalQuestion.id) ? finalQuestion : q);
          setActiveEditSet({
            ...activeEditSet,
            questions: updatedSetQs
          });

          triggerNotification("Question updated in database!");
        } else {
          // Add brand new question to pool
          onSaveIndependentQuestions([...independentQuestions, finalQuestion]);

          // Automatically add it to the active set too
          setActiveEditSet({
            ...activeEditSet,
            questions: [...activeEditSet.questions, finalQuestion]
          });

          triggerNotification("New question created in database and added to set!");
        }

        setMessage("");
        // Reset Form
        setIsEditingQuestion(null);
        setIsCreatingQuestion(false);
      } else {
        alert(data.message || "Failed to save question");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving question to database");
      setMessage("");
    }
  };

  // Edit Button Click Action
  const handleOpenEditQuestion = (q: Question) => {
    setIsEditingQuestion(q);
    setQuestionForm({
      id: q.id,
      questionText: q.questionText,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      subject: q.subject || "Physics",
      topic: q.topic || "General"
    });
  };

  // Create Button Click Action
  const handleOpenCreateQuestion = () => {
    setIsCreatingQuestion(true);
    setIsEditingQuestion(null);
    setQuestionForm({
      id: `q-pool-${Date.now()}`,
      questionText: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: "",
      subject: selectedSubject !== "all" ? selectedSubject : "Physics",
      topic: selectedTopic !== "all" ? selectedTopic : "General"
    });
  };

  // Save the complete set metadata to database
  const handleSaveActiveEditSet = async () => {
    if (!activeEditSet.title.trim()) {
      alert("Please provide a set title.");
      return;
    }

    // Resolve exam_id from dbExams using examType slug
    const linkedExam = dbExams?.find(
      (e: any) => (e.slug || e.code || String(e.id)) === activeEditSet.examType
    );
    const examId = linkedExam?.id;

    if (!examId) {
      alert(`Could not resolve exam for type "${activeEditSet.examType}". Please ensure exams are configured in the Exams tab.`);
      return;
    }

    const isNewSet = !allSets.some(s => s.id === activeEditSet.id) || activeEditSet.id.startsWith("new-");

    const payload = {
      exam_id: examId,
      title: activeEditSet.title,
      type: activeEditSet.type || "mock-test",
      is_free: activeEditSet.isFree ? 1 : 0,
      price: activeEditSet.price || 0,
      year_or_date: activeEditSet.yearOrDate || "",
      duration_minutes: activeEditSet.durationMinutes || 60,
      correct_marks: activeEditSet.correctMarks ?? 1,
      incorrect_marks: activeEditSet.incorrectMarks ?? 0,
      province: activeEditSet.province || "all",
      question_ids: activeEditSet.questions.map(q => {
        // If the ID is a string like "123", convert to integer. 
        // We only want to send actual DB integer IDs, not frontend-generated 'q-pool-xxx'
        const intId = parseInt(q.id);
        return isNaN(intId) ? null : intId;
      }).filter(id => id !== null)
    };

    try {
      setMessage("⏳ Saving question set to database...");

      let res: Response;
      if (isNewSet) {
        res = await fetch("/api/question-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/question-sets/${activeEditSet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();

      if (res.ok && data.status) {
        const savedSet = data.set || data.questionSet || data.data;
        const savedId = savedSet ? String(savedSet.id) : activeEditSet.id;

        // Update in-memory state
        const savedSetObj: QuestionSet = {
          ...activeEditSet,
          id: savedId
        };

        const updatedSets = isNewSet
          ? [...allSets, savedSetObj]
          : allSets.map(s => s.id === activeEditSet.id ? savedSetObj : s);

        onSaveSets(updatedSets);
        setActiveEditSet(null);
        setMessage(`✅ Question set "${activeEditSet.title}" saved successfully!`);
        triggerNotification("Question set saved to database!");
      } else {
        const errMsg = data.message || "Failed to save question set.";
        alert(errMsg);
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend. Please try again.");
      setMessage("");
    }
  };


  // Count how many sets use a specific question
  const countQuestionSetsUsage = (qId: string) => {
    return allSets.filter(s => s.questions.some(item => item.id === qId)).length;
  };

  return (
    <div className="space-y-6 w-full text-slate-100 font-sans flex flex-col h-auto lg:h-[calc(100vh-140px)] pb-8 lg:pb-0">
      
      {/* Editor Title Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveEditSet(null)}
            className="text-slate-400 hover:text-white p-2 bg-slate-955 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-violet-400 font-bold text-[10px] tracking-wider uppercase block mb-0.5">
              Set Builder Control Room
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-400" />
              {activeEditSet.title || "Untitled Question Set"}
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            {showConfig ? "Hide Settings" : "Configure Set Metadata"}
          </button>
          <button
            onClick={handleSaveActiveEditSet}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Save & Publish Set
          </button>
        </div>
      </div>

      {/* Set Configuration Metadata Panel */}
      {showConfig && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg shrink-0 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ⚙️ Set Parameter Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Set Title</label>
              <input
                type="text"
                value={activeEditSet.title}
                onChange={(e) => handleUpdateEditSetField("title", e.target.value)}
                placeholder="e.g. MEC-UG Anatomy Drill"
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Board Exam</label>
              <select
                value={activeEditSet.examType}
                onChange={(e) => handleUpdateEditSetField("examType", e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer font-sans"
              >
                {dbExams && dbExams.length > 0 ? (
                  dbExams.map(exam => (
                    <option key={exam.id || exam.slug} value={exam.slug || exam.id}>{exam.name}</option>
                  ))
                ) : (
                  <>
                    <option value="mec-ug">MEC-UG (Undergraduate)</option>
                    <option value="mec-pg">MEC-PG (Postgraduate)</option>
                    <option value="nmcle">NMCLE (Licensing Board)</option>
                    <option value="ku-mcq">KU MCQ (Entrance)</option>
                    <option value="loksewa">Loksewa (Medical Officer)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Type</label>
              <select
                value={activeEditSet.type}
                onChange={(e) => handleUpdateEditSetField("type", e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer font-sans"
              >
                <option value="mock-test">Mock Test Arena</option>
                <option value="past-year">Past Board Paper</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timer (minutes)</label>
              <input
                type="number"
                value={activeEditSet.durationMinutes}
                onChange={(e) => handleUpdateEditSetField("durationMinutes", parseInt(e.target.value) || 5)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (NPR)</label>
              <input
                type="number"
                disabled={activeEditSet.isFree}
                value={activeEditSet.price}
                onChange={(e) => handleUpdateEditSetField("price", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-30"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Correct Mark (+)</label>
              <input
                type="number"
                step="0.1"
                value={activeEditSet.correctMarks ?? 1}
                onChange={(e) => handleUpdateEditSetField("correctMarks", parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1">Incorrect Penalty (-)</label>
              <input
                type="number"
                step="0.05"
                value={activeEditSet.incorrectMarks ?? 0}
                onChange={(e) => handleUpdateEditSetField("incorrectMarks", parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
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
                Mark as Free Access
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Two-Panel Set Builder Section */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden min-h-0">
        
        {/* Left Column: Global Question Pool */}
        <div className="w-full lg:w-1/2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-[400px] lg:min-h-0 shadow-lg shrink-0 lg:shrink">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">🗂️ Global Question Pool</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Select and add standalone questions to this set</p>
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt"
                id="pool-csv-uploader"
                onChange={handleCSVImportToPool}
                className="hidden"
              />
              <label
                htmlFor="pool-csv-uploader"
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
                title="Bulk import questions to the pool without linking them to this set yet."
              >
                <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
                <span>Import CSV to Pool</span>
              </label>

              <button
                type="button"
                onClick={handleOpenCreateQuestion}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Question</span>
              </button>
            </div>
          </div>

          {/* Filters & Search Row */}
          <div className="grid grid-cols-3 gap-2 py-3 shrink-0 border-b border-slate-800/40">
            <div className="relative col-span-1">
              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-violet-500"
              />
            </div>
            
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic("all");
                }}
                className="w-full bg-slate-955 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 focus:outline-none cursor-pointer font-sans"
              >
                <option value="all">📚 All Subjects</option>
                {dbSubjects && dbSubjects.length > 0 ? (
                  dbSubjects.map(sub => (
                    <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                  ))
                ) : (
                  <option value="" disabled>No subjects in database</option>
                )}
              </select>
            </div>

            <div>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 focus:outline-none cursor-pointer font-sans"
              >
                <option value="all">🏷️ All Topics</option>
                {availableTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Questions list */}
          <div className="flex-1 overflow-y-auto pt-4 space-y-3 min-h-0 pr-1">
            {filteredPool.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                No matching questions found in pool.
              </div>
            ) : (
              filteredPool.map(q => {
                const alreadyInSet = activeEditSet.questions.some(item => item.id === q.id);
                const usageCount = countQuestionSetsUsage(q.id);

                return (
                  <div 
                    key={q.id} 
                    className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 ${
                      alreadyInSet 
                        ? "bg-slate-950/20 border-slate-800/80 opacity-60" 
                        : "bg-slate-955 border-slate-850/60 hover:border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/50 pb-1.5 mb-2">
                        <span className="font-bold text-violet-400 font-mono tracking-wide">{q.id}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                            {q.subject} &gt; {q.topic || "General"}
                          </span>
                          <span className="text-[9px] bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded font-extrabold" title="Cross-set membership count">
                            Used in {usageCount} Sets
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans">{q.questionText}</p>
                      
                      {/* Choices Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-slate-400 text-[10px]">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-1">
                            <span className={`font-black ${optIdx === q.correctOptionIndex ? "text-emerald-400" : "text-slate-500"}`}>
                              {String.fromCharCode(65 + optIdx)})
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-800/50 pt-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditQuestion(q)}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-350 px-2.5 py-1 rounded border border-slate-700 font-semibold text-[10px] cursor-pointer transition-colors"
                      >
                        Edit Globally
                      </button>
                      
                      {alreadyInSet ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionFromSet(q.id)}
                          className="bg-red-650 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-[10px] cursor-pointer transition-colors"
                        >
                          Remove from Set
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddQuestionToSet(q)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-bold text-[10px] cursor-pointer transition-colors shadow"
                        >
                          Add to Set →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Questions in Current Set */}
        <div className="w-full lg:w-1/2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-[400px] lg:min-h-0 shadow-lg shrink-0 lg:shrink">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">📋 Questions in this Set</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Active Sequence: <strong className="text-white text-xs">{activeEditSet.questions.length}</strong> Questions</p>
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt"
                id="set-csv-uploader"
                onChange={handleCSVImportToSet}
                className="hidden"
              />
              <label
                htmlFor="set-csv-uploader"
                className="bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
                title="Bulk upload questions and link them directly to this set"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import CSV to Set</span>
              </label>

              {activeEditSet.questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSetQuestions}
                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/25 font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-all shrink-0"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Scrollable ordered set list */}
          <div className="flex-1 overflow-y-auto pt-4 space-y-2.5 min-h-0 pr-1">
            {isLoadingQuestions ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">Loading questions from database...</p>
                <p className="text-[10px] text-slate-500 mt-1">Fetching questions for this set</p>
              </div>
            ) : activeEditSet.questions.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 my-auto">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Set is empty.</p>
                <p className="text-[10px] text-slate-500 mt-1">Add items from the Global Pool on the left or upload a CSV file.</p>
              </div>
            ) : (
              activeEditSet.questions.map((q, index) => {
                return (
                  <div 
                    key={q.id} 
                    className="p-3 bg-slate-955 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Sort Order Index */}
                      <span className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-violet-400 font-mono shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate leading-tight font-sans">{q.questionText}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500 font-mono">
                          <span className="font-bold uppercase text-slate-400">{q.id}</span>
                          <span>•</span>
                          <span className="uppercase text-violet-400">{q.subject}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sorting & actions column */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, "down")}
                        disabled={index === activeEditSet.questions.length - 1}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionFromSet(q.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded-lg cursor-pointer transition-colors border border-rose-500/5"
                        title="Remove Connection from Set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Global Question Creator / Editor Modal Popup Overlay */}
      {(isCreatingQuestion || isEditingQuestion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <form 
            onSubmit={handleSaveQuestionForm} 
            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 font-sans max-h-[90vh] overflow-y-auto m-2 sm:m-0"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isEditingQuestion ? `✏️ Edit Question (${questionForm.id})` : "➕ Create Question in Pool"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditingQuestion(null);
                  setIsCreatingQuestion(false);
                }}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Stem</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  placeholder="Type MCQ question text..."
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-violet-500 resize-none h-20"
                  required
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questionForm.options.map((opt, optIdx) => (
                  <div key={optIdx} className="space-y-1">
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
                      placeholder={`Enter option ${String.fromCharCode(65 + optIdx)}`}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Option Index & Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Choice</label>
                  <select
                    value={questionForm.correctOptionIndex}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctOptionIndex: parseInt(e.target.value) })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none cursor-pointer font-sans"
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Explanation</label>
                  <RichTextEditor
                    value={questionForm.explanation || ""}
                    onChange={(val) => setQuestionForm({ ...questionForm, explanation: val })}
                    placeholder="Enter detailed clinical rationale..."
                  />
                </div>
              </div>

              {/* Subject & Topic Tagging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject Tag</label>
                  <select
                    value={questionForm.subject}
                    onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2.5 text-white focus:outline-none cursor-pointer font-sans"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {dbSubjects && dbSubjects.length > 0 ? (
                      dbSubjects.map(sub => (
                        <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No subjects in database</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Topic Tag</label>
                  <select
                    value={questionForm.topic}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none"
                  >
                    <option value="">-- Choose Topic --</option>
                    {(() => {
                      const subjectObj = dbSubjects?.find(s => s.name === questionForm.subject);
                      if (!subjectObj || !dbTopics) return <option value="" disabled>Select a subject first</option>;
                      const filteredTopics = dbTopics.filter(t => t.subject_id === (subjectObj.uuid || subjectObj.id));
                      return Array.from(new Set(filteredTopics.map(t => t.name))).map(topicName => (
                        <option key={topicName} value={topicName as string}>{topicName as string}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEditingQuestion(null);
                  setIsCreatingQuestion(false);
                }}
                className="bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                {isEditingQuestion ? "Apply Globally" : "Add to Pool & Set"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
