import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, User, Search } from "lucide-react";

export const TeamsTab: React.FC<{ theme: "dark" | "light" }> = ({ theme }) => {
  const isDark = theme === "dark";
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (team: any) => {
    const isNew = !team.id;
    const url = isNew ? "/api/teams" : `/api/teams/${team.id}`;
    
    const formData = new FormData();
    Object.keys(team).forEach(key => {
      if (key === 'image_file') {
        formData.append('image', team[key]);
      } else if (team[key] !== null && team[key] !== undefined) {
        if (typeof team[key] === 'boolean') {
          formData.append(key, team[key] ? '1' : '0');
        } else {
          formData.append(key, team[key]);
        }
      }
    });

    if (!isNew) {
      formData.append('_method', 'PUT');
    }

    try {
      const res = await fetch(url, {
        method: "POST", // Laravel accepts POST for FormData, uses _method=PUT
        body: formData
      });
      if (res.ok) {
        fetchTeams();
        setIsEditing(null);
      } else {
        alert("Failed to save team member.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    try {
      await fetch(`/api/teams/${id}`, { method: "DELETE" });
      fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Teams Directory</h2>
          <p className="text-sm text-slate-500">Manage editorial team, founders, and contributors.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-9 pr-3 py-2 border rounded-xl leading-5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-300 placeholder-slate-400' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>
          <button
            onClick={() => setIsEditing({ 
              name: "", designation: "", type: "core", status: "active", is_founder: false 
            })}
            className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Member</span>
          </button>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <table className="w-full text-left text-sm">
          <thead className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}>
            <tr>
              <th className="px-4 py-3 font-semibold">Name & Role</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Badge</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {teams.filter(t => (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.designation || '').toLowerCase().includes(searchQuery.toLowerCase())).map((t, idx) => (
              <tr key={t.id || idx} className={`hover:${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      {t.image ? <img src={t.image} alt={t.name} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div>
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</div>
                      <div className="text-xs text-slate-500">{t.designation || 'No Role'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    t.type === 'core' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{t.badge || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(t)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`max-w-2xl w-full rounded-2xl p-6 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{isEditing.id ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Name</label>
                <input type="text" value={isEditing.name || ''} onChange={e => setIsEditing({...isEditing, name: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Designation (Role)</label>
                <input type="text" value={isEditing.designation || ''} onChange={e => setIsEditing({...isEditing, designation: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Type Category</label>
                <select value={isEditing.type || 'core'} onChange={e => setIsEditing({...isEditing, type: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <option value="core">Core Team</option>
                  <option value="chief_editor">Chief Editor</option>
                  <option value="special_thanks">Special Thanks / Contributor</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Hospital/Institution</label>
                <input type="text" value={isEditing.hospital || ''} onChange={e => setIsEditing({...isEditing, hospital: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Badge</label>
                <input type="text" value={isEditing.badge || ''} onChange={e => setIsEditing({...isEditing, badge: e.target.value})} placeholder="e.g. Founder" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Image</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="URL or Upload file..." 
                    value={isEditing.image_file ? isEditing.image_file.name : (isEditing.image || '')} 
                    onChange={e => {
                      if (!isEditing.image_file) setIsEditing({...isEditing, image: e.target.value});
                    }} 
                    disabled={!!isEditing.image_file}
                    className={`flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs ${isEditing.image_file ? 'opacity-50' : ''}`} 
                  />
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold border border-slate-700 flex items-center justify-center">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Save the actual File object so it can be appended to FormData
                          setIsEditing({ ...isEditing, image_file: file, image: undefined });
                        }
                      }} 
                    />
                  </label>
                  {isEditing.image_file && (
                    <button 
                      onClick={() => setIsEditing({...isEditing, image_file: undefined})}
                      className="px-2 py-2 bg-red-950/30 text-red-500 rounded-lg border border-red-900/50 hover:bg-red-900/50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Facebook URL</label>
                <input type="text" value={isEditing.facebook || ''} onChange={e => setIsEditing({...isEditing, facebook: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">LinkedIn URL</label>
                <input type="text" value={isEditing.linkedin || ''} onChange={e => setIsEditing({...isEditing, linkedin: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Twitter URL</label>
                <input type="text" value={isEditing.twitter || ''} onChange={e => setIsEditing({...isEditing, twitter: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div className="space-y-1 flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isEditing.is_founder} onChange={e => setIsEditing({...isEditing, is_founder: e.target.checked})} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950" />
                  <span className="text-sm font-semibold text-slate-300">Is Founder?</span>
                </label>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-slate-500">Description (Bio)</label>
                <textarea rows={3} value={isEditing.description || ''} onChange={e => setIsEditing({...isEditing, description: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 rounded-lg font-semibold hover:bg-slate-800">Cancel</button>
              <button onClick={() => handleSave(isEditing)} className="px-4 py-2 rounded-lg font-semibold bg-emerald-500 text-white flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
