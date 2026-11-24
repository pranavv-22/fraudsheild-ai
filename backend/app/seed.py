"""
Database seed script for FraudShield AI.
Populates SQLite with default Admin and Reviewer accounts,
and seeds ~200 realistic claims pre-scored by XGBoost and annotated with SHAP explainability factors.
"""
import os
import sys
import json
import random
import datetime
import pandas as pd

# Add repo root to path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(REPO_ROOT)

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import User, Claim, ClaimReview
from backend.app.auth import get_password_hash
from ml.explainer import get_explainer

DATASET_PATH = os.path.join(REPO_ROOT, "data", "raw", "vehicle_fraud_dataset.csv")

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Users
    print("Seeding default demo users...")
    users_to_seed = [
        {
            "email": "admin@fraudshield.ai",
            "password": "AdminPassword123!",
            "full_name": "Chief Risk Officer (Admin)",
            "role": "admin"
        },
        {
            "email": "reviewer@fraudshield.ai",
            "password": "ReviewerPassword123!",
            "full_name": "Senior Claims Auditor (Reviewer)",
            "role": "reviewer"
        }
    ]

    created_users = {}
    for u in users_to_seed:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"]
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            created_users[u["role"]] = new_user
            print(f"Created user: {u['email']} [{u['role']}]")
        else:
            created_users[u["role"]] = existing
            print(f"User already exists: {u['email']}")

    # 2. Seed Claims (~200 records)
    claim_count = db.query(Claim).count()
    if claim_count >= 150:
        print(f"Database already contains {claim_count} claims. Skipping claim seed.")
        db.close()
        return

    print("Loading raw dataset for claim seeding...")
    if not os.path.exists(DATASET_PATH):
        from ml.data_prep import prepare_data
        prepare_data()

    df = pd.read_csv(DATASET_PATH)
    sample_df = df.sample(n=min(200, len(df)), random_state=42).reset_index(drop=True)

    explainer = get_explainer()
    print(f"Scoring and seeding {len(sample_df)} claims with SHAP explainability...")

    reviewer_user = created_users.get("reviewer")

    status_weights = ["PENDING"] * 135 + ["APPROVED"] * 35 + ["REJECTED"] * 22 + ["ESCALATED"] * 8
    random.shuffle(status_weights)

    for idx, row in sample_df.iterrows():
        row_dict = row.to_dict()
        explanation = explainer.predict_and_explain(row_dict)

        fraud_score = explanation["fraud_score"]
        risk_tier = explanation["risk_tier"]
        status_choice = status_weights[idx % len(status_weights)]

        # Realistic status alignment: high risk claims shouldn't default to approved
        if risk_tier == "HIGH" and status_choice == "APPROVED":
            status_choice = random.choice(["PENDING", "REJECTED", "ESCALATED"])
        elif risk_tier == "LOW" and status_choice == "REJECTED":
            status_choice = random.choice(["APPROVED", "PENDING"])

        claim_number = f"CLM-2026-{1000 + idx}"
        claimant_name = str(row_dict.get("ClaimantName", f"Claimant {idx + 1}"))
        claim_amount = float(row_dict.get("ClaimAmount", 8500.0))

        # Stagger created_at dates over past 30 days
        days_ago = random.randint(0, 30)
        claim_date = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago, hours=random.randint(1, 23))

        new_claim = Claim(
            claim_number=claim_number,
            claimant_name=claimant_name,
            age=int(row_dict.get("Age", 35)),
            sex=str(row_dict.get("Sex", "Male")),
            marital_status=str(row_dict.get("MaritalStatus", "Married")),
            policy_type=str(row_dict.get("PolicyType", "Sedan - All Perils")),
            vehicle_category=str(row_dict.get("VehicleCategory", "Sedan")),
            vehicle_price=str(row_dict.get("VehiclePrice", "20000 to 29000")),
            deductible=int(row_dict.get("Deductible", 400)),
            driver_rating=int(row_dict.get("DriverRating", 2)),
            claim_amount=claim_amount,
            past_claims=str(row_dict.get("PastNumberOfClaims", "none")),
            days_policy_accident=str(row_dict.get("Days_Policy_Accident", "more than 30")),
            address_change=str(row_dict.get("AddressChange_Claim", "no change")),
            police_report_filed=str(row_dict.get("PoliceReportFiled", "No")),
            witness_present=str(row_dict.get("WitnessPresent", "No")),
            fault=str(row_dict.get("Fault", "Policy Holder")),
            fraud_score=fraud_score,
            risk_tier=risk_tier,
            status=status_choice,
            summary_rationale=explanation["summary_rationale"],
            raw_features=json.dumps({k: str(v) for k, v in row_dict.items()}),
            top_risk_factors=json.dumps(explanation["top_factors"]),
            incident_date=str(row_dict.get("Month", "Jan")) + f" {random.randint(1, 28)}, 2026",
            created_at=claim_date
        )
        db.add(new_claim)
        db.flush()

        # Add review note if already reviewed
        if status_choice in ["APPROVED", "REJECTED", "ESCALATED"] and reviewer_user:
            notes = ""
            if status_choice == "REJECTED":
                notes = f"Audit failed: Flagged with fraud score {fraud_score*100:.1f}%. Discrepancies noted in claim timeline and police report absence."
            elif status_choice == "APPROVED":
                notes = f"Claim verified against policy documentation. Low risk score ({fraud_score*100:.1f}%), approved for reimbursement."
            elif status_choice == "ESCALATED":
                notes = f"Escalated to Special Investigations Unit (SIU) due to multiple high-risk indicators."

            review = ClaimReview(
                claim_id=new_claim.id,
                reviewer_id=reviewer_user.id,
                reviewer_name=reviewer_user.full_name,
                action=status_choice,
                notes=notes,
                created_at=claim_date + datetime.timedelta(hours=random.randint(2, 48))
            )
            db.add(review)

    db.commit()
    total = db.query(Claim).count()
    print(f"Successfully populated database with {total} claims and audit records!")
    db.close()

if __name__ == '__main__':
    seed()
