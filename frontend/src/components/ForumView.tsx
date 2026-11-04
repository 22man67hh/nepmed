
import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  HelpCircle, 
  Plus, 
  Search, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  ChevronDown,
  X
} from "lucide-react";
import { UserProfile } from "../types";

interface ForumReply {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  createdAt: string;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  category: string;
  createdAt: string;
  replies: ForumReply[];
}

interface ForumViewProps {
  userProfile: UserProfile;
}

const CATEGORIES = [
  "All Areas",
  "Anatomy",
  "Physiology",
  "Pathology",
  "Pharmacology",
  "Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "MEC-PG Rules",
  "Loksewa Strategy",
  "NMCLE Guidance",
  "General Study"
];

export default function ForumView({ userProfile }: ForumViewProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Areas");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Thread state
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General Study");
  const [newContent, setNewContent] = useState("");
  const [threadSubmitting, setThreadSubmitting] = useState(false);

  // Active expanded thread to write a reply
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<{ [threadId: string]: string }>({});
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null);

  // Loading/polling states
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load threads
  const loadThreads = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const res = await fetch("/api/forum");
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (e) {
      console.error("Error loading forum threads:", e);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadThreads(true);
  }, []);

  // Set up 4-second polling for real-time interactivity
  useEffect(() => {
    if (isPolling) {
      pollingRef.current = setInterval(() => {
        loadThreads(false);
      }, 4000); // Poll every 4 seconds
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPolling]);

  // Form thread creation submit
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please fill in both the question title and detail content!");
      return;
    }

    setThreadSubmitting(true);
    try {
      const res = await fetch("/api/forum/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          authorName: userProfile.name || "Anonymous Candidate",
          authorEmail: userProfile.email || "anonymous@nepmed.edu",
          authorAvatar: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=10b981&color=fff&bold=true&size=128`
        })
      });

      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setIsCreatingThread(false);
        await loadThreads(false);
      }
    } catch (err) {
      console.error("Failed to post question thread:", err);
    } finally {
      setThreadSubmitting(false);
    }
  };

  // Reply submission
  const handlePostReply = async (threadId: string) => {
    const text = replyTextMap[threadId] || "";
    if (!text.trim()) {
      alert("Reply content cannot be blank.");
      return;
    }

    setReplySubmittingId(threadId);
    try {
      const res = await fetch("/api/forum/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          content: text,
          authorName: userProfile.name || "Anonymous Candidate",
          authorEmail: userProfile.email || "anonymous@nepmed.edu",
          authorAvatar: userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=10b981&color=fff&bold=true&size=128`
        })
      });

      if (res.ok) {
        setReplyTextMap(prev => ({ ...prev, [threadId]: "" }));
        await loadThreads(false);
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setReplySubmittingId(null);
    }
  };

  // Helper to detect if email belongs to known editors
  const isEditorialStaff = (email: string) => {
    const editorialEmails = [
      "koirala.ramesh@nepmed.edu",
      "subedi.sunil@nepmed.edu",
      "anjana.adhikari@nepmed.edu",
      "sharma.niranjan@nepmed.edu",
      "subedisunil841@gmail.com" // User's email from metadata, make him verified as well!
    ];
    return editorialEmails.includes(email.toLowerCase());
  };

  // Filtering threads
  const filteredThreads = threads.filter(t => {
    const matchesCat = selectedCategory === "All Areas" || t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = searchQuery.trim() === "" || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div id="forum-container" className="w-full px-4 sm:px-6 py-5 space-y-6 animate-in fade-in duration-200">
      
      {/* Forum Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Real-Time Active
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 italic">Auto-refreshing every 4s</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans flex items-center gap-2.5 mt-1">
            <MessageSquare className="w-5.5 h-5.5 text-emerald-400" />
            <span>Interactive Candidates Forum</span>
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl font-sans">
            Ask licensing board questions, reply to other candidates in real-time, share high-yield clinical mnemonics, and interact with the NepMed MCQ Editorial Board.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingThread(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/15 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Board Question</span>
        </button>
      </div>

      {/* Categories Toolbar & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Search Input */}
        <div className="md:col-span-4 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search discussion threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Polling controller */}
        <div className="md:col-span-8 flex flex-wrap items-center justify-end gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 select-none">
              <input
                type="checkbox"
                checked={isPolling}
                onChange={(e) => setIsPolling(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[10px] font-semibold">Real-Time Polling</span>
            </label>
          </div>
          
          <button
            onClick={() => loadThreads(true)}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Force Reload</span>
          </button>
        </div>
      </div>

      {/* Category Horizontal Badges */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedCategory === cat
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ---------------- NEW QUESTION THREAD MODAL ---------------- */}
      {isCreatingThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-sans">Ask Candidate Community</h3>
              </div>
              <button 
                onClick={() => setIsCreatingThread(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Question Title / Summary</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., What is the most common cause of neonatal mortality in Nepal?"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                >
                  {CATEGORIES.slice(1).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Provide Detailed Explanation / Context</label>
                <textarea 
                  rows={4} 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  placeholder="Describe your confusion, mention alternative options or references here..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsCreatingThread(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={threadSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/15 disabled:opacity-50"
                >
                  {threadSubmitting ? "Posting..." : "Post Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- FORUM THREADS FEED ---------------- */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
            <p className="text-slate-400 text-xs italic">No discussion threads found in this category.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-emerald-400 hover:underline text-xs font-semibold mt-2 bg-transparent border-0 cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isExpanded = expandedThreadId === thread.id;
            const repliesCount = thread.replies ? thread.replies.length : 0;
            const hasVerifiedReply = thread.replies && thread.replies.some(r => isEditorialStaff(r.authorEmail));

            return (
              <div 
                key={thread.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all space-y-4"
              >
                
                {/* Thread Top Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={thread.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.authorName)}&background=6366f1&color=fff&bold=true&size=64`} 
                      alt={thread.authorName} 
                      className="w-10 h-10 bg-slate-800 rounded-xl border border-slate-700/60 p-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white font-sans">{thread.authorName}</span>
                        {isEditorialStaff(thread.authorEmail) && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Editorial Board</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-sans">
                        <span>{thread.authorEmail}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-slate-950 border border-slate-800/80 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {thread.category}
                  </span>
                </div>

                {/* Question Content */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white font-sans leading-snug">{thread.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{thread.content}</p>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/50 text-xs">
                  <button
                    onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      {repliesCount} {repliesCount === 1 ? "Reply" : "Replies"}
                    </span>
                    {hasVerifiedReply && (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                        Answered by Faculty
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ml-0.5 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  <button
                    onClick={() => setExpandedThreadId(thread.id)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-all text-[11px] cursor-pointer"
                  >
                    Reply to Question →
                  </button>
                </div>

                {/* ---------------- EXPANDED THREAD REPLIES & DISPATCH ---------------- */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-in slide-in-from-top-3 duration-200">
                    
                    {/* Replies list */}
                    {repliesCount > 0 ? (
                      <div className="space-y-3 pl-2 border-l-2 border-slate-800/80 max-h-96 overflow-y-auto">
                        {thread.replies.map((reply) => (
                          <div key={reply.id} className="bg-slate-950 p-3.5 rounded-xl space-y-2 border border-slate-800/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={reply.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorName)}&background=6366f1&color=fff&bold=true&size=64`} 
                                  alt={reply.authorName} 
                                  className="w-6.5 h-6.5 bg-slate-800 rounded-lg"
                                />
                                <span className="text-[11px] font-bold text-slate-200 font-sans">{reply.authorName}</span>
                                {isEditorialStaff(reply.authorEmail) && (
                                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.1 border border-emerald-500/20 rounded uppercase flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2 h-2" /> Verified Faculty
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 font-sans flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic pl-3 leading-normal">
                        No candidate replies yet. Be the first to answer this question!
                      </p>
                    )}

                    {/* Submit reply form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write your clinical answer/reply..."
                        value={replyTextMap[thread.id] || ""}
                        onChange={(e) => setReplyTextMap(prev => ({ ...prev, [thread.id]: e.target.value }))}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostReply(thread.id);
                        }}
                      />
                      <button
                        onClick={() => handlePostReply(thread.id)}
                        disabled={replySubmittingId === thread.id}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {replySubmittingId === thread.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Reply</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
