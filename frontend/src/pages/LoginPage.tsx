import { AxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ErrorPayload {
  detail?: string;
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/candidates";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const apiError = err as AxiosError<ErrorPayload>;
      setError(
        apiError.response?.data?.detail ||
          "Could not sign in. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell center-panel">
      <section className="auth-card surface-card reveal-up">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>Sign in</h1>
          <p className="muted">
            Access secure, role-aware workflows for your hiring team.
          </p>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="username"
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="password"
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: "0.5rem" }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--slate-100)", paddingTop: "1rem" }}>
          <p className="muted small">
            New reviewer? <Link to="/register">Create reviewer account</Link>
          </p>
          <p className="muted small">
            Applying as a candidate? <Link to="/apply">Submit application</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
