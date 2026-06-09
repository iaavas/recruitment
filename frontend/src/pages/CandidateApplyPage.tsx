import { AxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import type {
  CandidateApplyRequest,
  CandidateApplyResponse,
} from "../types/api";

interface ErrorPayload {
  detail?: string;
}

function CandidateApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleApplied, setRoleApplied] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const payload: CandidateApplyRequest = {
      name: name.trim(),
      email: email.trim(),
      role_applied: roleApplied.trim(),
      skills: skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    try {
      const { data } = await api.post<CandidateApplyResponse>(
        "/candidates/apply",
        payload,
      );
      setSuccess(`${data.message}. Reference ID: ${data.id}`);
      setName("");
      setEmail("");
      setRoleApplied("");
      setSkillsText("");
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setError(
        apiError.response?.data?.detail || "Could not submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell center-panel">
      <section className="auth-card surface-card reveal-up">
        <p className="eyebrow">Careers at TechKraft</p>
        <h1>Apply as a candidate</h1>
        <p className="muted">
          Submit your profile and our hiring team will review it.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="candidate-name">
            Full name
          </label>
          <input
            id="candidate-name"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />

          <label className="field-label" htmlFor="candidate-email">
            Email
          </label>
          <input
            id="candidate-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label className="field-label" htmlFor="candidate-role">
            Role applied
          </label>
          <input
            id="candidate-role"
            className="input"
            type="text"
            value={roleApplied}
            onChange={(e) => setRoleApplied(e.target.value)}
            placeholder="Frontend Engineer"
            required
          />

          <label className="field-label" htmlFor="candidate-skills">
            Skills
          </label>
          <input
            id="candidate-skills"
            className="input"
            type="text"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, TypeScript, CSS"
          />

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="muted">{success}</p> : null}

          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>

        <p className="muted small">
          Hiring team member? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default CandidateApplyPage;
