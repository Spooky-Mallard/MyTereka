"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    router.push("/");
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      {/* Background decorative blobs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full"
        style={{ background: "rgba(0,184,148,0.08)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full"
        style={{ background: "rgba(245,158,11,0.06)", filter: "blur(50px)" }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 24px rgba(0,184,148,0.35)" }}
          >
            <img src="/logo.svg" alt="MyTereka" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1
              className="text-center text-2xl font-bold"
              style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="mt-1 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Sign in to your MyTereka account
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="mytereka-input"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="mytereka-input pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium transition hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-1 flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 4px 16px rgba(0,184,148,0.35)",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Log In
          </button>
        </form>

        {/* Biometric */}
        <button
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-alt)" }}
        >
          <Fingerprint size={18} style={{ color: "var(--primary)" }} />
          Sign in with Fingerprint
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Demo */}
        <button
          onClick={() => router.push("/")}
          className="flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "var(--warning)",
            color: "#1c1917",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Continue as Demo User
        </button>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          No account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold transition hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
