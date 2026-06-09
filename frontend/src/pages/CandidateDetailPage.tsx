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

function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<CandidateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [scoreCategory, setScoreCategory] = useState("Technical");
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
    return <p className="muted">Loading details...</p>;
  }

  if (error) {
    return (
      <section className="surface-card detail-panel">
        <p className="form-error">{error}</p>
        <Link to="/candidates" className="button button-secondary inline-link">
          Back to candidates
        </Link>
      </section>
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
      setScoreSuccess("Score submitted.");
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
      setNotesSuccess("Internal notes updated.");
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
      <Link to="/candidates" className="button button-secondary inline-link">
        Back to candidates
      </Link>

      <article className="surface-card detail-card">
        <p className="eyebrow">Candidate profile</p>
        <h1>{candidate.name}</h1>
        <p className="muted">{candidate.email}</p>

        <div className="detail-grid">
          <div>
            <h4>Role applied</h4>
            <p>{candidate.role_applied}</p>
          </div>
          <div>
            <h4>Status</h4>
            <p>{candidate.status}</p>
          </div>
          <div>
            <h4>Skills</h4>
            <div className="skill-row">
              {(candidate.skills || []).map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <article className="surface-card detail-card">
        <h3>AI summary</h3>
        <p>{candidate.ai_summary || "No summary generated yet."}</p>
        {summaryError ? <p className="form-error">{summaryError}</p> : null}
        <button
          type="button"
          className="button button-secondary inline-link"
          onClick={onTriggerSummary}
          disabled={summaryLoading}
        >
          {summaryLoading ? "Generating summary..." : "Generate summary"}
        </button>
      </article>

      <article className="surface-card detail-card">
        <h3>Scores</h3>
        {candidate.scores?.length ? (
          <ul className="score-list">
            {candidate.scores.map((score) => (
              <li key={score.id}>
                <strong>{score.category}</strong>
                <span>{score.score}/5</span>
                <p className="muted">{score.note || "No note"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No scores visible for your role.</p>
        )}

        <form className="form-grid" onSubmit={onSubmitScore}>
          <h4>Add score</h4>

          <label className="field-label" htmlFor="score-category">
            Category
          </label>
          <input
            id="score-category"
            className="input"
            value={scoreCategory}
            onChange={(e) => setScoreCategory(e.target.value)}
            placeholder="Technical, communication, etc"
            required
          />

          <label className="field-label" htmlFor="score-value">
            Score (1-5)
          </label>
          <input
            id="score-value"
            className="input"
            type="number"
            min={1}
            max={5}
            value={scoreValue}
            onChange={(e) => setScoreValue(Number(e.target.value))}
            required
          />

          <label className="field-label" htmlFor="score-note">
            Note
          </label>
          <textarea
            id="score-note"
            className="input textarea"
            value={scoreNote}
            onChange={(e) => setScoreNote(e.target.value)}
            placeholder="Optional context for this score"
            rows={3}
          />

          {scoreError ? <p className="form-error">{scoreError}</p> : null}
          {scoreSuccess ? <p className="muted">{scoreSuccess}</p> : null}

          <button
            className="button button-primary"
            type="submit"
            disabled={scoreLoading}
          >
            {scoreLoading ? "Saving score..." : "Submit score"}
          </button>
        </form>
      </article>

      {canWriteNotes ? (
        <article className="surface-card detail-card">
          <h3>Internal notes (Admin)</h3>
          <form className="form-grid" onSubmit={onSaveNotes}>
            <label className="field-label" htmlFor="internal-notes">
              Team-only notes
            </label>
            <textarea
              id="internal-notes"
              className="input textarea"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={5}
              placeholder="Visible only to authorized staff"
            />

            {notesError ? <p className="form-error">{notesError}</p> : null}
            {notesSuccess ? <p className="muted">{notesSuccess}</p> : null}

            <button
              className="button button-primary"
              type="submit"
              disabled={notesLoading}
            >
              {notesLoading ? "Saving notes..." : "Save notes"}
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}

export default CandidateDetailPage;
