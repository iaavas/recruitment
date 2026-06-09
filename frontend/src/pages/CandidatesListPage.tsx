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
    <section className="reveal-up">
      <div className="panel-head surface-card">
        <div>
          <p className="eyebrow">Candidates</p>
          <h1>Hiring pipeline</h1>
        </div>
        <p className="muted">{total} total profiles</p>
      </div>

      <div className="filters-grid surface-card">
        <input
          className="input"
          value={filters.keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          placeholder="Search name, email, role"
        />
        <input
          className="input"
          value={filters.role_applied}
          onChange={(e) => handleFilterChange("role_applied", e.target.value)}
          placeholder="Role applied"
        />
        <input
          className="input"
          value={filters.skill}
          onChange={(e) => handleFilterChange("skill", e.target.value)}
          placeholder="Skill"
        />
        <select
          className="input"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <p className="muted">Loading candidates...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!loading && !error ? (
        <div className="candidate-grid">
          {items.map((candidate) => (
            <article key={candidate.id} className="candidate-card surface-card">
              <div className="card-head">
                <h3>{candidate.name}</h3>
                <span className="status-pill">{candidate.status}</span>
              </div>
              <p className="muted">{candidate.email}</p>
              <p>{candidate.role_applied}</p>
              <div className="skill-row">
                {(candidate.skills || []).slice(0, 3).map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
              <Link
                className="button button-secondary inline-link"
                to={`/candidates/${candidate.id}`}
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      <div className="pagination-row surface-card">
        <button
          type="button"
          className="button button-secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <p className="muted">
          Page {page} of {totalPages}
        </p>
        <button
          type="button"
          className="button button-secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default CandidatesListPage;
