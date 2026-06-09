import json
from datetime import datetime,timezone
from typing import AsyncGenerator

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from .constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from .. import models, schemas



def serialize_candidate(c: models.Candidate, current_user: models.User) -> schemas.CandidateOut:
	show_all_scores = current_user.has_permission("scores", "read_all")
	show_notes = current_user.has_permission("candidates", "read_internal_notes")

	visible_scores = (
		c.scores if show_all_scores else [s for s in c.scores if s.reviewer_id == current_user.id]
	)
	return schemas.CandidateOut(
		id=c.id,
		name=c.name,
		email=c.email,
		role_applied=c.role_applied,
		status=c.status,
		skills=json.loads(c.skills or "[]"),
		ai_summary=c.ai_summary,
		created_at=c.created_at,
		scores=[schemas.ScoreOut.model_validate(s) for s in visible_scores],
		internal_notes=c.internal_notes if show_notes else None,
	)


def get_candidates(
	db: Session,
	status: str = None,
	role_applied: str = None,
	skill: str = None,
	keyword: str = None,
	page: int = 1,
	page_size: int = DEFAULT_PAGE_SIZE,
):
	try:
		page = page if page and page > 0 else 1
		page_size = page_size if page_size and page_size > 0 else DEFAULT_PAGE_SIZE
		page_size = min(page_size, MAX_PAGE_SIZE)
		offset = (page - 1) * page_size
		query = db.query(models.Candidate).filter(models.Candidate.deleted_at == None)

		if status:
			query = query.filter(models.Candidate.status == status)
		if role_applied:
			query = query.filter(models.Candidate.role_applied == role_applied)
		if skill:
			query = query.filter(models.Candidate.skills.ilike(f'%"{skill}"%'))
		if keyword:
			like = f"%{keyword}%"
			query = query.filter(
				or_(
					models.Candidate.name.ilike(like),
					models.Candidate.email.ilike(like),
					models.Candidate.role_applied.ilike(like),
				)
			)

		total = query.count()
		items = (
			query.order_by(models.Candidate.created_at.desc())
			.offset(offset)
			.limit(page_size)
			.all()
		)
		return items, total
	except SQLAlchemyError:
		raise HTTPException(status_code=500, detail="Failed to list candidates")


def list_candidates_out(
	db: Session,
	current_user: models.User,
	status: str = None,
	role_applied: str = None,
	skill: str = None,
	keyword: str = None,
	page: int = 1,
	page_size: int = DEFAULT_PAGE_SIZE,
) -> schemas.CandidateListOut:
	page = page if page and page > 0 else 1
	page_size = page_size if page_size and page_size > 0 else DEFAULT_PAGE_SIZE
	page_size = min(page_size, MAX_PAGE_SIZE)
	items, total = get_candidates(db, status, role_applied, skill, keyword, page, page_size)
	return schemas.CandidateListOut(
		items=[serialize_candidate(c, current_user) for c in items],
		total=total,
		page=page,
		page_size=page_size,
	)


def get_candidate_out(db: Session, candidate_id: str, current_user: models.User) -> schemas.CandidateOut:
	try:
		candidate = db.query(models.Candidate).filter(
			models.Candidate.id == candidate_id,
			models.Candidate.deleted_at == None,
		).first()
		if not candidate:
			raise HTTPException(status_code=404, detail="Candidate not found")
		return serialize_candidate(candidate, current_user)
	except HTTPException:
		raise
	except SQLAlchemyError:
		raise HTTPException(status_code=500, detail="Failed to fetch candidate")


def submit_score(
	db: Session,
	candidate_id: str,
	score_in: schemas.ScoreCreate,
	current_user: models.User,
):
	try:
		if not 1 <= score_in.score <= 5:
			raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

		candidate = db.query(models.Candidate).filter(
			models.Candidate.id == candidate_id,
			models.Candidate.deleted_at == None,
		).first()
		if not candidate:
			raise HTTPException(status_code=404, detail="Candidate not found")

		score = models.Score(
			candidate_id=candidate_id,
			reviewer_id=current_user.id,
			category=score_in.category,
			score=score_in.score,
			note=score_in.note or "",
		)
		db.add(score)
		db.commit()
		db.refresh(score)
		return {"message": "Score submitted", "id": score.id}

	except HTTPException:
		db.rollback()
		raise
	except SQLAlchemyError:
		db.rollback()
		raise HTTPException(status_code=500, detail="Failed to submit score")


def update_internal_notes(db: Session, candidate_id: str, notes: str):
	try:
		candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
		if not candidate:
			raise HTTPException(status_code=404, detail="Candidate not found")

		candidate.internal_notes = notes
		db.commit()
		return {"message": "Notes updated"}

	except HTTPException:
		db.rollback()
		raise
	except SQLAlchemyError:
		db.rollback()
		raise HTTPException(status_code=500, detail="Failed to update notes")


def soft_delete_candidate(db: Session, candidate_id: str):
	try:
		candidate = db.query(models.Candidate).filter(
			models.Candidate.id == candidate_id,
			models.Candidate.deleted_at == None,
		).first()
		if not candidate:
			raise HTTPException(status_code=404, detail="Candidate not found")

		candidate.deleted_at = datetime.now(timezone.utc)
		db.commit()
		return {"message": "Candidate archived"}

	except HTTPException:
		db.rollback()
		raise
	except SQLAlchemyError:
		db.rollback()
		raise HTTPException(status_code=500, detail="Failed to archive candidate")


async def generate_ai_summary(candidate_id: str, db: Session):
	try:
		candidate = db.query(models.Candidate).filter(
			models.Candidate.id == candidate_id,
			models.Candidate.deleted_at == None,
		).first()
		if not candidate:
			return None

		skills = json.loads(candidate.skills or "[]")
		avg_score = None
		if candidate.scores:
			avg_score = round(sum(s.score for s in candidate.scores) / len(candidate.scores), 2)

		parts = [
			f"{candidate.name} applied for {candidate.role_applied}.",
			f"Status: {candidate.status}.",
		]
		if skills:
			parts.append(f"Key skills: {', '.join(skills)}.")
		if avg_score is not None:
			parts.append(f"Average interview score: {avg_score}/5.")

		summary = " ".join(parts)
		candidate.ai_summary = summary
		db.commit()
		return summary

	except SQLAlchemyError:
		db.rollback()
		raise HTTPException(status_code=500, detail="Failed to generate summary")


async def stream_scores_events(
	db: Session,
	candidate_id: str,
	current_user: models.User,
) -> AsyncGenerator[str, None]:
	for _ in range(10):
		import asyncio

		await asyncio.sleep(1)
		try:
			candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
			if not candidate:
				break

			scores = (
				candidate.scores
				if current_user.has_permission("scores", "read_all")
				else [s for s in candidate.scores if s.reviewer_id == current_user.id]
			)
			data = json.dumps(
				[{"id": s.id, "category": s.category, "score": s.score} for s in scores]
			)
			yield f"data: {data}\\n\\n"
		except SQLAlchemyError:
			break
