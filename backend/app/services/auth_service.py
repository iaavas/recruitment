from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import create_token, hash_password, verify_password


def _to_user_out(user: models.User, include_permissions: bool = False) -> schemas.UserOut:
	return schemas.UserOut(
		id=user.id,
		email=user.email,
		roles=[r.name for r in user.roles],
		permissions=list(user.permission_set()) if include_permissions else [],
	)


def register_user(db: Session, user_in: schemas.UserCreate) -> schemas.UserOut:
	try:
		if db.query(models.User).filter_by(email=user_in.email).first():
			raise HTTPException(status_code=400, detail="Email already registered")

		reviewer_role = db.query(models.Role).filter_by(name="reviewer").first()
		if not reviewer_role:
			raise HTTPException(
				status_code=500,
				detail="Reviewer role not seeded. Run seed first.",
			)

		user = models.User(
			email=user_in.email,
			hashed_password=hash_password(user_in.password),
		)
		user.roles = [reviewer_role]

		db.add(user)
		db.commit()
		db.refresh(user)
		return _to_user_out(user)

	except HTTPException:
		db.rollback()
		raise
	except IntegrityError:
		db.rollback()
		raise HTTPException(status_code=400, detail="Email already registered")
	except SQLAlchemyError:
		db.rollback()
		raise HTTPException(status_code=500, detail="Failed to register user")


def login_user(db: Session, form: OAuth2PasswordRequestForm) -> schemas.Token:
	try:
		user = db.query(models.User).filter_by(email=form.username).first()
		if not user or not verify_password(form.password, user.hashed_password):
			raise HTTPException(status_code=401, detail="Invalid credentials")
		return schemas.Token(access_token=create_token(user), token_type="bearer")
	except HTTPException:
		raise
	except SQLAlchemyError:
		raise HTTPException(status_code=500, detail="Failed to login")


def me_user(current_user: models.User) -> schemas.UserOut:
	return _to_user_out(current_user, include_permissions=True)
