import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  Shield,
  FileText,
  DollarSign,
  TrendingUp,
  History,
  Send
} from 'lucide-react';
import { api } from '../api/client';
import ShapBarChart from './ShapBarChart';

export default function ClaimDetailModal({ claimId, onClose, onReviewComplete }) {
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [activeTab, setActiveTab] = useState('explain'); // 'explain', 'attributes', 'history'
  const [reviewAction, setReviewAction] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!claimId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getClaim(claimId),
      api.getClaimExplain(claimId)
    ])
      .then(([claimData, explainData]) => {
        if (isMounted) {
          setClaim(claimData);
          setExplanation(explainData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load claim details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [claimId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!claim) return;

    try {
      setSubmittingReview(true);
      const updated = await api.reviewClaim(claim.id, reviewAction, reviewNotes);
      setClaim(updated);
      setReviewNotes('');
      if (onReviewComplete) {
        onReviewComplete(updated);
      }
    } catch (err) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!claimId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {claim?.claimant_name || 'Claim Details'}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {claim?.claim_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {claim?.policy_type} • Incident Date: {claim?.incident_date || 'Recent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {claim && (
              <div className="text-right">
                <div className="text-xs text-slate-400">Claim Amount</div>
                <div className="text-base font-extrabold text-white">
                  ${claim.claim_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Evaluating claim with XGBoost & SHAP...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-80" />
            <p className="font-medium">{error}</p>
          </div>
        ) : claim && explanation ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Risk Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                claim.risk_tier === 'HIGH'
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  : claim.risk_tier === 'MEDIUM'
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                  : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-900/60 mt-0.5">
                  {claim.risk_tier === 'HIGH' ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  ) : claim.risk_tier === 'MEDIUM' ? (
                    <HelpCircle className="w-6 h-6 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg">
                      {(claim.fraud_score * 100).toFixed(1)}% Fraud Probability
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md tracking-wider ${
                        claim.risk_tier === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : claim.risk_tier === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {claim.risk_tier} RISK
                    </span>
                  </div>
                  <p className="text-xs opacity-90 mt-1 max-w-xl leading-relaxed">
                    {explanation.summary_rationale}
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div className="sm:text-right flex-shrink-0">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Audit Status</div>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                    claim.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : claim.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : claim.status === 'ESCALATED'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {claim.status}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('explain')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'explain'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                SHAP Explainability Waterfall
              </button>
              <button
                onClick={() => setActiveTab('attributes')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'attributes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Claim Attributes ({Object.keys(explanation.raw_features || {}).length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Audit Trail ({claim.reviews?.length || 0})
              </button>
            </div>

            {/* Tab 1: SHAP Explainability */}
            {activeTab === 'explain' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Feature Attribution Analysis
                  </h3>
                  <span className="text-xs text-slate-400">
                    Showing top {explanation.top_factors?.length || 0} contributing factors
                  </span>
                </div>

                <ShapBarChart
                  factors={explanation.top_factors}
                  baseValue={explanation.base_value}
                />
              </div>
            )}

            {/* Tab 2: Raw Attributes Inspection */}
            {activeTab === 'attributes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(explanation.raw_features || {}).map(([key, val]) => (
                    <div key={key} className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">{key}</div>
                      <div className="text-sm font-semibold text-slate-200 truncate mt-0.5">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: History & Reviews */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {claim.reviews && claim.reviews.length > 0 ? (
                  claim.reviews.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{r.reviewer_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-indigo-300 mt-0.5">
                          Action: {r.action}
                        </div>
                        {r.notes && (
                          <p className="text-xs text-slate-300 mt-1 italic">
                            "{r.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No review actions recorded yet for this claim.
                  </p>
                )}
              </div>
            )}

            {/* Reviewer Action Console */}
            <div className="pt-4 border-t border-slate-800">
              <form onSubmit={handleReviewSubmit} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    Reviewer Decision Console
                  </h4>
                  <span className="text-[11px] text-slate-400">Actions write directly to audit database</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Claim
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject as Fraud
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('ESCALATED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      reviewAction === 'ESCALATED'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Escalate to SIU
                  </button>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter audit justification or findings from SHAP features (e.g., Confirmed suspicious policy timeline and lack of police report)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingReview ? 'Recording Decision...' : 'Commit Review Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
