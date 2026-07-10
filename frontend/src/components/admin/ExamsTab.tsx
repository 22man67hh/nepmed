import React, { useState } from "react";
import { Plus, AlertCircle, Edit3, Trash2, X } from "lucide-react";

interface ExamsTabProps {
  dbExams: any[];
  fetchExams: () => Promise<void>;
  setMessage: (msg: string) => void;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  dbExams,
  fetchExams,
  setMessage
}) => {
  // Modal / Form States
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [examForm, setExamForm] = useState({ name: "", description: "", status: "active" });

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) return;

    try {
      if (editingExam) {
        const res = await fetch(`/api/exams/${editingExam.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: examForm.name,
            description: examForm.description,
            status: examForm.status
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Exam updated successfully in database!");
            fetchExams();
          }
        }
      } else {
        const res = await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: examForm.name,
            description: examForm.description,
            status: examForm.status
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setMessage("Exam created successfully in database!");
            fetchExams();
          }
        }
      }
    } catch (error) {
      console.error("Exam save error:", error);
      setMessage("Failed to save exam to database.");
    }

    setShowExamModal(false);
    setEditingExam(null);
    setExamForm({ name: "", description: "", status: "active" });
  };

  const handleEditExamClick = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name,
      description: exam.description || "",
      status: exam.status || "active"
    });
    setShowExamModal(true);
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Exam from the database?")) {
      try {
        const res = await fetch(`/api/exams/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setMessage("Exam deleted successfully from database!");
          fetchExams();
        }
      } catch (error) {
        console.error("Exam delete error:", error);
        setMessage("Failed to delete exam.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Board Exams List</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage live board configurations and entrance schemas</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingExam(null);
            setExamForm({ name: "", description: "", status: "active" });
            setShowExamModal(true);
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-violet-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Exam</span>
        </button>
      </div>

      {dbExams.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed p-10 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400">No exams registered in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {dbExams.map((exam) => (
            <div key={exam.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-white">{exam.name}</h4>
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    exam.status === "active" ? "bg-violet-500/15 text-violet-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    {exam.status || "active"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{exam.description || "No description provided."}</p>
                <p className="text-[10px] font-mono text-slate-500">Slug: {exam.slug}</p>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-800/60 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => handleEditExamClick(exam)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Edit Exam"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Delete Exam"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXAMS CREATE/EDIT MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleExamSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingExam ? "✏️ Edit Target Exam" : "➕ Create Target Exam"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowExamModal(false);
                  setEditingExam(null);
                }}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g. IOM Entrance Board"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="e.g. Licensing guidelines and general preparatory modules."
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={examForm.status}
                  onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="active" className="bg-slate-950 text-white">Active</option>
                  <option value="inactive" className="bg-slate-950 text-white">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowExamModal(false);
                  setEditingExam(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-755 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {editingExam ? "Save Changes" : "Create Exam"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
