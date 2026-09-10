import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — RM" }, { name: "description", content: "Sign in to the RM dashboard." }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/local-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "login_failed");
      window.location.href = "/servers";
    } catch (e) {
      setError(e instanceof Error && e.message === "invalid_credentials" ? "Email or password is incorrect." : "Sign-in is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen overflow-hidden bg-[#07070a] px-4 py-8 text-white sm:px-6"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,.12),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(90,30,30,.1),transparent_30%)]" /><div className="relative mx-auto flex min-h-[88vh] max-w-lg items-center justify-center"><div className="w-full rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_120px_-55px_rgba(239,68,68,.4)] backdrop-blur-2xl sm:p-8"><Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" />Back home</Link><div className="mt-8"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 ring-1 ring-red-400/20"><ShieldCheck className="h-7 w-7 text-red-300" /></div><h1 className="mt-6 text-3xl font-black tracking-tight">Welcome back</h1><p className="mt-2 text-sm leading-6 text-zinc-400">Sign in with the RM account you created through Discord verification.</p></div><form onSubmit={submit} className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Email</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-400/40" /></div></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Password</span><div className="relative"><KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-400/40" /></div></label>{error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3.5 text-sm font-black shadow-lg shadow-red-950/30 transition hover:bg-red-400 disabled:opacity-60"><LogIn className="h-4 w-4" />{busy ? "Signing in…" : "Sign in"}</button></form><div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs leading-5 text-zinc-500">New here? Run <span className="font-mono text-zinc-300">/verify</span> in your Discord server to get your secure signup link.</p><Link to="/verify" className="mt-2 inline-block text-sm font-bold text-red-300 hover:text-red-200">Open verification page</Link></div></div></div></main>;
}
