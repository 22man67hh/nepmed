/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { UserProfile, CMSContent } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile, preferredExam: string) => void;
  cmsContent: CMSContent;
  dbExams?: any[];
}

export default function LoginScreen({ onLoginSuccess, cmsContent, dbExams = [] }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preferredExam, setPreferredExam] = useState<string>(() => {
    return (dbExams?.[0]?.id?.toString()) || cmsContent?.targetExams?.[0]?.id || "mec-ug";
  });
  const [sex, setSex] = useState("Male");
  const [age, setAge] = useState("");

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Terms and Privacy acceptance states
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Handle traditional submit (register triggers OTP, login directly accesses)
  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp) {
      if (!name) {
        setError("Please provide your full name.");
        return;
      }
      if (!age) {
        setError("Please provide your age.");
        return;
      }
      if (!termsAccepted) {
        setError("You must accept the Terms and Conditions and Privacy Policy to register.");
        return;
      }
    }

    setIsLoading(true);

    if (isSignUp) {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name,
            email: email.toLowerCase(),
            password,
            password_confirmation: password
          })
        });
        const data = await response.json();
        setIsLoading(false);
        if (data.status || data.success) {
          setShowOtpScreen(true);
        } else {
          setError(data.message || data.error || (data.errors ? Object.values(data.errors).flat().join(" ") : "Failed to register. Please try again."));
        }
      } catch {
        setIsLoading(false);
        setError("Network error. Failed to register. Please try again.");
      }
    } else {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase(), password })
        });
        const data = await response.json();
        setIsLoading(false);
        if (data.status || data.success) {
          if (data.token) {
            localStorage.setItem("nepmed_auth_token", data.token);
          }
          onLoginSuccess({
            id: data.user?.id || "user-1",
            email: data.user?.email || email.toLowerCase(),
            name: data.user?.name || email.split("@")[0].toUpperCase(),
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
            isLoggedIn: true,
            role: data.user?.role || data.role || undefined,
            age: age || 24,
            sex: sex || "Male",
            purchasedSetIds: ["mec-ug-2023", "nmcle-2023", "ku-mcq-mock-1"]
          }, preferredExam);
        } else {
          setError(data.message || data.error || "Invalid credentials. Please check and try again.");
        }
      } catch {
        setIsLoading(false);
        setError("Network error. Failed to log in. Please try again.");
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError("Please enter the complete secure 6-digit verification OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), otp: otpCode })
      });
      const data = await response.json();
      
      if (data.status || data.success) {
        try {
          const loginResponse = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.toLowerCase(), password })
          });
          const loginData = await loginResponse.json();
          setOtpLoading(false);

          if (loginData.status || loginData.success) {
            if (loginData.token) {
              localStorage.setItem("nepmed_auth_token", loginData.token);
            }
            onLoginSuccess({
              id: `user-${Date.now()}`,
              email: email.toLowerCase(),
              name: loginData.user?.name || name,
              avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
              isLoggedIn: true,
              role: loginData.user?.role || loginData.role || undefined,
              age,
              sex,
              purchasedSetIds: ["mec-ug-2023", "nmcle-2023", "ku-mcq-mock-1"]
            }, preferredExam);
          } else {
            setOtpError(loginData.message || "Failed to log in automatically after verification. Please log in manually.");
          }
        } catch {
          setOtpLoading(false);
          setOtpError("Authentication failed. Please try logging in manually.");
        }
      } else {
        setOtpLoading(false);
        setOtpError(data.message || data.error || "Incorrect OTP verification code. Please check and try again.");
      }
    } catch {
      setOtpLoading(false);
      setOtpError("Failed to verify OTP due to connection issues. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      const data = await response.json();
      setOtpLoading(false);
      if (data.status || data.success) {
        alert("OTP Resent successfully!");
      } else {
        setOtpError(data.message || data.error || "Failed to resend. Please try again.");
      }
    } catch {
      setOtpLoading(false);
      setOtpError("Connection error resending code.");
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError("");

    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      setError("Google Login is not configured.");
      setIsLoading(false);
      return;
    }

    if (typeof window === "undefined" || !(window as any).google) {
      setIsLoading(false);
      setError("Google authentication service is unavailable. Please wait a moment and try again.");
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "email profile openid",
        callback: async (response: any) => {
          if (response.error) {
            setIsLoading(false);
            setError("Google login was cancelled or failed.");
            return;
          }

          if (response.access_token) {
            try {
              const backendResponse = await fetch("/api/callback/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.access_token })
              });
              
              const data = await backendResponse.json();
              setIsLoading(false);

              if (data.status || data.success) {
                if (data.token) {
                  localStorage.setItem("nepmed_auth_token", data.token);
                }
                
                onLoginSuccess({
                  id: data.user?.id || `user-${Date.now()}`,
                  email: data.user?.email || "user@nepmed.edu",
                  name: data.user?.name || "Google User",
                  avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.user?.email || "google")}`,
                  isLoggedIn: true,
                  role: data.user?.role || data.role || undefined,
                  purchasedSetIds: ["mec-ug-2023", "nmcle-2023", "ku-mcq-mock-1"]
                }, preferredExam);
              } else {
                setError(data.message || "Failed to authenticate Google user on backend.");
              }
            } catch {
              setIsLoading(false);
              setError("Network error communicating with server after Google sign-in.");
            }
          } else {
            setIsLoading(false);
            setError("No access token returned from Google.");
          }
        },
      });

      client.requestAccessToken();
    } catch (e: any) {
      setIsLoading(false);
      setError("Error initializing Google login: " + e.message);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3.5 ring-4 ring-emerald-500/10">
            <Stethoscope className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            {cmsContent?.loginLabels?.brandName || "PrepzaNepal"}
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center">
            {cmsContent?.loginLabels?.brandSubtitle || "Nepal's Premier Medical MCQs & License Prep Engine"}
          </p>
        </div>

        {/* ---------------- OTP VERIFICATION SCREEN ---------------- */}
        {showOtpScreen ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account Created!</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  We have sent a secure 6-digit verification code to <span className="font-semibold text-emerald-300">{email}</span>.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-center font-mono font-bold text-base tracking-widest placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                {otpError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{otpError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15 disabled:opacity-50"
              >
                {otpLoading ? (
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button 
                type="button" 
                onClick={() => {
                  setShowOtpScreen(false);
                  setOtpCode("");
                  setOtpError("");
                }} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to edit email
              </button>
              <button 
                type="button" 
                onClick={handleResendOtp}
                className="text-emerald-400 hover:underline font-semibold bg-transparent border-0 cursor-pointer"
              >
                Resend OTP Code
              </button>
            </div>
          </div>
        ) : (
          /* ---------------- TRADITIONAL SIGN-UP / LOG-IN SCREEN ---------------- */
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleTraditionalSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Dr. Sunil Subedi"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="24"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition-colors font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Sex / Gender
                      </label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-emerald-500 text-xs transition-colors cursor-pointer font-sans"
                      >
                        <option value="Male" className="bg-slate-950 text-slate-100 font-sans">Male</option>
                        <option value="Female" className="bg-slate-950 text-slate-100 font-sans">Female</option>
                        <option value="Other" className="bg-slate-950 text-slate-100 font-sans">Other</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="you@PrepzaNepal.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                  />
                </div>
              </div>

              {/* <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Board Exam
                </label>
                <select
                  value={preferredExam}
                  onChange={(e) => setPreferredExam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-emerald-500 text-xs cursor-pointer transition-colors font-sans"
                >
                  {dbExams && dbExams.length > 0 ? (
                    dbExams.map((exam) => (
                      <option key={exam.id} value={exam.id.toString()} className="bg-slate-900 text-slate-200">
                        {exam.name || exam.code || exam.id}
                      </option>
                    ))
                  ) : cmsContent?.targetExams && cmsContent.targetExams.length > 0 ? (
                    cmsContent.targetExams.map((exam) => (
                      <option key={exam.id} value={exam.id} className="bg-slate-900 text-slate-200">
                        {exam.name || exam.code || exam.id}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="mec-ug" className="bg-slate-900 text-slate-200">MEC-UG (Undergraduate)</option>
                      <option value="mec-pg" className="bg-slate-900 text-slate-200">MEC-PG (Postgraduate)</option>
                      <option value="nmcle" className="bg-slate-900 text-slate-200">NMCLE (Licensing)</option>
                      <option value="ku-mcq" className="bg-slate-900 text-slate-200">KU MCQ</option>
                      <option value="loksewa" className="bg-slate-900 text-slate-200">Loksewa</option>
                    </>
                  )}
                </select>
              </div> */}

              {isSignUp && (
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] leading-relaxed">
                      {cmsContent?.loginLabels?.termsAcceptedLabel || (
                        <>
                          I explicitly agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-emerald-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Terms & Conditions
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-emerald-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Privacy Policy
                          </button>
                        </>
                      )}
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? (cmsContent?.loginLabels?.registerButton || "Register Account") : (cmsContent?.loginLabels?.loginButton || "Access Prep Dashboard")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-medium tracking-widest">{cmsContent?.loginLabels?.dividerText || "or continue with"}</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.57 15.439 1 12.24 1 6.01 1 1 6.01 1 12.24s5.01 11.24 11.24 11.24c6.51 0 10.833-4.576 10.833-11.025 0-.74-.08-1.3-.177-1.85H12.24z"
                />
              </svg>
              <span>{isSignUp ? (cmsContent?.loginLabels?.signupGoogleButton || "Sign Up with Google") : (cmsContent?.loginLabels?.signinGoogleButton || "Sign In with Google")}</span>
            </button>

            <div className="mt-5 text-center text-xs text-slate-400">
              {isSignUp ? (
                <p>
                  Already practicing?{" "}
                  <button onClick={() => setIsSignUp(false)} className="text-emerald-400 hover:underline font-semibold bg-transparent border-0 cursor-pointer">
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  New to NepMed MCQ?{" "}
                  <button onClick={() => setIsSignUp(true)} className="text-emerald-400 hover:underline font-semibold bg-transparent border-0 cursor-pointer">
                    Create free account
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Trust & Features footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-center md:text-left text-slate-400 text-xs px-4 relative z-10 pointer-events-none">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-200">5,000+ Past MCQs</p>
            <p>Curated from official MEC & Loksewa board exams.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-200">Interactive Tuned Modes</p>
            <p>Switch instantly between timed and explained study modes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <Stethoscope className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-200">AI Medical Tutor</p>
            <p>Get high-yield concept breakdowns and memorization aids.</p>
          </div>
        </div>
      </div>

      {/* TERMS AND CONDITIONS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-slate-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Terms & Conditions</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs font-sans leading-relaxed">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Last updated: July 2026</p>
              
              <h4 className="text-white font-bold font-sans">1. Acceptance of Terms</h4>
              <p>
                By creating an account or accessing the PrepzaNepal Study Engine, you explicitly agree to bind yourself legally to these Terms and Conditions.
              </p>

              <h4 className="text-white font-bold font-sans">2. Educational Purposes and Disclaimers</h4>
              <p>
                PrepzaNepal is strictly an educational support system designed to help medical students prepare for board examinations (MEC-UG, MEC-PG, NMCLE, and Loksewa).
              </p>

              <h4 className="text-white font-bold font-sans">3. Account Integrity & Verification</h4>
              <p>
                Verification via a secure One-Time Password (OTP) is mandatory to activate account privileges and protect exam attempt metrics.
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-slate-300">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Privacy Policy</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs font-sans leading-relaxed">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Last updated: July 2026</p>
              
              <h4 className="text-white font-bold font-sans">1. Information We Collect</h4>
              <p>
                We securely store your email address, full name, age, gender/sex, and preferred board exam target to personalize study recommendations.
              </p>

              <h4 className="text-white font-bold font-sans">2. Exam Tracking & Analytics</h4>
              <p>
                We store your study attempts, active exam answers, timing statistics, and bookmark selections to retain historical report summaries.
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Accept Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}