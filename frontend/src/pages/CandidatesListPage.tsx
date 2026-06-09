import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import type { CandidateListOut, CandidateOut } from "../types/api";

interface CandidateFilters {
  keyword: string;
  status: string;
  role_applied: string;
  skill: string;
}

interface ErrorPayload {
  detail?: string;
}

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase()}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  if (!name) return "?";
  const cleanName = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase() || "?";
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function CandidatesListPage() {
  const SEARCH_DEBOUNCE_MS = 400;
  const [items, setItems] = useState<CandidateOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<CandidateFilters>({
    keyword: "",
    status: "",
    role_applied: "",
    skill: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(filters.keyword);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.keyword, SEARCH_DEBOUNCE_MS]);

  useEffect(() => {
    let active = true;

    const fetchCandidates = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          page_size: pageSize,
          ...(debouncedKeyword ? { keyword: debouncedKeyword } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.role_applied
            ? { role_applied: filters.role_applied }
            : {}),
          ...(filters.skill ? { skill: filters.skill } : {}),
        };
        const { data } = await api.get<CandidateListOut>("/candidates", {
          params,
        });
        if (!active) {
          return;
        }
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        if (active) {
          const apiError = err as AxiosError<ErrorPayload>;
          setError(
            apiError.response?.data?.detail || "Failed to load candidates.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCandidates();
    return () => {
      active = false;
    };
  }, [
    debouncedKeyword,
    filters.status,
    filters.role_applied,
    filters.skill,
    page,
    pageSize,
  ]);

  const handleFilterChange = (field: keyof CandidateFilters, value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="reveal-up" style={{ display: "grid", gap: "1rem" }}>
      <div className="panel-head surface-card" style={{ padding: "1.75rem 2rem", borderRadius: "16px" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>Review Workspace</p>
          <h1 style={{ fontSize: "2rem" }}>Hiring Pipeline</h1>
          <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Track active applicants, focus scoring sessions, and move talent faster.
          </p>
        </div>
        <div className="list-metrics">
          <p className="metric-label">Total Applicants</p>
          <p className="metric-value">{total}</p>
        </div>
      </div>

      <div className="filters-grid surface-card" style={{ padding: "1.25rem", borderRadius: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label className="small" style={{ fontWeight: 600, color: "var(--slate-600)" }}>Search Keyword</label>
          <input
            className="input"
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            placeholder="Search name, email, role..."
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label className="small" style={{ fontWeight: 600, color: "var(--slate-600)" }}>Role Applied</label>
          <input
            className="input"
            value={filters.role_applied}
            onChange={(e) => handleFilterChange("role_applied", e.target.value)}
            placeholder="e.g. Frontend"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label className="small" style={{ fontWeight: 600, color: "var(--slate-600)" }}>Required Skill</label>
          <input
            className="input"
            value={filters.skill}
            onChange={(e) => handleFilterChange("skill", e.target.value)}
            placeholder="e.g. React"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label className="small" style={{ fontWeight: 600, color: "var(--slate-600)" }}>Status Filter</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{ height: "38px" }}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table-shell surface-card" style={{ borderRadius: "16px" }}>
        <div className="table-scroll">
          <table className="candidate-table" aria-label="Candidates list">
            <thead>
              <tr>
                <th style={{ paddingLeft: "2rem" }}>Candidate</th>
                <th>Role Applied</th>
                <th>Pipeline Status</th>
                <th>Skills Highlight</th>
                <th>Applied Date</th>
                <th style={{ paddingRight: "2rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-message muted">
                    Loading pipeline data...
                  </td>
                </tr>
              ) : null}

              {error ? (
                <tr>
                  <td colSpan={6} className="table-message form-error" style={{ margin: "2rem" }}>
                    {error}
                  </td>
                </tr>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-message muted">
                    No candidates found matching your filter criteria.
                  </td>
                </tr>
              ) : null}

              {items.map((candidate) => (
                <tr key={candidate.id}>
                  <td style={{ paddingLeft: "2rem" }}>
                    <div className="candidate-name-cell">
                      <div className="avatar-circle">
                        {getInitials(candidate.name)}
                      </div>
                      <div className="candidate-info">
                        <strong>{candidate.name}</strong>
                        <span className="muted" style={{ fontSize: "0.85rem" }}>{candidate.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: "var(--slate-700)" }}>{candidate.role_applied}</span>
                  </td>
                  <td>
                    <span className={statusClass(candidate.status)}>{candidate.status}</span>
                  </td>
                  <td>
                    <div className="skill-row">
                      {(candidate.skills || []).slice(0, 3).map((skill) => (
                        <span key={skill} className="chip">
                          {skill}
                        </span>
                      ))}
                      {(candidate.skills || []).length > 3 ? (
                        <span className="muted small" style={{ alignSelf: "center", marginLeft: "0.25rem", fontWeight: 600 }}>
                          +{candidate.skills.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: "0.875rem" }}>{formatDate(candidate.created_at)}</span>
                  </td>
                  <td style={{ paddingRight: "2rem" }}>
                    <Link className="table-link" to={`/candidates/${candidate.id}`}>
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination-row surface-card" style={{ borderRadius: "12px" }}>
        <button
          type="button"
          className="button button-secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.25rem" }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Previous
        </button>
        <p className="muted" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Showing page <span style={{ color: "var(--slate-900)" }}>{page}</span> of <span style={{ color: "var(--slate-900)" }}>{totalPages}</span>
        </p>
        <button
          type="button"
          className="button button-secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.25rem" }}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
}

export default CandidatesListPage;
