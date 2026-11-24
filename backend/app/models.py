import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="reviewer", nullable=False)  # 'admin' or 'reviewer'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reviews = relationship("ClaimReview", back_populates="reviewer")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(64), unique=True, index=True, nullable=False)
    claimant_name = Column(String(128), index=True, nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String(16), nullable=True)
    marital_status = Column(String(32), nullable=True)
    policy_type = Column(String(64), nullable=True)
    vehicle_category = Column(String(32), nullable=True)
    vehicle_price = Column(String(64), nullable=True)
    deductible = Column(Integer, nullable=True)
    driver_rating = Column(Integer, nullable=True)
    claim_amount = Column(Float, nullable=False, default=0.0)
    
    past_claims = Column(String(32), nullable=True)
    days_policy_accident = Column(String(32), nullable=True)
    address_change = Column(String(32), nullable=True)
    police_report_filed = Column(String(16), nullable=True)
    witness_present = Column(String(16), nullable=True)
    fault = Column(String(32), nullable=True)
    
    fraud_score = Column(Float, index=True, nullable=False, default=0.0)
    risk_tier = Column(String(16), index=True, nullable=False, default="LOW")  # LOW, MEDIUM, HIGH
    status = Column(String(16), index=True, nullable=False, default="PENDING")  # PENDING, APPROVED, REJECTED, ESCALATED
    
    summary_rationale = Column(Text, nullable=True)
    raw_features = Column(Text, nullable=True)  # JSON-encoded dictionary of original features
    top_risk_factors = Column(Text, nullable=True)  # JSON-encoded array of top SHAP factors
    incident_date = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    reviews = relationship("ClaimReview", back_populates="claim", cascade="all, delete-orphan")


class ClaimReview(Base):
    __tablename__ = "claim_reviews"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_name = Column(String(128), nullable=False)
    action = Column(String(32), nullable=False)  # APPROVED, REJECTED, ESCALATED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")
