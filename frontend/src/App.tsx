// src/App.tsx
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import BoardPage from "./pages/BoardPage";
import ProtectedRoute from "./ProtectedRoute";

function Nav() {
  const navigate = useNavigate();
  const loggedIn = Boolean(localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <Link to="/" className="nav-link">
          Board
        </Link>
        <Link to="/login" className="nav-link">
          Login
        </Link>
      </div>
      {loggedIn && (
        <button onClick={logout} className="btn small">
          Logout
        </button>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Nav />

      {/* Main content */}
      <main className="app-main">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<BoardPage />} />
          </Route>
        </Routes>
      </main>

      {/* Fixed footer */}
      <footer className="footer-fixed">
        Built by <strong>&nbsp;Sherwin D’Souza</strong>
      </footer>
    </div>
  );
}
