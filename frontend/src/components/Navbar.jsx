import React from 'react';
import { ShieldAlert, Upload, Download, UserCheck, LogOut, BarChart3, ListFilter } from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenUpload,
  onOpenLogin,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  FraudShield AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                  XGBoost + SHAP
                </span>
              </div>
              <p className="text-xs text-slate-400">Loan & Insurance Claim Fraud Intelligence</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('claims')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'claims'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Claims Queue
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Model & Risk Analytics
            </button>
          </nav>

          {/* Action Tools & User Profile */}
          <div className="flex items-center gap-3">
            <a
              href={api.getSampleCsvUrl()}
              download="sample_claims_upload.csv"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="Download sample claims CSV for ingestion testing"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Sample CSV
            </a>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </button>

            {/* User Session Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-slate-200">{currentUser.full_name}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wide flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
