import React, { useState } from "react";
import { X, User, Mail, Building2, Briefcase, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { updateUserProfile } from "../../services/api";

export function ProfileModal({ user, onClose, onUpdated }) {
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [role, setRole] = useState(user?.role || "Care Manager");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
  const wantsPasswordChange = newPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (wantsPasswordChange && newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if ((emailChanged || wantsPasswordChange) && !currentPassword) {
      setError("Enter your current password to change your email or password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: fullName,
        organization,
        role,
      };
      if (emailChanged) payload.email = email;
      if (wantsPasswordChange) payload.new_password = newPassword;
      if (emailChanged || wantsPasswordChange) payload.current_password = currentPassword;

      const updated = await updateUserProfile(user.user_id, payload);
      onUpdated({
        name: updated.full_name,
        email: updated.email,
        organization: updated.organization,
        role: updated.role,
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err.message || "Could not update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">My Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile updated successfully.
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Organization</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none cursor-pointer"
                >
                  <option value="Care Manager">Care Manager</option>
                  <option value="Lead Care Manager">Lead Care Manager</option>
                  <option value="Lead Administrator">Lead Administrator</option>
                  <option value="Clinical Specialist">Clinical Specialist</option>
                  <option value="Pharmacist">Pharmacist</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-[11px] text-slate-400 font-medium">
              Changing your email or password requires your current password.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password (optional)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(emailChanged || wantsPasswordChange) && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
