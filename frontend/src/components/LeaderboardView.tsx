/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { 
  Trophy, 
  Medal, 
  Search, 
  TrendingUp, 
  Target, 
  Award, 
  Zap, 
  Sparkles,
  MapPin,
  ChevronRight,
  User,
  History
} from "lucide-react";
import { UserProfile, UserProgress, CMSContent } from "../types";

interface LeaderboardViewProps {
  userProfile: UserProfile;
  progressList: UserProgress[];
  onNavigateToDashboard: () => void;
  cmsContent: CMSContent;
}

interface LeaderboardEntry {
  rank?: number;
  name: string;
  avatarUrl: string;
  totalCorrect: number;
  testsCompleted: number;
  accuracy: number;
  isCurrentUser?: boolean;
  city: string;
}

export default function LeaderboardView({
  userProfile,
  progressList,
  onNavigateToDashboard,
  cmsContent
}: LeaderboardViewProps) {
  // Competitor data is fully customizable from Admin Control Panel
  const mockCompetitors = useMemo<LeaderboardEntry[]>(() => {
    const raw = cmsContent.leaderboardConfig?.competitors || [
      { name: "Dr. Sandeep Adhikari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sandeep", totalCorrect: 285, testsCompleted: 15, accuracy: 92, city: "Kathmandu" },
      { name: "Pooja Shrestha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja", totalCorrect: 242, testsCompleted: 13, accuracy: 88, city: "Lalitpur" },
      { name: "Sushant Thapa", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sushant", totalCorrect: 215, testsCompleted: 11, accuracy: 86, city: "Pokhara" },
      { name: "Aayushma Bhandari", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aayushma", totalCorrect: 198, testsCompleted: 12, accuracy: 81, city: "Biratnagar" },
      { name: "Dr. Ramesh Kushwaha", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh", totalCorrect: 184, testsCompleted: 10, accuracy: 84, city: "Janakpur" },
      { name: "Niranjan Chaudhary", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Niranjan", totalCorrect: 172, testsCompleted: 9, accuracy: 79, city: "Butwal" },
      { name: "Samikshya Devkota", avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Samikshya", totalCorrect: 158, testsCompleted: 8, accuracy: 82, city: "Chitwan" },
    ];
    return raw.filter((comp: any) => comp.enabled !== false);
  }, [cmsContent]);

  const mergedLeaderboard = useMemo(() => {
    // Calculate current user stats from their progress history
    const userTestsCount = progressList.length;
    const userTotalCorrect = progressList.reduce((sum, p) => sum + p.correctAnswersCount, 0);
    const userTotalQuestions = progressList.reduce((sum, p) => sum + p.totalQuestions, 0);
    const userAvgAccuracy = userTotalQuestions > 0 ? Math.round((userTotalCorrect / userTotalQuestions) * 100) : 0;

    const currentUserEntry: LeaderboardEntry = {
      name: userProfile.name || "You (Candidate)",
      avatarUrl: userProfile.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=nepmed",
      totalCorrect: userTotalCorrect,
      testsCompleted: userTestsCount,
      accuracy: userAvgAccuracy,
      isCurrentUser: true,
      city: "Nepal (Simulator)"
    };

    // Merge & Sort by totalCorrect, then by accuracy
    const allEntries = [...mockCompetitors, currentUserEntry];
    allEntries.sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      }
      return b.accuracy - a.accuracy;
    });

    // Assign rank
    return allEntries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));
  }, [progressList, userProfile, mockCompetitors]);

  // Extract top 3 for the podium
  const podium = useMemo(() => {
    const top3 = mergedLeaderboard.slice(0, 3);
    // Order as [2nd, 1st, 3rd] for classic visual podium placement
    const result: (LeaderboardEntry & { rank: number })[] = [];
    if (top3[1]) result.push(top3[1] as any);
    if (top3[0]) result.push(top3[0] as any);
    if (top3[2]) result.push(top3[2] as any);
    return result;
  }, [mergedLeaderboard]);

  const listEntries = useMemo(() => {
    return mergedLeaderboard.slice(3);
  }, [mergedLeaderboard]);

  const currentUserRankInfo = useMemo(() => {
    return mergedLeaderboard.find(e => e.isCurrentUser);
  }, [mergedLeaderboard]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 lg:p-6 text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-amber-400 font-semibold text-xs tracking-wider uppercase block mb-1">
            {cmsContent.leaderboardConfig?.subTitleTag || "National Medical Exam Standings"}
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            {cmsContent.leaderboardConfig?.title || "Prep Leaderboard"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {cmsContent.leaderboardConfig?.subtitle || "See how your total correct MCQ counts stack up against Nepal's top licensing and entrance candidates."}
          </p>
        </div>
        <button
          onClick={onNavigateToDashboard}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Podium Visualization */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto pt-8 items-end">
        {podium.map((candidate) => {
          const isFirst = candidate.rank === 1;
          const isSecond = candidate.rank === 2;
          const isThird = candidate.rank === 3;

          return (
            <div 
              key={candidate.rank} 
              className={`flex flex-col items-center text-center space-y-3 relative ${
                isFirst ? "z-10 -translate-y-4" : ""
              }`}
            >
              {/* Avatar Frame with Rank Crown */}
              <div className="relative">
                <img 
                  src={candidate.avatarUrl} 
                  alt={candidate.name} 
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full border bg-slate-800 object-cover ${
                    isFirst 
                      ? "border-amber-400 ring-4 ring-amber-400/20" 
                      : isSecond 
                        ? "border-slate-300 ring-4 ring-slate-300/10" 
                        : "border-amber-700 ring-4 ring-amber-700/10"
                  } ${candidate.isCurrentUser ? "animate-pulse" : ""}`}
                />
                <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg ${
                  isFirst 
                    ? "bg-amber-400 text-slate-950" 
                    : isSecond 
                      ? "bg-slate-300 text-slate-950" 
                      : "bg-amber-700 text-white"
                }`}>
                  {candidate.rank}
                </span>
              </div>

              {/* Podium Column Blocks */}
              <div className={`w-full rounded-t-2xl border-t border-x px-2 py-4 flex flex-col items-center justify-between shadow-2xl ${
                isFirst 
                  ? "bg-gradient-to-b from-amber-500/10 to-slate-900/40 border-amber-500/30 h-36" 
                  : isSecond 
                    ? "bg-gradient-to-b from-slate-300/10 to-slate-900/40 border-slate-400/20 h-28" 
                    : "bg-gradient-to-b from-amber-700/10 to-slate-900/40 border-amber-800/20 h-24"
              }`}>
                <div className="min-w-0 w-full text-center">
                  <p className={`text-xs font-bold truncate ${candidate.isCurrentUser ? "text-emerald-400" : "text-white"}`}>
                    {candidate.isCurrentUser ? "You" : candidate.name.split(" ")[1] || candidate.name}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{candidate.city}</span>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-sm font-black text-white">{candidate.totalCorrect}</p>
                  <p className="text-[8px] text-slate-500 uppercase font-mono tracking-wider">Correct MCQs</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current User Floating Standing */}
      {currentUserRankInfo && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">
              #{currentUserRankInfo.rank}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Your Current Simulation Standings
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                You have correctly solved <strong className="text-white">{currentUserRankInfo.totalCorrect} MCQs</strong> across <strong className="text-white">{currentUserRankInfo.testsCompleted} sessions</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400">Avg Accuracy</span>
              <p className="text-base font-black text-emerald-400">{currentUserRankInfo.accuracy}%</p>
            </div>
            <button
              onClick={onNavigateToDashboard}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Solve More MCQs
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Competitor List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Medal className="w-4 h-4 text-emerald-400" />
            General Arena Standings
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
            UPDATES LIVE
          </span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {listEntries.map((candidate, idx) => (
            <div 
              key={candidate.rank} 
              className={`px-6 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                candidate.isCurrentUser ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-slate-800/20"
              }`}
            >
              {/* Rank and Candidate Profile */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-6 text-xs font-mono font-bold text-slate-500 text-center">
                  #{candidate.rank}
                </span>
                <img 
                  src={candidate.avatarUrl} 
                  alt={candidate.name} 
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover"
                />
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${candidate.isCurrentUser ? "text-emerald-400" : "text-white"}`}>
                    {candidate.name} {candidate.isCurrentUser && <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded ml-1">YOU</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-600" /> {candidate.city}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-6 shrink-0 text-right">
                <div>
                  <p className="text-xs text-slate-500 font-mono">Completed</p>
                  <p className="text-xs font-bold text-slate-300">{candidate.testsCompleted} Tests</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-mono">Accuracy</p>
                  <p className="text-xs font-bold text-slate-300">{candidate.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-bold">{candidate.totalCorrect}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Solved</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
