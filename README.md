# FraudShield AI: AI-Powered Fraud & Loan Claim Detection System

An enterprise-grade, end-to-end full-stack fraud detection and explainability system for insurance claims and loan applications. Built with **FastAPI**, **XGBoost**, **SHAP (SHapley Additive exPlanations)**, **React + Tailwind CSS**, and **SQLite/PostgreSQL**.

---

## 🌟 Highlights

- **Predictive Scoring**: Trained XGBoost classifier predicts fraud likelihood per claim, handling imbalanced distributions via `scale_pos_weight`.
- **Explainable AI (SHAP)**: Every single prediction includes exact mathematical feature attributions via `shap.TreeExplainer`, generating interactive divergence charts and executive summaries explaining *why* a claim was flagged.
- **Role-Based Review Workflow**: Audit console for reviewers and admins to **Approve**, **Reject**, or **Escalate** claims with persistent notes.
- **Batch CSV Ingestion**: Drag-and-drop CSV ingestion pipeline that automatically parses, validates, scores, and stores incoming claim batches in real-time.
- **Production-Ready Architecture**: Clean separation between `/backend`, `/frontend`, `/ml`, and `/data`, with ORM models swappable to PostgreSQL via `DATABASE_URL`.

---

## 📊 Model Architecture & Performance

Trained on the **Kaggle Vehicle Insurance Claim Fraud Detection** benchmark schema (`fraud_oracle` standard with 30+ demographic, policy, vehicle, incident, and historical features).

### Evaluation Metrics (Held-Out 20% Stratified Test Set)

| Metric | Result | Industry Context |
| :--- | :--- | :--- |
| **Accuracy** | **89.53%** | Overall portfolio classification accuracy |
| **Precision** | **94.37%** | Minimal false alarms (low legitimate claims blocked) |
| **Recall** | **90.34%** | Captures over 90% of fraudulent claim attempts |
| **F1-Score** | **0.9231** | Balanced harmonic mean |
| **ROC-AUC** | **0.9384** | High discriminative power across all thresholds |

### Top Fraud Risk Signals Pinpointed by SHAP
1. **At-Fault Party**: Policy holder fault significantly increases fraud likelihood.
2. **Police Report Filed**: Lack of official police report is one of the strongest fraud alert flags.
3. **Driver Risk Rating**: Ratings of 1 or 2 correlate strongly with high-risk claim behavior.
4. **Days Between Policy & Incident**: Claims filed within 1–7 days of policy inception show elevated suspicion.
5. **Address Changes**: Address change within 6 months prior to claim indicates synthetic identity risk.
6. **Past Claims History**: More than 4 prior claims elevates fraud probability.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Node.js v18+ and npm

### 2. Backend Setup & Launch

```bash
# In the project root directory:

# Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# Seed the database (~200 realistic claims + demo accounts)
python backend/app/seed.py

# Launch FastAPI Backend Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API service and Swagger UI will be accessible at:
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/](http://localhost:8000/)

### 3. Frontend Dashboard Setup & Launch

```bash
# In another terminal, navigate to /frontend:
cd frontend

# Install dependencies
npm.cmd install

# Start Vite Development Server
npm.cmd run dev
```

The dashboard will be live at:
- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Chief Risk Officer (Admin)** | `admin@fraudshield.ai` | `AdminPassword123!` | Full control, CSV uploads, system metrics, audit logs |
| **Senior Claims Auditor (Reviewer)** | `reviewer@fraudshield.ai` | `ReviewerPassword123!` | Claims queue, SHAP inspection, Approve / Reject decisions |

> *Note: For frictionless evaluation, 1-click login buttons are provided directly inside the Login modal.*

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings, JWT secrets, database connection string
│   │   ├── database.py           # SQLAlchemy engine & session factory
│   │   ├── models.py             # ORM models (User, Claim, ClaimReview)
│   │   ├── schemas.py            # Pydantic schemas for validation & serialization
│   │   ├── auth.py               # JWT auth & role guards
│   │   ├── seed.py               # Database seed script (~200 pre-scored claims)
│   │   ├── main.py               # FastAPI entrypoint, CORS, routers
│   │   └── routers/
│   │       ├── auth.py           # /api/v1/auth
│   │       ├── claims.py         # /api/v1/claims (upload, list, detail, explain, review)
│   │       └── stats.py          # /api/v1/stats (KPIs and ML benchmarks)
│   └── requirements.txt
├── ml/
│   ├── data_prep.py              # Kaggle dataset generator and train/test splitter
│   ├── train.py                  # XGBoost model training and evaluation script
│   ├── explainer.py              # SHAP TreeExplainer inference and rationale generator
│   ├── models/                   # Serialized model, preprocessor, explainer, metrics.json
│   └── requirements.txt
├── data/
│   ├── raw/                      # Raw dataset
│   ├── processed/                # Preprocessed train & test CSVs
│   └── sample_claims_upload.csv  # 35 test claims ready for drag-and-drop CSV upload
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # API client with JWT support
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Top header with user profile & sample CSV download
│   │   │   ├── ClaimsTable.jsx   # Interactive claims queue with search, risk tiers, & sort
│   │   │   ├── ClaimDetailModal.jsx # Detail view with SHAP explainability & review console
│   │   │   ├── ShapBarChart.jsx  # Zero-divergence horizontal SHAP bar chart
│   │   │   ├── StatsOverview.jsx # Metrics dashboard, held-out confusion matrix & feature importance
│   │   │   ├── CsvUploadModal.jsx # Batch claims CSV drag-and-drop uploader
│   │   │   └── LoginModal.jsx    # Auth modal with 1-click profiles
│   │   ├── App.jsx               # Root dashboard layout
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind base & custom styles
│   └── vite.config.js
└── README.md
```

---

## 🛠 Retraining the Model

To generate a new dataset or retrain the model with updated hyperparameters:

```bash
# 1. Regenerate / prepare dataset
python ml/data_prep.py

# 2. Train XGBoost and generate new SHAP TreeExplainer
python ml/train.py
```
This automatically updates `ml/models/fraud_model.joblib`, `ml/models/explainer.joblib`, and `ml/models/metrics.json`.
