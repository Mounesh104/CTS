import React, { useState, useRef, useEffect } from "react";
import { 
  HeartPulse, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  KeyRound
} from "lucide-react";

export function OtpVerification({ email, flowType, onVerifySuccess, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (error) setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // On Backspace, clear current or move to previous input
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^[0-9]{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      if (error) setError(null);
      inputRefs[5].current?.focus();
    }
  };

  const handleFillDemoOtp = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    setError(null);
    if (inputRefs[5].current) {
      inputRefs[5].current.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // For demo, accept any 6 digits or 123456
      onVerifySuccess(code);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800/20 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800/40 z-10">
        
        {/* LEFT / BRAND AREA */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, 
              backgroundSize: '16px 16px' 
            }} 
          />

          <div>
            {/* Header Brand Badge */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-900/40 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Security Protocol
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Patient Adherence & Persistency
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal mb-8">
              Two-factor authentication ensures secure access to patient health information.
            </p>

            {/* Security Monitor Card */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-3 shadow-inner backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium pb-2 border-b border-slate-700/60">
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Status
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  Protected Session
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Email:</span>
                  <span className="font-semibold text-white truncate max-w-[160px]">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Action Type:</span>
                  <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider">
                    {flowType === "signup" ? "Account Registration" : "Sign In Verification"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Code Expiry:</span>
                  <span className="font-semibold text-amber-400">10 Minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-Factor Clinical Identity Safeguard</span>
          </div>
        </div>

        {/* RIGHT / OTP CARD */}
        <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Top Navigation Back */}
            <div>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {flowType === "signup" ? "Sign Up" : "Sign In"}
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Two-Factor Verification
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email}</span>. Please enter it below.
              </p>
            </div>

            {/* Resend success alert */}
            {resendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>A new 6-digit verification code has been dispatched.</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 6 Digit Input Boxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border ${
                        error ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-600 focus:bg-white"
                      } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="mt-2 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}
              </div>

              {/* Demo Helper & Resend Code Controls */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Fill Demo OTP (123456)
                </button>

                {resendTimer > 0 ? (
                  <span className="text-slate-400 font-medium">
                    Resend code in <strong className="text-slate-600">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend Code
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying code...
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
