from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          str
    email:       str
    roles:       List[str] = []
    permissions: List[str] = []  

class Token(BaseModel):
    access_token: str
    token_type:   str

class ScoreCreate(BaseModel):
    category: str
    score:    int
    note:     Optional[str] = ""

class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          str
    category:    str
    score:       int
    note:        str
    reviewer_id: str
    created_at:  datetime

class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:             str
    name:           str
    email:          str
    role_applied:   str
    status:         str
    skills:         List[str]
    ai_summary:     str
    created_at:     datetime
    scores:         List[ScoreOut] = []
    internal_notes: Optional[str] = None   

class CandidateListOut(BaseModel):
    items:     List[CandidateOut]
    total:     int
    page:      int
    page_size: int


class CandidateApplyIn(BaseModel):
    name: str
    email: EmailStr
    role_applied: str
    skills: List[str] = []


class CandidateApplyOut(BaseModel):
    id: str
    message: str