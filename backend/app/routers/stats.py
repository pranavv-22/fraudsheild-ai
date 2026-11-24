import os
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Claim
from ..schemas import StatsResponse, ModelMetricsOut

router = APIRouter(prefix="/stats", tags=["System Statistics"])

METRICS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "metrics.json")
)

@router.get("", response_model=StatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    high_risk_count = db.query(func.count(Claim.id)).filter(Claim.risk_tier == "HIGH").scalar() or 0
    med_risk_count = db.query(func.count(Claim.id)).filter(Claim.risk_tier == "MEDIUM").scalar() or 0
    low_risk_count = db.query(func.count(Claim.id)).filter(Claim.risk_tier == "LOW").scalar() or 0

    pending_count = db.query(func.count(Claim.id)).filter(Claim.status == "PENDING").scalar() or 0
    approved_count = db.query(func.count(Claim.id)).filter(Claim.status == "APPROVED").scalar() or 0
    rejected_count = db.query(func.count(Claim.id)).filter(Claim.status == "REJECTED").scalar() or 0
    escalated_count = db.query(func.count(Claim.id)).filter(Claim.status == "ESCALATED").scalar() or 0

    avg_score = db.query(func.avg(Claim.fraud_score)).scalar() or 0.0

    flagged_percentage = round((high_risk_count / total_claims * 100), 2) if total_claims > 0 else 0.0

    # Load model metrics from disk if available
    model_metrics = None
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                metrics_data = json.load(f)
                model_metrics = ModelMetricsOut(**metrics_data)
        except Exception as e:
            print("Error loading metrics:", e)

    return StatsResponse(
        total_claims=total_claims,
        flagged_claims=high_risk_count,
        flagged_percentage=flagged_percentage,
        pending_reviews=pending_count,
        approved_claims=approved_count,
        rejected_claims=rejected_count,
        escalated_claims=escalated_count,
        high_risk_count=high_risk_count,
        medium_risk_count=med_risk_count,
        low_risk_count=low_risk_count,
        average_fraud_score=round(float(avg_score), 4),
        model_metrics=model_metrics
    )
