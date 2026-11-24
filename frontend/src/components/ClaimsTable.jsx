import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function ClaimsTable({
  claims,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  riskTier,
  setRiskTier,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  sortBy,
  setSortBy,
  order,
  setOrder,
  onSelectClaim,
  onQuickReview
}) {
  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Filters & Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onPageChange(1);
            }}
            placeholder="Search claimant, claim ID, or policy..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Risk Tier Filter */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <span className="px-2 text-slate-400 font-medium">Risk:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setRiskTier(tier);
                  onPageChange(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  riskTier === tier
                    ? tier === 'HIGH'
                      ? 'bg-rose-600 text-white'
                      : tier === 'MEDIUM'
                      ? 'bg-amber-600 text-white'
                      : tier === 'LOW'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <span className="px-2 text-slate-400 font-medium">Status:</span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  onPageChange(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === st
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Claimant & ID</th>
                <th className="py-3.5 px-4">Policy / Vehicle</th>
                <th
                  onClick={() => handleSort('claim_amount')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fraud_score')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    Fraud Probability
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Risk Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No claims match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const scorePct = (claim.fraud_score * 100).toFixed(1);
                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Claimant & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition">
                          {claim.claimant_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {claim.claim_number}
                        </div>
                      </td>

                      {/* Policy */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{claim.policy_type}</div>
                        <div className="text-[11px] text-slate-400">
                          {claim.vehicle_category} • Rating: {claim.driver_rating}/4
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        ${claim.claim_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Score Gauge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-extrabold text-xs w-12 ${
                              claim.risk_tier === 'HIGH'
                                ? 'text-rose-400'
                                : claim.risk_tier === 'MEDIUM'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {scorePct}%
                          </span>
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                claim.risk_tier === 'HIGH'
                                  ? 'bg-rose-500'
                                  : claim.risk_tier === 'MEDIUM'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${claim.fraud_score * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk Tier Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            claim.risk_tier === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : claim.risk_tier === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {claim.risk_tier === 'HIGH' ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {claim.risk_tier}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            claim.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : claim.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : claim.status === 'ESCALATED'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectClaim(claim.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                            title="Inspect SHAP Explainability & Risk Drivers"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Explain
                          </button>

                          {claim.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onQuickReview(claim.id, 'APPROVED')}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition"
                                title="Quick Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onQuickReview(claim.id, 'REJECTED')}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                                title="Quick Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-200">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-slate-200">{total}</strong> claims
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-300 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
