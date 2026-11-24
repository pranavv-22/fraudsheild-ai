import React, { useState } from 'react';
import { X, ShieldCheck, User, Key, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = async (presetEmail, presetPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.login(presetEmail, presetPassword);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Authentication</h2>
              <p className="text-xs text-slate-400">Role-based JWT access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick 1-Click Login Presets */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1-Click Demo Profiles
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handlePresetLogin('admin@fraudshield.ai', 'AdminPassword123!')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/60 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Chief Risk Officer (Admin)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      admin
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    admin@fraudshield.ai • Full control & audit
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('reviewer@fraudshield.ai', 'ReviewerPassword123!')}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Senior Claims Auditor (Reviewer)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      reviewer
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    reviewer@fraudshield.ai • Claims triage & reviews
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold">
              or credentials
            </span>
          </div>

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-950/20 border border-rose-800/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
