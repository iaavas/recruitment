from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from datetime import datetime, timezone, timedelta
from .database import get_db
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-key-change-in-prod")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user: models.User) -> str:
    
    payload = {
        "sub":         user.id,
        "email":       user.email,
        "roles":       [r.name for r in user.roles],
        "permissions": list(user.permission_set()), 
        "exp":         datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise exc
    except JWTError:
        raise exc

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.deleted_at == None)
        .first()
    )
    if not user:
        raise exc
    return user


def require_permission(resource: str, action: str):
    def dependency(current_user: models.User = Depends(get_current_user)):
        if not current_user.has_permission(resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {resource}:{action}",
            )
        return current_user
    return dependency



can_list_candidates   = Depends(require_permission("candidates", "list"))
can_read_candidate    = Depends(require_permission("candidates", "read"))
can_create_score      = Depends(require_permission("scores",     "create"))
can_read_all_scores   = Depends(require_permission("scores",     "read_all"))
can_read_own_scores   = Depends(require_permission("scores",     "read_own"))
can_read_notes        = Depends(require_permission("candidates", "read_internal_notes"))
can_write_notes       = Depends(require_permission("candidates", "write_internal_notes"))
can_trigger_summary   = Depends(require_permission("summary",    "trigger"))
can_soft_delete       = Depends(require_permission("candidates", "soft_delete"))