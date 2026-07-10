/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  Dumbbell, 
  Clock, 
  Sliders, 
  Play, 
  Check, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Info,
  Search,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  FolderOpen,
  Upload,
  Share
} from "lucide-react";
import { QuestionSet, Question, CMSContent } from "../types";
import { 
  SUBJECTS_CLASSIFICATION, 
  normalizeSubjectName, 
  MEC_UG_CLASSIFICATION,
  UGSubjectCategory,
  UGTopic,
  ALL_STANDARD_SUBJECTS,
  MEC_UG_SUBJECT_WEIGHTS,
  MEC_UG_TOPIC_WEIGHTS,
  MEC_PG_SUBJECT_WEIGHTS,
  SubjectItem
} from "../subjectsData";
import RichTextEditor from "./RichTextEditor";

interface PracticeViewProps {
  allSets: QuestionSet[];
  targetExam: string;
  independentQuestions: Question[];
  onStartCustomSession: (customSet: QuestionSet, mode: "timed" | "tutor") => void;
  userDraftQuestions: Question[];
  setUserDraftQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onSaveSets?: (sets: QuestionSet[]) => void;
  cmsContent: CMSContent;
}

export default function PracticeView({ 
  allSets, 
  targetExam, 
  independentQuestions, 
  onStartCustomSession,
  userDraftQuestions,
  setUserDraftQuestions,
  onSaveSets,
  cmsContent
}: PracticeViewProps) {
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/subjects")
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.subjects)) {
          setDbSubjects(data.subjects);
        }
      })
      .catch(err => console.error("Failed to fetch subjects in PracticeView:", err));
  }, []);

  // Dynamically load UG subjects from CMS content, or fallback to static defaults
  const MEC_UG_CLASSIFICATION_DYNAMIC = useMemo(() => {
    const matchingDbSubjects = dbSubjects.filter(sub => sub.exam_id === targetExam);
    if (matchingDbSubjects.length > 0) {
      return matchingDbSubjects.map(sub => ({
        subject: sub.name,
        icon: sub.icon || "book-open",
        weight: sub.weight || 0,
        topics: []
      }));
    }

    const raw = cmsContent.mecUgClassification || MEC_UG_CLASSIFICATION;
    let filtered = raw.filter(sub => sub.targetExam === targetExam);
    if (filtered.length === 0) {
      filtered = raw.filter(sub => !sub.targetExam || sub.targetExam === "mec-ug");
    }
    return filtered
      .filter(sub => sub.enabled !== false)
      .map(sub => ({
        ...sub,
        topics: (sub.topics || []).filter(topic => topic.enabled !== false)
      }));
  }, [cmsContent, targetExam, dbSubjects]);

  // Dynamically load PG subjects from CMS content, or fallback to static defaults
  const SUBJECTS_CLASSIFICATION_DYNAMIC = useMemo(() => {
    const matchingDbSubjects = dbSubjects.filter(sub => sub.exam_id === targetExam);
    if (matchingDbSubjects.length > 0) {
      const grouped = { preclinical: [] as SubjectItem[], clinical: [] as SubjectItem[], short: [] as SubjectItem[] };
      matchingDbSubjects.forEach(sub => {
        const category = (sub.category || "preclinical") as "preclinical" | "clinical" | "short";
        if (grouped[category]) {
          grouped[category].push({ name: sub.name, icon: sub.icon || "book-open" });
        }
      });
      return grouped;
    }

    if (cmsContent.mecPgClassification && cmsContent.mecPgClassification.length > 0) {
      const grouped = { preclinical: [] as SubjectItem[], clinical: [] as SubjectItem[], short: [] as SubjectItem[] };
      let filtered = cmsContent.mecPgClassification.filter(item => item.targetExam === targetExam);
      if (filtered.length === 0) {
        filtered = cmsContent.mecPgClassification.filter(item => !item.targetExam || item.targetExam === "all" || item.targetExam === "mec-pg");
      }
      filtered.forEach(item => {
        const isEnabled = item.enabled !== false;
        if (isEnabled && grouped[item.category]) {
          grouped[item.category].push({ name: item.subject, icon: item.icon });
        }
      });
      return grouped;
    }
    return SUBJECTS_CLASSIFICATION;
  }, [cmsContent, targetExam, dbSubjects]);

  // Dynamically calculate UG subject weights
  const MEC_UG_SUBJECT_WEIGHTS_DYNAMIC = useMemo(() => {
    const weights: Record<string, number> = {};
    MEC_UG_CLASSIFICATION_DYNAMIC.forEach(cat => {
      weights[cat.subject] = cat.weight;
    });
    return weights;
  }, [MEC_UG_CLASSIFICATION_DYNAMIC]);

  // Dynamically calculate UG topic weights
  const MEC_UG_TOPIC_WEIGHTS_DYNAMIC = useMemo(() => {
    const weights: Record<string, number> = {};
    MEC_UG_CLASSIFICATION_DYNAMIC.forEach(cat => {
      cat.topics.forEach(top => {
        weights[top.name] = top.weight;
      });
    });
    return weights;
  }, [MEC_UG_CLASSIFICATION_DYNAMIC]);

  // Dynamically calculate PG subject weights
  const MEC_PG_SUBJECT_WEIGHTS_DYNAMIC = useMemo(() => {
    if (cmsContent.mecPgClassification && cmsContent.mecPgClassification.length > 0) {
      const weights: Record<string, number> = {};
      let filtered = cmsContent.mecPgClassification.filter(item => item.targetExam === targetExam);
      if (filtered.length === 0) {
        filtered = cmsContent.mecPgClassification.filter(item => !item.targetExam || item.targetExam === "all" || item.targetExam === "mec-pg");
      }
      filtered.forEach(item => {
        const isEnabled = item.enabled !== false;
        if (isEnabled) {
          weights[item.subject] = item.weight;
        }
      });
      return weights;
    }
    return MEC_PG_SUBJECT_WEIGHTS;
  }, [cmsContent, targetExam]);

  // Toggle between Practice Engine, Student Creator Hub, and Question Search
  const [activeTab, setActiveTab] = useState<"practice" | "creator" | "search">("practice");
  
  // High level exam format style: detects if target exam style is "mec-ug" or "mec-pg"
  const currentExamStyle = useMemo(() => {
    const found = cmsContent.targetExams?.find((e: any) => e.id === targetExam);
    if (found?.style) return found.style;
    if (targetExam === "mec-ug" || targetExam?.includes("ug") || targetExam?.toLowerCase().includes("undergrad")) {
      return "mec-ug";
    }
    return "mec-pg";
  }, [cmsContent.targetExams, targetExam]);

  const [examStyle, setExamStyle] = useState<"mec-ug" | "mec-pg">(currentExamStyle);

  // Sync exam style and default selections when targetExam changes
  React.useEffect(() => {
    setExamStyle(currentExamStyle);
    if (currentExamStyle === "mec-ug") {
      setDraftSubject("Physics");
    } else {
      setDraftSubject("Anatomy");
    }
  }, [targetExam, currentExamStyle]);

  // standard medical tabs (for non-ug style)
  const [preclinicalTab, setPreclinicalTab] = useState<"preclinical" | "clinical" | "short">("preclinical");
  
  // active subject tab in MEC-UG mode: Physics, Chemistry, Botany, Zoology, MAT
  const [ugSubjectTab, setUgSubjectTab] = useState<string>("Physics");
  
  // Selected category/topic states
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    targetExam === "mec-ug" ? "Physics" : null
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Custom configuration states
  const [customCount, setCustomCount] = useState<number>(10);
  const [customMode, setCustomMode] = useState<"timed" | "tutor">("timed");

  // Question Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Question | null>(null);
  const [searchFeedback, setSearchFeedback] = useState("");

  // Student Draft Form States
  const [draftText, setDraftText] = useState("");
  const [draftOptions, setDraftOptions] = useState(["", "", "", ""]);
  const [draftCorrectIdx, setDraftCorrectIdx] = useState(0);
  const [draftExplanation, setDraftExplanation] = useState("");
  const [draftSubject, setDraftSubject] = useState(targetExam === "mec-ug" ? "Physics" : "Anatomy");
  const [draftTopic, setDraftTopic] = useState("Mechanics");
  const [formSuccessMessage, setFormSuccessMessage] = useState("");

  // Creator Hub Sub-tabs / Modes
  const [creatorMode, setCreatorMode] = useState<"interactive" | "bulk" | "custom-set">("interactive");
  const [bulkFileError, setBulkFileError] = useState("");
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState<Question[]>([]);
  const [bulkSubject, setBulkSubject] = useState(targetExam === "mec-ug" ? "Physics" : "Anatomy");
  const [bulkTopic, setBulkTopic] = useState("Mechanics");

  // Custom Set builder state variables
  const [customSetName, setCustomSetName] = useState("My Custom Exam Set");
  const [customSetDuration, setCustomSetDuration] = useState("60");
  const [customSetExamType, setCustomSetExamType] = useState(targetExam);
  const [customSetQuestions, setCustomSetQuestions] = useState<Question[]>([]);
  const [customSetPasteText, setCustomSetPasteText] = useState("");
  const [customSetShowPaste, setCustomSetShowPaste] = useState(false);
  const [customSetManualText, setCustomSetManualText] = useState("");
  const [customSetManualOptions, setCustomSetManualOptions] = useState(["", "", "", ""]);
  const [customSetManualCorrect, setCustomSetManualCorrect] = useState(0);
  const [customSetManualExplanation, setCustomSetManualExplanation] = useState("");
  const [customSetManualSubject, setCustomSetManualSubject] = useState(targetExam === "mec-ug" ? "Physics" : "Anatomy");
  const [customSetManualTopic, setCustomSetManualTopic] = useState("Mechanics");

  // Reset bulk and draft subjects when targetExam changes
  React.useEffect(() => {
    const isUg = targetExam === "mec-ug";
    setDraftSubject(isUg ? "Physics" : "Anatomy");
    setBulkSubject(isUg ? "Physics" : "Anatomy");
  }, [targetExam]);

  // Dynamically calculate subjects for Creator Hub based on active target exam format
  const creatorSubjects = useMemo(() => {
    if (targetExam === "mec-ug") {
      return MEC_UG_CLASSIFICATION_DYNAMIC.map(cat => cat.subject);
    } else {
      const preclinical = SUBJECTS_CLASSIFICATION_DYNAMIC.preclinical.map(s => s.name);
      const clinical = SUBJECTS_CLASSIFICATION_DYNAMIC.clinical.map(s => s.name);
      const short = SUBJECTS_CLASSIFICATION_DYNAMIC.short.map(s => s.name);
      return [...preclinical, ...clinical, ...short];
    }
  }, [targetExam, MEC_UG_CLASSIFICATION_DYNAMIC, SUBJECTS_CLASSIFICATION_DYNAMIC]);

  // Dynamically calculate topics based on draftSubject
  const dynamicTopics = useMemo(() => {
    const ugSub = MEC_UG_CLASSIFICATION_DYNAMIC.find(cat => cat.subject === draftSubject);
    if (ugSub) {
      return ugSub.topics.map(t => t.name);
    }
    return ["General Core", "Clinical Case Study", "Syllabus Overview", "Pathophysiology", "Diagnostic Integration"];
  }, [draftSubject, MEC_UG_CLASSIFICATION_DYNAMIC]);

  // Dynamically calculate topics based on bulkSubject
  const dynamicBulkTopics = useMemo(() => {
    const ugSub = MEC_UG_CLASSIFICATION_DYNAMIC.find(cat => cat.subject === bulkSubject);
    if (ugSub) {
      return ugSub.topics.map(t => t.name);
    }
    return ["General Core", "Clinical Case Study", "Syllabus Overview", "Pathophysiology", "Diagnostic Integration"];
  }, [bulkSubject, MEC_UG_CLASSIFICATION_DYNAMIC]);

  // Keep topic selection synchronized with active subject
  React.useEffect(() => {
    if (dynamicTopics.length > 0 && !dynamicTopics.includes(draftTopic)) {
      setDraftTopic(dynamicTopics[0]);
    }
  }, [draftSubject, dynamicTopics]);

  React.useEffect(() => {
    if (dynamicBulkTopics.length > 0 && !dynamicBulkTopics.includes(bulkTopic)) {
      setBulkTopic(dynamicBulkTopics[0]);
    }
  }, [bulkSubject, dynamicBulkTopics]);

  // Robust Client-side CSV Parser Helper
  const parseCSV = (text: string): string[][] => {
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
  };

  const handleBulkCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileError("");
    setBulkParsedQuestions([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          setBulkFileError("Uploaded file is empty.");
          return;
        }

        const rows = parseCSV(text);
        if (rows.length === 0) {
          setBulkFileError("No data rows found in the CSV file.");
          return;
        }

        const questions: Question[] = rows.map((row, index) => {
          const questionText = row[0] || `MCQ Item ${index + 1}`;
          const optA = row[1] || "";
          const optB = row[2] || "";
          const optC = row[3] || "";
          const optD = row[4] || "";
          
          const correctStr = (row[5] || "A").trim().toLowerCase();
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

          const explanation = row[6] || "No explanation provided.";

          return {
            id: `BULK-DRAFT-${Date.now().toString().slice(-4)}-${index}`,
            questionText,
            options: [optA, optB, optC, optD],
            correctOptionIndex,
            explanation,
            subject: bulkSubject,
            topic: targetExam === "mec-ug" ? bulkTopic : "General Core",
            referenceYear: new Date().getFullYear().toString()
          };
        });

        setBulkParsedQuestions(questions);
      } catch (err) {
        setBulkFileError("Failed to parse file. Make sure it's a valid CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseCustomSetExcelText = (text: string) => {
    if (!text.trim()) return;
    const lines = text.split(/\r?\n/);
    const added: Question[] = [];
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const cols = line.split("\t");
      if (cols.length < 5) return;
      
      const qText = cols[0] || "";
      const opts = [cols[1] || "", cols[2] || "", cols[3] || "", cols[4] || ""];
      let correctIdx = 0;
      if (cols[5]) {
        const key = cols[5].trim().toUpperCase();
        if (key === "A" || key === "0") correctIdx = 0;
        else if (key === "B" || key === "1") correctIdx = 1;
        else if (key === "C" || key === "2") correctIdx = 2;
        else if (key === "D" || key === "3") correctIdx = 3;
      }
      const expl = cols[6] || "No explanation provided.";
      const sub = cols[7] || (targetExam === "mec-ug" ? "Physics" : "Anatomy");
      const top = cols[8] || "General";

      added.push({
        id: `q-custom-${Date.now()}-${index}`,
        questionText: qText,
        options: opts,
        correctOptionIndex: correctIdx,
        explanation: expl,
        subject: sub,
        topic: top
      });
    });

    if (added.length > 0) {
      setCustomSetQuestions([...customSetQuestions, ...added]);
      setFormSuccessMessage(`🎉 Successfully parsed and added ${added.length} questions from Excel paste!`);
      setTimeout(() => setFormSuccessMessage(""), 5000);
    }
  };

  const handleCustomSetCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      const lines = text.split(/\r?\n/);
      const added: Question[] = [];
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        if (cols.length < 5) return;

        const qText = cols[0] || "";
        const opts = [cols[1] || "", cols[2] || "", cols[3] || "", cols[4] || ""];
        let correctIdx = 0;
        if (cols[5]) {
          const key = cols[5].toUpperCase();
          if (key === "A" || key === "0") correctIdx = 0;
          else if (key === "B" || key === "1") correctIdx = 1;
          else if (key === "C" || key === "2") correctIdx = 2;
          else if (key === "D" || key === "3") correctIdx = 3;
        }
        const expl = cols[6] || "No explanation provided.";
        const sub = cols[7] || (targetExam === "mec-ug" ? "Physics" : "Anatomy");
        const top = cols[8] || "General";

        added.push({
          id: `q-custom-${Date.now()}-${index}`,
          questionText: qText,
          options: opts,
          correctOptionIndex: correctIdx,
          explanation: expl,
          subject: sub,
          topic: top
        });
      });

      if (added.length > 0) {
        setCustomSetQuestions([...customSetQuestions, ...added]);
        setFormSuccessMessage(`🎉 Successfully parsed and added ${added.length} questions from CSV file!`);
        setTimeout(() => setFormSuccessMessage(""), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddManualCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSetManualText.trim()) return;
    if (customSetManualOptions.some(o => !o.trim())) {
      alert("Please fill all 4 options!");
      return;
    }

    const newQ: Question = {
      id: `q-custom-${Date.now()}`,
      questionText: customSetManualText.trim(),
      options: [...customSetManualOptions],
      correctOptionIndex: customSetManualCorrect,
      explanation: customSetManualExplanation.trim() || "No explanation provided.",
      subject: customSetManualSubject,
      topic: customSetManualTopic
    };

    setCustomSetQuestions([...customSetQuestions, newQ]);
    setCustomSetManualText("");
    setCustomSetManualOptions(["", "", "", ""]);
    setCustomSetManualCorrect(0);
    setCustomSetManualExplanation("");

    setFormSuccessMessage("✍️ Added 1 question to your custom set draft list!");
    setTimeout(() => setFormSuccessMessage(""), 4000);
  };

  const handleSaveCustomSet = () => {
    if (customSetQuestions.length === 0) {
      alert("Please add at least 1 question to your custom set!");
      return;
    }

    const finalSet: QuestionSet = {
      id: `set-custom-${Date.now()}`,
      title: customSetName.trim() || "My Custom Set",
      examType: customSetExamType as any,
      type: "mock-test",
      questions: customSetQuestions,
      isFree: true,
      price: 0,
      durationMinutes: Number(customSetDuration) || 60,
      correctMarks: 1,
      incorrectMarks: 0.25
    };

    if (onSaveSets) {
      onSaveSets([...allSets, finalSet]);
    }

    setCustomSetName("My Custom Exam Set");
    setCustomSetDuration("60");
    setCustomSetQuestions([]);
    
    setFormSuccessMessage(`🚀 Successfully created and saved custom set: "${finalSet.title}"! You can now choose it from the Mock Tests list.`);
    setTimeout(() => setFormSuccessMessage(""), 10000);
  };

  const handleFullSetJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.title || !Array.isArray(parsed.questions)) {
          alert("Invalid file format. Make sure it contains 'title' and a 'questions' array.");
          return;
        }
        
        setCustomSetName(parsed.title);
        setCustomSetDuration(parsed.durationMinutes ? String(parsed.durationMinutes) : "60");
        setCustomSetExamType(parsed.examType || "mec-ug");
        
        const processedQs = parsed.questions.map((q: any, index: number) => ({
          id: q.id || `q-custom-${Date.now()}-${index}`,
          questionText: q.questionText || "",
          options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
          correctOptionIndex: typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0,
          explanation: q.explanation || "No explanation provided.",
          subject: q.subject || "Anatomy",
          topic: q.topic || "General"
        }));
        
        setCustomSetQuestions(processedQs);
        setFormSuccessMessage(`🎉 Successfully loaded complete set "${parsed.title}" with ${processedQs.length} questions! Click "Create & Save Custom Set" below to finalize.`);
        setTimeout(() => setFormSuccessMessage(""), 10000);
      } catch (err) {
        alert("Error parsing JSON file. Please ensure it's a valid JSON custom set file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportDraftSet = () => {
    if (customSetQuestions.length === 0) {
      alert("Add some questions or details to your custom set before exporting!");
      return;
    }
    const draftSet = {
      title: customSetName.trim() || "My Custom Set",
      examType: customSetExamType,
      durationMinutes: Number(customSetDuration) || 60,
      questions: customSetQuestions
    };
    
    const jsonStr = JSON.stringify(draftSet, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draftSet.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_custom_set.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitBulkToReview = () => {
    if (bulkParsedQuestions.length === 0) return;
    
    const finalQuestions = bulkParsedQuestions.map(q => ({
      ...q,
      subject: bulkSubject,
      topic: targetExam === "mec-ug" ? bulkTopic : "General Core"
    }));

    setUserDraftQuestions(prev => [...finalQuestions, ...prev]);
    setFormSuccessMessage(`Successfully uploaded and submitted ${finalQuestions.length} MCQs for Editorial Review!`);
    setBulkParsedQuestions([]);
    setTimeout(() => setFormSuccessMessage(""), 8000);
  };

  const practiceBulkQuestions = () => {
    if (bulkParsedQuestions.length === 0) return;

    const finalQuestions = bulkParsedQuestions.map(q => ({
      ...q,
      subject: bulkSubject,
      topic: targetExam === "mec-ug" ? bulkTopic : "General Core"
    }));

    const workoutSet: QuestionSet = {
      id: `bulk-practice-${Date.now()}`,
      title: `Bulk: ${bulkSubject}${targetExam === "mec-ug" ? ` - ${bulkTopic}` : ""}`,
      examType: targetExam === "mec-ug" ? "mec-ug" : "mec-pg",
      type: "mock-test",
      durationMinutes: Math.max(1, Math.round(finalQuestions.length * 1.5)),
      questions: finalQuestions,
      correctMarks: 1,
      incorrectMarks: 0.25,
      isFree: true,
      price: 0
    };

    onStartCustomSession(workoutSet, "tutor");
  };

  // 1. Gather all questions (from official sets AND independent questions pool)
  const allPoolQuestions = useMemo(() => {
    const questions: Question[] = [];
    
    // Add official set questions
    allSets.forEach(set => {
      set.questions.forEach(q => {
        questions.push({
          ...q,
          // Attach default stats if missing
          correctPercentage: q.correctPercentage || undefined
        });
      });
    });

    // Add independent questions
    independentQuestions.forEach(q => {
      questions.push({
        ...q
      });
    });

    return questions;
  }, [allSets, independentQuestions]);

  // 2. Classify questions by Subject & Topic for MEC-UG, and standard for PG
  const classifiedPool = useMemo(() => {
    const subjectMap: { [subject: string]: Question[] } = {};
    const topicMap: { [topic: string]: Question[] } = {};

    allPoolQuestions.forEach(q => {
      const normSub = normalizeSubjectName(q.subject || "");
      if (!subjectMap[normSub]) {
        subjectMap[normSub] = [];
      }
      subjectMap[normSub].push(q);

      if (q.topic) {
        const normTopic = q.topic.trim();
        if (!topicMap[normTopic]) {
          topicMap[normTopic] = [];
        }
        topicMap[normTopic].push(q);
      }
    });

    return { subjectMap, topicMap };
  }, [allPoolQuestions]);

  // Handle Search question by unique ID
  const handleSearchQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchResult(null);
    setSearchFeedback("");

    const cleanQuery = searchQuery.trim().toUpperCase();
    if (!cleanQuery) return;

    const found = allPoolQuestions.find(q => q.id.toUpperCase() === cleanQuery);
    if (found) {
      setSearchResult(found);
    } else {
      setSearchFeedback(`No question found with ID "${cleanQuery}". Try search terms like MECUG-2501 or MECPG-1001.`);
    }
  };

  // Launch a single question search-practice session
  const startSingleQuestionPractice = (q: Question) => {
    const singleSet: QuestionSet = {
      id: `search-practice-${q.id}`,
      title: `Quick Review: ${q.id}`,
      examType: targetExam === "mec-pg" ? "mec-pg" : "mec-ug",
      type: "mock-test",
      durationMinutes: 2,
      questions: [q],
      correctMarks: 1,
      incorrectMarks: 0.25,
      isFree: true,
      price: 0
    };
    onStartCustomSession(singleSet, "tutor");
  };

  // Handle click on subject/topic
  const handleSelectSubject = (subjectName: string) => {
    const available = classifiedPool.subjectMap[subjectName]?.length || 0;
    setSelectedSubject(subjectName);
    setSelectedTopic(null);
    setCustomCount(Math.min(10, available > 0 ? available : 1));
  };

  const handleSelectTopic = (subjectName: string, topicName: string) => {
    const available = classifiedPool.topicMap[topicName]?.length || 0;
    setSelectedSubject(subjectName);
    setSelectedTopic(topicName);
    setCustomCount(Math.min(10, available > 0 ? available : 1));
  };

  // Launch Customized Session
  const handleStartWorkout = () => {
    let pool: Question[] = [];
    let titleStr = "";

    if (selectedTopic) {
      pool = classifiedPool.topicMap[selectedTopic] || [];
      titleStr = `${selectedSubject} - ${selectedTopic} Topic Practice`;
    } else if (selectedSubject) {
      pool = classifiedPool.subjectMap[selectedSubject] || [];
      titleStr = `${selectedSubject} Branch Subject Practice`;
    }

    if (pool.length === 0) {
      alert("There are no questions loaded in this specific category yet. Try adding some questions under this tag in the Admin room!");
      return;
    }

    // Shuffle and slice
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(customCount, pool.length));

    // Calculate duration (1.5 mins per question)
    const calculatedDuration = Math.max(1, Math.round(selectedQuestions.length * 1.5));

    const workoutSet: QuestionSet = {
      id: `practice-workout-${Date.now()}`,
      title: titleStr,
      examType: examStyle === "mec-ug" ? "mec-ug" : "mec-pg",
      type: "mock-test",
      durationMinutes: calculatedDuration,
      questions: selectedQuestions,
      correctMarks: 1,
      incorrectMarks: 0.25,
      isFree: true,
      price: 0
    };

    onStartCustomSession(workoutSet, customMode);
  };

  // Handle draft question submission
  const handleAddUserDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) {
      alert("Please provide the question body text!");
      return;
    }
    if (draftOptions.some(opt => !opt.trim())) {
      alert("Please fill out all 4 option textboxes!");
      return;
    }

    const newDraft: Question = {
      id: `USER-DRAFT-${Date.now().toString().slice(-4)}`,
      questionText: draftText,
      options: [...draftOptions],
      correctOptionIndex: draftCorrectIdx,
      explanation: draftExplanation || "No custom explanation provided.",
      subject: draftSubject,
      topic: targetExam === "mec-ug" ? draftTopic : "General Core",
      referenceYear: new Date().getFullYear().toString()
    };

    setUserDraftQuestions(prev => [newDraft, ...prev]);

    // Reset Form
    setDraftText("");
    setDraftOptions(["", "", "", ""]);
    setDraftCorrectIdx(0);
    setDraftExplanation("");
    setFormSuccessMessage("Your MCQ question was sent successfully to the Editorial Review Board! Admin panels can now review, format, approve, and upload it.");
    
    setTimeout(() => {
      setFormSuccessMessage("");
    }, 8000);
  };

  const selectedPoolSize = useMemo(() => {
    if (selectedTopic) {
      return classifiedPool.topicMap[selectedTopic]?.length || 0;
    }
    if (selectedSubject) {
      return classifiedPool.subjectMap[selectedSubject]?.length || 0;
    }
    return 0;
  }, [selectedSubject, selectedTopic, classifiedPool]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6" id="subject-wise-practice-container">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-violet-400" /> Dynamic Question engine
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Subject Wise Practice</h1>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Practice specific chapters and branches. Filter by classification, search by serial ID, or write and submit your own customized clinical boards items!
          </p>
        </div>

        {/* Total stats counters */}
        <div className="relative z-10 flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 shrink-0">
          <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Indexed Pool</span>
            <span className="text-base font-black text-white font-mono block">
              {allPoolQuestions.length} MCQ Items
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-1 select-none">
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "practice"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🏋️ Practice Subjects
        </button>
        <button
          onClick={() => setActiveTab("creator")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "creator"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ✍️ Student Creator Hub
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "search"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🔍 Search Question by ID
        </button>
      </div>

      {activeTab === "practice" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            {/* View Selector toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 justify-between items-center px-3 py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Practice Syllabus
              </span>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {targetExam === "mec-ug" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExamStyle("mec-ug");
                      setSelectedSubject(ugSubjectTab);
                      setSelectedTopic(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer bg-violet-600 text-white shadow"
                  >
                    MEC-UG (Integrated)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setExamStyle("mec-pg");
                      setSelectedSubject(null);
                      setSelectedTopic(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer bg-violet-600 text-white shadow"
                  >
                    {targetExam.toUpperCase()} / Clinician Syllabus
                  </button>
                )}
              </div>
            </div>

            {examStyle === "mec-ug" ? (
              /* MEC-UG specific practice list: Physics, Chemistry, Botany, Zoology, MAT using subject tabs */
              <div className="space-y-4" id="mec-ug-syllabus-view">
                {/* Subject Tabs in place of PG preclinical/clinical/short */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap sm:flex-nowrap gap-1">
                  {MEC_UG_CLASSIFICATION_DYNAMIC.map(cat => {
                    const weight = MEC_UG_SUBJECT_WEIGHTS_DYNAMIC[cat.subject] || 0;
                    return (
                      <button
                        key={cat.subject}
                        onClick={() => {
                          setUgSubjectTab(cat.subject);
                          setSelectedSubject(cat.subject);
                          setSelectedTopic(null);
                        }}
                        className={`flex-1 py-1.5 px-2 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 min-w-[70px] ${
                          ugSubjectTab === cat.subject
                            ? "bg-violet-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{cat.subject}</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-950/40 font-mono text-violet-300">
                          {weight}M
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Subject Overview & Topics Below */}
                {(() => {
                  const currentCat = MEC_UG_CLASSIFICATION_DYNAMIC.find(cat => cat.subject === ugSubjectTab) || MEC_UG_CLASSIFICATION_DYNAMIC[0];
                  if (!currentCat) return null;
                  const subjCount = classifiedPool.subjectMap[currentCat.subject]?.length || 0;
                  const isSubjectOnlySelected = selectedSubject === currentCat.subject && !selectedTopic;
                  const subjectWeight = MEC_UG_SUBJECT_WEIGHTS_DYNAMIC[currentCat.subject] || 0;

                  return (
                    <div className="space-y-4">
                      {/* Active Subject Folder Status */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] text-violet-400 font-extrabold tracking-wider uppercase block">MEC-UG Active Subject</span>
                          <h3 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                            <span>{currentCat.icon}</span>
                            <span>{currentCat.subject} Pool</span>
                            <span className="text-[9px] bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30 font-extrabold font-mono ml-1.5">
                              {subjectWeight} Marks Weightage
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {subjCount} standard and premium MCQs indexed for self-assessment.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSubject(currentCat.subject);
                            setSelectedTopic(null);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isSubjectOnlySelected
                              ? "bg-violet-600 text-white shadow ring-1 ring-violet-500"
                              : "bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800"
                          }`}
                        >
                          🎯 Practice Entire Subject
                        </button>
                      </div>

                      {/* Topics below */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentCat.topics.map((top: UGTopic) => {
                          const topicCount = classifiedPool.topicMap[top.name]?.length || 0;
                          const isTopicSelected = selectedTopic === top.name;
                          const topicWeight = MEC_UG_TOPIC_WEIGHTS_DYNAMIC[top.name] || 0;

                          return (
                            <button
                              key={top.name}
                              onClick={() => handleSelectTopic(currentCat.subject, top.name)}
                              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                                isTopicSelected
                                  ? "bg-violet-600/10 border-violet-500 text-white ring-1 ring-violet-500"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl filter drop-shadow group-hover:scale-110 transition-transform">
                                  {top.icon}
                                </span>
                                <div>
                                  <span className="text-xs font-bold leading-snug text-white group-hover:text-violet-300 transition-colors block">
                                    {top.name}
                                  </span>
                                  <span className="text-[9px] text-violet-400/80 font-bold block mt-0.5">
                                    Weightage: {topicWeight} Marks
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-850 text-slate-300 font-mono">
                                {topicCount} MCQs
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Standard MEC-PG / clinical list */
              <div className="space-y-4">
                {/* Preclinical/Clinical/Short tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(["preclinical", "clinical", "short"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setPreclinicalTab(tab)}
                      className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        preclinicalTab === tab
                          ? "bg-violet-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Grid of subjects */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(SUBJECTS_CLASSIFICATION_DYNAMIC[preclinicalTab] || []).map((subject: SubjectItem) => {
                    const count = classifiedPool.subjectMap[subject.name]?.length || 0;
                    const isSelected = selectedSubject === subject.name;
                    const pgWeight = MEC_PG_SUBJECT_WEIGHTS_DYNAMIC[subject.name] || 0;

                    return (
                      <button
                        key={subject.name}
                        onClick={() => handleSelectSubject(subject.name)}
                        className={`relative p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between h-28 group ${
                          isSelected
                            ? "bg-violet-500/15 border-violet-500 text-white ring-1 ring-violet-500"
                            : "bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                            {subject.icon}
                          </span>
                          <div className="flex flex-col items-end gap-1 font-mono">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-300">
                              {count} MCQs
                            </span>
                            <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                              {pgWeight} Marks
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-xs leading-snug group-hover:text-white">
                            {subject.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                            <span>Syllabus Workout</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Config Panel */}
          <div className="lg:col-span-1">
            {selectedSubject ? (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5 relative overflow-hidden" id="practice-config-panel">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-1.5 border-b border-slate-800 pb-4">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Target Configuration</span>
                  <h2 className="text-base font-extrabold text-white leading-tight">
                    {selectedTopic ? `${selectedTopic}` : `${selectedSubject}`}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    {selectedTopic ? `${selectedSubject} Branch` : "Whole Subject Pool"}
                  </span>
                </div>

                {/* Count Selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 20, Math.min(50, selectedPoolSize)].filter((v, i, self) => self.indexOf(v) === i && v <= selectedPoolSize).map((count) => (
                      <button
                        key={count}
                        onClick={() => setCustomCount(count)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          customCount === count
                            ? "bg-violet-600 text-white"
                            : "bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom input slider */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Range: 1</span>
                      <span>Selected: {customCount} MCQ</span>
                      <span>Max Available: {selectedPoolSize}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={selectedPoolSize > 0 ? selectedPoolSize : 1}
                      value={customCount}
                      onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                      className="w-full accent-violet-500 mt-1 cursor-pointer h-1.5 bg-transparent rounded-lg appearance-none"
                    />
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Practice Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCustomMode("tutor")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        customMode === "tutor"
                          ? "bg-amber-500/10 border-amber-500 text-amber-400"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mb-2 text-amber-500 shrink-0" />
                      <span className="font-bold text-xs block">Tutor Mode</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-normal">
                        Immediate explanation feedback after each question.
                      </span>
                    </button>

                    <button
                      onClick={() => setCustomMode("timed")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        customMode === "timed"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-2 text-emerald-500 shrink-0" />
                      <span className="font-bold text-xs block">Timed Mode</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-normal">
                        Simulate rigorous board conditions under strict clock limit.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Start Action */}
                <button
                  onClick={handleStartWorkout}
                  disabled={selectedPoolSize === 0}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-45 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-violet-600/15 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Play className="w-3.5 h-3.5 fill-white group-hover:translate-x-0.5 transition-transform" /> 
                  {selectedPoolSize === 0 ? "No questions available" : "Start Practice Session"}
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4" id="practice-empty-config">
                <div className="bg-slate-950 w-12 h-12 rounded-xl border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Sliders className="w-5 h-5 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-xs">Configure Workout</h3>
                  <p className="text-[11px] text-slate-400 leading-normal text-center">
                    Tap on any subject branch or topic on the left to configure custom size and start practice.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Creator Hub tab */}
      {activeTab === "creator" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🚀 Student Editorial Board - Question Builder Portal
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Design your own premium mock exam questions using the Google Docs-style rich text formatting editor! Your submission is saved to the review queue, where administrators can proofread, format-check, and officially merge into the question pool chronologically.
            </p>
          </div>

          {formSuccessMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">Submission Confirmed!</p>
                <p className="leading-relaxed mt-0.5">{formSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Sub-tab Navigation */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 justify-between items-center px-3 py-1.5 mb-2 select-none flex-wrap gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Drafting Workspace Mode
            </span>
            <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setCreatorMode("interactive")}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  creatorMode === "interactive"
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ✍️ Write Interactively
              </button>
              <button
                type="button"
                onClick={() => setCreatorMode("bulk")}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  creatorMode === "bulk"
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📥 Bulk CSV Upload
              </button>
              <button
                type="button"
                onClick={() => setCreatorMode("custom-set")}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                  creatorMode === "custom-set"
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🛠️ Build Custom Set
              </button>
            </div>
          </div>

          {creatorMode === "interactive" && (
            <form onSubmit={handleAddUserDraft} className="space-y-5">
              <div className={`grid grid-cols-1 ${targetExam === "mec-ug" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Syllabus Subject Tag
                  </label>
                  <select
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {creatorSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {targetExam === "mec-ug" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Topic Tag (MEC-UG chapter)
                    </label>
                    <select
                      value={draftTopic}
                      onChange={(e) => setDraftTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      {dynamicTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Question Rich editor */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Question Text (Supports Rich Table, Diagram, and Process Flowcharts)
                </label>
                <RichTextEditor 
                  value={draftText} 
                  onChange={setDraftText} 
                  placeholder="Compose your high-yield board question. Use B, I, U, Highlighter, tables or diagrams to format..." 
                />
              </div>

              {/* Options Input Block */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Four MCQ Answer Options
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draftOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center select-none">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...draftOptions];
                          copy[idx] = e.target.value;
                          setDraftOptions(copy);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        className="bg-transparent flex-1 focus:outline-none text-xs text-white placeholder-slate-600"
                      />
                      <input
                        type="radio"
                        name="correctIndex"
                        checked={draftCorrectIdx === idx}
                        onChange={() => setDraftCorrectIdx(idx)}
                        className="accent-violet-500 w-4 h-4 cursor-pointer"
                        title="Set as correct option"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation Rich Editor */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Detailed Medical Explanation & Rationales (Supports Tables and diagrams)
                </label>
                <RichTextEditor 
                  value={draftExplanation} 
                  onChange={setDraftExplanation} 
                  placeholder="Describe why the designated option is correct, and why other choices are clinical distractors. Insert diagnostic flowcharts/tables to expand study retention..." 
                />
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-violet-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Submit Proposed MCQ for Editorial Board Review
              </button>
            </form>
          )}

          {creatorMode === "bulk" && (
            <div className="space-y-5">
              <div className={`grid grid-cols-1 ${targetExam === "mec-ug" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Target Subject Tag
                  </label>
                  <select
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {creatorSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {targetExam === "mec-ug" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Target Topic Tag (MEC-UG chapter)
                    </label>
                    <select
                      value={bulkTopic}
                      onChange={(e) => setBulkTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      {dynamicBulkTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Drag-and-drop / select block */}
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center hover:border-slate-700 transition-all bg-slate-950/20 relative group">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleBulkCSVUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Select CSV sheet for bulk MCQs"
                />
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-violet-400 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-white mb-1">Drag & drop your CSV file here, or click to browse</p>
                <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  Row order format should be: <span className="text-violet-400 font-mono">Question Text, Option A, Option B, Option C, Option D, Correct Option (Index 0-3 or A-D), Explanation</span>
                </p>
              </div>

              {bulkFileError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  <span>⚠️ {bulkFileError}</span>
                </div>
              )}

              {bulkParsedQuestions.length > 0 && (
                <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" /> Extracted MCQs List
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Parsed {bulkParsedQuestions.length} MCQs successfully. Ready for operations.</p>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
                      {bulkParsedQuestions.length} Questions Selected
                    </span>
                  </div>

                  {/* Live Preview List */}
                  <div className="max-h-52 overflow-y-auto space-y-3 pr-1 text-left">
                    {bulkParsedQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                        <p className="text-xs font-semibold text-slate-200">
                          <span className="text-violet-400">Q{idx + 1}:</span> {q.questionText}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 pl-4 font-mono">
                          <div>A) {q.options[0]}</div>
                          <div>B) {q.options[1]}</div>
                          <div>C) {q.options[2]}</div>
                          <div>D) {q.options[3]}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 border-t border-slate-900 pt-1.5 font-mono">
                          <span className="text-emerald-400 font-bold">✓ Correct: Option {String.fromCharCode(65 + q.correctOptionIndex)}</span>
                          <span>• Explanation: {q.explanation}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Operations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={practiceBulkQuestions}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Start Practice with {bulkParsedQuestions.length} MCQs Now
                    </button>

                    <button
                      type="button"
                      onClick={submitBulkToReview}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Bulk Submit Proposed MCQs for Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {creatorMode === "custom-set" && (
            <div className="space-y-6 text-left">
              {/* Complete Set Import/Export Portal */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-violet-400" /> Share & Import Complete Custom Sets
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Quickly upload an entire pre-configured JSON set, or export your current progress as a shareable file.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Import Button */}
                  <div className="relative border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/40 text-center hover:border-violet-500/50 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFullSetJSONUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Upload a custom set JSON file"
                    />
                    <Upload className="w-5 h-5 text-violet-400" />
                    <p className="text-[11px] font-bold text-white">Upload Complete Set File (.json)</p>
                    <p className="text-[9px] text-slate-500">Restore or import a previously exported exam set instantly</p>
                  </div>

                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={handleExportDraftSet}
                    className="border border-slate-800 hover:border-emerald-500/30 rounded-xl p-4 bg-slate-950/40 hover:bg-slate-950 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                    title="Download your currently constructed set as a JSON file"
                  >
                    <Share className="w-5 h-5 text-emerald-400" />
                    <p className="text-[11px] font-bold text-white">Export Current Draft Set (.json)</p>
                    <p className="text-[9px] text-slate-500">Download your constructed questions to share with peers</p>
                  </button>
                </div>
              </div>

              {/* Set Settings Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider block font-sans">Custom Set Configuration</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Custom Set Title
                    </label>
                    <input
                      type="text"
                      value={customSetName}
                      onChange={(e) => setCustomSetName(e.target.value)}
                      placeholder="e.g., General Anatomy Speed Run"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Exam Type Target
                    </label>
                    <select
                      value={customSetExamType}
                      onChange={(e) => setCustomSetExamType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="mec-ug">MEC-UG (Common Entrance)</option>
                      <option value="mec-pg">MEC-PG (Post-Graduate)</option>
                      <option value="nmcle">NMCLE (Licensing Exam)</option>
                      <option value="ku-mcq">Kathmandu University MCQs</option>
                      <option value="loksewa">Lok Sewa MCQs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Set Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={customSetDuration}
                      onChange={(e) => setCustomSetDuration(e.target.value)}
                      placeholder="e.g., 60"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Add Questions Control Board */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3 flex-wrap gap-2">
                  <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider block">Add MCQs to Draft Set</span>
                  <button
                    type="button"
                    onClick={() => setCustomSetShowPaste(!customSetShowPaste)}
                    className="text-[10px] font-extrabold bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{customSetShowPaste ? "✍️ Switch to Manual Form" : "📋 Paste Excel / Upload CSV"}</span>
                  </button>
                </div>

                {customSetShowPaste ? (
                  <div className="space-y-4">
                    {/* Excel Paste area */}
                    <div className="space-y-2">
                      <div className="flex justify-between flex-wrap gap-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Paste Excel/Spreadsheet Table Rows (Tab-Separated)
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Format: Question | OptA | OptB | OptC | OptD | Correct Index (0-3 / A-D) | Explanation
                        </span>
                      </div>
                      <textarea
                        value={customSetPasteText}
                        onChange={(e) => setCustomSetPasteText(e.target.value)}
                        placeholder="Paste copied Excel/Sheets rows directly here..."
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          parseCustomSetExcelText(customSetPasteText);
                          setCustomSetPasteText("");
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] px-4 py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Parse & Append Clipboard Rows
                      </button>
                    </div>

                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div>
                      <span className="relative bg-slate-900 px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">OR</span>
                    </div>

                    {/* CSV upload inside Custom Set */}
                    <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-750 transition-all bg-slate-950/20 relative group">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleCustomSetCSVUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-violet-400" />
                      <p className="text-xs font-bold text-white mb-0.5">Upload a CSV or TSV File</p>
                      <p className="text-[9px] text-slate-500 font-mono">Same columns order: Question, Option A, B, C, D, Key (0-3), Explanation</p>
                    </div>
                  </div>
                ) : (
                  /* Manual single question add */
                  <form onSubmit={handleAddManualCustomQuestion} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Question Subject Pool
                        </label>
                        <select
                          value={customSetManualSubject}
                          onChange={(e) => setCustomSetManualSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {creatorSubjects.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Question Topic Tag
                        </label>
                        <input
                          type="text"
                          value={customSetManualTopic}
                          onChange={(e) => setCustomSetManualTopic(e.target.value)}
                          placeholder="e.g., Osteology Basics"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        MCQ Stem / Question Text
                      </label>
                      <input
                        type="text"
                        value={customSetManualText}
                        onChange={(e) => setCustomSetManualText(e.target.value)}
                        placeholder="Enter the question stem here..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Designated Distractors & Option Answers (Select key radio)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customSetManualOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl focus-within:border-violet-500/50 transition-all">
                            <span className="text-xs font-black text-slate-400 font-mono">{String.fromCharCode(65 + idx)}</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const copy = [...customSetManualOptions];
                                copy[idx] = e.target.value;
                                setCustomSetManualOptions(copy);
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                              className="bg-transparent flex-1 focus:outline-none text-xs text-white placeholder-slate-600 font-medium"
                            />
                            <input
                              type="radio"
                              name="customCorrectIndex"
                              checked={customSetManualCorrect === idx}
                              onChange={() => setCustomSetManualCorrect(idx)}
                              className="accent-violet-500 w-4 h-4 cursor-pointer"
                              title="Designate as correct key option"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Rationales / Detailed Medical Explanation
                      </label>
                      <textarea
                        value={customSetManualExplanation}
                        onChange={(e) => setCustomSetManualExplanation(e.target.value)}
                        placeholder="Provide deep clinical explanation..."
                        className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Append MCQ to Custom Set List
                    </button>
                  </form>
                )}
              </div>

              {/* Questions Preview Board */}
              {customSetQuestions.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2.5 flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" /> Set Preview ({customSetQuestions.length} Questions)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Verify your questions list before compilation.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomSetQuestions([])}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Clear All Questions
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1 text-left">
                    {customSetQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomSetQuestions(customSetQuestions.filter((_, qIdx) => qIdx !== idx));
                          }}
                          className="absolute right-3 top-3 text-[10px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Remove
                        </button>
                        <p className="text-xs font-bold text-slate-200 pr-12">
                          <span className="text-violet-400">Q{idx + 1}:</span> {q.questionText}
                        </p>
                        <div className="grid grid-cols-2 gap-1 px-4 text-[10px] text-slate-400 font-mono">
                          <div>A) {q.options[0]}</div>
                          <div>B) {q.options[1]}</div>
                          <div>C) {q.options[2]}</div>
                          <div>D) {q.options[3]}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2.5 border-t border-slate-900 pt-1.5 font-mono">
                          <span className="text-emerald-400 font-bold">Key Option: {String.fromCharCode(65 + q.correctOptionIndex)}</span>
                          <span>• Explanation: {q.explanation}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSaveCustomSet}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    💾 Create & Save Custom Set
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Question by ID tab */}
      {activeTab === "search" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🔍 Serial Question Explorer
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find any item within the entire integrated Nepali Medical syllabus instantly by querying its chronological unique serial ID.
            </p>
          </div>

          <form onSubmit={handleSearchQuestion} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Type unique ID e.g. MECUG-2501 or MECPG-1001..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {searchFeedback && (
            <p className="text-xs text-amber-400 font-semibold">{searchFeedback}</p>
          )}

          {searchResult && (
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <span className="text-[10px] font-black bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full text-violet-300 font-mono">
                  ID: {searchResult.id}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  {searchResult.subject} {searchResult.topic ? `• ${searchResult.topic}` : ""}
                </span>
              </div>

              <div 
                className="text-xs text-white font-bold leading-relaxed"
                dangerouslySetInnerHTML={{ __html: searchResult.questionText }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {searchResult.options.map((opt, i) => (
                  <div 
                    key={i}
                    className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                      i === searchResult.correctOptionIndex
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-slate-900 border-slate-800/50 text-slate-400"
                    }`}
                  >
                    <span className="font-bold text-[10px] uppercase font-mono">{String.fromCharCode(65 + i)})</span>
                    <span>{opt}</span>
                    {i === searchResult.correctOptionIndex && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => startSingleQuestionPractice(searchResult)}
                className="bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Play className="w-3 h-3 fill-violet-400" /> Start Quick Practice Session for this MCQ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
