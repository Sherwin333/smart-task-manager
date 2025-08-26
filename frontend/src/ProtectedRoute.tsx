// src/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
export default function ProtectedRoute() {
  return localStorage.getItem("token") ? <Outlet /> : <Navigate to="/login" replace />;
}
