import React, { useState } from "react";
import { Plus, AlertCircle, Edit3, Trash2, X } from "lucide-react";

interface TopicsTabProps {
  dbTopics: any[];
  dbSubjects: any[];
  dbExams: any[];
  fetchTopics: () => Promise<void>;
  setMessage: (msg: string) => void;
}

export const TopicsTab: React.FC<TopicsTabProps> = ({
  dbTopics,
  dbSubjects,
  dbExams,
  fetchTopics,
  setMessage
}) => {
  // Modal / Form States
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [topicForm, setTopicForm] = useState({ name: "", subject_id: "", weight: "0", icon: "tag" });

  // Pagination States
  const [paginatedTopics, setPaginatedTopics] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchPaginatedTopics = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/topics?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (data.status && data.topics) {
          // Check if response is Laravel paginated format
          if (data.topics.data) {
            setPaginatedTopics(data.topics.data);
            setCurrentPage(data.topics.current_page || 1);
            setTotalPages(data.topics.last_page || 1);
          } else if (Array.isArray(data.topics)) {
            // Fallback if backend hasn't implemented pagination yet but returns array
            setPaginatedTopics(data.topics);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching paginated topics:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPaginatedTopics(currentPage);
  }, [currentPage]);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim() || !topicForm.subject_id) return;

    try {
      if (editingTopic) {
        const res = await fetch(`/api/topics/${editingTopic.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: topicForm.name,
            subject_id: topicForm.subject_id,
            weight: parseFloat(topicForm.weight) || 0,
            icon: topicForm.icon
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Topic updated successfully in database!");
            fetchPaginatedTopics(currentPage);
            fetchTopics();
          }
        }
      } else {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: topicForm.name,
            subject_id: topicForm.subject_id,
            weight: parseFloat(topicForm.weight) || 0,
            icon: topicForm.icon
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Topic created successfully in database!");
            fetchPaginatedTopics(currentPage);
            fetchTopics();
          }
        }
      }
    } catch (error) {
      console.error("Topic save error:", error);
      setMessage("Failed to save topic.");
    }

    setShowTopicModal(false);
    setEditingTopic(null);
    setTopicForm({ name: "", subject_id: "", weight: "0", icon: "tag" });
  };

  const handleEditTopicClick = (topic: any) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      subject_id: topic.subject_id ? String(topic.subject_id) : "",
      weight: String(topic.weight || 0),
      icon: topic.icon || "tag"
    });
    setShowTopicModal(true);
  };

  const handleDeleteTopic = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Topic from database?")) {
      try {
        const res = await fetch(`/api/topics/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setMessage("Topic deleted successfully from database!");
          fetchPaginatedTopics(currentPage);
          fetchTopics();
        }
      } catch (error) {
        console.error("Topic delete error:", error);
        setMessage("Failed to delete topic.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Course Topics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage subcategory units linked to Subjects (e.g. Thermodynamics, Upper Limb)</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTopic(null);
            setTopicForm({ name: "", subject_id: dbSubjects[0]?.uuid || "", weight: "0", icon: "tag" });
            setShowTopicModal(true);
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-violet-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic</span>
        </button>
      </div>

      {paginatedTopics.length === 0 && !loading ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed p-10 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">No topics registered in database.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg overflow-x-auto flex flex-col">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Topic Name</th>
                  <th className="py-4 px-6">Parent Subject</th>
                  <th className="py-4 px-6">Exam Context</th>
                  <th className="py-4 px-6">Weight (%)</th>
                  <th className="py-4 px-6">Icon</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedTopics.map((topic) => {
                  const parentSubject = dbSubjects.find(s => s.uuid === topic.subject_id);
                  const connectedExam = parentSubject ? dbExams.find(e => e.id === parentSubject.exam_id) : null;
                  return (
                    <tr key={topic.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        🏷️ {topic.name}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {parentSubject ? parentSubject.name : `Subject (UUID: ${topic.subject_id})`}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {connectedExam ? connectedExam.name : "-"}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {topic.weight || 0}%
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {topic.icon || "tag"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditTopicClick(topic)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/60 flex items-center justify-between text-xs bg-slate-900/50">
              <span className="text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOPICS CREATE/EDIT MODAL */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleTopicSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingTopic ? "✏️ Edit Topic" : "➕ Add Topic"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowTopicModal(false);
                  setEditingTopic(null);
                }}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 animate-none" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 5.0"
                  value={topicForm.weight}
                  onChange={(e) => setTopicForm({ ...topicForm, weight: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Subject</label>
                <select
                  value={topicForm.subject_id}
                  onChange={(e) => setTopicForm({ ...topicForm, subject_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer font-sans"
                >
                  <option value="">Select parent subject</option>
                  {dbSubjects.map(sub => (
                    <option key={sub.uuid} value={sub.uuid} className="bg-slate-950 text-white font-medium font-sans">
                      {sub.name} ({dbExams.find(e => e.id === sub.exam_id)?.name || sub.exam_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Icon Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. tag, activity, book"
                  value={topicForm.icon}
                  onChange={(e) => setTopicForm({ ...topicForm, icon: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowTopicModal(false);
                  setEditingTopic(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-755 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer font-sans"
              >
                {editingTopic ? "Save Changes" : "Create Topic"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
