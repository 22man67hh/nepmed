import React, { useState } from "react";
import { Plus, AlertCircle, Edit3, Trash2, X } from "lucide-react";

interface SubjectsTabProps {
  dbSubjects: any[];
  dbExams: any[];
  dbTopics: any[];
  fetchSubjects: () => Promise<void>;
  fetchTopics: () => Promise<void>;
  setMessage: (msg: string) => void;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  dbSubjects,
  dbExams,
  dbTopics,
  fetchSubjects,
  fetchTopics,
  setMessage
}) => {
  // Modal / Form States for Subject CRUD
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", exam_id: "", weight: "0", icon: "book", status: "active" });

  // Expanded Subject Topics State
  const [expandedSubjectUuid, setExpandedSubjectUuid] = useState<string | null>(null);
  const [localTopics, setLocalTopics] = useState<any[]>([]);

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    // Generate a unique 10-char code using subject name and random string to satisfy unique constraints
    const randSuffix = Math.floor(Math.random() * 100000).toString();
    const cleanPrefix = subjectForm.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5);
    const uniqueCode = (cleanPrefix + randSuffix).slice(0, 10);

    try {
      if (editingSubject) {
        const res = await fetch(`/api/subjects/${editingSubject.uuid || editingSubject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subjectForm.name,
            code: uniqueCode,
            exam_id: subjectForm.exam_id ? parseInt(subjectForm.exam_id) : null,
            weight: parseFloat(subjectForm.weight) || 0,
            status: subjectForm.status,
            description: ""
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Subject updated successfully in database!");
            fetchSubjects();
          }
        }
      } else {
        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subjectForm.name,
            code: uniqueCode,
            exam_id: subjectForm.exam_id ? parseInt(subjectForm.exam_id) : null,
            weight: parseFloat(subjectForm.weight) || 0,
            status: subjectForm.status,
            description: ""
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Subject added successfully to database!");
            fetchSubjects();
          }
        }
      }
    } catch (error) {
      console.error("Subject save error:", error);
      setMessage("Failed to save subject.");
    }

    setShowSubjectModal(false);
    setEditingSubject(null);
    setSubjectForm({ name: "", exam_id: "", weight: "0", icon: "book", status: "active" });
  };

  const handleEditSubjectClick = (sub: any) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      exam_id: sub.exam_id ? String(sub.exam_id) : "",
      weight: String(sub.weight || 0),
      icon: sub.icon || "book",
      status: sub.status || "active"
    });
    setShowSubjectModal(true);
  };

  const handleDeleteSubject = async (uuid: string) => {
    if (window.confirm("Are you sure you want to delete this Subject from database?")) {
      try {
        const res = await fetch(`/api/subjects/${uuid}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setMessage("Subject deleted successfully from database!");
          fetchSubjects();
        }
      } catch (error) {
        console.error("Subject delete error:", error);
        setMessage("Failed to delete subject.");
      }
    }
  };

  // Expand / Toggle Managing Topics of a Subject
  const handleToggleExpand = (subjectUuid: string) => {
    if (expandedSubjectUuid === subjectUuid) {
      setExpandedSubjectUuid(null);
      setLocalTopics([]);
    } else {
      setExpandedSubjectUuid(subjectUuid);
      const existing = dbTopics.filter(t => t.subject_id === subjectUuid);
      setLocalTopics(existing.map(t => ({
        id: t.id,
        name: t.name,
        weight: String(t.weight || 0),
        icon: t.icon || "tag"
      })));
    }
  };

  const handleAddTopicRow = () => {
    setLocalTopics([...localTopics, { name: "", weight: "0", icon: "tag" }]);
  };

  const handleUpdateTopicField = (idx: number, field: string, val: string) => {
    const updated = [...localTopics];
    updated[idx] = { ...updated[idx], [field]: val };
    setLocalTopics(updated);
  };

  const handleRemoveTopicRow = (idx: number) => {
    setLocalTopics(localTopics.filter((_, i) => i !== idx));
  };

  const handleSaveTopics = async (subjectUuid: string) => {
    if (localTopics.some(t => !t.name.trim())) {
      alert("All topics must have a name.");
      return;
    }

    try {
      const res = await fetch("/api/topics/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectUuid,
          topics: localTopics.map(t => ({
            id: t.id || null,
            name: t.name,
            weight: parseFloat(t.weight) || 0,
            icon: t.icon || "tag"
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMessage("Topics synchronized successfully in database!");
          await fetchTopics();
          if (data.topics) {
            setLocalTopics(data.topics.map((t: any) => ({
              id: t.id,
              name: t.name,
              weight: String(t.weight || 0),
              icon: t.icon || "tag"
            })));
          }
        }
      } else {
        setMessage("Failed to save topics.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error saving topics.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Course Subjects</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage subject directories linked to target board exams</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingSubject(null);
            setSubjectForm({ name: "", exam_id: dbExams[0]?.id || "", weight: "0", icon: "book", status: "active" });
            setShowSubjectModal(true);
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-violet-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {dbSubjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed p-10 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">No subjects created in database.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6">Subject Name</th>
                <th className="py-4 px-6">Exam Category</th>
                <th className="py-4 px-6">Weight (%)</th>
                <th className="py-4 px-6">Slug</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {dbSubjects.map((sub) => {
                const connectedExam = dbExams.find(e => e.id === sub.exam_id);
                const subjectTopics = dbTopics.filter(t => t.subject_id === sub.uuid);
                const isExpanded = expandedSubjectUuid === sub.uuid;
                
                return (
                  <React.Fragment key={sub.uuid}>
                    <tr className="hover:bg-slate-800/20 transition-colors border-b border-slate-800/60">
                      <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                        <span className="text-violet-400 text-xs">📚</span>
                        <span>{sub.name}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {connectedExam ? connectedExam.name : `Exam (ID: ${sub.exam_id})`}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {sub.weight || 0}%
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {sub.slug}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          sub.status === "active" ? "bg-violet-500/15 text-violet-400" : "bg-slate-800 text-slate-400"
                        }`}>
                          {sub.status || "active"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {/* Manage Topics Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(sub.uuid)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isExpanded 
                                ? "bg-violet-600 border-violet-500 text-white" 
                                : "bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
                            }`}
                          >
                            <span>🏷️ Manage Topics ({subjectTopics.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditSubjectClick(sub)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sub.uuid)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-slate-950/60 border-t border-b border-slate-850">
                        <td colSpan={6} className="p-5">
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-150 text-slate-200">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                              <div>
                                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                                  Syllabus Topics for: {sub.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Add, edit, or remove multiple topics in bulk below. Click Save to apply changes.</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddTopicRow}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Topic Row</span>
                              </button>
                            </div>

                            {localTopics.length === 0 ? (
                              <div className="text-center py-6 text-slate-500 text-xs italic">
                                No topics defined. Click "Add Topic Row" to configure topics.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-slate-500 uppercase px-2">
                                  <div className="col-span-5">Topic Name</div>
                                  <div className="col-span-3">Weight (%)</div>
                                  <div className="col-span-3">Icon Key</div>
                                  <div className="col-span-1 text-center">Delete</div>
                                </div>
                                
                                {localTopics.map((topic, index) => (
                                  <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-950 border border-slate-850 p-2 rounded-xl">
                                    <div className="col-span-5">
                                      <input
                                        type="text"
                                        value={topic.name}
                                        onChange={(e) => handleUpdateTopicField(index, "name", e.target.value)}
                                        placeholder="e.g. Thermodynamics"
                                        className="w-full bg-transparent border-0 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded p-1"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={topic.weight}
                                        onChange={(e) => handleUpdateTopicField(index, "weight", e.target.value)}
                                        placeholder="e.g. 5.5"
                                        className="w-full bg-transparent border-0 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded p-1 font-mono"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      <input
                                        type="text"
                                        value={topic.icon}
                                        onChange={(e) => handleUpdateTopicField(index, "icon", e.target.value)}
                                        placeholder="e.g. tag"
                                        className="w-full bg-transparent border-0 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded p-1 font-mono"
                                      />
                                    </div>
                                    <div className="col-span-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTopicRow(index)}
                                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2 justify-end border-t border-slate-800/60 pt-3 mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedSubjectUuid(null)}
                                className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Close Editor
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveTopics(sub.uuid)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                              >
                                Save Topics List
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBJECTS CREATE/EDIT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubjectSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingSubject ? "✏️ Edit Subject" : "➕ Add Subject"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubject(null);
                }}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 animate-none" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pathology"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 15.5"
                  value={subjectForm.weight}
                  onChange={(e) => setSubjectForm({ ...subjectForm, weight: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Board Exam</label>
                <select
                  value={subjectForm.exam_id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, exam_id: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer font-sans"
                >
                  <option value="">Select parent exam</option>
                  {dbExams.map(exam => (
                    <option key={exam.id} value={exam.id} className="bg-slate-955 text-white font-medium font-sans">
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Status</label>
                <select
                  value={subjectForm.status}
                  onChange={(e) => setSubjectForm({ ...subjectForm, status: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer font-sans"
                >
                  <option value="active" className="bg-slate-955 text-white">Active</option>
                  <option value="inactive" className="bg-slate-955 text-white">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubject(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-755 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer font-sans"
              >
                {editingSubject ? "Save Changes" : "Create Subject"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
