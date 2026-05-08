"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--brand-green-pale)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-1">
          <span
            className="text-3xl font-semibold capitalize"
            style={{ color: "var(--brand-green)", fontFamily: "Poppins, var(--font-sans)" }}
          >
            MyTereka
          </span>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="finwise-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="finwise-input"
            />
          </div>

          <button
            type="submit"
            className="mt-2 flex h-[45px] w-full items-center justify-center rounded-full font-semibold capitalize transition hover:opacity-80 active:scale-[0.98]"
            style={{
              background: "var(--brand-dark)",
              color: "var(--brand-green-pale)",
              fontFamily: "Poppins, var(--font-sans)",
            }}
          >
            Log In
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Demo user */}
        <button
          onClick={() => router.push("/")}
          className="flex h-[45px] w-full items-center justify-center rounded-full font-semibold capitalize transition hover:opacity-80 active:scale-[0.98]"
          style={{
            background: "var(--brand-yellow)",
            color: "var(--brand-dark-mid)",
            fontFamily: "Poppins, var(--font-sans)",
          }}
        >
          Continue as Demo User
        </button>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link
            href="/auth/forgot-password"
            className="font-semibold transition hover:opacity-70"
            style={{ color: "var(--brand-dark-text)", fontFamily: "League Spartan, var(--font-sans)" }}
          >
            Forgot Password?
          </Link>
          <span style={{ color: "var(--muted-foreground)" }}>
            No account?{" "}
            <Link href="/auth/register" className="font-semibold" style={{ color: "var(--brand-green)" }}>
              Sign Up
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
