import io
import json
import random
import datetime
from typing import Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from ..database import get_db
from ..models import Claim, ClaimReview, User
from ..schemas import ClaimOut, ClaimListResponse, ClaimExplainOut, ReviewCreate, ShapFactor
from ..auth import get_current_user

# Import ML explainability service
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from ml.explainer import get_explainer

router = APIRouter(prefix="/claims", tags=["Claims Management"])

@router.post("/upload")
async def upload_claims_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported for claims ingestion."
        )

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV file: {str(e)}"
        )

    explainer = get_explainer()
    ingested_count = 0
    tier_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}

    # Find highest existing claim number suffix to avoid collisions
    last_claim = db.query(Claim).order_by(desc(Claim.id)).first()
    counter_offset = last_claim.id if last_claim else 0

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        
        # Prepare claim identification
        claimant_name = str(row_dict.get("ClaimantName", f"Claimant {counter_offset + idx + 1}"))
        claim_number = str(row_dict.get("ClaimID", f"CLM-{datetime.date.today().year}{10000 + counter_offset + idx + 1}"))
        
        # Check if already exists, append random suffix if so
        existing = db.query(Claim).filter(Claim.claim_number == claim_number).first()
        if existing:
            claim_number = f"{claim_number}-{random.randint(100, 999)}"

        # Run ML inference and SHAP explainability
        explanation = explainer.predict_and_explain(row_dict)
        fraud_score = explanation["fraud_score"]
        risk_tier = explanation["risk_tier"]
        tier_counts[risk_tier] = tier_counts.get(risk_tier, 0) + 1

        claim_amount = float(row_dict.get("ClaimAmount", random.uniform(3000, 28000)))

        new_claim = Claim(
            claim_number=claim_number,
            claimant_name=claimant_name,
            age=int(row_dict.get("Age", 38)) if pd.notnull(row_dict.get("Age")) else 38,
            sex=str(row_dict.get("Sex", "Male")),
            marital_status=str(row_dict.get("MaritalStatus", "Single")),
            policy_type=str(row_dict.get("PolicyType", "Sedan - All Perils")),
            vehicle_category=str(row_dict.get("VehicleCategory", "Sedan")),
            vehicle_price=str(row_dict.get("VehiclePrice", "20000 to 29000")),
            deductible=int(row_dict.get("Deductible", 400)) if pd.notnull(row_dict.get("Deductible")) else 400,
            driver_rating=int(row_dict.get("DriverRating", 2)) if pd.notnull(row_dict.get("DriverRating")) else 2,
            claim_amount=claim_amount,
            past_claims=str(row_dict.get("PastNumberOfClaims", "none")),
            days_policy_accident=str(row_dict.get("Days_Policy_Accident", "more than 30")),
            address_change=str(row_dict.get("AddressChange_Claim", "no change")),
            police_report_filed=str(row_dict.get("PoliceReportFiled", "No")),
            witness_present=str(row_dict.get("WitnessPresent", "No")),
            fault=str(row_dict.get("Fault", "Policy Holder")),
            fraud_score=fraud_score,
            risk_tier=risk_tier,
            status="PENDING",
            summary_rationale=explanation["summary_rationale"],
            raw_features=json.dumps({k: str(v) for k, v in row_dict.items()}),
            top_risk_factors=json.dumps(explanation["top_factors"]),
            incident_date=str(row_dict.get("Month", "Jan")) + f" {random.randint(1, 28)}, 2026"
        )
        db.add(new_claim)
        ingested_count += 1

    db.commit()

    return {
        "status": "success",
        "message": f"Successfully ingested and evaluated {ingested_count} claims.",
        "ingested_count": ingested_count,
        "risk_breakdown": tier_counts
    }


@router.get("", response_model=ClaimListResponse)
def list_claims(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    risk_tier: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("fraud_score"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Claim)

    if risk_tier and risk_tier.upper() != "ALL":
        query = query.filter(Claim.risk_tier == risk_tier.upper())

    if status and status.upper() != "ALL":
        query = query.filter(Claim.status == status.upper())

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Claim.claim_number.ilike(search_fmt),
                Claim.claimant_name.ilike(search_fmt),
                Claim.policy_type.ilike(search_fmt)
            )
        )

    # Sorting
    sort_col = getattr(Claim, sort_by, Claim.fraud_score)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, (total + page_size - 1) // page_size)

    # Decode JSON fields for response
    output_items = []
    for c in items:
        factors = json.loads(c.top_risk_factors) if c.top_risk_factors else []
        output_items.append(ClaimOut(
            id=c.id,
            claim_number=c.claim_number,
            claimant_name=c.claimant_name,
            age=c.age,
            sex=c.sex,
            marital_status=c.marital_status,
            policy_type=c.policy_type,
            vehicle_category=c.vehicle_category,
            vehicle_price=c.vehicle_price,
            deductible=c.deductible,
            driver_rating=c.driver_rating,
            claim_amount=c.claim_amount,
            past_claims=c.past_claims,
            days_policy_accident=c.days_policy_accident,
            address_change=c.address_change,
            police_report_filed=c.police_report_filed,
            witness_present=c.witness_present,
            fault=c.fault,
            fraud_score=c.fraud_score,
            risk_tier=c.risk_tier,
            status=c.status,
            summary_rationale=c.summary_rationale,
            top_risk_factors=factors,
            created_at=c.created_at,
            reviews=[r for r in c.reviews]
        ))

    return ClaimListResponse(
        items=output_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{claim_id}", response_model=ClaimOut)
def get_claim_detail(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    factors = json.loads(claim.top_risk_factors) if claim.top_risk_factors else []
    return ClaimOut(
        id=claim.id,
        claim_number=claim.claim_number,
        claimant_name=claim.claimant_name,
        age=claim.age,
        sex=claim.sex,
        marital_status=claim.marital_status,
        policy_type=claim.policy_type,
        vehicle_category=claim.vehicle_category,
        vehicle_price=claim.vehicle_price,
        deductible=claim.deductible,
        driver_rating=claim.driver_rating,
        claim_amount=claim.claim_amount,
        past_claims=claim.past_claims,
        days_policy_accident=claim.days_policy_accident,
        address_change=claim.address_change,
        police_report_filed=claim.police_report_filed,
        witness_present=claim.witness_present,
        fault=claim.fault,
        fraud_score=claim.fraud_score,
        risk_tier=claim.risk_tier,
        status=claim.status,
        summary_rationale=claim.summary_rationale,
        top_risk_factors=factors,
        created_at=claim.created_at,
        reviews=[r for r in claim.reviews]
    )


@router.get("/{claim_id}/explain", response_model=ClaimExplainOut)
def get_claim_explanation(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    raw_data = json.loads(claim.raw_features) if claim.raw_features else {}
    if not raw_data:
        # Fallback to column values
        raw_data = {
            "Age": claim.age,
            "Sex": claim.sex,
            "MaritalStatus": claim.marital_status,
            "PolicyType": claim.policy_type,
            "VehicleCategory": claim.vehicle_category,
            "VehiclePrice": claim.vehicle_price,
            "Deductible": claim.deductible,
            "DriverRating": claim.driver_rating,
            "ClaimAmount": claim.claim_amount,
            "PastNumberOfClaims": claim.past_claims,
            "Days_Policy_Accident": claim.days_policy_accident,
            "AddressChange_Claim": claim.address_change,
            "PoliceReportFiled": claim.police_report_filed,
            "WitnessPresent": claim.witness_present,
            "Fault": claim.fault,
            "Month": "Jan",
            "DayOfWeek": "Monday",
            "Make": "Toyota",
            "AccidentArea": "Urban",
            "Days_Policy_Claim": "more than 30",
            "AgeOfVehicle": "3 years",
            "AgeOfPolicyHolder": "31 to 35",
            "AgentType": "External",
            "NumberOfSupplements": "none",
            "NumberOfCars": "1 vehicle",
            "Year": 2026,
            "BasePolicy": "All Perils"
        }

    explainer = get_explainer()
    explanation = explainer.predict_and_explain(raw_data)

    top_factors = [ShapFactor(**f) for f in explanation["top_factors"]]
    pos_factors = [ShapFactor(**f) for f in explanation["positive_factors"]]
    neg_factors = [ShapFactor(**f) for f in explanation["negative_factors"]]

    return ClaimExplainOut(
        claim_id=claim.id,
        claim_number=claim.claim_number,
        claimant_name=claim.claimant_name,
        fraud_score=claim.fraud_score,
        risk_tier=claim.risk_tier,
        base_value=explanation["base_value"],
        summary_rationale=explanation["summary_rationale"],
        top_factors=top_factors,
        positive_factors=pos_factors,
        negative_factors=neg_factors,
        raw_features=raw_data
    )


@router.post("/{claim_id}/review", response_model=ClaimOut)
def review_claim(
    claim_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    action_normalized = review_data.action.upper()
    if action_normalized not in ["APPROVED", "REJECTED", "ESCALATED", "PENDING"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be one of: APPROVED, REJECTED, ESCALATED, PENDING"
        )

    # Update claim status
    claim.status = action_normalized

    # Create review audit entry
    review_entry = ClaimReview(
        claim_id=claim.id,
        reviewer_id=current_user.id if current_user else None,
        reviewer_name=current_user.full_name if current_user else "Compliance Reviewer",
        action=action_normalized,
        notes=review_data.notes
    )
    db.add(review_entry)
    db.commit()
    db.refresh(claim)

    factors = json.loads(claim.top_risk_factors) if claim.top_risk_factors else []
    return ClaimOut(
        id=claim.id,
        claim_number=claim.claim_number,
        claimant_name=claim.claimant_name,
        age=claim.age,
        sex=claim.sex,
        marital_status=claim.marital_status,
        policy_type=claim.policy_type,
        vehicle_category=claim.vehicle_category,
        vehicle_price=claim.vehicle_price,
        deductible=claim.deductible,
        driver_rating=claim.driver_rating,
        claim_amount=claim.claim_amount,
        past_claims=claim.past_claims,
        days_policy_accident=claim.days_policy_accident,
        address_change=claim.address_change,
        police_report_filed=claim.police_report_filed,
        witness_present=claim.witness_present,
        fault=claim.fault,
        fraud_score=claim.fraud_score,
        risk_tier=claim.risk_tier,
        status=claim.status,
        summary_rationale=claim.summary_rationale,
        top_risk_factors=factors,
        created_at=claim.created_at,
        reviews=[r for r in claim.reviews]
    )
