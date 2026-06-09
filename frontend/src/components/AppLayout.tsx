import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <header className="app-header surface-card" style={{ borderRadius: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%)",
            color: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <Link to="/candidates" className="brand-mark" style={{ lineHeight: 1.1 }}>
              TechKraft ATS
            </Link>
            <p className="muted" style={{ fontSize: "0.75rem", margin: 0, fontWeight: 500 }}>Recruitment Workspace</p>
          </div>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/candidates" className="nav-pill">
            Candidates
          </NavLink>
          
          <div style={{ height: "24px", width: "1px", background: "var(--slate-200)", margin: "0 0.25rem" }}></div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="header-user-badge">
            <span className="muted small" style={{ fontWeight: 500 }}>{user?.email}</span>
            {user?.roles?.map((role) => (
              <span key={role} style={{
                fontSize: "0.7rem",
                backgroundColor: "var(--brand-light)",
                color: "var(--brand-700)",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.02em"
              }}>
                {role}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={handleLogout}
            style={{ padding: "0.45rem 1rem", fontSize: "0.9rem", height: "36px" }}
          >
            Sign out
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="app-footer muted" style={{ fontSize: "0.8rem", marginTop: "3rem" }}>
        &copy; {new Date().getFullYear()} TechKraft ATS. All rights reserved.
      </footer>
    </div>
  );
}

export default AppLayout;
