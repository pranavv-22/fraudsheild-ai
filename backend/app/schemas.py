import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Review Schemas
class ReviewCreate(BaseModel):
    action: str  # APPROVED, REJECTED, ESCALATED
    notes: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    claim_id: int
    reviewer_id: Optional[int]
    reviewer_name: str
    action: str
    notes: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Explainability Schemas
class ShapFactor(BaseModel):
    feature: str
    display_name: str
    value: str
    shap_value: float
    direction: str  # RISK_INCREASING or RISK_DECREASING
    abs_impact: float

class ClaimExplainOut(BaseModel):
    claim_id: int
    claim_number: str
    claimant_name: str
    fraud_score: float
    risk_tier: str
    base_value: float
    summary_rationale: str
    top_factors: List[ShapFactor]
    positive_factors: List[ShapFactor]
    negative_factors: List[ShapFactor]
    raw_features: Dict[str, Any]

# Claim Schemas
class ClaimOut(BaseModel):
    id: int
    claim_number: str
    claimant_name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    marital_status: Optional[str] = None
    policy_type: Optional[str] = None
    vehicle_category: Optional[str] = None
    vehicle_price: Optional[str] = None
    deductible: Optional[int] = None
    driver_rating: Optional[int] = None
    claim_amount: float
    past_claims: Optional[str] = None
    days_policy_accident: Optional[str] = None
    address_change: Optional[str] = None
    police_report_filed: Optional[str] = None
    witness_present: Optional[str] = None
    fault: Optional[str] = None
    fraud_score: float
    risk_tier: str
    status: str
    summary_rationale: Optional[str] = None
    top_risk_factors: Optional[List[Dict[str, Any]]] = None
    created_at: datetime.datetime
    reviews: List[ReviewOut] = []

    class Config:
        from_attributes = True

class ClaimListResponse(BaseModel):
    items: List[ClaimOut]
    total: int
    page: int
    page_size: int
    total_pages: int

# Stats Schemas
class ConfusionMatrixData(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int

class ModelMetricsOut(BaseModel):
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: ConfusionMatrixData
    train_samples: int
    test_samples: int
    global_feature_importance: List[Dict[str, Any]]

class StatsResponse(BaseModel):
    total_claims: int
    flagged_claims: int
    flagged_percentage: float
    pending_reviews: int
    approved_claims: int
    rejected_claims: int
    escalated_claims: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_fraud_score: float
    model_metrics: Optional[ModelMetricsOut] = None
