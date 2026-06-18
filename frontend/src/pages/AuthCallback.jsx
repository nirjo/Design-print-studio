import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login");
      return;
    }
    const session_id = decodeURIComponent(match[1]);

    (async () => {
      try {
        const { data } = await axios.post(`${API}/auth/session`, { session_id }, { withCredentials: true });
        setUser(data);
        // strip the hash and go to admin
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate(data.is_admin ? "/admin" : "/", { state: { user: data } });
      } catch (e) {
        navigate("/login?error=session");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div data-testid="auth-callback" className="min-h-screen flex items-center justify-center text-white/70">
      <div className="text-center">
        <div className="font-display text-3xl mb-3">SIGNING YOU IN…</div>
        <div className="text-xs uppercase tracking-[0.25em] text-cmyk-yellow">Verifying with Google</div>
      </div>
    </div>
  );
}
