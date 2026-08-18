import React, { useState } from "react";
import { 
  HeartPulse, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  AlertCircle,
  Briefcase
} from "lucide-react";

export function SignUp({ onSignUpSuccess, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    organization: "",
    role: "Care Manager",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.workEmail.trim()) {
      newErrors.workEmail = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.workEmail)) {
      newErrors.workEmail = "Please enter a valid email address";
    }

    if (!formData.organization.trim()) {
      newErrors.organization = "Organization name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSignUpSuccess({
        name: formData.fullName,
        email: formData.workEmail,
        organization: formData.organization,
        role: formData.role
      });
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glow Elements */}
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

            {/* Benefits Bullet List */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-3 shadow-inner backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 pb-2 border-b border-slate-700/60">
                <Activity className="w-3.5 h-3.5" /> Workspace Features
              </div>
              
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>Real-time persistence and adherence risk tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Structured patient outreach and intervention logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>Clinical decision support & monitoring dashboards</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Clinical Workspace Registration</span>
          </div>
        </div>

        {/* RIGHT / SIGN UP CARD */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                Set up your care management workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                      errors.fullName ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                    } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Grid for Email & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Work Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={formData.workEmail}
                      onChange={(e) => handleChange("workEmail", e.target.value)}
                      placeholder="name@clinic.org"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                        errors.workEmail ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                    />
                  </div>
                  {errors.workEmail && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.workEmail}
                    </p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Organization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleChange("organization", e.target.value)}
                      placeholder="e.g. Hypertension Clinic"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                        errors.organization ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                    />
                  </div>
                  {errors.organization && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.organization}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="Care Manager">Care Manager</option>
                    <option value="Lead Administrator">Lead Administrator</option>
                    <option value="Clinical Specialist">Clinical Specialist</option>
                    <option value="Pharmacist">Pharmacist</option>
                  </select>
                </div>
              </div>

              {/* Grid for Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-9 py-2 bg-slate-50 border ${
                        errors.password ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-9 py-2 bg-slate-50 border ${
                        errors.confirmPassword ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Primary Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Navigation back to Login */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
