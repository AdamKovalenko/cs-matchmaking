import { useEffect, useState } from "react";
import { Crosshair, LogOut, ShieldCheck } from "lucide-react";
import AuthPanel from "./components/AuthPanel.jsx";
import Dashboard from "./components/Dashboard.jsx";
import api from "./services/api.js";
import { useAuth } from "./contexts/AuthContext.jsx";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    const match = window.location.pathname.match(/^\/verify-email\/(.+)$/);

    if (!match) return;

    api
      .get(`/auth/verify-email/${match[1]}`)
      .then((response) => setVerificationMessage(response.data.message || "Email verified. You can log in now."))
      .catch((error) =>
        setVerificationMessage(error.response?.data?.message || "Email verification failed.")
      )
      .finally(() => window.history.replaceState({}, "", "/"));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100">
      <header className="border-b border-emerald-500/20 bg-[#101820]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-emerald-500 text-[#071013]">
              <Crosshair size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-normal">CS Matchmaking</h1>
              <p className="text-sm text-slate-400">Schedule squads. Join cleanly. Play on time.</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 sm:flex">
                <ShieldCheck size={16} className="text-emerald-400" />
                {user.username}
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                onClick={logout}
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {verificationMessage && (
          <div className="mb-6 rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {verificationMessage}
          </div>
        )}
        {isAuthenticated ? <Dashboard /> : <AuthPanel />}
      </main>
    </div>
  );
}
