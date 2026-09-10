import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, Mail, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/verify")({ component: VerifyPage });

function VerifyPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const challenge = params.get("challenge") ?? "";
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/verify/request-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId: challenge, email, username, avatar, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to start verification");
      setSent(true);
    } catch (e) {
      const code = e instanceof Error ? e.message : "unknown";
      const messages: Record<string, string> = {
        EMAIL_IN_USE: "That email already has an RM account.",
        USERNAME_IN_USE: "That username is already taken.",
        INVALID_EMAIL: "Enter a valid email address.",
        INVALID_USERNAME: "Username must be at least 3 characters.",
        WEAK_PASSWORD: "Password must be at least 8 characters.",
        VERIFY_LINK_EXPIRED: "This Discord verification link expired. Run rm!verify again.",
      };
      setError(messages[code] || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) {
    return (
      <VerifyShell>
        <div className="space-y-4 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="text-2xl font-black">Verification link incomplete</h1>
          <p className="text-zinc-400">Run <span className="font-mono text-zinc-200">rm!verify</span> or <span className="font-mono text-zinc-200">rm?verify</span> in your Discord server and open the verification button.</p>
          <Link to="/login" className="inline-flex rounded-2xl bg-red-500 px-5 py-3 font-bold">Go to login</Link>
        </div>
      </VerifyShell>
    );
  }

  if (sent) {
    return (
      <VerifyShell>
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
            <Mail className="h-7 w-7 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">One last step</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Check your inbox</h1>
            <p className="mt-3 text-zinc-400">We sent a verification link to <strong className="text-zinc-200">{email}</strong>. Open it to finish creating your account.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-zinc-400">The link expires in 30 minutes. Your account is created after the email link is opened.</div>
        </div>
      </VerifyShell>
    );
  }

  return (
    <VerifyShell>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">Discord verified</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Finish your RM account</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Enter your email, then choose your RM username, password and optional profile picture.</p>
        </div>

        <Field label="Email address">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username">
            <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="itzmnyzz" maxLength={24} />
          </Field>
          <Field label="Profile picture URL">
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Optional" maxLength={500} />
          </Field>
        </div>

        <Field label="Password">
          <div className="relative">
            <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="pr-12" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-zinc-500 hover:text-zinc-200">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3.5 font-black shadow-[0_16px_50px_-20px_rgba(239,68,68,.8)] transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-60">
          <Sparkles className="h-4 w-4" />
          {busy ? "Sending verification…" : "Create account & email me"}
        </button>

        <p className="text-center text-xs text-zinc-500">Already have an account? <Link to="/login" className="text-zinc-300 hover:text-white">Sign in</Link></p>
      </form>
    </VerifyShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</span>{children}</label>;
}

function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07070a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(120,35,35,.09),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <section className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_120px_-50px_rgba(239,68,68,.35)] backdrop-blur-2xl sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-500/10 ring-1 ring-red-400/20"><CheckCircle2 className="h-5 w-5 text-red-300" /></div>
            <div><div className="font-black">RM</div><div className="text-xs text-zinc-500">Secure account center</div></div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
