from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserLogin, Token, UserOut
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name, "user_id": user.id}
    )
    return Token(access_token=access_token, user=UserOut.from_orm(user))

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/presets")
def get_demo_accounts():
    return {
        "admin": {
            "email": "admin@fraudshield.ai",
            "password": "AdminPassword123!",
            "role": "admin",
            "description": "Full access to upload, manage, review, and view all audit metrics."
        },
        "reviewer": {
            "email": "reviewer@fraudshield.ai",
            "password": "ReviewerPassword123!",
            "role": "reviewer",
            "description": "Access to claims queue, SHAP explainability insights, and approve/reject actions."
        }
    }
