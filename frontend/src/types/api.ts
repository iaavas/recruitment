export interface UserOut {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface ScoreOut {
  id: string;
  category: string;
  score: number;
  note: string;
  reviewer_id: string;
  created_at: string;
}

export interface CandidateOut {
  id: string;
  name: string;
  email: string;
  role_applied: string;
  status: string;
  skills: string[];
  ai_summary: string;
  created_at: string;
  scores: ScoreOut[];
  internal_notes?: string | null;
}

export interface CandidateListOut {
  items: CandidateOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface CandidateApplyRequest {
  name: string;
  email: string;
  role_applied: string;
  skills: string[];
}

export interface CandidateApplyResponse {
  id: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
