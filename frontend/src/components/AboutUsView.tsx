/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Mail, 
  MapPin, 
  Phone, 
  Send, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Stethoscope, 
  BookOpen, 
  ShieldAlert, 
  Info 
} from "lucide-react";
import { UserProfile, CMSContent } from "../types";

interface TicketItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

interface AboutUsViewProps {
  userProfile: UserProfile;
  cmsContent: CMSContent;
  dbTeams?: any[];
}

export default function AboutUsView({ userProfile, cmsContent, dbTeams = [] }: AboutUsViewProps) {
  // Contact Form / Ticket Form States
  const [ticketName, setTicketName] = useState(userProfile.name || "");
  const [ticketEmail, setTicketEmail] = useState(userProfile.email || "");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("General Inquiry");
  const [ticketMessage, setTicketMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Existing Tickets list (fetched from server)
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch("/api/support/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!ticketName || !ticketEmail || !ticketSubject || !ticketMessage) {
      setErrorMessage("Please fill in all required fields to submit your inquiry.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ticketName,
          email: ticketEmail,
          subject: ticketSubject,
          category: ticketCategory,
          message: ticketMessage
        })
      });

      if (response.ok) {
        setSuccessMessage("Your message/ticket has been opened successfully! Our medical editorial team will respond to you within 24 hours.");
        setTicketSubject("");
        setTicketMessage("");
        fetchTickets(); // Refresh ticket list
      } else {
        const errData = await response.json();
        setErrorMessage(errData.error || "Failed to submit ticket.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe fallback to CMS config or default array
  const teamList = dbTeams.length > 0 
    ? dbTeams.filter((t: any) => t.status !== "inactive").map((t: any) => ({
        ...t,
        role: t.designation || t.role,
        avatar: t.image ? (t.image.startsWith('http') ? t.image : `${t.image}`) : t.avatarUrl,
        institution: t.hospital || t.institution,
      }))
    : (cmsContent?.editorialTeam || []).filter((member: any) => member.enabled !== false);
  const supportConfig = cmsContent?.supportConfig || {};
  const officeVal = supportConfig.officeText || supportConfig.OfficeText || cmsContent?.officeText || "Bagbazar, Kathmandu, Nepal\n(Near Medical Council)";
  const emailVal = supportConfig.emailText || supportConfig.EmailText || cmsContent?.emailText || "support@prepzaa.com";
  const phoneVal = supportConfig.phoneText || supportConfig.PhoneText || cmsContent?.phoneText || "+977-9800000000\nMon - Fri: 10:00 AM - 5:00 PM";

  const defaultLabels = {
    heroTitle: "About PrepzaNepal Editorial Board",
    heroDescription: "PrepzaNepal is Nepal's premier full-stack interactive medical education engine. We are dedicated to providing high-yield multiple choice test questions, detailed clinical rationales, and memory mnemonics meticulously aligned with the standards of the Medical Education Commission (MEC) and the Nepal Medical Council (NMC) licensing examinations.",
    teamTitle: "Our Eminent Editorial Board",
    contactTitle: "Organization Contact Info",
    contactDescription: "",
    officeTitle: "Our Office Address",
    officeText: officeVal,
    emailTitle: "Email Addresses",
    emailText: emailVal,
    phoneTitle: "Phone & Support Hours",
    phoneText: phoneVal
  };

  const userLabels = cmsContent?.aboutUsLabels || {};
  const labels: any = { ...defaultLabels };
  Object.keys(userLabels).forEach(key => {
    if (userLabels[key]) {
      labels[key] = userLabels[key];
    }
  });
  return (
    <div id="about-us-container" className="space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
          <Info className="w-10 h-10" />
        </div>
        
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-white font-sans">
            {labels.heroTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
            {labels.heroDescription}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editorial Team List (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">{labels.teamTitle}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamList.map((member, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex flex-col items-center text-center hover:border-slate-700/80 transition-colors">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 bg-slate-800 rounded-xl border border-slate-700/60 p-1 mb-3.5 object-cover" 
                />
                <h4 className="text-sm font-bold text-white leading-snug">{member.name}</h4>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">{member.role}</p>
                <p className="text-[10px] text-slate-300 mt-1.5 leading-normal">{member.institution}</p>
                <div className="mt-3.5 pt-2 border-t border-slate-800/80 w-full">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Expertise</p>
                  <p className="text-[10px] text-slate-300 font-mono mt-1 font-sans">{member.specialty}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Coordinates */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{labels.contactTitle}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {labels.contactDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">{labels.officeTitle}</p>
                  <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {labels.officeText}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">{labels.emailTitle}</p>
                  <p className="text-slate-300 mt-0.5 text-[11px] whitespace-pre-wrap leading-relaxed">
                    {labels.emailText}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 col-span-1 sm:col-span-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">{labels.phoneTitle}</p>
                  <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {labels.phoneText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Tickets & Send Message Form (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Send Us Message / Open Support Ticket</h3>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Inquiry Ticket Dispatch</h4>
              <p className="text-xs text-slate-300 mt-1 leading-normal">
                Open a ticket directly to our database. Our editors will review and resolve technical or syllabus questions.
              </p>
            </div>

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-400 text-xs flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Name</label>
                  <input 
                    type="text" 
                    value={ticketName} 
                    onChange={(e) => setTicketName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Dr. Sunil Subedi"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Email</label>
                  <input 
                    type="email" 
                    value={ticketEmail} 
                    onChange={(e) => setTicketEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="you@PrepzaNepal.app"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Inquiry Topic Category</label>
                  <select 
                    value={ticketCategory} 
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Subscription Issue">Subscription & Activation</option>
                    <option value="Technical Bug">Technical & Server Issues</option>
                    <option value="Question Correction">MCQ Correction Feedback</option>
                    <option value="Partnership">Institutional Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={ticketSubject} 
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Subscription activation issue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Describe Your Message / Issue Detail</label>
                <textarea 
                  rows={4} 
                  value={ticketMessage} 
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Provide precise details here..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Secure Message Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* MY TICKETS MONITOR SECTION */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Your Logged Support Tickets</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Durable server-synced tickets under your email.
                </p>
              </div>
              <button 
                onClick={fetchTickets}
                disabled={loadingTickets}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                title="Refresh Tickets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingTickets && tickets.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                Loading support database...
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-5 text-slate-500 text-xs italic">
                No tickets opened yet. Submit the form above to log your first ticket.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 truncate max-w-[150px]">{t.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        t.status === "open" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{t.message}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/40">
                      <span>Cat: {t.category}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
