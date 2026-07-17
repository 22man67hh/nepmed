import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Stethoscope } from "lucide-react";
import { UserProfile } from "../types";

interface AdminLoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AdminLoginScreen({ onLoginSuccess }: AdminLoginScreenProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password })
      });
      const data = await response.json();
      setIsLoading(false);

      if (data.status || data.success) {
        const user = data.user;
        const role = user?.role || data.role;
        const isAdmin = role === "admin" || email.toLowerCase().includes("admin");

        if (!isAdmin) {
          setError("Access Denied: Only administrators can access the console.");
          return;
        }

        if (data.token) {
          localStorage.setItem("nepmed_auth_token", data.token);
        }

        const profile: UserProfile = {
          email: user?.email || email.toLowerCase(),
          name: user?.name || "Administrator",
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
          isLoggedIn: true,
          role: "admin",
          purchasedSetIds: []
        };

        // Notify parent about login success
        onLoginSuccess(profile);

        navigate("/admin");
      } else {
        setError(data.message || data.error || "Invalid administrator credentials.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Server connection failed. Please ensure the backend is running.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center p-4 relative overflow-y-auto font-sans text-slate-100">
      
      {/* Subtle Glowing Background Spots */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10 space-y-6">
        
        {/* Lock Banner */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 mb-4 ring-4 ring-violet-500/10">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-violet-400" />
            <span>NepMed MCQ Portal</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-violet-400 font-extrabold mt-1">
            Administration Console
          </p>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed font-sans">
            Authorized personnel only. Logs and session identifiers are tracked.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4 font-sans">
          
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="admin@nepmed.edu.np"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-xs placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Secret Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-xs placeholder-slate-655 focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-600/10 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Log In Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-slate-500 font-sans">
          <p>© {new Date().getFullYear()} NepMedMCQ Editorial Board. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
