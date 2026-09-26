import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Coins, 
  CheckCircle2, 
  RefreshCw, 
  UserPlus, 
  ArrowRight, 
  Award, 
  AlertCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { UserProfile, CMSContent } from "../types";

interface ReferEarnViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  cmsContent: CMSContent;
}

export default function ReferEarnView({ 
  userProfile, 
  setUserProfile, 
  cmsContent 
}: ReferEarnViewProps) {
  // Use CMS config with beautiful default fallback values
  const referConfig = cmsContent.referEarnConfig || {
    title: "Refer Friends, Earn Cash & Points!",
    subtitle: "Invite other medical students/doctors to PrepzaNepal. Get rewarded instantly upon registration and subscription purchase.",
    pointsPerReg: 50,
    pointsPerSub: 500,
    promoMessage: "Hey! Check out PrepzaNepal, Nepal's best app for MECEE and Licensing MCQs. Use my code to register and get bonus access!",
    rules: [
      "Share your unique custom referral link or code with friends.",
      "Get 50 points as soon as they register their verified account.",
      "Get 500 premium points if they upgrade to any of the unlimited board preparation packages.",
      "Redeem points directly to unlock individual premium exam sets or extend your current pass!"
    ]
  };

  // State
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Custom Simulator Sandbox States
  const [friendEmail, setFriendEmail] = useState("");
  const [friendUpgrades, setFriendUpgrades] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState("");

  // Point redemption feedback states
  const [redemptionSuccess, setRedemptionSuccess] = useState("");
  const [redemptionError, setRedemptionError] = useState("");

  // Initialize referral code if missing
  useEffect(() => {
    if (!userProfile.referralCode) {
      const initials = (userProfile.name || "USER").substring(0, 4).toUpperCase().replace(/\s/g, "");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `NEP-${initials}-${randomNum}`;
      
      setUserProfile(prev => {
        const updated = {
          ...prev,
          referralCode: generatedCode,
          rewardPoints: prev.rewardPoints !== undefined ? prev.rewardPoints : 100, // Initial balance
          referLog: prev.referLog || []
        };
        localStorage.setItem("nepmed_user_profile", JSON.stringify(updated));
        return updated;
      });
    }
  }, [userProfile.referralCode]);

  const referralCode = userProfile.referralCode || "NEPMED-BOOSTER";
  const pointsBalance = userProfile.rewardPoints ?? 100;
  const referLogs = userProfile.referLog || [];

  const shareLink = `https://PrepzaNepal.edu.np/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Simulator to let the user invite a mock friend and actually earn real points!
  const handleSimulateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim() || !friendEmail.includes("@")) {
      alert("Please enter a valid email address to simulate registration.");
      return;
    }

    // Check if duplicate simulation
    if (referLogs.some(log => log.friendEmail.toLowerCase() === friendEmail.toLowerCase().trim())) {
      alert("This friend has already registered using your code in this session!");
      return;
    }

    setIsSimulating(true);
    setSimulationSuccess("");

    setTimeout(() => {
      const pointsToAdd = friendUpgrades 
        ? referConfig.pointsPerReg + referConfig.pointsPerSub 
        : referConfig.pointsPerReg;
      
      const newLogs = [
        {
          friendEmail: friendEmail.trim(),
          pointsEarned: pointsToAdd,
          type: friendUpgrades ? ("subscription" as const) : ("registration" as const),
          date: new Date().toISOString()
        },
        ...referLogs
      ];

      setUserProfile(prev => {
        const updated = {
          ...prev,
          rewardPoints: (prev.rewardPoints ?? 100) + pointsToAdd,
          referLog: newLogs
        };
        localStorage.setItem("nepmed_user_profile", JSON.stringify(updated));
        return updated;
      });

      setIsSimulating(false);
      setSimulationSuccess(`Successfully simulated registration! Awarded +${pointsToAdd} Points to your balance.`);
      setFriendEmail("");
      setFriendUpgrades(false);
      setTimeout(() => setSimulationSuccess(""), 5000);
    }, 1500);
  };

  // Redeem Reward points to actually extend premium subscription!
  const handleRedeemPoints = (cost: number, daysToExtend: number) => {
    setRedemptionError("");
    setRedemptionSuccess("");

    if (pointsBalance < cost) {
      setRedemptionError(`Insufficient balance. You need at least ${cost} reward points to redeem this pass.`);
      return;
    }

    // Deduct points and extend subscription!
    const currentExpiry = userProfile.subscription?.expiresAt 
      ? new Date(userProfile.subscription.expiresAt) 
      : new Date();
    
    currentExpiry.setDate(currentExpiry.getDate() + daysToExtend);

    setUserProfile(prev => {
      const updated = {
        ...prev,
        rewardPoints: (prev.rewardPoints ?? 100) - cost,
        subscription: {
          examType: "All Premium Modules (Redeemed)",
          expiresAt: currentExpiry.toISOString()
        }
      };
      localStorage.setItem("nepmed_user_profile", JSON.stringify(updated));
      return updated;
    });

    setRedemptionSuccess(`Success! Subscribed for an additional ${daysToExtend} days of Premium MCQ Pass.`);
    setTimeout(() => setRedemptionSuccess(""), 5000);
  };

  return (
    <div id="refer-earn-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-white">
      
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-[#dff1e8] text-[#0f172a] border border-emerald-200/60 rounded-3xl p-6 md:p-10 shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/10 border border-emerald-600/20 rounded-full text-xs font-black text-emerald-800 uppercase tracking-widest">
            <Gift className="w-3.5 h-3.5" />
            <span>Referral Program</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            {referConfig.title}
          </h1>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            {referConfig.subtitle}
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <div className="bg-white/60 backdrop-blur-sm border border-emerald-200/50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <Coins className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider leading-tight">Your Reward Points</p>
                <p className="text-lg font-black text-emerald-800">{pointsBalance} Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Refer Block (Left) & Sandbox Simulator / Redemption (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Share Codes, rules, and logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Share Block */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-6">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>🔗</span> Share Your Custom Referral Access
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Code */}
              <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Your Unique Code</span>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <span className="font-mono text-sm font-black text-rose-400 select-all">{referralCode}</span>
                  <button 
                    onClick={handleCopyCode}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Box 2: Link */}
              <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Your Referral Invite Link</span>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-xs text-slate-400 font-medium truncate pr-4">{shareLink}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Social Text Copy */}
            <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Default Invite Text Message</span>
              <p className="text-xs text-slate-300 leading-normal italic bg-slate-900/60 p-3 rounded-lg border border-slate-850/50">
                "{referConfig.promoMessage}"
              </p>
            </div>
          </div>

          {/* Program Rules */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>📋</span> Referral Program Rules & Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referConfig.rules.map((rule, idx) => (
                <div key={idx} className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">Step {idx + 1}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Logs History */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>👥</span> Your Successful Referrals ({referLogs.length})
            </h2>

            {referLogs.length === 0 ? (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-850/60 text-center space-y-2 text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No referrals registered yet.</p>
                <p className="text-[11px] text-slate-500">Share your custom referral code or simulate signup in the right panel to test live!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto pr-2">
                {referLogs.map((log, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {log.friendEmail[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white font-mono">{log.friendEmail}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                        log.type === "subscription" 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {log.type === "subscription" ? "Upgraded Premium" : "Registered Only"}
                      </span>
                      <span className="text-xs font-black text-amber-400">+{log.pointsEarned} Points</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Reward point redemption (Redeem) & Sandbox simulator */}
        <div className="space-y-6">
          
          {/* Box 1: Redeem points */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>🎁</span> Redeem Points for Passes
            </h2>
            <p className="text-xs text-slate-400">Redeem accumulated referral reward points instantly to unlock premium prep access.</p>

            {redemptionSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg font-semibold">
                {redemptionSuccess}
              </div>
            )}

            {redemptionError && (
              <div className="bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg font-semibold">
                {redemptionError}
              </div>
            )}

            <div className="space-y-3">
              {[
                { cost: 100, days: 2, title: "2 Days Premium Booster", badge: "Fast Track" },
                { cost: 300, days: 7, title: "7 Days Unlimited Pass", badge: "Weekly Gold" },
                { cost: 800, days: 30, title: "30 Days Comprehensive Pass", badge: "Mastery Crown" }
              ].map((reward) => (
                <div key={reward.days} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {reward.badge}
                    </span>
                    <h4 className="text-xs font-bold text-white pt-1">{reward.title}</h4>
                    <span className="text-[10px] text-slate-500 block">Cost: {reward.cost} Points</span>
                  </div>
                  <button
                    onClick={() => handleRedeemPoints(reward.cost, reward.days)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-extrabold cursor-pointer transition-colors ${
                      pointsBalance >= reward.cost 
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10" 
                        : "bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed"
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Sandbox Referral Simulator */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>⚙️</span> Live Referral Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Test your referral rewards program flow here! Type a simulated friend's email address to instantly mock a registered signup with your code.
            </p>

            {simulationSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg font-semibold">
                {simulationSuccess}
              </div>
            )}

            <form onSubmit={handleSimulateInvitation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Friend's Email Address</label>
                <input
                  type="email"
                  required
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="e.g. medicalfriend@ioom.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="friendUpgrades"
                  checked={friendUpgrades}
                  onChange={(e) => setFriendUpgrades(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-rose-500 focus:ring-0"
                />
                <label htmlFor="friendUpgrades" className="text-xs text-slate-300 font-bold cursor-pointer select-none">
                  Simulate friend paying for subscription (+{referConfig.pointsPerSub} bonus points!)
                </label>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 disabled:border-transparent transition-colors"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mocking User Registration...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-rose-400" />
                    <span>Mock Friend Registration</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
