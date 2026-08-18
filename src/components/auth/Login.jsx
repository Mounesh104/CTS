import React, { useState } from "react";
import { 
  HeartPulse, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  KeyRound
} from "lucide-react";

export function Login({ onLogin, onNavigateToSignUp, bannerMessage, clearBannerMessage }) {
  const [email, setEmail] = useState("sarah.jenkins@hypertensioncare.org");
  const [password, setPassword] = useState("CarePass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clearBannerMessage) clearBannerMessage();
    setForgotPasswordMessage(false);

    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin({
        name: "Sarah Jenkins",
        email: email,
        role: "Lead Care Manager",
        organization: "Hypertension Care Clinic"
      });
    }, 400);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPasswordMessage(true);
  };

  const handleFillDemo = () => {
    setEmail("sarah.jenkins@hypertensioncare.org");
    setPassword("CarePass2026!");
    setErrors({});
    if (clearBannerMessage) clearBannerMessage();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glow Elements matching Clinical Theme */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800/20 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800/40 z-10">
        
        {/* LEFT / BRAND AREA */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Grid Accent Pattern */}
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
                Care Platform
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Patient Adherence & Persistency
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal mb-8">
              Risk-informed patient adherence and intervention management.
            </p>

            {/* Healthcare Risk & Adherence Visualization Card */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-3 shadow-inner backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium pb-2 border-b border-slate-700/60">
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" /> Clinical Monitor
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Live Insights
                </span>
              </div>

              {/* Metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Cohort Adherence Rate</span>
                  <span className="font-bold text-white">84.2%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[84%]" />
                </div>
              </div>

              {/* Metric 2 - High Risk Alerts */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300 text-[11px]">Priority Interventions</span>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded border border-rose-500/30">
                  24 High Risk
                </span>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>HIPAA-Compliant Encrypted Portal</span>
          </div>
        </div>

        {/* RIGHT / LOGIN CARD */}
        <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Sign in to continue to your care management workspace.
              </p>
            </div>

            {/* Success Banner if redirected from Sign Up */}
            {bannerMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{bannerMessage}</div>
              </div>
            )}

            {/* Password Reset Alert */}
            {forgotPasswordMessage && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-800">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Password Reset Requested</p>
                  <p className="mt-0.5 text-blue-700">
                    A password reset link has been dispatched to your work email.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    placeholder="name@clinic.org"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                      errors.email ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                    } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border ${
                      errors.password ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                    } rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">Remember me on this device</span>
                </label>

                {/* Quick Demo Fill Button */}
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 underline decoration-slate-300 transition-colors"
                >
                  Quick Demo Sign In
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Navigation to Sign Up */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer ml-1"
                >
                  Sign Up
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
