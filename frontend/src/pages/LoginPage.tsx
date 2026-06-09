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
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to TechKraft ATS</h1>
        <p className="muted">
          Secure, role-aware candidate workflows for your hiring team.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
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
            placeholder="Enter your password"
            required
          />

          {error ? <p className="form-error">{error}</p> : null}

          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="muted small">
          New reviewer? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
