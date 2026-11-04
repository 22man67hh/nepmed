
import React, { useState, useEffect } from "react";
import { Sparkles, X, BrainCircuit, ShieldAlert, GraduationCap, Copy, Check } from "lucide-react";
import { Question } from "../types";

interface AITutorModalProps {
  question: Question | null;
  onClose: () => void;
}

export default function AITutorModal({ question, onClose }: AITutorModalProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!question) return;

    const fetchExplanation = async () => {
      setLoading(true);
      setError("");
      setResponse("");

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText: question.questionText,
            options: question.options,
            explanation: question.explanation,
            subject: question.subject || "General Medical Science"
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to call Gemini AI Medical Tutor.");
        }
        setResponse(data.text || "No response text was generated.");
      } catch (err: any) {
        console.error("AI Tutor Error:", err);
        setError(err.message || "An unexpected error occurred while contacting the AI Medical Tutor.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [question]);

  if (!question) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple, elegant Markdown formatting custom renderer to keep visual quality crisp and perfect
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h5 key={idx} className="text-sm font-extrabold text-white mt-4 mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-violet-400" />
            {line.replace("### ", "")}
          </h5>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h4 key={idx} className="text-base font-black text-white mt-5 mb-2 border-b border-slate-800/80 pb-1 flex items-center gap-2">
            <GraduationCap className="w-4.5 h-4.5 text-emerald-400" />
            {line.replace("## ", "")}
          </h4>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h3 key={idx} className="text-lg font-black text-white mt-6 mb-3 border-b border-emerald-500/20 pb-1">
            {line.replace("# ", "")}
          </h3>
        );
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc pl-1 mb-1.5 leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }

      // Standard paragraphs
      if (line.trim() === "") return <div key={idx} className="h-2" />;

      return (
        <p key={idx} className="text-xs text-slate-350 leading-relaxed mb-2.5">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper to parse bold markdown syntax **text**
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-emerald-400 font-extrabold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-screen flex flex-col justify-between shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            </span>
            <div>
              <h4 className="font-bold text-white text-sm">AI Medical Tutor</h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Gemini-Powered Smart Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable explanation body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Active Question Summary Card */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Active Question Concept
            </span>
            <p className="text-xs font-semibold text-white leading-snug">
              {question.questionText}
            </p>
          </div>

          {/* Load/Response Status */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
              <span className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-xs font-semibold text-slate-300">Synthesizing Clinical Concepts...</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
                  Consulting high-yield past papers, pharmacology acts, and therapeutic regimens.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/15 border border-red-500/10 rounded-xl text-center">
              <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-red-400 mb-1">AI Tutor Service Offline</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-1 select-text">
              {renderFormattedContent(response)}
            </div>
          )}

        </div>

        {/* Footer actions */}
        {response && !loading && !error && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-semibold font-mono">
              Model: gemini-3.5-flash
            </span>
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Notes!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy study Notes
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
