import { X } from "lucide-react";
import { useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const tabs = ["login", "register"];

function getErrorMessage(error, fallback) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === "ERR_NETWORK") {
    return "API is not reachable. Start the backend server on port 5000 and try again.";
  }

  return fallback;
}

export default function AuthPanel() {
  const [activeTab, setActiveTab] = useState("login");
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  return (
    <>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="py-8">
          <h2 className="max-w-3xl text-4xl font-bold tracking-normal text-white sm:text-5xl">
            Find a Counter-Strike stack before the queue goes cold.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Register, post the exact time you want to play, and let other players join your lobby.
          </p>
        </div>

        <div className="rounded border border-slate-700 bg-[#101820] p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 grid grid-cols-2 rounded bg-[#0b1014] p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`rounded px-3 py-2 text-sm font-semibold capitalize ${
                  activeTab === tab ? "bg-emerald-500 text-[#071013]" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "login" && <LoginForm onForgotPassword={() => setIsForgotOpen(true)} />}
          {activeTab === "register" && <RegisterForm />}
        </div>
      </section>

      {isForgotOpen && <ForgotPasswordModal onClose={() => setIsForgotOpen(false)} />}
    </>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded border border-slate-700 bg-[#0b1014] px-3 py-3 text-sm outline-none transition focus:border-emerald-400"
        {...props}
      />
    </label>
  );
}

function FormMessage({ message, error }) {
  if (!message && !error) return null;
  return <p className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>{error || message}</p>;
}

function LoginForm({ onForgotPassword }) {
  const { login } = useAuth();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [status, setStatus] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({});

    try {
      await login(values);
    } catch (error) {
      setStatus({ error: getErrorMessage(error, "Login failed") });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label="Username or email"
        value={values.identifier}
        onChange={(event) => setValues({ ...values, identifier: event.target.value })}
        required
      />
      <Field
        label="Password"
        type="password"
        value={values.password}
        onChange={(event) => setValues({ ...values, password: event.target.value })}
        required
      />
      <div className="flex justify-end">
        <button
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          onClick={onForgotPassword}
          type="button"
        >
          Forgot password?
        </button>
      </div>
      <FormMessage {...status} />
      <button className="w-full rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400">
        Log in
      </button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({});

    try {
      const data = await register(values);
      setStatus({ message: data.message });
    } catch (error) {
      setStatus({ error: getErrorMessage(error, "Registration failed") });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label="Username"
        value={values.username}
        onChange={(event) => setValues({ ...values, username: event.target.value })}
        minLength={3}
        required
      />
      <Field
        label="Email"
        type="email"
        value={values.email}
        onChange={(event) => setValues({ ...values, email: event.target.value })}
        required
      />
      <Field
        label="Password"
        type="password"
        value={values.password}
        onChange={(event) => setValues({ ...values, password: event.target.value })}
        minLength={8}
        required
      />
      <FormMessage {...status} />
      <button className="w-full rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400">
        Create account
      </button>
    </form>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({});
    setIsSubmitting(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setStatus({ message: data.message });
    } catch (error) {
      setStatus({ error: getErrorMessage(error, "Could not send reset email") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded border border-slate-700 bg-[#101820] p-5 shadow-2xl shadow-black/50">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-normal text-white">Reset password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter the email connected to your account and we will send a reset link.
            </p>
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <FormMessage {...status} />
          <button
            className="w-full rounded bg-emerald-500 px-4 py-3 font-bold text-[#071013] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
