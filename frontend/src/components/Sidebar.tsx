/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Bookmark, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Stethoscope, 
  GraduationCap, 
  ShieldAlert, 
  FolderLock,
  History,
  Trophy,
  MessageSquare,
  Info,
  Dumbbell,
  CreditCard,
  Gift,
  Sliders
} from "lucide-react";
import { UserProfile, CMSContent } from "../types";

interface SidebarProps {
  userProfile: UserProfile;
  activeScreen: "dashboard" | "bookmarks" | "admin" | "custom_admin" | "history" | "leaderboard" | "forum" | "about" | "practice" | "set_practice" | "refer_earn";
  setActiveScreen: (screen: "dashboard" | "bookmarks" | "admin" | "custom_admin" | "history" | "leaderboard" | "forum" | "about" | "practice" | "set_practice" | "refer_earn") => void;
  targetExam: string;
  setTargetExam: (exam: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onEditProfile?: () => void;
  cmsContent: CMSContent;
  dbExams?: any[];
}

export default function Sidebar({
  userProfile,
  activeScreen,
  setActiveScreen,
  targetExam,
  setTargetExam,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  onEditProfile,
  cmsContent,
  dbExams: dbExamsProp = []
}: SidebarProps) {
  const [dbExams, setDbExams] = React.useState<any[]>(dbExamsProp);

  React.useEffect(() => {
    if (dbExamsProp && dbExamsProp.length > 0) {
      setDbExams(dbExamsProp);
    }
  }, [dbExamsProp]);

  React.useEffect(() => {
    if (dbExams.length === 0) {
      fetch("/api/exams")
        .then(res => res.json())
        .then(data => {
          if (data.status && Array.isArray(data.exams)) {
            setDbExams(data.exams);
          }
        })
        .catch(err => console.error("Failed to load exams in sidebar:", err));
    }
  }, [dbExams]);

  const examOptions = React.useMemo(() => {
    if (dbExams.length > 0) {
      return dbExams.map(exam => ({
        value: exam.slug || exam.id,
        label: exam.name
      }));
    }
    return [
      { value: "mec-ug", label: "MEC-UG (Undergraduate)" },
      { value: "mec-pg", label: "MEC-PG (Postgraduate)" },
      { value: "nmcle", label: "NMCLE (Licensing Exam)" },
      { value: "ku-mcq", label: "KU MCQ (Kathmandu Univ)" },
      { value: "loksewa", label: "Loksewa Medical Exam" }
    ];
  }, [dbExams]);

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetExam(e.target.value);
    setActiveScreen("dashboard"); // Go back to dashboard on exam change
  };

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="landscape:hidden lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Actual Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 landscape:static lg:static z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 h-screen ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full landscape:translate-x-0 lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col overflow-y-auto flex-1 px-4 py-6">
          {/* Logo with Close button for mobile inside the panel */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <Stethoscope className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h2 className="font-bold text-white tracking-tight text-lg leading-tight">
                  {cmsContent.brandName}
                </h2>
                <span className="text-slate-500 text-xs font-medium">Study Engine</span>
              </div>
            </div>
            {/* Mobile close button inside sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="landscape:hidden lg:hidden text-slate-400 hover:text-white p-1 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Target Exam Switcher */}
          <div className="mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Target Exam
            </label>
            <select
              value={targetExam}
              onChange={handleExamChange}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {examOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Main Navigation */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Practice Menu</p>
            
            {(() => {
              const defaultItems = [
                { id: "dashboard", label: cmsContent.sidebarLabels?.dashboard || "Dashboard", enabled: true, order: 1 },
                { id: "set_practice", label: cmsContent.sidebarLabels?.set_practice || "Set wise Practice", enabled: true, order: 2 },
                { id: "practice", label: cmsContent.sidebarLabels?.practice || "Subject Wise Practice", enabled: true, order: 3 },
                { id: "bookmarks", label: cmsContent.sidebarLabels?.bookmarks || "Saved Questions", enabled: true, order: 4 },
                { id: "history", label: cmsContent.sidebarLabels?.history || "My Report", enabled: true, order: 5 },
                { id: "leaderboard", label: cmsContent.sidebarLabels?.leaderboard || "Leaderboard", enabled: true, order: 6 },
                { id: "forum", label: cmsContent.sidebarLabels?.forum || "Discussion Forum", enabled: true, order: 7 },
                // { id: "subscription", label: cmsContent.sidebarLabels?.subscription || "Premium Subscription", enabled: false, order: 8 },
                { id: "refer_earn", label: cmsContent.sidebarLabels?.refer_earn || "Refer & Earn", enabled: true, order: 9 },
                { id: "about", label: cmsContent.sidebarLabels?.about || "About Us & Support", enabled: true, order: 10 }
              ];

              const configuredItems = cmsContent.sidebarItems && cmsContent.sidebarItems.length > 0
                ? cmsContent.sidebarItems.filter(item => item.id !== "admin")
                : defaultItems;

              const sortedItems = [...configuredItems]
                .filter(item => item.enabled)
                .sort((a, b) => a.order - b.order);

              return sortedItems.map((item) => {
                const getSidebarIcon = (id: string) => {
                  switch (id) {
                    case "dashboard": return <LayoutDashboard className="w-4 h-4 shrink-0" />;
                    case "set_practice": return <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />;
                    case "practice": return <Dumbbell className="w-4 h-4 shrink-0 text-violet-400" />;
                    case "bookmarks": return <Bookmark className="w-4 h-4 shrink-0" />;
                    case "history": return <History className="w-4 h-4 shrink-0" />;
                    case "leaderboard": return <Trophy className="w-4 h-4 shrink-0 text-amber-500" />;
                    case "forum": return <MessageSquare className="w-4 h-4 shrink-0 text-sky-400" />;
                    // case "subscription": return <CreditCard className="w-4 h-4 shrink-0 text-amber-400" />;
                    case "refer_earn": return <Gift className="w-4 h-4 shrink-0 text-rose-400" />;
                    case "about": return <Info className="w-4 h-4 shrink-0 text-emerald-400" />;
                    default: return <LayoutDashboard className="w-4 h-4 shrink-0" />;
                  }
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id as any);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      activeScreen === item.id
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent"
                    }`}
                  >
                    {getSidebarIcon(item.id)}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "forum" && (
                      <span className="text-[9px] font-bold bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded uppercase">Live</span>
                    )}
                  </button>
                );
              });
            })()}
          </div>

        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={userProfile.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=nepmed"}
              alt="Avatar"
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {userProfile.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {userProfile.email}
              </p>
              {(userProfile.sex || userProfile.age) && (
                <p className="text-[9px] text-emerald-400 font-extrabold uppercase mt-1">
                  {userProfile.sex || "Male"} • Age {userProfile.age || "N/A"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-800"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className={`bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${!onEditProfile ? 'col-span-2' : ''}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
