import jwt
from jwt import InvalidTokenError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from datetime import datetime, timezone, timedelta
from .database import get_db
from .constants import SECRET_KEY, ALGORITHM, EXPIRE_MIN

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False

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
    except InvalidTokenError:
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



