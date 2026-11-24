import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function ShapBarChart({ factors = [], baseValue = 0.5 }) {
  if (!factors || factors.length === 0) {
    return <div className="text-slate-400 text-sm py-4">No explainability factors available.</div>;
  }

  // Find max absolute value to scale bars properly
  const maxAbs = Math.max(...factors.map(f => Math.abs(f.shap_value)), 0.1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ArrowDownRight className="w-4 h-4" />
          <span>Reduces Fraud Risk (Safe Signals)</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
          <span>Base Baseline: {(baseValue * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
          <span>Increases Fraud Risk (Alert Signals)</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Feature Divergence Rows */}
      <div className="space-y-3">
        {factors.map((item, idx) => {
          const isPositive = item.shap_value > 0;
          const pctWidth = Math.min(100, (Math.abs(item.shap_value) / maxAbs) * 100);

          return (
            <div key={idx} className="group bg-slate-800/40 hover:bg-slate-800/80 p-2.5 rounded-lg border border-slate-800 transition">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
                    {item.display_name}
                  </span>
                  {item.value && (
                    <span className="text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/60">
                      Value: <strong className="text-slate-300">{item.value}</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isPositive ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isPositive ? `+${item.shap_value.toFixed(3)}` : item.shap_value.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-500">SHAP</span>
                </div>
              </div>

              {/* Centered zero-divergence bar */}
              <div className="relative h-2.5 bg-slate-900 rounded-full overflow-hidden flex items-center">
                {/* 50% centerline marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 z-10" />

                {/* Left side (negative SHAP) */}
                <div className="w-1/2 h-full flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
                      style={{ width: `${pctWidth}%` }}
                    />
                  )}
                </div>

                {/* Right side (positive SHAP) */}
                <div className="w-1/2 h-full flex justify-start">
                  {isPositive && (
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-r-full transition-all duration-500"
                      style={{ width: `${pctWidth}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl flex items-start gap-2.5 text-xs text-indigo-200/80">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-indigo-300 mb-0.5">Understanding SHAP Values:</p>
          <p>
            SHAP (SHapley Additive exPlanations) mathematically allocates each feature's contribution to the final risk score.
            Red bars push the prediction above the population baseline towards fraud, while green bars pull it down towards legitimate.
          </p>
        </div>
      </div>
    </div>
  );
}
