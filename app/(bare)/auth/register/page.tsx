"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const UG_MOBILE_RE = /^256[0-9]{9}$/;

function Field({
  label, children, error,
}: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [mobile,   setMobile]   = useState("");
  const [dob,      setDob]      = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())            e.name     = "Full name required";
    if (!email.includes("@"))    e.email    = "Enter a valid email";
    if (!UG_MOBILE_RE.test(mobile))
      e.mobile = "Format: 256XXXXXXXXX (Uganda)";
    if (!dob)                    e.dob      = "Date of birth required";
    if (password.length < 8)     e.password = "Min 8 characters";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    router.push("/onboarding");
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-start overflow-y-auto px-6 py-10"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 6px 20px rgba(0,184,148,0.35)" }}
          >
            <img src="/logo.svg" alt="MyTereka" className="h-9 w-9 object-contain" />
          </div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            Create your account
          </h1>
          <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
            Join thousands of Ugandan youth managing money smarter
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Full name" error={errors.name}>
            <input
              type="text"
              placeholder="Atong Precious Olanya"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((err) => ({ ...err, name: "" })); }}
              className={`mytereka-input${errors.name ? " error" : ""}`}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((err) => ({ ...err, email: "" })); }}
              className={`mytereka-input${errors.email ? " error" : ""}`}
            />
          </Field>

          <Field label="Mobile number" error={errors.mobile}>
            <input
              type="tel"
              placeholder="256701234567"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value); setErrors((err) => ({ ...err, mobile: "" })); }}
              className={`mytereka-input${errors.mobile ? " error" : ""}`}
            />
            {!errors.mobile && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                MTN or Airtel format: 256XXXXXXXXX
              </p>
            )}
          </Field>

          <Field label="Date of birth" error={errors.dob}>
            <input
              type="date"
              value={dob}
              onChange={(e) => { setDob(e.target.value); setErrors((err) => ({ ...err, dob: "" })); }}
              className={`mytereka-input${errors.dob ? " error" : ""}`}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((err) => ({ ...err, password: "" })); }}
                className={`mytereka-input pr-12${errors.password ? " error" : ""}`}
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
          </Field>

          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 4px 16px rgba(0,184,148,0.35)",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Create Account
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
