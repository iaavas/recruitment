import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import type { CandidateOut } from "../types/api";

interface ErrorPayload {
  detail?: string;
}

function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      </article>
    </section>
  );
}

export default CandidateDetailPage;
