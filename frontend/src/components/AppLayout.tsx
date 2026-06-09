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
      <header className="app-header surface-card">
        <div>
          <Link to="/candidates" className="brand-mark">
            TechKraft ATS
          </Link>
          <p className="muted">Recruitment workspace</p>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/candidates" className="nav-pill">
            Candidates
          </NavLink>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="app-footer muted">
        Signed in as <strong>{user?.email ?? "Unknown user"}</strong>
      </footer>
    </div>
  );
}

export default AppLayout;
