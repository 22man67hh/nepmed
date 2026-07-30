import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Wallet, 
  QrCode, 
  Smartphone, 
  ShieldCheck, 
  Percent, 
  X, 
  Loader2,
  Gift,
  HelpCircle
} from "lucide-react";
import { UserProfile, CMSContent, PremiumPackage } from "../types";

interface SubscriptionViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  cmsContent: CMSContent;
}

export default function SubscriptionView({ 
  userProfile, 
  setUserProfile, 
  cmsContent 
}: SubscriptionViewProps) {
  // Use CMS configurations with elegant fallbacks
  const subConfig = cmsContent.subscriptionConfig || {
    title: "Upgrade to Premium Pass",
    subtitle: "Get unlimited access to high-yield clinical MCQs, past papers, and premium AI explanations.",
    benefits: [
      "Access 25,500+ syllabus-aligned medical MCQs",
      "Real-time mock boards with national-level leaderboards",
      "Meticulous textbook references & memory mnemonics",
      "Premium 24/7 Gemini Medical AI Tutor access",
      "Detailed progress graphs and exam preparation reports"
    ],
    promoBanner: "",
    paymentMethods: [
      { name: "Khalti Wallet", logo: "🟣", description: "Fast billing using Khalti OTP verification API." },
    ]
  };

  // States for DB packages
  const [dbPackages, setDbPackages] = useState<PremiumPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/premium-packages");
        if (res.ok) {
          const data = await res.json();
          setDbPackages(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch premium packages", err);
      } finally {
        setIsLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  // States
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>("Khalti Wallet");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0); // decimal percentage, e.g. 0.15 for 15%
  const [promoError, setPromoError] = useState("");
  
  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [walletPhone, setWalletPhone] = useState("");
  const [walletPin, setWalletPin] = useState("");
  const [paymentStep, setPaymentStep] = useState<"form" | "loading" | "success">("form");
  const [loadingText, setLoadingText] = useState("");

  const activePlan = dbPackages.find(p => p.id === selectedPlanId);

  // Apply promo logic
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    const code = promoCode.trim().toUpperCase();
    
    if (code === "NEPMED15" || code === "WELCOME15") {
      setAppliedPromo(code);
      setPromoDiscount(0.15);
      triggerCelebration();
    } else if (code === "MEDSCHOLAR25" || code === "MEC25") {
      setAppliedPromo(code);
      setPromoDiscount(0.25);
      triggerCelebration();
    } else if (code === "FREEPASS") {
      setAppliedPromo(code);
      setPromoDiscount(1.0);
      triggerCelebration();
    } else {
      setPromoError("Invalid promo code. Try 'NEPMED15' or 'MEDSCHOLAR25'!");
    }
  };

  const triggerCelebration = () => {
    // Soft confirmation flash
  };

  const originalPrice = activePlan ? activePlan.price : 0;
  const discountAmount = Math.round(originalPrice * promoDiscount);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // Initiate purchase
  const handleInitiatePayment = () => {
    setPaymentStep("form");
    setIsCheckoutOpen(true);
  };

  // Submit Simulated Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;

    if (selectedGateway === "Khalti Wallet") {
      setPaymentStep("loading");
      setLoadingText("Initializing Secure Khalti Gateway...");

      try {
        const token = localStorage.getItem("nepmed_auth_token");
        const res = await fetch("/api/payment/khalti/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ package_id: activePlan.id })
        });

        const json = await res.json();
        
        if (json.status && json.payment_url) {
          setLoadingText("Redirecting to Khalti...");
          // Redirect the browser entirely to Khalti
          window.location.href = json.payment_url;
        } else {
          alert("Failed to initiate Khalti payment: " + (json.message || "Unknown error"));
          setPaymentStep("form");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while communicating with Khalti server.");
        setPaymentStep("form");
      }
    } else {
      // Simulate other gateways like eSewa or Fonepay for now
      setPaymentStep("loading");
      setLoadingText("Initiating secure gateway handshaking...");

      setTimeout(() => {
        setLoadingText("Verifying token balance & credentials...");
        setTimeout(() => {
          setLoadingText("Writing purchase ledger entries securely...");
          setTimeout(() => {
            // Success! Upgrade user profile in state & localStorage
            const expiresDate = new Date();
            const daysToAdd = activePlan ? activePlan.duration || 30 : 30;
            expiresDate.setDate(expiresDate.getDate() + daysToAdd);

            setUserProfile(prev => {
              const updated = {
                ...prev,
                subscription: {
                  examType: activePlan?.name || "Premium Module",
                  expiresAt: expiresDate.toISOString()
                }
              };
              localStorage.setItem("nepmed_user_profile", JSON.stringify(updated));
              return updated;
            });

            setPaymentStep("success");
          }, 1500);
        }, 1500);
      }, 1200);
    }
  };

  return (
    <div id="subscription-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-white">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl relative z-10 space-y-4">
          <div 
            id="subscription-banner-badge"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ color: "#000000", backgroundColor: "#d3e9e9" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Go Premium</span>
          </div>
          <h1 
            id="subscription-banner-title"
            className="text-2xl md:text-4xl font-extrabold tracking-tight"
            style={{ color: "#000000" }}
          >
            {subConfig.title}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {subConfig.subtitle}
          </p>

          {subConfig.promoBanner && (
            <div className="inline-block mt-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-2 text-xs font-semibold text-emerald-400">
              {subConfig.promoBanner}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Active Status Banner if already premium */}
      {userProfile.subscription && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-400">Premium Account Active</p>
              <p className="text-xs text-slate-400">
                You have active access to <span className="text-white font-semibold">{userProfile.subscription.examType}</span> until{" "}
                <span className="text-white font-semibold">{new Date(userProfile.subscription.expiresAt).toLocaleDateString()}</span>.
              </p>
            </div>
          </div>
          <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
            Extend early below to append bonus days
          </div>
        </div>
      )}

      {/* Main Grid: Plans (Left) & Sidebar Benefits/Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Different packages */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>💎</span> Select Premium Pass Package
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoadingPackages ? (
              <div className="col-span-3 text-center text-slate-400 py-12 animate-pulse">
                Loading database packages...
              </div>
            ) : dbPackages.length === 0 ? (
              <div className="col-span-3 text-center text-slate-400 py-12">
                No premium packages available right now.
              </div>
            ) : dbPackages.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[190px] ${
                    isSelected 
                      ? "border-slate-950 shadow-lg ring-1 ring-slate-950/20" 
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  style={{ backgroundColor: "#ccdce7" }}
                >
                  <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/10 text-slate-900 border border-slate-950/25">
                    {plan.duration ? `${plan.duration} Days` : "Unlimited"}
                  </span>
                  
                  <div className="space-y-1 mt-1">
                    <h3 className="text-sm font-bold pr-12 text-slate-950">{plan.name}</h3>
                    <p className="text-[11px] leading-normal pr-4 text-slate-700">{plan.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t w-full flex items-baseline justify-between border-slate-300">
                    <div>
                      <span className="text-[10px] block uppercase font-bold tracking-wider text-slate-600">Price</span>
                      <span className="text-lg font-extrabold text-slate-950">NPR {plan.price}</span>
                    </div>
                    {userProfile.activePackages?.some((ap: any) => ap.id === plan.id) ? (
                      <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-3 py-1 rounded-full">
                        Subscribed
                      </span>
                    ) : (
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? "border-slate-950 bg-slate-950 text-white" 
                          : "border-slate-400"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Benefits Card */}
          <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🚀</span> Included Premium Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subConfig.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 leading-normal">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Gateway Selector, Promos & Instant Activator */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>🛡️</span> Secure Checkout
          </h2>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-6 shadow-xl">
            {/* active summary */}
            <div className="bg-slate-950/50 p-4 rounded-xl space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Selected Plan</span>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{activePlan?.name || "Select a package"}</span>
                <span className="text-xs font-black text-amber-400">NPR {originalPrice}</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between items-center text-xs text-emerald-400 border-t border-slate-850 pt-2 mt-2">
                  <span>Promo Applied ({appliedPromo})</span>
                  <span>- NPR {discountAmount}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center font-bold">
                <span className="text-xs text-slate-300">Total Payable</span>
                <span className="text-sm text-white">NPR {finalPrice}</span>
              </div>
            </div>

            {/* Promo code form */}
            {/* <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Promo / Coupon Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. NEPMED15"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-[10px] text-rose-400 font-bold">{promoError}</p>}
              {appliedPromo && (
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Successfully Applied! ({Math.round(promoDiscount * 100)}% Discount)
                </p>
              )}
            </form> */}

            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Payment Gateway</label>
              <div className="grid grid-cols-1 gap-2">
                {subConfig.paymentMethods.map((gateway) => {
                  const isSelected = selectedGateway === gateway.name;
                  return (
                    <button
                      key={gateway.name}
                      onClick={() => setSelectedGateway(gateway.name)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/25 text-white" 
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{gateway.logo}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{gateway.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">{gateway.description}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-800"
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleInitiatePayment}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 tracking-wide cursor-pointer shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01]"
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout via {selectedGateway}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Simulated Payment Gateway modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase">{selectedGateway} Gateway</span>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {paymentStep === "form" && (
                <form onSubmit={handleConfirmPayment} className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400">Total Bill Amount</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Package: {activePlan?.name}</p>
                    </div>
                    <span className="text-lg font-black text-amber-400">NPR {finalPrice}</span>
                  </div>

                  {selectedGateway === "Nepal Fonepay" ? (
                    <div className="space-y-4 text-center">
                      <p className="text-xs text-slate-300">Scan this secure QR code using any Nepalese Banking, eSewa or Khalti application to authorize instantaneous premium unlock.</p>
                      <div className="mx-auto w-40 h-40 bg-white p-3 rounded-xl flex items-center justify-center border-4 border-emerald-500/30">
                        <QrCode className="w-full h-full text-slate-950" />
                      </div>
                      <div className="text-[10px] bg-slate-950 p-2.5 rounded-lg text-slate-400 font-mono">
                        Terminal ID: NEPMED-FP-827361
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleConfirmPayment(e as any)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>I have scanned & paid</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Mobile Number / Wallet ID</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="tel"
                            required
                            value={walletPhone}
                            onChange={(e) => setWalletPhone(e.target.value)}
                            placeholder="e.g. 9851000000"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Simulated PIN / OTP Password</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={walletPin}
                            onChange={(e) => setWalletPin(e.target.value)}
                            placeholder="••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">This is a secure simulation. Any 4-digit code will authorize successfully.</p>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer tracking-wider"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Securely Pay</span>
                      </button>
                    </div>
                  )}
                </form>
              )}

              {paymentStep === "loading" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                  <p className="text-xs font-bold text-white">{loadingText}</p>
                  <p className="text-[10px] text-slate-500">Please do not refresh or close this connection...</p>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-emerald-400">Payment Authorized Successfully!</h3>
                  <p className="text-xs text-slate-300 px-4">
                    Your account has been instantly promoted to <span className="font-bold text-white">Premium Med Scholar</span>! 
                    All high-yield past year MCQ papers and active AI-powered explanations are now unlocked.
                  </p>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-left w-full space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Receipt No:</span>
                      <span className="font-mono text-white">TXN-9283719283</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Expires On:</span>
                      <span className="font-semibold text-emerald-400">
                        {new Date(new Date().setDate(new Date().getDate() + (activePlan?.duration || 30))).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg border border-slate-750 cursor-pointer"
                  >
                    Return to Practice Arena
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950/40 px-6 py-3 border-t border-slate-850 text-center">
              <p className="text-[9px] text-slate-500 font-mono">Secured with SSL 256-bit encryption standard</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
