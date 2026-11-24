import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function CsvUploadModal({ onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please select a valid CSV file.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please drop a valid CSV file.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadClaimsCsv(file);
      setResult(res);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.message || 'CSV ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch Claims Ingestion</h2>
              <p className="text-xs text-slate-400">Upload CSV to evaluate with XGBoost & SHAP</p>
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
          {/* Download sample hint */}
          <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs">
            <span className="text-slate-300">Need a test dataset with Kaggle schema?</span>
            <a
              href={api.getSampleCsvUrl()}
              download="sample_claims_upload.csv"
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV
            </a>
          </div>

          {result ? (
            /* Success Summary View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Batch Scoring Complete!</h4>
                  <p className="text-xs mt-1 text-emerald-200/90">{result.message}</p>
                </div>
              </div>

              {result.risk_breakdown && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">Low Risk</div>
                    <div className="text-lg font-black text-white mt-1">
                      {result.risk_breakdown.LOW || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">Medium Risk</div>
                    <div className="text-lg font-black text-white mt-1">
                      {result.risk_breakdown.MEDIUM || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="text-[10px] text-rose-400 uppercase font-bold">High Risk</div>
                    <div className="text-lg font-black text-white mt-1">
                      {result.risk_breakdown.HIGH || 0}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>View Ingested Claims in Queue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Upload Drop Area */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-8 text-center bg-slate-800/20 hover:bg-slate-800/40 transition cursor-pointer"
                onClick={() => document.getElementById('csvFileInput').click()}
              >
                <input
                  id="csvFileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>

                {file ? (
                  <div>
                    <span className="text-xs font-bold text-white">{file.name}</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Drag and drop your claims CSV here
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      or click to browse from your computer
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Scoring Claims with XGBoost & SHAP...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Score Claims</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
