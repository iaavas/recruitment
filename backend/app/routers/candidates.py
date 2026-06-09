from fastapi import APIRouter, Depends, Query, Body, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth import (
    require_permission,
)
from ..database import get_db
from ..services import candidate_service

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.get("", response_model=schemas.CandidateListOut)
def list_candidates(
    status:       str = None,
    role_applied: str = None,
    skill:        str = None,
    keyword:      str = None,
    page:         int = Query(1, ge=1),
    page_size:    int = Query(20, ge=1, le=50),
    db:           Session       = Depends(get_db),
    current_user: models.User   = Depends(require_permission("candidates", "list")),
):
    return candidate_service.list_candidates_out(
        db=db,
        current_user=current_user,
        status=status,
        role_applied=role_applied,
        skill=skill,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )


@router.get("/{id}", response_model=schemas.CandidateOut)
def get_candidate(
    id:           str,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("candidates", "read")),
):
    return candidate_service.get_candidate_out(db=db, candidate_id=id, current_user=current_user)


@router.post("/{id}/scores")
def submit_score(
    id:           str,
    score_in:     schemas.ScoreCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("scores", "create")),
):
    return candidate_service.submit_score(
        db=db,
        candidate_id=id,
        score_in=score_in,
        current_user=current_user,
    )


@router.patch("/{id}/notes")
def update_internal_notes(
    id:           str,
    notes:        str = Body(..., embed=True),
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("candidates", "write_internal_notes")),
):
    return candidate_service.update_internal_notes(db=db, candidate_id=id, notes=notes)


@router.delete("/{id}")
def soft_delete_candidate(
    id:           str,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("candidates", "soft_delete")),
):
    return candidate_service.soft_delete_candidate(db=db, candidate_id=id)


@router.post("/{id}/summary")
async def trigger_summary(
    id:           str,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("summary", "trigger")),
):
    summary = await candidate_service.generate_ai_summary(candidate_id=id, db=db)
    if not summary:
        raise HTTPException(404, "Candidate not found")
    return {"summary": summary}


@router.get("/{id}/stream")
async def stream_scores(
    id:           str,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_permission("scores", "read_own")),
):
    return StreamingResponse(
        candidate_service.stream_scores_events(db=db, candidate_id=id, current_user=current_user),
        media_type="text/event-stream",
    )