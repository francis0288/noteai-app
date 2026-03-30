"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => { setError(null); setSuccess(null); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password."); return; }
    router.push("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    // Auto-login after registration
    const login = await signIn("credentials", { email, password, redirect: false });
    if (login?.error) { setMode("login"); setSuccess("Account created. Please log in."); return; }
    router.push("/");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSuccess("If that email is registered, a reset link has been sent. Check the server console in dev mode.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 rounded-2xl shadow-lg mb-3">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NoteAI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your AI-powered notebook</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => { setMode("login"); reset(); }}
              className={`pb-3 px-4 text-base font-medium transition-colors border-b-2 -mb-px ${
                mode === "login" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >Log In</button>
            <button
              onClick={() => { setMode("register"); reset(); }}
              className={`pb-3 px-4 text-base font-medium transition-colors border-b-2 -mb-px ${
                mode === "register" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >Sign Up</button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-xl">
              {success}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <PasswordField label="Password" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(x => !x)} />
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base">
                {loading && <Loader2 size={18} className="animate-spin" />}
                Log In
              </button>
              <button type="button" onClick={() => { setMode("forgot"); reset(); }}
                className="w-full text-center text-sm text-amber-600 hover:underline">
                Forgot password?
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Name (optional)" value={name} onChange={setName} type="text" placeholder="Your name" />
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <PasswordField label="Password (min 8 chars)" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(x => !x)} />
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base">
                {loading && <Loader2 size={18} className="animate-spin" />}
                Create Account
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we&apos;ll send you a password reset link.</p>
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base">
                {loading && <Loader2 size={18} className="animate-spin" />}
                Send Reset Link
              </button>
              <button type="button" onClick={() => { setMode("login"); reset(); }}
                className="w-full text-center text-sm text-amber-600 hover:underline">
                Back to log in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type: string; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={type !== "text" || label.includes("optional") === false}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} required
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-12"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
