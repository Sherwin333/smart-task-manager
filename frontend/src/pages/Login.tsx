import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post<{ token: string }>("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate(from, { replace: true }); // go back to intended page (or "/")
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "6rem auto", padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16 }}>Sign in</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="username"
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          autoComplete="current-password"
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        />
        {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ padding: "8px 14px", border: "none", borderRadius: 8, cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
}
