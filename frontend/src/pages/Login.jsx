import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BRAND } from "../lib/brand";

export default function Login() {
  const [sp] = useSearchParams();
  const error = sp.get("error");
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.is_admin) navigate("/admin");
  }, [user, navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div data-testid="login-page" className="min-h-screen pt-24 pb-16 flex items-center justify-center px-5">
      <div className="w-full max-w-md border border-ink bg-ink-surface p-8 md:p-10 relative crop-marks">
        <div className="flex items-center gap-3 mb-6">
          <img src={BRAND.assets.circular} alt="Aiel" className="h-12 w-12 rounded-full" />
          <div>
            <div className="font-display text-xl tracking-wider">AIEL ADMIN</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">Studio Dashboard</div>
          </div>
        </div>
        <h1 className="font-display text-4xl uppercase leading-[0.95]">
          Sign in to <span className="text-cmyk-magenta">manage</span> your shop.
        </h1>
        <p className="text-sm text-white/60 mt-3">
          Only the registered studio Gmail can access products, gallery, orders & enquiries.
        </p>

        {error && (
          <div data-testid="login-error" className="mt-4 border border-cmyk-magenta/60 text-cmyk-magenta text-xs px-3 py-2 uppercase tracking-wider">
            Sign-in failed. Please try again.
          </div>
        )}

        <button
          data-testid="google-login-btn"
          onClick={handleLogin}
          className="mt-8 w-full bg-cmyk-yellow text-black font-bold py-3 uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-white"
        >
          <LogIn size={18} /> Continue with Google
        </button>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
          <Shield size={12} /> Secured by Emergent OAuth
        </div>
      </div>
    </div>
  );
}
