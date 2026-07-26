import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Check, Save, Package, DollarSign, Clock, Star, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { PremiumPackage } from "../../types";

interface PremiumPackagesTabProps {
  setMessage: (msg: string) => void;
}

export function PremiumPackagesTab({ setMessage }: PremiumPackagesTabProps) {
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<Partial<PremiumPackage>>({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    is_active: false,
    is_free: false,
    is_popular: false,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/premium-packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || data || []);
      } else {
        // Mock data if backend is not ready
        setPackages([
          { id: 1, name: "MBBS First Year Standard", description: "Complete access to first-year subjects.", price: 999, duration: 30, is_active: true, is_free: false, is_popular: true },
          { id: 2, name: "Free Trial", description: "Basic access for a short time.", price: 0, duration: 7, is_active: true, is_free: true, is_popular: false }
        ]);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PremiumPackage, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      duration: 30,
      is_active: false,
      is_free: false,
      is_popular: false,
    });
    setIsEditing(false);
  };

  const handleEdit = (pkg: PremiumPackage) => {
    setFormData({ ...pkg });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setMessage("Package name is required.");
      return;
    }

    try {
      const url = isEditing && formData.id ? `/api/premium-packages/${formData.id}` : "/api/premium-packages";
      const method = isEditing && formData.id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage(isEditing ? "Package updated successfully!" : "Package created successfully!");
        fetchPackages();
        resetForm();
      } else {
        setMessage("Error saving package. The backend might not be fully configured yet.");
        // Mock update for UX demo
        if (isEditing) {
          setPackages(packages.map(p => p.id === formData.id ? { ...p, ...formData } as PremiumPackage : p));
        } else {
          setPackages([...packages, { ...formData, id: Date.now() } as PremiumPackage]);
        }
        setMessage(isEditing ? "Package updated (Mock)!" : "Package created (Mock)!");
        resetForm();
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Network error occurred.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    
    try {
      const response = await fetch(`/api/premium-packages/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
      });
      
      if (response.ok) {
        setMessage("Package deleted successfully!");
        fetchPackages();
      } else {
        // Mock delete
        setPackages(packages.filter(p => p.id !== id));
        setMessage("Package deleted (Mock)!");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Network error occurred.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Packages List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Active Premium Packages
            </h3>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              {packages.length} Total
            </span>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {packages.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No premium packages found.</p>
                  <p className="text-xs text-slate-500 mt-1">Create one using the form.</p>
                </div>
              ) : (
                packages.map(pkg => (
                  <div key={pkg.id} className={`group relative bg-slate-950 border ${pkg.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-75'} rounded-xl p-5 hover:border-emerald-500/30 transition-all shadow-lg`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-white text-base flex items-center gap-2">
                            {pkg.name}
                            {pkg.is_popular && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                          </h4>
                          {pkg.is_active ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Active</span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">Inactive</span>
                          )}
                          {pkg.is_free && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Free</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 pr-12">{pkg.description || "No description provided."}</p>
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            {pkg.price > 0 ? `Rs. ${pkg.price}` : "Free"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-violet-400" />
                            {pkg.duration} Days
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(pkg)}
                          className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Package"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg.id)}
                          className="p-2 bg-slate-900 border border-rose-900/50 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                          title="Delete Package"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isEditing ? <Edit3 className="w-5 h-5 text-violet-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
            {isEditing ? "Edit Package" : "Create New Package"}
          </h3>
          {isEditing && (
            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g. Complete MBBS Prep 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detail what's included..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price (Rs.)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration (Days)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            {/* Toggles */}
            <div 
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => handleInputChange("is_active", !formData.is_active)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Active Status</span>
                <span className="text-[10px] text-slate-400">Available for purchase</span>
              </div>
              {formData.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => handleInputChange("is_free", !formData.is_free)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Is Free?</span>
                <span className="text-[10px] text-slate-400">Bypasses payment gateway</span>
              </div>
              {formData.is_free ? <ToggleRight className="w-6 h-6 text-blue-500" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => handleInputChange("is_popular", !formData.is_popular)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white flex items-center gap-1">Mark Popular <Star className="w-3 h-3 text-amber-400" /></span>
                <span className="text-[10px] text-slate-400">Highlights package in UI</span>
              </div>
              {formData.is_popular ? <ToggleRight className="w-6 h-6 text-amber-500" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4 active:scale-[0.98]"
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? "Save Changes" : "Create Package"}
          </button>
        </form>
      </div>
    </div>
  );
}
