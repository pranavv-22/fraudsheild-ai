const API_BASE = "http://localhost:8000/api/v1";

export const getAuthToken = () => localStorage.getItem("fraudshield_token");
export const setAuthToken = (token) => localStorage.setItem("fraudshield_token", token);
export const removeAuthToken = () => localStorage.removeItem("fraudshield_token");

export const getUserRole = () => localStorage.getItem("fraudshield_role") || "reviewer";
export const setUserRole = (role) => localStorage.setItem("fraudshield_role", role);

const authFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Authentication failed");
    }
    const data = await res.json();
    setAuthToken(data.access_token);
    setUserRole(data.user.role);
    return data;
  },

  getCurrentUser: () => authFetch("/auth/me"),
  getDemoPresets: () => authFetch("/auth/presets"),

  // Stats
  getStats: () => authFetch("/stats"),

  // Claims
  getClaims: ({ page = 1, pageSize = 15, riskTier = "ALL", status = "ALL", search = "", sortBy = "fraud_score", order = "desc" }) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      order: order,
    });
    if (riskTier && riskTier !== "ALL") params.append("risk_tier", riskTier);
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);

    return authFetch(`/claims?${params.toString()}`);
  },

  getClaim: (id) => authFetch(`/claims/${id}`),

  getClaimExplain: (id) => authFetch(`/claims/${id}/explain`),

  reviewClaim: (id, action, notes) =>
    authFetch(`/claims/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    }),

  uploadClaimsCsv: async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/claims/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "CSV upload failed");
    }

    return res.json();
  },

  getSampleCsvUrl: () => `${API_BASE}/sample-csv`,
};
