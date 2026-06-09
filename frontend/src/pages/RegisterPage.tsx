import { AxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ErrorPayload {
  detail?: string;
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ email, password });
      navigate("/candidates", { replace: true });
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setError(
        apiError.response?.data?.detail ||
          "Could not create account right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell center-panel">
      <section className="auth-card surface-card reveal-up">
        <p className="eyebrow">Create your account</p>
        <h1>Join the hiring workspace</h1>
        <p className="muted">
          Every new account is registered as a reviewer by default.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reviewer@company.com"
            required
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />

          <label className="field-label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />

          {error ? <p className="form-error">{error}</p> : null}

          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="muted small">
          Already have access? <Link to="/login">Sign in</Link>
        </p>
        <p className="muted small">
          Applying as a candidate? <Link to="/apply">Submit application</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterPage;
