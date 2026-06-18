import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div data-testid="auth-loading" className="min-h-screen flex items-center justify-center text-white/60">
        <div className="font-display text-2xl tracking-wider">CHECKING ACCESS…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !user.is_admin) {
    return (
      <div data-testid="not-admin" className="min-h-screen flex items-center justify-center text-center px-5">
        <div>
          <div className="font-display text-5xl uppercase">Access <span className="text-cmyk-magenta">Denied</span></div>
          <p className="text-white/60 mt-3 text-sm">Only the registered studio account can access the admin panel.</p>
        </div>
      </div>
    );
  }
  return children;
}
