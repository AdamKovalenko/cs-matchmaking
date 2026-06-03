import { CalendarDays, Plus, Trash2, UserMinus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState({});
  const [form, setForm] = useState({
    date: "",
    time: "",
    mode: "Competitive",
    skillLevel: "",
    description: ""
  });

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data } = await api.get("/sessions");
    setSessions(data);
  }

  async function createSession(event) {
    event.preventDefault();
    setStatus({});

    try {
      const startsAt = new Date(`${form.date}T${form.time}`).toISOString();
      const { data } = await api.post("/sessions", { ...form, startsAt });
      setSessions((current) => [...current, data].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
      setForm({ date: "", time: "", mode: "Competitive", skillLevel: "", description: "" });
      setStatus({ message: "Session posted." });
    } catch (error) {
      setStatus({ error: error.response?.data?.message || "Could not create session" });
    }
  }

  async function joinSession(sessionId) {
    setStatus({});

    try {
      const { data } = await api.post(`/sessions/${sessionId}/join`);
      setSessions((current) => current.map((session) => (session._id === data._id ? data : session)));
    } catch (error) {
      setStatus({ error: error.response?.data?.message || "Could not join session" });
    }
  }

  async function leaveSession(sessionId) {
    setStatus({});

    try {
      const { data } = await api.post(`/sessions/${sessionId}/leave`);
      setSessions((current) => current.map((session) => (session._id === data._id ? data : session)));
    } catch (error) {
      setStatus({ error: error.response?.data?.message || "Could not leave session" });
    }
  }

  async function cancelSession(sessionId) {
    setStatus({});

    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session._id !== sessionId));
    } catch (error) {
      setStatus({ error: error.response?.data?.message || "Could not cancel session" });
    }
  }

  const groupedSessions = useMemo(() => {
    return sessions.reduce((groups, session) => {
      const key = new Date(session.startsAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
      });
      groups[key] = [...(groups[key] || []), session];
      return groups;
    }, {});
  }, [sessions]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded border border-slate-700 bg-[#101820] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded bg-emerald-500 text-[#071013]">
            <Plus size={18} />
          </div>
          <h2 className="text-lg font-bold">Create session</h2>
        </div>

        <form className="space-y-4" onSubmit={createSession}>
          <Input label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <Input label="Time" type="time" value={form.time} onChange={(value) => setForm({ ...form, time: value })} />
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Mode</span>
            <select
              className="w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none focus:border-emerald-400"
              value={form.mode}
              onChange={(event) => setForm({ ...form, mode: event.target.value })}
            >
              <option>Competitive</option>
              <option>Premier</option>
              <option>Casual</option>
              <option>Wingman</option>
              <option>Deathmatch</option>
            </select>
          </label>
          <Input
            label="Skill level"
            placeholder="Faceit 7, MG2, new player..."
            value={form.skillLevel}
            onChange={(value) => setForm({ ...form, skillLevel: value })}
          />
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Description</span>
            <textarea
              className="min-h-28 w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none focus:border-emerald-400"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Need two for Mirage/Ancient, voice comms preferred."
              required
            />
          </label>

          {(status.message || status.error) && (
            <p className={`text-sm ${status.error ? "text-red-300" : "text-emerald-300"}`}>
              {status.error || status.message}
            </p>
          )}

          <button className="w-full rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400">
            Post session
          </button>
        </form>
      </aside>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-emerald-400" size={24} />
            <h2 className="text-2xl font-bold">Upcoming sessions</h2>
          </div>
          <span className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300">
            {sessions.length} scheduled
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded border border-dashed border-slate-700 p-10 text-center text-slate-400">
            No sessions yet. Be the first to put a stack on the calendar.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([day, daySessions]) => (
              <div key={day}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-normal text-emerald-300">{day}</h3>
                <div className="space-y-3">
                  {daySessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      currentUser={user}
                      onCancel={cancelSession}
                      onJoin={joinSession}
                      onLeave={leaveSession}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Input({ label, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        className="w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        required={props.type === "date" || props.type === "time"}
        {...props}
      />
    </label>
  );
}

function getUserId(user) {
  return user?._id || user?.id;
}

function SessionCard({ session, currentUser, onCancel, onJoin, onLeave }) {
  const startsAt = new Date(session.startsAt);
  const currentUserId = getUserId(currentUser);
  const hostId = getUserId(session.host);
  const isHost = hostId === currentUserId;
  const joined = session.players.some((player) => getUserId(player) === currentUserId);

  return (
    <article className="rounded border border-slate-700 bg-[#101820] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-[#071013]">{session.mode}</span>
            {session.skillLevel && (
              <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
                {session.skillLevel}
              </span>
            )}
          </div>
          <h4 className="mt-3 text-xl font-bold">{startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</h4>
          <p className="mt-2 max-w-2xl text-slate-300">{session.description}</p>
          <p className="mt-3 text-sm text-slate-500">Hosted by {session.host.username}</p>
        </div>

        {isHost ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded border border-red-400/50 px-4 py-3 font-bold text-red-200 hover:bg-red-500/10"
            onClick={() => onCancel(session._id)}
          >
            <Trash2 size={16} />
            Cancel
          </button>
        ) : joined ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded border border-amber-400/50 px-4 py-3 font-bold text-amber-200 hover:bg-amber-500/10"
            onClick={() => onLeave(session._id)}
          >
            <UserMinus size={16} />
            Leave
          </button>
        ) : (
          <button
            className="rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400"
            onClick={() => onJoin(session._id)}
          >
            Join
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-slate-700 pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Users size={16} className="text-emerald-400" />
          Players
        </div>
        <div className="flex flex-wrap gap-2">
          {session.players.map((player) => (
            <span key={getUserId(player)} className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {player.username}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
