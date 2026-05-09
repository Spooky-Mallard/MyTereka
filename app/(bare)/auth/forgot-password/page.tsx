"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

type Step = "email" | "otp" | "newpwd";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("email");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [newPwd, setNewPwd]   = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError]     = useState("");

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setError("");
    setStep("otp");
  }

  function handleOtpInput(val: string, idx: number) {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.some((d) => !d)) { setError("Enter all 6 digits"); return; }
    setError("");
    setStep("newpwd");
  }

  function handlePwdSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) { setError("Min 8 characters"); return; }
    if (newPwd !== confirmPwd) { setError("Passwords don't match"); return; }
    router.push("/auth/login");
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
      >
        <Link
          href="/auth/login"
          className="mb-6 flex items-center gap-2 text-sm font-medium transition hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <>
            <h1
              className="mb-1 text-xl font-bold"
              style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
            >
              Reset password
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Enter your email and we&apos;ll send a 6-digit OTP code.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="mytereka-input"
                />
              </div>
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 16px rgba(0,184,148,0.35)", fontFamily: "Poppins, sans-serif" }}
              >
                Send OTP
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <>
            <h1
              className="mb-1 text-xl font-bold"
              style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
            >
              Enter OTP
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
              We sent a 6-digit code to <strong style={{ color: "var(--foreground)" }}>{email}</strong>. Expires in 10 minutes.
            </p>
            <form className="flex flex-col gap-6" onSubmit={handleOtpSubmit}>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => { handleOtpInput(e.target.value, i); setError(""); }}
                    className="h-14 w-12 rounded-xl text-center text-xl font-bold"
                    style={{
                      background: "var(--surface-alt)",
                      border: `1.5px solid ${digit ? "var(--primary)" : "var(--border)"}`,
                      color: "var(--foreground)",
                    }}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 16px rgba(0,184,148,0.35)", fontFamily: "Poppins, sans-serif" }}
              >
                Verify OTP
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === "newpwd" && (
          <>
            <h1
              className="mb-1 text-xl font-bold"
              style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
            >
              New password
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Choose a strong password for your account.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handlePwdSubmit}>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>New password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPwd}
                  onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
                  className="mytereka-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Confirm password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPwd}
                  onChange={(e) => { setConfirmPwd(e.target.value); setError(""); }}
                  className="mytereka-input"
                />
              </div>
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 16px rgba(0,184,148,0.35)", fontFamily: "Poppins, sans-serif" }}
              >
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
