import React, { useState } from "react";
import { 
  Crown, 
  Sparkles, 
  Mail, 
  Linkedin, 
  Twitter, 
  Globe, 
  Github, 
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  Award,
  Edit3,
  Check,
  X
} from "lucide-react";
import { CMSContent } from "../types";

interface LeadershipCardsProps {
  editorialTeam?: CMSContent["editorialTeam"];
  isDark?: boolean;
  onUpdateTeam?: (updatedTeam: CMSContent["editorialTeam"]) => void;
  canEdit?: boolean;
}

export const LeadershipCards: React.FC<LeadershipCardsProps> = ({
  editorialTeam = [],
  isDark = true,
  onUpdateTeam,
  canEdit = false
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // If no team members passed, use high quality defaults
  const team = editorialTeam.length > 0 ? editorialTeam : [
    {
      name: "Dr. Sunil Subedi",
      role: "Founder & Chief Editor",
      badge: "Founder",
      isFounder: true,
      tags: [
        "Founder",
        "Chief Editor",
        "ECFMG Certified Physician"
      ],
      institution: "College of Medical Sciences (COMS)/ Shishuwa Hospital",
      
      specialty: "",
      bio: "A physician and medical educator dedicated to helping students and healthcare professionals succeed in competitive medical examinations through evidence-based learning resources and innovative educational technology.",
      socialLinks: {
        email: "subedisunil982@gmail.com",
        linkedin: "https://www.linkedin.com/in/sunil-subedi-647153148",
        twitter: "https://x.com/SunilSubedi16",
        website: "https://prepzaa.com"
      },
      enabled: true
    },
    {
      name: "Dr. Suman Subedi",
      role: "Chief Editor & Consultant Orthopedic Surgeon",
      badge: "Chief Editor",
      isFounder: false,
      tags: [
        "Chief Editor",
        "Consultant Orthopedic Surgeon",
        "Academic Expert",
        "Loksewa 9th Level"
      ],
      institution: "Patan Academy of Health Sciences",
      
      specialty: "Orthopedic Surgery",
      bio: "Experienced orthopedic consultant contributing expert clinical guidance, academic oversight, and quality assurance of educational content.",
      socialLinks: {
        email: "dr.suman@prepzaa.com",
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      },
      enabled: true
    },
    {
      name: "Manish Acharya",
      role: "IT Expert & CTO",
      badge: "IT Expert",
      isFounder: false,
      tags: [
        "IT Expert"
      ],
      institution: "PrepZaa Tech",
      
      specialty: "Platform Architecture, Software Engineering, AI Integration & Digital Innovation",
      bio: "Technology specialist responsible for platform architecture, software development, automation, security, and digital innovation.",
      socialLinks: {
        email: "manish@prepzaa.com",
        linkedin: "https://linkedin.com",
        github: "https://github.com"
      },
      enabled: true
    }
  ];

  // Separate Founder from the other team members
  const founderIndex = team.findIndex(
    m => m.isFounder || 
         m.badge?.toLowerCase().includes("founder") || 
         m.tags?.some(t => t.toLowerCase() === "founder") ||
         m.name.toLowerCase().includes("sunil")
  );

  const founder = founderIndex !== -1 ? team[founderIndex] : team[0];
  const otherMembers = team.filter((_, idx) => idx !== (founderIndex !== -1 ? founderIndex : 0));

  const handleStartEdit = (member: any, index: number) => {
    setEditingIndex(index);
    setEditForm({
      ...member,
      tagsString: (member.tags || [member.role]).join(", "),
      email: member.socialLinks?.email || "",
      linkedin: member.socialLinks?.linkedin || "",
      twitter: member.socialLinks?.twitter || "",
      website: member.socialLinks?.website || "",
      github: member.socialLinks?.github || ""
    });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editForm || !onUpdateTeam) return;
    const updated = [...team];
    const tags = editForm.tagsString
      ? editForm.tagsString.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editForm.name,
      role: editForm.role,
      badge: editForm.badge,
      institution: editForm.institution,
      
      specialty: editForm.specialty,
      bio: editForm.bio,
      tags: tags.length > 0 ? tags : updated[editingIndex].tags,
      socialLinks: {
        email: editForm.email || undefined,
        linkedin: editForm.linkedin || undefined,
        twitter: editForm.twitter || undefined,
        website: editForm.website || undefined,
        github: editForm.github || undefined
      }
    };

    onUpdateTeam(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const renderDesignationTag = (tag: string, index: number, isFounderCard: boolean = false) => {
    const lower = tag.toLowerCase();
    let style = isDark 
      ? "bg-slate-800/80 text-slate-300 border-slate-700/60" 
      : "bg-slate-100 text-slate-700 border-slate-200";

    if (lower.includes("founder")) {
      style = isDark 
        ? "bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-yellow-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30 font-extrabold" 
        : "bg-amber-100 text-amber-800 border-amber-300 font-extrabold";
    } else if (lower.includes("chief") || lower.includes("editor")) {
      style = isDark 
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold" 
        : "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold";
    } else if (lower.includes("physician") || lower.includes("officer") || lower.includes("surgeon") || lower.includes("doctor")) {
      style = isDark 
        ? "bg-sky-500/15 text-sky-400 border-sky-500/30" 
        : "bg-sky-100 text-sky-800 border-sky-300";
    } else if (lower.includes("it") || lower.includes("tech") || lower.includes("expert") || lower.includes("architect")) {
      style = isDark 
        ? "bg-violet-500/15 text-violet-400 border-violet-500/30" 
        : "bg-violet-100 text-violet-800 border-violet-300";
    }

    return (
      <span
        key={index}
        className={`text-[10px] px-2 py-0.5 rounded-md border tracking-wide whitespace-nowrap transition-all shadow-sm ${style}`}
      >
        {tag}
      </span>
    );
  };

  const renderSocialLinks = (links?: any, emailOnlyFallback?: string) => {
    const email = links?.email || (emailOnlyFallback?.includes("@") ? emailOnlyFallback : null);
    const linkedin = links?.linkedin;
    const twitter = links?.twitter;
    const website = links?.website;
    const github = links?.github;

    return (
      <div className="flex items-center gap-2 pt-1">
        {email && (
          <a
            href={`mailto:${email}`}
            title={`Email: ${email}`}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10" 
                : "bg-white border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 shadow-sm"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn Profile"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10" 
                : "bg-white border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 shadow-sm"
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
          </a>
        )}
        {twitter && (
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter / X Profile"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10" 
                : "bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm"
            }`}
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            title="Personal / Academic Website"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10" 
                : "bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 shadow-sm"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
          </a>
        )}
        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub / Dev Profile"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/10" 
                : "bg-white border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 shadow-sm"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  };

  const getTagsList = (member: any) => {
    if (Array.isArray(member.tags) && member.tags.length > 0) {
      return member.tags;
    }
    // Fallback: split role by comma or provide role as single tag
    if (member.role?.includes(",")) {
      return member.role.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return [member.role || "Faculty Leader"];
  };

  return (
    <div className="space-y-6 w-full">
      {/* ========================================================= */}
      {/* 1. FOUNDER TEMPLATE (PLACED PROMINENTLY ON TOP)            */}
      {/* ========================================================= */}
      {founder && (
        <div
          id="founder-profile-card"
          className={`relative overflow-hidden rounded-2xl p-5 md:p-6 transition-all duration-300 border max-w-2xl md:max-w-4xl mx-auto w-full ${
            isDark
              ? "bg-slate-900 border-slate-800 hover:border-amber-500/30 shadow-2xl shadow-amber-950/20"
              : "bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-amber-200"
          }`}
        >
          {/* Subtle Ambient Glowing Backdrops (Scaled Down) */}
          {isDark && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none opacity-50" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none opacity-30" />
            </>
          )}

          {/* Golden Founder Badge at Top Right */}
          <div className="flex justify-between items-start mb-4 relative z-10 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                Executive Leadership
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* GOLDEN FOUNDER BADGE */}
              <div
                id="golden-founder-badge"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm ring-1 ${
                  isDark
                    ? "bg-gradient-to-r from-amber-500/25 via-yellow-400/15 to-amber-500/25 text-amber-300 border-amber-400/40 ring-amber-300/10"
                    : "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100"
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-black tracking-wider uppercase">
                  {founder.badge || "Founder"}
                </span>
              </div>

              {canEdit && onUpdateTeam && (
                <button
                  onClick={() => handleStartEdit(founder, founderIndex !== -1 ? founderIndex : 0)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Founder Profile"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-start relative z-10">
            {/* Left Portrait Column */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative group shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
              </div>

              <h3 className={`text-base md:text-lg font-black mt-2 font-sans tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {founder.name}
              </h3>
              
              <p className={`text-[11px] font-bold mt-0.5 flex items-center gap-1 justify-center md:justify-start ${
                isDark ? "text-amber-400" : "text-amber-600"
              }`}>
                <Award className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{founder.role}</span>
              </p>

              <p className={`text-[10px] mt-1 leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {founder.institution}
              </p>

              {/* Social Links */}
              <div className="mt-2.5">
                {renderSocialLinks(founder.socialLinks, founder.socialLinks?.email)}
              </div>
            </div>

            {/* Right Details Column: Designation Tags & Biography */}
            <div className="md:col-span-8 space-y-3">
              {/* Designation Tags Section */}
              <div>
                <div className="flex items-center gap-1 mb-1 justify-center md:justify-start">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Credentials & Designations
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {getTagsList(founder).map((tag: string, tIdx: number) => 
                    renderDesignationTag(tag, tIdx, true)
                  )}
                </div>
              </div>

              {/* Biography Quote */}
              <div
                className={`p-4 rounded-xl border relative transition-all ${
                  isDark
                    ? "bg-slate-950/40 border-slate-800/60 text-slate-200 shadow-inner group-hover:border-slate-700/80"
                    : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-amber-100"
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-xl text-amber-400/50 font-serif leading-none select-none">“</span>
                  <p className={`text-xs leading-relaxed font-sans italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {founder.bio}
                  </p>
                </div>

                {founder.specialty && (
                  <div className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-[10px] ${isDark ? "border-slate-800/80" : "border-amber-100"}`}>
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[9px]">Specialty:</span>
                    <span className={isDark ? "text-slate-300" : "text-slate-600"}>{founder.specialty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. THE TWO OTHER CORE LEADERS (2-COLUMN GRID BELOW FOUNDER) */}
      {/* ========================================================= */}
      {otherMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherMembers.map((member, idx) => {
            const actualIndex = team.findIndex(m => m.name === member.name);
            const isOrthopedic = member.name.toLowerCase().includes("suman") || member.role.toLowerCase().includes("orthopedic");
            const isIT = member.name.toLowerCase().includes("manish") || member.role.toLowerCase().includes("it");

            const accentColor = isOrthopedic 
              ? "emerald" 
              : isIT 
              ? "cyan" 
              : "teal";

            return (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-2xl p-6 md:p-8 transition-all duration-300 border flex flex-col justify-between group ${
                  isDark
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-2xl shadow-slate-950/50"
                    : "bg-white border-slate-100 hover:border-teal-200 shadow-lg shadow-slate-200/40 hover:shadow-xl"
                }`}
              >
                <div>
                  {/* Top Bar with Badge & Edit */}
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shadow-sm ${
                        accentColor === "emerald"
                          ? isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : isDark ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" : "bg-cyan-100 text-cyan-800 border-cyan-300"
                      }`}
                    >
                      {member.badge || member.role.split(",")[0]}
                    </span>

                    {canEdit && onUpdateTeam && (
                      <button
                        onClick={() => handleStartEdit(member, actualIndex !== -1 ? actualIndex : idx + 1)}
                        className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-start gap-4 mb-4">
                    
                    <div className="min-w-0">
                      <h4 className={`text-base md:text-lg font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        {member.name}
                      </h4>
                      <p className={`text-xs font-bold mt-1 ${
                        accentColor === "emerald" 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-cyan-600 dark:text-cyan-400"
                      }`}>
                        {member.role}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {member.institution}
                      </p>
                    </div>
                  </div>

                  {/* Designation Tags */}
                  <div className="mb-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Designation Tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getTagsList(member).map((tag: string, tIdx: number) => 
                        renderDesignationTag(tag, tIdx, false)
                      )}
                    </div>
                  </div>

                  {/* Biography */}
                  {member.bio && (
                    <p
                      className={`text-xs italic p-3 rounded-xl border leading-relaxed transition-colors ${
                        isDark
                          ? "bg-slate-950/40 border-slate-800/60 text-slate-300 group-hover:border-slate-700/80"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      "{member.bio}"
                    </p>
                  )}
                </div>

                {/* Footer with Specialty & Social Links */}
                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Specialty: </span>
                    <span className="truncate max-w-[200px] inline-block align-bottom">{member.specialty}</span>
                  </div>
                  <div>
                    {renderSocialLinks(member.socialLinks)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* INLINE EDIT MODAL                                         */}
      {/* ========================================================= */}
      {editingIndex !== null && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit Leadership Profile Card
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingIndex(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editForm.badge || ""}
                    onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-bold"
                    placeholder="e.g. Founder, Chief Editor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Role / Title</label>
                <input
                  type="text"
                  value={editForm.role || ""}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Designation Tags (Comma-separated pills)
                </label>
                <input
                  type="text"
                  value={editForm.tagsString || ""}
                  onChange={(e) => setEditForm({ ...editForm, tagsString: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-medium"
                  placeholder="e.g. Founder, Chief Editor, Senior Medical Officer, ECFMG Certified Physician"
                />
                <p className="text-[10px] text-slate-500 mt-1">Separate individual designation badges with commas.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution / Org</label>
                  <input
                    type="text"
                    value={editForm.institution || ""}
                    onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Specialty</label>
                  <input
                    type="text"
                    value={editForm.specialty || ""}
                    onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Biography / Description</label>
                <textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Social & Contact Links</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email (e.g. dr.sunil@prepzaa.com)"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                  <input
                    type="url"
                    value={editForm.linkedin || ""}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    placeholder="LinkedIn URL"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                  <input
                    type="url"
                    value={editForm.twitter || ""}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    placeholder="Twitter/X URL"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                  <input
                    type="url"
                    value={editForm.website || ""}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="Website URL"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                  <input
                    type="url"
                    value={editForm.github || ""}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    placeholder="GitHub URL"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
