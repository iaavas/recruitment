import { AxiosError } from "axios";
import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { CandidateOut } from "../types/api";

interface ErrorPayload {
  detail?: string;
}

interface ScoreCreatePayload {
  category: string;
  score: number;
  note?: string;
}

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase()}`;
}

function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<CandidateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [scoreCategory, setScoreCategory] = useState("Technical Skill");
  const [scoreValue, setScoreValue] = useState(3);
  const [scoreNote, setScoreNote] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState("");

  const [notesValue, setNotesValue] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesSuccess, setNotesSuccess] = useState("");

  const canWriteNotes = useMemo(() => {
    return (
      user?.roles?.includes("admin") ||
      user?.permissions?.includes("candidates:write_internal_notes")
    );
  }, [user]);

  useEffect(() => {
    if (!id) {
      setError("Candidate ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;

    const fetchCandidate = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get<CandidateOut>(`/candidates/${id}`);
        if (active) {
          setCandidate(data);
          setNotesValue(data.internal_notes || "");
        }
      } catch (err) {
        if (active) {
          const apiError = err as AxiosError<ErrorPayload>;
          setError(
            apiError.response?.data?.detail ||
              "Failed to load candidate details.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCandidate();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell">
        <p className="muted" style={{ textAlign: "center", padding: "4rem" }}>Loading candidate profile details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="surface-card detail-card" style={{ gap: "1.5rem", padding: "3rem", textAlign: "center" }}>
          <div className="form-error" style={{ display: "inline-block" }}>{error}</div>
          <div>
            <Link to="/candidates" className="button button-secondary inline-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to candidates list
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  const onTriggerSummary = async () => {
    if (!id) {
      return;
    }

    setSummaryError("");
    setSummaryLoading(true);
    try {
      const { data } = await api.post<{ summary: string }>(
        `/candidates/${id}/summary`,
      );
      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              ai_summary: data.summary,
            }
          : prev,
      );
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setSummaryError(
        apiError.response?.data?.detail || "Failed to generate summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const onSubmitScore = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setScoreError("");
    setScoreSuccess("");
    setScoreLoading(true);

    const payload: ScoreCreatePayload = {
      category: scoreCategory,
      score: scoreValue,
      note: scoreNote.trim() || undefined,
    };

    try {
      await api.post(`/candidates/${id}/scores`, payload);
      const { data } = await api.get<CandidateOut>(`/candidates/${id}`);
      setCandidate(data);
      setScoreNote("");
      setScoreSuccess("Evaluation score submitted successfully.");
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setScoreError(
        apiError.response?.data?.detail || "Failed to submit score.",
      );
    } finally {
      setScoreLoading(false);
    }
  };

  const onSaveNotes = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setNotesError("");
    setNotesSuccess("");
    setNotesLoading(true);

    try {
      await api.patch(`/candidates/${id}/notes`, { notes: notesValue });
      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              internal_notes: notesValue,
            }
          : prev,
      );
      setNotesSuccess("Internal notes updated successfully.");
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setNotesError(
        apiError.response?.data?.detail || "Failed to update notes.",
      );
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <section className="detail-panel reveal-up">
      <div style={{ marginBottom: "0.5rem" }}>
        <Link to="/candidates" className="button button-secondary inline-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to pipeline
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)", gap: "1.5rem" }} className="responsive-detail-layout">
        {/* Left Column: Profile, Summary, Internal Notes */}
        <div style={{ display: "grid", gap: "1.5rem", contentVisibility: "auto" }}>
          
          <article className="surface-card detail-card" style={{ borderRadius: "16px" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Candidate Profile</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <h1 style={{ fontSize: "2.25rem" }}>{candidate.name}</h1>
                <span className={statusClass(candidate.status)}>{candidate.status}</span>
              </div>
              <p className="muted" style={{ marginTop: "0.25rem", fontWeight: 500 }}>{candidate.email}</p>
            </div>

            <div className="detail-grid" style={{ borderTop: "1px solid var(--slate-100)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
              <div className="detail-grid-item">
                <h4>Role Applied For</h4>
                <p style={{ fontWeight: 600, color: "var(--slate-900)" }}>{candidate.role_applied}</p>
              </div>
              <div className="detail-grid-item">
                <h4>Skills & Keywords</h4>
                <div className="skill-row" style={{ marginTop: "0.25rem" }}>
                  {(candidate.skills || []).length > 0 ? (
                    candidate.skills.map((skill) => (
                      <span key={skill} className="chip">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="muted" style={{ fontSize: "0.85rem" }}>None specified</span>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="surface-card detail-card" style={{ borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3 style={{ margin: 0 }}>AI Profile Summary</h3>
            </div>
            
            <div style={{ 
              backgroundColor: "var(--slate-50)", 
              padding: "1.25rem", 
              borderRadius: "var(--radius-md)", 
              border: "1px dashed var(--slate-200)",
              minHeight: "80px",
              lineHeight: 1.6,
              fontSize: "0.95rem",
              color: candidate.ai_summary ? "var(--slate-800)" : "var(--slate-400)"
            }}>
              {candidate.ai_summary || "No automated summary has been generated for this applicant yet."}
            </div>

            {summaryError ? <p className="form-error">{summaryError}</p> : null}
            
            <div>
              <button
                type="button"
                className="button button-secondary"
                onClick={onTriggerSummary}
                disabled={summaryLoading}
                style={{ width: "100%" }}
              >
                {summaryLoading ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 50 50" style={{ animation: "spin 1s linear infinite", marginRight: "0.5rem" }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5"></circle>
                    </svg>
                    Analyzing application...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    Generate AI Summary
                  </>
                )}
              </button>
            </div>
          </article>

          {canWriteNotes ? (
            <article className="surface-card detail-card" style={{ borderRadius: "16px", borderLeft: "4px solid var(--brand-600)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h3 style={{ margin: 0 }}>Internal Team Notes <span style={{ fontSize: "0.75rem", verticalAlign: "middle", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "var(--brand-light)", color: "var(--brand-700)", marginLeft: "0.5rem" }}>Admin Only</span></h3>
              </div>
              
              <form className="form-grid" onSubmit={onSaveNotes}>
                <textarea
                  id="internal-notes"
                  className="input textarea"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Record private evaluation details, background checks, or scheduling availability. Visible only to authorized recruiters."
                  rows={5}
                />

                {notesError ? <p className="form-error">{notesError}</p> : null}
                {notesSuccess ? (
                  <div style={{
                    color: "var(--success-700)",
                    backgroundColor: "var(--success-light)",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    borderLeft: "3px solid var(--success-600)"
                  }}>
                    {notesSuccess}
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={notesLoading}
                  >
                    {notesLoading ? "Saving notes..." : "Save internal notes"}
                  </button>
                </div>
              </form>
            </article>
          ) : null}
        </div>

        {/* Right Column: Scorecards & Evaluations Form */}
        <div style={{ display: "grid", gap: "1.5rem", contentVisibility: "auto" }}>
          
          <article className="surface-card detail-card" style={{ borderRadius: "16px" }}>
            <h3>Evaluation Scorecard</h3>
            
            {candidate.scores?.length ? (
              <ul className="score-list">
                {candidate.scores.map((score) => (
                  <li key={score.id}>
                    <div className="score-category-note">
                      <strong>{score.category}</strong>
                      <p className="muted small" style={{ margin: 0 }}>
                        {score.note || "No review note provided."}
                      </p>
                    </div>
                    <div className="score-badge">
                      {score.score}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", border: "1px dashed var(--slate-200)", borderRadius: "var(--radius-md)", backgroundColor: "var(--slate-50)" }}>
                <p className="muted small" style={{ margin: 0 }}>No scorecards recorded for this applicant yet.</p>
              </div>
            )}

            <form className="form-grid" onSubmit={onSubmitScore} style={{ borderTop: "1px solid var(--slate-100)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
              <h4 style={{ color: "var(--slate-900)" }}>Record Evaluation</h4>

              <label className="field-label" htmlFor="score-category">
                Evaluation Category
              </label>
              <select
                id="score-category"
                className="input"
                value={scoreCategory}
                onChange={(e) => setScoreCategory(e.target.value)}
                required
                style={{ height: "38px" }}
              >
                <option value="Technical Skill">Technical Skill</option>
                <option value="Communication">Communication</option>
                <option value="Problem Solving">Problem Solving</option>
                <option value="Cultural Fit">Cultural Fit</option>
                <option value="Experience & Background">Experience & Background</option>
              </select>

              <label className="field-label" htmlFor="score-value">
                Score (1 = Poor, 5 = Excellent)
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScoreValue(num)}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: "var(--radius-md)",
                      border: scoreValue === num ? "1px solid var(--brand-600)" : "1px solid var(--slate-200)",
                      backgroundColor: scoreValue === num ? "var(--brand-light)" : "#ffffff",
                      color: scoreValue === num ? "var(--brand-700)" : "var(--slate-700)",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      outline: "none"
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor="score-note">
                Evaluation Note
              </label>
              <textarea
                id="score-note"
                className="input textarea"
                value={scoreNote}
                onChange={(e) => setScoreNote(e.target.value)}
                placeholder="Details of performance, reasoning for score, etc."
                rows={3}
              />

              {scoreError ? <p className="form-error">{scoreError}</p> : null}
              {scoreSuccess ? (
                <div style={{
                  color: "var(--success-700)",
                  backgroundColor: "var(--success-light)",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  borderLeft: "3px solid var(--success-600)"
                }}>
                  {scoreSuccess}
                </div>
              ) : null}

              <button
                className="button button-primary"
                type="submit"
                disabled={scoreLoading}
                style={{ width: "100%" }}
              >
                {scoreLoading ? "Saving score..." : "Submit evaluation"}
              </button>
            </form>
          </article>
        </div>
      </div>

      {/* Style overrides for details split layout */}
      <style>{`
        @media (max-width: 900px) {
          .responsive-detail-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

export default CandidateDetailPage;
