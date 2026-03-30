"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!token) {
    return <p className="text-red-500">Invalid reset link. Please request a new one.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {done ? (
        <div className="text-green-600 text-center">Password updated! Redirecting to login...</div>
      ) : (
        <>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (min 8 chars)</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-amber-400 pr-12"
              />
              <button type="button" onClick={() => setShowPw(x => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Reset Password
          </button>
        </>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl shadow-lg mb-3">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        </div>
        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
