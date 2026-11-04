import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  Settings,
  LogOut,
  X,
  Stethoscope,
  GraduationCap,
  History,
  Trophy,
  MessageSquare,
  Info,
  Dumbbell,
  Gift,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { UserProfile, CMSContent } from "../types";

interface SidebarProps {
  userProfile: UserProfile;
  activeScreen: "dashboard" | "bookmarks" | "admin" | "custom_admin" | "history" | "leaderboard" | "forum" | "about" | "practice" | "set_practice" | "refer_earn" | "subscription";
  setActiveScreen: (screen: "dashboard" | "bookmarks" | "admin" | "custom_admin" | "history" | "leaderboard" | "forum" | "about" | "practice" | "set_practice" | "refer_earn" | "subscription") => void;
  targetExam: string;
  setTargetExam: (exam: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onEditProfile?: () => void;
  cmsContent: CMSContent;
  dbExams?: any[];
}

/** Generate initials avatar color from name */
function getAvatarInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = [
    "bg-emerald-600", "bg-violet-600", "bg-blue-600",
    "bg-amber-600", "bg-rose-600", "bg-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",           icon: LayoutDashboard, color: "" },
  { id: "set_practice", label: "Set Practice",         icon: BookOpen,        color: "text-emerald-400" },
  { id: "practice",     label: "Subject Practice",     icon: Dumbbell,        color: "text-violet-400" },
  { id: "bookmarks",    label: "Saved Questions",      icon: Bookmark,        color: "" },
  { id: "history",      label: "My Report",            icon: History,         color: "" },
  { id: "leaderboard",  label: "Leaderboard",          icon: Trophy,          color: "text-amber-400" },
  { id: "forum",        label: "Discussion",           icon: MessageSquare,   color: "text-sky-400", badge: "Live" },
  { id: "refer_earn",   label: "Refer & Earn",         icon: Gift,            color: "text-rose-400" },
  { id: "about",        label: "About & Support",      icon: Info,            color: "text-emerald-400" },
];

export default function Sidebar({
  userProfile,
  activeScreen,
  setActiveScreen,
  targetExam,
  setTargetExam,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  isCollapsed = false,
  setIsCollapsed,
  onEditProfile,
  cmsContent,
  dbExams: dbExamsProp = [],
}: SidebarProps) {
  const [dbExams, setDbExams] = React.useState<any[]>(dbExamsProp);
  const [examExpanded, setExamExpanded] = React.useState(false);

  React.useEffect(() => {
    if (dbExamsProp && dbExamsProp.length > 0) setDbExams(dbExamsProp);
  }, [dbExamsProp]);

  React.useEffect(() => {
    if (dbExams.length === 0) {
      fetch("/api/exams")
        .then((res) => res.json())
        .then((data) => {
          if (data.status && Array.isArray(data.exams)) setDbExams(data.exams);
        })
        .catch((err) => console.error("Failed to load exams in sidebar:", err));
    }
  }, [dbExams]);

  const examOptions = React.useMemo(() => {
    if (dbExams.length > 0) {
      return dbExams.map((exam) => ({
        value: exam.slug || String(exam.id),
        label: exam.name,
        shortLabel: exam.short_name || exam.name.split(" ")[0],
      }));
    }
    return [
      { value: "mec-ug",  label: "MEC-UG (Undergraduate)",   shortLabel: "MEC-UG" },
      { value: "mec-pg",  label: "MEC-PG (Postgraduate)",    shortLabel: "MEC-PG" },
      { value: "nmcle",   label: "NMCLE (Licensing Exam)",   shortLabel: "NMCLE" },
      { value: "ku-mcq",  label: "KU MCQ (Kathmandu Univ)", shortLabel: "KU MCQ" },
      { value: "loksewa", label: "Loksewa Medical Exam",     shortLabel: "Loksewa" },
    ];
  }, [dbExams]);

  const selectedExam = examOptions.find((o) => o.value === targetExam);
  const visibleExams = examExpanded ? examOptions : examOptions.slice(0, 4);

  const avatarInitials = getAvatarInitials(userProfile.name || userProfile.email || "N");
  const avatarColorClass = getAvatarColor(userProfile.email || "nepmed");

  // Respect CMS sidebar items config if provided
  const sidebarItems = React.useMemo(() => {
    if (cmsContent.sidebarItems && cmsContent.sidebarItems.length > 0) {
      return NAV_ITEMS.filter((item) => {
        const cfg = cmsContent.sidebarItems!.find((c) => c.id === item.id);
        return cfg ? cfg.enabled : true;
      });
    }
    return NAV_ITEMS;
  }, [cmsContent.sidebarItems]);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="landscape:hidden lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 landscape:static lg:static z-50 ${
          isCollapsed ? "w-20" : "w-64"
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out h-screen ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full landscape:translate-x-0 lg:translate-x-0"
        }`}
      >
        {/* Scrollable content area */}
        <div className={`flex flex-col overflow-y-auto flex-1 ${isCollapsed ? "px-2 py-4 gap-4" : "px-3 py-5 gap-5"}`}>

          {/* Logo & Minimize Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-2.5"}`}>
              <div 
                className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
                onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
                title="NepMed Study Engine"
              >
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="font-bold text-white text-base leading-tight tracking-tight truncate">
                    {cmsContent.brandName}
                  </h2>
                  <span className="text-slate-500 text-[10px] font-medium block truncate">Medical Exam Prep</span>
                </div>
              )}
            </div>

            {/* Desktop Minimize Button */}
            {!isCollapsed && setIsCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden landscape:flex lg:flex text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Minimize sidebar"
                aria-label="Minimize sidebar"
              >
                <PanelLeftClose className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Mobile close button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="landscape:hidden lg:hidden text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collapsed Mode Expand Button */}
          {isCollapsed && setIsCollapsed && (
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          )}

          {/* Exam Switcher */}
          {!isCollapsed ? (
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Exam</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleExams.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTargetExam(opt.value);
                      setActiveScreen("dashboard");
                    }}
                    title={opt.label}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      targetExam === opt.value
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
                {examOptions.length > 4 && (
                  <button
                    onClick={() => setExamExpanded(!examExpanded)}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    {examExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              {selectedExam && (
                <p className="text-[10px] text-slate-500 leading-snug truncate">{selectedExam.label}</p>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                title={`Target: ${selectedExam?.label || targetExam}`}
                className="w-10 h-10 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-[10px] font-black text-emerald-400 uppercase tracking-tight cursor-default"
              >
                {selectedExam?.shortLabel?.slice(0, 3) || targetExam.slice(0, 3)}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-2 mb-2">Menu</p>
            )}
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              
              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id as any);
                      setIsSidebarOpen(false);
                    }}
                    title={item.label}
                    className={`w-full flex items-center justify-center p-3 rounded-xl transition-all cursor-pointer relative group ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-400" : item.color || "text-slate-400 group-hover:text-white"}`} />
                    {item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveScreen(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : item.color || "text-slate-500 group-hover:text-white"}`} />
                  <span className="flex-1 text-left text-[13px]">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-md uppercase">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom user card */}
        <div className={`border-t border-slate-800 bg-slate-950/40 ${isCollapsed ? "p-2 space-y-2 flex flex-col items-center" : "p-3 space-y-3"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 mb-2">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 shrink-0 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full ${avatarColorClass} flex items-center justify-center shrink-0 text-white text-xs font-bold`}>
                    {avatarInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">
                    {userProfile.name || "Student"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {userProfile.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {onEditProfile && (
                  <button
                    onClick={onEditProfile}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className={`bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-400 font-medium py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 ${!onEditProfile ? "col-span-2" : ""}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt="Avatar"
                  title={userProfile.name || userProfile.email}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover cursor-pointer"
                  onClick={onEditProfile}
                />
              ) : (
                <div 
                  title={userProfile.name || userProfile.email}
                  onClick={onEditProfile}
                  className={`w-8 h-8 rounded-full ${avatarColorClass} flex items-center justify-center text-white text-xs font-bold cursor-pointer`}
                >
                  {avatarInitials}
                </div>
              )}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/15 hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
