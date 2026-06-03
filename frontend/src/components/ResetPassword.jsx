import { useState } from "react";
import api from "../services/api.js";

export default function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({});

    if (password !== confirmPassword) {
      setStatus({ error: "Passwords do not match" });
      return;
    }

    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setStatus({ message: "Password updated. You can log in now." });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus({ error: error.response?.data?.message || "Could not reset password" });
    }
  }

  return (
    <section className="mx-auto max-w-md rounded border border-slate-700 bg-[#101820] p-5 shadow-2xl shadow-black/30">
      <h2 className="text-2xl font-bold tracking-normal text-white">Reset password</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Choose a new password for your CS Matchmaking account.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">New password</span>
          <input
            className="w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none transition focus:border-emerald-400"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Confirm password</span>
          <input
            className="w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none transition focus:border-emerald-400"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {(status.message || status.error) && (
          <p className={`text-sm ${status.error ? "text-red-300" : "text-emerald-300"}`}>
            {status.error || status.message}
          </p>
        )}

        <div className="flex gap-3">
          <button className="flex-1 rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400">
            Update password
          </button>
          <button
            className="rounded border border-slate-700 px-4 py-3 font-bold text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            onClick={onDone}
            type="button"
          >
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
