import React from 'react';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  TrendingUp,
  Cpu,
  BarChart2,
  PieChart as PieChartIcon,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function StatsOverview({ stats }) {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading analytics and model benchmarks...
      </div>
    );
  }

  const modelMetrics = stats.model_metrics;
  const cm = modelMetrics?.confusion_matrix || {
    true_negative: 0,
    false_positive: 0,
    false_negative: 0,
    true_positive: 0,
  };

  // Format global feature importance for chart
  const importanceData = (modelMetrics?.global_feature_importance || []).slice(0, 8).map((f) => {
    let name = f.feature.replace('cat__', '').replace('num__', '');
    if (name.length > 20) name = name.substring(0, 18) + '...';
    return {
      name: name,
      importance: Number((f.importance).toFixed(3)),
    };
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Claims Ingested</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {stats.total_claims?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats.approved_claims} Approved</span> •{' '}
            <span className="text-rose-400 font-semibold">{stats.rejected_claims} Rejected</span>
          </div>
        </div>

        {/* Flagged Fraud % */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flagged Fraud Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {stats.flagged_percentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <strong className="text-slate-200">{stats.high_risk_count}</strong> high-risk claims flagged by XGBoost
          </div>
        </div>

        {/* Pending Review Backlog */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {stats.pending_reviews}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Awaiting reviewer feedback & verification
          </div>
        </div>

        {/* Average Fraud Score */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Portfolio Risk</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {(stats.average_fraud_score * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {stats.low_risk_count} Low, {stats.medium_risk_count} Med, {stats.high_risk_count} High
          </div>
        </div>
      </div>

      {/* Model Benchmark & Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Performance Metrics Card */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                XGBoost Held-Out Model Benchmarks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated on independent 20% stratified test set ({modelMetrics?.test_samples || 0} claims)
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {modelMetrics?.model_type || 'XGBoost'}
            </span>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">Precision</div>
              <div className="text-xl font-extrabold text-indigo-400 mt-1 font-mono">
                {modelMetrics ? `${(modelMetrics.precision * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Low false positives</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">Recall</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">
                {modelMetrics ? `${(modelMetrics.recall * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Detects 90%+ fraud</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">F1-Score</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1 font-mono">
                {modelMetrics ? modelMetrics.f1_score.toFixed(3) : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Balanced harmonic mean</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">ROC-AUC</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1 font-mono">
                {modelMetrics ? modelMetrics.roc_auc.toFixed(3) : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Discriminative power</div>
            </div>
          </div>

          {/* Global Feature Importance Chart */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Global Risk Factors (Mean Absolute SHAP Value)
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importanceData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {importanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#ec4899' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Confusion Matrix Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <PieChartIcon className="w-5 h-5 text-indigo-400" />
              Held-Out Confusion Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Diagnostic classification breakdown on the unseen validation test set:
            </p>

            {/* Matrix 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              {/* True Positive */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-emerald-400">True Positive (TP)</div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                  {cm.true_positive}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fraud flagged correctly</div>
              </div>

              {/* False Positive */}
              <div className="bg-amber-950/20 border border-amber-800/30 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-amber-400">False Positive (FP)</div>
                <div className="text-xl font-black text-amber-300 font-mono mt-1">
                  {cm.false_positive}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Legit flagged as fraud</div>
              </div>

              {/* False Negative */}
              <div className="bg-rose-950/20 border border-rose-800/30 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-rose-400">False Negative (FN)</div>
                <div className="text-xl font-black text-rose-300 font-mono mt-1">
                  {cm.false_negative}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fraud missed</div>
              </div>

              {/* True Negative */}
              <div className="bg-indigo-950/30 border border-indigo-800/40 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-indigo-400">True Negative (TN)</div>
                <div className="text-xl font-black text-indigo-300 font-mono mt-1">
                  {cm.true_negative}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Legit approved correctly</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-[11px] text-slate-400">
            <span className="text-white font-semibold">Tuning Rationale:</span> Threshold calibrated to prioritize high recall (catching fraudulent claim submissions) while preserving precision.
          </div>
        </div>
      </div>
    </div>
  );
}
