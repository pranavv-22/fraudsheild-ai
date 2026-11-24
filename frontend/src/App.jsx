import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ClaimsTable from './components/ClaimsTable';
import StatsOverview from './components/StatsOverview';
import ClaimDetailModal from './components/ClaimDetailModal';
import CsvUploadModal from './components/CsvUploadModal';
import LoginModal from './components/LoginModal';
import { api, removeAuthToken } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('claims'); // 'claims' or 'stats'
  const [currentUser, setCurrentUser] = useState(null);

  // Claims table state
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [riskTier, setRiskTier] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('fraud_score');
  const [order, setOrder] = useState('desc');
  const [loadingClaims, setLoadingClaims] = useState(true);

  // Stats state
  const [stats, setStats] = useState(null);

  // Modals state
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Load current user profile on init
  useEffect(() => {
    api.getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        // demo fallback is enabled on backend
      });
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Fetch claims list
  const fetchClaims = useCallback(async () => {
    setLoadingClaims(true);
    try {
      const res = await api.getClaims({
        page,
        pageSize,
        riskTier,
        status: statusFilter,
        search,
        sortBy,
        order,
      });
      setClaims(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  }, [page, pageSize, riskTier, statusFilter, search, sortBy, order]);

  useEffect(() => {
    fetchClaims();
    fetchStats();
  }, [fetchClaims, fetchStats]);

  // Quick Review Handler from table row
  const handleQuickReview = async (claimId, action) => {
    try {
      const updated = await api.reviewClaim(
        claimId,
        action,
        `Quick decision by ${currentUser?.role || 'reviewer'}`
      );
      // Update local state
      setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      fetchStats();
    } catch (err) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  const handleReviewComplete = (updatedClaim) => {
    setClaims((prev) => prev.map((c) => (c.id === updatedClaim.id ? updatedClaim : c)));
    fetchStats();
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Content View */}
        {activeTab === 'claims' ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Insurance & Loan Claims Queue
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-prioritized by XGBoost fraud likelihood with granular SHAP feature attribution
                </p>
              </div>

              {stats && (
                <div className="flex items-center gap-3 text-xs bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-slate-400">High Risk:</span>
                    <strong className="text-rose-400 font-mono">{stats.high_risk_count}</strong>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Queue:</span>
                    <strong className="text-amber-400 font-mono">{stats.pending_reviews} Pending</strong>
                  </div>
                </div>
              )}
            </div>

            {loadingClaims ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs">Loading and sorting scored claims...</p>
              </div>
            ) : (
              <ClaimsTable
                claims={claims}
                total={total}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                riskTier={riskTier}
                setRiskTier={setRiskTier}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                search={search}
                setSearch={setSearch}
                sortBy={sortBy}
                setSortBy={setSortBy}
                order={order}
                setOrder={setOrder}
                onSelectClaim={(id) => setSelectedClaimId(id)}
                onQuickReview={handleQuickReview}
              />
            )}
          </div>
        ) : (
          <div>
            <div className="pb-4">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Model Evaluation & Risk Analytics
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Held-out test benchmarks, confusion matrix, and portfolio-wide risk distributions
              </p>
            </div>

            <StatsOverview stats={stats} />
          </div>
        )}
      </main>

      {/* Claim Detail & SHAP Explainability Modal */}
      {selectedClaimId && (
        <ClaimDetailModal
          claimId={selectedClaimId}
          onClose={() => setSelectedClaimId(null)}
          onReviewComplete={handleReviewComplete}
        />
      )}

      {/* CSV Batch Ingestion Modal */}
      {isUploadOpen && (
        <CsvUploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => {
            fetchClaims();
            fetchStats();
          }}
        />
      )}

      {/* Authentication Modal */}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            fetchClaims();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
