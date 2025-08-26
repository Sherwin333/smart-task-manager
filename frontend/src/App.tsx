import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Board from "./pages/BoardPage";

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ marginBottom: 12 }}>
        <Link to="/">Board</Link> | <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Board />} />
      </Routes>
    </div>
  );
}
