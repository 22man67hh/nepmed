import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, LayoutTemplate, Database, AlertCircle, FileJson, Settings2 } from "lucide-react";
import { JsonVisualEditor } from "./JsonVisualEditor";

export function PagesManagerTab() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isVisualMode, setIsVisualMode] = useState(true);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pages");
      
      if (!res.ok) {
        // If 404 Not Found, backend might not have the route yet, treat as empty
        if (res.status === 404) {
          setPages([]);
          setError("");
          return;
        }
        throw new Error(`API returned ${res.status}`);
      }
      
      const text = await res.text();
      // Handle completely empty responses
      if (!text || text.trim() === "") {
        setPages([]);
        setError("");
        return;
      }

      // If backend returns a Laravel HTML error page (e.g. table not found because migrations haven't run)
      if (text.trim().startsWith('<')) {
        console.warn("API returned HTML. Assuming backend error or missing table:", text.substring(0, 100));
        setPages([]);
        setError(""); // Prevent crashing the UI, just show empty
        return;
      }

      const data = JSON.parse(text);
      
      // Handle standard array, Laravel resource collections, or nested paginated objects
      if (Array.isArray(data)) {
        setPages(data);
      } else if (data && Array.isArray(data.data)) {
        setPages(data.data);
      } else if (data && Array.isArray(data.pages)) {
        setPages(data.pages);
      } else {
        setPages([]);
      }
      
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSave = async () => {
    try {
      // Validate JSON
      let parsedJson = {};
      try {
        parsedJson = JSON.parse(editContent);
      } catch (e) {
        alert("Invalid JSON format in content. Please fix before saving.");
        return;
      }

      const payload = {
        title: editTitle,
        slug: editSlug,
        content: parsedJson
      };

      let res;
      if (editingId === "new") {
        res = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/pages/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error("Failed to save page");
      
      setEditingId(null);
      fetchPages();
    } catch (err: any) {
      alert(err.message || "Error saving page");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this page content?")) return;
    try {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete page");
      fetchPages();
    } catch (err: any) {
      alert(err.message || "Error deleting page");
    }
  };

  const startEdit = (page: any) => {
    setEditingId(page.id);
    setEditTitle(page.title || "");
    setEditSlug(page.slug || "");
    setEditContent(typeof page.content === "object" ? JSON.stringify(page.content, null, 2) : (page.content || "{}"));
  };

  const startNew = () => {
    setEditingId("new");
    setEditTitle("");
    setEditSlug("");
    setEditContent("{\n  \"hero\": {\n    \"title\": \"\",\n    \"subtitle\": \"\",\n    \"image\": \"\"\n  }\n}");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-emerald-400" />
            Pages & Dynamic Content
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage static pages, hero sections, and JSON-based configurations.
          </p>
        </div>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Page Config
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">API Connection Error</p>
            <p>{error}</p>
            <p className="mt-2 text-xs opacity-80">Make sure the backend migration and resource routes for /api/pages are set up.</p>
          </div>
        </div>
      )}

      {editingId && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">
              {editingId === "new" ? "Create New Page Config" : "Edit Page Config"}
            </h3>
            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Page Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Home Page"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. home"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <FileJson className="w-3 h-3" /> Page Content Configuration
                </label>
                <button 
                  onClick={() => setIsVisualMode(!isVisualMode)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1 font-bold"
                >
                  <Settings2 className="w-3 h-3" />
                  {isVisualMode ? "Switch to Code" : "Switch to Visual"}
                </button>
              </div>
              
              {isVisualMode ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-[500px] overflow-y-auto">
                  <JsonVisualEditor 
                    data={(() => {
                      try {
                        return JSON.parse(editContent || "{}");
                      } catch (e) {
                        return {};
                      }
                    })()}
                    onChange={(newData) => setEditContent(JSON.stringify(newData, null, 2))}
                  />
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  placeholder="{}"
                />
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {!editingId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm font-mono animate-pulse">Loading pages...</div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No dynamic pages configured yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Content Preview</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pages.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-200">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono border border-slate-700">
                        {p.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
                        {typeof p.content === "object" ? JSON.stringify(p.content).substring(0, 50) + "..." : "No JSON"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
